"use strict";
var Promise = require("bluebird"),
  Sugar = require('sugar'),
  DNSUtils = require('./DNSUtils'),
  dns = new DNSUtils(),
  PouchDB = require('pouchdb'),
  db = new PouchDB(randString()+'db', {db : require('memdown')}),
  Namecoin = require("namecoin"),
  nmc = new Namecoin.Client({
    host: 'localhost',
    port: 8336,
    user: 'user',
    pass: 'pass'
  });

var DEBUG = false, verify = false;
process.argv.forEach(function(val){
  if (val.endsWith('debug')){
    DEBUG = true;
  } else if (val.endsWith('verify')){
    verify = true;
  }
});

var winston = require('winston');
winston.add(winston.transports.File, {
  filename        : 'nmc2couch.log',
  handleExceptions: !DEBUG
});


nmcExport();

function nmcExport(tries){
  tries = tries || 0;
  var date = new Date(Date.now());

  Promise.all([getBlockCount(),bulkFetch(),getBlockCount()]).spread(function(pre, names, post) {
    if (pre === post) {
      update(prepNames(names, pre, date));
    } else if(tries < 5) {
      if (DEBUG) winston.info("pre/post block count mismatch " + (tries + 1));
      nmcExport(tries + 1);
    } else {
      throw "Could not get pre/post blockcount after 5 tries : (";
    }
  });
}

function bulkFetch(){
  return new Promise(function(resolve,reject) {
    var blocks = 100;
    if (verify) {
      blocks = 36000;
    }

    nmc.nameFilter("", blocks, 0, 0, function (err, names) {
      if (!err) {
        if (DEBUG) winston.info("Got " + names.length + " names from Namecoind!");
        resolve(names);
      } else {
        reject(err);
      }
    })
  });
}

function getBlockCount(){

  //Promisify wasn't working...
  return new Promise(function(resolve,reject) {
    nmc.getBlockCount(function (err, count) {
      if (!err) {
        resolve(count);
      } else {
        reject(err);
      }
    });

  });
}

function prepNames(names, blockcount, date) {
  var regex = /(^.*(?=\/))(.*)/;

  for (var i = 0, len = names.length; i < len; i++) {
    var obj = names[i];


    //setup couch URI
    obj._id = encodeURI(obj.name);


    //fix expires
    var d = new Date(Date.parse(date.toJSON()));
    d.setHours(d.getHours() + (obj.expires_in / 6));

    obj.expires = {};
    obj.expires.blocks = blockcount + obj.expires_in;
    obj.expires.date = d.toJSON();
    delete obj.expires_in;

    //fix naming and namespace
    try {
      var matches = regex.exec(obj.name);
      obj.namespace = matches[1];
      obj.name = matches[2].slice(1);
    } catch (e) {
      obj.error = true;
    }

    //parse
    try {
      obj.value = JSON.parse(obj.value);
    } catch (e) {
      obj.value = obj.value.trim();
      obj.error = true;
    }

  }
  return names;
}


function update(records) {

  var docs = spx(records);

  if (DEBUG) winston.info("Processed " + docs.length + " names!");

  db.bulkDocs(docs).then(function(results) {
    if (DEBUG) winston.info("Attempting to update couchDB ");
    return db.replicate.to('http://localhost:5984/speech');
  }).then(function (response) {
    if (DEBUG) winston.info("Attempting to update couchDB ");
    return db.destroy();
  }).then(function (info) {
    winston.log("Updated Complete");
  }).catch(function (err) {
    winston.error(err);
  })

}

function randString(){
  var text = "TEMP";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for( var i=0; i < 5; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function couchConf() {
  return new Promise(function (resolve, reject) {
    fs.readFile(process.cwd() + '/couchdb-settings.json', 'utf-8', function (err, data) {
      if (!err) {
        if (DEBUG) console.info(path + " found!");
        var c = JSON.parse(data);

        c.host = c.host || "localhost";
        c.port = c.port || 5984;
        c.dbname = c.dbname || "speech";
        c.user = c.user || "nmc";
        c.pass = c.pass || "pass";

        if (c.secure) {
          c.proto = "https";
        } else {
          c.proto = "http";
        }

        resolve(c.proto + '://' + c.user + ':' + c.pass + '@' + c.host + ':' + c.port + '/' + c.dbname);

      } else {
        reject("Failed to find " + path);
        throw err;
      }
    });

  });
}

function spx(docs,nameReject, valueReject) {
  var records = [];
  for (var i = 0, len = docs.length; i < len; i++) {
    var doc = docs[i];


    /*
     * This is a rather convoluted piece of logic due to trying to operate in 3 environments:
     * if !doc.error -> Did nmc2couch.js find an error while trying to parse record?
     * && doc.namespace -> Are you part of the 'd' namespace?
     * && that.validName(doc.name) -> is your name valid for /d?
     *
     * else if(reject) are you being called as part of a unit test?
     * */

    if (!doc.error && doc.namespace === 'd' && dns.validName(doc.name)) {
      var entry = dns.validEntry(doc.value);
      if (entry !== false) {
        records.push({_id:doc.name, name:doc.name, value: {"http": entry}});
      } else if (valueReject && (entry === false)) { //are you being called as part of a unit test?
        valueReject(doc.name + " value rejected: ", doc.value);
      }
    } else if (nameReject && !doc.error && doc.namespace === 'd') { //are you being called as part of a unit test?
      nameReject(doc.name + " name rejected.");
    }
  }
  return records;
}

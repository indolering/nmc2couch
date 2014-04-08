/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';
var cradle = require('cradle');
var Promise = require('es6-promise').Promise;
var fs = require('fs');

var DEBUG = false;
process.argv.forEach(function(val, index, array){
  if (val.endsWith('debug')) DEBUG = true;
});

function couch(client, callback) {


  var db = client;

  var c = this;

  /** Stores responses from nmc.heart.
   *  @var {Object}
   */
  this.pongs = [];

  /** Used to monitor status of Namecoin.
   *  @member {Object}
   */
  this.heart = {
    ping   : function() {
      c.heart.beat(db.get('$lastBlockCount', function(err, doc) {
        if (err) {
          return (err.error === "not_found");
        } else {
          return true;
        }
      }));
    },
    beat   : function(ping) {
      c.pongs.shift(ping);
      c.pongs = c.pongs.slice(0, 300); //removes anything older than 5 minutes
    },
    isAlive: function(depth) {
      depth = depth || 100;  //default HTTP timeout
      return c.pongs.slice(0, depth).indexOf(true) > -1;
    }
  };

  this.getLastBlockCount = function() {
    return new Promise(function(resolve, reject) {
      db.get('$lastBlockCount', function(err, doc) {
        if (!err) {
            resolve(doc.value);
        } else {
          if (err.error === "not_found") {
            resolve(0);
          } else {
            reject(err);
          }
        }
      });
    });
  };

  this.getBlockCount = function() {
    return new Promise(function(resolve, reject) {
      db.get('$lastBlockCount', function(err, doc) {
        if (!err) {
          resolve(doc.value);
        } else {
          if (err.error === "not_found") {
            resolve(0);
          } else {
            reject(err);
          }
        }
      });
    });
  }

  db.get('$lastBlockCount', function(err, doc) {
    if (err) {
      if (err.error === "not_found") {
        setInterval(c.heart.ping, 1000);
        callback(null, c);
      } else {
        callback(err);
      }
    }
  });
}

function initConnection(data) {

  var conf = JSON.parse(data);

  conf.uri = conf.uri || "http://localhost:5984";
  conf.dbname = conf.dbname || "namecoin";

  if (conf.username || conf.password) {
    var auth = {};
    if (conf.username) {
      auth.username = conf.username;
    }
    if (conf.password) {
      auth.password = conf.password;
    }
    return new (cradle.Connection)(conf.uri, {
      'auth'  : auth
    }).database(conf.dbname);
  } else {
    return new (cradle.Connection)(conf.uri).database(conf.dbname);
  }
}

/**
 * Configuration Object.
 * @typedef {Object} config
 * @property {?string} host,
 * @property {?number} port,
 * @property {?string} user,
 * @property {?number} port,
 * @property {?boolean} ssl,
 * @property {?boolean} sslStrict,
 * @property {?function(string): string} sslCa,
 * TODO: fix all this shit, it's just c/p from another file
 * */
/**
 * Initializes connection
 * @param {?config} conf Object with settings.
 * @returns {(Promise.<nmc> | nmc)}
 */
exports.init = function(path, callback) {

  fs.readFile(path, 'utf-8', function(err, data){
    if (!err){
      if (DEBUG) console.info(path + " found!");
      return new couch(initConnection(data), callback);
    } else {
      callback(new Error("Failed to find " + path + " :", err));
    }
  });

};


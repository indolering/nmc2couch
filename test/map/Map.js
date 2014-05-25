'use strict';

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  fs = require('fs'),
  path = require('path'),
  PouchDB = require('pouchdb'),
  Promise = require('bluebird'),
  squatters = fs.readFileSync(path.resolve(__dirname, "values", "bad", 'squatter-addresses.txt')).toString().split("\n"),
  reserved = fs.readFileSync(path.resolve(__dirname, "values", "bad", 'reserved-addresses.txt')).toString().split("\n"),
  badAddresses = squatters.concat(reserved, ["\n"]),
  goodDomains = fs.readFileSync(path.resolve(__dirname, "values", "good", 'good-domains.txt')).toString().split("\n"),
  goodIPs = fs.readFileSync(path.resolve(__dirname, "values", "good", 'good-ips.txt')).toString().split("\n"),
  goodAddresses = goodIPs.concat(goodDomains),
  generator = require(path.resolve(__dirname, "values", 'generator')),
  mapper = require(path.resolve(__dirname, '../../src/', "mapper")),
  map = new mapper.map(),
  goodDocs = require(path.resolve(__dirname, "values", "good", 'examples')),
  badDocs = require(path.resolve(__dirname, "values", "bad", 'examples')),
  levelup = require('levelup'),
  memdown = require('memdown'),
  chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);

describe('Check Name Validation Function', function () {
  var good = [
    "asdf", "asdf0", "asdf-asdf", "abc123456789012345678901234567890123456789012345678901234567890"
  ];

  var bad = [
    "0asdf", "-asdf", "asdf-", "ABCD", "abcd123456789012345678901234567890123456789012345678901234567890"
  ];
  good.forEach(function (name) {
    it(name + " should be a valid name", function () {
      (map.that.validName(name)).should.be.ok;
    })
  });

  bad.forEach(function (name) {
    it(name + " should be an in valid name", function () {
      (map.that.validName(name)).should.not.be.ok;
    })
  });

});

describe('Check Squater Filter', function () {
  squatters.forEach(function (value) {
    it(value + " should match against squatter filter", function () {
      (map.that.squatter(value)).should.be.ok;
    })
  });

  goodAddresses.forEach(function (value) {
    it(value + " should not match against squatter filter", function () {
      (map.that.squatter(value)).should.not.be.ok;
    })
  });
});

describe('checkValue(value) Validation Function', function () {
  badAddresses.forEach(function (value) {
    it(value + " should return false", function () {
      (map.that.checkValue(value)).should.not.be.ok;
    })
  });

  goodAddresses.forEach(function (value) {
    it(value + " should return true", function () {
      (map.that.checkValue(value)).should.be.ok;
    })
  });
});

describe("ValidEntry function check", function () {

  goodDocs.forEach(function (doc) {
    it(doc.name + " should not return false", function () {
      (map.that.validEntry(doc.value)).should.not.be.bad;
    });
  });

  badDocs.forEach(function (doc) {
    it(doc.name + " should return false", function () {
      (map.that.validEntry(doc.value)).should.not.be.ok;
    });
  });

});

describe("Check Mapper function check", function () {

  goodDocs.forEach(function (doc) {
    it(doc.name + " should emit values", function (done) {
      var output = new mapper.map(doc, function (key, value) {
        key.should.equal(doc.name);
        value.hasOwnProperty('http'); //TODO: figure out testing of value;
        done();
      }, function (value) {
        (1).should.equal(0); //if this function runs, shit has gone south!
        (value).should.be.ok;
        done();
      });
    });
  });

  badDocs.forEach(function (doc) {
    it(doc.name + " should not emit values", function (done) {
      var output = new mapper.map(doc, function (key, value) {
        (1).should.equal(0); //if this function runs, shit has gone south!
        done();
      }, function (value) {
        (value === "name" || value === "value" ).should.be.ok;
        done();
      });
    });
  });

});

describe('Check Mapper Using PouchDB', function () {

  var good;
  var bad;

  before(function (done) {


    makePouch("good").then(function (goodResults) {
      good = goodResults;
      return makePouch("bad");
    }).then(function (badResults) {
      bad = badResults;
      return good.db.get("wikileaks");
    }).then(function (wikileaks) {
      console.log(wikileaks);
      done();
    }).catch(function (err) {
      throw err;
      done();
    });
  });


  it("DB with GOOD docs should have ALL of the docs", function () {
    good.count.should.equal(good.docs.length + 1); //+ design document
  });

  it("DB with BAD docs should have NONE of those docs", function () {

    bad.count.should.equal(1);// design document
    if (bad.count !== 1) {
      console.log(bad.count);
      bad.db.query('speech',{reduce:'_count'}, console.log);
    }
  });

});

function makePouch(type){
  var designDoc = {
    _id: '_design/speech',
    views: {
      'speech': {
        "map": map.toString()
      }
    }
  };

  var db;
  var docs;

  return generator.generate(type).then(function (dox) {
      docs = dox;
      return new PouchDB(randName(), {db : require('memdown')
    }).then(function (pouch) {
      db = pouch;
      return db.put(designDoc);
    }).then(function (info) {
      return db.bulkDocs(docs);
    }).then(function (info) {
     // return db.info();
        return  db.query("speech",{reduce:"_count"});
    }).then(function (info) {
      return {"count" : info, "docs" : docs, "db":db};
    })
  })

  function randName(){
    var text = "TEMP";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}


function emit(key, value) {
  return {"key": key, "value": value};
}

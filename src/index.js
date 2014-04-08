/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';
//imports
var fs = require('fs'),
    Promise = require('es6-promise').Promise;



//globals
var namesTotal = 90000,
    scraped = 0,
    batchSize = 100,
    time = Date.now(),
    namesRegex = '^d/[a-z][a-z0-9-]{0,61}[a-z0-9]$';



//setup imports
var sugar = require('sugar');
Object.extend();

var DEBUG = false, verify = false;
//var lastBlockCount = null;
process.argv.forEach(function(val, index, array){
//
//  if (val.startsWith('--block=')) {
//    lastBlockCount = val.split('=')[1].toNumber();  //TODO: move to getLastBlockCount()
//  } else
  if (val.endsWith('debug')){
    DEBUG = true;
  } else if (val.endsWith('verify')){ //TODO: move to getLastBlockCount()
    verify = true;
  }
});

var winston = require('winston');
winston.add(winston.transports.File, {
  filename        : 'nmc2couch.log',
  handleExceptions: !DEBUG
});

var lockFile = require('lockfile');
var lockFreshness = { stale: 3600000 }; //one hour
if (DEBUG){
  lockFreshness.stale = 1;
}

lockFile.lock('nmc2couch.lock', lockFreshness, function(err){ //then this?
  if (!err){
    if (DEBUG) winston.info("lockfile set", {"user": process.getuid()});
    Promise.all([initCouch(),initNamecoin()]).then(function(response){
      console.log("got to promise.all", response);
      //get blocks since lastBlock and blockCount.then(function(count) {
        //update loop
   // })
    }).catch(function(err){
      winston.error(err);
    })

  } else if (DEBUG) winston.error('Could not open lockfile!', err);
});

//   Set last block from CouchDB
//   Connect NMC;
//   Get count since last block.then(){
//    update();
// }
//update().then(){
// update CouchDB of current block
// remove locks
//}
//promise.all(couchdb and namecoin)
// .then(function(Couchdb and Namecoind){
// set nmc;
// set db;
// promise.all(getLastBlock and getBlockCount)
// .then(function(lastBlock, blockCount){
//
// })
//
//
// }
//
//nmc
//

//init CouchDB
var couchdb = require('./libs/couch'), db, lastBlockCount;
function initCouch(){
  return new Promise(function(resolve, reject){
    couchdb.init(process.cwd() + '/couchdb-settings.json', function(err, DB){
      if (err){
        reject(err);
      } else {
        if (DEBUG) winston.info("couchdb initialized");
        db = DB;
        setLastBlockCount(resolve, reject);
      }
    })
  });
}

function setLastBlockCount(resolve, reject){
  db.getLastBlockCount().then(function(count){
    lastBlockCount = count;
    if (DEBUG) winston.info("retrieved last block count: " + count);
    resolve();
  }).catch(function(err){
    reject(err);
  });
}

//init Namecoin
var namecoin = require('./libs/nmc.js/nmc'), blockCount, nmc;
function initNamecoin(){
  return new Promise(function(resolve, reject){
    namecoin.init({"user":"user", "pass":"pass"}, function(err, NMC){
      if (err){
        reject(err);
      } else {
        if (DEBUG) winston.info("Initialized Namecoin:", NMC);
        nmc = NMC;
        setBlockCount(resolve, reject);
      }
    })
  })
}

function setBlockCount(resolve, reject){

}


////get from namecoin
//////clean
////get from CouchDB
//////clean
////Compare
//////If not the same, update


function scrape(n){

  //this is what happens when you mix thenable promises with regular callbacks.
  nmc = n;

  nmc.blockCount().then(function(value){
    blockCount = value;
    db.get('$lastBlockCount', function(err, doc){
      if (err){
        lastBlockCount = blockCount - 36000; //all current blocks
        db.save('$lastBlockCount', {"blocks": blockCount});
      } else {
        if (doc.blocks < 36000){
          lastBlockCount = blockCount - 36000;
        } else {
          lastBlockCount = doc.blocks - 6; //1 "hour" overlap between calls
        }
        db.save('$lastBlockCount', doc._rev, {"blocks": blockCount});
      }

      nmcd.filter({regex: namesRegex, age: blockCount - lastBlockCount, start: 0, max: 0, stat: true})
        .then(function(result){
          namesTotal = result.count;
          nameDump();
        });
    });

  });
}

function expireBlock(expires){
  return blockCount + expires;
}


function nameDump(regex, age, start, max){

  var args = {
    'regex': regex || '^d/[a-z][a-z0-9-]{0,61}[a-z0-9]$',
    'age'  : age || blockCount - lastBlockCount,
    'start': start || scraped,
    'max'  : max || batchSize
  };

  nmcd.filter(args).then(function(names, err){
    if (err){
      console.log(err);
    } else if (names){
      var batch = [];
      while (names.length > 0){
        var record = names.pop();

        if (record && record.value !== ""){
          record = cleanRecord(record);
          batch.push({'_id': record.name, 'value': record.value});
        }

      }
      db.save(batch, function(err, response){
        if (DEBUG && err){
          console.log(err);
        } else {
          console.log(response);
          scraped = scraped + batchSize;
          var temp = Date.now();
          console.log(scraped + " " + Math.round(((temp - time) / 1000)));
          time = temp;

          fixBatchConflicts(response);

          if (namesTotal > scraped){
            nameDump();
          } else {
            if (DEBUG){
              winston.info("finished.");
            }

            lockFile.unlock('nmc2couch.lock', function(er){
              console.log(er);
              if (DEBUG){
                winston.warn(er);
              }

            });
          }
        }
      });
    }

  });
}


function fixBatchConflicts(records){

  if (records.length > 0){
    var record = records.pop();
    if (Object.has(record, 'error') && record.error === 'conflict'){
      update(record.id).then(function(){
        fixBatchConflicts(records);
      });
    } else {
      fixBatchConflicts(records);
    }
  }

}

function update(name){
  return new Promise(function(resolve, reject){
    nmcd.show(name).then(function(nmcRecord){
      nmcRecord = scrubRecord(nmcRecord);

      if (nmcRecord){
        db.get(name, function(err, doc){
          if (err){
            db.save(name, nmcRecord.value); //add resolve/reject
          } else if (typeof doc !== 'undefined'){

            var cleanDoc = scrubRecord({name: name, value: doc.json});

            var keys = nmcRecord.value.keys();
            var same = true;
            keys.forEach(function(key){
              if (!key.startsWith('_') && !key.startsWith('$')){
                if (!Object.equal(cleanDoc[key], nmcRecord[key])){
                  same = false;
                }
              }
            });


            if (same){
              if (DEBUG){
                console.log(name + " is already up to date");
              }
              resolve(true);


            } else {
              db.save(name, doc._rev, nmcRecord.value, function(error, response){
                if (error && DEBUG){
                  console.log(name + " failed to update",
                    JSON.stringify(error));
                  winston.warn(name + " failed to update", error);

                  reject(error);
                } else {
                  console.log(name + " updated");
                  if (DEBUG){
                    winston.info(name + " updated");
                  }
                  resolve(response);
                }
              });
            }

          }
          else {
            if (DEBUG){
              console.log("no error but not updated: "
                + JSON.stringify(doc));
            }

            reject(doc);
          }
        });
      }

    });

  });
}
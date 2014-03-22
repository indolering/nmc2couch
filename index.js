/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';

var sugar = require('sugar');
Object.extend();

var DEBUG = false;
process.argv.forEach(function(val, index, array) {
  if (val.endsWith('debug')) {
    DEBUG = true;
  }
});

var winston = require('winston');
winston.add(winston.transports.File, {
  filename        : 'nmc2couch.log',
  handleExceptions: !DEBUG
});


var lockFile = require('lockfile');
var lockFreshness = {stale: 600000};
if (DEBUG) {
  lockFreshness.stale = 1;
}

var _ = require('underscore'),
  cradle = require('cradle'),
  db = null,
  Promise = require('es6-promise').Promise,
  namecoin = require('nmc.js'),
  fs = require('fs'),
  namesTotal = 90000,
  scraped = 0,
  batchSize = 100,
  time = Date.now(),
  namesRegex = '^d/[a-z][a-z0-9-]{0,61}[a-z0-9]$',
  lastBlockCount = null,
  blockCount = null,
  nmcd;

function setupDB() {
  return new Promise(function(resolve, reject) {
    var connection;
    fs.readFile('./couchdb-settings.json', 'utf-8', function(err, data) {
      if (!err) {
        data = JSON.parse(data);

        var dbname = data.dbname || "bit",
          host  = data.host || '127.0.0.1',
          https = data.https || false,
          port  = data.port || 5984,
          vars = null;


        if (dbname === "") {
          dbname = "bit";
        }

        if (data.https || data.user || data.pass) {
          vars = {};

          if (data.https) {
            vars['secure'] = https;
          }

          if ((data.user && (data.user !== "")) ||
            (data.pass && (data.pass !== ""))) {
            vars['auth'] = {};

            if (data.user && (data.user !== "")) {
              vars.auth['username'] = data.user;
            }

            if (data.pass && (data.pass !== "")) {
              vars.auth['password'] = data.pass;
            }
          }
        }

        if (vars !== null) {
          connection = new (cradle.Connection)(host, port, vars);
        } else {
          connection = new (cradle.Connection)(host, port);
        }

        db = connection.database(dbname);

      } else {
        db = new(cradle.Connection)().database('bit');
      }

      if (db) {
        resolve();
      } else {
        winston.error('Could not create DB',db, data, err);
        reject();
      }
    });
  });
}
  //  db = new (cradle.Connection)().database('bit');

lockFile.lock('nmc2couch.lock', lockFreshness, function(er) {
  if (er && DEBUG) {
    winston.warn('Could not open lockfile!');
  } else {

    if (DEBUG) {
      winston.info("lockfile set", {"user": process.getuid()});
    }

    setupDB();

    fs.readFile('./namecoin-settings.json', 'utf-8', function(err,data){
      if (err) {
        nmcd = namecoin.init().then(function(c){scrape(c)});
      } else {
        nmcd = namecoin.init(JSON.parse(data)).then(function(c){scrape(c)});
      }
    });
  }
});

function scrape(n) {

  //this is what happens when you mix thenable promises with regular callbacks.
  nmcd = n;

  nmcd.blockCount().then(function(value) {
    blockCount = value;
    db.get('$lastBlockCount', function(err, doc) {
      if (err) {
        lastBlockCount = blockCount - 36000; //all current blocks
        db.save('$lastBlockCount', {"blocks": blockCount});
      } else {
        if (doc.blocks < 36000) {
          lastBlockCount = blockCount - 36000;
        } else {
          lastBlockCount = doc.blocks - 6; //1 "hour" overlap between calls
        }
        db.save('$lastBlockCount', doc._rev, {"blocks": blockCount});
      }

      nmcd.filter({regex: namesRegex, age: blockCount - lastBlockCount, start: 0, max: 0, stat: true})
        .then(function(result) {
          namesTotal = result.count;
          nameDump();
        });
    });

  });
}

function expireBlock(expires) {
  return blockCount + expires;
}

function cleanRecord(record) {
  var name = record.name;
  var value = record.value;

  if (name.startsWith('d/')) {
    name = name.from(2);
  }

  if (value === "RESERVED") {
    value = '{"$reserved":true}';
  }

  if (!value.isBlank() && value.has(/[{}:]/)) { //sanity check to reduce error log
    try {
      value = JSON.parse(value);
      value['expires'] = expireBlock(record.expires_in);

    } catch (e) {
//      value = {'$error' : encodeURI(value)};
//      console.log(e, name, value);
      return false;
    }
  } else {
    return false;
  }
  return {name: name, value: value};
}

// removes all admins stuff
// will (eventually) also remove all key/values which are not well formed.
function scrubRecord(record) {
  if (!record.value.isObject()) {
    record = cleanRecord(record);
  }

  if (record) {
    var keys = Object.keys(record.value);


    for (var i = 0; i < keys.length; i++) {
      if (keys[i].startsWith('_') || keys[i].startsWith('$')) {
        delete record[keys[i]];
      }
    }
  }
  return record;
}

function nameDump(regex, age, start, max) {

  var args = {
    'regex': regex || '^d/[a-z][a-z0-9-]{0,61}[a-z0-9]$',
    'age'  : age || blockCount - lastBlockCount,
    'start': start || scraped,
    'max'  : max || batchSize
  };

  nmcd.filter(args).then(function(names, err) {
    if (err) {
      console.log(err);
    } else if (names) {
      var batch = [];
      while (names.length > 0) {
        var record = names.pop();

        if (record && record.value !== "") {
          record = cleanRecord(record);
          batch.push({'_id': record.name, 'value': record.value});
        }

      }
      db.save(batch, function(err, response) {
        if (DEBUG && err) {
          console.log(err);
        } else {
          console.log(response);
          scraped = scraped + batchSize;
          var temp = Date.now();
          console.log(scraped + " " + Math.round(((temp - time) / 1000)));
          time = temp;

          fixBatchConflicts(response);

          if (namesTotal > scraped) {
            nameDump();
          } else {
            if (DEBUG) {
              winston.info("finished.");
            }

            lockFile.unlock('nmc2couch.lock', function(er) {
              console.log(er);
              if (DEBUG) {
                winston.warn(er);
              }

            });
          }
        }
      });
    }

  });
}


function fixBatchConflicts(records) {

  if (records.length > 0) {
    var record = records.pop();
    if (Object.has(record, 'error') && record.error === 'conflict') {
      update(record.id).then(function() {
        fixBatchConflicts(records);
      });
    } else {
      fixBatchConflicts(records);
    }
  }

}

function update(name) {
  return new Promise(function(resolve, reject) {
    nmcd.show(name).then(function(nmcRecord) {
      nmcRecord = scrubRecord(nmcRecord);

      if (nmcRecord) {
        db.get(name, function(err, doc) {
          if (err) {
            db.save(name, nmcRecord.value); //add resolve/reject
          } else if (typeof doc !== 'undefined') {

            var cleanDoc = scrubRecord({name: name, value: doc.json});

            var keys = nmcRecord.value.keys();
            var same = true;
            keys.forEach(function(key) {
              if (!key.startsWith('_') && !key.startsWith('$')) {
                if (!Object.equal(cleanDoc[key], nmcRecord[key])) {
                  same = false;
                }
              }
            });


            if (same) {
              if (DEBUG) {
                console.log(name + " is already up to date");
              }
              resolve(true);


            } else {
              db.save(name, doc._rev, nmcRecord.value, function(error, response) {
                if (error && DEBUG) {
                  console.log(name + " failed to update",
                    JSON.stringify(error));
                  winston.warn(name + " failed to update", error);

                  reject(error);
                } else {
                  console.log(name + " updated");
                  if (DEBUG) {
                    winston.info(name + " updated");
                  }
                  resolve(response);
                }
              });
            }

          }
          else {
            if (DEBUG) {
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
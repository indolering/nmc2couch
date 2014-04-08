/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';
var cradle = require('cradle');
var Promise = require('es6-promise').Promise;

function couch(conf, callback) {

  try {
    var db = initConnection(conf);
  } catch (e) {
    reject(e);
  }

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
        callback(err, null);
      }
    }
  });
}

function initConnection(conf) {

  var connection = null;
  var conf = conf || {};

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
    connection = new (cradle.Connection)(conf.uri, {
      'auth'  : auth
    }).database(conf.dbname);
  } else {
    connection = new (cradle.Connection)(conf.uri).database(conf.dbname);
  }

  return connection;
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
exports.init = function(conf, callback) {
  new couch(conf, callback);
};


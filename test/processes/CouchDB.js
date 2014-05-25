/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';
var chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  http= require('http'),
  exec = require('child_process').exec;

describe('Check if CouchDB is working', function() {

  it("PS output contains couchdb (not 100% accurate)", function (done) {
    exec('ps -axw', function(err, stdout, stderr) {
      if(err){
        throw err;
      } else {
        (stdout).should.match(/.*couchdb.*/i);
        console.log(stdout);
      }
      done();
    });
  });

  it("responds at http://127.0.0.1:5984/ (accurate if correct address)", function (done) {
    var options = {
      hostname: '127.0.0.1',
      port: 5984,
      path: '/',
      method: 'GET'
    };

    var first = -1;
    http.get(options, function(res) {
      res.statusCode.should.to.equal(200);
      res.on("data", function(chunk) {
        var response = JSON.parse(chunk);
        expect(response.couchdb).to.equal('Welcome');
        done();
      });
    }).on('error', function(e) {
      throw e.message;
    });

  });

//TODO check couch-settings

});
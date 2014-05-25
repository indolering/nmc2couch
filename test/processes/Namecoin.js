/**
 * @license AGPLv3 2014
 * @author indolering
 */

'use strict';

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  exec = require('child_process').exec;


var namecoin = require('namecoin');

var nmcd = new namecoin.Client({
  host: 'localhost',
  port: 8336,
  user: 'user',
  pass: 'pass'
});

describe('Namecoind is running', function() {
  it("PS list should contain nmc or namecoin", function (done) {
    exec('ps -axw', function(err, stdout, stderr) {
      if(err){
        throw err;
      } else {
        (stdout).should.match(/[0-9] nmc.*|[0-9] namecoin.*/i);
        console.log(stdout);
      }
      done();
    });
  });
});

describe('getinfo', function() {

  it("nmcd.getInfo", function (done) {
    nmcd.getInfo(function(err,resp) {
      resp.should.be.ok;
      console.log("nmcd.getInfo: " + JSON.stringify(resp));
      done();
    });
  });

  it("cmd.(getinfo)", function (done) {
    nmcd.cmd("getinfo", function(err,resp) {
      resp.should.be.ok;
      console.log("cmd.(getinfo): " +  JSON.stringify(resp));
      done();
    });
  });

});


describe('blockCount', function() {


  it("nmcd.getBlockCount", function (done) {
    nmcd.getBlockCount(function(err,resp) {
      resp.should.be.above(0);
      console.log("nmcd.getBlockCount: " + resp);
      done();
    });
  });

  it("cmd.(getblockcount)", function (done) {
    nmcd.cmd("getblockcount", function(err,resp) {
      resp.should.be.above(0);
      console.log("cmd.(getblockcount): " +  resp);
      done();
    });
  });

});

//TODO: check Namecoin.js

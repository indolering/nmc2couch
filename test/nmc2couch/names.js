'use strict';

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  path = require('path'),
  PouchDB = require('pouchdb'),
  Promise = require('bluebird'),
  generator = require(path.resolve(__dirname, "../", "map", "values", 'generator')),
  mapper = require(path.resolve(__dirname, '../../src/', "mapper")),
  map = new mapper.map(),
  regex = /^.*(?=\/)(.*)/,
  chaiAsPromised = require("chai-as-promised"); chai.use(chaiAsPromised);

describe('Name and Namespace Validation', function () {
  var tests = [
    {uri: "d/asdf", namespace: "d", name: "asdf"},
    {uri: "id/asdf", namespace: "id", name: "asdf"},
    {uri: "2/6", namespace: "2", name: "6"}

  ];

  tests.forEach(function (test) {
    var doc = {};
    doc.name = test.uri;
    var matches = regex.exec(doc.name);

    it("Parse " + test.namespace + " from " + test.uri, function () {
      doc.namespace = matches[1];
      doc.namespace.should.eql(test.namespace);
    });

    it("Parse " + test.name + " from " + test.uri, function () {
      doc.name = matches[2].slice(1);
      doc.name.should.eql(test.name);
    });
  });

});
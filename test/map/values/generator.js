"use strict";

var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  Sugar = require('sugar'),
  transports = ['http','translate'];

function generate(type){
  return new Promise(function (resolve, reject) {
    var examples = require(path.join(__dirname, type, 'examples.json'));

    fetchValues(type).then(function (values) {
      resolve(examples.concat(generateRecords(values)));
    }).catch(function (err) {
      reject(err);
    });

  });
}


function fetchValues(directory) {
  return new Promise(function (resolve, reject) {
    fs.readdir(path.join(__dirname, directory), function (err, files) {
      if (err) reject(err);
      files.forEach(function (file) {
        if (file.endsWith('.txt')) {
          fs.readFile(path.resolve(__dirname, directory, file), "utf8", function (err, data) {
            if (err) reject(err);
            resolve(data.toString().split("\n"));
          });
        }
      });
    });
  });
}

function generateRecords(values) {
  var records = [];
  transports.forEach(function (transport) {
    values.forEach(function (value) {
      records.push(createDoc(transport, value));
    });
  });
  return records;
}

function createDoc(transport, value) {
  var safeVal = value.replace(/\W/g, ''); //strip
  safeVal = safeVal.replace(/[_]/g, ''); //\W doesn't cover underscores
  safeVal = safeVal.slice(0, 10);

  var record = {
    "_id": 'd/' + transport + "-" + safeVal,
    "name": transport + "-" + safeVal,
    "namespace": 'd',
    "value": {},
    "expires": 192749
  }

  record.value[transport] = value;

  return record;
}

module.exports.generate = generate;
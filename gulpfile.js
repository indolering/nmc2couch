var gulp = require('gulp'),
  path = require('path'),
  fs = require('fs'),
  mapper = require('./src/mapper');

var map = mapper.toString().replace("function map(doc, emit, rejectify) {","function(doc) {");

gulp.task('default', function() {
  fs.writeFile(path.resolve(__dirname,'src', 'speech-map'), mapper.map.toString(), function (err) {
    if (err) throw err;
  });
});
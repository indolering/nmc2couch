var gulp = require('gulp'),
  path = require('path'),
  fs = require('fs'),
  mapper = require('./src/mapper'),
  replace = require('gulp-replace');


var map = JSON.stringify(mapper.map).replace("function map(doc, emit, rejectify) {","function(doc) {");
//
////
//
//var replace = require('gulp-replace');
//
//gulp.task('templates', function(){
//  gulp.src(['src/mapper.js'])
//    .pipe(replace(/map\(doc, emit, rejectify\)/g, 'function(doc)'))
//    .pipe(gulp.dest('src/map-reduce.js'));
//});

gulp.task('default', function() {
//
//  return gulp.src(['src/mapper.js'])
////    .pipe(replace(/map\(doc, emit, rejectify\)/g, 'function(doc)'))
//    .pipe(gulp.dest('src/map-reduce.js'));

  fs.writeFile(path.resolve(__dirname,'src', 'speech-map'), map, function (err) {
    if (err) throw err;
  });
});
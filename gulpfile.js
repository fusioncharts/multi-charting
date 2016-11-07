var gulp = require('gulp'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	del = require('del');

var files = [
	'src/fusioncharts.multicharting.js',
	'src/multicharting.lib.js',
	'src/multicharting.datastore.js',
	'src/multicharting.dataprocessor.js',
	'src/multicharting.dataadapter.js',
	'src/multicharting.createchart.js'
]

gulp.task('clean', function () {
	return del(['out/']);
});


gulp.task('default', ['clean'], function () {

	gulp.src(files)
	.pipe(sourcemaps.init())
	.pipe(concat('fc.mc.js'))
	.pipe(sourcemaps.write())
    .pipe(gulp.dest('out/'));

	console.log('called...')
});
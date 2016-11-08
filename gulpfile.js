var gulp = require('gulp'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	jshint = require('gulp-jshint'),
	del = require('del'),
    packageJSON  = require('./package'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    pump = require('pump'),
    argArr = process.argv,
    argLen = argArr.length,
    jshintConfig = packageJSON.jshintConfig,
    BUILD_DIR = 'out/', // Name of the directory where to create the build files
    BUILD_FILE_NAME = 'fusioncharts.multicharting.js', // Name of the build file
    files = [
		'src/fusioncharts.multicharting.js',
		'src/multicharting.lib.js',
		'src/multicharting.datastore.js',
		'src/multicharting.dataprocessor.js',
		'src/multicharting.dataadapter.js',
		'src/multicharting.createchart.js',
		'src/multicharting.matrix.js'
	],
    ARGUMENTS = {},
	arg;

// If more then two arguments passed
// Extract all arguments and store it into ARGUMENTS
if (argLen > 2) {
    while (argLen-- > 1) {
        arg = argArr[argLen];
        if (/^\-\-/.test(arg)) {
            arg = arg.split(/\=|\:/);
            ARGUMENTS[arg[0].replace(/^\-\-/, '')] = (arg[1] && /\,/.test(arg[1]) && arg[1].split(/\,/)) || (arg[1] || '');
        }
    }
}

// Clean the out directory
gulp.task('clean', function () {
	return del([BUILD_DIR]);
});

// Run lint on the source
gulp.task('lint', function() {
	return gulp.src(ARGUMENTS.file || files)
    	.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

// Build only the source file
gulp.task('build-source', ['clean'], function () {
	return gulp.src(files)
		.pipe(sourcemaps.init())
		.pipe(concat(BUILD_FILE_NAME))
		.pipe(sourcemaps.write())
	    .pipe(gulp.dest(BUILD_DIR));
});

// Compress the source file
gulp.task('compress', function (cb) {
  	pump([gulp.src(BUILD_DIR + BUILD_FILE_NAME), uglify(), gulp.dest(BUILD_DIR)], cb);
});

// Build the source and minified files
gulp.task('build', ['build-source', 'compress']);

// Runs lint and then creates source and minified files
gulp.task('default', ['lint', 'build']);

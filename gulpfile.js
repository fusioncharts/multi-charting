var gulp = require('gulp'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	jshint = require('gulp-jshint'),
	// del = require('del'),
    packageJSON  = require('./package'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    pump = require('pump'),
    rename = require('gulp-rename'),
    rm = require('gulp-rimraf'),
    gulpsync = require('gulp-sync')(gulp),
    fs = require('fs'),
    argArr = process.argv,
    argLen = argArr.length,
    jshintConfig = packageJSON.jshintConfig,
    BUILD_DIR = 'out/', // Name of the directory where to create the build files
    BUILD_FILE_NAME = 'fusioncharts.multicharting.js', // Name of the build file
    files = [
		'src/fusioncharts.multicharting.js',
		'src/multicharting.lib.js',
        'src/multicharting.ajax.js',
		'src/multicharting.csv.js',
		'src/multicharting.datastore.js',
		'src/multicharting.dataprocessor.js',
		'src/multicharting.dataadapter.js',
        'src/multicharting.chart.js',
        'src/multicharting.matrix.js',
		'src/multicharting.event.js'
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
	// console.log("\n\n Cleaning \n\n");
	return gulp.src(BUILD_DIR).pipe(rm());
	// return del([BUILD_DIR + '/*']);
});

// Run lint on the source
gulp.task('lint', function() {
	// console.log("\n\n Linging \n\n");
	return gulp.src(ARGUMENTS.file || files)
    	.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

// Build only the source file
gulp.task('build-source', ['clean'], function () {
	// console.log("\n\n build-source \n\n");

    // Throw error if file not exist
    for (var i = 0; i < files.length; i ++) {
        if (!fs.existsSync(files[i])) {
            console.log('\n\n');
            console.log("Module does not exist: ", files[i]);
            console.log('\n\n');
            throw "Module does not exist";
        }
    }

	return gulp.src(files)
		.pipe(sourcemaps.init())
		.pipe(concat(BUILD_FILE_NAME))
		.pipe(sourcemaps.write())
	    .pipe(gulp.dest(BUILD_DIR));
});

// Compress the source file
gulp.task('compress', function (cb) {
	// console.log("\n\n Compress \n\n");
  	// pump([gulp.src(BUILD_DIR + BUILD_FILE_NAME), uglify(), gulp.dest(BUILD_DIR)], cb);
	return gulp.src(BUILD_DIR + BUILD_FILE_NAME)
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(BUILD_DIR));

});

// Build the source and minified files
gulp.task('build', gulpsync.sync(['build-source', 'compress']));

// Runs lint and then creates source and minified files
gulp.task('default', gulpsync.sync(['lint', 'build']));
// gulp.task('default', gulpsync.sync(['lint', 'build-source', 'compress']));

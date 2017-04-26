'use strict';

const OUTPUT_DIR = 'recordings-installer';
const FILE_NAME = 'src.zip';

var gulp = require('gulp'),
	zip = require('gulp-zip'),
	replace = require('gulp-replace'),
	modify = require('gulp-modify');


gulp.task('default', ['zip_files']);

gulp.task('zip_files', function() {
	gulp.src('src/**', { base: '.' })
		.pipe(zip(FILE_NAME))
		.pipe(gulp.dest(OUTPUT_DIR));
});

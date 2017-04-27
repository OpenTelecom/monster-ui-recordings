'use strict';

const INSTALLER_SRC_DIR = 'recordings-installer';
const PROJECT_FILES_ZIP_NAME = 'src.zip';
const INSTALLER_ZIP_NAME = 'recordings-installer.zip';
const OUTPUT_DIR = 'dist';

var gulp = require('gulp'),
	zip = require('gulp-zip'),
	replace = require('gulp-replace'),
	modify = require('gulp-modify');


gulp.task('default', ['zip_project_files', 'zip_installer_files']);

gulp.task('zip_project_files', function() {
	gulp.src('src/**', { base: '.' })
		.pipe(zip(PROJECT_FILES_ZIP_NAME))
		.pipe(gulp.dest(INSTALLER_SRC_DIR));
});

gulp.task('zip_installer_files', function() {
	gulp.src('recordings-installer/**', { base: '.' })
		.pipe(zip(INSTALLER_ZIP_NAME))
		.pipe(gulp.dest(OUTPUT_DIR));
});
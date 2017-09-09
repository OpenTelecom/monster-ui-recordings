'use strict';

const INSTALLER_SRC_DIR = 'recordings-installer';
const SOURCE_ARCHIVE_NAME = 'src.zip';
const INSTALLER_ARCHIVE_NAME = 'recordings-installer.zip';
const OUTPUT_DIR = 'dist/';

var gulp = require('gulp'),
	zip = require('gulp-zip'),
	replace = require('gulp-replace'),
	modify = require('gulp-modify'),
	clean = require('gulp-clean');


gulp.task('remove_src_archive', function () {
	return gulp.src(INSTALLER_SRC_DIR + '/' + SOURCE_ARCHIVE_NAME, {read: false})
		.pipe(clean({force: true}));
});

gulp.task('remove_installer_archive', ['remove_src_archive'], function () {
	return gulp.src(OUTPUT_DIR + INSTALLER_ARCHIVE_NAME, {read: false})
		.pipe(clean({force: true}));
});

gulp.task('zip_project_files', ['remove_installer_archive'], function() {
	return gulp.src('src/**', { base: '.' })
		.pipe(zip(SOURCE_ARCHIVE_NAME))
		.pipe(gulp.dest(INSTALLER_SRC_DIR));
});

gulp.task('zip_installer_files', ['zip_project_files'], function() {
	return gulp.src('recordings-installer/**', { base: '.' })
		.pipe(zip(INSTALLER_ARCHIVE_NAME))
		.pipe(gulp.dest(OUTPUT_DIR));
});

gulp.task('default', ['zip_installer_files']);
'use strict';

const PROJECT_ROOT = '../';
const CONFIG_DIRECTORY = PROJECT_ROOT + 'src/js/';
const CONFIG_FILE_PATH = CONFIG_DIRECTORY + 'main.js';

var gulp = require('gulp'),
	unzip = require('gulp-unzip'),
	replace = require('gulp-replace'),
	modify = require('gulp-modify');


gulp.task('default', ['extract_files', 'extend_config_file']);

gulp.task('extract_files', function() {
	gulp.src('src.zip')
		.pipe(unzip())
		.pipe(gulp.dest(PROJECT_ROOT));
});

gulp.task('extend_config_file', function () {
	gulp.src(CONFIG_FILE_PATH)
		.pipe(modify({
			fileModifier: function (file, contents) {
				contents.match(/([^]*paths:\s*)(\{[^\}]*\})(\,[^]*)/gm);

				var part1 = RegExp.$1;
				var part2 = RegExp.$2;
				var part3 = RegExp.$3;

				var paths = JSON.parse(part2.replace(/\'/gm, '"'));
				paths['aws-sdk'] = 'js/vendor/aws-sdk.min';
				paths['remote-storage-adapter'] = 'js/lib/storage-adapter';

				var sortedPaths = {};

				Object.keys(paths)
					.sort()
					.forEach(function(v, i) {
						sortedPaths[v] = paths[v];
					});

				var pathsStr = JSON.stringify(sortedPaths)
					.replace(/\"/gm, "'")
					.replace(/\:/gm, '\: ')
					.replace(/\{/gm, '\{\r\n\t\t')
					.replace(/\,/gm, '\,\r\n\t\t')
					.replace(/\}/gm, '\r\n\t\}');

				return part1 + pathsStr + part3;
			}
		}))
		.pipe(gulp.dest(CONFIG_DIRECTORY));
});
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

// modify main.js
gulp.task('extend_config_file', function () {
	gulp.src(CONFIG_FILE_PATH)
		.pipe(modify({ // modify "paths" property of main.js
			fileModifier: function (file, contents) {
				contents.match(/([^]*paths:\s*)(\{[^\}]*\})(\,[^]*)/gm);

				var part1 = RegExp.$1;
				var part2 = RegExp.$2;
				var part3 = RegExp.$3;

				var paths = JSON.parse(part2.replace(/\'/gm, '"'));
				paths['aws-sdk'] = 'js/vendor/aws-sdk.min';
				paths['datatables.net'] = 'js/vendor/datatables/jquery.dataTables.min';
				paths['datatables.net-bs'] = 'js/vendor/datatables/dataTables.bootstrap.min';
				paths['datatables.net-buttons'] = 'js/vendor/datatables/dataTables.buttons.min';
				paths['datatables.net-buttons-html5'] = 'js/vendor/datatables/buttons.html5.min';
				paths['datatables.net-buttons-bootstrap'] = 'js/vendor/datatables/buttons.bootstrap.min';
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
		/*.pipe(modify({ // modify "shim" property of main.js
			fileModifier: function (file, contents) {
				contents.match(/([^]*shim\s*:\s*\{)([^;]*)([^]*)/gm);

				var part1 = RegExp.$1;
				var part2 = RegExp.$2;
				var part3 = RegExp.$3;

				// if 'data-tables' did not match - add 'data-table' to start of shim object
				if(part2.indexOf('data-tables') === -1) {
					return part1
						+ "\r\n\t\t'data-tables': ['jquery'],"
						+ "\r\n\t\t'data-tables-buttons': ['jqueryui', 'data-tables'],"
						+ part2 + part3;
				}

				return contents;
			}
		}))*/
		.pipe(gulp.dest(CONFIG_DIRECTORY));
});
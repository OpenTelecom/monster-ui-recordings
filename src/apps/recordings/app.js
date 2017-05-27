define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		Handlebars = require('handlebars'),
		footable = require('footable'),
		RemoteStorage = require('remote-storage-adapter');

	var app = {
		name: 'recordings',

		css: [ 'app' ],

		settings: {
			aws: {
				'key': 'AKIAJR52NDF2XDN3ZUFQ',
				'secret': '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',
				'bucketName': 'callrecordingtestforcanddi',
				'bucketRegion': 'eu-west-2',
				'version': 'latest'
			},
			filenameTemplate: 'call_recording_{{call_id}}.mp3'
		},

		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: false }
		},

		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		load: function(callback) {
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			self._initHandlebarsHelpers();

			// Used to init the auth token and account id of this app
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		// Entry Point of the app
		render: function(container) {
			console.log('render');
			var self = this,
				parent = _.isEmpty(container) ? $('#monster-content') : container;


			monster.ui.generateAppLayout(self, {
				menus: [
					{
						tabs: [
							{
								callback: self.renderIndex
							}
						]
					}
				]
			});
		},

		renderIndex: function(pArgs) {
			console.log('renderIndex');

			var self = this,
				args = pArgs || {},
				$appContainer = args.container || $('#recordings_app_container .app-content-wrapper');

			RemoteStorage.init('aws', self.settings.aws);

			var template = $(monster.template(self, 'layout', {
				user: monster.apps.auth.currentUser
			}));

			$appContainer.fadeOut(function() {
				$(this).empty()
					.append(template)
					.fadeIn();
			});

			self._renderRecordingsList($appContainer);
		},

		_getCDRs: function(callback) {
			console.log('Get CDRs');
			var self = this;

			self.callApi({
				resource: 'cdrs.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					console.log('CDRs data:');
					console.log(data);
					var cdrs = data.data;

					if(cdrs.length === 0) {
						console.log('Warning: No CDRs');
						return;
					}

					if(typeof(callback) === 'function') {
						callback(cdrs);
					}
				},
				error: function(data, status) {
					//_callback({}, uiRestrictions);
					console.log('get cdrs error data');
					console.log(data);
				}
			});
		},

		_renderRecordingsList: function($appContainer) {
			var self = this;
			RemoteStorage.getRecordsFiles(function(bucketContent, bucketBaseUrl) {
				if(!bucketContent.Contents
					|| typeof(bucketContent.Contents) !== 'object'
					|| bucketContent.Contents.length === 0) {
					console.log('No files');
					return;
				}

				var files = bucketContent.Contents.filter(function(file) {
					return file.Size > 0;
				});

				self._getCDRs(function(cdrs){
					var callId,
						desiredFilename,
						CDRsWithFilesArr = [];

					for(var ci=0, clen=cdrs.length; ci < clen; ci++) {
						callId = cdrs[ci].call_id;
						for(var fi=0, flen=files.length; fi < flen; fi++) {
							desiredFilename = self.settings.filenameTemplate.replace('{{call_id}}', callId);
							if(files[fi].Key === desiredFilename) {
								cdrs[ci].recording_url = files[fi].url;
								CDRsWithFilesArr.push(cdrs[ci]);
								break;
							}
						}
					}

					console.log('CDRs with Files:');
					console.log(CDRsWithFilesArr);


					var template = $(monster.template(self, 'recordings-table', {
						'recordings': CDRsWithFilesArr
					}));

					console.log(template);

					$appContainer.find('#recordings-list-container').html(template);

					self._initRecordingsTableBehavior();
				});
			});
		},

		_initRecordingsTableBehavior: function() {
			$('table#recordings-list').footable({
				'paging': {
					'enabled': true,
					'size': 10
				}
			}, function(ft) {
				$('.js-play-audio').click(function(e) {
					e.preventDefault();
					var $btn = $(this);
					var $btnContainer = $btn.parent();

					$btnContainer.html(
						'<audio controls="controls" preload="auto" autoplay="autoplay">' +
						'<source src="' + $btn.attr('href') + '" type="audio/mpeg">' +
						'</audio>'
					);
				});
			});
		},

		_initHandlebarsHelpers: function() {
			Handlebars.registerHelper('inc', function(value, options) {
				return parseInt(value) + 1;
			});
		}
	};

	return app;
});

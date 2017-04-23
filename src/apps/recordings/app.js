define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		Handlebars = require('handlebars'),
		footable = require('footable'),/*,
		AWS = require('aws-sdk'),*/
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
			}
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

			console.log('RemoteStorage in app');
			console.log(RemoteStorage);

			console.log('AWS in app');
			console.log(window.AWS);

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
			//self._renderCDRs($cdrsContainer);
		},

		_renderCDRs: function() {
			var self = this;

			self.callApi({
				resource: 'cdrs.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					//_callback(data.data, uiRestrictions);
				},
				error: function(data, status) {
					//_callback({}, uiRestrictions);
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

				/*var files = bucketContent.Contents.filter(function(file) {
					return file.Size > 0;
				});

				var template = $(monster.template(self, 'recordings-table', {
					'files': files
				}));

				$container.html(template);

				$('table#recordings').footable({}, function(ft) {
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
				});*/

				$.get('apps/recordings/views/recordings-table.hbs', function (data) {
					console.log('compile template');
					var template = Handlebars.compile(data);
					console.log(template);

					var files = bucketContent.Contents.filter(function(file) {
						return file.Size > 0;
					});

					debugger;

					$appContainer.find('#recordings-list-container').html(template({
						'files': files
					}));



					$('table#recordings-list').footable({}, function(ft) {
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


				}, 'html');
			});
		}
	};

	return app;
});

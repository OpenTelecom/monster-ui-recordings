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
			self._renderCDRs($appContainer);
		},

		_renderCDRs: function($appContainer) {
			console.log('render CDRs');
			var self = this;

			self.callApi({
				resource: 'cdrs.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					//_callback(data.data, uiRestrictions);
					console.log('get cdrs success data');
					console.log(data);
					var cdrs = data.data;

					if(cdrs.length === 0) {
						console.log('Warning: No CDRs');
						return;
					}
					self._renderCDRsTable(cdrs, $appContainer);
				},
				error: function(data, status) {
					//_callback({}, uiRestrictions);
					console.log('get cdrs error data');
					console.log(data);
				}
			});
		},

		_renderCDRsTable: function(cdrsArr, $appContainer) {
			/*
			authorizing_id: "acdc5afcc85e9540617ac3713dc0c535"
			billing_seconds: "6"
			bridge_id:"a8326999634f059d31243f4e8f5b1824@0:0:0:0:0:0:0:0"
			call_id: "a8326999634f059d31243f4e8f5b1824@0:0:0:0:0:0:0:0"
			call_priority: ""
			call_type: ""
			callee_id_name: ""
			callee_id_number: ""
			caller_id_name: "userm3twjey5f5"
			caller_id_number: "user_m3twjey5f5"
			calling_from: "user_m3twjey5f5"
			cost:"0"
			datetime: "2017-04-27 06:19:58"
			dialed_number: "3000"
			direction: "inbound"
			duration_seconds: "6"
			from: "user_m3twjey5f5@vbarkasov.tvnow.io"
			hangup_cause: "NORMAL_CLEARING"
			id: "201704-a8326999634f059d31243f4e8f5b1824@0:0:0:0:0:0:0:0"
			*/

			$.get('apps/recordings/views/cdrs-table.hbs', function (data) {
				var template = Handlebars.compile(data);
				console.log(template);

				$appContainer.find('#cdrs-list-container').html(template({
					'cdrs': cdrsArr
				}));

				$('table#cdrs-list').footable({}, function(ft) {
					console.log('cdrs table renderings complete');
				});
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

				$.get('apps/recordings/views/recordings-table.hbs', function (data) {
					console.log('compile template');
					var template = Handlebars.compile(data);
					console.log(template);

					var files = bucketContent.Contents.filter(function(file) {
						return file.Size > 0;
					});

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

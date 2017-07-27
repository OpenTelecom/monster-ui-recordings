define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		Handlebars = require('handlebars'),
		RemoteStorage = require('remote-storage-adapter');

	require([
		'datatables.net',
		'datatables.net-bs',
		'datatables.net-buttons',
		'datatables.net-buttons-html5',
		'datatables.net-buttons-bootstrap',
		'./submodules/storageManager/storageManager'
	]);

	var app = {
		name: 'recordings',

		subModules: [
			'storageManager'
		],

		css: [ 'app' ],

		settings: {
			aws: {
				'bucketRegion': 'eu-west-2',
				'version': 'latest'
			},
			filenameTemplate: 'call_recording_{{call_id}}.mp3',
			defaultDateRangeKey: 'all',
			dateFilterByRequest: false
		},

		vars: {
			// temporary variables
			$appContainer: null,
			filesList: null // files list from s3
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
				args = pArgs || {};
				self.vars.$appContainer = args.container || $('#recordings_app_container .app-content-wrapper');

			var template = $(monster.template(self, 'layout', {
				user: monster.apps.auth.currentUser
			}));

			self.vars.$appContainer.fadeOut(function() {
				$(this).empty()
					.append(template)
					.fadeIn();
			});

			self.callApi({
				resource: 'storage.get',
				data: {
					accountId: self.accountId,
					removeMetadataAPI: true
				},
				success: function(data, status) {
					console.log('Storage data:');
					console.log(data);

					var storageUUID = localStorage.getItem('storageUUID');
					var storageAttachment;

					try {
						if(!storageUUID
							|| storageUUID && !data.data.attachments.hasOwnProperty(storageUUID)) {
							storageUUID = Object.keys(data.data.attachments)[0];
							localStorage.setItem('storageUUID', storageUUID);
						}

						storageAttachment = data.data.attachments[storageUUID];

						if(storageAttachment && storageAttachment.handler === 's3') {
							self.settings.aws.bucketName = storageAttachment.settings.bucket;
							self.settings.aws.key = storageAttachment.settings.key;
							self.settings.aws.secret = storageAttachment.settings.secret;
							RemoteStorage.init('aws', self.settings.aws);
						}
					} catch(e) {
						alert('Error: ' + e.name + ":" + e.message + "\n" + e.stack); // (3) <--
					}

					/*self._createS3settings(function(data){
						console.log(data);
					});*/
					self._renderRecordingsList();
					//self._renderStorageSettings();
				}
			});
		},

/*		_renderStorageSettings: function() {
			monster.pub('common.storageSelector.render');

			monster.pub('common.storagePlanManager.render', {
				container: $('.storage-settings')
			});
		},*/

		_generateUUID: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},

		_createS3settings: function(callback) {
			var self = this;
			var uuid = self._generateUUID();

			var storageData = {
				"attachments": {},
				"plan": {
					"modb": {
						"types": {
							"call_recording": {
								"attachments": {
									"handler": uuid
								}
							}
						}
					}
				}
			};

			storageData.attachments[uuid] = {
				"handler": "s3",
				"name": "S3 Storage",
				"settings": {
					bucket: 'callrecordingtestforcanddi',
					key: 'AKIAJR52NDF2XDN3ZUFQ',
					secret: '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'
				}
			};


			self.callApi({
				resource: 'storage.update',
				data: {
					accountId: self.accountId,
					removeMetadataAPI: true,
					data: storageData
				},
				success: function(data, status) {
					if(typeof(callback) === 'function') {
						callback(data);
					}
				}
			});
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

		_getCDRsByDate: function(fromDate, toDate, callback, pageStartKey) {
			var self = this,
				filters = {
					'page_size': 50,
					'created_from': monster.util.dateToBeginningOfGregorianDay(fromDate),
					'created_to': monster.util.dateToEndOfGregorianDay(toDate)
				};

			if(pageStartKey) {
				filters['start_key'] = pageStartKey;
			}

			self.callApi({
				resource: 'cdrs.listByInteraction',
				data: {
					accountId: self.accountId,
					filters: filters
				},
				success: function(data, status) {
					callback(data.data, data['next_start_key']);
				}
			});
		},

		_getCDR: function(cdrId, callback) {
			var self = this;
			console.log('Get CDR');
			// 'get': { verb: 'GET', url: 'accounts/{accountId}/cdrs/{cdrId}' },

			if(!cdrId || typeof(cdrId) === 'undefined') {
				self.log('Error: CDR ID not found');
			}

			self.callApi({
				resource: 'cdrs.get',
				data: {
					accountId: self.accountId,
					cdrId: cdrId
				},
				success: function(data, status) {
					console.log('CDR data:');
					console.log(data);
					var cdr = data.data;

					if(cdr.length === 0) {
						console.log('Warning: No CDR #' + cdrId);
						return;
					}

					if(typeof(callback) === 'function') {
						callback(cdr);
					}
				},
				error: function(data, status) {
					//_callback({}, uiRestrictions);
					console.log('get cdr error');
					console.log(data);
				}
			});
		},

		_renderRecordingsList: function() {
			var self = this;
			RemoteStorage.getRecordsFiles(function(bucketContent, bucketBaseUrl) {
				if(!bucketContent.Contents
					|| typeof(bucketContent.Contents) !== 'object'
					|| bucketContent.Contents.length === 0) {
					console.log('No files');
					return;
				}

				self.vars.filesList = bucketContent.Contents.filter(function(file) {
					return file.Size > 0;
				});

				if(self.settings.dateFilterByRequest) {
					var dateRange = self._getDatetimeRangeByKey(self.settings.defaultDateRangeKey);
					self._getCDRsByDate(dateRange[0], dateRange[1],
						function(cdrs, nextStartKey) {
							self._renderRecordingsTable(cdrs);
						});
				} else {
					self._getCDRs(function(cdrs) {
						self._renderRecordingsTable(cdrs);
					});
				}

			});
		},

		_extractCDRsWithFiles: function(cdrs, files){
			var self = this,
				callId,
				desiredFilename,
				CDRsWithFilesArr = [];

			for(var ci=0, clen=cdrs.length; ci < clen; ci++) {
				callId = cdrs[ci].call_id;
				for(var fi=0, flen=files.length; fi < flen; fi++) {
					desiredFilename = self.settings.filenameTemplate.replace('{{call_id}}', callId);
					if(files[fi].Key === desiredFilename) {
						cdrs[ci].recording_file_name = desiredFilename;
						cdrs[ci].recording_url = files[fi].url;
						CDRsWithFilesArr.push(cdrs[ci]);
						break;
					}
				}
			}

			return CDRsWithFilesArr;
		},

		_renderRecordingsTable: function(cdrs){
			var self = this,
				uniqueCallerIdNames = new Set(),
				minDuration = 0,
				maxDuration = 0,
				duration;

			var CDRsWithFilesArr = self._extractCDRsWithFiles(cdrs, self.vars.filesList);

			for(var i=0, len=CDRsWithFilesArr.length; i<len; i++) {
				uniqueCallerIdNames.add(CDRsWithFilesArr[i]['caller_id_name']);
				duration = parseInt(CDRsWithFilesArr[i].duration_seconds);

				if(!maxDuration || duration > maxDuration) {
					maxDuration = duration;
				}

				if(!minDuration || duration < minDuration) {
					minDuration = duration;
				}
			}

			console.log('CDRs with Files:');
			console.log(CDRsWithFilesArr);

			console.log('Unique Caller Id Names:');
			console.log(uniqueCallerIdNames);


			var template = $(monster.template(self, 'recordings-table', {
				'recordings': CDRsWithFilesArr,
				'callerIdNames': Array.from(uniqueCallerIdNames),
				'minDuration': minDuration,
				'maxDuration': maxDuration
			}));

			console.log(template);

			self.vars.$appContainer.find('#recordings-list-container').html(template);

			self._initRecordingsTableBehavior();
			self._initSettingsButtonBehavior();
		},

		_initSettingsButtonBehavior: function() {
			var self = this;

			self.vars.$appContainer.find('.js-show-settings').on('click', function(e) {
				e.preventDefault();
				/*monster.pub('recordings.storageManager.render', {
					container: $('.storage-settings'),
					accountId: self.accountId
				});*/

				monster.pub('recordings.storageManager.render', {
					callback: function(data) {
						console.log(data);
					}
				});
			});

			//TODO: remove it after development:
			$('.js-show-settings').click();

		},

		_initDateTimePickers: function() {
			var $dateFrom = $('#date-from');
			var $dateTo = $('#date-to');

			var $timeFrom = $('#time-from');
			var $timeTo = $('#time-to');

			monster.ui.datepicker($dateFrom, {
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				autoclose: true
			});

			monster.ui.datepicker($dateTo, {
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				autoclose: true
			});

			monster.ui.timepicker($timeFrom, {
				showDuration: true,
				timeFormat: 'H:i'
			});

			monster.ui.timepicker($timeTo, {
				showDuration: true,
				timeFormat: 'H:i'
			});
		},

		_initDateTimeFilter: function(table) {
			var self = this;

			self._setDatetimeRangeByKey(self.settings.defaultDateRangeKey, table);

			var getDate = function(element) {
				var date;
				try {
					date = $.datepicker.parseDate('yy-mm-dd', element.value);
				} catch( error ) {
					date = null;
				}
				return date;
			};

			var updateRecordingsTable = function(){
				if(self.settings.dateFilterByRequest) {


					var dateFrom = $('#date-from').datepicker('getDate');
					var dateTo = $('#date-to').datepicker('getDate');
					var timeFromArr = $('#time-from').val().split(':');
					var timeToArr = $('#time-to').val().split(':');

					dateFrom.setHours(parseInt(timeFromArr[0]), parseInt(timeFromArr[1]));
					dateTo.setHours(parseInt(timeToArr[0]), parseInt(timeToArr[1]));

					self._getCDRsByDate(dateFrom, dateTo, function(cdrs, nextStartKey) {
						self._renderRecordingsTable(cdrs);
					});
				} else {
					/*self._getCDRs(function(cdrs) {
						self._renderRecordingsTable(cdrs);
					});*/
					table.draw();
				}
			};

			var $dateFrom = $('#date-from');
			var $dateTo = $('#date-to');

			$dateFrom.on('change keyup', function() {
				$dateTo.datepicker('option', 'minDate', getDate(this));
				updateRecordingsTable();
			});

			$dateTo.on('change keyup', function() {
				$dateFrom.datepicker('option', 'maxDate', getDate(this));
				updateRecordingsTable();
			});

			$('#time-to').on('change keyup', function() {
				updateRecordingsTable();
			});

			$('#time-from').on('change keyup', function() {
				updateRecordingsTable();
			});

			$('.js-set-date-range').on('click', function(e) {
				e.preventDefault();
				$('.js-set-date-range').removeClass('date-range-active');
				$(this).addClass('date-range-active');

				self._setDatetimeRangeByKey($(this).data('range'), table);
			})
		},

		_initDirectionFilter: function(table) {
			$('select#direction').on('change', function() {
				table.draw();
				console.log('direction redraw');
			});
		},

		_initCallerIdNameFilter: function(table) {
			var $select = $('#caller-id-name');
			$select.chosen();

			$select.on('change', function() {
				table.draw();
				console.log('Caller Id Name redraw');
			});
		},

		_initDurationFilter: function(table) {
			var minDuration = parseInt($('#duration-range-min').text());
			var maxDuration = parseInt($('#duration-range-max').text());

			$('#duration-slider').slider({
				range: true,
				min: minDuration,
				max: maxDuration,
				values: [ minDuration, maxDuration],
				slide: function( event, ui ) {
					$('#duration-range-min').text(ui.values[0]);
					$('#duration-range-max').text(ui.values[1]);
					table.draw();
				}
			});
		},

		_getDatetimeRangeByKey: function(key) {
			var startDate = new Date(),
				endDate = new Date();
			switch(key) {
				case 'last-year':
					startDate.setFullYear(endDate.getFullYear()-1);
					break;
				case 'last-month':
					startDate.setMonth(endDate.getMonth()-1);
					break;
				case 'last-week':
					startDate.setDate(endDate.getDate() - 7);
					break;
				case 'last-day':
					startDate.setDate(endDate.getDate() - 1);
					break;
				case 'last-hour':
					startDate.setHours(endDate.getHours() - 1);
					break;
				default: // "all"
					startDate = new Date(0);
			}

			return [startDate, endDate];
		},

		_setDatetimeRangeByKey: function(key, table) {
			var self = this;
			var dateRange = self._getDatetimeRangeByKey(key);

			$('.js-set-date-range').removeClass('date-range-active');
			$('.js-set-date-range[data-range="' + key + '"]').addClass('date-range-active');

			self._setDatetimeRange(dateRange[0], dateRange[1], table);
		},

		_setDatetimeRange: function(startDate, endDate, table) {
			$('#date-from').datepicker('setDate', startDate);
			$('#time-from').timepicker('setTime', startDate);
			$('#date-to').datepicker('setDate', endDate);
			$('#time-to').timepicker('setTime', endDate);
			table.draw();
		},

		_initRecordingsTableBehavior: function() {
			var self = this;

			self._initAudioButtons();
			self._initDateTimePickers();
			self._initDataTablesFilters();

			var table = $('table#recordings-list').DataTable({
				'bStateSave': false,
				'lengthMenu': [[5, 25, 50, -1], [5, 25, 50, 'All']],
				'aoColumns': [
					null, null, null, {'sType': 'date'}, null, null, null, null, null
				],
				'initComplete': function(settings, json) {
					// move filters outside Datatables wrapper in reserved containers
					$('#recordings-list_length').appendTo('#filter-length-box');
					$('#recordings-list_filter').appendTo('#filter-search-box');
				},
				'columnDefs': [
					{
						'render': function (data, type, row) {
							return data;
						},
						'targets': 3
					}
				],
				dom: 'lfrtipB',
				buttons: [
					'csvHtml5'
				]
			});

			self._initDateTimeFilter(table);
			self._initDirectionFilter(table);
			self._initCallerIdNameFilter(table);
			self._initDurationFilter(table);
			self._initResetFiltersBtn(table);

		},

		_initResetFiltersBtn: function(table) {
			var self = this;

			$('#reset-filters').on('click', function(e) {
				e.preventDefault();

				self._setDatetimeRangeByKey(self.settings.defaultDateRangeKey, table);
				$('#direction').val('all');
				$('#caller-id-name').val('').trigger('chosen:updated');

				var $durationSlider = $('#duration-slider');
				var min = $durationSlider.slider('option', 'min');
				var max = $durationSlider.slider('option', 'max');
				$durationSlider.slider('option', 'values', [min, max]);
				$('#duration-range-min').text(min);
				$('#duration-range-max').text(max);
				$('#recordings-list_filter input[type="search"]').val('');
				table.search('').draw();
			})
		},

		_initDataTablesFilters: function() {
			var self = this;
			var parseDateTimeValue = function(rawDT) {
				// rawDT example: '2017-05-25 14:26:00'
				if(typeof(rawDT) === 'string') {
					// '2017-05-25 14:26:00' to '20170525142600'
					return rawDT.replace(/[\s\:\-]/g, '');
				}
			};

			// reset filters
			window.jQuery.fn.dataTable.ext.search = [];

			// datetime filter
			if(!self.settings.dateFilterByRequest) {
				window.jQuery.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
					var datetimeStart = parseDateTimeValue($('#date-from').val() + ' ' + $('#time-from').val() + ':00');
					var datetimeEnd = parseDateTimeValue($("#date-to").val() + ' ' + $('#time-to').val() + ':00');
					var evalDate= parseDateTimeValue(data[3]);
					//console.log(evalDate + ' >= ' + datetimeStart + ' && ' + evalDate + ' <= ' + datetimeEnd);
					return (evalDate >= datetimeStart && evalDate <= datetimeEnd);
				});
			}

			// direction filter
			window.jQuery.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
				var evalDirection = data[1];
				var direction = $('select#direction option:selected').val();
				return (direction === 'all' || direction === evalDirection);
			});

			// caller id name filter
			window.jQuery.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
				var namesArr = $("#caller-id-name").val();
				var evalName = data[2];
				if(!namesArr || typeof(namesArr) === 'undefined' || !evalName) {
					return true;
				}

				for(var n=0, len=namesArr.length; n<len; n++) {
					if(evalName === namesArr[n]) {
						return true;
					}
				}

				return false;
			});

			// duration filter
			window.jQuery.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
				var min = parseInt($('#duration-range-min').text());
				var max = parseInt($('#duration-range-max').text());
				var eval = parseInt(data[5]);

				return (eval >= min && eval <= max);
			});
		},

		_initAudioButtons: function() {
			$('.js-play-audio').not('.js-handled').click(function(e) {
				e.preventDefault();
				var $btn = $(this);
				var $btnContainer = $btn.parent();

				RemoteStorage.getRecordFileUrl($btn.data('filename'), function(url){
					$btnContainer.html(
						'<audio controls="controls" preload="auto" autoplay="autoplay">' +
						'<source src="' + url + '" type="audio/mpeg">' +
						'</audio>'
					);
				});
			}).addClass('js-handled');

			$('.js-download-audio').not('.js-handled').click(function(e) {
				var $btn = $(this);

				RemoteStorage.getRecordFileUrl($btn.attr('download'), function(url) {
					$btn.attr('href', url);
				});
			}).addClass('js-handled');
		},

		_initHandlebarsHelpers: function() {
			Handlebars.registerHelper('inc', function(value, options) {
				return parseInt(value) + 1;
			});
		}
	};

	return app;
});
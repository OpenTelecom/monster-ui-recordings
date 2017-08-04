define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var storageManager = {
		requests: {},

		subscribe: {
			'recordings.storageManager.render': 'storageManagerRender'
		},

		storageManagerRender: function(pArgs) {
			var self = this,
				args = pArgs || {},
				parent = args.parent || $('.storage-settings'),
				callback = args.callback;

			self.storageManagerGetData(args, function(data) {
				var storagesList = self.storageManagerFormatData(data.storage);
				console.log('Storages List:');
				console.log(storagesList);
				var template = $(self.getTemplate({
						name: 'layout',
						submodule: 'storageManager',
						data: {
							storages: storagesList
						}
					}));

				self.storageManagerBind(template, args, storagesList);

				$(parent).empty()
					.append(template);
			});
		},

		storageManagerGetData: function(args, callback) {
			var self = this;

			monster.parallel({
				storage: function(callback) {
					if (args.hasOwnProperty('data')) {
						callback && callback(null, args.data);
					} else {
						self.storageManagerGetStorage(function(data) {
							callback && callback(null, data);
						});
					}
				}
			}, function(err, results) {
				callback && callback(results);
			});
		},

		storageManagerGetStorage: function(callback) {
			var self = this;

			self.callApi({
				resource: 'storage.get',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function(data) {
					console.log('Storage Data:');
					console.log(data);
					callback(data.data);
				},
				error: function(data, error, globalHandler) {
					if (error.status === 404) {
						callback(undefined);
					} else {
						globalHandler(data);
					}
				}
			});
		},

		storageManagerFormatData: function(data) {
			var activeStorageId = null;
			try {
				activeStorageId = data.plan.modb.types.call_recording.attachments.handler;
			} catch(e) {
				console.log('Active storage not found');
			}
			var itemData;
			var storagesList = [];
			if(data.hasOwnProperty('attachments') && Object.keys(data.attachments).length > 0) {
				var attachments = data.attachments;
				for(var i in attachments) if(attachments.hasOwnProperty(i)) {
					itemData = {
						id: i,
						type: attachments[i].handler,
						name: attachments[i].name,
						settings: attachments[i].settings,
						isActive: false
					};

					if(activeStorageId && itemData.id === activeStorageId) {
						itemData.isActive = true;
					}
					storagesList.push(itemData)
				}
			}

			return storagesList;
		},

		storageManagerBind: function(template, args, data) {
			var self = this;

			/*template.find('.remove-settings').on('click', function() {
				var type = $(this).parents('.storage-provider-wrapper').data('plan');

				monster.ui.confirm(self.i18n.active().storagePlanManager.confirmDeleteText, function() {
					self.storageManagerDeletePlan(type, function(updatedStorage) {
						if (args.hasOwnProperty('onRemove')) {
							args.onRemove(updatedStorage);
						} else {
							self.storageManagerRender(args);
						}
					});
				}, undefined, {
					type: 'warning',
					title: self.i18n.active().storagePlanManager.confirmDeleteTitle,
					confirmButtonText: self.i18n.active().storagePlanManager.confirmDelete
				});
			});*/

			/*template.find('.choose-plan').on('click', function() {
				var type = $(this).parents('.storage-provider-wrapper').data('plan'),
					update = function() {
						monster.pub('common.storageSelector.render', {
							callback: function(attachment) {
								self.storageManagerUpdatePlan(type, attachment, function(updatedStorage) {
									toastr.success(self.i18n.active().storagePlanManager.successUpdate);

									if (!hasExistingPlan && args.hasOwnProperty('onAdd')) {
										args.onAdd(updatedStorage);
									} else {
										if (args.hasOwnProperty('onUpdate')) {
											args.onUpdate(updatedStorage);
										} else {
											self.storagePlanManagerRender(args);
										}
									}
								});
							}
						});
					},
					hasExistingPlan = _.filter(data.plans, function(v) {
							if (v.extra.type === type && v.extra.isConfigured === true) {
								return true;
							}
						}).length > 0;

				if (hasExistingPlan) {
					monster.ui.confirm(self.i18n.active().storagePlanManager.confirmChange, function() {
						update();
					}, undefined, {
						type: 'warning',
						title: self.i18n.active().storagePlanManager.confirmTitle,
						confirmButtonText: self.i18n.active().storagePlanManager.confirmYes
					});
				} else {
					update();
				}
			});*/

			/*template.on('click', '.edit-path', function() {
				var $parent = $(this).parents('.storage-provider-wrapper');
				if (!$parent.find('.path-wrapper').length) {
					self.storageManagerEditPath($parent);
				}
			});*/

			template.on('click', '.js-edit-storage', function() {
				var $editStorageBtn = $(this);
				self.storageManagerGetStorage(function(data) {

					/*var data = {
						"attachments": {
							"15757ae3-88bb-4a63-af51-96685962f6c1": {
								"handler": "s3",
								"name": "S3 Storage",
								"settings": {
									"bucket": "callrecordingtestforcanddi",
									"key": "AKIAJR52NDF2XDN3ZUFQ",
									"secret": "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"
								}
							}
						},
						"plan": {"modb": {"types": {"call_recording": {"attachments": {"handler": "15757ae3-88bb-4a63-af51-96685962f6c1"}}}}},
						"id": "65aca0e9430a05e2ef4fa6af2f54de5a"
					};*/

					var $container = $editStorageBtn.closest('.js-storage-item')
						.find('.js-item-settings-wrapper')
						.hide();

					var uuid = $editStorageBtn.closest('.js-storage-item').data('uuid');

					if(data.attachments.hasOwnProperty(uuid)) {
						var storageData = data.attachments[uuid];
					}

					var template = $(self.getTemplate({
						name: 'item-settings',
						submodule: 'storageManager',
						data: {
							bucket: storageData.settings.bucket,
							key: storageData.settings.key,
							secret: storageData.settings.secret
						}
					}));

					$container.empty()
						.append(template);
					$container.slideDown();

					self.storageManagerSettingsBind($container);

				})
			});

			template.on('click', '.js-remove-storage', function() {
				alert('remove storage item!');
			});

			template.on('click', '.js-create-storage', function() {
				alert('create storage!');
			});

			template.on('click', '.js-set-default-storage', function() {
				alert('set default storage!');
			});
		},
		storageManagerSettingsBind: function($settingsContainer) {
			var self = this;

			$settingsContainer.find('.js-cancel').on('click', function(e) {
				e.preventDefault();
				$settingsContainer.slideUp(400, function(){
					$settingsContainer.empty();
				});
			});

			$settingsContainer.find('.js-save').on('click', function(e) {
				e.preventDefault();
				self.storageManagerSaveStorage();
			});
		},
		storageManagerSaveStorage: function(){
			alert('Save Item Storage');
		}
	};

	return storageManager;
});

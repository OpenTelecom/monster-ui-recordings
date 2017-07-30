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
				var formattedData = self.storageManagerFormatData(data, args);
				console.log('formattedData');
				console.log(formattedData);
				var template = $(self.getTemplate({
						name: 'layout',
						submodule: 'storageManager',
						data: formattedData
					}));

				self.storageManagerBind(template, args, formattedData);

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

		storageManagerFormatData: function(data, args) {
			var formattedData = {
					countAttachments: data.storage && data.storage.hasOwnProperty('attachments') ? _.size(data.storage.attachments) : 0,
					plans: []
				},
				forceTypes = args.hasOwnProperty('forceTypes') ? args.forceTypes : [],
				hideOtherTypes = args.hasOwnProperty('hideOtherTypes') ? args.hideOtherTypes : false,
				plansNotFound = args.hasOwnProperty('forceTypes') ? [].concat(args.forceTypes) : [];

			if (data.storage && data.storage.hasOwnProperty('plan') && data.storage.plan.hasOwnProperty('modb') && data.storage.plan.modb.hasOwnProperty('types')) {
				_.each(data.storage.plan.modb.types, function(plan, planType) {
					// If we allow display of all types, or if not, if the plan is included in the forced types to display
					if (!hideOtherTypes || forceTypes.indexOf(planType) >= 0) {
						if (data.storage.attachments.hasOwnProperty(plan.attachments.handler)) {
							plan.extra = {
								type: planType,
								isConfigured: true,
								detailAttachment: data.storage.attachments[plan.attachments.handler]
							};
							formattedData.plans.push(plan);

							// If we added the plan to the list, then we remove it to our array tracking the plans not found
							if (plansNotFound.indexOf(planType) >= 0) {
								plansNotFound.splice(plansNotFound.indexOf(planType), 1);
							}
						}
					}
				});
			}

			// Finally, if we still have some plans that the user want to edit, but that weren't found in the storage plan, we add them to the list as an unconfigured plan
			_.each(plansNotFound, function(type) {
				formattedData.plans.push({
					extra: {
						type: type,
						isConfigured: false
					}
				});
			});

			return formattedData;
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
				alert('open settings!');
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
		}
	};

	return storageManager;
});

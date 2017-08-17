// Adapter module for manipulation with data of remote storages
define(function(require) {
	var $ = require('jquery'),
		AWS = require('aws-sdk');

	// Common settings
	var settings = {
		'debug': true,
		'storage': 'aws'
	};

	// AWS methods
	var AWSadapter = {
		settings: {
			'key': null,
			'secret': null,
			'bucketName': null,
			'bucketRegion': null,
			'version': null
		},

		init: function(params) {
			var self = this;
			// Merge object2 into object1
			$.extend(self.settings, params);

			self.AWS = window.AWS;

			self.AWS.config.update({
				region: self.settings.bucketRegion,
				version: self.settings.version,
				accessKeyId: self.settings.key,
				secretAccessKey: self.settings.secret
			});

			self.AWS.config.region = self.settings.bucketRegion;
			// AWS.config.update({region: 'us-east-1'});
		},
		getS3files: function(callback) {
			var self = this;

			var bucket = new self.AWS.S3({
				params: {
					Bucket: self.settings.bucketName,
					s3ForcePathStyle: true
				}
			});

			bucket.listObjects({
				//Prefix: prefix
			}, function (err, bucketContent) {
				if (err) {
					methods.log('ERROR: ' + err);
					if(typeof(callback) === 'function') {
						callback(null);
					}
				} else {

					var baseUrl = this.request.httpRequest.endpoint.href;
					//var bucketUrl = href + albumBucketName + '/';
					console.log(baseUrl);

					var bucketBaseUrl = baseUrl + AWSadapter.settings.bucketName;
					console.log(baseUrl + AWSadapter.settings.bucketName);

					methods.log(bucketContent);

					if(typeof(callback) === 'function') {
						callback(bucketContent, bucketBaseUrl);
					}
				}
			});
		},
		getS3File: function(fileKey, callback) {
			var self = this;

			var bucket = new self.AWS.S3({
				params: {
					Bucket: self.settings.bucketName
				}
			});

			bucket.getObject({
				Key: fileKey
			}, function(err, data) {
				if(err) {
					// an error occurred
					console.log(err, err.stack);
				} else {
					// successful response
					console.log(data);

					if(typeof(callback) === 'function') {
						callback(data);
					}
				}
			});
		},
		getS3FileUrl: function(fileKey, callback) {
			var self = this;

			var bucket = new self.AWS.S3({
				params: {
					Bucket: self.settings.bucketName
				}
			});

			var url = bucket.getSignedUrl('getObject', {
				Key: fileKey
			});

			console.log('The File URL is:');
			console.log(url);

			if(typeof(callback) === 'function') {
				callback(url);
			}
		}
	};


	// common methods
	var methods = {
		init: function(storageType, params) {
			switch(storageType) {
				default: //case 'aws':
					settings.storage = 'aws';
					AWSadapter.init(params);
			}
		},
		log: function(msg) {
			if(settings.debug) {
				console.log(msg);
			}
		},
		getRecordsFilesList: function(callback) {
			switch(settings.storage) {
				default: //case 'aws':
					AWSadapter.getS3files(callback);
			}
		},
		getRecordFile: function(filename, callback) {
			switch(settings.storage) {
				default: //case 'aws':
					AWSadapter.getS3File(filename, callback);
			}
		},
		getRecordFileUrl: function(filename, callback) {
			switch(settings.storage) {
				default: //case 'aws':
					AWSadapter.getS3FileUrl(filename, callback);
			}
		}

	};

	// public methods
	return {
		init: function(storageType, params) {
			methods.init(storageType, params);
		},
		getRecordsFiles: function(callback) {
			methods.getRecordsFilesList(callback);
		},
		getRecordFile: function(filename, callback) {
			methods.getRecordFile(filename, callback);
		},
		getRecordFileUrl: function(filename, callback) {
			methods.getRecordFileUrl(filename, callback);
		}
	}
});

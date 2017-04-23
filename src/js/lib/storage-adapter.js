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
			'key': null, //'AKIAJR52NDF2XDN3ZUFQ',
			'secret': null, //'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',
			'bucketName': null, //'callrecordingtestforcanddi',
			'bucketRegion': null, //'eu-west-2',
			'version': null //'latest'
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
				} else {

					var baseUrl = this.request.httpRequest.endpoint.href;
					//var bucketUrl = href + albumBucketName + '/';
					console.log(baseUrl);

					var bucketBaseUrl = baseUrl + AWSadapter.settings.bucketName;
					console.log(baseUrl + AWSadapter.settings.bucketName);

					bucketContent.Contents.forEach(function(file, i, arr) {
						//bucketContent.Contents[i]['url'] = bucketBaseUrl + '/' + file.Key;
						if(file.Size > 0) {
							file['url'] = (bucketBaseUrl + '/' + file.Key).replace(/\s/g, '+');
						}
					});

					// https://s3.eu-west-2.amazonaws.com/callrecordingtestforcanddi/recordings/gon-gon song - short.mp3

					//s3Client.getResourceUrl("your-bucket", "some-path/some-key.jpg");

					// http(s)://<bucket>.s3.amazonaws.com/<object>
					// http(s)://s3.amazonaws.com/<bucket>/<object>
					// https://s3.amazonaws.com/callrecordingtestforcanddi/recordings/gon-gon song - short.mp3

					methods.log(bucketContent);

					if(typeof(callback) === 'function') {
						callback(bucketContent, bucketBaseUrl);
					}
				}
			});
		}/*,
		getS3file: function(){
			s3.getObject({Bucket: 'bucket', Key: 'key'}).on('success', function(response) {
				console.log("Key was", response.request.params.Key);
			}).send();
		}*/
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
		}

	};

	// public methods
	return {
		init: function(storageType, params) {
			methods.init(storageType, params);
		},
		getRecordsFiles: function(callback) {
			methods.getRecordsFilesList(callback);
		}
	}
});

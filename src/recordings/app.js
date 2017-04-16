define(function(require) {
    var $ = require('jquery'),
        _ = require('underscore'),
        monster = require('monster'),
        AWS = require('aws-sdk');

    var app = {
        name: 'recordings',

        css: [ 'app' ],

        settings: {
            'key': 'AKIAJR52NDF2XDN3ZUFQ',
            'secret': '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',
            'bucketName': 'callrecordingtestforcanddi',
            'bucketRegion': 'eu-west-2',
            'version': 'latest'
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

            AWS.config.update({
                region: self.settings.bucketRegion,
                version: self.settings.version,
                accessKeyId: self.settings.key,
                secretAccessKey: self.settings.secret
            });

            AWS.config.region = self.settings.bucketRegion;
            // AWS.config.update({region: 'us-east-1'});

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
            var self = this,
                args = pArgs || {},
                $parent = args.container || $('#recordings_app_container .app-content-wrapper');

            var template = $(monster.template(self, 'layout', {
                user: monster.apps.auth.currentUser
            }));

            $parent.fadeOut(function() {
                $(this).empty()
                    .append(template)
                    .fadeIn();
            });

            var bucket = new AWS.S3({
                params: {
                    Bucket: self.settings.bucketName
                }
            });

            var $container = $('#recording-list');
            self._renderRecordingsList(bucket, $container);
        },

        _renderRecordingsList: function(bucket, $container){
            bucket.listObjects({
                //Prefix: prefix
            }, function (err, data) {
                if (err) {
                    console.log('ERROR: ' + err);
                } else {
                    console.log(data);
                    var $list = $('<ul></ul>').appendTo($container);

                    data.Contents.forEach(function (obj) {
                        $('<li>' + obj.Key + '</li>').appendTo($list);
                    });
                }
            });
        }/*,
        _putObjects: function() {
            bucket.putObject(params, function (err, data) {
             if (err) {
                 results.innerHTML = 'ERROR: ' + err;
             } else {
                listObjs();
             }
             });
        }*/
    };

    return app;
});

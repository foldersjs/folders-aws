// Folders.io connector to AWS
var AWS = require('aws-sdk');
var path = require('path');


/*
 * AWS SDK - Recommends passing authentication in the environment:
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */



var FoldersAws = function (prefix, options) {

    this.configure(options);
    this.prefix = prefix || "/http_window.io_0:aws/";
    console.log("inin foldersAws,", this.bucket || 'All Buckets');

};

FoldersAws.prototype.configure = function (options) {
    var self = this;
    /*
     * load credentials from disk file 
     */
    if (options.credentialsFilePath) {
        AWS.config.loadFromPath(options.credentialsFilePath);
    }
    /*
     * hard-code credentials inside an application. 
     * Use this method only for small personal 
     * scripts or for testing purposes.
     */
    else if (options.accessKeyId && options.secretAccessKey) {
        AWS.config.update({
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey
        });
    }


    if (typeof options.service == 'string') {
        self.singleService = true;
        self.service = options.service.toUpperCase();
    } else if (options.service instanceof Array) {
        self.multipleService = true;
        self.service = options.service;
    } else if (!options.service) {
        self.allService = true;

    }

    if (typeof options.region == 'string') {
        self.singleRegion = true;
        self.region = options.region.toLowerCase();
    } else if (options.region instanceof Array) {
        self.multipleRegion = true;
        self.region = options.region;
    } else if (!options.region) {
        self.allRegion = true;
    }


    self.bucket = options.bucket;

};


/*
var getUri = function(path, cb) {
        var s3 = new AWS.S3();
        var params = {Bucket: 'myBucket', Key: 'myKey'};
        s3.getSignedUrl('getObject', params, function (err, url) {
          console.log("The URL is", url);
        });
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
var params = {Bucket: 'myBucket', Key: 'myKey', Expires: 60}; // seconds
var params = {Bucket: 'myBucket', Key: 'myKey'};
var url = s3.getSignedUrl('putObject', params);

}
*/

module.exports = FoldersAws;

FoldersAws.prototype.updateRegion = function (region) {

    AWS.config.update({
        region: region || 'us-west-2'
    });

};

var getServiceRegion = function (self, path) {

    var service, region;

    if (self.multipleService) {

        if (path[0] == '/') {
            path = path.replace('/', '');
        }
        var parts = path.split('/');
        service = parts[0];

        if (!(self.service.indexOf(service) > -1)) {
            console.log('This service not configured in your list ');
            return;

        }
        path = parts.slice(1, parts.length).join('/');

        //code to join parts into path except parts[0]

    } else if (self.singleService) {

        service = self.service;

    } else if (self.allService) {

        if (path[0] == '/') {
            path = path.replace('/', '');
        }
        var parts = path.split('/');
        service = parts[0];
        path = parts.slice(1, parts.length).join('/');
    }

    if (self.multipleRegion) {

        var parts = path.split('/');
        region = parts[0];

        if (!(self.region.indexOf(region) > -1)) {
            console.log('This region not configured in your list ');
            return;

        }
        path = parts.slice(1, parts.length).join('/');

    } else if (self.singleRegion) {

        region = self.region;

    } else if (self.allRegion) {


        var parts = path.split('/');
        region = parts[0];
        path = parts.slice(1, parts.length).join('/');
    }

    return [service.toUpperCase(), region.toLowerCase(), path];
};



var getServiceObject = function (service, options) {

    var t = new AWS[service]();
    var s = require('./services/' + service);
    return new s(t, options);
};


/*
 * If they pass an array of bucket names,
 *  then we'd use those as the root folder names
 */




FoldersAws.prototype.features = FoldersAws.features = {
    cat: true,
    ls: true,
    write: true,
    server: false
};



FoldersAws.prototype.write = function (path, data, cb) {


    var self = this,
        service, region, pathPrefix;
    var arr = getServiceRegion(self, path);
    service = arr[0];
    region = arr[1];
    pathPrefix = arr[2];
    this.updateRegion(region);
    this.serviceObj = getServiceObject(service, {
        bucket: self.bucket
    });
    self.serviceObj.write(pathPrefix, data, cb);

};


FoldersAws.prototype.cat = function (path, cb) {
    var self = this,
        service, region, pathPrefix;
    var arr = getServiceRegion(self, path);
    service = arr[0];
    region = arr[1];
    pathPrefix = arr[2];
    this.updateRegion(region);
    this.serviceObj = getServiceObject(service, {
        bucket: self.bucket
    });
    self.serviceObj.cat(pathPrefix, cb);

};

FoldersAws.prototype.ls = function (path, cb) {

    var self = this,
        service, region, pathPrefix;
    var arr = getServiceRegion(self, path);
    service = arr[0];
    region = arr[1];

    pathPrefix = arr[2];
    this.updateRegion(region);
    this.serviceObj = getServiceObject(service, {
        bucket: self.bucket
    });
    self.serviceObj.ls(pathPrefix, cb);

};
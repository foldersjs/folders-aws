// Folders.io connector to AWS
var AWS = require('aws-sdk');
var Region = require('./regions/region.js');
var path = require('path');
var assert = require('assert');

/*
 * AWS SDK - Recommends passing authentication in the environment:
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

/*
 * ALL Amazon services supported by this module
 */

var ALL_SERVICES = ['S3', 'EC2'];

var FoldersAws = function (prefix, options) {

    assert.equal(typeof (options), 'object',
        "argument 'options' must be a object");

    this.options = options || {};
    this.configure(this.options);
    this.prefix = prefix || "/http_window.io_0:aws/";
    console.log("inin foldersAws,", this.bucket || 'All Buckets');

};

FoldersAws.dataVolume = function () {

    return Region.dataVolume();
};

FoldersAws.prototype.configure = function (options) {
    var self = this;
    var accessKeyIdEnv = process.env.AWS_ACCESS_KEY_ID;
    var secretAccessKeyEnv = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyIdEnv && secretAccessKeyEnv) {

        AWS.config.update({


            accessKeyId: accessKeyIdEnv,
            secretAccessKey: secretAccessKeyEnv
        });
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
    } else {

        throw new Error('Missing Credetials in Config');
    }

    /*
	else{
	
		throw new Error('Error ! accessKeyId and / or secretAccessKey Missing');
	}*/

    if (typeof options.service == 'string') {
        self.singleService = true;
        self.service = options.service.toUpperCase();
    } else if (options.service instanceof Array) {
        self.multipleService = true;
        self.service = options.service.map(function (x) {
            return x.toUpperCase();
        });
    } else if (!options.service) {
        self.allService = true;

    }


    self.region = options.region;
    self.bucket = options.bucket;
    self.partSize = options.partSize;
    self.queueSize = options.queueSize;

};


module.exports = FoldersAws;

var getService = function (self, path) {

    var service;
    var parts = path.split('/');
    service = parts[0].toUpperCase();
    path = parts.slice(1, parts.length).join('/');

    return [service, path];
};



var getRegionObject = function (options) {


    return new Region(AWS, options);
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

FoldersAws.prototype.ls = function (path, cb) {


    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var self = this,
        service, pathPrefix, arr;

    if (path && path.length > 0) {
        if (path[path.length - 1] != '/') path += '/';
    }

    path = (path == '/' ? null : path.slice(1));


    if (path == null) {

        service = self.service;
        pathPrefix = path;

    } else {
        //path = S3/uswest/
        arr = getService(self, path);
        service = arr[0];

        pathPrefix = arr[1];
    }


    if (self.allService) {

        if (path == null) {

            //listing service as folders
            return cb(null, serviceAsFolders(ALL_SERVICES));


            // start from here now 
        }

    }

    if (self.multipleService) {
        if (path == null) {

            //listing service as folders
            return cb(null, serviceAsFolders(service));

            // start from here now 
        }


    }

    if (self.singleService) {
        if (path == null) {

            //listing service as folders
            return cb(null, serviceAsFolders([service]));

            // start from here now 
        }


    }

    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket
    });

    return self.regionObj.ls(service, pathPrefix, cb);

};

var serviceAsFolders = function (serv) {


    assert.ok(serv instanceof Array,
        "argument 'serv' must be a array");

    var data = [];
    for (var i = 0; i < serv.length; ++i) {
        var o = {};
        o.name = serv[i];
        o.extension = '+folder';
        o.size = 0;
        o.type = "";
        o.fullPath = '/' + o.name;
        //o.uri = "#" + this.prefix + o.fullPath;
        o.uri = o.fullPath;
        o.modificationTime = Date.now();
        if (!o.meta) o.meta = {
            'group': 'aws',
            'owner': 'aws',
            'permission': 0
        };
        var cols = ['permission', 'owner', 'group'];
        data.push(o);

    }
    return data;

};

FoldersAws.prototype.write = function (path, data, cb) {


    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");


    assert.equal(typeof (data), 'object',
        "argument 'path' must be a string");


    var self = this,
        service, pathPrefix, arr;

    if (!path) {

        return cb(new Error('invalid url '), null);
    }

    path = path.slice(1);

    arr = getService(self, path);
    service = arr[0];
    pathPrefix = arr[1];
    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket,
        partSize: self.partSize,
        queueSize: self.queueSize
    });
    return self.regionObj.write(service, pathPrefix, data, cb);

};


FoldersAws.prototype.cat = function (path, cb) {


    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var self = this,
        service, pathPrefix, arr;

    if (!path) {

        return cb(new Error('invalid url '), null);
    }

    path = path.slice(1);

    arr = getService(self, path);
    service = arr[0];
    pathPrefix = arr[1];
    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket
    });
    return self.regionObj.cat(service, pathPrefix, cb);
};

FoldersAws.prototype.unlink = function (path, cb) {


    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var self = this,
        service, pathPrefix, arr;

    if (!path) {

        return cb(new Error('invalid url '), null);
    }

    path = path.slice(1);

    arr = getService(self, path);
    service = arr[0];
    pathPrefix = arr[1];
    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket
    });
    return self.regionObj.unlink(service, pathPrefix, cb);

};


FoldersAws.prototype.rmdir = function (path, cb) {


    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var self = this,
        service, pathPrefix, arr;


    if (path && path.length > 0) {
        if (path[path.length - 1] != '/') path += '/';
    } else {

        return cb(new Error('invalid url '), null);
    }

    if (path.split('/').length < 6) {

        return cb(new Error('Unable to delete configured services'), null);

    }

    path = path.slice(1);

    arr = getService(self, path);
    service = arr[0];
    pathPrefix = arr[1];
    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket
    });
    return self.regionObj.rmdir(service, pathPrefix, cb);

};


FoldersAws.prototype.mkdir = function (path, cb) {

    assert.equal(typeof (path), 'string',
        "argument 'path' must be a string");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var self = this,
        service, pathPrefix, arr;
    if (path && path.length > 0) {
        if (path[path.length - 1] != '/') path += '/';
    } else {

        return cb(new Error('invalid url '), null);
    }

    if (path.split('/').length < 6) {

        return cb(new Error('Unable to mkdir inside configured services'), null);

    }

    path = path.slice(1);

    arr = getService(self, path);
    service = arr[0];
    pathPrefix = arr[1];
    self.regionObj = getRegionObject({
        region: self.region,
        bucket: self.bucket
    });
    return self.regionObj.mkdir(service, pathPrefix, cb);
};

FoldersAws.prototype.dump = function () {

    return this.options;

};


FoldersAws.isConfigValid = function (config, cb) {

    assert.equal(typeof (config), 'object',
        "argument 'config' must be a object");

    assert.equal(typeof (cb), 'function',
        "argument 'cb' must be a function");

    var accessKeyId = config.accessKeyId;
    var secretAccessKey = config.secretAccessKey;
    var service = config.service;
    var region = config.region;
    var bucket = config.bucket;
	var checkConfig = config.checkConfig;

    if (checkConfig == false) {

        return cb(null, config);
    }

    AWS.config.update({

        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });

    var s3 = new AWS.S3();

    if (!bucket) {
		// just for checking access credentials validity if no bucket is provided
        bucket = new Array('test');

    } else if (typeof bucket == 'string') {

        bucket = new Array(bucket);
    }


    var isValid = true;
    var bucketsChecked = 0;

    for (var i = 0; i < bucket.length; ++i) {

        var params = {
            Bucket: bucket[i] /* required */
        };

        s3.getBucketAcl(params, function (err, data) {
            bucketsChecked++;


            
            if (err) {
				console.log(err);
                if (err.code == 'SignatureDoesNotMatch' || err.code == 'InvalidAccessKeyId' || params.Bucket != 'test')
                    isValid = false;
            }

            if (bucketsChecked == bucket.length) {

                if (!isValid) {
                    return cb(new Error("Error in configuring buckets "));
                } else {

                    return cb(null, config);
                }
            }

        });

    }

};
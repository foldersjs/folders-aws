var path = require('path');
var mime = require('mime');
var s3, AWS;


//var tree = {};

var S3 = function (aws, service, options) {
    AWS = aws;
    s3 = service;
    this.configure(options);

};


S3.prototype.configure = function (options) {


    var self = this;

    if (typeof options.bucket == 'string') {
        self.singleBucket = true;
    } else if (options.bucket instanceof Array) {
        self.multipleBucket = true;
    } else if (!options.bucket) {
        self.allBucket = true;
    }

    self.bucket = options.bucket;
    self.partSize = options.partSize;
    self.queueSize = options.queueSize;



};

module.exports = S3;


S3.prototype.ls = function (service, region, path, cb) {

    AWS.config.update({
        region: region || 'us-west-2'
    });

    path = (path == '' ? null : path);
    var self = this,
        bucket, pathPrefix, arr, result;
    if (path == null) {

        bucket = self.bucket;
        pathPrefix = path;

    } else {
        arr = getBucketKey(self, path);
        bucket = arr[0];
        pathPrefix = arr[1];
    }


    if (self.allBucket) {

        if (path == null) {

            //listing buckets as folders

            listAllBuckets(function (err, data) {
                if (err) {

                    return cb(err);

                }
                return cb(null, bucketAsFolders(data, '/' + service + '/' + region + '/'))

            });

            // start from here now 
        } else {

            listBucket(self, bucket, pathPrefix, '/' + service + '/' + region + '/' + bucket + '/', cb);


        }

    }

    if (self.multipleBucket) {
        if (path == null) {

            //listing buckets as folders
            return cb(null, bucketAsFolders(bucket, '/' + service + '/' + region + '/'));

            // start from here now 
        } else {

            listBucket(self, bucket, pathPrefix, '/' + service + '/' + region + '/' + bucket + '/', cb);

        }


    }


    if (self.singleBucket) {

        if (path == null) {

            //listing buckets as folders
            return cb(null, bucketAsFolders([bucket], '/' + service + '/' + region + '/'));

            // start from here now 
        } else {

            listBucket(self, bucket, pathPrefix, '/' + service + '/' + region + '/' + bucket + '/', cb);

        }
    }



};


/*
 * List the contents of bucket and   
 * translates them into folders.io records
 */
var listBucket = function (self, bucket, pathPrefix, dir, cb) {
    //pathPrefix should always end with '/'
    //if (pathPrefix.indexOf('/', pathPrefix.length - 1) == -1) {
    //   pathPrefix+='/';
    //}

    lsBucket(bucket, pathPrefix, function (err, data) {

        if (err) {
            console.log("error occured in services listBucket() ", err);
            return cb(err, null);

        }

        data = self.asFolders(pathPrefix, data, dir);

        return cb(null, data);

    });


};

/*
 * This function translates aws records into folders.io
 * compatible records
 *
 */
var bucketAsFolders = function (bucket, dir) {
    var data = [];
    for (var i = 0; i < bucket.length; ++i) {
        var o = {};
        o.name = bucket[i];
        o.extension = '+folder';
        o.size = 0;
        o.type = "";
        o.fullPath = dir + o.name;
        //o.uri = "#" + this.prefix + o.fullPath;
        o.uri = o.fullPath;
        if (!o.meta) o.meta = {
            'group': 'aws',
            'owner': 'aws',
            'permission': 0
        };
        //FIXME: how to get modification date for buckets ?
        o.modificationTime = Date.now();
        var cols = ['permission', 'owner', 'group'];
        data.push(o);

    }
    return data;


};

/*
 * This methods translates s3 records to folders.io compatible records.
 * This method also translates from flat file system to tree structure 
 */
S3.prototype.asFolders = function (pathPrefix, data, dir) {

    //pathPrefix = (pathPrefix == null ? null : pathPrefix.slice(1));
    if (pathPrefix && pathPrefix.length > 0) {
        if (pathPrefix[pathPrefix.length - 1] != '/') pathPrefix += '/';
    }



    var z = [];
    for (var i = 0; i < data.length; ++i) {

        if (data[i].Key != pathPrefix) {
            var name = data[i].Key.replace(pathPrefix, "");


            var res = name.split("/");

            /*
             * Neglecting child records
             */
            if (!res[1]) {
                var o = {};
                o.name = (name.charAt(name.length - 1) == '/' ? name.substr(0, name.length - 1) : name);
                o.extension = path.extname(name).substr(1, path.extname(name).length - 1) || '+folder';
                o.size = data[i].Size || 0;
                o.type = (o.extension == '+folder' ? "" : mime.lookup(o.extension));
                if (o.extension == '+folder') {
                    o.fullPath = dir + data[i].Key.substr(0, data[i].Key.length - 1);
                } else {
                    o.fullPath = dir + data[i].Key;
                }

                //o.uri = "#" + this.prefix + o.fullPath;
                o.uri = o.fullPath;
                if (!o.meta) o.meta = {
                    'group': 'aws',
                    'owner': 'aws',
                    'permission': 0
                };
                o.modificationTime = Date.parse(data[i].LastModified);
                var cols = ['permission', 'owner', 'group'];

                z.push(o);
            }
        }
    }
    return z;

};


S3.prototype.cat = function (path, cb) {


    var self = this,
        bucket, pathPrefix, arr;

    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];
    cat(bucket, pathPrefix, cb);


};


S3.prototype.write = function (path, data, cb) {



    var self = this,
        bucket, key, arr, options;

    arr = getBucketKey(self, path);
    bucket = arr[0];
    key = arr[1];



    options = {
        partSize: self.partSize,
        queueSize: self.queueSize
    };
    write(bucket, key, data, options, cb);

};


/*
 * Removes the null version (if there is one) of an object and inserts a delete marker, 
 * which becomes the latest version of the object. If there isn't a null version, 
 * Amazon S3 does not remove any objects.
 * 
 */
S3.prototype.unlink = function (path, cb) {

    var self = this,
        bucket, pathPrefix, arr;

    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];
    unlink(bucket, pathPrefix, cb);

};

/*
 * 
 * Deleting a folder
 */

S3.prototype.rmdir = function (path, cb) {

    var self = this,
        bucket, pathPrefix, arr;

    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];


    rmdir(bucket, pathPrefix, cb);

};

/*
 * 
 * creating a folder
 */

S3.prototype.mkdir = function (path, cb) {

    var self = this,
        bucket, pathPrefix, arr;

    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];
    return mkdir(bucket, pathPrefix, cb);

};

var mkdir = function (bucket, path, cb) {
    var params = {
        Bucket: bucket,
        /* required */
        Key: path,
        /* required */

    };




    s3.headObject(params, function (err, data) {
        if (err) {


            if (err.code === 'NotFound') {


                // object doesnot exist .We can create dir now 




                s3.putObject(params, function (err, data) {
                    if (err) {

                        console.log(err, err.stack);
                        return cb(err) // an error occurred
                    } else {
                        return cb();



                    } // successful response
                });



            } else {
                // some other error
                return cb(err)

            }

        } // an error occurred
        else {
            return cb(new Error("mkdir: cannot create directory  File exists"));
        } // error response
    });




};

var rmdir = function (bucket, path, cb) {


    rmfolder(bucket, path, cb);

};

var rmfolder = function (bucket, path, cb) {


    // delete all files in folder 
    // bucket deletion is not supported 	
    lsBucket(bucket, path, function (err, data) {


        var objects = data.map(function (o) {
            return {
                Key: o.Key
            }
        });

        if (objects.length > 0) {

            var params = {
                Bucket: bucket,
                /* required */
                Delete: { /* required */
                    Objects: objects
                }

            };

            s3.deleteObjects(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    cb(err)
                } // an error occurred

                // now delete the folder itself
                unlink(bucket, path, cb);

            });

        } else {

            // this is for deleting empty buckets 
            // this part will never execute 
            unlink(bucket, path, cb);

        }

    });


};


/*
 * Deletes a single aws-s3 object
 */
var unlink = function (bucket, path, cb) {

    var params = {
        Bucket: bucket,
        /* required */
        Key: path /* required */

    };

    s3.deleteObject(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            cb(err);
        } // an error occurred
        else {
            cb(null, data);
        } // successful response
    });

};

/*
 * returns all buckets 
 * associated with this 
 * credentials
 */
var listAllBuckets = function (cb) {


    s3.listBuckets(function (err, data) {

        if (err) {
            console.log(err, err.stack);
            cb(err, null);
        } // an error occurred
        else {
            bucket = data.Buckets.map(function (item) {
                return (item.Name);


            });
            cb(null, bucket);

        }
    });


};

var lsBucket = function (bucket, pathPrefix, cb) {
    var result;


    s3.listObjects({
        Bucket: bucket,
        Prefix: pathPrefix
    }, function (err, data) {


        if (err) {
            console.log("error occured in folders-aws lsBucket() ", err);
            return cb(err, null);

        } else {
            result = data.Contents;
            return cb(null, result);

        }
    });

};


/* 
 * FIXME: write will not work over 
 * ftp-aws connections until 
 * stream.emit('open','') is added .
 * appropriately.Right now it is added 
 * at https://github.com/sstur/nodeftpd/blob/master/lib/ftpd.js#L1280
 * to make it work
 */

var write = function (bucket, key, stream, options, cb) {
    var params = {
        Bucket: bucket,
        Key: key,
        Body: stream
    };

    s3.upload(params, options).
    on('httpUploadProgress', function (evt) {


        console.log(evt);
    }).
    on('httpError', function (evt) {

        console.log(evt);
    }).
    on('complete', function (evt) {

        console.log(evt);

    }).
    send(function (error, response) {


        if (error) {
            console.error(error);

            return cb(error, null);

        }


        return cb(null, "created success");
    });



};

var cat = function (bucket, key, cb) {

    var params = {
        Bucket: bucket,
        /* required */

        Key: key /* required */
    };


    s3.headObject(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            return cb(err);

        } // an error occurred
        else {

            // FIXME: See if we can get some info on the remote file, esp. length.
            // headObject / listObjects  works well enough usually.


            var file = s3.getObject(params).createReadStream();

            cb(null, {
                stream: file,
                size: data.ContentLength,
                name: path.basename(key)
            });

        } // successful response


    });


};


var getBucketKey = function (self, path) {

    var bucket;
    var parts = path.split('/');
    bucket = parts[0];
    path = parts.slice(1, parts.length).join('/');
    return [bucket, path];
};
var path = require('path');
var mime = require('mime');
var s3, AWS;


//var tree = {};

var S3 = function (aws, service, options) {
    AWS = aws;
    s3 = service;
    this.configure(options);

}



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


}

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

                    return cb(err)

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


}

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
        var cols = ['permission', 'owner', 'group'];
        data.push(o);

    }
    return data;

}

/*
 * This methods translates s3 records to folders.io compatible records.
 * This method also translates from flat file system to tree structure 
 */
S3.prototype.asFolders = function (pathPrefix, data, dir) {

    //pathPrefix = (pathPrefix == null ? null : pathPrefix.slice(1));
    if (pathPrefix && pathPrefix.length > 0) {
        if (pathPrefix[pathPrefix.length - 1]!='/') pathPrefix+='/';
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
                o.name = name;
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
                var cols = ['permission', 'owner', 'group'];

                z.push(o);
            }
        }
    }
    return z;

};

S3.prototype.cat = function (path, cb) {

    var self = this,
        bucket, key, arr;
    arr = getBucketKey(self, path);
    bucket = arr[0];
    key = arr[1];
    cat(bucket, key, cb);


};


S3.prototype.write = function (path, data, cb) {

    var self = this,
        bucket, key, arr;
    arr = getBucketKey(self, path);
    bucket = arr[0];
    key = arr[1];


    write(bucket, key, data, cb);

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

}

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
}


var write = function (bucket, key, stream, cb) {

    var params = {
        Bucket: bucket,
        Key: key,
        Body: stream
    };
    s3.upload(params).
    on('httpUploadProgress', function (evt) {
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
        Key: key
    };
    // FIXME: See if we can get some info on the remote file, esp. length.
    // headObject / listObjects  works well enough usually.
    var file = s3.getObject(params).createReadStream();

    cb(null, {
        stream: file
            //size : fileStatus.length,
            //name : fileStatus.pathSuffix
    });
};

var getBucketKey = function (self, path) {



    var bucket;
    var parts = path.split('/');
    bucket = parts[0];
    path = parts.slice(1, parts.length).join('/');
    return [bucket, path];

}





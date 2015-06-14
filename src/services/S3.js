var s3;


var S3 = function (service, options) {
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


S3.prototype.ls = function (path, cb) {

    var self = this,
        bucket, pathPrefix, arr;
    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];
    lsBucket(bucket, pathPrefix, cb);

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
var listAllBuckets = function (path, cb) {


    s3.listBuckets(function (err, data) {

        if (err) {
            console.log(err, err.stack);
            cb(err, null);
        } // an error occurred
        else {
            bucket = data.Buckets.map(function (item) {
                return (item.Name);

            })
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

    var bucket, key;

    if (self.multipleBucket) {
        var parts = path.split('/')
        bucket = parts[0];
        if (!(self.bucket.indexOf(bucket) > -1)) {
            console.log('This bucket not configured in your list ', null);
            return;

        }
        key = parts[1];

    } else if (self.singleBucket) {
        key = path;
        bucket = self.bucket;
    } else if (self.allBucket) {
        var parts = path.split('/')
        bucket = parts[0];
        key = parts[1];

    }
    return [bucket, key];

}

module.exports = S3;
var path = require('path');
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
        bucket, pathPrefix, arr, result;
    arr = getBucketKey(self, path);
    bucket = arr[0];
    pathPrefix = arr[1];

    if (self.allBucket) {
        listAllBuckets(cb);
        return;
    }
    lsBucket(bucket, pathPrefix, function (err, data) {
        result = self.asFolders(data);
        cb(null, result);

    });

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

    if (self.multipleBucket) {
        var parts = path.split('/');
        bucket = parts[0];
        if (!(self.bucket.indexOf(bucket) > -1)) {
            console.log('This bucket not configured in your list ', null);
            return;

        }


        path = parts.slice(1, parts.length).join('/');
    } else if (self.singleBucket) {

        bucket = self.bucket;
    } else if (self.allBucket) {
        var parts = path.split('/');
        bucket = parts[0];

        path = parts.slice(1, parts.length).join('/');

    }
    return [bucket, path];

}

S3.prototype.asFolders = function ( /*prefix,*/ files) {
    var out = [],
        self = this;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        var o = {
            name: file.Key
        };
        o.fullPath = o.name;
        o.uri = "#" + self.prefix + o.fullPath;
        o.size = file.Size || 0;
        o.extension = path.extname(o.name).substr(1, path.extname(o.name).length - 1) || 'DIR';
        o.type = "text/plain";
        o.modificationTime = file.LastModified;
        out.push(o);


    }
    return out;

};


module.exports = S3;
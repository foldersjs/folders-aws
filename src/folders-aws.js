// Folders.io connector to AWS
var AWS = require('aws-sdk');
var path = require('path');


/*
 * AWS SDK - Recommends passing authentication in the environment:
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

var s3;

var FoldersAws = function (prefix, options) {

    this.configure(options);
    this.prefix = prefix || "/http_window.io_0:aws/";
    s3 = new AWS.S3();
    console.log("inin foldersAws,", this.bucket);

};

FoldersAws.prototype.configure = function (options) {

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


    updateRegion();


};

var write = function (uri, stream, cb) {


    var self = this;
    var params = {
        Bucket: 'build.riplet.com',
        Key: uri,
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


var cat = function (path, bucket, cb) {

    var self = this;
    var params = {
        Bucket: bucket,
        Key: path
    };
    // FIXME: See if we can get some info on the remote file, esp. length.
    // headObject / listObjects  works well enough usually.
    var body = s3.getObject(params).createReadStream();

    cb(null, {
        stream: body
            //size : fileStatus.length,
            //name : fileStatus.pathSuffix
    });
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

var updateRegion = function (region) {

    AWS.config.update({
        region: region || 'us-west-2'
    });

};

FoldersAws.prototype.ls = function (bucket, prefix, cb) {

    var self = this;
    prefix = prefix || null;

    var t = function (err, result) {

        if (err) {

            cb(err, null);
        }

        cb(null, result);

    };

    if (!self.flag && bucket instanceof Array) {

        self.lsBuckets(bucket, prefix, t);

    } else if (!self.flag && typeof bucket == 'string') {

        self.lsBucket(bucket, prefix, '', t);
    } else if ((!self.flag && !bucket) || self.flag == 'ALL_BUCKETS') {

        listBuckets(cb);
            //getBucketsLocation(['mybucket.test.com','mybucket3.test.com'])	

    }



};


/* This function takes 
 *
 *
 */

var getBucketsLocation = function (buckets) {

    if (!(buckets instanceof Array))
        buckets = new Array(buckets);

    var tasksToGo = buckets.length;
    for (var i = 0; i < buckets.length; ++i) {

        var params = {
            Bucket: buckets[i] /* required */
        };
        s3.getBucketLocation(params, function (err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else {
                result[buckets[tasksToGo - 1]] = data.LocationConstraint
                if (--tasksToGo == 0)
                    return;
                //cb(null,result); 
            } // successful response
        });

    }

}

FoldersAws.prototype.test = function () {
    var bucket = 'mybucket4.test.com';
    var prefix = null;


}

/*
 * returns all buckets 
 * associated with this 
 * credentials
 */
var listBuckets = function (cb) {

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

FoldersAws.prototype.lsBucket = function (bucket, prefix, pathPrefix, cb) {

        var result, self = this;


        s3.getBucketLocation({
            Bucket: bucket
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } // an error occurred
            else {

                updateRegion(data.LocationConstraint);

                s3.listObjects({
                    Bucket: bucket,
                    Prefix: prefix
                }, function (err, data) {

                    if (err) {
                        console.log("error occured in folders-aws lsBucket() ", err);
                        return cb(err, null);

                    } else {

                        result = self.asFolders(pathPrefix, data.Contents);
                        return cb(null, result);

                    }
                })

            }
        });

    }
    /*
     * This function resturns list of objects 
     * in array of buckets . takes callback ,prefix
     * and bucket list as inputs
     *
     */

FoldersAws.prototype.lsBuckets = function (buckets, prefix, cb) {
    var self = this;
    var result = [];
    var tasksToGo = buckets.length;


    if (0 == tasksToGo) {

        return cb(null, result);

    }
    for (var i = 0; i < buckets.length; ++i) {

        self.listBucket(buckets[i], prefix, buckets[i] + '/', function (err, data) {


            if (err) {
                console.log("error occured in folders-aws lsBuckets() ", err);
                return cb(err, null);

            } else {

                result = result.concat(data);

                if (--tasksToGo == 0) {

                    return cb(null, result);

                }

            }


        });

        /*
		
		s3.listObjects({Bucket:buckets[i],Prefix:prefix},function(err,data){

				if (err){
					console.log("error occured in folders-aws lsBuckets() ",err)
					return cb(err,null)
					
				}
				else{
					
					result = result.concat(self.asFolders(buckets[tasksToGo-1],data.Contents))
						console.log(result)
					
					if (--tasksToGo == 0 ){
						
						return cb(null,result)
						
					}
					
				}
		})
		*/
    }


};

/*
 * Recursive version of lsBuckets
 * not usefull 
 *
var lsBuckets = function(buckets,prefix,i,cb,result){
	
	if (i >= buckets.length){
			return cb(null,result)
	}
		
	s3.listObjects({Bucket:buckets[i],Prefix:prefix},function(err,data){
		
		if (err){
			
			return cb(err,null)
			
		}
		
		else{
			
			result = result.concat(data.Contents)
			
			lsBuckets(buckets,prefix,++i,cb,result)
		}
		
	})
	
}
*/

/*
 * If they pass an array of bucket names,
 *  then we'd use those as the root folder names
 */

FoldersAws.prototype.asFolders = function ( /*prefix,*/ pathPrefix, files) {
    var out = [];
    /*
  if (prefix){	  
	  if ((prefix.length-1) != prefix.lastIndexOf('/'))
	  prefix += '/'	  
  }
  */

    /*
     * Excluding the prefix if it  is 
     * directory.Only listing contents
     * inside prefix but not the prefix
     * itself
     */
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        //if ( prefix == null || file.Key != prefix){
        var o = {
            name: file.Key
        };
        o.fullPath = pathPrefix + o.name;
        o.uri = "#" + this.prefix + o.fullPath;
        o.size = file.Size || 0;
        o.extension = path.extname(o.name).substr(1, path.extname(o.name).length - 1) || 'DIR';
        o.type = "text/plain";
        o.modificationTime = file.LastModified;
        out.push(o);
        //}

    }
    return out;

};




FoldersAws.prototype.features = FoldersAws.features = {
    cat: true,
    ls: true,
    write: true,
    server: false
};




//Temporary comment meta, have to fixed the 'viewfs' first
//FoldersAws.prototype.meta = function(path,files,cb){
//      lsMounts(path, cb);
//};
//      lsMounts(path, cb);
//};

FoldersAws.prototype.write = function (key, data, cb) {
    //var stream = data.data;
    // var headers = data.headers;
    //var streamId = data.streamId;
    //var shareId = data.shareId;
    //var uri = data.uri;

    /*
        var headers = {
                "Content-Type" : "application/json"
        };

		*/
    var uri = key;
    write(uri, data, function (error, result) {
        if (error) {

            cb(error, null);
            return;
        }

        cb(null, result);
            /*
                cb({
                        streamId : streamId,
                        data : result,
                        headers : headers,
                        shareId : shareId
                });
				*/
    });

};




FoldersAws.prototype.cat = function (key, cb) {
    var path = key,
        self = this;
    cat(path, self.bucket, function (err, result) {

        if (err) {
            console.log("error in folders-aws cat() ", err)
            cb(err, null);
            return;
        }

        cb(null, result);

        //              var headers = {
        //                      "Content-Length" : result.size,
        //                      "Content-Type" : "application/octet-stream",
        //                      "X-File-Type" : "application/octet-stream",
        //                      "X-File-Size" : result.size,
        //                      "X-File-Name" : result.name
        //              };
        //
        //              cb({
        //                      streamId : o.streamId,
        //                      data : result.stream,
        //                      headers : headers,
        //                      shareId : data.shareId
        //              });
    });
};
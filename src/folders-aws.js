// Folders.io connector to AWS
var request = require('aws-sdk');


/*
 * AWS SDK - Recommends passing authentication in the environment:
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

// Be wary of region. Keep in mind many services support "S3" endpoint semantics outside of AWS.
AWS.config.region = 'us-west-2';



var baseurl;
//TODO we may want to pass the host, port, username as the param of inin
var FoldersAws = function(prefix, options) {
        this.prefix = prefix;

        baseurl = options.baseurl;
        if (baseurl.length && baseurl.substr(-1) != "/")
                baseurl = baseurl + "/";
        this.username = options.username;
        console.log("inin foldersAws,", baseurl, this.username);
};



var s3 = new AWS.S3();
s3.listBuckets(function(err, data) {
  if (err) { console.log("Error:", err); }
  else {
    for (var index in data.Buckets) {
      var bucket = data.Buckets[index];
      console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
    }
  }
});


var write = function(uri, stream, cb) {
        var s3obj = new AWS.S3({params: {Bucket: 'myBucket', Key: 'myKey'}});
        s3obj.upload({Body: stream}).
                on('httpUploadProgress', function(evt) { console.log(evt); }).
                send(function(error, response) {
                        if (error) {
                                console.error(error);
                                return cb(null, error);
                        }
                        return cb("created success");
                });
};


var cat = function(path, cb) {
        var s3 = new AWS.S3();
        var params = {Bucket: 'myBucket', Key: 'myImageFile.jpg'};
        var file = require('fs').createWriteStream('/path/to/file.jpg');
        // FIXME: See if we can get some info on the remote file, esp. length.
// headObject / listObjects  works well enough usually.
        var body = s3.getObject(params).createReadStream();
        cb({
                stream : body,
                size : fileStatus.length,
                name : fileStatus.pathSuffix
        });
}

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

module.exports = FoldersAws;

FoldersAws.prototype.ls = function(path,cb){
        ls(path, cb);
};

//Temporary comment meta, have to fixed the 'viewfs' first
//FoldersAws.prototype.meta = function(path,files,cb){
//      lsMounts(path, cb);
//};
//      lsMounts(path, cb);
//};

FoldersAws.prototype.write = function(data, cb) {
        var stream = data.data;
        // var headers = data.headers;
        var streamId = data.streamId;
        var shareId = data.shareId;
        var uri = data.uri;

        var headers = {
                "Content-Type" : "application/json"
        };

        write(uri, stream, function(result,error) {
                if (error){
                        cb(null, error);
                        return;
                }

                cb({
                        streamId : streamId,
                        data : result,
                        headers : headers,
                        shareId : shareId
                });
        });

};

FoldersAws.prototype.cat = function(data, cb) {
        var path = data;

        cat(path, function(result, error) {
        cat(path, function(result, error) {

                if (error){
                        cb(null, error);
                        return;
                }

                cb(result);

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


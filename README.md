Folders
=============

This node.js package implements the folders.io synthetic file system.

This Folders Module is based on a amazon web services,
Module can be installed via "npm install folders-aws".

Example:

Installation (use --save to save to package.json)

```sh
npm install folders-aws
```

Basic Usage

### Constructor

Provider constructor, could pass the special option/param in the config param.

```js
var FoldersAws = require('folders-aws');

var config = {
           accessKeyId: : "Amazon Acess Id" (String),
           secretAccessKey : "Amazon access key" (String),
		   service : ['S3','EC2'],
		   region: ['us-west-2','us-east-1'],
		   bucket : ['mybucket1','mybucket2']
};

var aws = new FoldersAws("localhost-aws", config);
```



###ls

```js
/**
 * @param uri, the uri to ls
 * @param cb, callback function. 
 * ls(uri,cb)
 */
 
aws.ls('s3/us-west-2/mybcuket1/video/', function(err,data) {
        console.log("Folder listing", data);
});
```


###cat


```js

/**
 * @param uri, the file uri to cat 
 * @param cb, callback function.
 * cat(uri,cb) 
 */

aws.cat('s3/us-west-2/mybcuket1/video/movie.wmv', function(err,result) {
        console.log("Read Stream ", result.stream);
});
```

### write

```js

/**
 * @param path, string, the path 
 * @param data, the input data, 'stream.Readable' or 'Buffer'
 * @param cb, the callback function
 * write(path,data,cb)
 */

var writeData = getWriteStreamSomeHow('some_movie.mp4');

aws.write('s3/us-west-2/mybcuket1/video/some_movie.mp4',writeData, function(err,result) {
        console.log("Write status ", result);
});
```


'service' , 'region' and 'bucket' attributes  in 'config' can be 'String' or 'Array' or 'Optional (undefined)'. 
In case of 'service' or 'region' or 'bucket' attributes of type 'String' , we can safely remove them from 'path' argument
which is passed to 'ls' , 'cat' and 'write' methods . 

For example 

```js
var FoldersAws = require('folders-aws');

var config = {
           accessKeyId: : "Amazon Acess Id" (String),
           secretAccessKey : "Amazon access key" (String),
		   service : 'S3',
		   region: 'us-west-2',
		   bucket : 'mybucket1'
};

var aws = new FoldersAws("localhost-aws", config);
```

###ls

```js
aws.ls('video/', function(err,data) {
        console.log("Folder listing", data);
});
```

###cat

```js
aws.cat('video/movie.wmv', function(err,result) {
        console.log("Read Stream ", result.stream);
});
```

###write

```js
var writeData = getWriteStreamSomeHow('some_movie.mp4');

aws.write('video/some_movie.mp4',writeData, function(err,result) {
        console.log("Write status ", result);
});
```
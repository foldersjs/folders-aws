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
##S3

Basic Usage
### Configuration
In order to access aws services , you must provide credentials . There are 2 ways to provide them 

#### Credentials from Disk
Create  a json file named '/path/to/config.json' with the contents:

```
{ 
  "accessKeyId": "your access key id", 
  "secretAccessKey": "your secret access key "
}

```
Edit config.js and specify the path of this json file at around line 7

```
Config.aws.loadFromPath = '/path/to/config.json' ;
```
#### Credentials from Environment Variables
You can set environment variables to provide sdk credentials . 
This means that if you properly set your environment variables, 
you do not need to manage credentials in your application at all.

The keys names must be as follows:

```
export AWS_ACCESS_KEY_ID =  "your access key id" 
export AWS_SECRET_ACCESS_KEY = "your secreet access key "
```

#### Credentials in the constructor
This means you can pass credentials directly to the folders-aws constructor object as mentioned in next section .This method is not recommended 

if both 'Credentials from Disk' 'and 'Credentials from Environment Variables' are set then former takes precedence over later 

### Constructor

Provider constructor, could pass the special option/param in the config param.

```js
var FoldersAws = require('folders-aws');

var config = {
           accessKeyId: "Amazon Acess Id" (String),
           secretAccessKey : "Amazon access key" (String),
		   service : ['S3','EC2'],
		   region: ['us-west-2','us-east-1'],
		   bucket : ['mybucket1','mybucket2'],
		   partSize: 10 *1024*1024, // (optional) partsize  default is 5 MB 
 		   queueSize:5 // (optional) concurrency level
};

var aws = new FoldersAws("localhost-aws", config);
```
It is not recommended to provide 'accessKeyId' and 'secretAccessKey' in the constructor directly and use other methods as mentioned
in configuration section to do this.

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

var FoldersAws = require('../src/folders-aws.js');

var config = {
           accessKeyId: "Amazon Acess Id",
           secretAccessKey : "Amazon access key",
           service : ['S3','EC2'],
           region: ['us-west-2','us-east-1'],
           bucket : ['foldersio', 'foldersio2']
};

var aws = new FoldersAws("localhost-aws", config);
aws.ls('S3/us-east-1/foldersio/video/', function(err,data) {
        console.log("Folder listing", data);
});


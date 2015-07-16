// Folders.io connector to AWS
var AWS = require('aws-sdk');
var path = require('path');


/*
 * AWS SDK - Recommends passing authentication in the environment:
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

/*
 * ALL Amazon services supported by this module
 */ 
 
var ALL_SERVICES = ['S3','EC2'];

var FoldersAws = function (prefix, options) {

    this.configure(options);
    this.prefix = prefix || "/http_window.io_0:aws/";
    console.log("inin foldersAws,", this.bucket || 'All Buckets');

};

FoldersAws.prototype.configure = function (options) {
    var self = this;
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


    if (typeof options.service == 'string') {
        self.singleService = true;
        self.service = options.service.toUpperCase();
    } else if (options.service instanceof Array) {
        self.multipleService = true;
        self.service = options.service.map(function(x){return x.toUpperCase();});
    } else if (!options.service) {
        self.allService = true;

    }


	self.region = options.region;
    self.bucket = options.bucket;

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

    var s = require('./regions/region.js');
    return new s(AWS,options);
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

	var self = this,
        service,  pathPrefix,arr;
	
	if (path && path.length > 0) {
        if (path[path.length - 1]!='/') path+='/';
    }
	
	path = (path == '/' ? null : path.slice(1));
   
	
	if(path == null){
		
		service = self.service;
		pathPrefix = path;
		
	}else
	{		
			//path = S3/uswest/
			arr = getService(self, path);
			service = arr[0];
			
			pathPrefix = arr[1];
	}	
	
   
	if (self.allService ) {
		
		if (path == null){
		
			//listing service as folders
			return cb(null, serviceAsFolders(ALL_SERVICES));
			
			
			// start from here now 
		}
        
    }
	
	 if (self.multipleService ) {
		if (path == null){
			
			//listing service as folders
			return cb(null, serviceAsFolders(service));
			
			// start from here now 
		}	
        
        
    }	

	 if (self.singleService ) {
		if (path == null){
			
			//listing service as folders
			return cb(null, serviceAsFolders([service]));
			
			// start from here now 
		}
        
        
    }		
	
		self.regionObj = getRegionObject({region:self.region,bucket:self.bucket});
			
		return	self.regionObj.ls(service,pathPrefix, cb);
			
			
	

};

var serviceAsFolders = function(serv){
	
	var data = [];
	for(var i = 0 ; i < serv.length;++i){
		var o = {};
		o.name = serv[i];
		o.extension =  '+folder';
		o.size = 0;
		o.type = "" ; 
		o.fullPath = '/' + o.name ;
		//o.uri = "#" + this.prefix + o.fullPath;
		o.uri = o.fullPath;
		o.modificationTime = Date.now();
		if (!o.meta) o.meta = {'group':'aws','owner':'aws','permission':0};
		var cols = [ 'permission', 'owner', 'group' ];
		data.push(o);
		
	}
	return data;
	
}
/*
FoldersAws.prototype.write = function (path, data, cb) {


    var self = this,
        service, region, pathPrefix;
    var arr = getServiceRegion(self, path);
    service = arr[0];
    region = arr[1];
    pathPrefix = arr[2];
    this.updateRegion(region);
    this.serviceObj = getServiceObject(service, {
        bucket: self.bucket
    });
    self.serviceObj.write(pathPrefix, data, cb);

};


FoldersAws.prototype.cat = function (path, cb) {
    var self = this,
        service, region, pathPrefix;
    var arr = getServiceRegion(self, path);
    service = arr[0];
    region = arr[1];
    pathPrefix = arr[2];
    this.updateRegion(region);
    this.serviceObj = getServiceObject(service, {
        bucket: self.bucket
    });
    self.serviceObj.cat(pathPrefix, cb);

};

*/
var path = require('path');
var S3 = require('./services/S3.js');
var EC2 = require('./services/EC2.js');
var AWS;

var serviceToRegionMapper = {

    'S3': ['us-west-2', 'us-west-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1'],
    'EC2': ['us-west-2', 'us-west-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1']

}

var Region = function (aws, options) {
    AWS = aws;
    this.configure(options);

};

Region.prototype.configure = function (options) {
    var self = this;
    if (typeof options.region == 'string') {
        self.singleRegion = true;
        self.region = options.region.toLowerCase();
    } else if (options.region instanceof Array) {
        self.multipleRegion = true;
        self.region = options.region.map(function (x) {
            return x.toLowerCase();
        });
    } else if (!options.region) {
        self.allRegion = true;
    }

    self.bucket = options.bucket;

};


module.exports = Region;

Region.prototype.updateRegion = function (region) {

    AWS.config.update({
        region: region || 'us-west-2'
    });

};

var getRegion = function (self, path) {

    var region;
    var parts = path.split('/');
    region = parts[0];
    path = parts.slice(1, parts.length).join('/');
    return [region.toLowerCase(), path];
};


/*
 * If they pass an array of bucket names,
 *  then we'd use those as the root folder names
 */




Region.prototype.features = Region.features = {
    cat: true,
    ls: true,
    write: true,
    server: false
};

// path / || /l/ || /l/k/

Region.prototype.ls = function (service, path, cb) {

    path = (path == '' ? null : path);
    var self = this,
        region, pathPrefix, arr;

    if (path == null) {

        region = self.region;
        pathPrefix = path;

    } else {
        arr = getRegion(self, path);
        region = arr[0];
        pathPrefix = arr[1];
    }



    if (self.allRegion) {

        if (path == null) {

            //listing regions as folders
            return cb(null, regionAsFolders(serviceToRegionMapper[service], '/' + service + '/'));



        }
    }

    if (self.multipleRegion) {
        if (path == null) {

            //listing regions as folders
            return cb(null, regionAsFolders(region, '/' + service + '/'));


        }


    }

    if (self.singleRegion) {
        if (path == null) {
            //listing regions as folders
            return cb(null, regionAsFolders([region], '/' + service + '/'));


        }


    }



    self.serviceObj = getServiceObject(service,region, {
        bucket: self.bucket
    })
    return self.serviceObj.ls(service, region, pathPrefix, cb);


};

/*
 *
 *
 */
var getServiceObject = function (service,region, options) {

    var t = new AWS[service]({region:region});
    var s = require('./services/' + service);
    return new s(AWS, t, options);
};

/*
 * This method takes aws records and translates them
 * into folders.io compatible records
 *
 */
var regionAsFolders = function (region, dir) {

    var data = [];
    for (var i = 0; i < region.length; ++i) {
        var o = {};
        o.name = region[i];
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
		//FIXME: How to get modification time ?
		o.modificationTime = Date.now();
        var cols = ['permission', 'owner', 'group'];
        data.push(o);

    }

    return data;

}


Region.prototype.write = function (service,path, data, cb) {


   var self = this,
        region, pathPrefix, arr;

    	arr = getRegion(self, path);
        region = arr[0];
        pathPrefix = arr[1];
    

    self.serviceObj = getServiceObject(service,region, {
        bucket: self.bucket
    })
    return self.serviceObj.write(pathPrefix,data,cb);

};



Region.prototype.cat = function (service,path, cb) {
   
	
    var self = this,
        region, pathPrefix, arr;

    	 arr = getRegion(self, path);
        region = arr[0];
        pathPrefix = arr[1];
    

    self.serviceObj = getServiceObject(service,region, {
        bucket: self.bucket
    })
    return self.serviceObj.cat(pathPrefix, cb);


};

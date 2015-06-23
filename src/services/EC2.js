/*
 * Not implemented 
 * Yet EC3
 */
var path = require('path');
var Readable = require('stream').Readable;
var util = require('util');
var ec2;

var EC2 = function (service, options) {

    ec2 = service;
    this.configure(options);

}

EC2.prototype.configure = function () {



}

EC2.prototype.ls = function (path, cb) {


    var params = {
        InstanceIds: [path],

    };

    ec2.describeInstanceStatus(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            return cb(err, null);
        } // an error occurred
        else {
            console.log(data);
            cb(null, data);
        } // successful response
    });

}

EC2.prototype.cat = function (path, cb) {


    var params = {
        InstanceIds: [path],

    };

    ec2.describeInstanceStatus(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            return cb(err, null);
        } // an error occurred
        else {
            var stream = new ObjectReader(data);
            cb(null, {
                stream: stream
            });
        } // successful response
    });


}

EC2.prototype.write = function () {

    //implement service specific method	

}

var ObjectReader = function (data) {

    this.data = data;
    var options = {
        objectMode: true
    };
    Readable.call(this, options);

}

util.inherits(ObjectReader, Readable);

ObjectReader.prototype._read = function () {
    var self = this;
    self.push(self.data);
    self.push(null);

}

module.exports = EC2;
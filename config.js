/*
 * Core config file used by modules
 *
 */
var Config= {};
Config.aws = {};

/* 
 *load credentials from disk
 */
Config.aws.loadFromPath = null ;

/*
 *load credentials from environment 
 */
Config.aws.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
Config.aws.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;	
	
module.exports = Config; 
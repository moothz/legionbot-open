require('winston-daily-rotate-file');
const winston = require('winston');
const path = require('node:path');
const fs = require('fs');

const configs = require("./configs");

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.simple(),
	transports: [
		new (winston.transports.Console)({"colorize": true, "timestamp": true}),
		new winston.transports.DailyRotateFile({
						name: 'zap-info',
						filename: path.join(configs.rootFolder,"logs","error-zap.log"),
						level: 'error',
						prepend: true,
						maxFiles: 1000
				}
		),
		new (winston.transports.DailyRotateFile)({
				name: 'zap-log',
				filename: path.join(configs.rootFolder,"logs","zap.log"),
				prepend: true,
				maxFiles: 1000
		})
	]
});


function getTimestamp(){
	var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
	//return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	return localISOTime;
}

function loggerWarn(s){
	const ts = getTimestamp();
	const msg = `*** [${ts}] ${s}`;
	logger.warn(msg);
}

function loggerInfo(s){
	const ts = getTimestamp();
	const msg = `[${ts}] ${s}`;
	logger.info(msg);
}

module.exports = { loggerWarn, loggerInfo };

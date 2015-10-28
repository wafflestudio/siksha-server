var winston = require('winston');

// For log file
winston.add(winston.transports.File, { filename: 'data.log' });

function info(message) {
    winston.log('info', message);
};

function warn(message) {
    winston.log('warn', message);
};

function debug(message) {
    winston.log('debug', message);
};

function error(message) {
    winston.log('error', message);
};

module.exports = {
    info: info,
    warn: warn,
    debug: debug,
    error: error
};

const nodemailer = require('nodemailer');
const Push = require('pushover-notifications');
const config = require('./config.js').parse();
const {logger} = require('./logger.js');


const SMTPTransporter = config.email ? nodemailer.createTransport( config.email.service ) : undefined;

let pushover = undefined;
if (config.pushover) {
    pushover = new Push(
        {...config.pushover.service,
            onerror: function(error) {
                //throw new Error(error);
                logger.error('Pushover error', {error: error});
            }
    });
}

const saveJSONParse = function(str) {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}


module.exports = {SMTPTransporter, pushover, saveJSONParse};


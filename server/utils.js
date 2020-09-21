const nodemailer = require('nodemailer');
const Push = require('pushover-notifications');
const config = require('./config.js').parse();
const {logger, jsonlogger} = require('./logger.js');


const SMTPTransporter = config.email ? nodemailer.createTransport( config.email.service ) : undefined;
let pushover = undefined;
if (config.pushover) {
    pushover = new Push(
        {...config.pushover.service,
            onerror: function(error) {
                //throw new Error(error);
                logger.error('Pushover issue. ' + error);
            }
    });
}



module.exports = {SMTPTransporter, pushover};


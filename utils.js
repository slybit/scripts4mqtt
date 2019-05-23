const nodemailer = require('nodemailer');
const Push = require('pushover-notifications');
const config = require('./config.js').parse();
const {logger, jsonlogger} = require('./logger.js');


const SMTPTransporter = config.email ? nodemailer.createTransport( config.email.service ) : undefined;
const pushover = config.pushover ? new Push( config.pushover.service ) : undefined;

module.exports = {SMTPTransporter, pushover};


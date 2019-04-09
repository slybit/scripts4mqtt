const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const config = require('./config.js').parse();

const consoleFormat = combine(
  timestamp({format:'YYYY-MM-DD hh:mm:ss'}),
  format.splat(),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} | ${level.padEnd(7).toUpperCase()} | ${message}`;
  })
);

//const myFormat = ;

/*
var logger = createLogger({
    level: config.loglevel,
    format: format.combine(
      format.timestamp({format:'MM-YY-DD'}),
      format.colorize(),
      format.splat(),
      format.simple(),
    ),
    transports: [new transports.Console()]
});
*/

/*
const logger = createLogger({
  format: combine(
    timestamp(),
    format.colorize(),
    format.splat(),
    myFormat
  ),
  transports: [new transports.Console()]
});
*/

const logger = createLogger({
  level: config.loglevel,
  transports: [
    new transports.Console({
      format: consoleFormat
    }),
    new transports.File({
      filename: 'default.log',
      format: format.combine(format.timestamp(), format.splat(), format.json()),
    }),
  ],
});

const jsonlogger = createLogger({
  transports: [    
    new transports.File({
      filename: 'rules.log', level: 'debug',
      format: format.combine(format.timestamp({format:'YYYY-MM-DD hh:mm:ss'}), format.json()),
    }),
  ],
});

module.exports = {logger, jsonlogger};
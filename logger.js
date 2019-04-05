const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const config = require('./config.js').parse();

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

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

const logger = createLogger({
  format: combine(
    label({ label: 'right meow!' }),
    timestamp(),
    myFormat
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
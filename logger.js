const { createLogger, format, transports } = require('winston');
const config = require('./config.js').parse();

var logger = createLogger({
    level: config.loglevel,
    format: format.combine(
      format.colorize(),
      format.splat(),
      format.simple(),
    ),
    transports: [new transports.Console()]
});

module.exports = logger;
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const config = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');

const ruleLogs = [];




const consoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
  format.splat(),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} | ${level.padEnd(7).toUpperCase()} | ${message}`;
  })
);


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
      format: format.combine(format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }), format.json()),
    }),
  ],
});


const parseRuleLog = function () {
  // create instance of readline
  // each instance is associated with single input stream
  let rl = readline.createInterface({
    input: fs.createReadStream('rules.log')
  });

  let line_no = 0;

  // event is emitted after each line
  rl.on('line', function (line) {
    const item = JSON.parse(line);
    ruleLogs.push(item);
  });

  // end
  rl.on('close', function (line) {
    console.log('Total lines : ' + ruleLogs.length);
  });
}

parseRuleLog();

module.exports = { logger, jsonlogger };
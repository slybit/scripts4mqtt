const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;
const config = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');

var defaultTransport = new (transports.DailyRotateFile)({
  filename: 'default-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,  
  maxFiles: '14d',
  format: format.combine(format.timestamp(), format.splat(), format.json())
});


var rulesTransport = new (transports.DailyRotateFile)({
  filename: 'rules-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,  
  maxFiles: '14d',
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json())
});


const consoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
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
    //new transports.File({
    //  filename: 'default.log',
    //  format: format.combine(format.timestamp(), format.splat(), format.json()),
    //}),
    defaultTransport
  ],
});

const jsonlogger = createLogger({
  transports: [
    rulesTransport
  ],
});


const parseRuleLog = function () {
  return new Promise(function (resolve) {
    const ruleLogs = [];
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
      resolve(ruleLogs);
    });

  });

}

//parseRuleLog();

module.exports = { logger, jsonlogger, parseRuleLog };
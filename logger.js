const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;
const config = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');

var defaultTransport = new (transports.DailyRotateFile)({
  filename: 'default-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  format: format.combine(format.timestamp(), format.splat(), format.json())
});


var rulesTransport = new (transports.DailyRotateFile)({
  filename: 'rules-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
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


const getRuleLogs = function () {
  // registers
  let line_no = 0;
  const logs = [];
  let MAXLINES = 5000;
  return new Promise(async function (resolve) {
        // list log files
        const files = fs.readdirSync('.');
        const logfiles = files.filter(file => file.startsWith('rules-')).sort().reverse();

        for (let f of logfiles) {
          console.log(f);
          await parseRuleLogFile(f, logs);
          if (logs.length > MAXLINES) break;
        }
        resolve(logs.splice(0, Math.min(logs.length, MAXLINES)));
  });
}

const parseRuleLogFile = function (filename, logs) {
  return new Promise(function (resolve) {
    // create instance of readline
    // each instance is associated with single input stream
    let rl = readline.createInterface({
      input: fs.createReadStream(filename)
    });

    // event is emitted after each line
    rl.on('line', function (line) {
      logs.push(JSON.parse(line));
    });

    // end
    rl.on('close', function (line) {
      resolve(logs);
    });
  });
}



module.exports = { logger, jsonlogger, getRuleLogs };
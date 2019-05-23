const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;
const config  = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const LOGPATH = config.logpath || './logs/';

var defaultTransport = new (transports.DailyRotateFile)({
  filename: 'default-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
  format: format.combine(format.timestamp(), format.splat(), format.json())
});


var rulesTransport = new (transports.DailyRotateFile)({
  filename: 'rules-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json())
});

let mqttTransport = new (transports.DailyRotateFile)({
  filename: 'mqtt-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
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

const mqttlogger = createLogger({
  transports: [
    mqttTransport
  ],
});


const getRuleLogs = function () {
  return getLogs('rules');
}

const getMqttLogs = function () {
  return getLogs('mqtt');
}

const getLogs = function (prefix) {
  const logs = [];
  let MAXLINES = 5000;
  return new Promise(async function (resolve) {
        // list log files
        const files = fs.readdirSync(LOGPATH);
        const logfiles = files.filter(file => file.startsWith(prefix+'-')).sort().reverse();

        for (let f of logfiles) {
          console.log(f);
          await parseLogFile(path.join(LOGPATH, f), logs);
          if (logs.length > MAXLINES) break;
        }
        resolve(logs.splice(0, Math.min(logs.length, MAXLINES)));
  });
}

const parseLogFile = function (filename, logs) {
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



module.exports = { logger, jsonlogger, mqttlogger, getRuleLogs, getMqttLogs };
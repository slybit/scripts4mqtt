const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;
const config  = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const LOGPATH = config.logpath || '../logs/';

// Transport for the application logs
var defaultTransport = new (transports.DailyRotateFile)({
  filename: 'default-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
  format: format.combine(format.timestamp(), format.splat(), format.json())
});

// Transport for the Rules logs
var rulesTransport = new (transports.DailyRotateFile)({
  filename: 'rules-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json())
});

// Transport for the MQTT logs
let mqttTransport = new (transports.DailyRotateFile)({
  filename: 'mqtt-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d',
  dirname: LOGPATH,
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json())
});

// Transport for the LogBook logs
let logbookTransport = new (transports.DailyRotateFile)({
  filename: 'logbook-%DATE%.log',
  datePattern: 'YYYY-MM',
  zippedArchive: false,
  maxFiles: '12',
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

const logbooklogger = createLogger({
  transports: [
    logbookTransport
  ],
});


const getRuleLogs = function () {
  return getLogs('rules');
}

const getMqttLogs = function () {
  return getLogs('mqtt');
}

const getLogbookLogs = function () {
  return getLogs('logbook');
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
          await parseLogFile(path.join(LOGPATH, f), MAXLINES - logs.length, logs);          
          if (logs.length > MAXLINES) break;
        }
        // keep at max MAXLINES
        logs.splice(MAXLINES);
        resolve(logs);
  });
}

const parseLogFile = function (filename, maxLineCount, logs) {
  return new Promise(function (resolve) {
    const buffer = [];
    // create instance of readline
    // each instance is associated with single input stream
    let rl = readline.createInterface({
      input: fs.createReadStream(filename)
    });

    // event is emitted after each line
    rl.on('line', function (line) {
      //logs.push(JSON.parse(line));
      buffer.push(line);
    });

    // end
    rl.on('close', function () {
      // keep only the required number of lines at the END of the buffer
      buffer.splice(0, buffer.length-maxLineCount);
      for (line of buffer) {
        logs.push(JSON.parse(line));
      }
      resolve(logs);
    });
    
  });
}



module.exports = { logger, jsonlogger, mqttlogger, logbooklogger, getRuleLogs, getMqttLogs, getLogbookLogs };
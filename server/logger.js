const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
require('winston-elasticsearch');
const { combine, timestamp, printf } = format;
const config = require('./config.js').parse();
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');


const LOGPATH = config.logpath || '../logs/';
const LOGBUFFERSIZE = 500;


/* -----------------------------------------------------------------------------------------------
    Custom formatters
----------------------------------------------------------------------------------------------- */

// custom formatter to add timestamp for sorting
const addTS = format((info, opts) => {
    info.ts = Date.now();
    return info;
});

// custom formatter to create a numeric and string version of value.val
// this is required since the value.val can contain both strings and numbers, giving issues
// with elastic search indices
const valueAdder = format((info) => {
    if (info.value && info.value.val !== undefined) {
        if (!isNaN(info.value.val)) {
            // if it is a number or string representing a number
            info.value.val_num = Number(info.value.val);
            info.value.val = info.value.val.toString();
        }
    }
    return info;
})();


// Only log rule related log events
const filterRules = format((info, opts) => {
    if (info.ruleId) { return info; }
    return false;
});

/* -----------------------------------------------------------------------------------------------
    STANDARD LOGGER with these transports:
       - console
       - stream (for UI)
       - file in log folder
       - elasticsearch
       - rule logs (for UI)
    The log level is defined by the user in the config
----------------------------------------------------------------------------------------------- */

// Transport for the Rules logs
let rulesTransport = new (transports.DailyRotateFile)({
    level: 'info',
    filename: 'rules-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: '14d',
    dirname: LOGPATH,
    format: format.combine(filterRules(), format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), addTS(), format.json())
});



// Stream transport (purely in memory)
const logBufferStatic = [];
const logBufferDynamic = [];
const stream = new Writable();
stream._write = (chunk, encoding, next) => {
    logBufferStatic.push(chunk.toString());
    if (logBufferStatic.length > LOGBUFFERSIZE) logBufferStatic.shift();
    logBufferDynamic.push(chunk.toString());
    if (logBufferDynamic.length > LOGBUFFERSIZE) logBufferDynamic.shift();
    next();
}

let streamTransport = new (transports.Stream)({
    level: config.loglevel,
    stream: stream,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.splat(),
        format.printf((info) => {
            let {timestamp, level, message, ...leftovers} = info;
            return `${info.timestamp} | ` + format.colorize().colorize(info.level, `${info.level.padEnd(7).toUpperCase()}`) + ` | ${info.message} | ${JSON.stringify(leftovers)}`;
        })
    ),
});



// Transport for the Elastic Search export
let esTransport = undefined;
if (config.es && config.es.enabled) {
    const esTransportOpts = {
        level: config.loglevel,
        format: combine(format.splat(), valueAdder),
        clientOpts: {
            node: config.es.node ? config.es.node : 'http://localhost:9200'
        }
    };
    esTransport = new transports.Elasticsearch(esTransportOpts)
}

// Transport for the default application logs (= normal logs as a flat file)
let defaultTransport = new (transports.DailyRotateFile)({
    level: config.loglevel,
    filename: 'default-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: '14d',
    dirname: LOGPATH,
    //format: format.combine(format.timestamp(), format.splat(), format.json())
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.splat(),
        valueAdder,
        printf((info) => {
            let {timestamp, level, message, ...leftovers} = info;
            return `${info.timestamp} | ${info.level.padEnd(7).toUpperCase()} | ${message} | ${JSON.stringify(leftovers)}`;
        })
    )

});




// list of transports for the json logger, add the esTransport if enabled
const transportsList = [
    new transports.Console({
        format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.splat(),
            printf((info) => {
                let {timestamp, level, message, ...leftovers} = info;
                return `${info.timestamp} | ${info.level.padEnd(7).toUpperCase()} | ${message} | ${JSON.stringify(leftovers)}`;
            })
        ),
        level: config.debug ? 'silly' : 'error'     // overwrite the error level for the server console logs
    }),
    //new transports.File({
    //  filename: 'default.log',
    //  format: format.combine(format.timestamp(), format.splat(), format.json()),
    //}),
    defaultTransport,
    rulesTransport,
    streamTransport
];

if (esTransport) transportsList.push(esTransport);

// create the logger itself
const logger = createLogger({
    //level: config.loglevel,
    transports: transportsList
});





/* -----------------------------------------------------------------------------------------------
    MQTT LOGGER - Used in the UI
    The log level is fixed.
----------------------------------------------------------------------------------------------- */


// Transport for the MQTT logs
let mqttTransport = new (transports.DailyRotateFile)({
    filename: 'mqtt-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: '14d',
    dirname: LOGPATH,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), addTS(), format.json())
});


const mqttlogger = createLogger({
    transports: [
        mqttTransport
    ],
});


/* -----------------------------------------------------------------------------------------------
    LOGBOOK LOGGER - Used in the UI
    The log level is fixed.
----------------------------------------------------------------------------------------------- */


// Transport for the LogBook logs
let logbookTransport = new (transports.DailyRotateFile)({
    filename: 'logbook-%DATE%.log',
    datePattern: 'YYYY-MM',
    zippedArchive: false,
    maxFiles: '12',
    dirname: LOGPATH,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), addTS(), format.json())
});

const logbooklogger = createLogger({
    transports: [
        logbookTransport
    ]
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
        const logfiles = files.filter(file => file.startsWith(prefix + '-')).sort().reverse();

        for (let f of logfiles) {
            await parseLogFile(path.join(LOGPATH, f), MAXLINES - logs.length, logs);
            if (logs.length > MAXLINES) break;
        }
        // keep at max MAXLINES
        logs.splice(MAXLINES)
        logs.sort((a, b) => (a.ts > b.ts) ? -1 : 1);
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
            buffer.splice(0, buffer.length - maxLineCount);
            for (line of buffer) {
                logs.push(JSON.parse(line));
            }
            resolve(logs);
        });

    });
}



module.exports = { logBufferDynamic, logBufferStatic, logger, mqttlogger, logbooklogger, getRuleLogs, getMqttLogs, getLogbookLogs };
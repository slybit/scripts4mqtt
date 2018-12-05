'use strict'

const mustache = require('mustache');
const vm = require('vm');
const mqtt = require('mqtt');
const { createLogger, format, transports } = require('winston');
const config = require('./config.js').parse();
const rules = require('./rules.js').parse();
const sandbox = require('./sandbox.js');


console.log(rules[0].action.eval);
process.exit(0);

let justStarted = true;

// Initate the logger
const logger = createLogger({
    level: config.loglevel,
    format: format.combine(
      format.colorize(),
      format.splat(),
      format.simple(),
    ),
    transports: [new transports.Console()]
});


let parse = function(topic, message) {
    // ensure data is Object
    let data = processMessage(message);

    if (!data) {
        logger.warn('did not understand message %s on topic %s', message, topic)
    } else {
        sandbox.data.states.set(topic, data);
    }
}

// evaluates the mqtt message
// expects message to be a string
let processMessage = function(message) {
    let data = {};
    if (message === 'true') {
        data.val = true;
    } else if (message === 'false') {
        data.val = false;
    } else if (isNaN(message)) {
        try {
            data = JSON.parse(message);
        } catch (err) {
            data.val = message; // will be a string
        }
    } else {
        data.val = Number(message);
    }
    if (!data.ts) data.ts = (new Date).getTime();
    return data;
}

let setMqttHandlers = function(mqttClient) {
    mqttClient.on('connect', function () {
        logger.info('MQTT connected');
        for (const topic of config.topics) {
            mqttClient.subscribe(topic);
            logger.verbose('subscribed to %s', topic);
        }
    });

    mqttClient.on('close', function () {
        logger.info('MQTT disconnected');
    });

    mqttClient.on('reconnect', function () {
        logger.info('MQTT trying to reconnect');
    });

    mqttClient.on('message', function (topic, message, packet) {
        // ignore the initial retained messages
        if (!packet.retain) justStarted = false;
        if (!justStarted || config.retained) {
            // message is a buffer
            logger.silly("MQTT received %s : %s", topic, message)
            message = message.toString();
            parse(topic, message);
        } else {
            logger.silly("MQTT ignored initial retained  %s : %s", topic, message)
        }
    });
}



// start

let mqttClient = mqtt.connect(config.mqtt.url, config.mqtt.options);
setMqttHandlers(mqttClient);


vm.createContext(sandbox.context);


setTimeout(function() {
    const code = 'getState(\"knx/connected\");';
    console.log(vm.runInContext(code, sandbox.context));
    console.log(sandbox.data.states);
}, 3000);

'use strict'

const logger = require('./logger.js');
const engine = require('./engine.js');
const config = require('./config.js').parse();
const mqtt = require('mqtt');
//const {Rules, Rule} = require('./rules.js');
const rules = require('./rules.js');

let justStarted = true;

let processMessage = function(topic, message) {
    // message is a Buffer, so first convert it to a String
    message.toString();
    logger.silly("MQTT received %s : %s", topic, message);
    // now parse the data
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

    if (!data) {
        logger.warn('did not understand message %s on topic %s', message, topic)
    } else {
        engine.store.set(topic, data);
    }
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
        processMessage(topic, message); // this will update the store with the values
        // ignore the initial retained messages
        if (!packet.retain) justStarted = false;
        if (!justStarted || config.retained) {
            // send the message to the rule engine
            rules.mqttConditionChecker(topic);
        } else {
            logger.silly("MQTT ignored initial retained  %s : %s", topic, message)
        }
    });
}


let mqttClient = mqtt.connect(config.mqtt.url, config.mqtt.options);
setMqttHandlers(mqttClient);
engine.mqttClient = mqttClient;



const code = "0 == 1";
engine.store.set('b', 1000);
console.log(engine.vm.runInContext(code, engine.sandbox));
engine.runScript(code);



//const rules = new Rules(config);

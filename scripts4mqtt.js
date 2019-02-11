'use strict'
const mqtt = require('mqtt');
const logger = require('./logger.js');
const Engine = require('./engine.js');
const config = require('./config.js').parse();
const { pushover } = require('./utils.js');

//const {Rules, Rule} = require('./rules.js');
const rules = require('./rules.js');

let justStarted = true;

const mqttClient = mqtt.connect(config.mqtt.url, config.mqtt.options);
const engine = Engine.getInstance(mqttClient);
// we start the timer checker here (and not in the constructor of the Rules class),
// because otherwise a condition might already trigger before the engine singleton
// has been initialized
rules.scheduleTimerConditionChecker();


let processMessage = function (topic, message, packet) {
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
        engine.store.set(topic, { 'data': data, 'packet': packet });
    }
}


let setMqttHandlers = function (mqttClient) {
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
        processMessage(topic, message, packet); // this will update the store with the values
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



//setMqttHandlers(mqttClient);



//const code = "log.error(write('b', '10'));";
//engine.store.set('b', 1000);
//console.log(engine.vm.runInContext(code, engine.sandbox));
//engine.runScript(code);


//let topic = "knx/status/0/1/201";
//let message = 1

//processMessage(topic, message);
//rules.mqttConditionChecker(topic);




//const rules = new Rules(config);





   
var msg = {
    // These values correspond to the parameters detailed on https://pushover.net/api
    // 'message' is required. All other values are optional.
    message: 'omg node test',	// required
    title: "Well - this is fantastic",
    sound: 'magic',
    device: 'devicename',
    priority: 1
}
   
pushover.send( msg, function( err, result ) {
    if ( err ) {
      throw err
    }
   
    console.log( result )
  })
const vm = require('vm');
const logger = require('./logger.js');

const store = new Map();
const mqttStore = new Map();

class Engine {

    constructor(mqttClient) {
        this.mqttClient = mqttClient;
        this.store = store;
        this.mqttStore = mqttStore;
        this.vm = vm;
        this.sandbox = {
            log: logger,
            store: this.store,
            mqttStore: this.mqttStore,
            mqttClient: this.mqttClient,
            vm: vm,
            put: function (key, value) {
                store.set(key, value);
            },
            get: function(key, defaultValue) {
                if (store.get(key) === undefined) {
                    return defaultValue;
                } else {
                    return store.get(key);
                }
            },
            read: function(topic) {
                return mqttStore.get(topic);
            },
            write: function(topic, message, retain = false) {
                if (!isNaN(message)) message = message.toString();
                logger.info('ScriptAction published %s -> %s', topic, message);
                return mqttClient.publish(topic, message, {'retain' : retain});
            }
            
        }
        vm.createContext(this.sandbox);


    }

    runScript(script) {
        logger.debug('running script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
        return vm.runInContext(script, this.sandbox);
    }

}


class Singleton {
  
    static getInstance(mqttClient) {
        if (!Singleton.instance) {
            if (mqttClient !== undefined) {
                Singleton.instance = new Engine(mqttClient);
            } else {
                throw new Error('Engine singleton should first be initialized with an MQTT client.');
            }
        }
        return Singleton.instance;
    }
  
  }

module.exports = Singleton;
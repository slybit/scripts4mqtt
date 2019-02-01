const vm = require('vm');
const logger = require('./logger.js');

const store = new Map();

class Engine {

    constructor(mqttClient) {
        this.mqttClient = mqttClient;
        this.store = store;
        this.vm = vm;
        this.sandbox = {
            log: logger,
            store: this.store,
            mqttClient: this.mqttClient,
            vm: vm,
            addToStore: function (key, value) {
                store.set(key, value);
            },
            getFromStore: function(key) {
                return store.get(key);
            },
            write: function(topic, message) {
                return mqttClient.publish(topic, message);
            }
            
        }
        vm.createContext(this.sandbox);


    }

    runScript(script) {
        logger.silly('running script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
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
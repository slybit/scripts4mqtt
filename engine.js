const vm = require('vm');
const logger = require('./logger.js');

const store = new Map();
const testStore = new Map(); // only used for testing scripts
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
        this.testbox = {
            log: logger,
            testStore: this.testStore,
            mqttStore: this.mqttStore,            
            vm: vm,
            put: function (key, value) {
                testStore.set(key, value);
            },
            get: function(key, defaultValue) {
                if (testStore.get(key) === undefined) {
                    return defaultValue;
                } else {
                    return testStore.get(key);
                }
            },
            read: function(topic) {
                return mqttStore.get(topic);
            },
            write: function(topic, message, retain = false) {
                if (!isNaN(message)) message = message.toString();
                logger.info('TESTING script result: ScriptAction published %s -> %s', topic, message);
                return true;
            }
            
        }
        vm.createContext(this.sandbox);
        vm.createContext(this.testbox);


    }

    runScript(script) {
        logger.debug('running script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
        return vm.runInContext(script, this.sandbox);
    }

    testScript(script) {
        logger.debug('testing script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
        return vm.runInContext(script, this.testbox);
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
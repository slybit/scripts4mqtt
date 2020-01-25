/*
Creates a controlled environment in which the ScriptActions are being run.
It exposes the following functions:

    put: function (key, value)

        Store a value in the shared key/value store.

    get: function(key, defaultValue)

        Retrieves a value from the shared key/value store. If not found, the defaultValue is returned.

    read: function(topic)

        Reads the current value of a certain MQTT topic. If no messages have been published on the topic, "undefined" is returned.

    write: function(topic, message, retain = false)

        Write an MQTT message to the provided topic.
        The message can be a string, a number or an object.
*/

const vm = require('vm');
const axios = require('axios');
const {logger} = require('./logger.js');

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
            axios: axios,
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
                let data = "";
                if (typeof message === 'string' || message instanceof Buffer || message instanceof ArrayBuffer) {
                    data = message;
                } else {
                    try {
                        data = message.toString();
                    } catch (err) {
                        logger.error("Could not convert value to String - sending empty message");
                    }
                }
                logger.info('ScriptAction published %s -> %s', topic, data);
                return mqttClient.publish(topic, data, {'retain' : retain});
            }

        }
        this.testbox = {
            log: logger,
            testStore: this.testStore,
            mqttStore: this.mqttStore,
            vm: vm,
            axios: axios,
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
        //logger.debug('running script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
        return vm.runInContext(script, this.sandbox);
    }

    testScript(script) {
        logger.debug('testing script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
        return vm.runInContext(script, this.testbox);
    }

    /**
     * Dumps the current contents of the store as an array
     */
    dumpStore() {
        let a = [];
        for (let key of this.mqttStore.keys()) {
            a.push({"topic": key, "value": JSON.stringify(this.mqttStore.get(key).data)});
        }
        for (let key of this.store.keys()) {
            a.push({"topic": "__STORE__" + key, "value": JSON.stringify(this.store.get(key))});
        }
        return a;
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

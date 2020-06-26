module.exports = class Sandbox {

    constructor(config, mqtt) {
        this.config = config;
        this.mqtt = mqtt;
        this.store = new Map();
    }

    getConfig() {
        return this.config;
    }

    addToStore(key, value) {
        this.store.set(key, value);
    }

    getFromStore(key) {
        return this.store.get(key);
    }

}


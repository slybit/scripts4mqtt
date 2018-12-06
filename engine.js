const vm = require('vm');
const logger = require('./logger.js');


// Shared items
const store = new Map();

const sandbox = {
    addToStore: function (key, value) {
        store.set(key, value);
    },
    getFromStore: function(key) {
        return store.get(key);
    },
    log: logger
}


const engine = {


    sandbox: sandbox,
    store: store,
    vm: vm,
    runScript: function(script) {
        logger.silly('running script\n%s', script);
        return vm.runInContext(script, sandbox);
    }

}

vm.createContext(sandbox);

module.exports = engine;
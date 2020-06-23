const fs = require('fs');
const yaml = require('js-yaml');
const util = require('util');
const validator = require('./validator.js');

const { logger, jsonlogger, logbooklogger } = require('./logger.js');
const config = require('./config.js').parse();

const FILENAME = process.env.MQTT4SCRIPTS_RULES || '../config/aliases.yaml';

class Aliases {

    constructor() {
        this.loadAliases();
    }

    loadAliases() {
        this.aliases = {};
        if (fs.existsSync(FILENAME)) {
            try {
                this.aliases = yaml.safeLoad(fs.readFileSync(FILENAME, 'utf8'));
            } catch (e) {
                logger.error(e.toString());
                process.exit(1);
            }
        }
    }

    saveAliases() {
        logger.info("saving aliases");
        try {
            fs.writeFileSync(FILENAME, yaml.safeDump(this.aliases));
        } catch (e) {
            logger.error(e);
        }
    }

    getTopics(alias) {
        return (this.aliases[alias] !== undefined) ? this.aliases[alias] : [];
    }

    /*
     * REST APIs
     */

    listAliases() {
        return {
            success: true,
            aliases: this.aliases
        };
    }

    /*
    - input: JSON with full new alias {"newname" : [ new topics ]}
    */
    updateAlias(input) {
        try {
            // test the update, this will throw an exception if not ok
            this.validateTopicList(input);
            Object.assign(this.aliases, input);
            this.saveAliases();
            return {
                success: true,
                name: Object.keys(input)[0],
                aliases: this.aliases
            };
        } catch (err) {
            logger.warn(err.message);
            return { success: false, error: err.message };
        }

    }

    deleteAlias(id) {
        try {
            // first check if the alias is in use or not
            let usedAliases = require('./rules.js').listUsedAliases();
            if (usedAliases.includes(id)) throw new Error('Cannot delete alias, alias is in use.');
            // continue if not in use
            delete this.aliases[id];
            this.saveAliases();
            return {
                success: true,
                aliases: this.aliases
            };
        } catch (err) {
            logger.warn(err.message);
            return { success: false, error: err.message };
        }

    }

    /*
    - input: JSON with full new alias {"newname" : [ new topics ]}
    */
    validateTopicList(input) {
        try {
            let list = Object.values(input)[0];
            for (let topic of list) {
                if (!validator.validateTopic(topic)) throw new Error('Invalid topic');
            }
            if (new Set(list).size !== list.length) {
                throw new Error('Duplicate topic in list');
            }
            if (list.length < 1) {
                throw new Error('Alias topic list cannot be empty');
            }
        } catch (err) {
            throw err;
        }
    }

}




module.exports = Aliases


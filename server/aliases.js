const fs = require('fs');
const yaml = require('js-yaml');
const util = require('util');
const {logger, jsonlogger, logbooklogger} = require('./logger.js');
const config = require('./config.js').parse();

const FILENAME = process.env.MQTT4SCRIPTS_RULES || '../config/aliases.yaml';

class Aliases {

    constructor() {
        this.loadAliases();
    }

    loadAliases() {
        logger.info("Parsing aliases");
        this.jsonContents = {};
        this.aliases = {};
        if (fs.existsSync(FILENAME)) {
            try {
                this.aliases = yaml.safeLoad(fs.readFileSync(FILENAME, 'utf8'));
                logger.info(JSON.stringify(this.aliases));
                process.exit(1);
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

}

module.exports = Aliases


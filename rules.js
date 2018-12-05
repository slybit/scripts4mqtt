const fs = require('fs');
const util = require('util');
const logger = require('./logger.js');

class Rules {
    constructor(config) {
        this.config = config;        
        this.rules = this.loadRules();
        console.log(JSON.stringify(this.rules, null, 4));
    }

    loadRules() {        
        logger.info("parsing rules");
        const file = process.env.MQTT4SCRIPTS_RULES || 'rules.json';
        let rulesList = [];
        let rules = [];
        if (fs.existsSync(file)) {
            try {
                var contents = fs.readFileSync(file);
                var jsonContent = JSON.parse(contents);                
                if (Array.isArray(jsonContent)) {
                    rulesList = jsonContent;
                } else {
                    rulesList = [jsonContent];
                }
                //return jsonContent;
            } catch (e) {
                logger.warn(e);
            }
        }
        for (let r of rulesList) {
            try {
                let rule = Rule.fromJSON(r);
                rules.push(rule);
                logger.info(rule);
            } catch (e) {
                logger.warn(e);
            }
        }
        return rules;
    }
}


    

class Rule {

    static fromJSON(json) {
        let rule = new Rule();
        logger.info("Parsing rule %s", json.name);
        rule.name = json.name;
        if (json.ontrue) {
            rule.onTrueActions = Rule.parseActions(json.ontrue);
        }
        return rule;
    }

    static parseActions(json) {
        let actions = [];
        if (Array.isArray(json)) {
            actions = json;
        } else {
            actions = [json];
        }        
        let result = [];
        for (let a of actions) {            
            try {
                switch (a.type.toLowerCase()) {
                    case "mqtt":
                        console.log(a);
                        result.push(SetValueAction.fromJSON(a));
                        break;
                }
            } catch (err) {
                logger.warn(err);
            }
        }
        return result;
    }

    static parseCondition(json) {

    }

    constructor() {
        this.name = undefined;
        this.logic = undefined;
        this.conditions = [];
        this.onTrueActions = [];
        this.onFalseActions = [];
    }



    toString() {
        return util.format("<Rule> %s - #conditions: %d, #onTrueActions: %d, #onFalseActions: %d", this.name, this.conditions.length, this.onTrueActions.length, this.onFalseActions.length);
    }

    

}

class Action {
    constructor() {
        this.delay = 0;
    }

    execute() {
        logger.info("Bang! Action executed.");
    }    
}

class SetValueAction extends Action {
    constructor(topic, val) {
        super();
        this.topic = topic;
        this.val = val;        
    }

    static fromJSON(json) {        
        return new SetValueAction(json.topic, json.val);
    }
}

module.exports = {Rules, Rule}
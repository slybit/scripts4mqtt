const fs = require('fs');
const util = require('util');
const logger = require('./logger.js');

class Rules {
    constructor(config) {
        this.config = config;        
        this.rules = this.loadRules();
        //console.log(JSON.stringify(this.rules, null, 4));
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
                let rule = new Rule(r);
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

    constructor(json) {
        logger.info("Parsing rule %s", json.name);
        this.name = json.name;
        this.conditions = [];
        this.logic = this.parseCondition(json.condition);
        this.onFalseActions = [];
        this.onTrueActions = Rule.parseActions(json.ontrue);        
    }

    static parseActions(json) {
        let actions = [];
        if (json === undefined) {
            return [];
        } else if (Array.isArray(json)) {
            actions = json;
        } else {
            actions = [json];
        }        
        let result = [];
        for (let a of actions) {            
            try {
                switch (a.type.toLowerCase()) {
                    case "mqtt":
                        result.push(new SetValueAction(a));
                        break;
                }
            } catch (err) {
                logger.warn(err);
            }
        }
        return result;
    }

    static evalLogic(logic) {
        if (logic.type === "or") {
            let result = false;
            for (let c of logic.condition) {
                if (Rule.evalLogic(c)) {
                    result = true;
                    break;
                }
            }
            return result;
        } else if (logic.type === "and") {
            let result = true;
            for (let c of logic.condition) {
                if (!Rule.evalLogic(c)) {
                    result = false;
                    break;
                }
            }
            return result;
        } else {
            return logic.state;
        }
    }

    // json can be either an array of conditions, or a single (nested) condition
    // a condition has a 'type' and a 'condition' -> itself again an array (for 'or' and 'and') or a nested condition
    parseCondition(json) {
        if (Array.isArray(json)) {
            let result = [];
            for (let c of json) {
                result.push(this.parseCondition(c));
            }
            return result;
        } else {
            if (!json.type) {
                throw new Error('No type provided for condition.');
            }
            let c = undefined;
            switch (json.type.toLowerCase()) {
                case "and":
                case "or":
                    if (!Array.isArray(json.condition)) {
                        throw new Error("OR and AND conditions require an array in the condition field.");
                    }
                    c = {
                        'type': json.type.toLowerCase(),
                        'condition': this.parseCondition(json.condition)
                    };
                    break;
                case "mqtt":
                    c = new MqttCondition(json);
                    this.conditions.push(c);
                    break;
                case "simple":
                    c = new SimpleCondition(json);
                    this.conditions.push(c);
                    break;
                default:
                    throw new Error("Unknown condition type: " + json.type);
            }
            return c;
        }        
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

    constructor(json) {
        super();
        this.topic = json.topic;
        this.val = json.val;        
    }

}



/* --------------------------------------------------------------------------------------------
 * Condition
-------------------------------------------------------------------------------------------- */

const Trigger = Object.freeze({
    "no": 10,
    "on_flip": 11,
    "on_flip_true": 12,
    "on_flip_false": 13,
    "always": 14,
});


class Condition {

    constructor(json) {
        this.trigger = Trigger[json.trigger] ? Trigger[json.trigger] : Trigger["no"];
        this.oldState = undefined;
        this.state = undefined;
    }
    
    flipped() {
        return this.state !== this.oldState;
    }

    flippedFalse() {
        return !this.state && this.flipped();
    }

    flippedTrue() {
        return this.state && this.flipped();
    }

    triggered() {
        return (this.trigger == Trigger.always) ||
               (this.trigger == Trigger.on_flip && self.flipped()) ||
               (this.trigger == Trigger.on_flip_true && self.flippedTrue()) ||
               (this.trigger == Trigger.on_flip_false && self.flippedFalse());
    }

    /*
        Evaluates this condition.
        It must update these values for the condition:
            _oldValue
            _value            
        It must return True if a complete evaluation of the rule is required, False if not.
    */
    evaluate() {
        throw new Error('You have to implement the method evaluate!');
    }
}


class MqttCondition extends Condition {

    constructor(json) {
        super(json);
        this.topic = json.topic;
        this.eval = json.eval;
        if (!(this.topic && this.eval))
            throw new Error('Mqtt condition missing topic or eval');
    }

}

class SimpleCondition extends Condition {

    constructor(json) {
        super(json);
        this.state = (json.val == true);
    }

}







module.exports = {Rules, Rule}
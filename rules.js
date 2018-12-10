const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const mustache = require('mustache');
const logger = require('./logger.js');
const engine = require('./engine.js');
const config = require('./config.js').parse();

const topicToArray = function(topic) {
    return topic.split('/');
}

class Rules {
    constructor(config) {
        this.config = config;
        this.loadRules();
        //console.log(JSON.stringify(this.rules, null, 4));
    }

    loadRules() {
        logger.info("parsing rules");
        const file = process.env.MQTT4SCRIPTS_RULES || 'rules.json';
        this.jsonContents = {};
        this.rules = {};
        if (fs.existsSync(file)) {
            try {
                var contents = fs.readFileSync(file);
                this.jsonContents = JSON.parse(contents);
            } catch (e) {
                logger.warn(e);
            }
        }
        for (let key in this.jsonContents) {
            try {
                let rule = new Rule(this.jsonContents[key]);
                this.rules[key] = rule;
                logger.info(rule);
            } catch (e) {
                logger.warn(e);
            }
        }
    }

    saveRules() {
        logger.info("saving rules");
        const file = process.env.MQTT4SCRIPTS_RULES || 'rules.json';
        try {
            fs.writeFileSync(file, JSON.stringify(this.jsonContents));
        } catch (e) {
            logger.warn(e);
        }
    }


    /*
    * This method is called by the mqtt library for every message that was recieved.
      It will go over all MqttConditions in all rules and evaluate them.
      Only the topic of the message is provided, the data should be taken from 'engine.store'
    */
    mqttConditionChecker(topic) {
        logger.silly('mqttConditionChecker called');
        for (let key in this.rules) {
            let rule = this.rules[key];
            for (let c of rule.conditions)
                if ((c instanceof MqttCondition) && (c.topic === topic)) {
                    logger.silly('Mqtt %s received, evaluating rule %s', topic, rule.name);
                    if (c.evaluate())
                        rule.scheduleActions()
                }
            }

    }

    // REST APIs
    listAllRules() {
        let list = [];
        for (let key in this.jsonContents) {
            list.push({
                key: key,
                name : this.jsonContents[key].name,
            });

        }
        return list;
    }

    createRule(input) {
        const id = Rule.generateId();
        return this.updateRule(id, input);
    }

    updateRule(id, input) {
        try {
            const rule = new Rule(input);
            this.rules[id] = rule;
            this.jsonContents[id] = input;
            this.saveRules();
            console.log(JSON.stringify(this.jsonContents));
            return id;
        } catch (err) {
            logger.warn(err);
            return err.message;
        }
    }

    deleteRule(id) {
        delete this.rules[id];
        delete this.jsonContents[id];
        this.saveRules();
        return {success : true};
    }

    getRule(id) {
        return this.jsonContents[id];
    }

}




class Rule {

    constructor(json) {
        logger.info("Parsing rule %s", json.name);
        this.name = json.name;
        this.conditions = [];
        this.logic = this.parseCondition(json.condition);
        this.onFalseActions = Rule.parseActions(json.onfalse);
        this.onTrueActions = Rule.parseActions(json.ontrue);
    }

    static generateId() {
        return crypto.randomBytes(6).toString("hex");
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
            switch (a.type.toLowerCase()) {
                case "mqtt":
                    result.push(new SetValueAction(a));
                    break;
                default:
                    throw new Error('Unknown action type ' + a.type);
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

    scheduleActions() {
        logger.info('Scheduling actions for rule %s', this.name);
        let actions = [];
        if (Rule.evalLogic(this.logic))
            actions = this.onTrueActions;
        else
            actions = this.onFalseActions;
        for (let a of actions) a.execute();
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

    execute() {
        engine.mqttClient.publish(this.topic, JSON.stringify(this.val));
        logger.info('published %s -> %s', this.topic, this.val);
        //TODO: make value mustache expression
        //TODO: add option for retain true or false
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
               (this.trigger == Trigger.on_flip && this.flipped()) ||
               (this.trigger == Trigger.on_flip_true && this.flippedTrue()) ||
               (this.trigger == Trigger.on_flip_false && this.flippedFalse());
    }

    /*
        Evaluates this condition.
        It must update these values for the condition:
            - oldValue
            - value
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

    evaluate() {
        this.oldState = this.state;
        this.state = false;

        let data = {};
        data.M = engine.store.get(this.topic);
        data.T = topicToArray(this.topic);
        try {
            let script = mustache.render(this.eval, data);
            console.log(script);
            this.state = engine.runScript(script);
        } catch (err) {
            console.log(err);
        }
        logger.debug("Rule state updated from %s to %s; triggered = %s", this.oldState, this.state, this.triggered());

        return this.triggered();
    }

}

class SimpleCondition extends Condition {

    constructor(json) {
        super(json);
        this.state = (json.val == true);
    }

    evaluate() {
        this.oldState = this.state;
        return this.state;
    }

}





const rules = new Rules(config);

//module.exports = {Rules, Rule}
module.exports = rules;
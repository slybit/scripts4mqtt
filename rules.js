const fs = require('fs');
const util = require('util');
const logger = require('./logger.js');
const engine = require('./engine.js');
const mustache = require('mustache');

const topicToArray = function(topic) {
    return topic.split('/');
}

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


    /*
    * This method is called by the mqtt library for every message that was recieved.
      It will go over all MqttConditions in all rules and evaluate them.
      Only the topic of the message is provided, the data should be taken from 'engine.store'
    */
    mqttConditionChecker(topic) {
        logger.silly('mqttConditionChecker called');
        for (let rule of this.rules)
            for (let c of rule.conditions)
                if ((c instanceof MqttCondition) && (c.topic === topic)) {
                    logger.silly('Mqtt %s received, evaluating rule %s', topic, rule.name);
                    if (c.evaluate())
                        rule.scheduleActions()
                }

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







module.exports = {Rules, Rule}
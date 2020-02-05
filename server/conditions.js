const mustache = require('mustache');
const jmespath = require('jmespath');
const { validateMqttCondition, validateAliasCondition, validateCronCondition } = require('./validator');
const { logger, jsonlogger, logbooklogger } = require('./logger.js');
const Engine = require('./engine.js');
const Aliases = require('./aliases.js');
const cronmatch = require('./cronmatch.js');


/* --------------------------------------------------------------------------------------------
 * Condition
-------------------------------------------------------------------------------------------- */

const topicToArray = function (topic) {
    return topic.split('/');
}

const Trigger = Object.freeze({
    "no": 10,
    "on_flip": 11,
    "on_flip_true": 12,
    "on_flip_false": 13,
    "always": 14,
});


class Condition {

    constructor(json, rule) {
        this.rule = rule;
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
    evaluate(context) {
        throw new Error('You have to implement the method evaluate!');
    }
}


class MqttCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.topic = json.topic;
        this.jmespath = json.jmespath;
        this.operator = json.operator ? json.operator : "eq";
        this.value = json.value;
        validateMqttCondition(json);
    }

    evaluate(context) {
        this.oldState = this.state;
        this.state = false;
        /*
        let data = {};
        data.M = Engine.getInstance().mqttStore.get(this.topic) ? Engine.getInstance().mqttStore.get(this.topic).data : undefined;
        data.T = topicToArray(this.topic);
        try {
            let script = mustache.render(this.eval, data);
            //logger.debug('evaluating script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
            this.state = Engine.getInstance().runScript(script);
        } catch (err) {
            logger.error(err);
            console.log(err.stack);
        }
        */

        let message = Engine.getInstance().mqttStore.get(this.topic) ? Engine.getInstance().mqttStore.get(this.topic).data : undefined;
        try {
            if (this.value == "*") {
                this.state = true;
            } else {
                let data = undefined;
                if (this.jmespath && message)
                    data = jmespath.search(message, this.jmespath);
                else
                    data = message;
                switch (this.operator) {
                    case "eq":
                        // we use double == so that Javascript converts them to the same type
                        // this allows to compare strings with numbers
                        this.state = (data == this.value);
                        break;
                    case "gt":
                        this.state = (data > this.value);
                        break;
                    case "lt":
                        this.state = (data < this.value);
                        break;
                    case "neq":
                        this.state = !(data == this.value);
                        break;
                }
                logger.silly("Compared [%s] %s [%s]", data, this.operator, this.value);
            }
        } catch (err) {
            logger.error('could not parse message to json: %s', message);
            logger.error(err.stack);
        }
        logger.info("Rule [%s]: MQTT Condition state updated from %s to %s; flipped = %s", this.rule.name, this.oldState, this.state, this.flipped());
        jsonlogger.info("MQTT condition evaluated", { ruleId: this.rule.id, ruleName: this.rule.name, type: "condition", subtype: "mqtt", details: `topic: ${this.topic}, value: ${JSON.stringify(message)}, oldState: ${this.oldState}, state: ${this.state}, flipped: ${this.flipped()}` });
        return this.triggered();
    }

}


class CronCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.onExpression = json.on ? json.on.trim() : undefined;
        this.offExpression = json.off ? json.off.trim() : undefined;
        validateCronCondition(json);
    }

    evaluate(context) {
        this.oldState = this.state;
        let match = false;
        const currTime = new Date();
        // go over the onPatterns first
        if (this.onExpression !== undefined && this.onExpression !== "" && this.onExpression !== "-" && cronmatch.match(this.onExpression, currTime)) {
            this.state = true;
            match = true;
        }

        // go over the offPatterns second
        if (this.offExpression !== undefined && this.offExpression !== "" && this.offExpression !== "-" && cronmatch.match(this.offExpression, currTime)) {
            this.state = false;
            match = true;
        }

        if (match) {
            logger.info('Rule [%s]: cron evaluated: state: %s, match: %s, flipped: %s', this.rule.name, this.state, match, this.flipped());
            jsonlogger.info("Cron condition evaluated", { ruleId: this.rule.id, ruleName: this.rule.name, type: "condition", subtype: "cron", details: `match: ${match}, state: ${this.state}, flipped: ${this.flipped()}` });
        }
        return match && this.triggered()
    }
}

class SimpleCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.state = json.value ? true : false;
    }

    evaluate(context) {
        this.oldState = this.state;
        return this.state;
    }

}

module.exports = { CronCondition, MqttCondition, SimpleCondition }
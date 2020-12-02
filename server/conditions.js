const mustache = require('mustache');
const jmespath = require('jmespath');
const { validateMqttCondition, validateAliasCondition, validateCronCondition } = require('./validator');
const { logger, logbooklogger } = require('./logger.js');
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
    evaluate(canTrigger = true) {
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

    // the canTrigger parameter is used to prevent any triggers for retained messages or during creation of the rule objects
    evaluate(canTrigger) {
        this.oldState = this.state;
        this.state = false;
        let message = Engine.getInstance().mqttStore.get(this.topic) ? Engine.getInstance().mqttStore.get(this.topic).data : undefined;
        let data = undefined;
        try {
            if (this.value == "*") {
                this.state = true;
            } else {
                
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
            }
        } catch (err) {
            logger.error('Error during MqttCondition evaluation', {error: `Could not parse message to json: ${message}`});
            //logger.error(err.stack);
        }
        logger.info("MQTT condition evaluated", {
            ruleId: this.rule.id,
            ruleName: this.rule.name,
            type: "condition",
            subtype: "mqtt",
            oldState: this.oldState ? "true" : "false",
            state: this.state ? "true" : "false",
            triggered: canTrigger && this.triggered() ? "true" : "false",
            details: `topic: ${this.topic}, value: ${JSON.stringify(message, null, 1)}`,
            topic: `${this.topic}`,
            value: message,
            comparison: `[${data}] ${this.operator} [${this.value}]`
         });
        return canTrigger && this.triggered();
    }

}


class CronCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.onExpression = json.on ? json.on.trim() : undefined;
        this.offExpression = json.off ? json.off.trim() : undefined;
        validateCronCondition(json);
    }

    // the canTrigger parameter is used to prevent any triggers for retained messages
    evaluate(canTrigger = true) {
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
            //logger.info('Rule [%s]: cron evaluated: state: %s, match: %s, flipped: %s', this.rule.name, this.state, match, this.flipped());
            logger.info("Cron condition evaluated", {
                ruleId: this.rule.id,
                ruleName: this.rule.name,
                type: "condition",
                subtype: "cron",
                oldState: this.oldState ? "true" : "false",
                state: this.state ? "true" : "false",
                triggered: canTrigger && this.triggered() ? "true" : "false",
            });
        }
        return match && canTrigger && this.triggered()
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
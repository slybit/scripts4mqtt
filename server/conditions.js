const mustache = require('mustache');
const { validateMqttCondition, validateAliasCondition, validateCronCondition } = require('./validator');
const {logger, jsonlogger, logbooklogger} = require('./logger.js');
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
    evaluate() {
        throw new Error('You have to implement the method evaluate!');
    }
}


class MqttCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.topic = json.topic;
        this.eval = json.eval;
        validateMqttCondition(json);
    }

    evaluate() {
        this.oldState = this.state;
        this.state = false;

        let data = {};
        data.M = Engine.getInstance().mqttStore.get(this.topic) ? Engine.getInstance().mqttStore.get(this.topic).data : undefined;
        data.T = topicToArray(this.topic);
        try {
            let script = mustache.render(this.eval, data);
            //logger.debug('evaluating script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
            this.state = Engine.getInstance().runScript(script);
        } catch (err) {
            logger.error(err);
        }
        logger.debug("MQTT Condition state updated from %s to %s; flipped = %s", this.oldState, this.state, this.flipped());
        jsonlogger.info("MQTT condition evaluated", {ruleId: this.rule.id, ruleName: this.rule.name, type: "condition", subtype: "mqtt", details: `topic: ${this.topic}, value: ${JSON.stringify(data.M)}, oldState: ${this.oldState}, state: ${this.state}, flipped: ${this.flipped()}`});
        return this.triggered();
    }

}

class AliasCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.alias = json.alias;
        this.eval = json.eval;
        validateAliasCondition(json);
    }

    evaluate() {
        this.oldState = this.state;
        let state = false;

        for (let topic of this.getTopics()) {
            let data = {};
            data.M = Engine.getInstance().mqttStore.get(topic) ? Engine.getInstance().mqttStore.get(topic).data : {};
            data.T = topicToArray(topic);
            console.log(JSON.stringify(data));
            try {
                let script = mustache.render(this.eval, data);
                //logger.debug('evaluating script:\n# ----- start script -----\n%s\n# -----  end script  -----', script);
                state = Engine.getInstance().runScript(script);
                if (state) break;
            } catch (err) {
                logger.error(err);
            }
        }
        this.state = state;
        logger.debug("Alias Condition state updated from %s to %s; flipped = %s", this.oldState, this.state, this.flipped());
        jsonlogger.info("Alias condition evaluated", {ruleId: this.rule.id, ruleName: this.rule.name, type: "condition", subtype: "mqtt", details: `alias: ${this.alias}, oldState: ${this.oldState}, state: ${this.state}, flipped: ${this.flipped()}`});
        return this.triggered();
    }

    getTopics() {
        let aliases = new Aliases();
        return aliases.getTopics(this.alias);
    }

}

class CronCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.onExpression = json.on ? json.on.trim() : undefined;
        this.offExpression = json.off ? json.off.trim() : undefined;
        validateCronCondition(json);
    }

    evaluate() {
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
            logger.info('cron evaluated: state: %s, match: %s, flipped: %s', this.state, match, this.flipped());
            jsonlogger.info("Cron condition evaluated", {ruleId: this.rule.id, ruleName: this.rule.name, type: "condition", subtype: "cron", details: `match: ${match}, state: ${this.state}, flipped: ${this.flipped()}`});
        }
        return match && this.triggered()
    }
}

class SimpleCondition extends Condition {

    constructor(json, rule) {
        super(json, rule);
        this.state = json.value ? true : false;
    }

    evaluate() {
        this.oldState = this.state;
        return this.state;
    }

}

module.exports = {CronCondition, MqttCondition, AliasCondition, SimpleCondition}
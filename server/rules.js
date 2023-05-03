const fs = require('fs');
const yaml = require('js-yaml');
const util = require('util');
const crypto = require('crypto');
const { logger, logbooklogger } = require('./logger.js');
const Engine = require('./engine.js');
const { EMailAction, LogBookAction, PushoverAction, ScriptAction, SetValueAction, WebHookAction } = require('./actions.js')
const { CronCondition, MqttCondition, AliasCondition, SimpleCondition } = require('./conditions.js')
const { error } = require('winston');

const FILENAME = process.env.MQTT4SCRIPTS_RULES || '../config/rules.yaml';

// TODO:
// - destroy pending actions when updating a rule !!!



const topicToArray = function (topic) {
    return topic.split('/');
}

class Rules {
    constructor() {
        this.lastMinutes = -1;
    }

    loadRules() {
        logger.info("Parsing rules");
        this.jsonContents = {};
        this.rules = {};
        if (fs.existsSync(FILENAME)) {
            try {
                this.jsonContents = yaml.load(fs.readFileSync(FILENAME, 'utf8'));
            } catch (e) {
                logger.error("Error parsing rules", { error: e.toString() });
                process.exit(1);
            }
        }

        for (let key in this.jsonContents) {
            try {
                let rule = new Rule(key, this.jsonContents[key]);
                this.rules[key] = rule;
                logger.info('loaded %s', rule.toString());
            } catch (e) {
                logger.error('Error loading rule', { ruleId: key, error: e.toString() });
                process.exit(1);
            }
        }
    }




    saveRules() {
        logger.info("Saving rules");
        try {
            fs.writeFileSync(FILENAME, yaml.dump(this.jsonContents));
        } catch (e) {
            logger.error("Error saving rules", { error: e.message });
        }
    }



    /*
      This method is called by the mqtt library for every message that was received.
      It will go over all MqttConditions in all rules and evaluate them.
      Only the topic of the message is provided, the data should be taken from 'engine.mqttStore'
    */
    mqttConditionChecker(topic, withActions = true) {
        //logger.silly('MQTT Condition Checker called for %s', topic);
        // build the context of a triggered action, it will be passed through to the 'execute' method of the action.
        let context = {};
        context.H = Engine.getInstance().mqttStore.get(topic) ? Engine.getInstance().mqttStore.get(topic).data : undefined;
        context.topic = topic
        context.T = topicToArray(topic);
        for (let key in this.rules) {
            let rule = this.rules[key];
            for (let c of rule.conditions)
                if ((c instanceof MqttCondition) && (c.topic === topic)) {
                    logger.silly('Rule: topic matches, evaluating...', { ruleId: rule.id, ruleName: rule.name, topic: topic });
                    if (c.evaluate(withActions) && withActions)
                        rule.scheduleActions(context);
                } else if ((c instanceof AliasCondition) && (c.usesTopic(topic))) {
                    logger.silly('Rule: topic matches, evaluating...', { ruleId: rule.id, ruleName: rule.name, topic: topic });
                    if (c.evaluate(withActions, topic) && withActions)
                        rule.scheduleActions(context);
                }
        }
        // TODO: add wildcard topics in the condition
    }



    /*
      This runs every minute. It will go over all CronConditions in all rules and evaluate them.
    */
    scheduleTimerConditionChecker() {
        const date = new Date();
        // build the context of a triggered action, it will be passed through to the 'execute' method of the action.
        let context = {};
        context.date = date.toLocaleString;
        context.topic = "__cron__";
        // calculate delay so next tick will be 5 seconds after the minute mark
        const delay = 60 - ((Math.round(date.getTime() / 1000) - 5) % 60);
        const minutes = date.getMinutes();
        // prevent a double tick in a single minute (is only possible in case tasks take very long or at startup)
        if (minutes !== this.lastMinutes) {
            for (let key in this.rules) {
                let rule = this.rules[key];
                for (let c of rule.conditions)
                    if ((c instanceof CronCondition)) {
                        logger.silly('Rule: cron tick, evaluating cron expressions', { ruleId: rule.id, ruleName: rule.name });
                        if (c.evaluate())
                            rule.scheduleActions(context);
                    }
            }

        }
        setTimeout(this.scheduleTimerConditionChecker.bind(this), delay * 1000);
    }




    /* --------------------------------------------------------------------------------------------
     * API
     -------------------------------------------------------------------------------------------- */

    validateRulesFile() {
        logger.info("Validating rules file");
        if (fs.existsSync(FILENAME)) {
            try {
                this.jsonContents = yaml.load(fs.readFileSync(FILENAME, 'utf8'));
            } catch (e) {
                logger.error('Error while validating rules file: could not read rules file');
                throw (new Error('Could not read rules file'));
            }
        }

        for (let key in this.jsonContents) {
            try {
                new Rule(key, this.jsonContents[key]);
            } catch (e) {
                logger.error('Error while validating rule', { ruleId: key, error: e.toString() });
                throw (new Error('Error while validating rule [' + key + ']'));
            }
        }
    }


    listAllRules() {
        let list = [];
        for (let key in this.jsonContents) {
            list.push({
                key: key,
                category: this.jsonContents[key].category ? this.jsonContents[key].category : "default",
                order: this.jsonContents[key].order,
                name: this.jsonContents[key].name,
                enabled: this.jsonContents[key].enabled
            });

        }
        return { rules: list };
    }

    createRule(input) {
        const id = Rule.generateId();
        try {
            // test the input, this will throw an exception if not ok
            new Rule(id, input);
        } catch (err) {
            let error = new Error("Error during new rule creation: " + err.message);
            logger.error("Error during new rule creation", { input: input, error: err.message });
            throw error;
        }
        return this.updateRule(id, input, true);
    }

    /*
    - id: identifier of the rule to update
    - input: JSON with one or more properties (name, condition, ontrue, onfalse)
    */
    updateRule(id, input, newrule = false) {
        try {
            if (newrule) {
                this.jsonContents[id] = input;
            } else {
                // test the update, this will throw an exception if not ok
                this.testRuleUpdate(id, input);
                // assign the new input to the full jsonContents
                Object.assign(this.jsonContents[id], input);
                // clear pending actions for the rule
                this.rules[id].cancelPendingActions();
            }

            const rule = new Rule(id, this.jsonContents[id]);
            this.rules[id] = rule;

            this.saveRules();
            return {
                rule: {
                    id: id,
                    ...this.jsonContents[id]
                }
            };
        } catch (err) {
            logger.error("Error updating rule", { id: id, input: input, error: err.message });
            throw error;
        }
    }

    testRuleUpdate(id, input) {
        // make a hard copy, apply changes and test
        const cloned = JSON.parse(JSON.stringify(this.jsonContents[id]));
        Object.assign(cloned, input);
        new Rule(id, cloned);

    }

    deleteRule(id) {
        // clear pending actions for the rule
        let rule = this.rules[id];
        rule.cancelPendingActions();
        delete this.rules[id];
        delete this.jsonContents[id];
        this.saveRules();
    }


    getRule(id) {
        if (id in this.jsonContents) {
            return {
                rule: {
                    "id": id,
                    ...this.jsonContents[id]
                }
            };
        } else {
            const error = new Error('Rule id not found: ' + id);
            logger.error("Error getting rule. Rule id not found", { id: id });
            throw error;
        }
    }

    getRuleState(id) {
        const rule = this.rules[id];
        if (rule) {
            for (let c of rule.conditions) {

            }
            return {
                rule: {
                    "id": id,
                    ...this.jsonContents[id]
                }
            };
        } else {
            const error = new Error('Rule id not found: ' + id);
            logger.error("Error getting rule. Rule id not found", { id: id });
            throw error;
        }
    }



    // Helper method, used by the web UI
    nestConditions(flatened) {
        if (!Array.isArray(flatened)) {
            throw new TypeError('input must be of type Array');
        }

        // root (in our case, can only be one - the first "or")
        const condition = {
            "id": flatened[0].id,
            "type": flatened[0].type,
            "condition": []
        };

        function insert(item, cond) {
            if (cond.id === item.path[item.path.length - 1]) {
                delete item.path;
                if (item.type === 'or' || item.type === 'and') {
                    item.condition = [];
                } else {
                    delete item.id;
                }
                cond.condition.push(item);
                return;
            }
            else if (cond.type === 'or' || cond.type === 'and') {
                for (let c of cond.condition) {
                    insert(item, c)
                }
            }
        }

        for (let item of flatened.slice(1)) {
            insert(item, condition);
        }
        return condition;
    }




    /* --------------------------------------------------------------------------------------------
    * Helper functions
    -------------------------------------------------------------------------------------------- */

    // list all aliases used by any rule
    listUsedAliases() {
        let usedAliases = [];
        for (let id in this.jsonContents) Rules._listAliases(this.jsonContents[id].condition, usedAliases);
        return usedAliases;
    }

    // go through a 'condition' JSON statement and extract all the aliases from one or more alias conditions
    // returns an array of the unique aliases it found
    static _listAliases(condition, usedAliases) {
        if (Array.isArray(condition)) {
            for (let c of condition) this.listAliases(c, usedAliases);
        } else {
            switch (condition.type.toLowerCase()) {
                case "and":
                case "or":
                    if (condition.condition) this.listAliases(condition.condition, usedAliases);
                    break;
                case "alias":
                    if (!usedAliases.includes(condition.alias)) usedAliases.push(condition.alias);
                    break;
            }
        }
    }

}

/* --------------------------------------------------------------------------------------------
 * Rule
-------------------------------------------------------------------------------------------- */

class Rule {

    constructor(id, json) {
        this.id = id;
        this.name = json.name;
        this.enabled = json.enabled === undefined ? true : json.enabled;
        this.conditions = [];
        this.logic = this.parseCondition(json.condition);
        this.onFalseActions = this.parseActions(json.onfalse);
        this.onTrueActions = this.parseActions(json.ontrue);
    }

    static generateId() {
        return crypto.randomBytes(6).toString("hex");
    }

    static evalLogic(logic) {
        // logic can only be an array in the first iteration
        // we just turn it in an "or"
        if (Array.isArray(logic)) {
            return Rule.evalLogic({
                type: "or",
                condition: logic
            });
        }

        if (logic.type === "or") {
            let result = logic.condition.length === 0 ? true : false;
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

    parseActions(json) {
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
                    result.push(new SetValueAction(a, this));
                    break;
                case "script":
                    result.push(new ScriptAction(a, this));
                    break;
                case "email":
                    result.push(new EMailAction(a, this));
                    break;
                case "pushover":
                    result.push(new PushoverAction(a, this));
                    break;
                case "logbook":
                    result.push(new LogBookAction(a, this));
                    break;
                case "webhook":
                    result.push(new WebHookAction(a, this));
                    break;
                default:
                    throw new Error('Unknown action type ' + a.type);
            }
        }
        return result;
    }

    /*
    context will contain:
     - for a MQTT condition:
            - context.H = message content at the time the action was triggered (Historic)
            - context.T = topic that triggered the action as an array
            - context.topic = topic that triggered the action as a string (1/2/3)
     - for a Cron condition:
            - context.date = the timestamp of when the action was triggered
            - context.topic = "__cron__"
    */
    scheduleActions(context) {
        if (context.topic === "__cron__") {
            logger.debug('Rule triggered by cron tick', { ruleId: this.id, ruleName: this.name });
        } else {
            logger.debug('Rule triggered by topic', { ruleId: this.id, ruleName: this.name, topic: context.topic });
        }

        if (!this.enabled) {
            logger.debug('Rule disabled, not scheduling actions', { ruleId: this.id, ruleName: this.name });
            return;
        }

        let actions = [];
        if (Rule.evalLogic(this.logic)) {
            logger.debug("Rule scheduling TRUE actions", { ruleId: this.id, ruleName: this.name });
            actions = this.onTrueActions;
        } else {
            logger.debug("Rule scheduling FALSE actions", { ruleId: this.id, ruleName: this.name });
            actions = this.onFalseActions;
        }
        logger.debug("Rule cancelling all pending actions (delay and repeat)", { ruleId: this.id, ruleName: this.name });
        this.cancelPendingActions();

        for (let a of actions) {
            if (a.delay > 0) {
                logger.debug('Rule action schedule - delayed execution', { ruleId: a.rule.id, ruleName: a.rule.name, delay: a.delay });
                a.pending = setTimeout(a.execute.bind(a, context), a.delay);
            } else if (a.delay == 0) {
                logger.debug('Rule action schedule - immediate execution', { ruleId: a.rule.id, ruleName: a.rule.name });
                a.execute(context);
            }
            if (a.interval > 0) {
                logger.debug('Rule action schedule - repeated execution with interval', { ruleId: a.rule.id, ruleName: a.rule.name, interval: a.interval });
                a.repeater = setInterval(a.execute.bind(a, context), a.interval);

            }
        }
    }

    cancelPendingActions() {
        for (let actions of [this.onFalseActions, this.onTrueActions]) {
            for (let a of actions) {
                if (a.pending !== undefined) {
                    clearTimeout(a.pending);
                    a.pending = undefined;
                    logger.debug('Rule pending action cancelled', { ruleId: a.rule.id, ruleName: a.rule.name });
                }
                if (a.repeater !== undefined) {
                    clearInterval(a.repeater);
                    a.repeater = undefined;
                    logger.debug('Rule repeating action cancelled', { ruleId: a.rule.id, ruleName: a.rule.name });
                }
            }
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
                    //if (!Array.isArray(json.condition)) {
                    //    throw new Error("OR and AND conditions require an array in the condition field.");
                    //}
                    if (!json.condition) {
                        throw new Error("OR and AND conditions cannot be empty.");
                    }
                    c = {
                        'type': json.type.toLowerCase(),
                        'condition': this.parseCondition(json.condition)
                    };
                    break;
                case "mqtt":
                    c = new MqttCondition(json, this);
                    // we evaluate the condition now, but prevent any triggers, to initiate the state values
                    c.evaluate(false);
                    this.conditions.push(c);
                    break;
                case "alias":
                    c = new AliasCondition(json, this);
                    // we evaluate the condition now, but prevent any triggers, to initiate the state values
                    c.evaluate(false);
                    this.conditions.push(c);
                    break;
                case "cron":
                    c = new CronCondition(json, this);
                    // we evaluate the condition now, but prevent any triggers, to initiate the state values
                    c.evaluate(false);
                    this.conditions.push(c);
                    break;
                case "simple":
                    c = new SimpleCondition(json, this);
                    // we evaluate the condition now, but prevent any triggers, to initiate the state values
                    c.evaluate(false);
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



const rules = new Rules();
module.exports = rules;

const fs = require('fs');
const yaml = require('js-yaml');
const util = require('util');
const crypto = require('crypto');
const { logger, jsonlogger, logbooklogger } = require('./logger.js');
const Engine = require('./engine.js');
const { EMailAction, LogBookAction, PushoverAction, ScriptAction, SetValueAction, WebHookAction } = require('./actions.js')
const { CronCondition, MqttCondition, SimpleCondition } = require('./conditions.js')
const Aliases = require('./aliases.js');

const FILENAME = process.env.MQTT4SCRIPTS_RULES || '../config/rules.yaml';

// TODO:
// - destroy pending actions when updating a rule !!!



const topicToArray = function (topic) {
    return topic.split('/');
}

class Rules {
    constructor() {
        this.lastMinutes = -1;
        this.loadRules();
    }

    loadRules() {
        logger.info("Parsing rules");
        this.jsonContents = {};
        this.rules = {};
        if (fs.existsSync(FILENAME)) {
            try {
                this.jsonContents = yaml.safeLoad(fs.readFileSync(FILENAME, 'utf8'));
            } catch (e) {
                logger.error(e.toString());
                process.exit(1);
            }
        }

        for (let key in this.jsonContents) {
            try {
                this.rules[key] = [];
                for (let json of Rules.buildRuleSet(this.jsonContents[key])) {
                    this.rules[key].push(new Rule(key, json));
                }

            } catch (e) {
                logger.error('Error loading rule [%s]', key);
                logger.error(e.toString());
                process.exit(1);
            }
        }
    }

    listUsedAliases() {
        let usedAliases = [];
        for (let id in this.jsonContents) Rules.listAliases(this.jsonContents[id].condition, usedAliases);
        return usedAliases;
    }


    // build a set of rules by expanding all the aliases in a rule condition
    // input = json describing a rule config
    // output = array of json objects describing all the expanded rules
    static buildRuleSet(rule) {
        let aliases = new Aliases();
        let ruleSet = [rule];
        let ruleAliases = [];
        Rules.listAliases(rule.condition, ruleAliases);
        for (let alias of ruleAliases) {
            let newRuleSet = []
            for (let c of ruleSet) {
                let topics = aliases.getTopics(alias);
                if (topics.length === 0) throw "Unknown or empty alias used.";
                for (let topic of topics) {
                    let clone = JSON.parse(JSON.stringify(c));
                    Rules.replaceAlias(clone.condition, alias, topic);
                    newRuleSet.push(clone);
                }
            }
            ruleSet = newRuleSet;
        }
        return ruleSet;
    }

    // go through a 'condition' JSON statement and extract all the aliases from one or more alias conditions
    // returns an array of the unique aliases it found
    static listAliases(condition, aliases) {
        if (Array.isArray(condition)) {
            for (let c of condition) this.listAliases(c, aliases);
        } else {
            if (!condition.type) throw new Error('No type provided for condition.');
            switch (condition.type.toLowerCase()) {
                case "and":
                case "or":
                    if (!condition.condition) throw new Error("OR and AND conditions cannot be empty.");
                    this.listAliases(condition.condition, aliases);
                    break;
                case "alias":
                    if (!aliases.includes(condition.alias)) aliases.push(condition.alias);
                    break;
            }
        }
    }

    // replaces all
    static replaceAlias(condition, aliasId, topic) {
        if (Array.isArray(condition)) {
            for (let c of condition) Rules.replaceAlias(c, aliasId, topic);
        } else {
            if (!condition.type) throw new Error('No type provided for condition.');
            switch (condition.type.toLowerCase()) {
                case "and":
                case "or":
                    if (!condition.condition) throw new Error("OR and AND conditions cannot be empty.");
                    Rules.replaceAlias(condition.condition, aliasId, topic);
                    break;
                case "alias":
                    if (condition.alias === aliasId) {
                        delete condition.alias;
                        condition.type = "mqtt";
                        condition.topic = topic;
                    }
                    break;
            }
        }

    }



    saveRules() {
        logger.info("saving rules");
        try {
            fs.writeFileSync(FILENAME, yaml.safeDump(this.jsonContents));
        } catch (e) {
            logger.error(e);
        }
    }



    /*
      This method is called by the mqtt library for every message that was recieved.
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
            let ruleSet = this.rules[key];
            for (let rule of ruleSet) {
                for (let c of rule.conditions)
                    if ((c instanceof MqttCondition) && (c.topic === topic)) {
                        logger.silly('Rule [%s]: matches topic [%s], evaluating...', rule.name, topic);
                        if (c.evaluate(context) && withActions)
                            rule.scheduleActions(context);
                    }
            }
            // TODO: add wildcard topics in the condition
        }

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
                let ruleSet = this.rules[key];
                for (let rule of ruleSet) {
                    for (let c of rule.conditions)
                        if ((c instanceof CronCondition)) {
                            logger.silly('Rule [%s]: cron tick, evaluating cron expressions', rule.name);
                            if (c.evaluate())
                                rule.scheduleActions(context);
                        }
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
                this.jsonContents = yaml.safeLoad(fs.readFileSync(FILENAME, 'utf8'));
            } catch (e) {
                logger.error('Error while validating rules file: could not read rules file');
                throw (new Error('Could not read rules file'));
            }
        }

        for (let key in this.jsonContents) {
            try {
                let expandedRules = Rules.buildRuleSet(this.jsonContents[key]);
                for (let r of expandedRules) {
                    new Rule(key, r);
                }
            } catch (e) {
                logger.error('Error while validating rule [%s]', key);
                logger.error(e.toString());
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
        return list;
    }

    createRule(input) {
        const id = Rule.generateId();
        try {
            // test the input, this will throw an exception if not ok
            new Rule(id, input);
        } catch (err) {
            logger.warn(err);
            return { success: false, error: err.message };
        }
        return this.updateRule(id, input, true);
    }

    /*
    - id: identifier of the rule to update
    - input: JSON with one or more properties (name, condition, ontrue, onfalse)
    */
    updateRule(id, input, newrule = false) {
        //try {
            if (newrule) {
                this.jsonContents[id] = input;
            } else {
                // test the update, this will throw an exception if not ok
                this.testRuleUpdate(id, input);
                // assign the new input to the full jsonContents
                Object.assign(this.jsonContents[id], input);
                // clear pending actions for the rule
                let ruleSet = this.rules[id];
                for (let rule of ruleSet) {
                    rule.cancelPendingActions();
                }
            }


            // replace the rule set
            this.rules[id] = [];
            let expandedRules = Rules.buildRuleSet(this.jsonContents[id]);
            for (let r of expandedRules) {
                this.rules[id].push(new Rule(id, r));
            }

            this.saveRules();
            return {
                success: true,
                rule: {
                    id: id,
                    ...this.jsonContents[id]
                }
            };
        //} catch (err) {
        //    logger.warn(err.message);
        //    return { success: false, message: err.message };
        //}
    }

    testRuleUpdate(id, input) {
        // make a hard copy, apply changes and test
        const cloned = JSON.parse(JSON.stringify(this.jsonContents[id]));
        Object.assign(cloned, input);
        let expandedRules = Rules.buildRuleSet(cloned);
        for (let r of expandedRules) {
            new Rule(id, r);
        }

    }

    deleteRule(id) {
        delete this.rules[id];
        delete this.jsonContents[id];
        this.saveRules();
        return { success: true };
    }

    /*
    getRule(id) {
        let cloned = Object.assign({}, this.jsonContents[id]);
        let list = [];
        let parent = {path: []};
        this.flattenConditions( this.jsonContents[id].condition, list, parent);
        let c2 = JSON.parse(JSON.stringify(list));
        console.log(JSON.stringify(this.nestConditions(c2), undefined, 4));
        cloned.flatConditions = list;
        return cloned;
    }
    */
    getRule(id) {
        if (id in this.jsonContents) {
            return {
                success: true,
                rule: {
                    "id": id,
                    ...this.jsonContents[id]
                }
            };
        } else {
            return {
                success: false,
                message: 'rule id not found'
            };
        }
    }

    // Helper method, used by the web UI
    /*
    flattenConditions(nested, list, parent) {
        let id = list.length > 0 ? list[list.length-1].id + 1 : 1;
        let path = parent.path.slice(0);
        if (parent.id) path.push(parent.id);
        let item = {id: id, type: nested.type, options: nested.options, path: path, isMarked: false};
        list.push(item);
        if (nested.type == 'or' || nested.type == 'and') {
            for (let n of nested.condition)
                this.flattenConditions(n, list, item);
        }
    }
    */

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
            console.log(cond.condition);
            if (cond.id === item.path[item.path.length - 1]) {
                console.log('found');
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
                    console.log('creating new email action');
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
            logger.info('Rule [%s]: TRIGGERED by cron tick', this.name);
        } else {
            logger.info('Rule [%s]: TRIGGERED by topic [%s]', this.name, context.topic);
        }

        if (!this.enabled) {
            logger.info('Rule [%s]: Rule disabled, not scheduling actions', this.name);
            return;
        }

        let actions = [];
        if (Rule.evalLogic(this.logic)) {
            logger.info("Rule [%s]: scheduling TRUE actions", this.name);
            actions = this.onTrueActions;
        } else {
            logger.info("Rule [%s]: scheduling FALSE actions", this.name);
            actions = this.onFalseActions;
        }
        logger.info("Rule [%s]: cancelling all pending actions (delay and repeat)", this.name);
        this.cancelPendingActions();

        for (let a of actions) {
            //console.log(a);
            if (a.delay > 0) {
                logger.info('Rule [%s]: Schedule - delayed execution in %d millesecs', a.rule.name, a.delay);
                a.pending = setTimeout(a.execute.bind(a, context), a.delay);
            } else if (a.delay == 0) {
                logger.info('Rule [%s]: schedule - immediate execution', a.rule.name);
                a.execute(context);
            }
            if (a.interval > 0) {
                logger.info('Rule [%s]: Schedule - repeated execution with interval of %d millesecs', a.rule.name, a.interval);
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
                    logger.info('Rule [%s]:  cancelled pending action', a.rule.name);
                }
                if (a.repeater !== undefined) {
                    clearInterval(a.repeater);
                    a.repeater = undefined;
                    logger.info('Rule [%s]:  cancelled repeating action', a.rule.name);
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
                    this.conditions.push(c);
                    break;
                case "cron":
                    c = new CronCondition(json, this);
                    this.conditions.push(c);
                    break;
                case "simple":
                    c = new SimpleCondition(json, this);
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

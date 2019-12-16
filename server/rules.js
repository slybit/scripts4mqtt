const fs = require('fs');
const yaml = require('js-yaml');
const util = require('util');
const crypto = require('crypto');
const mustache = require('mustache');
const { validateMqttCondition, validateMqttAction, validateCronCondition, validateEmailAction } = require('./validator');
const {logger, jsonlogger, logbooklogger} = require('./logger.js');
const Engine = require('./engine.js');
const config = require('./config.js').parse();
const cronmatch = require('./cronmatch.js')
const { SMTPTransporter, pushover } = require('./utils.js')

const FILENAME = process.env.MQTT4SCRIPTS_RULES || '../config/rules.yaml';

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
                let rule = new Rule(key, this.jsonContents[key]);
                this.rules[key] = rule;
                logger.info('loaded %s', rule.toString());
            } catch (e) {
                logger.error('Error loading rule [%s]', key);
                logger.error(e.toString());
                process.exit(1);
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
        logger.silly('MQTT Condition Checker called for %s', topic);
        for (let key in this.rules) {
            let rule = this.rules[key];
            for (let c of rule.conditions)
                if ((c instanceof MqttCondition) && (c.topic === topic)) {
                    logger.silly('Rule [%s] matches topic [%s], evaluating...', rule.name, topic);
                    if (c.evaluate() && withActions)
                        rule.scheduleActions(topic);
                }
            // TODO: add wildcard topics in the condition
        }

    }

    /*
      This runs every minute. It will go over all CronConditions in all rules and evaluate them.
    */
    scheduleTimerConditionChecker() {
        const date = new Date();
        // calculate delay so next tick will be 5 seconds after the minute mark
        const delay = 60 - ((Math.round(date.getTime() / 1000) - 5) % 60);
        const minutes = date.getMinutes();
        // prevent a double tick in a single minute (is only possible in case tasks take very long or at startup)
        if (minutes !== this.lastMinutes) {
            for (let key in this.rules) {
                let rule = this.rules[key];
                for (let c of rule.conditions)
                    if ((c instanceof CronCondition)) {
                        logger.silly('Cron tick, evaluating...', rule.name);
                        if (c.evaluate())
                            rule.scheduleActions("__cron__");
                    }
            }
        }
        setTimeout(this.scheduleTimerConditionChecker.bind(this), delay * 1000);
    }

    /*
     * REST APIs
     */

    reload() {
        try {
            this.validateRulesFile();
        } catch (err) {
            return ({
                'success': false,
                'error': err.message
            });
        }
        // validation ok
        this.loadRules();
        return ({
            'success': true
        });
    }

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
                new Rule(key, this.jsonContents[key]);
            } catch (e) {
                logger.error('Error while validating rule [%s]', key);
                logger.error(e.toString());
                throw (new Error('Error while validating rule [' + key + ']'));
            }
        }
    }


    listAllRules() {
        let list = [];
        for (let key in this.rules) {
            list.push({
                key: key,
                name: this.rules[key].name,
                enabled: this.rules[key].enabled
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
        try {

            if (newrule) {
                this.jsonContents[id] = input;
            } else {
                // test the update, this will throw an exception if not ok
                this.testRuleUpdate(id, input);
                Object.assign(this.jsonContents[id], input);
            }
            const rule = new Rule(id, this.jsonContents[id]);
            this.rules[id] = rule;
            this.saveRules();
            return {
                success: true,
                newrule: {
                    id: id,
                    ...this.jsonContents[id]
                }
            };
        } catch (err) {
            logger.warn(err);
            return { success: false, error: err.message };
        }
    }

    testRuleUpdate(id, input) {
        // make a hard copy, apply changes and test
        const cloned = JSON.parse(JSON.stringify(this.jsonContents[id]));
        Object.assign(cloned, input);
        new Rule(id, cloned);
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
        return {
            "id": id,
            ...this.jsonContents[id]
        };
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


const PendingOptions = Object.freeze({
    "never": 0,
    "always": 1,
    "topic": 2
});


class Rule {



    constructor(id, json) {
        this.id = id;
        this.name = json.name;
        this.enabled = json.enabled === undefined ? true : json.enabled;
        this.pendingOption = PendingOptions[json.pendingOption] ? PendingOptions[json.pendingOption] : PendingOptions["always"];
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
                default:
                    throw new Error('Unknown action type ' + a.type);
            }
        }
        return result;
    }

    scheduleActions(topic) {
        if (!this.enabled) {
            logger.silly('Rule disabled, not scheduling actions for rule %s', this.name);
            return;
        }
        logger.info('Scheduling actions for rule %s', this.name);
        let actions = [];
        if (Rule.evalLogic(this.logic)) {
            actions = this.onTrueActions;
        } else {
            actions = this.onFalseActions;
        }
        for (let a of actions) { 
            if (a.delay > 0) {
                if (this.pendingOption === PendingOptions["always"]) {
                    // always cancel an exiting pending action
                    if (a.pending !== undefined) {
                        clearTimeout(a.pending);
                        a.pending = undefined;
                        logger.info('cancelled pending action for %s', typeof (a));
                    }
                    a.pending = setTimeout(a.execute.bind(a), a.delay);
                    logger.info('delayed execution for %s in %d millesecs', typeof (a), a.delay);
                } else if (this.pendingOption === PendingOptions["topic"]) {
                    // only cancel the exiting pending action for the same topic
                    if (a.pendingTopics[topic] !== undefined) {
                        clearTimeout(a.pendingTopics[topic]);
                        a.pendingTopics[topic] = undefined;
                        logger.info('cancelled pending action for topic [%s] for %s', topic, typeof (a));
                    }
                    a.pendingTopics[topic] = setTimeout(a.execute.bind(a), a.delay);
                    logger.info('delayed execution for for topic [%s] %s in %d millesecs', topic, typeof (a), a.delay);
                } else {
                    // default: 'never'; just schedule the action with a delay and dont kill any existing pending actions
                    setTimeout(a.execute.bind(a), a.delay);
                    logger.info('delayed execution for %s in %d millesecs', typeof (a), a.delay);
                }
            } else {
                a.execute();
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



/* --------------------------------------------------------------------------------------------
 * Action
-------------------------------------------------------------------------------------------- */


class Action {
    constructor(json, rule) {
        this.rule = rule;
        this.delay = json.delay ? json.delay : 0;
        // only used incase the user selects "same topic" for the Pending Option
        this.pendingTopics = {};
        // used in case of cron conditions being the trigger or the user selecting "always" or "never"
        this.pending == undefined;
    }

    execute() {
        logger.info("Bang! Action executed.");
    }
}

class SetValueAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.topic = json.topic;
        this.value = json.value;
        validateMqttAction(json);
    }

    execute() {
        if (this.topic !== undefined && this.value !== undefined) {
            Engine.getInstance().mqttClient.publish(this.topic, JSON.stringify(this.value));
            logger.info('SetValueAction published %s -> %s', this.topic, this.value);
            jsonlogger.info("SetValueAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: `"${this.value}" to ${this.topic}`});
        }

        //TODO: make value mustache expression
        //TODO: add option for retain true or false
    }

}

class ScriptAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.topic = json.topic;
        this.script = json.script;
    }

    execute() {
        logger.info('executing ScriptAction');
        try {
            Engine.getInstance().runScript(this.script);
            jsonlogger.info("ScriptAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script"});
        } catch (err) {
            logger.error('ERROR running script:\n# ----- start script -----\n%s\n# -----  end script  -----', this.script);
            logger.error(err);
        }
    }

}

class EMailAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.msg = {
            to: json.to,
            subject: json.subject,
            body: json.body,
        }
        validateEmailAction(json);
    }

    execute() {
        logger.info('executing EMailAction');
        const action = this;

        const mailOptions = {
            from: config.email.from,
            ...this.msg
        };

        SMTPTransporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                logger.error('ERROR sending email');
                logger.error(err);
            } else {
                logger.info('mail sent succesfully');
                jsonlogger.info("EMailAction executed", {ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${action.msg.subject}`});
            }
        });
    }

}

class PushoverAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.msg = {
            message: json.message,
            title: json.title,
            sound: json.sound ? json.sound : "none",
            priority: json.priority ? json.priority : 0
        }
    }

    execute() {
        logger.info('executing PushoverAction');
        const action = this;
        pushover.send(this.msg, function (err, result) {
            if (err) {
                logger.error('ERROR sending Pushover notification');
                logger.error(err);
            } else {
                logger.info('Pushover notification sent succesfully');
                jsonlogger.info("PushoverAction executed", {ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${action.msg.title}`});
            }
        });
    }

}


class LogBookAction extends Action {

    constructor(json, rule) {
        super(json, rule);    
        this.message = json.message;    
    }

    execute() {        
        if (this.message !== undefined) {            
            //logbooklogger.info("Entry", {message: this.message});
            logbooklogger.info(this.message);
            logger.info('LogBookAction called with message %s', this.message);
            jsonlogger.info("LogBookAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${this.message}`});
            
        }
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





const rules = new Rules();

//module.exports = {Rules, Rule}
module.exports = rules;

const mustache = require('mustache');
const {validateMqttAction, validateEmailAction } = require('./validator');
const {logger, jsonlogger, logbooklogger} = require('./logger.js');
const Engine = require('./engine.js');
const config = require('./config.js').parse();
const { SMTPTransporter, pushover } = require('./utils.js')

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

    execute(context) {
        // if the context contains a Historic message value, also add the current value
        if (context.H) {
            context.M = Engine.getInstance().mqttStore.get(context.topic) ? Engine.getInstance().mqttStore.get(context.topic).data : undefined;
        }
    }
}

class SetValueAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.topic = json.topic;
        this.value = json.value;
        validateMqttAction(json);
    }

    execute(context) {
        super.execute(context);
        if (this.topic !== undefined && this.value !== undefined) {
            let data = "";
            if (typeof this.value === 'string' || this.value instanceof Buffer || this.value instanceof ArrayBuffer) {
                data = this.value;
            } else {
                try {
                    data = this.value.toString();
                } catch (err) {
                    logger.error("Could not convert value to String - sending empty message");
                }
            }
            Engine.getInstance().mqttClient.publish(this.topic, data);
            logger.info('Rule [%s]: SetValueAction published %s -> %s', this.rule.name, this.topic, data);
            jsonlogger.info("SetValueAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: `[${data}] to ${this.topic}`});
        }

        //TODO: make value mustache expression
        //TODO: add option for retain true or false
    }

}

class ScriptAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        //this.topic = json.topic;
        this.script = json.script;
    }

    execute(context) {
        super.execute(context);
        try {
            Engine.getInstance().runScript(this.script);
            logger.info('Rule [%s]: ScriptAction executed', this.rule.name);
            jsonlogger.info("ScriptAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script"});
        } catch (err) {
            logger.error('Rule [%s]: ERROR running script:\n# ----- start script -----\n%s\n# -----  end script  -----', this.rule.name, this.script);
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

    execute(context) {
        super.execute(context);
        const action = this;

        const mailOptions = {
            from: config.email.from,
            ...this.msg
        };

        SMTPTransporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                logger.error('Rule [%s]: ERROR EMailAction failed', this.rule.name);
                logger.error(err);
            } else {
                logger.info('Rule [%s]: EMailAction executed', this.rule.name);
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

    execute(context) {
        super.execute(context);
        const action = this;
        pushover.send(this.msg, function (err, result) {
            if (err) {
                logger.error('Rule [%s]: ERROR sending Pushover notification', this.rule.name);
                logger.error(err);
            } else {
                logger.info('Rule [%s]: Pushover notification sent succesfully', this.rule.name);
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

    execute(context) {
        super.execute(context);
        if (this.message !== undefined) {
            try {
                let finalMessage = mustache.render(this.message, context);
                logbooklogger.info(finalMessage);
                logger.info('Rule [%s]: LogBookAction called with message %s', this.rule.name, finalMessage);
                jsonlogger.info("LogBookAction executed", {ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${finalMessage}`});
            } catch (err) {
                logger.error('Rule [%s]: ERROR LogBookAction failed', this.rule.name);
                logger.error(err);
            }
        }
    }

}


module.exports = {EMailAction, LogBookAction, PushoverAction, ScriptAction, SetValueAction}
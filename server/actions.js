const mustache = require('mustache');
const axios = require('axios');
const { validateMqttAction, validateEmailAction } = require('./validator');
const { logger, logbooklogger } = require('./logger.js');
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
        this.interval = json.interval ? json.interval : 0;
        this.enabled = json.enabled ? json.enabled : false;
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
        if (this.enabled) {
            if (this.topic !== undefined && this.value !== undefined) {
                let data = "";
                if (typeof this.value === 'string') {
                    // render it
                    data = mustache.render(this.value, context);
                } else if (this.value instanceof Buffer || this.value instanceof ArrayBuffer) {
                    // take as-is
                    data = this.value;
                } else {
                    // try to turn in into a string
                    try {
                        data = this.value.toString();
                    } catch (err) {
                        logger.error("Could not convert value to String - sending empty message");
                    }
                }
                Engine.getInstance().mqttClient.publish(this.topic, data);
                logger.info("SetValueAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: `[${data}] to ${this.topic}`, triggered: "true" });
            }
        } else {
            logger.info("SetValueAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: 'Action disabled', triggered: "false" });
        }

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
        if (this.enabled) {
            try {
                Engine.getInstance().runScript(this.script, context);
                logger.info("ScriptAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", triggered: "true" });
            } catch (err) {
                logger.error("ScriptAction execution failed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", triggered: "true", error: err.message });
                //logger.error('Rule [%s]: ERROR running script:\n# ----- start script -----\n%s\n# -----  end script  -----', this.rule.name, this.script);
                //logger.error(err.message);
            }
        } else {
            logger.info("ScriptAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", details: 'Action disabled', triggered: "false" });
        }
    }

}

class EMailAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.msg = {
            to: json.to,
            subject: json.subject,
            text: json.body,
        }
        validateEmailAction(json);
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            const action = this;

            // clone the msg
            let data = JSON.parse(JSON.stringify(this.msg));
            try {
                // render the subject
                data.subject = mustache.render(data.subject, context);
                // render the body (= text in SMTPTransport)
                data.text = mustache.render(data.text, context);

                const mailOptions = {
                    from: config.email.from,
                    ...data
                };

                SMTPTransporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                        logger.error("EMailAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, triggered: "true", error: err.message });
                        //logger.error('Rule [%s]: ERROR EMailAction failed', action.rule.name);
                        //logger.error(err.message);
                    } else {
                        //logger.info('Rule [%s]: EMailAction executed', action.rule.name);
                        logger.info("EMailAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, triggered: "true" });
                    }
                });
            } catch (err) {
                logger.error("EMailAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, triggered: "true", error: err.message });
            }
        } else {
            logger.info("EMailAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "email", details: 'Action disabled', triggered: "false" });
        }
    }

}

class PushoverAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.msg = {
            message: json.message,
            title: json.title,
            sound: json.sound ? json.sound : "none",
            priority: json.priority ? json.priority : 0,
            retry: 30,
            expire: 3600
        }
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            const action = this;
            // clone the msg
            let data = JSON.parse(JSON.stringify(this.msg));
            try {
                // render the message
                data.message = mustache.render(data.message, context);
                // render the title
                data.title = mustache.render(data.title, context);
                pushover.send(data, function (err, result) {
                    if (err) {
                        logger.error("PushoverAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, triggered: "true", error: err.message });
                    } else {
                        logger.info("PushoverAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, triggered: "true" });
                    }
                });
            } catch (err) {
                logger.error("PushoverAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, triggered: "true", error: err.message });
            }
        } else {
            logger.info("PushoverAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "pushover", details: 'Action disabled', triggered: "false" });
        }
    }

}


class LogBookAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.message = json.message;
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            if (this.message !== undefined) {
                try {
                    let finalMessage = mustache.render(this.message, context);
                    logbooklogger.info(finalMessage);
                    //logger.info('Rule [%s]: LogBookAction called with message %s', this.rule.name, finalMessage);
                    logger.info("LogBookAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${finalMessage}`, triggered: "true" });
                } catch (err) {
                    logger.error("LogBookAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${finalMessage}`, triggered: "true", error: err.message });
                }
            }
        } else {
            logger.info("LogBookAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: 'Action disabled', triggered: "false" });
        }
    }

}


class WebHookAction extends Action {

    constructor(json, rule) {
        super(json, rule);
        this.url = json.url;
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            const action = this;
            try {
                // render the URL
                let url = mustache.render(action.url, context);
                axios.get(url)
                    .then((response) => {
                        logger.info("WebHookAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, triggered: "true" });
                    })
                    .catch((err) => {
                        logger.error("WebHookAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, triggered: "true", error: err.message });
                    });
            } catch (err) {
                logger.error("WebHookAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, triggered: "true", error: err.message });
            }
        } else {
            logger.info("WebHookAction not executed (disabled)", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: 'Action disabled', triggered: "false" });
        }
    }

}



module.exports = { EMailAction, LogBookAction, PushoverAction, ScriptAction, SetValueAction, WebHookAction }
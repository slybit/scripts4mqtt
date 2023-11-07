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

    // onTrue = boolean indicating if this an onTrue or onFalse action
    constructor(json, onTrue, rule) {
        this.rule = rule;
        this.onTrue = onTrue;
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
    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
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
                if (!config.development) {
                    Engine.getInstance().mqttClient.publish(this.topic, data);
                }
                logger.info("SetValueAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: `[${data}] to ${this.topic}`, state: this.onTrue ? "true" : "false", triggered: "true" });
            }
        } else {
            logger.info("SetValueAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "mqtt", details: 'Action disabled', state: this.onTrue ? "true" : "false", triggered: "false" });
        }

        //TODO: add option for retain true or false
    }

}

class ScriptAction extends Action {

    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
        //this.topic = json.topic;
        this.script = json.script;
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            try {
                Engine.getInstance().runScript(this.script, context);
                logger.info("ScriptAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", state: this.onTrue ? "true" : "false", triggered: "true" });
            } catch (err) {
                logger.error("ScriptAction execution failed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", state: this.onTrue ? "true" : "false", triggered: "true", error: err.message });
            }
        } else {
            logger.info("ScriptAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "script", details: 'Action disabled', state: this.onTrue ? "true" : "false", triggered: "false" });
        }
    }

}

class EMailAction extends Action {

    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
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
                        logger.error("EMailAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, state: action.onTrue ? "true" : "false", triggered: "true", error: err.message });
                        //logger.error('Rule [%s]: ERROR EMailAction failed', action.rule.name);
                        //logger.error(err.message);
                    } else {
                        //logger.info('Rule [%s]: EMailAction executed', action.rule.name);
                        logger.info("EMailAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, state: action.onTrue ? "true" : "false", triggered: "true" });
                    }
                });
            } catch (err) {
                logger.error("EMailAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "email", details: `subject: ${data.subject}`, state: action.onTrue ? "true" : "false", triggered: "true", error: err.message });
            }
        } else {
            logger.info("EMailAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "email", details: 'Action disabled', state: action.onTrue ? "true" : "false", triggered: "false" });
        }
    }

}

class PushoverAction extends Action {

    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
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
                        logger.error("PushoverAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, state: action.onTrue ? "true" : "false", triggered: "true", error: err.message });
                    } else {
                        logger.info("PushoverAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, state: action.onTrue ? "true" : "false", triggered: "true" });
                    }
                });
            } catch (err) {
                logger.error("PushoverAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "pushover", details: `subject: ${data.title}`, state: action.onTrue ? "true" : "false", triggered: "true", error: err.message });
            }
        } else {
            logger.info("PushoverAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "pushover", details: 'Action disabled', state: action.onTrue ? "true" : "false", triggered: "false" });
        }
    }

}


class LogBookAction extends Action {

    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
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
                    logger.info("LogBookAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${finalMessage}`, state: this.onTrue ? "true" : "false", triggered: "true" });
                } catch (err) {
                    logger.error("LogBookAction executed", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: `message: ${finalMessage}`, state: this.onTrue ? "true" : "false", triggered: "true", error: err.message });
                }
            }
        } else {
            logger.info("LogBookAction not executed (disabled)", { ruleId: this.rule.id, ruleName: this.rule.name, type: "action", subtype: "logbook", details: 'Action disabled', state: this.onTrue ? "true" : "false", triggered: "false" });
        }
    }

}


class WebHookAction extends Action {

    constructor(json, onTrue, rule) {
        super(json, onTrue, rule);
        this.url = json.url;
        this.contenttype = json.contenttype;
        this.method = json.method;
        this.body = json.body;
    }

    execute(context) {
        super.execute(context);
        if (this.enabled) {
            const action = this;
            try {
                // render the URL
                let url = mustache.render(action.url, context);
                // render the body
                let body = mustache.render(action.body, context);
                // turn into an object if we are sending JSON
                if (action.contenttype == "application/json") body = JSON.parse(body);
                switch (action.method) {
                    case "post":
                        axios.post(url, body, {
                            headers: {
                                'Content-Type': action.contenttype
                            }
                        })
                            .then((response) => {
                                console.log(JSON.stringify(response.data, null, 4));
                                logger.info("WebHookAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, state: this.onTrue ? "true" : "false", triggered: "true" });
                            })
                            .catch((err) => {
                                logger.error("WebHookAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `url: ${url}`, state: this.onTrue ? "true" : "false", triggered: "true", error: err.message });
                            });
                        break;

                    case "get":
                        axios.get(url)
                            .then((response) => {
                                logger.info("WebHookAction executed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, state: this.onTrue ? "true" : "false", triggered: "true" });
                            })
                            .catch((err) => {
                                logger.error("WebHookAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: `return code: ${response.status}, url: ${url}`, state: this.onTrue ? "true" : "false", triggered: "true", error: err.message });
                            });
                        break;


                }

            } catch (err) {
                logger.error("WebHookAction execution failed", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: ``, state: this.onTrue ? "true" : "false", triggered: "true", error: err.message });
            }
        } else {
            logger.info("WebHookAction not executed (disabled)", { ruleId: action.rule.id, ruleName: action.rule.name, type: "action", subtype: "webhook", details: 'Action disabled', state: this.onTrue ? "true" : "false", triggered: "false" });
        }
    }

}



module.exports = { EMailAction, LogBookAction, PushoverAction, ScriptAction, SetValueAction, WebHookAction }
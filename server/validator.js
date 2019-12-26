const {logger, jsonlogger} = require('./logger.js');
const sancronos = require('sancronos-validator');

/*
flatConditions:
  - mqtt
  - cron

ontrue/onfalse:
  - mqtt
  - script
  - email
  - pushover

*/

function validate(data) {
    /* data must have a
    - type
    - editorItemType
    */

    try {
        if (data.editorItemType === "flatConditions") {
            switch (data.type) {
                case "mqtt":
                    validateMqttCondition(data);
                    break;
                case "cron":
                    validateCronCondition(data);
                    break;
            }
        } else if (data.editorItemType === "ontrue" || data.editorItemType === "onfalse") {
            switch (data.type) {
                case "mqtt":
                    validateMqttAction
                    break;
                case "script":
                    break;
                case "email":
                    break;
                case "pushover":
                    break;
            }
        }
    } catch (err) {
        console.log(err);
        return {
            success: false,
            message: err.message
        }
    }

    return {
        success: true
    }

}

/* ----------------------------------------------------------------------------------------------------------------------------
MQTT CONDITION and ACTION
---------------------------------------------------------------------------------------------------------------------------- */

function validateMqttCondition(json) {
    if (!(json.topic && json.eval))
        throw new Error('Missing topic or eval expression');
    if ((json.topic.trim() === '' || json.eval.trim() === ''))
        throw new Error('Empty topic or eval expression');
    if (!validateTopic(json.topic))
        throw new Error('Invalid topic');
    // no check of the eval expression
}

function validateAliasCondition(json) {
    if (!(json.alias && json.eval))
        throw new Error('Missing alias or eval expression');
    if ((json.alias.trim() === '' || json.eval.trim() === ''))
        throw new Error('Empty alias or eval expression');
    // TODO: add check of the alias!!!
    // no check of the eval expression
}

function validateMqttAction(json) {
    if (!(json.topic))
        throw new Error('Missing topic');
    if (json.topic.trim() === '')
        throw new Error('Empty topic');
    if (!validateTopic(json.topic))
        throw new Error('Invalid topic');
    // no check of the value
}

/**
 * Validate a topic to see if it's valid or not.
 * A topic is valid if it follow below rules:
 * - Rule #1: If any part of the topic is not `+` or `#`, then it must not contain `+` and '#'
 * - Rule #2: Part `#` must be located at the end of the mailbox
 *
 * @param {String} topic - A topic
 * @returns {Boolean} If the topic is valid, returns true. Otherwise, returns false.
 */
function validateTopic(topic) {
    var parts = topic.split('/')
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '+') {
            continue
        }
        if (parts[i] === '#') {
            // for Rule #2
            return i === parts.length - 1
        }
        if (parts[i].indexOf('+') !== -1 || parts[i].indexOf('#') !== -1) {
            return false
        }
    }
    return true
}

/* ----------------------------------------------------------------------------------------------------------------------------
CRON CONDITION
---------------------------------------------------------------------------------------------------------------------------- */

function validateCronCondition(json) {
    if (!(json.on))
        throw new Error('Cron condition missing on expression');
    if (!validateExpression(json.on))
        throw new Error('Cron on expression invalid');
    if (!validateExpression(json.off))
        throw new Error('Cron off expression invalid');
}

function validateExpression(expression) {
    if (expression === undefined || expression.trim() === "" || expression.trim() === "-") return true;
    try {
        sancronos.isValid(expression.trim(), true);
        return true;
    } catch (err) {
        return false;
    }
}

/* ----------------------------------------------------------------------------------------------------------------------------
EMAIL ACTION
---------------------------------------------------------------------------------------------------------------------------- */

function validateEmailAction(json) {
    const emailRegex = RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$');
    if (!emailRegex.test(json.to))
        throw new Error('To email address invalid');
}

module.exports = {validate, validateTopic, validateMqttCondition, validateAliasCondition, validateMqttAction, validateCronCondition, validateEmailAction};
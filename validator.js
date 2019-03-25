const {MqttCondition} = require ('./rules');


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

exports.validate = function (data) {
    /* data must have a 
    - type
    - editorItemType
    */

    try {
        if (data.editorItemType === "flatConditions") {
            switch (data.type) {
                case "mqtt":
                    MqttCondition.validate(data);
                    break;
                case "cron":
                    break;
            }
        } else if (data.editorItemType === "ontrue" || data.editorItemType === "onfalse") {
            switch (data.type) {
                case "mqtt":
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
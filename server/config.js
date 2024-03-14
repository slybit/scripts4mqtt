/*
Manages the application configuration.
It supports reading and updating the configuration file.
*/

const yaml = require('js-yaml');
const fs = require('fs');

const FILE = process.env.MQTT4SCRIPTS_CONFIG || '../config/config.yaml';


/* Exported
Returns a string representation of the current configuration file
*/
getConfig = function () {
  if (fs.existsSync(FILE)) {
    try {
      return fs.readFileSync(FILE, 'utf8');
    } catch (err) {
      console.log(err);
      return "";
    }
  } else {
    return "";
  }
}

/*
Exported
Replaces the configuration file with the string contained in the c.config field.
It expects the parameter 'c' to contain a field 'config' that contains a valid yaml string.
It will first parse this string and if formatting is ok, it will store the string in the configuration file.
Note that this has no effect on the running instance. A restart is required to take effect.
*/
updateConfig = function (c) {
    yaml.load(c.config);
    fs.writeFileSync(FILE, c.config);
}


/*
Exported
Reads the config file and returns it as an object.
*/
parse = function () {
    let config = {};
    // read the original config in 'config'
    if (fs.existsSync(FILE)) {
        try {
            config = yaml.load(fs.readFileSync(FILE, 'utf8'));
        } catch (e) {
            console.log(e);
            process.exit();
        }
    } else {
        console.log("Config file not found at " + FILE);
        process.exit();
    }

    return config;
}

module.exports = { parse, getConfig, updateConfig }
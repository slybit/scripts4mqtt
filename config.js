/* 
Manages the application configuration.
It supports reading and updating the configuration file.
*/

const yaml = require('js-yaml');
const fs = require('fs');

const FILE = process.env.MQTT4SCRIPTS_CONFIG || 'config.yaml';
let CONFIG = undefined;



/* Exported
Other modules should use a call to this systematically to always get the latest version of the configuration
*/
config = function () {
  if (CONFIG === undefined) {
    CONFIG = parse();
  }
  return CONFIG;
}



/* Exported
Returns a string representation of the current configuration file
*/
getConfig = function () {
  if (fs.existsSync(FILE)) {
    try {
      return fs.readFileSync(FILE, 'utf8');
    } catch (err) {
      console.log(err);
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
Finally it clears the CONFIG variable so that the next call to config() will return the new configuration.
*/
updateConfig = function (c) {
  let newConfig = undefined;
  try {
    newConfig = yaml.safeLoad(c.config);
  } catch (err) {
    console.log(err);
    return { success: false, error: err.message };
  }

  try {
    fs.writeFileSync(FILE, c.config);
  } catch (e) {
    console.log(err);
    return { success: false, error: err.message };
  }
  CONFIG = undefined;
  return { success: true };
}


/* Internal
Reads the config file and returns it as an object.
*/
parse = function () {
  if (fs.existsSync(FILE)) {
    try {
      return yaml.safeLoad(fs.readFileSync(FILE, 'utf8'));
    } catch (e) {
      console.log(e);
      process.exit();
    }
  } else {
    return {
      loglevel: 'silly',
      port: 4000,
      mqtt: {
        url: 'mqtt://localhost'
      }
    }
  }
}

module.exports = {config, getConfig, updateConfig}
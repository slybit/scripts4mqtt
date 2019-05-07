const yaml = require('js-yaml');
const fs = require('fs');

const FILE = process.env.MQTT4SCRIPTS_CONFIG || 'config.yaml';
let CONFIG = undefined;


exports.config = function () {
  if (CONFIG === undefined) {
    CONFIG = parse();
  }
  return CONFIG;
}

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

exports.getConfig = function () {
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

exports.updateConfig = function (c) {
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
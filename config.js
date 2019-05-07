const yaml = require('js-yaml');
const fs = require('fs');

const file = process.env.MQTT4SCRIPTS_CONFIG || 'config.yaml';

exports.parse = function () {

  if (fs.existsSync(file)) {
    try {
      return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
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
  const file = process.env.MQTT4SCRIPTS_CONFIG || 'config.yaml';
  if (fs.existsSync(file)) {
    try {
      return fs.readFileSync(file, 'utf8');
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
    fs.writeFileSync('newconfig.yaml', c.config);
  } catch (e) {
    console.log(err);
    return { success: false, error: err.message };
  }

  return { success: true };
}
const yaml = require('js-yaml');
const fs   = require('fs');

exports.parse = function () {
    const file = process.env.MQTT4SCRIPTS_CONFIG || 'config.yaml';
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
        } catch (e) {
          console.log(e);          
        }
    } else {
        return "";
    }
}
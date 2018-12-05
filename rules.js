const fs   = require('fs');

exports.parse = function () {
    const file = process.env.MQTT4SCRIPTS_RULES || 'rules.json';
    if (fs.existsSync(file)) {
        try {
            var contents = fs.readFileSync(file);
            var jsonContent = JSON.parse(contents);
            return jsonContent;
        } catch (e) {
          console.log(e);
          process.exit();
        }
    } else {
        return [];
    }
}
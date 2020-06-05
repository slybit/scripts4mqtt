var fs = require('fs');
console.log("Incrementing build number...");
fs.readFile('./src/metadata.json', function (err, content) {
    var metadata = {};
    if (!err) {
        metadata = JSON.parse(content);
    } else {
        metadata = {'build' : 0};
    }
    metadata.build = metadata.build + 1;
    metadata.date = (new Date()).toLocaleDateString();
    fs.writeFile('./src/metadata.json', JSON.stringify(metadata), function (err) {
        if (err) throw err;
        console.log("Current build number: " + metadata.build);
    })
});
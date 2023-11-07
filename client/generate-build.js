var fs = require('fs');

let metadata = {};

try {
    console.log("Reading existing build meta file and incrementing build number.");
    let content = fs.readFileSync('./src/metadata.json');
    metadata = JSON.parse(content);
    metadata.build = metadata.build + 1;
    metadata.date = (new Date()).toLocaleDateString();
} catch (e) {
    console.log("Build meta file not found, creating a new one.");
    metadata = { 'build' : 1, 'data' : metadata.date = (new Date()).toLocaleDateString() };
}

try {
    console.log("Reading project version from server npm package.json.");
    content = fs.readFileSync('../server/package.json');
    let packagedata = JSON.parse(content);
    metadata.version = packagedata.version;
} catch (e) {
    console.log("Could not read server npm package.json, ignoring.");
}

try {
    console.log("Writing build meta file.");
    fs.writeFileSync('./src/metadata.json', JSON.stringify(metadata));
    console.log("Current build meta data:");
    console.log(JSON.stringify(metadata, null, 4));

} catch (e) {
    console.log("Could not write new build meta file!!!");
    console.log(e);
}


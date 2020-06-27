const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
// TODO: use winston express middleware instead of morgan? worth it?
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { logBufferStatic, logBufferDynamic, logger, getRuleLogs, getMqttLogs, getLogbookLogs } = require('./logger.js');
const { getConfig, updateConfig, getMetaData } = require('./config.js');
const config = require('./config.js').parse();
const rules = require('./rules.js');
const Engine = require('./engine.js');
const validator = require('./validator.js');
const Aliases = require('./aliases.js');

const app = express();
const router = express.Router();

const API_PORT = process.env.API_PORT || config.api.port || 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (error, req, res, next) {
    if (error) {
      res.status(error.statusCode).send({ success: false, error: error.type, ...error });
    } else {
      next();
    }
  });
app.use(morgan('dev'));

router.get('/rules', (req, res) => {
    res.json(rules.listAllRules());
});

router.post('/rules', (req, res) => {
    res.json(rules.createRule(req.body));
});

router.get('/rule/:ruleId', (req, res) => {
    res.json(rules.getRule(req.params.ruleId));
});

router.put('/rule/:ruleId', (req, res) => {
    res.json(rules.updateRule(req.params.ruleId, req.body));
});

router.delete('/rule/:ruleId', (req, res) => {
    res.json(rules.deleteRule(req.params.ruleId));
});

router.get('/aliases', (req, res) => {
    let aliases = new Aliases();
    res.json(aliases.listAliases());
});

router.post('/aliases', (req, res) => {
    let aliases = new Aliases();
    res.json(aliases.updateAlias(req.body));
});

router.delete('/alias/:aliasId', (req, res) => {
    let aliases = new Aliases();
    res.json(aliases.deleteAlias(req.params.aliasId));
});

router.post('/validate', (req, res) => {
    res.json(validator.validate(req.body));
});

router.get('/logs/rules', async (req, res) => {
    try {
        const logs = await getRuleLogs();
        res.json(logs);
    } catch (err) {
        logger.error('Error parsing logs');
        res.json([]);
    }
});

router.get('/logs/mqtt', async (req, res) => {
    try {
        const logs = await getMqttLogs();
        res.json(logs);
    } catch (err) {
        logger.error('Error parsing logs');
        res.json([]);
    }
});


router.get('/config', (req, res) => {
    res.json({ config: getConfig() });
});

router.post('/config', (req, res) => {
    let response = updateConfig(req.body);
    res.json(response);
    if (response.success) {
        // restart using a child process
        /*
                spawn(process.argv[0], process.argv.slice(1), {
                    detached: true,
                    stdio: 'inherit'
                }).unref();
                // kill the parent process;
                process.exit();
        */
    }
});

router.get('/meta', (req, res) => {
    res.json({ meta: getMetaData() });
});

router.get('/store', (req, res) => {
    try {
        const dump = Engine.getInstance().dumpStore();
        res.json(dump);
    } catch (err) {
        logger.error('Error dumping store');
        res.json([]);
    }
});

router.get('/topics', (req, res) => {
        const dump = Engine.getInstance().dumpTopics();
        res.json(dump);
});


router.get('/logbook', async (req, res) => {
    try {
        const logs = await getLogbookLogs();
        res.json(logs);
    } catch (err) {
        logger.error('Error parsing logbook logs');
        res.json([]);
    }
});

router.get('/infinite', async (req, res) => {
    try {
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        //setInterval(() => res.write(Buffer.from(`${Date.now()}\n`)), 300);
        for (line of logBufferStatic) {
            res.write(Buffer.from(`${line}`))
        }
        logBufferDynamic.length = 0;
        setInterval(() => {
            while (logBufferDynamic.length > 0) {
                res.write(Buffer.from(`${logBufferDynamic.shift()}`))
            }
        }, 300);
    } catch (err) {
        logger.error('Error parsing logbook logs');
        res.json([]);
    }
});


app.use('/api', router);

// ----
/*
const client = express.Router();
client.use(express.static(path.join(__dirname, '..', 'client', 'build')));
client.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});
app.use('/', client);
*/
// -----
app.listen(API_PORT, () => logger.info('Listening on port %s', API_PORT));

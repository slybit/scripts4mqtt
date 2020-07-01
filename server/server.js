const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
// TODO: use winston express middleware instead of morgan? worth it?
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { logBufferStatic, logBufferDynamic, logger, getRuleLogs, getMqttLogs, getLogbookLogs } = require('./logger.js');
const { getConfig, updateConfig  } = require('./config.js');
const config = require('./config.js').parse();
const rules = require('./rules.js');
const Engine = require('./engine.js');
const validator = require('./validator.js');
const Aliases = require('./aliases.js');

const app = express();
const router = express.Router();

const API_PORT = process.env.API_PORT || config.api.port || 4000;

//app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// input error catching
app.use(function (error, req, res, next) {
    if (error) {
        res.status(error.statusCode).send({ success: false, error: error.type, ...error });
    } else {
        next();
    }
});


router.get('/rules', (req, res, next) => {
    res.locals.data = rules.listAllRules();
    next();
});

router.post('/rules', (req, res, next) => {
    res.locals.data = rules.createRule(req.body);
    next();
});

router.get('/rule/:ruleId', (req, res, next) => {
    res.locals.data = rules.getRule(req.params.ruleId);
    next();
});

router.put('/rule/:ruleId', (req, res, next) => {
    res.locals.data = rules.updateRule(req.params.ruleId, req.body);
    next();
});

router.delete('/rule/:ruleId', (req, res, next) => {
    res.locals.data = true;
    rules.deleteRule(req.params.ruleId);
    next();
});

router.get('/aliases', (req, res, next) => {
    let aliases = new Aliases();
    res.locals.data = aliases.listAliases();
    next();
});

router.post('/aliases', (req, res, next) => {
    let aliases = new Aliases();
    res.locals.data = aliases.updateAlias(req.body);
    next();
});

router.delete('/alias/:aliasId', (req, res, next) => {
    let aliases = new Aliases();
    res.locals.data = aliases.deleteAlias(req.params.aliasId);
    next();
});


router.post('/validate', (req, res, next) => {
    res.locals.data = true;
    validator.validate(req.body);
    next();
});


router.get('/store', (req, res, next) => {
    res.locals.data = {data: Engine.getInstance().dumpStore()};
    next();
});

router.get('/topics', (req, res, next) => {
    res.locals.data = {topics: Engine.getInstance().dumpTopics()};
    next();
});

// for these API calls, we send the respose here.
// the async methods make it difficult to use the mechanism with next()
router.get('/logs/rules', async (req, res) => {
    try {
        res.json({
            success: true,
            data: await getRuleLogs()
        });
    } catch (err) {
        logger.error('Error parsing logs');
        res.json({
            success: false,
            error: err.message
        });
    }
});

router.get('/logs/mqtt', async (req, res) => {
    try {
        res.json({
            success: true,
            data: await getMqttLogs()
        });
    } catch (err) {
        logger.error('Error parsing logs');
        res.json({
            success: false,
            error: err.message
        });
    }
});


router.get('/logbook', async (req, res) => {
    try {
        res.json({
            success: true,
            data: await getLogbookLogs()
        });
    } catch (err) {
        logger.error('Error parsing logs');
        res.json({
            success: false,
            error: err.message
        });
    }
});



router.get('/config', (req, res, next) => {
    res.locals.data = { config: getConfig() };
    next();
});

router.post('/config', (req, res, next) => {
    res.locals.data = true;
    updateConfig(req.body);
    next();
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
// output  catching
router.use(function (req, res, next) {
    if (res.locals.data) {
        res.json({
            success: true,
            ...res.locals.data
        });
    } else {
        next();
    }
});

// output error catching
router.use(function (error, req, res, next) {
    logger.error(error.message);
    res.json({ success: false, error: error.message });
});

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

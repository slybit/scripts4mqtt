const express = require('express');
// TODO: use winston express middleware instead of morgan? worth it?
const morgan = require('morgan');
const bodyParser = require('body-parser');
const {logger, jsonlogger, getRuleLogs} = require('./logger.js');
const config = require('./config.js').parse();
const static = require('./static.js').parse();
const rules = require('./rules.js');
const validator = require('./validator.js');

const app = express();
const router = express.Router();

const API_PORT = process.env.API_PORT || config.port || 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

router.get('/reload', (req, res) => {
    res.json(rules.reload());
});

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

router.get('/static', (req, res) => {
    res.json(static);
});

router.post('/validate', (req, res) => {
    res.json(validator.validate(req.body));
});

router.get('/logs', async (req, res) =>  {
    try {
        const logs = await getRuleLogs();
        res.json(logs);
    } catch (err) {
        logger.error('Error parsing longs');
        res.json([]);
    }
});

app.use('/api', router);

app.listen(API_PORT, () => logger.info('Listening on port %s', API_PORT));
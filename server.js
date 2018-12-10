const express = require('express');
// TODO: use winston express middleware instead of morgan? worth it?
const morgan = require('morgan');
const logger = require('./logger.js');
const config = require('./config.js').parse();

const app = express();
const router = express.Router();

console.log(config.port);
const API_PORT = process.env.API_PORT || config.port || 4000;

app.use(morgan('dev'));

router.get('/', (req, res) => {
    res.json({message: 'Hello world'});
});

app.use('/api', router);

app.listen(API_PORT, () => logger.info('Listening on port %s', API_PORT));
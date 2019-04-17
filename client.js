const express = require('express');
const path = require('path');
const morgan = require('morgan');
const app = express();


app.use(express.static(path.join(__dirname, 'client', 'build')));
app.use(morgan('dev'));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(9000);
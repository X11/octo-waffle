var express = require('express');
var http = require('http');
var app = require('./config/express.js');
var server = http.createServer(app);

require('./routes/index')(app);

app.set('port', 3000);
server.listen(3000);

module.exports = app;

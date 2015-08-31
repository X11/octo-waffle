var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var RedisStore = require('connect-redis')(session);
var redisClient = require('ioredis')();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'jade');

// favicon
app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')));

// logger
app.use(logger('dev'));

// bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// cookies
app.use(cookieParser());

app.use(session({
    store: new RedisStore({
        client: redisClient
    }),
    secret: 'Ugh moet dit seriously',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 360000
    }
}));

app.use(function(req, res, next) {
    if (req.session) {
        return next();
    }
    res.send('Error connecting to the store. Please retry.');
    console.log(1);
});


// serve
app.use(express.static(path.join(__dirname, '..', 'public')));

// flash messages
app.use(flash());

module.exports = app;


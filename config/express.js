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
var methodOverride = require('method-override');

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
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
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
        maxAge: 3600000, // 1 hour
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


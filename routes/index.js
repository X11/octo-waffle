var express = require('express');
var router = express.Router();

var main = require('./main.js');
var octo = require('./octo.js');
var manage = require('./manage.js');
var password = require('./password.js');
var companies = require('./companies.js');

module.exports = function(app) {

    app.use('/', main);
    app.use('/octo', octo);
    app.use('/manage', manage);
    app.use('/password', password);
    app.use('/companies', companies);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
};

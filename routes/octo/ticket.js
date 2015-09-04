var express = require('express');
var router = express.Router();

var db = require('./../../lib/module.js');

router.get('/', function(req, res, next) {
    db
        .ticket
        .all()
        .then(function(data) {
            res.locals.tickets = data;
            res.render('ticket/index');
        });
});

router.get('/create', function(req, res, next) {
    res.locals.current = {
        client: {name: "Lorem Ipsum Client"}
    };
    res.render('ticket/create');
});

router.post('/create', function(req, res, next) {
    db
        .ticket
        .create(req.body)
        .then(function() {
            // flash message here
            res.redirect('/octo/tickets/');
        })
        .catch(function() {
            // flash message here
            res.redirect('/octo/tickets/');
        });
});

router.get('/:id', function(req, res, next) {
    db
        .ticket
        .get(req.params.id)
        .then(function(data) {
            res.locals.ticket = data;
            res.render('ticket/ticket');
        });
});

router.put('/:id', function(req, res, next) {
    res.redirect('/tickets/' + req.params.id);
});

module.exports = router;


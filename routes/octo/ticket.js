var express = require('express');
var router = express.Router();

var db = require('./../../lib/module.js');

router.get('/', function(req, res, next) {
    var sortBy = (req.query.field) ? req.query.field : "created_at";
    var order = (req.query.order) ? req.query.order.toLowerCase() : "desc";
    db
        .ticket
        .all()
        .then(function(data) {
            if (req.session.current.role == 'Client')
                data = data.filter(function(ticket) {
                    return ticket.client == req.session.current.name;
                });

            res.locals.tickets = data.sort(function(a, b) {
                return a[sortBy] > b[sortBy];
            });

            if (order == "desc")
                res.locals.tickets.reverse();

            res.render('ticket/index');
        });
});

router.get('/create', function(req, res, next) {
    res.render('ticket/create');
});

router.post('/create', function(req, res, next) {
    console.log(req.body.client, req.session.current.name);
    if (req.body.client != req.session.current.name) {
        req.flash('error', 'Error filling in your form');
        return res.redirect('/octo/tickets/create');
    }

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
            if (data.client !== req.session.current.name &&
                req.session.current.role !== "Worker") {
                res.status(403);
                return next(new Error("Ticket not visible for you"));
            }
            res.locals.ticket = data;
            res.locals.ticket.id = req.params.id;
            res.render('ticket/ticket');
        });
});

router.put('/:id', function(req, res, next) {
    req.flash("success", "Updated");
    res.redirect('/octo/tickets/' + req.params.id);
});

module.exports = router;


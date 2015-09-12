var express = require('express');
var router = express.Router();
var Q = require('q');

//var db = require('./../../lib/module.js');
var db = require('Octagon');

router.get('/', function(req, res, next) {
    var sortBy = (req.query.field) ? req.query.field : "created_at";
    var order = (req.query.order) ? req.query.order.toLowerCase() : "desc";
    db
        .ticket
        .all()
        .then(function(ids) {
            var promises = [];
            ids.forEach(function(id) {
                promises.push(db.ticket.get(id));
            });
            Q
                .all(promises)
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
                })
                .catch(function(err) {
                    return err;
                });
        });
});

router.get('/create', function(req, res, next) {
    res.render('ticket/create');
});

router.post('/create', function(req, res, next) {
    if (req.body.client != req.session.current.name) {
        req.flash('error', 'Error filling in your form.');
        return res.redirect('/octo/tickets/create');
    }

    var fields = ["client", "title", "category", "description", "priority"];
    if (fields.length !== Object.keys(req.body).length){
        req.flash('error', 'Error filling in your form.');
        return res.redirect('/octo/tickets/create');
    }

    req.body.title = '[' + req.body.category + '] ' + req.body.title;

    db
        .ticket
        .create(req.body, req.session.current.id)
        .then(function() {
            // flash message here
            req.flash('success', "Nieuwe ticket aangemaakt");
            res.redirect('/octo/tickets/');
        })
        .catch(function(err) {
            req.flash('error', err.message);
            res.redirect('/octo/tickets/');
        });
});

router.get('/:id', function(req, res, next) {
    db
        .ticket
        .get(req.params.id)
        .then(function(data) {
            if (Object.keys(data).length === 0){
                res.status(404);
                return next(new Error("Ticket not found."));
            }

            if (data.client !== req.session.current.name &&
                req.session.current.role !== "Worker") {
                res.status(403);
                return next(new Error("Ticket not visible for you."));
            }
            res.locals.ticket = data;
            res.locals.ticket.id = req.params.id;
            res.render('ticket/ticket');
        });
});

router.put('/:id', function(req, res, next) {
    var fields = ["priority", "status", "assigned"];
    var attrs = {};
    fields.forEach(function(field) {
        attrs[field] = req.body[field];
    });
    attrs.updated = (new Date().toLocaleDateString()) + " " + (new Date().toLocaleTimeString()); // jshint ignore:line
    if (req.session.current.role == "Worker"){
        return db
            .ticket
            .update(req.params.id, attrs)
            .then(function(result) {
                req.flash("success", "Updated.");
                res.redirect('/octo/tickets/' + req.params.id);
            })
            .catch(function(err) {
                req.flash("error", err.message);
                res.redirect('/octo/tickets/' + req.params.id);
            });
    } else {
        req.flash("error", "Geen rechten!");
        res.redirect('/octo/tickets/' + req.params.id);
    }
});

module.exports = router;


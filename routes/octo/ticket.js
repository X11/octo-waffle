var express = require('express');
var router = express.Router();
var Q = require('q');

var db = require('Octagon');

// Get all tickets
router.get('/', function(req, res, next) {
    var sortBy = (req.query.field) ? req.query.field : "created";
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
                            return ticket.client == req.session.current.id;
                        });

                    res.locals.tickets = data.sort(function(a, b) {
                        return a[sortBy] > b[sortBy];
                    });
                    console.log(res.locals.tickets);
                    if (order == "desc")
                        res.locals.tickets.reverse();

                    res.render('octo/ticket/index');
                })
                .catch(function(err) {
                    return err;
                });
        });
});

// Show the creation form
router.get('/create', function(req, res, next) {
    res.render('octo/ticket/create');
});

// Create an ticket
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

// Get a single ticket
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
            res.render('octo/ticket/ticket');
        });
});

// update a single ticket
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

// delete a single ticket
router.delete('/:id', function(req, res, next) {
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

            db
                .ticket
                .remove(req.params.id)
                .then(function(status) {
                    req.flash('success', "Ticket verwijdered.");
                    res.redirect('/octo/tickets/');
                })
                .catch(function(err) {
                    req.flash('error', err.message);
                    res.redirect('/octo/tickets/');
                });
        });
});

module.exports = router;

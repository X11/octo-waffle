var express = require('express');
var Q = require('q');
var db = require('Octagon');

var router = express.Router();

// Get all tickets
router.get('/', function(req, res, next) {
    var sortBy = (req.query.field) ? req.query.field : "id";
    var order = (req.query.order) ? req.query.order.toLowerCase() : "desc";
    db.ticket
        .all()
        .then(function(ids) {
            var promises = [];
            ids.forEach(function(id) {
                promises.push(db.ticket.get(id));
            });

            Q.all(promises)
                .then(function(data) {
                    if (req.session.current.role == 'Client')
                        data = data.filter(function(ticket) {
                            return ticket.cid == req.session.current.id;
                        });

                    res.locals.tickets = data.sort(function(a, b) {
                        return a[sortBy] > b[sortBy];
                    });
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
    if (fields.length !== Object.keys(req.body).length) {
        req.flash('error', 'Error filling in your form.');
        return res.redirect('/octo/tickets/create');
    }

    req.body.title = '[' + req.body.category + '] ' + req.body.title;

    db.ticket
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
    db.ticket
        .get(req.params.id)
        .then(function(data) {
            if (Object.keys(data).length === 0) {
                res.status(404);
                return next(new Error("Ticket not found."));
            }

            if (data.cid !== req.session.current.id &&
                req.session.current.role !== "Worker") {
                res.status(403);
                return next(new Error("Ticket not visible for you."));
            }

            var failsafe = setInterval(function() {
                res.locals.error = "Fail safe for comments";
                res.render('octo/ticket/ticket');
            }, 1000);

            res.locals.ticket = data;
            res.locals.ticket.id = req.params.id;

            // get comments
            db.comment
                .from(req.params.id)
                .then(function(comments) {
                    res.locals.ticket.comments = comments;
                    clearInterval(failsafe);
                    res.render('octo/ticket/ticket');
                }).catch(function(err) {
                    req.flash("error", err.message);
                    res.redirect('/octo/tickets/');
                });

        });
});

// update a single ticket
router.put('/:id', function(req, res, next) {
    var fields = ["priority", "status", "assigned"];
    var attrs = {};
    fields.forEach(function(field) {
        attrs[field] = req.body[field];
    });
    if (req.session.current.role == "Worker") {
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
    db.ticket
        .get(req.params.id)
        .then(function(data) {
            if (Object.keys(data).length === 0) {
                res.status(404);
                return next(new Error("Ticket not found."));
            }
            if (data.cid !== req.session.current.id &&
                req.session.current.role !== "Worker") {
                res.status(403);
                return next(new Error("Ticket not visible for you."));
            }

            db.ticket
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

// Create an comment ticket
router.post('/:id/comment/create', function(req, res, next) {
    if (req.body.client != req.session.current.name) {
        req.flash('error', 'Error filling in your form.');
        return res.redirect('/octo/tickets/' + req.params.id);
    }

    var fields = ["client", "content"];
    if (fields.length !== Object.keys(req.body).length) {
        req.flash('error', 'Error filling in your form.');
        return res.redirect('/octo/tickets/' + req.params.id);
    }

    db.comment
        .create(req.params.id, req.body)
        .then(function() {
            // flash message here
            req.flash('success', "Nieuwe reactie geplaatst");
            res.redirect('/octo/tickets/' + req.params.id);
        })
        .catch(function(err) {
            req.flash('error', err.message);
            res.redirect('/octo/tickets/' + req.params.id);
        });
});

// delete a single ticket
router.delete('/:id/comment/delete/:cid', function(req, res, next) {

    if (req.session.current.role !== "Worker") {
        res.status(403);
        return next(new Error("Method not useable for you."));
    }

    db.comment
        .remove(req.params.id, req.params.cid)
        .then(function() {
            // flash message here
            req.flash('success', "Reactie verwijdered");
            res.redirect('/octo/tickets/' + req.params.id);
        })
        .catch(function(err) {
            req.flash('error', err.message);
            res.redirect('/octo/tickets/' + req.params.id);
        });
});

module.exports = router;


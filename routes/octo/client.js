var express = require('express');
var Q = require("q");
var router = express.Router();

var db = require("Octagon");

// Get all users
router.get('/', function(req, res, next) {
    db.client
        .all()
        .then(function(ids) {
            var promises = [];
            ids.forEach(function(id) {
                promises.push(db.client.get(id));
            });
            Q.all(promises)
                .then(function(data) {
                    res.locals.clients = data;
                    res.render('octo/client/index');
                })
                .catch(function(err) {
                    return err;
                });
        });
});

// delete a single user
router.delete('/:id', function(req, res, next) {
    db.client
        .get(req.params.id)
        .then(function(data) {
            if (Object.keys(data).length === 0){
                res.status(404);
                return next(new Error("Client not found."));
            }
            if (data.client !== req.session.current.name &&
                req.session.current.role !== "Worker") {
                res.status(403);
                return next(new Error("Client not visible for you."));
            }

            db.client
                .remove(req.params.id)
                .then(function(status) {
                    req.flash('success', "Client verwijdered.");
                    res.redirect('/octo/clients/');
                })
                .catch(function(err) {
                    req.flash('error', err.message);
                    res.redirect('/octo/clients/');
                });
        });
});

module.exports = router;


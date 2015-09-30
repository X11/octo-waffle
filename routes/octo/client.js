var express = require('express');
var Q = require("q");
var router = express.Router();

var db = require("Octagon");

// Get all users
router.get('/', function(req, res, next) {
    db
        .client
        .all()
        .then(function(ids) {
            var promises = [];
            ids.forEach(function(id) {
                promises.push(db.client.get(id));
            });
            Q
                .all(promises)
                .then(function(data) {
                    res.locals.clients = data;
                    res.render('octo/client/index');
                })
                .catch(function(err) {
                    return err;
                });
        });
});

module.exports = router;


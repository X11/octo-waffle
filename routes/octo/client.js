var express = require('express');
var Q = require("q");
var router = express.Router();

var db = require("Octagon");

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
                    res.render('client/index');
                })
                .catch(function(err) {
                    return err;
                });
        });
});

router.get('/:id', function(req, res, next) {
    res.locals.client = [{
        id: req.params.id,
        name: 'Lorem',
        password: 'XXXXXXXXXXXXXXX',
        email: 'lorem@ipsum.com'
    }];
    res.render('client/client');
});

router.put('/:id', function(req, res, next) {
    console.log(req.body);
    res.redirect('/octo/clients/' + req.params.id);
});

module.exports = router;


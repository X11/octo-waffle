var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.locals.clients = [{
        id: 1,
        name: 'Lorem',
        password: 'XXXXXXXXXXXXXXX',
        email: 'lorem@ipsum.com'
    }, {
        id: 2,
        name: 'Lorem',
        password: 'XXXXXXXXXXXXXXX',
        email: 'lorem@ipsum.com'
    }, {
        id: 3,
        name: 'Lorem',
        password: 'XXXXXXXXXXXXXXX',
        email: 'lorem@ipsum.com'
    }];
    res.render('client/index');
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


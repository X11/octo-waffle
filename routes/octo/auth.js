var express = require('express');
var router = express.Router();
var crypto = require("crypto");

router.get('/login', function(req, res, next) {
	res.render('auth/login', {
        title: "VuurVechters | Geen probleem.",
        heading: {
            title: 'Login',
        }
	});
});

router.get('/logout', function(req, res, next) {
    req.session.current = null;
    req.flash("success", "Uitgelogt.");
    res.redirect('/octo/auth/login');
});

router.post('/login', function(req, res, next) {
    req.session.current = {
        client: {name: "Lorem Ipsum Client"}
    };
    req.flash("success", "Welcome " + req.session.current.client.name);
    res.redirect('/octo/tickets');
});

module.exports = router;

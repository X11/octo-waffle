var express = require('express');
var router = express.Router();
var crypto = require("crypto");

router.get('/', function(req, res, next) {
    res.redirect('/octo/auth/login');
});

router.get('/login', function(req, res, next) {
    if (req.session.current)
        res.redirect("/octo/tickets");

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
        role: req.body.loginas,
        name: "Beta"+req.body.loginas
    };
    req.flash("success", "Welcome " + req.session.current.name);
    res.redirect('/octo/tickets');
});

module.exports = router;

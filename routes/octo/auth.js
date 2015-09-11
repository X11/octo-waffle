var express = require('express');
var router = express.Router();
var crypto = require('crypto');

var db = require('Octagon');

router.get('/', function(req, res, next) {
    res.redirect('/octo/auth/login');
});

router.get('/login', function(req, res, next) {
    if (req.session.current)
        res.redirect('/octo/tickets');

    res.render('auth/login', {
        title: 'VuurVechters | Geen probleem.',
        heading: {
            title: 'Login',
        }
    });
});

router.post('/login', function(req, res, next) {
    if (req.body.loginas == "Client")
        db
        .client
        .authenticate(req.body.user, req.body.pass)
        .then(function(allowed) {
            if (allowed) {
                req.session.current = {
                    role: req.body.loginas,
                    name: allowed.name,
                    id: allowed.id
                };
                req.flash('success', 'Welcome ' + req.session.current.name);
                res.redirect('/octo/tickets');
            } else {
                req.session.current = null;
                req.flash('error', 'Email en/of wachtwoord is fout');
                res.redirect('/octo/auth/login');
            }
        })
        .catch(function(err) {
            req.flash('error', 'Iets ging verkeerd');
            res.redirect('/octo/auth/login');
        });
    else {
        var sha256 = crypto.createHash('sha256');
        sha256.update(req.body.pass, 'utf8');
        var hashed = sha256.digest('hex');
        if (req.body.pass == "80db32cfd2dd643203c9141c01d366e8bdcbb611ab969c3e44b5c631878cde06"){ // jshint ignore:line
            req.session.current = {
                role: req.body.loginas,
                name: req.body.user,
                id: 0,
            };
            req.flash('success', 'Welcome ' + req.session.current.name);
            res.redirect('/octo/tickets');
        }
    }
});

router.get('/register', function(req, res, next) {
    if (req.session.current)
        res.redirect("/octo/tickets");

    res.render('auth/register', {
        title: "VuurVechters | Geen probleem.",
        heading: {
            title: 'Registeren',
        }
    });
});

router.post('/register', function(req, res, next) {
    if (req.body.pass != req.body.pass2) {
        req.flash("error", "Wachtwoord komt niet overeen");
        return res.redirect('/octo/auth/register');
    }

    db
        .client
        .create({
            name: req.body.user,
            password: req.body.pass,
            email: req.body.email
        })
        .then(function() {
            req.flash("success", "Geregisteerd " + req.body.user + ". U kunt nu inloggen"); // jshint ignore:line
            res.redirect('/octo/auth/login');
        })
        .catch(function(err) {
            req.flash("error", "Er ging iets verkeerds. " + err.message);
            res.redirect('/octo/auth/register');
        });
});

router.get('/logout', function(req, res, next) {
    req.session.current = null;
    req.flash('success', 'Uitgelogt.');
    res.redirect('/octo/auth/login');
});

module.exports = router;


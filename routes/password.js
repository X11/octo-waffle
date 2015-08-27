var express = require('express');
var router = express.Router();
var crypto = require("crypto");
var passwords = require('./../config/access.json');

router.get('/', function(req, res, next) {
	res.render('password', {
        title: "VuurVechters | Geen probleem.",
		message: req.flash('message')
	});
});

router.get('/remove', function(req, res, next) {
    req.session.accessLevel = null;
    req.flash("message", "Uitgelogt.");
    res.redirect('/password');
});

router.post('/', function(req, res, next) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(req.body.pass, "utf8");
    var hashed = sha256.digest("hex");
	if (passwords[hashed]) {
		req.session.accessLevel = passwords[hashed];
        // Bug fix of the session i assume
        req.session.save(function() {
            req.flash("success", "Wachtwoord geaccepteerd, Toegang tot: #" + passwords[hashed]);
            res.redirect('/manage');
        });
	} else {
		req.session.accessLevel = null;
		req.flash("message", "Verkeerd wachtwoord.");
		res.redirect('back');
	}
});

module.exports = router;

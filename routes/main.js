var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.redirect('/companies');
    /*
    res.render('index', {
        title: "VuurVechters | Geen probleem."
    });
    */
});

module.exports = router;

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', {
        title: "VuurVechters | Geen probleem.",
        heading: {
            title: "Vuurvechters",
            tagline: "Geen probleem"
        }
    });
});

module.exports = router;

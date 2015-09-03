var express = require('express');
var router = express.Router();

var ticket = require('./octo/ticket');
var client = require('./octo/client');

router.use(function(req, res, next) {
    res.locals = {
        title: "VuurVechters | Octo-tickets.",
        heading: {
            title: "Vuurvechters",
        },
        options: {
            status: {
                "Open": "success",
                "Assigned": "default",
                "primary": "default"
            },
            statuses: ["Open", "Assigned", "Closed"],
            priority: {
                "High": "danger",
                "Normal": "primary",
                "Low": "default"
            },
            priorities: ["High", "Normal", "Low"],
            workers: ["Terence", "Mirko", "Koen", "Tom"]
        },
        links: [{
            name: "Tickets",
            href: '/octo/tickets/',
        }, {
            name: "Clients",
            href: '/octo/clients/',
        }]
    };
    res.locals.links.forEach(function(link, index) {
        if (req.originalUrl.match('^'+link.href))
            link.active = true;
    });
    next();
});

router.use('/tickets', ticket);
router.use('/clients', client);
router.get('/', function(req, res, next) {
    res.redirect('/octo/tickets');
});

module.exports = router;

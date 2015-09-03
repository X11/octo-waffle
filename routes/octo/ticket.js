var express = require('express');
var router = express.Router();

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
            active: null,
        }, {
            name: "Clients",
            href: '/octo/clients/',
            active: null,
        }]
    };
    next();
});

router.get('/', function(req, res, next) {
    res.locals.tickets = [{
        id: 1,
        title: "Lorem",
        client: "Lorem",
        updated_at: "" + (new Date()),
        created_at: "" + (new Date()),
        status: "Assigned",
        priority: "High",
        assigned: "Terence",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    }];
    res.render('ticket/index');
});

router.get('/create', function(req, res, next) {
    res.locals.current = {
        client: {name: "Lorem Ipsum Client"}
    };
    res.render('ticket/create');
});

router.post('/create', function(req, res, next) {
    console.log(req.body);
    res.redirect('/octo/tickets/');
});

router.get('/:id', function(req, res, next) {
    res.locals.ticket = {
        id: req.params.id,
        title: "Lorem",
        client: "Lorem",
        updated_at: "" + (new Date()),
        created_at: "" + (new Date()),
        status: "Assigned",
        priority: "High",
        assigned: "Terence",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    };
    res.render('ticket/ticket');
});

router.put('/:id', function(req, res, next) {
    console.log(req.body);
    res.redirect('/tickets/' + req.params.id);
});

module.exports = router;


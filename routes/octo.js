var express = require('express');
var router = express.Router();
var db = require('../lib/module.js');

var auth = require('./octo/auth.js');
var ticket = require('./octo/ticket');
var client = require('./octo/client');

router.use(function(req, res, next) {
    res.locals = {
        title: 'VuurVechters | Octo tickets.',
        heading: {
            title: 'Octo tickets',
        },
        options: db.options,
        links: [{
            name: 'Tickets',
            href: '/octo/tickets',
        }, {
            name: 'Clients',
            auth: 'Worker',
            href: '/octo/clients',
        }]
    };

    // Check for active state
    res.locals.links.forEach(function(link, index) {
        if (req.originalUrl.match('^'+link.href))
            link.active = true;
    });

    // Filter the links which they may access
    res.locals.links = res.locals.links.filter(function(link) {
        if (!req.session.current || (link.auth &&
                req.session.current.role != link.auth))
            return false;
        return true;
    });

    // Check for error & Success messages
    var mSuccess, mError;
    if ((mSuccess = req.flash('success').join('')) && mSuccess !== '')
        res.locals.success = mSuccess;
    if ((mError = req.flash('error').join('')) && mError !== '')
        res.locals.error = mError;

    // set current
    res.locals.current = req.session.current;

    //
    next();
});

// Routes where u need to be loged in
router.use(['/tickets', '/clients'], function(req, res, next) {
    if (!req.session.current)
        return res.redirect('/octo/auth/login');
    next();
});

// Routes where only workers can come
router.use(['/clients'], function(req, res, next) {
    if (req.session.current.role != 'Worker')
        return res.redirect('/octo/auth/login');
    next();
});

router.use('/auth', auth);
router.use('/tickets', ticket);
router.use('/clients', client);
router.get('/', function(req, res, next) {
    res.redirect('/octo/tickets');
});

module.exports = router;

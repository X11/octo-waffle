var express = require('express');
var redis = require('ioredis')();

var router = express.Router();

router.use(function(req, res, next) {
    console.log(req.session);
	if (req.session.accessLevel)
		return next();
	req.flash('message', "Geen toegang");
	res.redirect('/password');
});

/* GET users listing. */
router.get('/', function(req, res, next) {

    var objs = [];
    var left;

    if (req.session.accessLevel != '*'){
        left = 1;
        redis
            .hmget('group:' + req.session.accessLevel, 'logo', 'description', 'url', 'members', 'name')
            .then(function(data) {
                postGet(data, req.session.accessLevel);
            })
            .catch(function(err) {
                res.render('manage', {
                    title: "Bedrijven | Beheren",
                    error: 'An error accured',
                    groups: [],
                    heading: {
                        title: "Beheren",
                        bg: 'city'
                    },
                });
            });
    } else {
        redis
            .smembers('GROUPS')
            .then(function(vals) {
                left = vals.length;
                if (left === 0)
                    throw new Error("No groups to display");
                vals.forEach(function(i) {
                    redis
                        .hmget('group:' + i, 'logo', 'description', 'url', 'members', 'name')
                        .then(function(data) {
                            postGet(data, i);
                        });
                });

            })
            .catch(function(err) {
                res.render('manage', {
                    title: "Bedrijven | Beheren",
                    success: false,
                    error: err.message,
                    groups: [],
                    heading: {
                        title: "Beheren",
                        bg: 'city'
                    },
                });
            });
    }

    function postGet(obj, i) {
        if (obj[0] === null)
            obj[0] = "http://placehold.it/100x100";
        if (obj[1] === null)
            obj[1] = "lorem ipsum.";
        if (obj[2] === null)
            obj[2] = "http://example.com";
        if (obj[3] === null)
            obj[3] = "Example,Example 2,Example 3";
        if (obj[4] === null)
            obj[4] = "Bedrijfs naam";
        objs.push({
            id: i,
            logo: obj[0],
            description: obj[1],
            url: obj[2],
            members: obj[3],
            name: obj[4],
        });
        left--;
        check();
    }

    function check() {
        if (left > 0) return;
        res.render('manage', {
            title: "Bedrijven | Beheren",
            success: req.flash("success"),
            error: req.flash("error"),
            groups: objs,
            heading: {
                title: "Beheren",
                bg: 'city'
            },
        });
    }
});

router.post('/update/:id', function(req, res, next) {
	var index = req.params.id;
	if(req.session.accessLevel != '*' && req.session.accessLevel != index){
		req.flash('error', 'Geen toegang tot #'+index);
		res.redirect('/manage');
        return;
	}

    redis
        .sismember('GROUPS', index)
        .then(function(res) {
            if (res === 0)
                redis.sadd('GROUPS', index);
        });

	// Replace some magic <br>.
	for (var attr in req.body)
		req.body[attr] = req.body[attr].replace('<br>', '');

	redis.hmset('group:' + index, {
		name: req.body.name,
		logo: req.body.logo,
		description: req.body.description,
		url: req.body.url,
		members: req.body.members,
	});
	req.flash('success', '#'+index+" gewijzigd");
	res.status(200);
	res.redirect('/manage');
});

module.exports = router;


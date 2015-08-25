var express = require('express');
var redis = require('redis');

var router = express.Router();
var client = redis.createClient();

/* GET users listing. */
router.get('/', function(req, res, next) {
    client.get('GROUP_COUNT', function(err, val){
        if (err)
            throw err;

        var objs = [];
        var left = parseInt(val);
        for (var i = 1;  i < left+1; i++) {
            client.hmget('group:'+i, 'logo', 'description', 'url', 'members', 'name', postGet);
        }

        function postGet(err, obj){
            objs.push({
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
                title: "Beheer",
                groups: objs,
            });
        }
    });
});

router.post('/update/:id', function(req, res, next) {
    var index = req.params.id;
    client.hmset('group:'+index, {
        name: req.body.name,
        logo: req.body.logo,
        description: req.body.description,
        url: req.body.url,
        members: req.body.members,
    });
    res.send('OK');
});

module.exports = router;

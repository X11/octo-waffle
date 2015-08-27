var express = require('express');
var redis = require('ioredis')();

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {

    var objs = [];
    var left;

    redis
        .smembers('GROUPS')
        .then(function(vals) {
            left = vals.length;
            vals.forEach(function(i) {
                console.log(i);
                redis
                    .hmget('group:' + i, 'logo', 'description', 'url', 'members', 'name')
                    .then(function(data) {
                        postGet(data, i);
                    });
            });

        });

    function postGet(obj, i) {
        objs.push({
            id: i,
            logo: obj[0],
            description: obj[1],
            url: obj[2],
            members: obj[3].split(','),
            name: obj[4],
        });
        left--;
        check();
    }

    function check() {
        if (left > 0) return;
        res.render('companies', {
            title: "Bedrijven",
            groups: objs,
        });
    }
});

module.exports = router;


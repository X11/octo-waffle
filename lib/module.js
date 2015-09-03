var express     = require('express');
var Redis       = require('ioredis');
var crypto      = require('crypto');
var Q           = require('q');

var redis       = new Redis();

/* For usage and module.exports we wrap every method in a 'db' object. This
 * way we can call 'db.method' to use the set of custom methods. */
db = {
    clients: {
        /**
         * Retrieve all the current clients in a single array. Doesn't sort nor
         * specify which client is part of which group.
         *
         * Makes use of the following db entries:
         * clients:blacklist [SET]
         * clients:approved  [SET]
         * clients:pending   [SET]
         */
        all: function() {
            var allowed = ["clients:blacklist", "clients:approved", "clients:pending"];
            var list = [];
            var done = 0;
            var defer = Q.defer();

            allowed.forEach(function(client){
                redis.smembers(client).then(function(children) {
                    var a = JSON.stringify(children);
                    list = list.concat(a.replace(/[\[\]\"']+/g, "").split(","));
                    check();
                }).catch(function(err) {
                    defer.reject(err);
                });
            });

            function check() {
                done++;
                if (done < allowed.length) return;
                defer.resolve(list);
            }

            return defer.promise;
        },

        /**
         * Add an client to either 'blacklist', 'pending' or 'approved'.
         * It will move values that already exist and automatically updates
         * the total client count. You can use this method to move someone from
         * one list to the other or add them in the first place.
         *
         * Makes use of the following db entries:
         * clients:blacklist [SET]
         * clients:approved  [SET]
         * clients:pending   [SET]
         * clients:count     [INT]
         */
        add: function(where, what) {
           "use strict";

            var location;
            var allowed = ["clients:blacklist", "clients:approved", "clients:pending"];
            var client = "clients:" + where;
            var defer = Q.defer();

            redis.smembers("clients:blacklist").then(function(blacklist) {
                blacklist.forEach(function(n) {
                    if (parseInt(n) === what) location = "clients:blacklist";
                });

                redis.smembers('clients:approved').then(function(approved) {
                    approved.forEach(function(n) {
                        if (parseInt(n) === what) location = "clients:approved";
                    });

                    redis.smembers('clients:pending').then(function(pending) {
                        pending.forEach(function(n) {
                            if (parseInt(n) === what) location = "clients:pending";
                        });

                        /* After we validated all available sets for duplicates */
                        redis.smembers(client).then(function(result){
                            /* The element is already in the requested suffix. */
                            if (location === client)
                                return defer.reject(new Error("Element is already in the requested suffix"));

                            /* The requested clients: suffix does not exist. */
                            if (allowed.indexOf(client) === -1)
                                return defer.reject(new Error("The requested clients: suffix does not exist"));

                            /* No entry was found anywhere, add a new entry. */
                            if (location === undefined)
                                redis.sadd(client);

                            /* The entry was found somewhere else, move it from
                             * there to the new location. */
                            if (allowed.indexOf(location) !== -1)
                                redis.smove(location, client, what)

                            /* Whenever a new client was added we update the total
                             * client count. The promise around is confirm that
                             * clients:count actually exists. */
                            redis.get("clients:count").then(function(count){
                                /* The requested clients: suffix does not exist. */
                                if (count === undefined)
                                    return defer.reject(new Error("The requested clients: suffix does not exist"));

                                /* Ensure that we aren't moving but actually
                                 * creating a NEW entry. */
                                if (location === undefined)
                                    redis.incr("clients:count")

                                defer.reslove();
                            });
                        });
                    });
                });
            });

            return defer.promise;
        },
        remove: function(where, what) {
            /**
             * Remove an client from either 'blacklist',
             * 'pending' or 'approved'. It will only attempt to remove when the value is
             * detected and updates the total client count automatically.
             *
             * Makes use of the following db entries:
             * clients:blacklist [SET]
             * clients:approved  [SET]
             * clients:pending   [SET]
             * clients:count     [INT]
             */
            "use strict";

            var allowed = ["clients:blacklist", "clients:approved", "clients:pending"];
            var client = "clients:" + where;
            var defer = Q.defer();

            /* The requested clients: suffix does not exist. */
            if (allowed.indexOf(client) === -1)
                return defer.reject(new Error("The requested clients: suffix does not exist"));

            /* The what argument is an number, test for existance and if existant
             * remove it. */
            if (typeof what === "number")
                redis.sismember(client, what).then(function(result) {
                    if (result === 1) {
                        redis.srem(client, what);
                        redis.decr("clients:count");
                    }
                    defer.resolve();
                });

            /* The what argument is an array. Loop over all the arguments in the
             * array and validate that they're actually a member. If they are you
             * remove them. */
            if (what instanceof Array) {
                what.forEach(function(id) {
                    redis.sismember(client, id).then(function(result) {
                        if (result === 1) {
                            redis.srem(client, id);
                            redis.decr("clients:count");
                        }
                    });
                });

                defer.resolve();
            }

            return defer.promise;
        },
    },

    client: {
        create: function(who){
            var defer = Q.defer();
            var who = {
                /* If the password is a string you hash it. */
                password: (function(s) {
                    if (!!s) return crypto.createHash('sha256').update(s).digest('hex');
                })(who.password),

                /* Try to match a valid email address. */
                email: (function(s) {
                    if (s.match(/^\S+@\S+\.\S+$/)) return s
                })(who.email),

                /* Make sure that that name is beyond 4 characters and isn't
                 * undefined. */
                name: (function(s) {
                    if (!!s && s.length > 4) return s
                })(who.name),
            };

            for (var attribute in who)
                if (!who[attribute])
                    return defer.reject(new Error("One of the attributes is undefined"));

            redis.get("clients:count").then(function(id){
                /* If client:count is defined and is bigger or equal then 0. */
                if (id <= 0) return;

                redis.hlen('client:' + id).then(function(hash){
                    /* The hash already has fields and therefor exists. */
                    if (hash !== 0) return;

                    redis.hmset('client:' + id,
                            'password', who.password,
                            'email', who.email,
                            'name', who.name);

                    // Needs some testing. Will do later.
                    global.db.clients.add('approved', id)

                    defer.resolve();
                });
            });

            return defer.promise();
        },
    },

    changeClient: function(){},
    addTicketsClient: function(){},
    removeTicketsClient: function(){}
}

module.exports = db;

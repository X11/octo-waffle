var Redis       = require('ioredis');
var crypto      = require('crypto');
var Q           = require('q');

var redis       = new Redis();

/* For usage and module.exports we wrap every method in a 'db' object. This
 * way we can call 'db.method' to use the set of custom methods. */
db = {
    options: {
        // Keep this for labels
        status: {
            'Open': 'success',
            'Assigned': 'default',
            'primary': 'default'
        },
        // Keep this for reference
        statuses: ['Open', 'Assigned', 'Closed'],
        // Keep this for labels
        priority: {
            'High': 'danger',
            'Normal': 'primary',
            'Low': 'default'
        },
        // Keep this for reference
        priorities: ['High', 'Normal', 'Low'],
        // Get set keys dynamicly
        workers: ['Not assigned', 'Terence', 'Mirko', 'Koen', 'Tom']
    },

    client: {
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
            var allowed = ['clients:blacklist', 'clients:approved', 'clients:pending'];
            var defer = Q.defer();
            var counter = 0;
            var list = [];

            allowed.forEach(function(client){
                redis.smembers(client).then(function(children) {
                    list = list.concat(children);
                    (function() {
                        counter ++;
                        if (counter < allowed.length)
                            return;
                        defer.resolve(list);
                    }());
                }).catch(function(err) {
                    defer.reject(err);
                });
            });

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
           'use strict';

            var location;
            var allowed = ['clients:blacklist', 'clients:approved', 'clients:pending'];
            var client = 'clients:' + where;
            var defer = Q.defer();

            redis.smembers('clients:blacklist').then(function(blacklist) {
                blacklist.forEach(function(n) {
                    if (parseInt(n) === what) location = 'clients:blacklist';
                });

                redis.smembers('clients:approved').then(function(approved) {
                    approved.forEach(function(n) {
                        if (parseInt(n) === what) location = 'clients:approved';
                    });

                    redis.smembers('clients:pending').then(function(pending) {
                        pending.forEach(function(n) {
                            if (parseInt(n) === what) location = 'clients:pending';
                        });

                        /* After we validated all available sets for duplicates */
                        redis.smembers(client).then(function(result){
                            /* The element is already in the requested suffix. */
                            if (location === client)
                                return defer.reject(new Error('Element is already in the requested suffix'));

                            /* The requested clients: suffix does not exist. */
                            if (allowed.indexOf(client) === -1)
                                return defer.reject(new Error('The requested clients: suffix does not exist'));

                            /* No entry was found anywhere, add a new entry. */
                            if (location === undefined)
                                redis.sadd(client, what);

                            /* The entry was found somewhere else, move it from
                             * there to the new location. */
                            if (allowed.indexOf(location) !== -1)
                                redis.smove(location, client, what);

                            /* Whenever a new client was added we update the total
                             * client count. The promise around is confirm that
                             * clients:count actually exists. */
                            redis.get('clients:count').then(function(count){
                                /* The requested clients: suffix does not exist. */
                                if (count === undefined)
                                    return defer.reject(new Error('The requested clients: suffix does not exist'));

                                /* Ensure that we aren't moving but actually
                                 * creating a NEW entry. */
                                if (location === undefined)
                                    redis.incr('clients:count');

                                defer.resolve(1);
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
            'use strict';

            var allowed = ['clients:blacklist', 'clients:approved', 'clients:pending'];
            var client = 'clients:' + where;
            var defer = Q.defer();

            /* The requested clients: suffix does not exist. */
            if (allowed.indexOf(client) === -1)
                return defer.reject(new Error('The requested clients: suffix does not exist'));

            /* The what argument is an number, test for existance and if existant
             * remove it. */
            if (typeof what === 'number') {
                redis.sismember(client, what).then(function(result) {
                    if (result === 1) {
                        redis.srem(client, what);
                        redis.decr('clients:count');
                    }
                    defer.resolve(1);
                });
            }

            /* The what argument is an array. Loop over all the arguments in the
             * array and validate that they're actually a member. If they are you
             * remove them. */
            if (what instanceof Array) {
                what.forEach(function(id) {
                    redis.sismember(client, id).then(function(result) {
                        if (result === 1) {
                            redis.srem(client, id);
                            redis.decr('clients:count');
                        }
                    });
                });
                defer.resolve(1);
            }
            return defer.promise;
        },

        create: function(who) {
            var defer = Q.defer();
            var who = {
                /* If the password is a string you hash it. */
                password: (function(s) {
                    if (!!s) return crypto.createHash('sha256').update(s).digest('hex');
                })(who.password),

                /* Try to match a valid email address. */
                email: (function(s) {
                    if (s.match(/^\S+@\S+\.\S+$/)) return s;
                })(who.email),

                /* Make sure that that name is beyond 4 characters and isn't
                 * undefined. */
                name: (function(s) {
                    if (!!s && s.length > 4) return s;
                })(who.name),
            };

            for (var attribute in who)
                if (!who[attribute])
                    return defer.reject(new Error('One of the attributes is undefined'));

            redis.get('clients:count').then(function(id){
                if (id === null) redis.set('clients:count', 0);
                if (id < 0) return;

                redis.hlen('client:' + id).then(function(hash){
                    /* The hash already has fields and therefor exists. */
                    if (hash !== 0) return;

                    redis.hmset('client:' + id,
                            'password', who.password,
                            'email', who.email,
                            'name', who.name);

                    global.db.clients.add('approved', id);
                    defer.resolve(1);

                }).catch(function(error) {
                    return defer.reject(new Error('One of the attributes is undefined'));
                });
            });

            return defer.promise;
        },
    },

    ticket: {
        create: function(what) {
            var date = new Date();
            var defer = Q.defer();
            var ticket = {

                client: (function(s) {
                    if (!!s) return s;
                })(what.client),

                updated_at: '' + (date.toLocaleDateString() + ' ' + date.toLocaleTimeString()),
                created_at: '' + (date.toLocaleDateString() + ' ' + date.toLocaleTimeString()),
                status: 'Open',
                assigned: 'Not assigned',

                description: (function(s) {
                    if (!!s) return s;
                })(what.description),

                priority: (function(s) {
                    if (global.db.options.priorities.indexOf(s) !== -1) return s;
                })(what.priority),

                title: (function(s) {
                    if (!!s && s.length < 128) return s;
                })(what.title),
            };

            for (var attribute in ticket)
                if (!ticket[attribute])
                    return defer.reject(new Error('One of the attributes is undefined'));

            redis.get('tickets:count').then(function(id) {
                /* Create the counter when none is found. */
                if (id === null){
                    redis.set('tickets:count', 1);
                    id = 1;
                }

                /* Don't continue when the counter is beneath 0. */
                if (id < 0 ) return;

                redis.hlen('ticket:' + id).then(function(hash){
                    /* The hash already has fields and therefor exists. */
                    if (hash !== 0) return;

                    /* Create the ticket uniquely. */
                    redis.hmset('ticket:' + id, ticket);

                    /* Add the ticket to the list of all tickets. */
                    redis.sadd('tickets', id);

                    /* Update the ticket counter so we don't have duplicates.*/
                    redis.incr('tickets:count');
                    return defer.resolve(ticket);
                }).catch(function(error) {
                    return defer.reject(new Error('Some shit went wrong.'));
                });
            });

            return defer.promise;
        },
        all: function() {
            var defer = Q.defer();
            var list = [];

            redis.smembers('tickets').then(function(children) {
                if (!children) return defer.resolve([]);
                var items = children.length;
                children.forEach(function(id) {
                    redis.hgetall('ticket:'+id).then(function(hash) {
                        hash.id = id;
                        list.push(hash);
                        (function() {
                            if (list.length < items)
                                return;
                            defer.resolve(list);
                        }());
                    }).catch(function(err) {
                        defer.reject(err);
                    });
                });
            }).catch(function(err) {
                defer.reject(err);
            });
            return defer.promise;
        },
        get: function(id) {
            var defer = Q.defer();
            redis.hgetall('ticket:'+id).then(function(hash) {
                defer.resolve(hash);
            }).catch(function(err) {
                defer.reject(err);
            });
            return defer.promise;
        }

    },
};

// db.client.all()
// db.client.add('suffix', id)
// db.client.remove('suffix', 'id')

// db.client.create({password:'test', name:'mirko', email:'test@test.com'})

// db.ticket.create({description:'memes', priority:'low', title:'all about'})

// db.ticket.all().then(function(m){
//    console.log(m)
// })

module.exports = db;

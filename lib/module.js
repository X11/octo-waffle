/*
 * Author: mvdw 
 * Mail: <mvdw at airmail dot cc>
 * Distributed under terms of the GNU2 license.
 */

var crypto      = require('crypto');
var Redis       = require('ioredis');

var redis       = new Redis();

db = {
    /**
     * Makes use of the following db entries:
     * clients:blacklist [SET]
     * clients:approved  [SET]
     * clients:pending   [SET]
     * clients:count     [INT]
     */
    addClientId: function(where, what) {
        "use strict";
        
        var allowed = ["clients:blacklist", "clients:approved", "clients:pending"];
        var client = "clients:" + where;
        var location;

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
                            return;

                        /* The requested clients: suffix does not exist. */
                        if (allowed.indexOf(client) === -1)
                            return;

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
                                return

                            /* Ensure that we aren't moving but actually
                             * creating a NEW entry. */
                            if (location === undefined) 
                                redis.incr("clients:count")
                        });
                    });
                });
            });
        });
    },
    
    /**
     * Makes use of the following db entries:
     * clients:blacklist [SET]
     * clients:approved  [SET]
     * clients:pending   [SET]
     * clients:count     [INT]
     */
    removeClientId: function(where, what) {
        "use strict";

        var allowed = ["clients:blacklist", "clients:approved", "clients:pending"];
        var client = "clients:" + where;
        
        /* The requested clients: suffix does not exist. */
        if (allowed.indexOf(client) === -1) 
            return;
        
        /* The what argument is an number, test for existance and if existant
         * remove it. */
        if (typeof what === "number")
            redis.sismember(client, what).then(function(result) {
                if (result === 1) {
                    redis.srem(client, what);
                    redis.decr("clients:count");
                }
            });
        
        /* The what argument is an array. Loop over all the arguments in the
         * array and validate that they're actually a member. If they are you
         * remove them. */
        if (what instanceof Array)
            what.forEach(function(id) {
                redis.sismember(client, id).then(function(result) {
                    if (result === 1) {
                        redis.srem(client, id);
                        redis.decr("clients:count");
                    }
                });
            });
    },

    createClient: function(who){
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

            /* Will have an 1h timeout. */
            raw: who.password
        };

        /* Need to find out how to get this working... :/ */
        redis.get("clients:count").then(function(result){
            if (!!result && result > 0)
                who.uid = result;
        });

        /* Whenever any of the attributes is not correct (undefined). */
        for (var attribute in who)
            if (!who[attribute]) return;

        // console.log(who)
    },

    changeClient: function(){},
    addTicketsClient: function(){},
    removeTicketsClient: function(){}
}
// Working!
// db.addClientId('meme', 1)
// db.removeClientId('blacklist', 2)

// Working on!
// db.createClient({password:'test', email:'mvdw@airmail.cc', name:'mirko'});

/* Method reference list.
 * addClient('where', 'what'): Add an client to either 'blacklist', 'pending' or
 * 'approved'. It will move values that already exist and automatically updates
 * the total client count.
 *
 * removeClient('where', 'what'): Remove an client from either 'blacklist',
 * 'pending' or 'approved'. It will only attempt to remove when the value is
 * detected and updates the total client count automatically.
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

module.exports = db;

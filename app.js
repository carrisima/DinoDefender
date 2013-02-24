//=========================================================================
// Configuration
// check Heroku environment variables first
//

// Port. Default is most likely 80
var port = process.env.PORT || 80;

// static folder to serve files from
var gameDirectory = __dirname;

// Our MongoDB address, which includes the database name
var mongodbURL = process.env.MONGOHQ_URL || "mongodb://localhost/Dino";

//=========================================================================
// Load our dependencies
//

var express = require('express'),
    fs = require('fs'),
    _ = require('underscore'),
    mongodb = require('mongodb');

//=========================================================================
// Our app module is going to a customized express server
// Configure as we create it: add logging, a public directory for serving files,
// body and cookie parsers.

var app = express.createServer(
    express.static( gameDirectory ),
    express.bodyParser()

);
app.use(app.router);
//=========================================================================
// Configuration
//

// Set different error handlers for different environments
// Default environment is development

// The server will be serving static files from a sub directory called "/public"
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

//=========================================================================
// Start the server!
//
app.listen(3000, function(){
    console.log("Updated express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

//=========================================================================
// Databases!
//
// These are based on the book's BlobClicker game, but uses a "score" entry
// instead of a "clicks"
//

// Local storage for utility functions
var dbMethods = {};

// connect to the database
mongodb.connect( mongodbURL, {}, function( error, db ) {

    if( error ) {
        console.log( "mongodb.connect: Could not connect to database: ");
        console.log( error );
        return;
    }
    console.log( "mongodb.connect: Connected to our mongodb databse. You should notice the connection in the mongod.exe logs." );

    // grab the "users" collection and generate a few utility functions
    db.collection('users', function(err, collection) {

        if( err ) {
            console.log( "mongodb.db.collection: Could not connect to 'users' collection in the database" );
            console.log( err );
            return;
        }
        console.log( "mongodb.db.collection: 'users' collection accessed, generating utility functions" );


        //=========================================================================
        // Utility function: gets an entry on the the database, or creates a new
        // one if it doesn't exist
        dbMethods.fetchUser = function(userName, callback) {
            if( !userName ) {
                callback(false);
                return;
            }

            collection.findOne( { user_name: userName }, function( error, userEntry ) {
                if( !userEntry ) {
                    userEntry = {
                        user_name: userName,
                        user_score: 0
                    };
                }
                callback( userEntry );
            });
        };

        //=========================================================================
        // Utility function: adds or updates an entry on the the database
        //
        dbMethods.setUserScore = function(userEntry, callback) {
            if( !userEntry ) {
                callback(false);
                return;
            }
            collection.save(userEntry, function() { callback(userEntry); });
        };

        //=========================================================================
        // Utility function: returns an array that stores the top ten users sorted by score
        //
        dbMethods.topTen = function(callback) {
            collection.find().sort({ score: -1 }).limit(10).toArray(function(error,results) {
                var output = [];
                for(var i in results) {
                    output.push( {
                        user_name: results[i].user_name,
                        user_score: results[i].user_score
                    });
                }
                callback(output);
            });
        };

        //=========================================================================
        // Utility function: clear the database
        //
        dbMethods.clearUsers = function(callback) {
            collection.drop( callback );
        };

    }); // end db.collection
});     // end mongodb.connect


//=========================================================================
// Launch page
//
function main_page(req, res) {

    // If there was post data, use it to fill out or update an entry in the database
    if( req.body.user_name ) {
        // Grab the post data from the body parser
        var userName = req.body.user_name;
        var userScore = req.body.user_score;

        // Attempt to get an existing user. This will give us a new one if there wasn't one already
        dbMethods.fetchUser( userName, function( userEntry ) {

            // Update the score and update the database collection
            userEntry.user_score = userScore;
            dbMethods.setUserScore( userEntry, function(success) {
                if(success) {
                    console.log( "New user/score entry added to the database!" );
                } else {
                    console.log( "User could not be added to the database" );
                }
            });
        });
    }

    // Display the main page
    res.redirect( "/index.html" );
}

// To handle post data from our page, use these events
app.get('/index.html', main_page );
app.post('/index.html', main_page );

//=========================================================================
// Test pages
//

app.get('/top-ten',function(req,res) {
    console.log( "Displaying top-ten users" );
    dbMethods.topTen(function(results) {
        res.json({ users: results });
    });
});

app.get('/clearUsers',function(req,res) {
    console.log( "Clearing entire users database" );
    dbMethods.clearUsers(function(results) {
        res.json({ users: results });
    });
});


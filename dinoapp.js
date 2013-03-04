//=========================================================================
// Configuration
// check Heroku environment variables first
//

// Port. Default is most likely 3000
var port = process.env.PORT || 3000;

// static folder to serve files from
var gameDirectory = __dirname;

// Our MongoDB address, which includes the database name
var mongodbURL = process.env.MONGOHQ_URL || "mongodb://localhost/Dino";
//========================================================================
//Configuration: Authentication
//our session secret
var sessionSecret = process.env.SESSION_SECRET || "ONLY THE SHADOW KNOWS";

//Google auth variables
var GOOGLE_RETURN_URL = process.env.GOOGLE_RETURN_URL || 'http://localhost:3000/auth/google/return';
var GOOGLE_REALM = process.env.GOOGLE_REALM || 'http://localhost:3000/';

//FaceBook auth variables
var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "175796289236202";
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_SECRET || "7332cd2ec6b29861427cd07c28de6852";
var FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/auth/facebook/callback";


//========================================================================
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
    express.cookieParser(),
    express.bodyParser(),
    express.session({secret: sessionSecret}),
    passport.initialize(),
    passport.session()

);

//Views and routes
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(app.router);
//=========================================================================
// Server Configuration

// Set different error handlers for different environments
// Default environment is development

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

//passport session setup
passport.serializeUser(function(user, done){
        done(null, user);
});

passport.deserializeUser(function(obj, done){
    done(null, obj);
});
//=========================================================================
//Ensure users are authenticated before showing them stuff
function ensureAuthenticatedUser(req, res, next){
    if(req.isAuthenticated()) {return next();}
    console.log("User is not authenticated.   Redirecting to login page.");
    req.flash("warn", "You must be logged-in to see that page.  Go log in now.  Really.");
    res.redirect("/");
}

//*************************************************************************
//*******************************************************
// Username & Password
// The most widely used way for websites to authenticate users is via a username
// and password. Support for this mechanism is provided by the passport-local module.
(function() {

    // Use the LocalStrategy within Passport.
    //   Strategies in passport require a `verify` function, which accept
    //   credentials (in this case, a username and password), and invoke a callback
    //   with a user object.
    passport.use(new LocalStrategy(
        function(username, password, done) {
            // Find the user by username.  If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message.  Otherwise, return the
            // authenticated `user`.
            console.log( "Attempting to authenticate local user: " + username );
            var userInfo = {username: username};
            dbMethods.findUser( userInfo, function(err, user) {
                if (err) {
                    console.log( "Could not find existing user with the given username." );
                    return done(err);
                }
                if (!user) {
                    console.log( "Could not find existing user with the given username." );
                    return done(null, false, { message: 'Unknown user ' + username });
                }

                console.log( "We found an existing user with the given username, verifying password!" );
                if (user.password != password) {
                    console.log( "Invalid password!" );
                    return done(null, false, { message: 'Invalid password' });
                }

                console.log( "Password matched! User authenticated!" );
                return done(null, user);
            });
        }
    ));


// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
app.post('/',
    passport.authenticate('local', { failureRedirect: '/', successRedirect: '/', failureFlash: true }),
    function(req, res) {
        res.redirect('/');
    });

app.get('/createAccount', function(req, res){
    res.render('createAccount', { user: req.user });
});

app.post('/createAccount', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var givenName = req.body.givenName;
    var familyName = req.body.familyName;
    console.log( "Attempting to create new account: " + username );

    // @TODO, it would be nice to have a better form validation scheme
    if( username.length === 0 ) {
        console.log( "Create new account failed: Requires valid username" );
        res.redirect('createAccount');
        return;
    }
    if( password.length === 0 ) {
        console.log( "Create new account failed: Requires valid password" );
        res.redirect('createAccount');
        return;
    }
    if( email.length === 0 ) {
        console.log( "Create new account failed: Requires valid email" );
        res.redirect('createAccount');
        return;
    }
    if( givenName.length === 0 ) {
        console.log( "Create new account failed: Requires valid givenName" );
        res.redirect('createAccount');
        return;
    }
    if( familyName.length === 0 ) {
        console.log( "Create new account failed: Requires valid familyName" );
        res.redirect('createAccount');
        return;
    }

    var userInfo = { username: username };

    dbMethods.findUser( userInfo, function(err, user) {
        if( user ) {
            console.log( "Create new account failed: existing username" );
            res.redirect('createAccount');
            return;
        }

        // profile data
        userInfo.password = password;
        userInfo.email = email;
        userInfo.displayName = username;
        userInfo.name = { givenName: givenName, familyName: familyName };

        // game data
        userInfo.userScore = 0;

        dbMethods.createNewUser( userInfo, function(err, result) {
            console.log( "Create new account: SUCCESS" );
            //@TODO - it would be nice to have the user immediately authenticated
            // so they do not have to login
            return res.redirect("/");
        });
    });
});
})();


//*******************************************************
// Facebook
//
(function() {
    passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: FACEBOOK_CALLBACK_URL
        },
        function(accessToken, refreshToken, profile, done) {
            // We will attempt to find an existing user that is mapped to this Facebook account
            // otherwise we will need to create a new user in our database and then associate
            // it with this Facebook account.
            var userInfo = { facebookId: profile.id };
            dbMethods.findOrCreateUser( userInfo, profile, function(err, user) {
                return done(err, user);
            } );
        }
    ));

    // Redirect the user to Facebook for authentication.  When complete,
    // Facebook will redirect the user back to the application at
    //     /auth/facebook/callback
    app.get('/auth/facebook', passport.authenticate('facebook'));

    // Facebook will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/'
    }));
})();

//*******************************************************
// Google
//
// When using Google for sign in, your application must implement a return URL,
// to which Google will redirect users after they have authenticated. The realm
// indicates the part of URL-space for which authentication is valid. Typically
// this will be the root URL of your website.
//
(function() {
    passport.use(new GoogleStrategy({
            returnURL: GOOGLE_RETURN_URL,
            realm: GOOGLE_REALM
        },
        function(identifier, profile, done) {
            // We will attempt to find an existing user that is mapped to this Google account
            // otherwise we will need to create a new user in our database and then associate
            // it with this google account.
            var userInfo = {openId: identifier};
            dbMethods.findOrCreateUser( userInfo, profile, function(err, user) {
                return done(err, user);
            } );
        }
    ));

    // Two routes are required for Google authentication. The first route redirects
    // the user to Google. The second route is the URL to which Google will return
    // the user after they have signed in.

    // Redirect the user to Google for authentication.  When complete, Google
    // will redirect the user back to the application at
    //     /auth/google/return
    app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/' }),
        function(req, res) {
            res.redirect('/');
        }
    );

    // Google will redirect the user to this URL after authentication.  Finish
    // the process by verifying the assertion.  If valid, the user will be
    // logged in.  Otherwise, authentication has failed.
    app.get('/auth/google/return', passport.authenticate('google', { failureRedirect: '/' }),
        function(req, res) {
            res.redirect('/');
        }
    );
})();

//=========================================================================
// Start the server!
//
app.listen(port, function(){
    console.log("Updated express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

//=========================================================================
// Databases!
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
        // Utility function: find a user
        dbMethods.findUser = function (selector, callback) {
            collection.findOne(selector, callback);
        };
        //=========================================================================
        // Utility function: create a new user
        dbMethods.createNewUser = function(userInfo, callback){
              collection.insert(userInfo, null, function(err, result){
                  if(err){
                      callback(err,null);
                  } else {
                      callback(null, userInfo);
                  }

              })
        };

        //=========================================================================
        // Utility function: find a user or create a new one

        dbMethods.findOrCreateUser = function(selector, thirdPartyProfileData, callback){
            collection.findOne(selector, function(err, result){
                if(result){
                    console.log("Found an existing user through authentication method!");
                }
                else {
                    //no user found, create a new one and associate with auth properties
                    console.log("Could not find existing user through third-party account." +
                        "Trying to create a new one.");

                    //update profile with info from third party auth
                    var userInfo = selector;
                    userInfo.displayName = thirdPartyProfileData.displayName;
                    userInfo.name = thirdPartyProfileData.name;
                    userInfo.email = thirdPartyProfileData.emails[0];

                    //game data
                    userInfo.userScore = 0;
                    collection.insert (userInfo, null, function(err, result){
                       if(err){
                           console.log("Error: Could not create new user from third party account. Bummer.");
                           console.log("Here's why: " + err);
                           callback(err, null);
                       } else {
                           console.log("New user created from third-party account! Hooray!");
                           callback (null, userInfo);
                       }
                    });
                }
            })
        };
        //=========================================================================
        // Utility function: updates a players score
        //
        dbMethods.updateUserInfo = function(userInfo, callback) {
            if( !userInfo ) {
                callback(false);
                return;
            }

            //@TODO - make this work using .update() instead
            collection.save(userInfo, function(error, results) {
                if( error ) {
                    console.log( "Could not update score for user" );
                    callback( false );
                } else {
                    console.log( "Score updated!", results );
                    callback(results);
                }
            });
        };



        //=========================================================================
        // Utility function: returns an array that stores the top ten users sorted by score
        //
        dbMethods.topTenScores = function(callback) {
            // get the top 10 scored entries from our Users database
            // for each item returned, use dbMethods.findUser for the given user
            collection.find().sort({ userScore: -1 }).limit(10).toArray(function(error,results) {
                if( error ) {
                    callback(false);
                    return;
                }

                var output = [];
                for(var i in results) {
                    output.push( {
                        displayName: results[i].displayName,
                        userScore: results[i].userScore,
                        id: results[i]._id
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
app.get('/', function(req, res){
    res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticatedUser, function(req, res){
    res.render('account', { user: req.user });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/game', ensureAuthenticatedUser, function(req,res) {
    console.log( "Going to our webgame" );
    res.render('game', { user: req.user });
});

app.post('/updateScore', ensureAuthenticatedUser, function(req,res) {
    //we get the data passed in from $.post() from the request.body
    req.user.userScore = req.body.userScore;

    console.log( "player score update requested with score: " + req.user.userScore );
    dbMethods.updateUserInfo( req.user, function(results) {
        console.log( "Player score updated? " + results );
    } );
});

app.get('/top-ten',function(req,res) {
    dbMethods.topTenScores(function(results) {
        res.json({ users: results });
    });
});

///////////////////////////////////
// Debug pages
///////////////////////////////////

app.get('/clearUsers',function(req,res) {
    console.log( "Clearing entire users database" );
    dbMethods.clearUsers(function(results) {
        res.json({ users: results });
    });
});


    // Display the main page
    //res.redirect( "/index.html" );



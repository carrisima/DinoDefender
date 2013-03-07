//=========================================================================
// Engine
//
// Game container class
//
// Required Libraries:
// Underscore
//
// This file *MUST* come first, before any other engine files
// so it can setup the Engine definition before other systems
// add more features to it or object to it's namespace.
//=========================================================================

var Engine = (function() {

	//=========================================================================
	// static data -
	var _currentInstance = null;

	//=========================================================================
	// static function -
	GetCurrentInstance = function() {
		return _currentInstance;
	};

	//=========================================================================
	// static function -
	// turns a string of passed-in, comma-separated names and turns them
	// into an array of names with any whitespaces stripped out
	_normalizeArg = function(arg) {
		if(_.isString(arg)) {
			arg = arg.replace(/\s+/g,'').split(",");
		}
		if(!_.isArray(arg)) {
			arg = [ arg ];
		}
		return arg;
	};

	//=========================================================================
	// helper function -
	// Shortcut to extend Engine with new functionality
	// binding the methods to engine
	extend = function(obj) {
		_(this).extend(obj);
		return this;
	};


	//=========================================================================
	// helper function -
	// Syntax for including other modules into Engine
	includeModule = function(mod) {
		var engine = this;
		_.each(Engine._normalizeArg(mod),function(m) {
			m = Engine[m] || m;
			if( typeof m !== 'function' ) {
				console.error( "Engine Error: No module found for name: ", m );
			} else {
				m.apply(engine);
			}
		});
		return this;
	};

	//=========================================================================
	// Main Game Loop -  update and render
	// 1. Step the game logic through a small chunk of time handling
	// any user input, motion/physics, collisions and updating game objects.
	//
	// 2. How we process a rendering step depends on if we are using canvas, svg, css
	// For canvas, we usually want to clear the entire canvas and redraw the necessary
	// sprites. For css or svg games, provided we updated the properties of the objects
	// on the page correctly, the browser takes car of moving and updating the objects.
	setGameLoop = function(callback) {
		this.lastGameLoopFrame = 0; //new Date().getTime();

		// funky - Use a local variable to bind original context
		// because it gets lost in the wrapper
		var that = this;

		this.gameLoopCallbackWrapper = function(now) {
			that.loop = requestAnimationFrame(that.gameLoopCallbackWrapper);
			if( that.lastGameLoopFrame === 0 )
				that.lastGameLoopFrame = 0;
			var dt = now - that.lastGameLoopFrame;
			if(dt > 100) { dt = 100; }
			callback.apply(that,[dt / 1000]);
			that.lastGameLoopFrame = now;
		};

		requestAnimationFrame(this.gameLoopCallbackWrapper);
	};

	//=========================================================================
	// stop game timer
	pauseGame = function() {
		//console.log( "Engine Paused" );
		if(this.loop) {
			cancelAnimationFrame(this.loop);
		}
		this.loop = null;
	};

	//=========================================================================
	// resume game timer
	unpauseGame = function() {
		//console.log( "Engine Unpaused" );
		if(!this.loop) {
			this.lastGameLoopFrame = 0; //new Date().getTime();
			this.loop = requestAnimationFrame(this.gameLoopCallbackWrapper);
		}
	};

	//=========================================================================
	registerComponent = function(name,methods) {
		// Verify that we don't already have a component registered by the given name
		if( this.components[name] ) {
			console.error( "Engine registering a component that already registered." );
			return;
		}
		methods.name = name;
		// Create a new component with the methods passed in
		this.components[name] = Engine.Component.extend(methods);
	};

	//=========================================================================
	// Engine constructor
	var engineDefinition = function (configOptions) {

		// Do not allow more than one instance of the engine
		if( _currentInstance ) {
			return _currentInstance;
		}

		// Make sure this function was called with new
		if( !(this instanceof Engine) ) {
			return new Engine(configOptions);
		}

		// Some base options that can be extended with additional
		// passed in options through parameter configOptions
		this.options = {
			imagePath: "images/",
			audioPath: "audio/",
			dataPath:  "data/",
			audioSupported: [ 'mp3','ogg' ],
			sound: true
		};
		if(configOptions) { _(this.options).extend(configOptions); }
		//console.log( "New Engine instance. Options:", this.options );

		// Member data
		this.components = {};
		this.inputs = {};
		this.joypad = {};

		// Use Underscore library to bind these functions so that the context
		// passed in is *always* the engine instance, so that if the user
		// registers them as a callback the 'this' pointer is correct
		_.bindAll(this,"pauseGame","unpauseGame");

		_currentInstance = this;
	};

	//=========================================================================
	// Engine prototype
	engineDefinition.prototype = {
		constructor: Engine,

		// public member functions
		extend: extend,
		includeModule: includeModule,
		setGameLoop: setGameLoop,
		pauseGame: pauseGame,
		unpauseGame: unpauseGame,
		registerComponent: registerComponent
	};

	//=========================================================================
	// public static functions
	engineDefinition.GetCurrentInstance = GetCurrentInstance;
	engineDefinition._normalizeArg = _normalizeArg;

	return engineDefinition;
}());


//=========================================================================
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

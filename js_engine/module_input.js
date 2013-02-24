//*****************************************************************************
// Input Module
//
//
//
// Required libraries:
// * Modernizr
// * Underscore
// * JQuery
//
// @TODO
// - Add support for mouseWheel events
// - Add support for touchscreen / touch events
// - Code Cleanup: Seperate keyboard, mouse, touch, and gamepad functionality
// into seperate components.
// - Data Abstraction, bind game action events "fire, jump, left" to
// device input events for any device "button" "mouseleftdown" (already does this for keyboard)
//*****************************************************************************

// Requires Engine namespace
(function() {
	if( Engine === undefined ) {
		console.error( "No Engine Definition" );
	}
})();


var KeyCodeNames = {
	8: "Backspace",
	9: "Tab",
	12: "center",  //numpad
	13: "Enter",
	16: "Shift",
	17: "Ctrl",
	18: "Alt",
	19: "Break",
	20: "CapsLock",
	27: "Escape",
	32: " ",   //space
	33: "PgUp",
	34: "PgDn",
	35: "End",
	36: "Home",
	37: "left",    //arrow
	38: "up",      //arrow
	39: "right",   //arrow
	40: "down",    //arrow
	44: ",",
	45: "Insert",
	46: "Delete",
	47: "/",
	48: "0",
	49: "1",
	50: "2",
	51: "3",
	52: "4",
	53: "5",
	54: "6",
	55: "7",
	56: "8",
	57: "9",
	59: ";",
	61: "=",
	62: ".",
	65: "A",
	66: "B",
	67: "C",
	68: "D",
	69: "E",
	70: "F",
	71: "G",
	72: "H",
	73: "I",
	74: "J",
	75: "K",
	76: "L",
	77: "M",
	78: "N",
	79: "O",
	80: "P",
	81: "Q",
	82: "R",
	83: "S",
	84: "T",
	85: "U",
	86: "V",
	87: "W",
	88: "X",
	89: "Y",
	90: "Z",
	91: "[",
	92: "\\",
	93: "]",
	95: "-",
	96: "numpad 0",
	97: "numpad 1",
	98: "numpad 2",
	99: "numpad 3",
	100: "numpad 4",
	101: "numpad 5",
	102: "numpad 6",
	103: "numpad 7",
	104: "numpad 8",
	105: "numpad 9",
	106: "numpad *",
	107: "numpad +",
	109: "numpad -",
	110: "numpad .",
	111: "numpad /",
	112: "F1",
	113: "F2",
	114: "F3",
	115: "F4",
	116: "F5",
	117: "F6",
	118: "F7",
	119: "F8",
	120: "F9",
	121: "F10",
	122: "F11",
	123: "F12",
	126: "`",
	144: "NumLock",
	145: "ScrollLock",
	190: ".", //or 62
	222: "'"
};

var KEY_NAMES = { LEFT: 37, RIGHT: 39, SPACE: 32,
					UP: 38, DOWN: 40,
					Z: 90, X: 88, H: 72, F: 70  };

var DEFAULT_KEYS = { LEFT: 'left', RIGHT: 'right',
					UP: 'up',     DOWN: 'down',
					SPACE: 'fire',
					Z: 'fire',
					X: 'action',
                    H: 'hop',
                    F: 'fart'};


//***********************
// Mouse constants
//***********************
var IsMSIE = navigator.appName.match(/Explorer/);
var MOUSE_LEFT = IsMSIE ? 1 : 0;
var MOUSE_RIGHT = 2;
var MOUSE_MIDDLE = IsMSIE ? 4 : 1;

//***********************
// Gamepad constants
//***********************
var STICK_OFFSET = 25;
var ANALOGUE_BUTTON_THRESHOLD = 0.5;
var AXIS_THRESHOLD = 0.75;
var TYPICAL_BUTTON_COUNT = 16;
var TYPICAL_AXIS_COUNT = 4;

//***********************
// Touch constants
//***********************
//@TODO

//=========================================================================
// Input Module
//=========================================================================
Engine.Input = function() {


	//=========================================================================
	// Input System
	// - Is an Entity, so it can have its own components and bind/trigger events.
	//=========================================================================
	Engine.InputSystem = Engine.Evented.extend({

		// Class name, for debugging
		name: "InputSystem",

		// keyboard related
		keyboardSupported: true,
		keyboardEnabled: false,
		keys: {},
		keypad: {},

		// Mouse related
		mouseSupported: true,
		mouseEnabled: false,
		mouseLeftDown: false,
		mouseRightDown: false,
		mousePos: {x:0, y:0},

		// Touch pad related
		touchSupported: false,		// if the window has touch events, then we can support touch
		touchEnabled: false,
		joypadEnabled: false,


		//=========================================================================
		init: function() {
			this.touchSupported = !!('ontouchstart' in window);

			this.gamepadInit();
		},

	//=========================================================================
	// Keyboard Input
	//=========================================================================
		//=========================================================================
		// Map a keyboard character code to an event name, which will
		// get triggered whenever that key is pressed/unpressed
		bindKey: function(key,name) {
			this.keys[ KEY_NAMES[key] || key] = name;
		},

		//=========================================================================
		// Unmap a keyboard character code to an event name
		//
		unbindKey: function(key) {
			this.keys[ KEY_NAMES[key] || key] = undefined;
		},

		//=========================================================================
		// Use the given key bindings, or use the defaults, and enable keybaord control
		//
		setKeyboardControls: function(keys) {
			keys = keys || DEFAULT_KEYS;
			_(keys).each(function(name,key) {
				this.bindKey(key,name);
			},this);
			this.enableKeyboard();
		},

		//=========================================================================
		// Turn off keyboard support
		// Register callbacks to DOM keyboard events
		//
		disableKeyboard: function() {
			// If keyboard is already disabled then return
			if(this.keyboardEnabled === false) {
				return;
			}

			// Disable DOM keyboard event callbacks
			engine.el.keydown(undefined);
			engine.el.keyup(undefined);

			// @todo - clean up code by using jquery
			//$("#thingy").off( "keydown" );
			//$("#thingy").off( "keyup" );

			// Clear current keyboard values
			this.keys = { };
			this.keyboardEnabled = false;
		},

		//=========================================================================
		// Turn on keyboard support
		// Register callbacks to DOM keyboard events
		//
		enableKeyboard: function() {
			// This device doesn't support keyboard events
			// so don't enable our keyboard system
			if( !this.keyboardSupported ) {
				return false;
			}

			// If keyboard control is already enabled then return
			if(this.keyboardEnabled) {
				return false;
			}
			// Make selectable and remove an :focus outline
			this.engine.el.attr('tabindex',0).css('outline',0);

			var input = this;
			var engine = this.engine;

			// Register for DOM keyboard callbacks
			engine.el.keydown(function(e) {
				// If the user registered for a key that is pressed then
				// send a "keydown" event, passing along the keycode
				//console.log("keycode: " + e.keyCode)

                if(input.keys[e.keyCode]) {
					var actionName = input.keys[e.keyCode];
                    //console.log("actionName: " + actionName)
                    engine.inputs[actionName] = true;
					input.triggerEvent(actionName);
					input.triggerEvent('keydown',e.keyCode);
				}
				e.preventDefault();
			});

			engine.el.keyup(function(e) {
				// If the user registered for a key that is released then
				// send a "keyup" event, pasing along the keycode
				if(input.keys[e.keyCode]) {
					var actionName = input.keys[e.keyCode];
					engine.inputs[actionName] = false;
					input.triggerEvent(actionName + "Up");
					input.triggerEvent('keyup',e.keyCode);
				}
				e.preventDefault();
			});

			// Mark the system as currently support keyboard input
			this.keyboardEnabled = true;
		},

	//=========================================================================
	// Mouse Input
	//=========================================================================
		disableMouse: function() {
			var input = this;
			var engine = this.engine;

			$(engine.wrapper).off("mousemove");
			$(engine.wrapper).off("mousedown");
			$(engine.wrapper).off("mouseup");
		},
		
		getNormalizedMousePosition: function() {
			return {
				x: this.mousePos.x / this.engine.width,
				y: this.mousePos.y / this.engine.height
			};
		},

		enableMouse: function() {
			// This device doesn't support mouse events
			// so don't enable our mouse system
			if( !this.mouseSupported ) {
				return false;
			}

			var input = this;
			var engine = this.engine;
			var container = $(engine.wrapper);

			// disable the default browser's context menu.
            container.bind('contextmenu', function (e) {
                return false;
            });

            // event coordinates need to be adjusted based on the
            // canvas's position in the html page
			function _convertMouseCoordinates(event) {
				var gamePos = container.offset();

				var mousePos = {
					x: event.pageX - gamePos.left,
					y: event.pageY - gamePos.top
				};

				if(mousePos.x <= 0) {
					mousePos.x = 0;
				} else if(mousePos.x >= engine.width) {
					mousePos.x = engine.width - 1;
				}

				if(mousePos.y <= 0) {
					mousePos.y = 0;
				} else if(mousePos.y >= engine.height) {
					mousePos.y = engine.height - 1;
				}
				return mousePos;
			}

			// anytime the mouse moves over the canvas, update
			// our mouse coordinates and send a 'mousemove' event
			container.on("mousemove", function(e) {
				input.mousePos = _convertMouseCoordinates(e);
				input.triggerEvent('mousemove',input.mousePos);
               // console.log("mousemove: " + input.mousePos.x + ", " + input.mousePos.y);
			});

			// support for left, middle, and right click mouse events
			container.on('mousedown', function(e) {
				input.mousePos = _convertMouseCoordinates(e);
				input.triggerEvent('mousedown', input.mousePos);

				if( e.button == MOUSE_LEFT ) {
					input.triggerEvent('mouseleftdown', input.mousePos);
					input.mouseLeftDown = true;
                    //console.log("mouseleftdown: " + input.mousePos.x + ", " + input.mousePos.y);
				} else if( e.button == MOUSE_MIDDLE ) {
					input.triggerEvent('mousemiddledown', input.mousePos);
					input.mouseMiddleDown = true;
                   // console.log("mousemiddle: " + input.mousePos.x + ", " + input.mousePos.y);
				} else if( e.button == MOUSE_RIGHT ) {
					input.triggerEvent('mouserightdown', input.mousePos);
					input.mouseRightDown = true;
                   // console.log("mouserightdown: " + input.mousePos.x + ", " + input.mousePos.y);
				}
				//e.preventDefault();	//@NOTE - this seems to get in the way of the keyboard callbacks
										// but using it helps with disabling the double-click to highlight text on the page
				return true;
			});

			// support for left, middle, and right click mouse events
			container.on('mouseup', function(e) {
				input.mousePos = _convertMouseCoordinates(e);
				input.triggerEvent('mouseup', input.mousePos);

				if( e.button == MOUSE_LEFT ) {
					input.triggerEvent('mouseleftup', input.mousePos);
					input.mouseLeftDown = false;
				} else if( e.button == MOUSE_MIDDLE ) {
					input.triggerEvent('mousemiddleup', input.mousePos);
					input.mouseMiddleDown = false;
				} else if( e.button == MOUSE_RIGHT ) {
					input.triggerEvent('mouserightup', input.mousePos);
					input.mouseRightDown = false;
				}
				//e.preventDefault();	//@NOTE - this seems to get in the way of the keyboard callbacks
				return true;
			});
		},


	//=========================================================================
	// Gamepad Input
	//=========================================================================
		gamepadSupported: false,	// must check for gamepad support, some browsers are sketchy atm
		gamepadTicking: false,
		gamepads: [],
		gamepadPrevRawGamepadTypes: [],
		gamepadPrevTimestamps: [],

		gamepadInit: function() {
			// As of writing, it seems impossible to detect Gamepad API support
			// in Firefox, hence we need to hardcode it in the third clause.
			// (The preceding two clauses are for Chrome.)
			this.gamepadSupported = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads || (navigator.userAgent.indexOf('Firefox/') != -1);
		},

		enableGamepad: function() {
			// This device doesn't support gamepads, so don't enable our mouse system
			if( !this.gamepadSupported ) {
				return false;
			}
			var input = this;
			var engine = this.engine;

			function _gamepadButtonPressed(pad, buttonId) {
				return pad.buttons[buttonId] && (pad.buttons[buttonId] > gamepad.ANALOGUE_BUTTON_THRESHOLD);
			}

			function _gamepadStickMoved(pad, axisId, negativeDirection) {
				if (typeof pad.axes[axisId] == 'undefined') {
					return false;
				} else if (negativeDirection) {
					return pad.axes[axisId] < -gamepad.AXIS_THRESHOLD;
				} else {
					return pad.axes[axisId] > gamepad.AXIS_THRESHOLD;
				}
			}

			// Since Chrome only supports polling, we initiate polling loop straight
			// away. For Firefox, we will only do it if we get a connect event.
			if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
				input.gamepads = navigator.webkitGetGamepads();
				input.gamepadStartPolling();
			} else {
				// React to the gamepad being connected. Today, this will only be executed
				// on Firefox.
				//
				_gamepadOnGamepadConnect = function(event) {
					// Add the new gamepad on the list of gamepads to look after.
					input.gamepads.push(event.gamepad);

					// Start the polling loop to monitor button changes.
					input.gamepadStartPolling();

					//@TODO - send gamepad connected event
				};

				// React to the gamepad being disconnected. Today, this will only be
				// executed on Firefox.
				//
				_gamepadOnGamepadDisconnect = function(event) {
					for (var i in input.gamepads) {
						if (input.gamepads[i].index == event.gamepad.index) {
							input.gamepads.splice(i, 1);
						break;
						}
					}
					if (input.gamepads.length === 0) {
						input.stopPolling();
					}

					//@TODO - send gamepad disconnected event
				};

				// Firefox supports the connect/disconnect event, so we attach event handlers to those.
				window.addEventListener('MozGamepadConnected', _gamepadOnGamepadConnect, false);
				window.addEventListener('MozGamepadDisconnected', _gamepadOnGamepadDisconnect, false);
			}
			return true;
		},

		//=========================================================================
		// Starts a polling loop to check for gamepad state.
		//
		gamepadStartPolling: function() {
			// Don't accidentally start a second loop, man.
			if (!this.gamepadTicking) {
				this.gamepadTicking = true;
				this.gamepadSupportTick();
			}
		},

		//=========================================================================
		// Stops a polling loop by setting a flag which will prevent the next
		// requestAnimationFrame() from being scheduled.
		//
		gamepadStopPolling: function() {
			this.gamepadTicking = false;
		},

		//=========================================================================
		// A function called with each requestAnimationFrame(). Polls the gamepad
		// status and schedules another poll.
		//
		gamepadSupportTick: function() {
			this.gamepadPollStatus();
			this.gamepadScheduleNextTick();
		},

		//=========================================================================
		// Only schedule the next frame if we haven't decided to stop via
		// stopPolling() before.
		//
		gamepadScheduleNextTick: function() {
			if (this.gamepadTicking) {
				if (window.requestAnimationFrame) {
					window.requestAnimationFrame( _.bind(this.gamepadSupportTick, this) );
				} else if (window.mozRequestAnimationFrame) {
					window.mozRequestAnimationFrame(_.bind(this.gamepadSupportTick, this));
				} else if (window.webkitRequestAnimationFrame) {
					window.webkitRequestAnimationFrame(_.bind(this.gamepadSupportTick, this));
				}
				// Note lack of setTimeout since all the browsers that support
				// Gamepad API are already supporting requestAnimationFrame().
			}
		},

		
		//=========================================================================
		// Checks for the gamepad status. Monitors the necessary data and notices
		// the differences from previous state (buttons for Chrome/Firefox,
		// new connects/disconnects for Chrome). If differences are noticed, asks
		// to update the display accordingly. Should run as close to 60 frames per
		// second as possible.
		//
// id: "PLAYSTATION(R)3 Controller (STANDARD GAMEPAD Vendor: 054c Product: 0268)"
// index: 1
// timestamp: 18395424738498
// buttons: Array[8]
//     0: 0
//     1: 0
//     2: 1
//     3: 0
//     4: 0
//     5: 0
//     6: 0.03291
//     7: 0
// axes: Array[4]
//     0: -0.01176
//     1: 0.01961
//     2: -0.00392
//     3: -0.01176
		gamepadPollStatus: function() {
			this.gamepadPollGamepads();
			for (var i in this.gamepads) {
				var gamepad = this.gamepads[i];

				// Don't do anything if the current timestamp is the same as previous
				// one, which means that the state of the gamepad hasn't changed.
				// This is only supported by Chrome right now, so the first check
				// makes sure we're not doing anything if the timestamps are empty
				// or undefined.
				if (this.gamepadPrevTimestamps[i] && (gamepad.timestamp == this.gamepadPrevTimestamps[i])) {
					continue;
				}
				this.gamepadPrevTimestamps[i] = gamepad.timestamp;
				console.log( "Different gamepad timestamps!");
				//gamepadSupport.updateDisplay(i);
			}
		},

		gamepadPollGamepads: function() {
			var rawGamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;
			if (rawGamepads) {
				this.gamepads = [];
				var gamepadsChanged = false;
				for (var i = 0; i < rawGamepads.length; i++) {
					if (typeof rawGamepads[i] != this.gamepadPrevRawGamepadTypes[i]) {
						gamepadsChanged = true;
						this.gamepadPrevRawGamepadTypes[i] = typeof rawGamepads[i];
					}
					if (rawGamepads[i]) {
						this.gamepads.push(rawGamepads[i]);
					}
				}

				if (gamepadsChanged) {
					//@TODO - send gamepad changed event
				}
			}
		}

	});


	//=========================================================================
	// Input Engine Module
	//=========================================================================
	this.input = new Engine.InputSystem();
	this.input.engine = this;

	// weird setup
	// Input module adds these member variables to the engine directly
	this.inputs = {};
	this.joypad = {};

	// //@TODO - this seems very game specific
	// Engine.prototype.controls = function(joypad) {
	// 	this.input.setKeyboardControls();

	// 	if(joypad) {
	// 		this.input.touchControls({
	// 			controls: [ [],[],[],['action','b'],['fire','a']]
	// 		});
	// 		this.input.joypadControls();
	// 	} else {
	// 		this.input.touchControls();
	// 	}

	// 	return this;
	// };
	return this;
};


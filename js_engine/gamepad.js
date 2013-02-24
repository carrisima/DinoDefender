//*****************************************************************************
// Gamepad Support for Input System
//
// Required systems:
// * Engine
//
// Required libraries:
// * Modernizr
//
// Features:
// *
// *
//
// NOTES:
// * Remember that the gamepad won't be visible in your browser at all before a
// button is pressed.
// * So far there's no rumble support, access to gyroscopes, etc..
//*****************************************************************************

var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
var gamepadSupportAvailable = Modernizr.gamepads;

var gamepad = navigator.webkitGetGamepads && navigator.webkitGetGamepads()[0];

// Gamepad Info, defines an individual gamepad device:
// id: A textual descritption of the gamepad
// index: an integer useful to tell different gamepads apart
// timestamp: the timestamp of hte last update (only in chrome currently)
// buttons: Array, each element goes from 0 (not pressed) to 1 (completely pressed)
// axes: Array, each element goes from -1.0 (left or up) to 1.0 (right or down)

// gamepad.BUTTONS = {
//   FACE_1: 0, // Face (main) buttons
//   FACE_2: 1,
//   FACE_3: 2,
//   FACE_4: 3,
//   LEFT_SHOULDER: 4, // Top shoulder buttons
//   RIGHT_SHOULDER: 5,
//   LEFT_SHOULDER_BOTTOM: 6, // Bottom shoulder buttons
//   RIGHT_SHOULDER_BOTTOM: 7,
//   SELECT: 8,
//   START: 9,
//   LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
//   RIGHT_ANALOGUE_STICK: 11,
//   PAD_TOP: 12, // Directional (discrete) pad
//   PAD_BOTTOM: 13,
//   PAD_LEFT: 14,
//   PAD_RIGHT: 15
// };

// gamepad.AXES = {
//   LEFT_ANALOGUE_HOR: 0,
//   LEFT_ANALOGUE_VERT: 1,
//   RIGHT_ANALOGUE_HOR: 2,
//   RIGHT_ANALOGUE_VERT: 3
// };



//=========================================================================
// Helper functions
//=========================================================================
gamepad.ANALOGUE_BUTTON_THRESHOLD = .5;

gamepad.buttonPressed_ = function(pad, buttonId) {
  return pad.buttons[buttonId] && 
         (pad.buttons[buttonId] > gamepad.ANALOGUE_BUTTON_THRESHOLD);
};

gamepad.AXIS_THRESHOLD = .75;

gamepad.stickMoved_ = function(pad, axisId, negativeDirection) {
  if (typeof pad.axes[axisId] == 'undefined') {
    return false;
  } else if (negativeDirection) {
    return pad.axes[axisId] < -gamepad.AXIS_THRESHOLD;
  } else {
    return pad.axes[axisId] > gamepad.AXIS_THRESHOLD;
  }
};

var Tester = {

  /**
   * Initialize support for Gamepad API.
   */
  init: function() {
    // As of writing, it seems impossible to detect Gamepad API support
    // in Firefox, hence we need to hardcode it in the third clause. 
    // (The preceding two clauses are for Chrome.)
    var gamepadSupportAvailable = !!navigator.webkitGetGamepads || 
        !!navigator.webkitGamepads ||
        (navigator.userAgent.indexOf('Firefox/') != -1);

    if (!gamepadSupportAvailable) {
      // It doesn't seem Gamepad API is available – show a message telling
      // the visitor about it.
      tester.showNotSupported();
    } else {
      // Firefox supports the connect/disconnect event, so we attach event
      // handlers to those.
      window.addEventListener('MozGamepadConnected', 
                              gamepadSupport.onGamepadConnect, false);
      window.addEventListener('MozGamepadDisconnected', 
                              gamepadSupport.onGamepadDisconnect, false);

      // Since Chrome only supports polling, we initiate polling loop straight
      // away. For Firefox, we will only do it if we get a connect event.
      if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
        gamepadSupport.startPolling(); 
      }
    }
  },

  /**
   * Starts a polling loop to check for gamepad state.
   */
  startPolling: function() {
    // Don't accidentally start a second loop, man.
    if (!gamepadSupport.ticking) {
      gamepadSupport.ticking = true;
      gamepadSupport.tick();
    }
  },

  /**
   * Stops a polling loop by setting a flag which will prevent the next
   * requestAnimationFrame() from being scheduled.
   */
  stopPolling: function() {
    gamepadSupport.ticking = false;
  },

  /**
   * A function called with each requestAnimationFrame(). Polls the gamepad
   * status and schedules another poll.
   */
  tick: function() {
    gamepadSupport.pollStatus();
    gamepadSupport.scheduleNextTick();
  },

  scheduleNextTick: function() {
    // Only schedule the next frame if we haven't decided to stop via
    // stopPolling() before.
    if (gamepadSupport.ticking) {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(gamepadSupport.tick);
      } else if (window.mozRequestAnimationFrame) {
        window.mozRequestAnimationFrame(gamepadSupport.tick);
      } else if (window.webkitRequestAnimationFrame) {
        window.webkitRequestAnimationFrame(gamepadSupport.tick);
      }
      // Note lack of setTimeout since all the browsers that support
      // Gamepad API are already supporting requestAnimationFrame().
    }
  },

  /**
   * Checks for the gamepad status. Monitors the necessary data and notices
   * the differences from previous state (buttons for Chrome/Firefox,
   * new connects/disconnects for Chrome). If differences are noticed, asks
   * to update the display accordingly. Should run as close to 60 frames per
   * second as possible.
   */
  pollStatus: function() {
    // (Code goes here.)
  },

  /**
  * React to the gamepad being connected. Today, this will only be executed 
  * on Firefox.
  */
  onGamepadConnect: function(event) {
    // Add the new gamepad on the list of gamepads to look after.
    gamepadSupport.gamepads.push(event.gamepad);

    // Start the polling loop to monitor button changes.
    gamepadSupport.startPolling();

    // Ask the tester to update the screen to show more gamepads.
    tester.updateGamepads(gamepadSupport.gamepads);
  },
}
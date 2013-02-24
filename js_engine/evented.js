//*****************************************************************************
// Evented Class
//
// Used to make an object support getting notified of events.
// Events are just strings, can be triggered on any object that derives from
// this class.
// Triggering an event on an object will dispatch any callbacks registered
// for that event. If there is a target bound to it, then that object will
// have its callback dispatched.
//
// Required systems:
//  Engine
//  Class
//
// Required libraries:
//	None
//
//*****************************************************************************

// Requires Engine namespace
(function() {
	if( Engine === undefined ) {
		console.error( "No Engine Definition" );
	}
})();

// Base Evented class
Engine.Evented = Class.extend({

	// Class name, for debugging
	name: "Evented",

	//=========================================================================
	// Bind a listener to a specific event and trigger the callback on the target.
	// Target is an optional argument that provides a context for the callback and
	// allows the callback to be removed with a call to debind (to prevent stale
	// events from hanging around).
	bindEvent: function(event,target,callback) {
		// Handle the case where there is no target provided
		if(!callback) {
			callback = target;
			target = null;
		}
		// Handle case for callback that is a string
		if(_.isString(callback)) {
			callback = target[callback];
		}

		// Add a listener to the object, keyed by the name of the vent
		this.listeners = this.listeners || {};
		this.listeners[event] = this.listeners[event] || [];
		this.listeners[event].push([ target || this, callback]);

		// Store the event info on the target, so we can unbind it later
		if(target) {
			if(!target.binds) { target.binds = []; }
			target.binds.push([this,event,callback]);
		}
	},

	//=========================================================================
	// Checks to see if there are any listeners listening to the specified event
	// If so, each of the listeners is looped over and the callback is called
	// with the provided context.
	triggerEvent: function(event,data) {
		if(this.listeners && this.listeners[event]) {
			for(var i=0,len = this.listeners[event].length;i<len;i++) {
				var listener = this.listeners[event][i];

				// listener is an array that contains the callback at [0] and then
				// the context (target) at [1]
				listener[1].call(listener[0],data);
			}
		}
	},
	
	//=========================================================================
	// Allow for all callbacks to be unbounded for a specific event
	unbindAllEvents: function(event) {
		if(this.listeners[event]) {
			delete this.listeners[event];
		}
	},

	//=========================================================================
	// Allow for events to be unbinded when an object is destroyed or no longer
	// needs to be triggered on specific events. Callback is optional, if not
	// inclued the unbind all events for the given context (target).
	unbindEvent: function(event,target,callback) {
		var l = this.listeners && this.listeners[event];
		if(l) {
			// Handle case for callback that is a string
			if(_.isString(callback)) {
				callback = target[callback];
			}

			// loop over the array to find any listeners for the given context
			// do it backwards because removing an entry changes the length
			for(var i = l.length-1;i>=0;i--) {
				if(l[i][0] == target) {
					if(!callback || callback == l[i][1]) {
						this.listeners[event].splice(i,1);
					}
				}
			}
		}
	},
	
	//=========================================================================
	// If the object has any event info stored on it
	// then we want to remove all of them.
	debindEvents: function() {
		if(this.binds) {
			for(var i=0,len=this.binds.length;i<len;i++) {
				var boundEventInfo = this.binds[i],
					source = boundEventInfo[0],
					event = boundEventInfo[1];
				source.unbindEvent(event,this);
			}
		}
	}
});
//*****************************************************************************
// Class - Simple JavaScript Inheritance
// by John Resig http://ejohn.org/
// Inspired by base2 and Prototype
// MIT Licensed.
//
// Required Libraries:
// - Underscore
//
// Tom notes:
// - We are making a function within a loop, ewwww
// - I don't understand the use of expression with fnTest
// - If a child class tries to call _super() and there was no inhereted function, then we get a hard error. fyi.
//
// Tom updates:
// - Along with overwriting existing functions, child classes can now extend existing objects (such as defaults in
// our sprite class).
// - The updated code regarding the dynamically generated constructor function helps with debugging,
// since the function will now have a name that is representative of the derived class type. However, the __proto__
// will show up in the debugger with the parent's name even though it more closely represents the child class, since
// we copy child class members onto an instance of the parent's class each time we create a new child... ah whatever.
//*****************************************************************************

(function(){
	var initializing = false,
		fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

	// The base Class implementation (does nothing)
	this.Class = function BaseClass(){};
	
	// Create a new Class that inherits from this class
	Class.extend = function(prop) {

		// _super variable stores the parent class methods
		var _super = this.prototype;
		
		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			if( typeof prop[name] == "function" &&
				typeof _super[name] == "function" && fnTest.test(prop[name]) ) {

				prototype[name] = (function(name, fn){
					return function() {
						var tmp = this._super;

						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];
						
						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						
						return ret;
					};
				})(name, prop[name]);
			}
			// Check if we're overwriting an existing object
			else if( typeof prop[name] == "object" && typeof _super[name] == "object" ) {
				prototype[name] = _(_super[name]).clone();
				_(prototype[name]).extend( prop[name] );
			}
			else {
				prototype[name] = prop[name];
			}
		}

		// This is solely to help with debugging:
		// If the user supplied a name for the class we use that name for the constructor function
		// Generate a dynamic function name that indicates what this is a derived class from
		prop.name = prop.name || "ChildOf" + this.name;

		// When the constructor function is called, the context ("this") should be the parent class
		// Using JS's Function (akin to eval()) the context is lost, unless we use .apply to
		// propagate the context correctly.
		function customAction() {
			// All construction is actually done in the init method
			if ( !initializing && this.init )
				this.init.apply(this, arguments);
		}
		var func = new Function("action", "return function " + prop.name + "(){ action.apply(this, arguments) };")(customAction);

		// Populate our constructed prototype object
		func.prototype = prototype;
		func.prototype.constructor = func;

		// And make this class extendable
		func.extend = arguments.callee;
		
		return func;

		// Here is the more efficient way, however every object shows up in the Chrome Debugger as "Class"
		// (whatever this function is named, that's how the object shows up)
		//function Class() {
		//	// All construction is actually done in the init method
		//	if ( !initializing && this.init )
		//		this.init.apply(this, arguments);
		//}

		// // Populate our constructed prototype object
		// Class.prototype = prototype;
		// Class.prototype.constructor = Class;

		// // And make this class extendable
		// Class.extend = arguments.callee;
		
		// return Class;
	};
})();

// if(!(typeof exports === 'undefined')) {
//     exports.Class = Class;
// }

//*****************************************************************************
// Component Class
//
// Handles being added and removed to an entity.
// This class extends the Evented class, so that it can be bind and be bounded to.
//
// The extend attribute can store any properties to be added to the entity directly.
//
// Required Systems:
// * Engine
// * Engine.Evented
//
// Required libraries:
// * Underscore
//
//*****************************************************************************

// Requires Engine namespace
(function() {
	if( Engine === undefined ) {
		console.error( "No Engine Definition" );
	}
})();


// Base Component class, added to the Engine namespace
Engine.Component = Engine.Evented.extend({

	name: "Component",
	
	//=========================================================================
	// Constructor function
	init: function(entity, properties) {
		// set a property so that the component can refer back to the entity
		this.entity = entity;

		// extend the entity with new properties from the component
		if(this.extend) {
			_.extend(entity, this.extend);
		}

		// if there's any post-initialization requirements (like binding listeners)
		// then we do that in the .added() function
		if(this.added) {
			this.added(properties);
		}
	},

	//=========================================================================
	// Destructor function
	destroy: function() {
		// remove properties that match the keys of the extend object in the entity
		if(this.extend) {
			var extensions = _.keys(this.extend);
			for(var i=0,len=extensions.length;i<len;i++) {
				delete this.entity[extensions[i]];
			}
		}

		// destroy the property from the entity
		delete this.entity[this.name];

		// remove the component from the entity's list of active components
		var idx = this.entity.activeComponents.indexOf(this.name);
		if(idx != -1) {
			this.entity.activeComponents.splice(idx,1);
		}

		// remove any event handlers this component has bound
		this.debindEvents();

		// if there's any post-destruction requirements
		// then do that in the .destroyed() function
		if(this.destroyed) {
			this.destroyed();
		}
	}
});

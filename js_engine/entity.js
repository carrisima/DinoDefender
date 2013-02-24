//*****************************************************************************
// Entity class (Game Objects)
//
// Manages having components.
//
// This class extends the Evented class, so that it can be bind and be bounded to.
//
// Required Systems:
//  Engine
//  Evented
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


// Base Entity class, added to the Engine namespace
Engine.Entity = Engine.Evented.extend({

	// class Name, for Debugging
	name: "Entity",
	
	//=========================================================================
	// Transforms a position in this objects local space into world space
	// Simple 2D transformation
	transformLocalPosition: function(x, y) {
		var cs = Math.cos(this.properties.angle),
			sn = Math.sin(this.properties.angle);

		var posX = x * cs - y * sn;
		var posY = x * sn + y * cs;

		var worldX = this.properties.x + posX;
		var worldY = this.properties.y + posY;

		return { x: worldX, y: worldY };
	},

	//=========================================================================
	// Transforms a direction vector in this objects local space into world space
	// Simple 2D transformation
	transformLocalDirection: function(x, y) {
		var cs = Math.cos(this.properties.angle),
			sn = Math.sin(this.properties.angle);
		var dirX = x * cs - y * sn;
		var dirY = x * sn + y * cs;
		return { x: dirX, y: dirY };
	},

	//=========================================================================
	// Checks if this entity has a component type
	hasComponent: function(componentName) {
		return this[componentName] ? true : false;
	},

	//=========================================================================
	// Add any number of components by name to this entity
	// Does not support arguments/properties to be passed to components
	addComponentList: function(componentNameList) {
		componentNameList = Engine._normalizeArg(componentNameList);
		if(!this.activeComponents) { this.activeComponents = []; }

		// loops over all the components to be added, looks them up in the
		// engine's component list, and creates the new component object
		for(var i=0,len=componentNameList.length;i<len;i++) {
			var name = componentNameList[i],
				compClass = Engine.GetCurrentInstance().components[name];
			if(!this.hasComponent(name) && compClass) {
				var newComp = new compClass(this);

				// add the component to the entity as a property under its name
				this[name] = newComp;

				// add the component to the entity's list of active components
				this.activeComponents.push(name);

				// trigger an event signaling a new component was added
				this.triggerEvent('addComponent', newComp);
			}
		}
		return this;
	},

	//=========================================================================
	// Add a components by name to this entity, passing along properties
	// componentName parameter is optional, but if used it allows for more
	// than one component of the same type/class.
	addComponent: function(componentType, properties, componentName) {
		if(!this.activeComponents) { this.activeComponents = []; }
		componentName = componentName || componentType;

		if( this.hasComponent(componentName) ) {
			return;
		}

		var compClass = Engine.GetCurrentInstance().components[componentType];
		if( compClass) {
			var newComp = new compClass(this, properties);

			// add the component to the entity's list of active components
			this.activeComponents.push(newComp);

			// add the component to the entity as a property under its name
			this[componentName] = newComp;

			// trigger an event signaling a new component was added
			this.triggerEvent('addComponent', newComp);
		}
		return this;
	},

	//=========================================================================
	// Remove any number of components by name
	deleteComponent: function(componentNameList) {
		componentNameList = Engine._normalizeArg(componentNameList);
		// loops over all the components to be removed, looks them
		// up to see if this entity has it, and destroys it if so
		for(var i=0,len=componentNameList.length;i<len;i++) {
			var name = componentNameList[i];
			if(name && this.hasComponent(name)) {
				// trigger an event signaling a component was destroyed
				this.triggerEvent('delComponent',this[name]);
				this[name].destroy();
			}
		}
		return this;
	},

	//=========================================================================
	// Called by the managing scene
	destroy: function() {

		// prevent duplicate destruction (if that's possible)
		if(this.destroyed) {
			return;
		}

		// Debind to remove any event handlers associated with this object
		this.debindEvents();

		// If this object has a parent and can be removed, then do it
		if(this.parentStage && this.parentStage.remove) {
			this.parentStage.remove(this);
		}

		// trigger an event on this object signaling that it has been destroyed
		this.triggerEvent('removed');

		// mark this object as destroyed
		this.destroyed = true;
	}
});
	
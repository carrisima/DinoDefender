//*****************************************************************************
// Sprites Module
//
// A general purpose version of the GameBoard class in Chapter 2
//
// Required systems:
// * Class
// * Engine
// * Engine.Entity
//
// Required libraries:
// * Underscore
//
// Features:
// * Scene Class
// * Stage Entity class
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();

//=========================================================================
// Scene Module
//=========================================================================
Engine.Scenes = function() {

	//=========================================================================
	// Scene Class
	// It's only purpose is to wrap a function that sets up a passed-in
	// stage object. Makes it easy to swap between different scenes.
	//=========================================================================
	Engine.Scene = Class.extend({

		// Class name, for debugging
		name: "Scene",

		//=========================================================================
		// Capture a callback method and an optional options hash which is used by
		// the stage - { sort: function }
		init: function(sceneFunc,opts) {
			this.opts = opts || {};
			this.sceneFunc = sceneFunc;
		}
	});

	//=========================================================================
	// Camera Component
	// - Will only work when added to a stage, because of the "predraw" and
	// "postdraw" events being triggered
	// - Updates Canvas properties before and after scene rendering, to
	// - give the impression of a moving camera.
	//=========================================================================
	var CameraComponent = {
		defaults: {
			x: 0,
			y: 0,
			angle: 0,
			scale: 1,
			following: null
		},

		added: function(props) {
			// Default properties, extended onto the parent entity (stage)
			var camProps = _(this.defaults).clone();
			if( props ) {
				_(camProps).extend( props );
			}
			_(this.entity.properties).extend( camProps );

			this.entity.bindEvent( "predraw", this, this.predraw );
			this.entity.bindEvent( "postdraw", this, this.postdraw );
		},

		//=========================================================================
		// Follows another entity
		// - The camera system will update its position based on the following entity
		//
		followEntity: function(entity) {
			this.following = entity;
			this.updateViewport();

			// If the entity is destroyed, then we want to make sure we stop following it
			this.following.bindEvent( "removed", this, this.unfollow );
		},

		//=========================================================================
		// Unfollows another entity
		//
		unfollow: function() {
			this.following.unbindEvent( "removed", this, this.unfollow );
			this.following = null;
		},

		//=========================================================================
		// If the viewport has an entity to follow, then center the camera on it
		//
		updateViewport: function() {
			if( this.following ) {
				this.centerViewportOn( this.following.properties.x, this.following.properties.y );
			}
		},

		//=========================================================================
		// Centers the viewport around a specific point
		//
		centerViewportOn: function(x,y) {
			var engine = Engine.GetCurrentInstance();
			this.entity.properties.centerX = x;
			this.entity.properties.centerY = y;
			this.entity.properties.x = this.entity.properties.centerX - engine.width / 2 / this.entity.properties.scale;
			this.entity.properties.y = this.entity.properties.centerY - engine.height / 2 / this.entity.properties.scale;
		},

		//=========================================================================
		// Updates the canvas transform so that it reflects our camera's changes
		//
		predraw: function() {
			var engine = Engine.GetCurrentInstance();
			var ctx = engine.getCanvas();
			this.updateViewport();
			ctx.save();
			ctx.translate(engine.width/2, engine.height/2);
			ctx.scale(this.entity.properties.scale, this.entity.properties.scale);
			ctx.translate(-this.entity.properties.centerX, -this.entity.properties.centerY);
		},

		//=========================================================================
		// Restores the canvas transforms for further rendering
		//
		postdraw: function() {
			var engine = Engine.GetCurrentInstance();
			var ctx = engine.getCanvas();
			ctx.restore();
		}
	};

	//=========================================================================
	// Stage Class
	// - keeps track of a list of sprites and letting the update and render
	// themselves.
	// - is an Entity, so it can have its own components and events
	// - supports the idea of z-order, so objects are sorted before rendering.
	//=========================================================================
	Engine.Stage = Engine.Entity.extend({

		// Class name, for debugging
		name: "Stage",

		defaults: {
			paused: false,
			sort: true,
			isVisible: true
		},

		//=========================================================================
		// Constructor functions, sets up the initial properties
		// Executes the scene method if a scene object is provided.
		init: function(scene) {
			this.scene = scene;
			this.engine = Engine.GetCurrentInstance();

			// We store the objects both in a sorted array for updating
			// and in a hash to key objects by their ids.
			this.items = [];
			this.index = {};

			// Removal of objects needs to be queued
			this.removeList = [];

			// Default properties
			this.properties = _(this.defaults).clone();

			// Additional/overriding properties are grabbed from the scene
			if(scene) {
				_(this.properties).extend(scene.opts);
				scene.sceneFunc(this);
			}

			// Generate a sort function if none is provided
			if(this.properties.sort && !_.isFunction(this.properties.sort)) {
				this.properties.sort = function(a,b) { return a.properties.z - b.properties.z; };
			}

			// Camera settings
			this.properties.centerX = this.engine.width/2;
			this.properties.centerY = this.engine.height/2;
		},

		//=========================================================================
		// Helper function to make it easier to perform operations on the items list
		each: function(callback) {
			for(var i=0,len=this.items.length;i<len;i++) {
				callback.call(this.items[i],arguments[1],arguments[2]);
			}
		},

		//=========================================================================
		// Helper function to make it easier to perform operations on the items list
		eachInvoke: function(funcName) {
			for(var i=0,len=this.items.length;i<len;i++) {
				this.items[i][funcName].call(
					this.items[i],arguments[1],arguments[2]
				);
			}
		},

		//=========================================================================
		// Helper function to make it easier to perform operations on the items list
		detect: function(func) {
			for(var i = 0,val=null, len=this.items.length; i < len; i++) {
				if(func.call(this.items[i],arguments[1],arguments[2])) {
					return this.items[i];
				}
			}
			return false;
		},

		//=========================================================================
		// Adds an entity to this stage
		insert: function(entity) {
			this.items.push(entity);
			entity.parentStage = this;
			if(entity.properties) {
				this.index[entity.properties.id] = entity;
			}

			// Trigger the 'inserted' event on both this stage object
			// and the passed in entity
			this.triggerEvent('inserted',entity);
			entity.triggerEvent('inserted',this);
			return entity;
		},

		//=========================================================================
		// Queues an entity to be removed from this stage
		// We have to queue this because we might be in the middle of updating the
		// object lists when we want to remove one.
		remove: function(entity) {
			this.removeList.push(entity);
		},

		//=========================================================================
		// Removes an entity from this stage immediately
		// When an object is destroyed, it will try to remove itself from the scene
		// which is why the object checks if it's already being destroyed
		forceRemove: function(entity) {
			var idx = _(this.items).indexOf(entity);
			if(idx != -1) {
				this.items.splice(idx,1);
				if(entity.destroy) {
					entity.destroy();
				}
				if(entity.properties.id) {
					delete this.index[entity.properties.id];
				}
				this.triggerEvent('removed',entity);
			}
		},

		//=========================================================================
		// When the scene is destroyed, it should remove all of the objects
		// that are part of it
		destroy: function() {
			for(var i=0,len=this.items.length;i<len;i++) {
				var entity = this.items[i];
				if(entity.destroy) {
					entity.destroy();
				}
			}
			this._super();
		},

		//=========================================================================
		// Pause this stage, so that we do not update the objects
		pause: function() {
			this.properties.paused = true;
		},

		//=========================================================================
		// Unpause this stage, to resume updating the objects
		unpause: function() {
			this.properties.paused = false;
		},

		//=========================================================================
		// Calls the .step() function for each object in this stage
		// Removes any objects that got queued for removal
		step: function(dt) {
			if(this.properties.paused) { return false; }

			this.triggerEvent("prestep",dt);
			this.eachInvoke("step",dt);
			this.triggerEvent("step",dt);

			if(this.removeList.length > 0) {
				for(var i=0,len=this.removeList.length;i<len;i++) {
					this.forceRemove(this.removeList[i]);
				}
				this.removeList.length = 0;
			}
		},

		//=========================================================================
		// Calls the .draw() function for each object in this stage
		// Sorts the array first so that we draw them in z-order
		draw: function(ctx) {
			if(this.properties.sort) {
				this.items.sort(this.properties.sort);
			}
			this.triggerEvent("predraw",ctx);

			if( this.world ) {
				this.world.debug_draw();
			}

			if( this.properties.isVisible ) {
				this.eachInvoke("draw",ctx);
				this.triggerEvent("draw",ctx);
			}

			this.triggerEvent("postdraw",ctx);
		},

		//=========================================================================
		_hitTest: function(obj,type) {
			if(obj != this) {
				var col = (!type || this.properties.type & type) && Engine.overlap(obj,this);
				return col ? this : false;
			}
		},

		//=========================================================================
		collide: function(obj,type) {
			return this.detect(this._hitTest, obj, type);
		}
	});


	//=========================================================================
	// Scene Module - Engine functionality
	//=========================================================================
	this.registerComponent( "camera", CameraComponent);
	this.scenes = {};
	this.stages = [];

	// Track the stage currently being stepped and drawn, so that sprites
	// and other parts of the engine can reference it more easily
	this.activeStage = 0;

	//=========================================================================
	// static function, testing if two objects overlap
	Engine.overlap = function(o1,o2) {
		var p1 = o1.properties;
		var p2 = o2.properties;

		// if p1's left edge is to the right of p2's right edge, fail
		if( p1.x - p1.width/2 > p2.x + p2.width/2)
			return false;
		// if p1's right edge is to the left of p2's left edge, fail
		if( p1.x + p1.width/2 < p2.x - p2.width/2 )
			return false;

		// if p1's top edge is below p2's bottom edge, fail
		if( p1.y - p1.height/2 > p2.y + p2.height/2 )
			return false;

		// if p1's bottom edge is above p2's top edge, fail
		if( p1.y + p1.height/2 < p2.y - p2.height/2 )
			return false;

		return true;
		//return !((p1.y+p1.height-1<p2.y) || (p1.y>p2.y+p2.height-1) ||
		//		(p1.x+p1.width-1<p2.x) || (p1.x>p2.x+p2.width-1));
	};

	//=========================================================================
	// Adds a new scene to the system
	Engine.prototype.addScene = function(name, sceneObj) {
		this.scenes[name] = sceneObj;
		return sceneObj;
	};

	//=========================================================================
	// Return a scene by name
	Engine.prototype.getScene = function(name) {
		return this.scenes[name];
	};

	//=========================================================================
	// Returns a specific stage by slot, or the activeStage if no slot is provided
	Engine.prototype.getStage = function(num) {
		// Use activeStage is num is undefined
		num = (num === void 0) ? this.activeStage : num;
		return this.stages[num];
	};

	//=========================================================================
	// Adds a new stage to be updated and drawn.
	// sceneName - optional, the scene to be staged
	// num - optional, the stage slot used (stage update order)
	// stageClass - optional, a child Stage class to use
	Engine.prototype.stageScene = function(sceneName, num, stageClass) {

		// Use the base stage class if none is provided
		stageClass = stageClass || Engine.Stage;

		// Get the scene to be staged
		var scene;
		if(_(sceneName).isString()) {
			scene = this.getScene(sceneName);
		}

		// Default slot
		num = num || 0;

		// If there's already a stage at this index, then destroy it
		if(this.stages[num]) {
			this.stages[num].destroy();
		}

		// Create and add the new stage
		this.stages[num] = new stageClass(scene);

		// Check if the game loop has already been started. If not, then
		// add one that updates our stages
		if(!this.loop) {
			this.setGameLoop(this.stageGameLoop);
		}
	};

	//=========================================================================
	// Clear the canvas, then update and draw each of stages one-by-one
	Engine.prototype.stageGameLoop = function(dt) {
		if( this.getCanvas() ) {
			this.clearCanvas();
		}

		for(var i=0, len=this.stages.length; i < len; i++) {
			this.activeStage = i;
			var stage = this.getStage();
			if(stage) {
				stage.step(dt);
				if( this.getCanvas() ) {
					stage.draw(this.getCanvas());
				}
			}
		}

		this.activeStage = 0;
	};

	//=========================================================================
	// Destroys the stage at a particular slot
	Engine.prototype.clearStage = function(num) {
		if(this.stages[num]) {
			this.stages[num].destroy();
			this.stages[num] = null;
		}
	};

	//=========================================================================
	// Destroys all stages
	Engine.prototype.clearStages = function() {
		for(var i=0,len=this.stages.length;i<len;i++) {
			if(this.stages[i]) { this.stages[i].destroy(); }
		}
		this.stages.length = 0;
	};


};


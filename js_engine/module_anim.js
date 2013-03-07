//*****************************************************************************
// Animation Module
//
// Required systems:
// * Class
// * Engine
//
// Required libraries:
// *
//
// Features:
// *
// *
// * Assumes looping by default
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();

//=========================================================================
// Animation Engine Module
//
//
//=========================================================================
Engine.Animation = function() {

	//console.log( "Adding animation module" );

	//=========================================================================
	// AnimationComponent
	// -
	// -
	//=========================================================================
	var AnimationComponent = {

		name: "AnimationComponent",

		defaultProperties: {
			animationName: null,	// animation name, lookup value into animation data
			animationPriority: -1,	// priority lets us have overriding animations
			animationFrame: 0,		// sequential, [0, animation.frames.length]
			animationTime: 0,		// controls animation playback
			animationChanged: false	// new animation is being played
		},

		//=========================================================================
		// Proxy functions, exposed through the entity
		//
		extend: {
			play: function(name,priority) {
				this.animation.play(name,priority);
			}
		},

		//=========================================================================
		// Sets up default animation parameters, and registers to be updated
		//
		added: function() {
			// extend entity properties with component properties
			_.extend(this.entity.properties, this.defaultProperties );

			// bind to our update event
			this.entity.bindEvent("step",this,"step");
		},

		//=========================================================================
		// Updates the entity's frame property based on the current animation
		//
		step: function(dt) {
			var entity = this.entity,
				p = entity.properties;
			if(!p.animationName) {
				return;
			}

			var animData = Engine.GetCurrentInstance().getAnimationData(p.animSetName, p.animationName);

			if( !animData ) {
				engineAssert( animData, "Cannot find animation: " + p.animationName + " under animSetName name: " + p.animSetName );
				this.entity.unbindEvent("step", this, "step" );
				return;
			}

			var rate = animData.rate || p.rate,
				stepped = 0;

			if(p.animationChanged) {
				p.animationChanged = false;
			} else {
				// Increment animation timer, changing to the next frame
				p.animationTime += dt;
				if(p.animationTime > rate) {
					stepped = Math.floor(p.animationTime / rate);
					p.animationTime -= stepped * rate;
					p.animationFrame += stepped;
				}
			}

			if(stepped > 0) {
				// Did we reach the end of our animation?
				if(p.animationFrame >= animData.frames.length) {

					// If we are not looping or transitioning into another animation
					if(animData.loop === false || animData.next) {
						// stop on the last frame
						p.animationFrame = animData.frames.length - 1;

						// Trigger a generic and named "animEnd" event
						entity.triggerEvent('animEnd');
						entity.triggerEvent('animEnd.' + p.animationName);

						// Disconnect animation data
						p.animationName = null;
						p.animationPriority = -1;

						// If there's a named event to be triggered assigned to this animation, then trigger it
						if(animData.trigger) {
							entity.triggerEvent(animData.trigger,animData.triggerData);
						}

						// Play the next animation
						if(animData.next) {
							this.play(animData.next,animData.nextPriority);
						}
						return;
					} else {
						// Trigger generic "animLoop" event, as well as specific one
						entity.triggerEvent('animLoop');
						entity.triggerEvent('animLoop.' + p.animationName);

						// Loop animation
						p.animationFrame = p.animationFrame % animData.frames.length;
					}
				}

				// send generic "animFrame" event
				entity.triggerEvent("animFrame");
			}

			// Update sprite sheet properties based on the animation's properties
			p.sheetName = animData.sheetName || p.sheetName;
			p.frame = animData.frames[p.animationFrame];
		},

		//=========================================================================
		//
		play: function(animName, priority) {
			var entity = this.entity,
				p = entity.properties;
			priority = priority || 0;

			// Start playing a new animation if we are not already playing this
			// animation and it isn't a lower priority of our current animation
			if(animName != p.animationName && priority >= p.animationPriority) {

				// Reset animation properties
				p.animationName = animName;
				p.animationChanged = true;
				p.animationTime = 0;
				p.animationFrame = 0;
				p.animationPriority = priority;

				// Send a generic and named "anim" event
				entity.triggerEvent('anim');
				entity.triggerEvent('anim.' + p.animationName);
			}
		}
	};

	//=========================================================================
	// Animation Engine Module
	//=========================================================================
	this.registerComponent('animation', AnimationComponent );

	// hash storage for animation data
	// keyed by "spriteName", stores a table of animation data for that sprite
	this._animations = {};

	//=========================================================================
	// Add a whole bunch of animations for a particular sprite name
	//
	Engine.prototype.addAnimationData = function(spriteName,animations) {
		//console.log( "Adding animation data for sprite:", spriteName );
		if(!this._animations[spriteName]) {
			this._animations[spriteName] = {};
		}
		_.extend(this._animations[spriteName], animations);
	};

	//=========================================================================
	// Gets the named animation data for a given sprite name
	//
	Engine.prototype.getAnimationData = function(spriteName,animName) {
		return this._animations[spriteName] && this._animations[spriteName][animName];
	};

};
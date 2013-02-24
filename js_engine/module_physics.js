//*****************************************************************************
// Box2D Physics Module
//
// A physics engine
//
// Required Systems:
// * Engine
// * Engine.Component
//
// Required libraries:
// * Box2D
// * Underscore
//
// Features:
// * PhysicsWorldComponent
// * PhysicsActorComponent
// * Physics Engine Module
//
// @TODO:
//  - move options to an init function()
//	- an optimization might be to reuse the fixtureDef
//  - toggling on/off the debug draw system
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();

//=========================================================================
// Physics Engine Module
//=========================================================================
Engine.Physics = function() {

	//*****************************************************************************
	// Static objects/functions
	//*****************************************************************************

	// Shorthand for accessing Box2D Namespace
	var B2d = Engine.B2d = {
		World: Box2D.Dynamics.b2World,
		DebugDraw: Box2D.Dynamics.b2DebugDraw,
		Vec: Box2D.Common.Math.b2Vec2,
		AABB: Box2D.Collision.b2AABB,
		BodyDef: Box2D.Dynamics.b2BodyDef,
		Body: Box2D.Dynamics.b2Body,
		FixtureDef: Box2D.Dynamics.b2FixtureDef,
		Fixture: Box2D.Dynamics.b2Fixture,
		PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
		CircleShape: Box2D.Collision.Shapes.b2CircleShape,
		Listener:  Box2D.Dynamics.b2ContactListener,

		MouseJointDef: Box2D.Dynamics.Joints.b2MouseJointDef
	};

	// Default properties for a Box2D World
	Engine.PhysicsWorldDefaults = {
		gravityX: 0,
		gravityY: 9.8,
		scale: 1,
		velocityIterations: 8,
		positionIterations: 3,
		doSleep: true

	};

	Engine.PhysicsEntityDefaults = {
		// For Bodies:
		allowSleep: true,
		linearDamping: 0.0,
		angularDamping: 0.0,
		bullet: false,
		fixedRotation: false,
		//mass: 0,

		// For fixtures:
		shape: 'block',
		density: 1.0,
		friction: 1.0,
		restitution: 0.1,
		isSensor: false
		//shape_radius:
		//shape_width:
		//shape_height:
	};

	//=========================================================================
	// PhysicsWorldComponent
	// - Manages the Box2D world object
	// - Listens for contact events, and dispatches them to the entities
	// - Serves a factory for RigidBodies
	//=========================================================================
	var PhysicsWorldComponent = {

		//=========================================================================
		// Added - gets called once the component has been added to an entity
		// (such as a Stage class)
		// Creates the Box2D world
		//
		added: function(props) {
			this.b2dOptions = _(Engine.PhysicsWorldDefaults).clone();
			if( props ) {
				_(this.b2dOptions).extend( props );
			}
			this.scale = this.b2dOptions.scale;

			// Create a gravity vector
			this._gravity = new B2d.Vec(this.b2dOptions.gravityX, this.b2dOptions.gravityY);

			// Create the Box2D world object
			this._world = new B2d.World(this._gravity, this.b2dOptions.doSleep);

			// We'll be registering these functions as callbacks.
			// Underscore lets us bind methonds onto this by name, so they can be run in the context
			// of this regardless of whenever they are invoked (ie, make sure this pointer is correct)
			_.bindAll(this,"beginContact","endContact","postSolve");

			// Create a Box2d contact listener and pass it to the Box2D world.
			// This way we can forward any collisions to our sprites for gameplay specific handling
			this._listener = new B2d.Listener();
			this._listener.BeginContact = this.beginContact;	// Actors start touching
			this._listener.EndContact = this.endContact;		// Actors stop touching
			this._listener.PostSolve = this.postSolve;			// Aytime an actor causes an impulse on another actor

			this._world.SetContactListener(this._listener);
			
			// A reusable contact data structure, to keep memory usage down
			// Since events are triggered immediately, gameplay only needs
			// access to the current collision
			this.contactData = {};

			// Whenever the entity updates, we will want this component to update
			this.entity.bindEvent('step',this,'boxStep');
		},


		//=========================================================================
		// setCollisionData -
		// Populates our reusable collision data object, which gets passed
		// to physics actors' event handlers whenever a collision occurs
		//
		setCollisionData: function(contact,impulse) {
			var entityA = contact.GetFixtureA().GetBody().GetUserData();
			var entityB = contact.GetFixtureB().GetBody().GetUserData();
			 
			this.contactData["entityA"] = entityA;
			this.contactData["entityB"] = entityB;
			this.contactData["impulse"] = impulse;
			this.contactData["sprite"] = null;
		},

		beginContact: function(contact) {
			this.setCollisionData(contact,null);

			this.contactData.entityA.triggerEvent("contact",this.contactData.entityB);
			this.contactData.entityB.triggerEvent("contact",this.contactData.entityA);
			this.entity.triggerEvent("contact",this.contactData);
		},

		endContact: function(contact) {
			this.setCollisionData(contact,null);

			this.contactData.entityA.triggerEvent("endContact",this.contactData.entityB);
			this.contactData.entityB.triggerEvent("endContact",this.contactData.entityA);
			this.entity.triggerEvent("endContact",this.contactData);
		},

		postSolve: function(contact, impulse) {
			this.setCollisionData(contact,impulse);

			this.contactData["sprite"] = this.contactData.entityB;
			this.contactData.entityA.triggerEvent("impulse",this.contactData);

			this.contactData["sprite"] = this.contactData.entityA;
			this.contactData.entityB.triggerEvent("impulse",this.contactData);

			this.entity.triggerEvent("impulse",this.contactData);
		},

		//=========================================================================
		// createBody -
		// Create a new RigidBody based on the configuration properties
		//
		createBody: function(def) {
			return this._world.CreateBody(def);
		},

		//=========================================================================
		// destroyBody -
		// Deletes the body from the physics world simulation, taking a B2d.BodyDef
		// http://www.box2dflash.org/docs/2.1a/reference/
		//
		destroyBody: function(body) {
			return this._world.DestroyBody(body);
		},

		//=========================================================================
		// boxStep -
		// Responsible for stepping the world at the correct rate using
		// the elapsed time since the previous update
		//
		boxStep: function(dt) {
			// prevent giant time steps
			if(dt > 1/20) { dt = 1/20; }
			this._world.Step(dt, this.b2dOptions.velocityIterations, this.b2dOptions.positionIterations);
			//this._world.ClearForces();
		},

		//=========================================================================
		// getEntityAtPosition -
		// Picking function, returns an entity based on whether the coordinates
		// are over a physics body or not
		//
		getEntityAtPosition: function(coordX, coordY) {
			var mousePVec = new B2d.Vec(coordX / this.scale, coordY / this.scale);
			var aabb = new B2d.AABB();
			aabb.lowerBound.Set(mousePVec.x - 0.001, mousePVec.y - 0.001);
			aabb.upperBound.Set(mousePVec.x + 0.001, mousePVec.y + 0.001);

			var selectedBody = null;
			function _getDynamicBodyCB(fixture) {
				// Skip testing static bodies, just continue to the next one
				if(fixture.GetBody().GetType() != B2d.Body.b2_staticBody) {
					// Once we find the first fixture the coordinates are over, then stop searching
					if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
						selectedBody = fixture.GetBody();
						return false;
					}
				}
				return true;
			}

			// Query the world for overlapping shapes.
			this._world.QueryAABB(_getDynamicBodyCB, aabb);
			if( selectedBody ) {
				return selectedBody.GetUserData();
			}
			return null;
		},

		//=========================================================================
		// createMouseJoint -
		// First draft constraint factory function, specifically for mouse joint
		// Other joint types to come as API develops
		//
		createMouseJoint: function(body, coordX, coordY) {
			var newJointDef = new B2d.MouseJointDef();
			newJointDef.bodyA = this._world.GetGroundBody();
			newJointDef.bodyB = body;
			newJointDef.target.Set(coordX / this.scale, coordY / this.scale);
			newJointDef.collideConnected = true;
			newJointDef.maxForce = 300.0 * body.GetMass();
			var newJoint = this._world.CreateJoint(newJointDef);
			body.SetAwake(true);
			return newJoint;
		},

		//=========================================================================
		// destroyJoint -
		// Removes a constraint from the system. Takes any type.
		//
		destroyJoint: function(joint) {
			this._world.DestroyJoint(joint);
		},

		//=========================================================================
		// debug_draw -
		// Render function for physics
		//
		debug_draw: function() {
			if( this._debugDraw ) {
				this._world.DrawDebugData();
			}
            else
            {

            }
		},

		//=========================================================================
		// toggleDebugDraw -
		// @TODO - add support for turning it on/off
		//
		toggleDebugDraw: function( flag ) {
			if( flag === false && this._debugDraw ) {
				// @TODO, remove _debugDraw
				// @TODO, use a secondary canvas
			} else if( flag === true && this._debugDraw === undefined ) {
				console.log( "Enabling Physics Debug Draw" );

				this._debugDraw = new B2d.DebugDraw();
				this._debugDraw.SetSprite( Engine.GetCurrentInstance().getCanvas() );
				this._debugDraw.SetDrawScale(this.scale);
				this._debugDraw.SetFillAlpha(0.5);
				this._debugDraw.SetLineThickness(1);
				this._debugDraw.SetAlpha(0.8);
				this._debugDraw.SetFlags( B2d.DebugDraw.e_shapeBit | B2d.DebugDraw.e_jointBit );
				this._world.SetDebugDraw( this._debugDraw );
			}

		}
	};

	//=========================================================================
	// PhysicsActorComponent
	//
	// Constructor Properties (all optional):
	// Physics Body properties:
	//  bodyType - The body type: "static", "kinematic", or "dynamic".
	//  allowSleep - Set this flag to false if this body should never fall asleep.
	//  angularDamping - Angular damping is use to reduce the angular velocity.
	//  bullet - Is this a fast moving body that should be prevented from tunneling through other moving bodies?
	//  fixedRotation - Should this body be prevented from rotating? Useful for characters.
	//  linearDamping - Linear damping is use to reduce the linear velocity.
	//  angle - initial rotation
	//  mass - overrides density property of fixture
	//
	// Physics Shape properties:
	//  friction - The friction coefficient, usually in the range [0,1].
	//  density - The density, usually in kg/m^2.
	//  restitution - bounciness, how much velocity is conserved after a collision
	//  isSensor - A sensor shape collects contact information but never generates a collision response.
	//  shape - "circle", "block", "polygon"
	//  shape_radius - only used if shape is "circle", pulls from max(.width,.height) if none is set
	//	shape_width - only used if shape is "block", pulls from .width if none is set
	//  shape_height - only used if shape is "block", pulls from .height if none is set
	//  shape_points - only used if shape is polygon. array of points
	//
	// Public Functions:
	//  setPosition
	//  getVelocity / setVelocity
	//  getAngle / setAngle
	//  applyForce
	//  applyImpulse
	//
	// shared properties:
	//  - angle (with Sprite)
	//=========================================================================
	var PhysicsActorComponent = (function(){

		var vZero = new B2d.Vec(0, 0);

		return {
			//=========================================================================
			// Added - gets called once the component has been added to an entity
			// Checks if the entity has already been added to a stage. If so then
			// create the body, otherwise wait for the sprite to be added first.
			//
			added: function() {
				if(this.entity.parentStage) {
					this.inserted();
				} else {
					this.entity.bindEvent('inserted',this,'inserted');
				}
				this.entity.bindEvent('step',this,'step');
				this.entity.bindEvent('removed',this,'removed');
			},

			//=========================================================================
			// Set the body's position, making sure it is awake
			//
			setPosition: function(x,y) {
				var stage = this.entity.parentStage;
				this._body.SetAwake(true);
				this._body.SetPosition(new B2d.Vec(x / stage.world.scale, y / stage.world.scale));
			},

			//=========================================================================
			// Set the body's rotation
			//
			setAngle: function(angle) {
				this._body.SetAngle(angle);
			},

            makeDynamic: function(){

                this._body.SetType(B2d.Body.b2_dynamicBody);

            },

			//=========================================================================
			// Get the body's rotation
			//
			getAngle: function() {
				return this._body.GetAngle();
			},

			//=========================================================================
			// Set the body's velocity, making sure it is awake
			//
			setVelocity: function(x,y) {
				var stage = this.entity.parentStage;
				this._body.SetAwake(true);
				this._body.SetLinearVelocity(new B2d.Vec(x / stage.world.scale, y / stage.world.scale));
			},

			//=========================================================================
			// Gets the body's velocity
			//
			getVelocity: function() {
				return this._body.GetLinearVelocity();
			},

			//=========================================================================
			// Apply's a central force to the body
			//
			applyForce: function(x, y) {
				var vForce = new B2d.Vec(x, y);
				this._body.ApplyForce( vForce, vZero );
			},

			//=========================================================================
			// Apply's a central instantaneous change in velocity to the body
			//
			applyImpulse: function(x, y) {
				var vForce = new B2d.Vec(x, y);
				this._body.ApplyImpulse( vForce, vZero );
			},

			//=========================================================================
			// inserted - called after the parent entity has been added to a stage
			// Creates the Box2D rigid body that will be added to the world
			// Grabs properties from the parent entity, or otherwise uses the Engine defaults.
			//
			inserted: function() {

				var entity = this.entity,
					stage = entity.parentStage;

				engineAssert( stage.world, "Cannot insert entity with PhysicsActorComponent to scene without it having a PhysicsWorldComponent!" );
				var scale = stage.world.scale,
					props = entity.properties,
					defaultOps = Engine.PhysicsEntityDefaults;

				// Default properties
				var properties = _(defaultOps).clone();
				if( props ) {
					_(properties).extend( props );
				}

				// If we have no mass and no density, then assume this is a static object
				if( (properties.density === undefined || properties.density === 0) &&
					(properties.mass === undefined || properties.mass === 0) ) {
					properties.bodyType = "static";
				}

				// Create a Body Definition, which Box2D needs to create a rigid body object
				var bodyDef = new B2d.BodyDef();
				if( properties.bodyType == "static" ) {
					bodyDef.type = B2d.Body.b2_staticBody;
				} else if( properties.bodyType == "kinematic" ) {
					bodyDef.type = B2d.Body.b2_kinematicBody;
				} else {
					bodyDef.type = B2d.Body.b2_dynamicBody;
				}
				bodyDef.position.Set(properties.x/scale, properties.y/scale);
				bodyDef.active = true;
				bodyDef.allowSleep = properties.allowSleep;
				bodyDef.angularDamping = properties.angularDamping;
				bodyDef.bullet = properties.bullet;
				bodyDef.fixedRotation = properties.fixedRotation;
				bodyDef.linearDamping = properties.linearDamping;

				// Create a body from the definition
				this._body = stage.world.createBody(bodyDef);
				this._body.SetUserData(entity);

				// Create a Fixture definition, which Box2D needs to give a body collision
				var fixtureDef = new B2d.FixtureDef();
				fixtureDef.density = properties.density;
				fixtureDef.friction = properties.friction;
				fixtureDef.restitution = properties.restitution;
				fixtureDef.isSensor = properties.isSensor;
				
				switch(properties.shape) {
					case "block":
						fixtureDef.shape = new B2d.PolygonShape();
						properties.shape_width = properties.shape_width || properties.width;
						properties.shape_height = properties.shape_height || properties.height;
						engineAssert( properties.shape_width, "PhysicsActorComponent: 'block' .shape type requires shape_width property" );
						engineAssert( properties.shape_height, "PhysicsActorComponent: 'block' .shape type requires shape_height property" );
						fixtureDef.shape.SetAsBox( properties.shape_width/2 / scale, properties.shape_height/2 / scale);
						break;
					case "circle":
						properties.shape_radius = properties.shape_radius || Math.max( properties.width, properties.height );
						engineAssert( properties.shape_radius, "PhysicsActorComponent: 'circle' .shape type requires shape_radius property" );
						fixtureDef.shape = new B2d.CircleShape(properties.shape_radius/scale);
						break;
					case "polygon":
						engineAssert( properties.shape_points, "PhysicsActorComponent: 'polygon' .shape type requires shape_points property" );
						fixtureDef.shape = new B2d.PolygonShape();
						var pointsObj = _.map(properties.shape_points,function(pt) {
							return { x: pt[0] / scale, y: pt[1] / scale };
						});
						fixtureDef.shape.SetAsArray(pointsObj, properties.shape_points.length);
						break;
				}

				// Create a fixture from the definition
				this._body.CreateFixture(fixtureDef);

				// Support the user assigning the object mass or shape density
				if( properties.mass ) {
					// calculates fixture densities based on object's total mass
					var massData = new Box2D.Collision.Shapes.b2MassData();
					massData.mass = properties.mass;
					this._body.SetMassData( massData );
				}
				else {
					// calculates mass based on fixtures' density
					this._body.ResetMassData();
				}

				if( properties.angle ) {
					this.setAngle( properties.angle );
				}
				// unique identifier, because why not
				this._body._bbid = properties.id;
			},

			//=========================================================================
			// removed - called after the parent entity has been removed from the scene
			// Removes the rigid body from the physics world
			removed: function() {
				var entity = this.entity,
					stage = entity.parentStage;
				stage.world.destroyBody(this._body);
			},

			//=========================================================================
			// step - called after every physics engine step
			// Updtes the sprites transform based on the physics body's transform
			step: function() {
				var properties = this.entity.properties,
					stage = this.entity.parentStage,
					pos = this._body.GetPosition(),
					angle = this._body.GetAngle();

				properties.x = pos.x * stage.world.scale;
				properties.y = pos.y * stage.world.scale;
				properties.angle = angle;
			}

			// //=========================================================================
			// // Methods that get added onto the Entity
			// @TODO - this setup is clunky. I don't want to have to write new functions
			// for each function to bind, and I definitely don't want to have to know
			// that the component is stored on the object as .physics
			// We could use Underscore to generate bind functions...
			// extend: {
			//	setPosition: setPosition,
			//	setAngle: setAngle,
			//	getAngle: getAngle,
			//	setVelocity: setVelocity,
			//	getVelocity: getVelocity,
			//	applyForce: applyForce
			//}
		};
	})();

	//=========================================================================
	// Physics Engine Module
	//=========================================================================
	this.registerComponent('world', PhysicsWorldComponent );
	this.registerComponent('physics', PhysicsActorComponent );
};



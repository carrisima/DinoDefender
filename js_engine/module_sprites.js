//*****************************************************************************
// Sprites Module
//
// Required systems:
// * Class
// * Engine
//
// Required libraries:
// * Underscore
//
// Features:
// * SpriteSheet class
// * Sprite entity class
// * Sprites engine module
//
// @TODO
// Width/Height properties are unused. SpriteSheets just render 1-1 with the
// tile width/height. Image sprites just draw the image 1-1 as well.
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();


//=========================================================================
// Sprite Engine Module
// Centralized mechanism for compiling and tracking sheets to make
// them easy to reference and lookup.
//=========================================================================
Engine.Sprites = function() {

	//=========================================================================
	// Sprite Sheet Class
	// A single set of like-sized frames of the same sprite.
	// References an image asset with extra data about the frames, so that we
	// can quickly draw a specific frame at an x/y location on the canvas.
	//
	// Requires a resource name (how sprites reference a SpriteSheet)
	// and an image asset name.
	// Other constructor options:
	//  tilew  - tile width
	//  tileh  - tile height
	//  width  - width of the sprite block
	//  height - height of the sprite block
	//  sx     - start x
	//  sy     - start y
	//  cols   - number of columns per row
	//=========================================================================
	Engine.SpriteSheet = Class.extend({

		// Class name, for debugging
		name: "SpriteSheet",

		//=========================================================================
		// Constructor function
		init: function(name, assetName, options) {
			this.engine = Engine.GetCurrentInstance();
			var defaultProperties = {
				name: name,
				assetName: assetName,
				width: this.engine.getAsset(assetName).width,
				height: this.engine.getAsset(assetName).height,
				tilew: 64,
				tileh: 64,
				sx: 0,
				sy: 0
			};
			_.extend(this, defaultProperties, options);
			this.cols = this.cols || Math.floor(this.w / this.tilew);
		},

		//=========================================================================
		// Calculates the frame x position within the image asset
		frameX: function(frame) {
			return (frame % this.cols) * this.tilew + this.sx;
		},

		//=========================================================================
		// Calculates the frame y position within the image asset
		frameY: function(frame) {
			return Math.floor(frame / this.cols) * this.tileh + this.sy;
		},

		//=========================================================================
		// Draws a specific frame of the Sprite sheet at the x,y locations on the
		// passed in render context (canvas).
		draw: function(ctx, x, y, frame, width, height, angle, alpha) {
			if(!ctx) {
				ctx = this.engine.getCanvas();
			}

			if( ctx === undefined ) {
				return;
			}

			var asset = this.engine.getAsset(this.assetName);
			var sx = this.frameX(frame);	// where to start clipping
			var sy = this.frameY(frame);	// where to start clipping

			this.engine.drawClippedImage( asset, sx, sy,
				this.tilew, this.tileh,
				x, y,
				width, height, angle, alpha );
		}
	});


	//=========================================================================
	// Sprite Properties
	//
	//	x - sprite's center position
	//	y - sprite's center position
	//	z - sort order
	//	assetName - which image asset to use
	//	sheetName - which sprite sheet to use
	//	frame - if a sprite sheet, then which frame it is of that sheet
	//	id - unique identifier, automatically generated if not provided
	//	width - uses data from asset or sprite sheet if not provided
	//	height - uses data from asset or sprite sheet if not provided
	//
	// Additional properties can be used for an attached Physics component
	//=========================================================================
	// sprite properties defaults
	var SpriteDefaultProperties = function() {
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.angle = 0;
		this.frame = 0;
		this.alpha = 1;
		this.isVisible = true;
		this.scale = 1;

		// to draw a sprite, we need one of these defined
		this.assetName = null;	// the image resource name
		this.sheetName = null;		// the sprite name out of a loaded sprite sheet
	};

	SpriteDefaultProperties.prototype = {
		constructor: SpriteDefaultProperties
	};

	SpriteDefaultProperties.prototype.initialize = function() {

		this.id = this.id || _.uniqueId();

		// if the user didn't supply width/height properties but did
		// supply an assetName, then grab them from the asset
		if((!this.width || !this.height)) {
			if(this.assetName) {
				this.width = this.width || this.getAsset().width;
				this.height = this.height || this.getAsset().height;
			} else if(this.sheetName) {
				this.width = this.width || this.getSheet().tilew;
				this.height = this.height || this.getSheet().tileh;
			}
		}
	};

	//=========================================================================
	// Assumes this sprite uses an image asset to draw,
	// returns a handle to the asset
	SpriteDefaultProperties.prototype.getAsset = function() {
		var asset = Engine.GetCurrentInstance().getAsset(this.assetName);
		engineAssert(asset, "Sprite could not find image by assetName: " + this.assetName );
		return asset;
	};

	//=========================================================================
	// Assumes this sprite uses a sprite sheet (multiple frames),
	// returns a handle to the sprite sheet.
	SpriteDefaultProperties.prototype.getSheet = function() {
		var spriteSheet = Engine.GetCurrentInstance().getSpriteSheet(this.sheetName);
		engineAssert( spriteSheet, "Sprite could not find spriteSheet by sheetName: " + this.sheetName );
		return spriteSheet;
	};

	//=========================================================================
	// Draws the sprite on the canvas with it's current properties
	// Can handle whether this sprite is using a single asset or SpriteSheet.
	// A candiate for being overridden by descenant classes
	// Triggers a draw event in case components need to do any additional drawing.
	SpriteDefaultProperties.prototype.draw = function( ctx, posX, posY, angle ) {
		if( this.isVisible === false) {
			return;
		}

		posX = posX || this.x;
		posY = posY || this.y;
		angle = angle || this.angle;
		width = this.width * this.scale;
		height = this.height * this.scale;

		if(this.sheetName) {
			// The SpriteSheet takes care of pixel coordinates
			this.getSheet().draw(ctx, posX, posY, this.frame, width, height, angle, this.alpha );
		} else if(this.assetName) {
			Engine.GetCurrentInstance().drawImage(this.getAsset(), posX, posY, width, height, angle, this.alpha );
		}
		else {

		}
	};

	//=========================================================================
	// Sprite Component
	// - Sprite Component can't have components, and it's .properties are not
	// related to the entity's .properties
	//
	// @TODO, yo dawg: I'd like a sprite component to be an entity,
	// so i can attach animation components to it and then animate sprite components
	// but then the differences are still that a sprite component has a .entity
	// and a sprite Class does not, and the class triggeres events with draw adn step
	//=========================================================================
	
	Engine.SpriteComponent = { //Engine.Entity.extend({

		// Class name, for debugging
		name: "SpriteComponent",
		
		defaults: new SpriteDefaultProperties(),

		//=========================================================================
		// Constructor function that takes in configuration propertiers
		added: function(props) {

			this.engine = Engine.GetCurrentInstance();

			// Default properties
			this.properties = _(this.defaults).clone();
			if( props ) {
				_(this.properties).extend( props );
			}

			this.properties.initialize();

			this.entity.bindEvent('draw', this, 'draw' );
		},

		//=========================================================================
		// Draws the sprite on the canvas with it's current properties
		// Can handle whether this sprite is using a single asset or SpriteSheet.
		// A candiate for being overridden by descenant classes
		// Triggers a draw event in case components need to do any additional drawing.
		draw: function(ctx) {
			var p = this.properties;
			var pos = this.entity.transformLocalPosition( p.x, p.y );
			var angle = this.entity.properties.angle + p.angle;
			this.properties.draw(ctx, pos.x, pos.y, angle);
		}

		// //=========================================================================
		// // A stub function that just triggers a 'step' event for any listening
		// // components that might be attached
		// step: function(dt) {
		//	this.triggerEvent('step',dt);
		// }
	};

	//=========================================================================
	// Sprite Class
	// - Sprite Class is an Entity, so it can have its own components
	// (like an animation or physics) and bind to events.
	//=========================================================================
	//Engine.Sprite = Engine.Entity.extend( Engine.SpriteComponent );
	Engine.Sprite = Engine.Entity.extend({

		// Class name, for debugging
		name: "Sprite",

		defaults: new SpriteDefaultProperties(),

		//=========================================================================
		// Constructor function that takes in configuration propertiers
		init: function(props) {
			this.engine = Engine.GetCurrentInstance();

			// setup sprite properties with defaults
			this.properties = _(this.defaults).clone();
			if( props ) {
				_(this.properties).extend( props );
			}

			this.properties.initialize();
		},


		//=========================================================================
		// Draws the sprite on the canvas with it's current properties
		// Can handle whether this sprite is using a single asset or SpriteSheet.
		// A candiate for being overridden by descenant classes
		// Triggers a draw event in case components need to do any additional drawing.
		draw: function(ctx) {
			this.properties.draw(ctx);

			// Let components know that a draw event occured, in case they need
			// to do anything
			this.triggerEvent('draw',ctx);
		},

		//=========================================================================
		// A stub function that just triggers a 'step' event for any listening
		// components that might be attached
		step: function(dt) {
			this.triggerEvent('step',dt);
		}
	});

	//=========================================================================
	// Sprite Engine Module
	// Centralized mechanism for compiling and tracking sheets to make
	// them easy to reference and lookup.
	//=========================================================================
	// storage for sprite sheets
	this.sheets = {};

	// Also support an entity adding a sprite as a component
	this.registerComponent('sprite', Engine.SpriteComponent );

	//=========================================================================
	// Creates a new sprite sheet
	Engine.prototype.loadSpriteSheet = function(name, assetName, options) {
		this.sheets[name] = new Engine.SpriteSheet(name,assetName,options);
	};

	//=========================================================================
	// Getter for a sprite sheet
	Engine.prototype.getSpriteSheet = function(name) {
		return this.sheets[name];
	};

	//=========================================================================
	// Combines an image asset with a JSON sprite data asset to generate
	// one or more SpriteSheets auomatically from the data generated
	// by the spriter generator in Chapter 8.
	Engine.prototype.compileSheets = function(imageAsset, spriteDataAsset) {
		var engine = this;
		var data = engine.getAsset(spriteDataAsset);
		engineAssert( data, "Cannot compile sprite sheets for missing image asset: " + imageAsset );
		_(data).each(function(spriteData,name) {
			engine.loadSpriteSheet(name,imageAsset,spriteData);
		});
	};

	return this;
};


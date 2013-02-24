//=========================================================================
// Cannon Game (similiar to Angry Birds)
//=========================================================================
var engineConfig = {
	imagePath: "game/cannon/images/",
	audioPath: "game/cannon/audio/",
	dataPath:  "game/cannon/data/"
};

//=========================================================================
// Create Engine Instance
//=========================================================================
var myEngine = Engine(engineConfig);
myEngine.includeModule("Input, Sprites, Scenes, Physics");

//=========================================================================
// Setup Canvas
//=========================================================================
myEngine.setupCanvas( 'canvas' );
myEngine.el.css('backgroundColor','#666');

//=========================================================================
// HTML up in this hizzy
//=========================================================================
$("body").append("<h3>Controls</h3>");
$("body").append("<ul>");
$("body").append("<li>Destroy all targets to restart game.");
$("body").append("<li>Move mouse to aim cannon.");
$("body").append("<li>Left click on screen to fire a cannonball.");
$("body").append("<li>Right click and drag on a non-staic object to move it through a constraint");
$("body").append("</ul>");



//=========================================================================
// Setup Input
//=========================================================================
myEngine.input.enableMouse();
myEngine.input.enableGamepad();

//=========================================================================
// Resources Needed for the game
//=========================================================================
var AssetList = [
	"sprites.png",
	"sprites.json" // sprites data file
];

//=========================================================================
// CannonBall Game Object
//=========================================================================
var ClassCannonBall = Engine.Sprite.extend({

	// Name to help with debugging
	name: "ClassCannonBall",

	// extended properties for this class
	defaults: {
		// sprite properties
		sheetName: "ball",
		width: 16,	// physics circle radius * 2 (diameter)
		height: 16,	// physics circle radius * 2 (diameter)

		// physics properties
		shape: "circle",
		shape_radius: 8,
		restitution: 0.5,
		density: 4,
		bodyType: "dynamic",

		// gameplay properties
		seconds: 10		// lifetime before destroying self
	},

	init: function(props) {
		this._super(props);
		this.addComponent('physics');
		this.bindEvent('step',this,'countdown');
	},

	countdown: function(dt) {
		this.properties.seconds -= dt;
		if(this.properties.seconds < 0) {
			this.destroy();
		} else if(this.properties.seconds < 1) {
			this.properties.alpha = this.properties.seconds;
		}
	}
});

//=========================================================================
// Cannon Game Object
//=========================================================================
var ClassCannon = Engine.Sprite.extend({

	// Name to help with debugging
	name: "ClassCannon",

	fireOffset: 30,

	// extended properties for this class
	defaults: {
		// sprite properties:
		sheetName: "cannon"

		//physics properties
		// none
	},

	init: function(props) {
		this._super(props);

		// poll for mouse status
		//@TODO finish input system and use events
		this.bindEvent('step',this,'updateAngle');
		myEngine.input.bindEvent('mouseleftup',this,'fire');
	},

	fire: function() {
		var dir = this.transformLocalDirection(1, 0);

		var properties = {
			x: this.properties.x + dir.x * this.fireOffset,
			y: this.properties.y + dir.y * this.fireOffset,
			angle: this.properties.angle
		};
		var ball = new ClassCannonBall(properties);
		myEngine.getStage().insert(ball);

		ball.physics.setVelocity(dir.x*400,dir.y*400);
	},

	updateAngle: function() {
		var point = myEngine.input.mousePos;
		var angle = Math.atan2(point.y - this.properties.y, point.x - this.properties.x);
		this.properties.angle = angle;
	},
	
	destroy: function() {
		this._super();
	}
});

//=========================================================================
// Target Game Object
//=========================================================================
var targetCount = 0;
var ClassTarget = Engine.Sprite.extend({

	// name to help with debugging
	name: "ClassTarget",

	// extend sprite default properties
	defaults: {
		// sprite properties
		sheetName: "target",
		width: 32,	// physics circle radius * 2 (diameter)
		height: 32,	// physics circle radius * 2 (diameter)

		// physics properties
		shape: "circle",
		shape_radius: 16,
		restitution: 0.5,
		density: 4,
		seconds: 5,
		bodyType: "dynamic"
	},

	init: function(props) {
		this._super(props);
		targetCount++;
		this.addComponent('physics');
		this.bindEvent('contact',this,'checkHit');
	},

	checkHit: function(sprite) {
		if(sprite instanceof ClassCannonBall) {
			targetCount--;
			this.parentStage.remove(this);
			if(targetCount === 0) { myEngine.stageScene('level'); }
		}
	}
});


//=========================================================================
// Scene
//=========================================================================
var targetCount = 0;
function level_generator(stage) {

	targetCount = 0;

	//////////////////////////////////////////////////////////////////////////////
	// Setup World
	// - Physics
	// - Camera
	// - Physics Debug Rendering (since i have limited sprites)
	//////////////////////////////////////////////////////////////////////////////
	var PhysicsWorldProps = {
		gravityX: 0,
		gravityY: 9.8,
		scale: 30
	};
	stage.addComponent("world", PhysicsWorldProps);
	stage.addComponent("camera");
	stage.camera.centerViewportOn( myEngine.width/2, myEngine.height/2 );
	stage.world.toggleDebugDraw(true);

	//////////////////////////////////////////////////////////////////////////////
	// Static world geometry
	// Some have no sprites so we're depending on debug physics rendering to show them
	// Add a bunch of generic objects, and then quickly add Physics components to
	// all of them (which is why we create them first)
	//////////////////////////////////////////////////////////////////////////////
	stage.insert(new Engine.Sprite({ shape_width: myEngine.width, shape_height:30, x: myEngine.width/2, y: myEngine.height, bodyType: "static" }));
	stage.insert(new Engine.Sprite({ shape_width: myEngine.width, shape_height:30, x: myEngine.width/2, y: 0, bodyType: "static" }));
	stage.insert(new Engine.Sprite({ shape_width: 30, shape_height:myEngine.height, x: 0, y: myEngine.height/2, bodyType: "static" }));
	stage.insert(new Engine.Sprite({ shape_width: 30, shape_height:myEngine.height, x: myEngine.width, y: myEngine.height/2, bodyType: "static" }));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 50, shape_height:10, width: 50, height:10, x: 500, y: 550, angle: Math.PI/2 }));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 50, shape_height:10, width: 50, height:10, x: 550, y: 550, angle: Math.PI/2}));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 70, shape_height:10, width: 70, height:10, x: 525, y: 520 }));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 50, shape_height:10, width: 50, height:10, x: 500, y: 480, angle: Math.PI/2}));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 50, shape_height:10, width: 50, height:10, x: 550, y: 480, angle: Math.PI/2 }));
	stage.insert(new Engine.Sprite({ sheetName: "block", shape_width: 70, shape_height:10, width: 70, height:10, x: 525, y: 460 }));
	stage.insert(new Engine.Sprite({
		shape_points: [[ 0,0 ], [ 50, -50 ],[150, -50],[200,0]],
		x: 200,
		y: 575,
		type:'static',
		shape: 'polygon'
	}));
	// quick way to add physics to every object at once
	stage.each(function() { this.addComponent("physics"); });

	//////////////////////////////////////////////////////////////////////////////
	// Cannon (player object)
	//////////////////////////////////////////////////////////////////////////////
	stage.insert(new Engine.Sprite({ sheetName: "block", x: 50, y: myEngine.height - 10 }));
	stage.cannon = stage.insert(new ClassCannon( {x:50, y:myEngine.height - 25} ));

	//////////////////////////////////////////////////////////////////////////////
	// Targets (enemy objects)
	// Destroy all of these for the game to be over
	//////////////////////////////////////////////////////////////////////////////
	for( var i=0; i<14; ++i ) {
		stage.insert( new ClassTarget( { x: 100 + i * 50, y: 100 } ) );
	}
	
	//////////////////////////////////////////////////////////////////////////////
	// Assorted Input handlers
	// For things like handling menus, or global world interaction that
	// isn't done by a player object
	//////////////////////////////////////////////////////////////////////////////
	// Various input tests
	var mouseJoint = null;

	myEngine.input.bindEvent( "mousemove", stage, function(mousePos) {
		if(mouseJoint) {
			mousePos = stage.transformLocalPosition( mousePos.x, mousePos.y );
			mousePos.x = mousePos.x / stage.world.scale;
			mousePos.y = mousePos.y / stage.world.scale;
			mouseJoint.SetTarget(new Engine.B2d.Vec(mousePos.x, mousePos.y));
		}
	} );

	myEngine.input.bindEvent( "mouserightup", stage, function(mousePos) {
		if( mouseJoint ) {
			stage.world.destroyJoint(mouseJoint);
			mouseJoint = null;
		}
	});

	myEngine.input.bindEvent( "mouserightdown", stage, function(mousePos) {
		mousePos = stage.transformLocalPosition( mousePos.x, mousePos.y );
		var pickedSprite = stage.world.getEntityAtPosition( mousePos.x, mousePos.y );
		if( pickedSprite ) {
			if( mouseJoint ) {
				stage.world.destroyJoint(mouseJoint);
				mouseJoint = null;
			}
			//pickedSprite.destroy();
			mouseJoint = stage.world.createMouseJoint( pickedSprite.physics._body, mousePos.x, mousePos.y );
		}
	} );
	
}

// Setup new level
myEngine.addScene('level',new Engine.Scene(level_generator));

myEngine.load(AssetList, function() {
	// Create a sprite sheet out of the loaded assets
	myEngine.compileSheets('sprites.png','sprites.json');

	// Start a new level
	myEngine.stageScene("level");
	
	// Making sure level updates
	myEngine.setGameLoop(function(dt) {
		myEngine.stageGameLoop(dt);
	});
});

$("body").append("<button id='toggleVisible'>Toggle Sprites visible</button>");
$("body").append("<button id='restart'>Restart</button>");
$("#toggleVisible").on('click', function() {
	myEngine.getStage().properties.isVisible = myEngine.getStage().properties.isVisible ? false : true;
});

$("#restart").on('click', function() {
	myEngine.stageScene("level");
});

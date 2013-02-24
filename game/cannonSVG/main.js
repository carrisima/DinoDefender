
//=========================================================================
// Cannonball Game (similiar to Angry Birds)
//=========================================================================


//=========================================================================
// Create Engine Instance
//=========================================================================
var myEngine = Engine();
myEngine.includeModule("Input, Sprites, Scenes, SVG, Physics");

//=========================================================================
// Setup Canvas
//=========================================================================
myEngine.svgOnly();
myEngine.setupSVG( 'svgElement', { maximize: true });

//myEngine.setupCanvas( 'canvas', { maximize: true });
//myEngine.el.css('backgroundColor','#666');

//=========================================================================
// CannonBall
//=========================================================================
myEngine.CannonBall = Engine.Sprite.extend({
	defaults: {
		shape: 'circle',
		color: 'red',
		shape_radius: 8,
		restitution: 0.5,
		density: 4,
		seconds: 5,
		bodyType: "dynamic"
	},

	init: function(props) {
		this._super(props);
		this.properties.x = props.dx * 50 + 10;
		this.properties.y = props.dy * 50 + 210;
		this.addComponent('physics');
		this.bindEvent('step',this,'countdown');
	},

	countdown: function(dt) {
		this.properties.seconds -= dt;
		if(this.properties.seconds < 0) {
			this.destroy();
		} else if(this.properties.seconds < 1) {
			this.set({ "fill-opacity": this.properties.seconds });
		}
	}
});

//=========================================================================
// Cannon
//=========================================================================
myEngine.Cannon = Engine.Sprite.extend({
	defaults: {
		shape:'polygon',
		color: 'black',
		shape_points: [[ 0,0 ], [0,-5], [5,-10], [8, -11], [40, -11], [ 40, 11], [8, 11], [5, 10], [0, 5] ],
		x: 10,
		y: 210
	},

	init: function(props) {
		this._super(props);
	},

	fire: function() {
		var dx = Math.cos(this.properties.angle / 180 * Math.PI),
			dy = Math.sin(this.properties.angle / 180 * Math.PI);
		var properties = {
			dx: dx,
			dy: dy,
			angle: this.properties.angle
		};
		var ball = new myEngine.CannonBall(properties);
		myEngine.getStage().insert(ball);
		ball.physics.setVelocity(dx*400,dy*400);
	}
});

//=========================================================================
// Target
//=========================================================================
var targetCount = 0;
myEngine.Target = Engine.Sprite.extend({
	defaults: {
		shape: 'circle',
		color: 'pink',
		shape_radius: 8
	},

	init: function(props) {
		this._super(props);
		targetCount++;
		this.addComponent('physics');
		this.bindEvent('contact',this,'checkHit');
	},

	checkHit: function(sprite) {
		if(sprite instanceof myEngine.CannonBall) {
			targetCount--;
			this.parentStage.remove(this);
			if(targetCount === 0) { myEngine.stageScene('level'); }
		}
	}
});

//=========================================================================
// Input
//=========================================================================
var targetCount = 0;
$(myEngine.wrapper).on('touchstart touchmove mousemove',function(e) {
	var stage = myEngine.getStage(0),
		cannon = stage.cannon,
		touch = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e,
		point = stage.browserToWorld(touch.pageX,touch.pageY);
 
	var angle = Math.atan2(point.y - cannon.properties.y, point.x - cannon.properties.x);
	cannon.properties.angle = angle * 180 / Math.PI;
	e.preventDefault();
});

$(myEngine.wrapper).on('touchend mouseup',function(e) {
	myEngine.getStage(0).cannon.fire();
	e.preventDefault();
});

//=========================================================================
// Scene
//=========================================================================
var targetCount = 0;
myEngine.addScene('level',new Engine.Scene(function(stage) {

	// stage.insert(new Engine.Sprite({ shape_width: 640, shape_height:30, x: 320, y: 480, bodyType: "static" }));
	// stage.insert(new Engine.Sprite({ shape_width: 640, shape_height:30, x: 320, y: 0, bodyType: "static" }));
	// stage.insert(new Engine.Sprite({ shape_width: 30, shape_height:480, x: 0, y: 240, bodyType: "static" }));
	// stage.insert(new Engine.Sprite({ shape_width: 30, shape_height:480, x: 640, y: 240, bodyType: "static" }));

	targetCount = 0;

	// Setup Physics
	var PhysicsWorldProps = {
		gravityX: 0,
		gravityY: 9.8,
		scale: 30
	};
	stage.addComponent("world", PhysicsWorldProps);

	// Only works for canvas drawing
	//stage.world.toggleDebugDraw(true);

	stage.insert(new Engine.Sprite({
		x: 250, y: 250, shape_width: 700, shape_height: 50, bodyType:"static"
	}));

	stage.insert(new Engine.Sprite({ shape_width: 10, shape_height:50, x: 500, y: 200 }));
	stage.insert(new Engine.Sprite({ shape_width: 10, shape_height:50, x: 550, y: 200 }));
	stage.insert(new Engine.Sprite({ shape_width: 70, shape_height:10, x: 525, y: 170 }));
	stage.insert(new Engine.Sprite({ shape_width: 10, shape_height:50, x: 500, y: 130 }));
	stage.insert(new Engine.Sprite({ shape_width: 10, shape_height:50, x: 550, y: 130 }));
	stage.insert(new Engine.Sprite({ shape_width: 70, shape_height:10, x: 525, y: 110 }));

	stage.insert(new Engine.Sprite({
		shape_points: [[ 0,0 ], [ 50, -50 ],[150, -50],[200,0]],
		x: 200,
		y: 225,
		type:'static',
		shape: 'polygon'
	}));

	stage.insert(new Engine.Sprite({ shape_width: 50, shape_height:50, x: 300, y: 150 }));
	stage.insert(new Engine.Sprite({ shape_width: 25, shape_height:25, x: 300, y: 115 }));

	stage.each(function() { this.addComponent("physics"); });

	stage.insert(new myEngine.Target({ x: 525, y: 90 }));
	stage.insert(new myEngine.Target({ x: 300, y: 90 }));
	stage.insert(new Engine.Sprite({ shape_width: 30, shape_height:30, x: 10, y: 210, color: "blue" }));

	stage.cannon = stage.insert(new myEngine.Cannon());
	stage.viewport(600,400);
	stage.centerOn(300,100);
}));

myEngine.stageScene("level");


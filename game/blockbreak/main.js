
//=========================================================================
// Blockbreak
//=========================================================================
var engineConfig = {
	imagePath: "game/blockbreak/images/",
	audioPath: "game/blockbreak/audio/",
	dataPath:  "game/blockbreak/data/"
};

//=========================================================================
// Create Engine Instance
//=========================================================================
var myEngine = Engine( engineConfig );
myEngine.includeModule("Input, Sprites, Scenes");

//=========================================================================
// Setup Canvas
//=========================================================================
myEngine.setupCanvas( null, { width: 320, height:420 });
myEngine.el.css('backgroundColor','#666');

//=========================================================================
// Setup Input
//=========================================================================
myEngine.input.setKeyboardControls();
// myEngine.input.touchControls({
// 		controls:  [ ['left','<' ],['right','>' ],[],[],[] ]
// 	});

//=========================================================================
// Paddle Game Object
//=========================================================================
myEngine.Paddle = Engine.Sprite.extend({
	init: function() {
		this._super({
			sheetName: 'paddle',
			speed: 200,
			x: 0
		});

		this.properties.y = myEngine.height - this.properties.height;
		if(myEngine.input.keypad.size) {
			this.properties.y -= myEngine.input.keypad.size + this.properties.height;
		}
	},

	step: function(dt) {
		if(myEngine.inputs['left']) {
			this.properties.x -= dt * this.properties.speed;
		} else if(myEngine.inputs['right']) {
			this.properties.x += dt * this.properties.speed;
		}

		if(this.properties.x < this.properties.width/2) {
			this.properties.x = this.properties.width/2;
		} else if(this.properties.x > myEngine.width - this.properties.width/2) {
			this.properties.x = myEngine.width - this.properties.width/2;
		}

		this._super(dt);
	}
});

//=========================================================================
// Ball Game Object
//=========================================================================
myEngine.Ball = Engine.Sprite.extend({
	init: function() {
		this._super({
			sheetName: 'ball',
			speed: 200,
			dx: 1,
			dy: -1
		});
		this.properties.y = myEngine.height / 2 - this.properties.height;
		this.properties.x = myEngine.width / 2 + this.properties.width / 2;
	},

	step: function(dt) {
		var p = this.properties;
		var hit = myEngine.getStage().collide(this);
		if(hit) {
			if(hit instanceof myEngine.Paddle) {
				p.dy = -1;
			} else {
				hit.triggerEvent('collision',this);
			}
		}

		p.x += p.dx * p.speed * dt;
		p.y += p.dy * p.speed * dt;

		if(p.x < (0 + p.width/2)) {
			p.x = (0 + p.width/2);
			p.dx = 1;
		} else if(p.x > (myEngine.width - p.width/2)) {
			p.dx = -1;
			p.x = myEngine.width - (p.width/2);
		}

		if(p.y < (0 + p.height/2)) {
			p.y = (0 + p.height/2);
			p.dy = 1;
		} else if(p.y > (myEngine.height-p.height/2)) {
			myEngine.stageScene('game');
		}

		this._super(dt);
	}
});

//=========================================================================
// Block Game Object
//=========================================================================
myEngine.Block = Engine.Sprite.extend({
	defaults: {
		sheetName: 'block'
	},

	init: function(props) {
		this._super(props);
		this.bindEvent('collision',function(ball) {
			this.destroy();
			ball.properties.dy *= -1;
			myEngine.getStage().triggerEvent('removeBlock');
		});
    }
});

//=========================================================================
// Game Logic
// - Load Assets
// - Create Scenes/Game Object Instances
// - Check win/loss state
//=========================================================================
myEngine.load(['blockbreak.png','blockbreak.json'], function() {

	// Create a sprite sheet out of the loaded assets
	myEngine.compileSheets('blockbreak.png','blockbreak.json');

	var stageGenerator = function(stage) {
		stage.insert(new myEngine.Paddle());
		stage.insert(new myEngine.Ball());

		// Create a grid of blocks
		var imageWidth = myEngine.getSpriteSheet('block').width;
		var imageHeight = myEngine.getSpriteSheet('block').height;
		var blockCount=0;
		for(var x=0;x<6;x++) {
			for(var y=0;y<5;y++) {
				stage.insert(new myEngine.Block({ x: x*50+imageWidth/4, y: y*30+imageHeight/2 }));
				blockCount++;
			}
		}
	
		// Bind to the 'removeBlock' event so we can track remaining blocks
		stage.bindEvent('removeBlock',function() {
			blockCount--;
			if(blockCount === 0) {
				console.log ( "Block count 0, restarting game" );
				myEngine.stageScene('game');
			}
		});
	};

	// Create a scene
	var gameScene = new Engine.Scene( stageGenerator );

	// Add the scene, which creates a stage
	myEngine.addScene('game', gameScene );

	// Add the stage to be updated and rendered
	myEngine.stageScene('game');
});

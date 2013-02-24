var App = App || {};
App.run = function (){

//=========================================================================
// Dino Defender!
// Dino Art courtesy of Wyverii, http://opengameart.org/content/unsealed-terrex
//texture tiles by  Jetrel, Daniel Cook, Bertram and Zabin,
// //http://opengameart.org/content/2d-lost-garden-tileset-transition-to-jetrels-wood-tileset
//UFO art by  dravenx,  http://opengameart.org/content/ufos-and-spaceship
//fireball "Iron Plague" art by Daniel Cook (Lostgarden.com)
//Fatman bomb:  http://opengameart.org/content/fat-man
//=========================================================================
//=========================================================================
// Draw Background
//==========================================================================

    app.drawBackgroundCanvas();
//=========================================================================
// Create Engine Instance
//=========================================================================
    var engineConfig = {
        imagePath: "images/",
        audioPath: "audio/",
        dataPath:  "data/"
    };

    var myEngine = Engine( engineConfig );
    myEngine.includeModule("Input, Sprites, Scenes, Animation, Physics");

//=========================================================================
// Setup Canvas
//=========================================================================
    var     canvasH,
            canvasW,
            canvasOptions;

    canvasOptions={
        setWidthHeight: false
    }
    myEngine.setupCanvas("gameCanvas", canvasOptions);
    myEngine.el.css('backgroundColor','#387FD1');
    //myEngine.el.addClass("screen");
    canvasH = myEngine.el.height();
    canvasW = myEngine.el.width();
    myEngine.el.addClass("screen");

    // $(myEngine.el).appendTo( gameScreen );

//=========================================================================
// Setup Input
//=========================================================================
    myEngine.input.enableMouse();
    myEngine.input.setKeyboardControls();


//=========================================================================
// Resources
//=========================================================================
    var AssetList = [
        "smoke.png",
        "smoke.json",
        "dino.png",
        "dino.json",
        "platformerSprites.png",
        "platformerSprites.json",
        "ufos.json","ufos.png",
        "textures.json","textures.png",
        "fatman.png", "fatman.json"

    ];

//=========================================================================
// Game Object - BoundrySprite
//  creates a static object in the world
//=========================================================================
    var BoundrySprite = Engine.Sprite.extend({

        // Class name, for debugging
        name: "boundrySprite",
        defaults: {
            // Entity properties
            // physics properties
            shape: "block",
            restitution: 0.5,
            bodyType: "static"

        },
        init: function(props) {

            this._super(props);
            this.addComponent('physics', this.properties);


        }

    });
//=========================================================================
// Game Object - DinoClassPlayer
//=========================================================================
    var DinoClassPlayer = Engine.Sprite.extend({

        // name to help with debugging
        name: "DinoClassPlayer",

        defaults: {
            // Sprite properties
            sheetName: "dino",
            animSetName: DinoAnimationGroupName,
            rate: 1/15,
            speed: 300,
            x: 100,
            y: canvasH - 100,
            z:8,
            hopDir: "up",
            hopping: false,
            runDir: "",
            // physics properties
            shape: "block",
            shape_width: 40,
            shape_height: 20,
            restitution: .5,
            density: 4,
            bodyType: "kinematic"

        },

        init:function(props) {

            this._super(props);
            this.addComponent('animation');
            this.play('stand_right');
            this.addComponent('physics');
            this.bindEvent('contact',this,'checkHit');

            // bind the input action event directly to trigger an animation
            myEngine.input.bindEvent('fire',this,"fire");

            this.bindEvent('animEnd.fire',this,function() { console.log("Fired!"); });
            this.bindEvent('animLoop.run_right',this,function() { console.log("right"); });
            this.bindEvent('animLoop.run_left',this,function() { console.log("left"); });
            this.bindEvent('animLoop.hop_up',this,function() { console.log("hop"); });

        },


        fire: function() {
            this.play('fire',1);


            pos = this.transformLocalPosition( 0, 100 );
            var newFireBall = new ClassFireBall( {
                x: pos.x,
                y: pos.y-150,
                z:12
            } );
            myEngine.getStage().insert( newFireBall );

        },



        step: function(dt) {
            var p = this.properties;
            if(p.animationName != 'fire') {

                if(myEngine.inputs['right']) {
                    this.play('run_right');

                    p.runDir = "right";
                    if(p.x < canvasW - 46)
                    {
                        this.physics.setPosition(p.x + p.speed * dt,
                            p.y);
                    }
                }
                else if (myEngine.inputs['left']) {
                    this.play('run_left');
                    p.runDir = "left";
                    if(p.x > 46){
                        this.physics.setPosition(p.x - p.speed * dt,
                            p.y);
                    }
                }
                else if (myEngine.inputs['fart']) {
                    var pos = this.transformLocalPosition( 94, 0 );
                    var newEffect = new ClassExplosion( {x:pos.x, y:pos.y });
                    this.parentStage.insert( newEffect );

                }
                else if(myEngine.inputs['hop']) {

                    this.play('hop_up');
                    p.hopping = true;



                }
                else{
                    if(p.runDir==="right") {
                        this.play('stand_right');
                    }
                    else if(p.runDir==="left") {
                        this.play('stand_left');
                    }
                }

                //finish full hop because doesn't have time to complete within input loop
                if(p.hopDir === "up" && p.hopping === true)
                {
                    p.y -= p.speed * dt;
                    if(p.y < canvasH - 200){
                        p.hopDir = "down";
                    }
                }
                else if(p.hopDir === "down"&& p.hopping === true)
                {
                    p.y += p.speed * dt;
                    if(p.y >= canvasH - 100 ){
                        p.y = canvasH - 100;
                        p.hopDir = "up";
                        p.hopping = false;
                    }
                }
            }
            this._super(dt);
        },

        checkHit: function(sprite) {
            if(sprite instanceof ClassFatMan) {
                //targetCount--;
                alert("hit the dino");
                this.play("zapped");

                //this.parentStage.remove(this);
                //if(targetCount === 0) { myEngine.stageScene('level'); }
            }
        }
    });


//=========================================================================
// FlameThrower Game Object
//=========================================================================
    var ClassFlameThrower = Engine.Sprite.extend({

        // Name to help with debugging
        name: "ClassFlameThrower",

        fireOffset: 20,

        // extended properties for this class
        defaults: {
            // sprite properties:
            sheetName: "cannon"

        },

        init: function(props) {
            this._super(props);

            // poll for mouse status

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

            var fireball = new ClassFireBall(properties);
            myEngine.getStage().insert(fireball);

            fireball.physics.setVelocity(dir.x*550,dir.y*550);
        },

        updateAngle: function() {
            var point = myEngine.input.mousePos;
            var angle = Math.atan2(point.y - this.properties.y, point.x - this.properties.x);
            this.properties.angle = angle;
        },
        step:function(dt) {
            var p = this.properties;
            if(myEngine.getStage().dinoPlayer.properties.runDir === "right"){
                p.x = myEngine.getStage().dinoPlayer.properties.x + 30;
                p.y = myEngine.getStage().dinoPlayer.properties.y + 5;
            }
            else if(myEngine.getStage().dinoPlayer.properties.runDir === "left"){
                p.x = myEngine.getStage().dinoPlayer.properties.x - 30;
                p.y = myEngine.getStage().dinoPlayer.properties.y + 5;
            }
            this._super(dt);
        },

        destroy: function() {
            this._super();
        }
    });
//=========================================================================
// FireBall Game Object
//=========================================================================
    var ClassFireBall = Engine.Sprite.extend({

        // Name to help with debugging
        name: "ClassFireBall",

        // extended properties for this class
        defaults: {
            // sprite properties
            sheetName: "fireball",
            animSetName: UFOAnimationGroupName,
            width: 25,	// physics circle radius * 2 (diameter)
            height: 25,	// physics circle radius * 2 (diameter)
            z:15,
            // physics properties
            shape: "circle",
            shape_radius: 12.5,
            restitution: 0.5,
            density: 4,
            bodyType: "dynamic",

            // gameplay properties
            seconds: 10		// lifetime before destroying self
        },

        init: function(props) {
            this._super(props);
            this.addComponent('animation');
            this.play( "flame" );
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
// FatMan Game Object
//=========================================================================
    var ClassFatMan = Engine.Sprite.extend({

        // Name to help with debugging
        name: "ClassFatMan",

        // extended properties for this class
        defaults: {
            // sprite properties
            sheetName: "fatman",
            animSetName: BombAnimationGroupName,
            width: 48,
            height: 48,
            z:15,
            // physics properties
            shape: "block",
            shape_width: 20,
            shape_height: 35,
            restitution: .5,
            density: 4,
            bodyType: "kinematic",

            // gameplay properties
            seconds: 5		// lifetime before drop
        },

        init: function(props) {
            this._super(props);
            this.addComponent('animation');
            this.play( "twirl" );
            this.addComponent('physics');
            this.bindEvent('contact',this,'checkHit');

            //this.bindEvent('step',this,'drop');
        },
        step:function(dt) {
            var p = this.properties;
            this.properties.seconds -= dt;
           if(p.y < canvasH - 65){

                if((this.properties.seconds > 0)){
                    this.physics.setPosition(myEngine.getStage().blueUFO.properties.x,
                        myEngine.getStage().blueUFO.properties.y + 25);
                }
                else{
                    this.physics.makeDynamic();
                }
           }
           else
           {
               this.destroy();
           }

            this._super(dt);
        },

        checkHit: function(sprite) {
            if(sprite instanceof ClassFireBall) {
                //targetCount--;
                this.beenHit = true;
                this.physics.makeDynamic();

                //this.parentStage.remove(this);
                //if(targetCount === 0) { myEngine.stageScene('level'); }
            }
        }

    });
//=========================================================================
// Game Object - Explosion Effect
//=========================================================================
    var ClassExplosion = Engine.Sprite.extend({

        // name to help with debugging
        name: "ClassExplosion",

        defaults: {
            // Sprite properties
            sheetName: "smokeEffect",
            animSetName: SmokeAnimationGroupName,
            rate: 1/15,
            speed: 700,
            z: 20
        },

        init:function(props) {
            this._super(props);

            this.addComponent('animation');
            this.play( "explode" );

            // Once the animation is done playing, destroy this object
            this.bindEvent('animEnd',this,function() {
                this.destroy();
            });
        }

    });

//=========================================================================
// Game Object - BlueUFO
//=========================================================================
    var UFO = Engine.Sprite.extend({

        // name to help with debugging
        name: "UFO",

        defaults: {
            // Sprite properties
            sheetName: "blueUfo",
            animSetName: UFOAnimationGroupName,
            rate: 1/15,
            speed: 100,
            z: 20,
            scootDir: "right",
            shape: "circle",
            shape_radius: 20,
            restitution:.75,
            density: 4,
            bodyType: "kinematic",
            beenHit: false
        },

        init:function(props) {
            this._super(props);

            this.addComponent('animation');
            this.addComponent('physics');
            this.bindEvent('contact',this,'checkHit');
            this.bindEvent('animLoop.fly',this,function() { console.log("fly"); });


        },

        checkHit: function(sprite) {
            if(sprite instanceof ClassFireBall) {
                //targetCount--;
                this.beenHit = true;
                this.physics.makeDynamic();

                //this.parentStage.remove(this);
                //if(targetCount === 0) { myEngine.stageScene('level'); }
            }
        },

        step:function(dt) {
            //TODO figure out canvas offset property to get rid of magic number
            var p = this.properties;
            this.play( "fly" );

            if(!this.beenHit)
            {
                if(p.scootDir === "right")
                {
                    p.x += p.speed * dt;
                    this.physics.setPosition(p.x, p.y);
                    if(p.x > canvasW - 46){
                        p.scootDir="left";
                    }
                }
                else if(p.scootDir === "left")
                {
                    p.x -= p.speed * dt;
                    this.physics.setPosition(p.x, p.y);
                    if(p.x < 46){
                        p.scootDir="right";
                    }
                }
            } else {

                if(this.p.y >= canvasH - 50){

                }
            }

            //THIS FILE HAS CHANGED
            this._super(dt)
        }



    });

//=========================================================================
// Game Logic - Main Scene
//=========================================================================
    function generator(stage) {

        //////////////////////////////////////////////////////////////////////////////
        // Setup World
        // - Physics
        // - Camera
        // - Physics Debug Rendering (since i have limited sprites)
        //////////////////////////////////////////////////////////////////////////////
        var PhysicsWorldProps = {
            gravityX: 0,
            gravityY: 9.8,
            scale: 30,
            _debugDraw: true

        };


        stage.addComponent("world", PhysicsWorldProps);
        stage.addComponent("camera");
        stage.camera.centerViewportOn( myEngine.width/2, myEngine.height/2 );
        //stage.world.toggleDebugDraw(true);

        var newBomb = new ClassFatMan({x: 300, y: 200, z:22});

        stage.insert( newBomb );

        var newPlayer = new DinoClassPlayer( {z:10});
        stage.dinoPlayer = newPlayer;
        stage.insert( newPlayer );

        var newUFO = new UFO( {
            x: 100,
            y: 50,
            z:8,
            id: "MrBlue"
        } );

        stage.blueUFO = newUFO;
        stage.insert( newUFO );

        var ground = new BoundrySprite( {z:1, x: canvasW/2, y: canvasH - 25, shape_width: canvasW,
            shape_height: 50});
        var leftBoundry = new BoundrySprite( {z:5, x: -48, y: 250, shape_width: 50,
            shape_height: canvasH});
        var rightBoundry = new BoundrySprite( {z:1, x: canvasW+48, y: 250, shape_width: 50,
            shape_height: canvasH});

        stage.insert( ground );
        stage.insert(leftBoundry);
        stage.insert(rightBoundry);

        //draw the ground
        groundX = 88

        for(var i= 0; i < 7; i++){
            stage.insert(new Engine.Sprite({ sheetName: "ground", x: groundX + (173*i), y: canvasH - 50, z:2}));
        }

        var house = new Engine.Sprite({
            sheetName: "house",
            x: (canvasW/2 + 20),
            y: canvasH - 140,
            z:3,
            shape: "block",
            restitution: 0.5,
            bodyType: "static",
            shape_width: 258,
            shape_height: 168});

        house.addComponent('physics', this.properties);
        stage.insert(house);
        stage.flamethrower = stage.insert(new ClassFlameThrower( {x: stage.dinoPlayer.properties.x + 30,
            y: stage.dinoPlayer.properties.y, z:20} ));
        stage.insert(new Engine.Sprite({ sheetName: "big_tree", x: 200, y: canvasH - 150, z:5}));


        //stage.addComponent( "camera" );
        //stage.camera.followEntity( newPlayer );

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

    var options = {
        sort: true
    };
    myEngine.addScene('level',new Engine.Scene(generator, options));


    myEngine.load(AssetList, function() {
        // Create a sprite sheet out of the loaded assets
        myEngine.compileSheets('dino.png','dino.json');
        myEngine.compileSheets('smoke.png','smoke.json');
        myEngine.compileSheets('platformerSprites.png','platformerSprites.json');
        myEngine.compileSheets('ufos.png','ufos.json');
        myEngine.compileSheets('textures.png','textures.json');
        myEngine.compileSheets('fatman.png','fatman.json');

        // Assign animation data for sprites named 'player'
        myEngine.addAnimationData( DinoAnimationGroupName, DinoAnimationSequences );
        myEngine.addAnimationData( SmokeAnimationGroupName, SmokeAnimationSequences );
        myEngine.addAnimationData( UFOAnimationGroupName, UFOAnimationSequences );
        myEngine.addAnimationData( BombAnimationGroupName, BombAnimationSequences );

        // Start the level
        myEngine.stageScene("level");

        // Setup level to loop
        myEngine.setGameLoop(function(dt) {
            myEngine.stageGameLoop(dt);
            //call ufomanager, spawn one every few secs

        });

    });

}
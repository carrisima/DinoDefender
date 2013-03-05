//App.js file
//main game logic with game objects, stage, level etc.
//would like to reorg code someday...really

var app = app || {};
app.run = function (){

    var myEngine,
        thisDinoModel = app.dinoModel,
        canvasH,
        canvasW,
        canvasDims,
        isActiveUFO,
        bombTime = 0,
        isActiveBomb = false,
        dinoHits = 0,
        dinoHealth = 300,
        gameTime = 0,
        gameOverTime =10,
        gameOver = false;
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
    // Resources
    //=========================================================================

    AssetList = [
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

    app.drawBackgroundCanvas();

    myEngine = thisDinoModel.setUpEngine();
    canvasDims = thisDinoModel.setUpGameCanvas();
    canvasH = canvasDims.canvasH;
    canvasW = canvasDims.canvasW;

//=========================================================================
// Setup Input
//=========================================================================
    myEngine.input.enableMouse();
    myEngine.input.setKeyboardControls();

    //=========================================================================
    //Game Object Definitions

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
            groupIndex: -1,
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
            shape_width: 45,
            shape_height: 20,
            restitution: .5,
            density: 4,
            bodyType: "kinematic",
            groupIndex: -1

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
                    this.physics.setPosition(p.x, p.y - p.speed * dt);
                    if(p.y < canvasH - 200){
                        p.hopDir = "down";
                    }
                }
                else if(p.hopDir === "down"&& p.hopping === true)
                {
                    this.physics.setPosition(p.x, p.y + p.speed * dt);
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

                this.play("zapped");
                dinoHealth -= 5;

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
            z:22,

            // physics properties
            shape: "block",
            shape_width: 20,
            shape_height: 35,
            restitution: .5,
            density: 4,
            bodyType: "kinematic",
            groupIndex: -2,
            // gameplay properties
            seconds: 3		// lifetime before drop
        },

        init: function(props) {
            this._super(props);
            this.addComponent('animation');
            this.play( "twirl" );
            this.addComponent('physics');
            this.bindEvent('contact',this,'checkHit');
            isActiveBomb = true;
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
                    isActiveBomb = false;
                }
            }
            else
            {
                this.parentStage.remove(this);
            }

            if(myEngine.getStage().blueUFO.properties.beenHit === true)
            {
                this.parentStage.remove(this);
                isActiveBomb = false;
            }

            this._super(dt);
        },

        checkHit: function(sprite) {
            if(sprite instanceof ClassFireBall) {
                //targetCount--;
                this.beenHit = true;
                dinoHits += 5;
                isActiveBomb = false;
                this.parentStage.remove(this);
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


    //-------------------------------------------------------------------------
    // Game Object - BlueUFO
    //-------------------------------------------------------------------------

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
           //physics properties
            shape: "circle",
            shape_radius: 20,
            restitution:.75,
            density: 4,
            bodyType: "kinematic",
            groupIndex: -2,
            //gameplay properties
            beenHit: false,
            seconds: 2
        },

        init:function(props) {
            this._super(props);

            this.addComponent('animation');
            this.addComponent('physics');
            this.bindEvent('contact',this,'checkHit');
            this.bindEvent('animLoop.fly',this,function() { console.log("fly"); });
            isActiveUFO = true;

        },

        checkHit: function(sprite) {
            if(sprite instanceof ClassFireBall) {
                //targetCount--;
                this.beenHit = true;
                dinoHits += 10;
                this.physics.makeDynamic();


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

                if(p.y >= canvasH-71){
                    this.properties.seconds -= dt;
                    if(this.properties.seconds < 1 && this.properties.seconds > 0) {
                        this.properties.alpha = this.properties.seconds;
                    } else {
                        this.parentStage.remove(this);
                        isActiveUFO=false;
                    }
                }
            }


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
       // stage.world.toggleDebugDraw(true);

        //todo create Bomb Manager function


        var newPlayer = new DinoClassPlayer( {z:10});
        stage.dinoPlayer = newPlayer;
        stage.insert( newPlayer );

        //draw boundaries so UFOs & fireballs are contained
        var sky = new BoundrySprite( {z:1, x: canvasW/2, y: -200, shape_width: canvasW,
                shape_height: 100}),
            ground = new BoundrySprite( {z:1, x: canvasW/2, y: canvasH - 25, shape_width: canvasW,
            shape_height: 50}),
            leftBoundry = new BoundrySprite( {z:1, x: -48, y:100, shape_width: 50,
            shape_height: canvasH + 200}),
            rightBoundry = new BoundrySprite( {z:1, x: canvasW + 48, y: 100, shape_width: 50,
            shape_height: canvasH + 200});
        //x offset 48
        stage.insert( sky );
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
            //physics properties
            groupIndex: -1,
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


      /*  var newUFO = new UFO( {
            x: 100,
            y: 50,
            z:8,
            id: "MrBlue"
        } );

        stage.blueUFO = newUFO;
        stage.insert( newUFO );*/


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
            if(!gameOver){
                manageUFOs();
                bombManager(dt);
                gameOver = manageGameTime(dt);
            }
            else if(gameOver)
            {
                alert("Game Over!");
            }

        });

        //////////////////////////////////////////////////////////////////////////////
        // Assorted management functions
        //////////////////////////////////////////////////////////////////////////////

        //launch new UFOs when the old ones are destroyed
        function manageUFOs(){
            if(!isActiveUFO){

                var newUFO = new UFO( {
                    x: 100,
                    y: 50,
                    z:8,
                    id: "MrBlue"
                } );

                myEngine.getStage().blueUFO = newUFO;
                myEngine.getStage().insert( newUFO );
            }
        }

        //launch a new bomb every 3 seconds or so
        function bombManager(dt){

            bombTime -= dt;
            //console.log("dt: " + dt + " bombTime: " + bombTime);
            if ( bombTime < 0 && isActiveBomb === false && isActiveUFO){
                bombTime = 3;
                var newBomb = new ClassFatMan({ x: myEngine.getStage().blueUFO.properties.x,
                    y: myEngine.getStage().blueUFO.properties.y + 25});
                myEngine.getStage().insert( newBomb );
                isActiveBomb = true;
            }
        }

        function manageGameTime(dt){
            var minGameTime;
            gameTime += dt;
            minGameTime = Math.floor(gameTime);
            $('#timer').html("<p>gametime: " + minGameTime + "</p>");
            console.log("gametime: " + minGameTime);
            if(minGameTime > gameOverTime){
                return true;
            } else {
                return false;
            }

        }

    });

}




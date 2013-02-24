/*
  Loader.js

  Manages loading of scripts and resources.
*/

//*****************************************************************************

var appLoader = (function() {

	//*****************************************************************************
	var EngineFiles = [

		// Required engine libraries
		"js_libraries/jquery.min.js",
		"js_libraries/underscore-min.js",
		"js_libraries/Box2dWeb-2.1.a.3.min.js",


		// Core Engine Systems
		"js_engine/core/util.js",
		"js_engine/core/stacktrace.js",
		"js_engine/core/class.js",

		// Engine initial entry point, must come first
		"js_engine/engine.js",

		// Base Engine Systems
		"js_engine/evented.js",
		"js_engine/components.js",
		"js_engine/entity.js",
		"js_engine/canvas.js",
		"js_engine/assets.js",

		// Engine Modules
		"js_engine/module_input.js",
		"js_engine/module_sprites.js",
		"js_engine/module_scenes.js",
		"js_engine/module_physics.js",
		"js_engine/module_svg.js",
		"js_engine/module_anim.js",

        //Other game files
        "js_gamefiles/BackgroundCanvas.js",
        "js_gamefiles/CanvasGraphics.js",
        "js_gamefiles/game_animations.js",
        "js_gamefiles/App.js"
	];

	//=========================================================================
	function set_visibility(id, value) {
		var e = document.getElementById(id);
		e.style.display = value;
	}

         
    //=========================================================================
	var getProgressFn;

	function runProgressMeter( getProgress )
	{
		getProgressFn = getProgress;
		updateProgressMeter( );
	}

    //=========================================================================

	function updateProgressMeter( )
	{
		var progressIndicator = document.getElementById("progressIndicator");
		var pct = 100 * getProgressFn( );
		if ( pct < 100 )
		{
			//progress.show( );
			set_visibility( "splashScreen", "block" );
			progressIndicator.style.width = pct + "%" ;
			setTimeout( updateProgressMeter, 30 );
		}
		else
		{
			progressIndicator.style.width = "100%" ;
			setTimeout( startGame, 300 );
		}
	}

	//=========================================================================

	function startGame( )
	{
		/*
		// Hide Progress element
		set_visibility( "splashScreen", "none" );

		// Let the user choose which game to load
		set_visibility( "Launcher", "block" );
		*/
	}



	//=========================================================================

	function loadEngine( )
	{
		var numResourcesLoaded = 0;
		var totalResources = EngineFiles.length;
	/*	runProgressMeter( function() {
			if ( totalResources > 0 ) {
				return numResourcesLoaded / totalResources;
			} else {
				return 1;
			}
		});*/

		Modernizr.load(
			[
				// {
					// test: navigator.appName.match(/Explorer/),
					// yep: "jquery.min.js",
					// nope: "zepto.min.js"
				// },
				{
					load: EngineFiles,

					callback: function( url, result, key )
					{
						++numResourcesLoaded;
					},

					complete: function()
					{
						console.log( "Game Engine Files loaded!");
                        App.run();
					}
				}
			]
		);
	}


	//=========================================================================
	return {
		loadEngine: loadEngine
	};

})();	// run immediately


//*****************************************************************************


appLoader.loadEngine( );


//*****************************************************************************

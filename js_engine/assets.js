//*****************************************************************************
// Asset Management
//
// In charge of loading Images, Audio, and other data files (JSON)
//
// Required Systems:
//  Engine
//
// Required libraries:
//  Underscore
//  JQuery
//
//*****************************************************************************

// Requires Engine namespace
(function() {
	if( Engine === undefined ) {
		console.error( "No Engine Definition" );
	}
})();


//*****************************************************************************
// Static objects/functions
//*****************************************************************************

// Augmentable list of asset types
// This is to decide what type of asset a file is based on it's extension
Engine.assetTypes = {
	// Image Assets
	png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
	// Audio Assets
	ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio'
};

Engine.audioMimeTypes = { mp3: 'audio/mpeg',
						ogg: 'audio/ogg; codecs="vorbis"',
						m4a: 'audio/m4a',
						wav: 'audio/wav' };

// Determine the type of an asset with a lookup table
Engine.assetType = function(asset) {
	// Determine the lowercase extension of the file
	var fileExt = _(asset.split(".")).last().toLowerCase();

	// Lookup the asset in the assetTypes hash, or return other
	return Engine.assetTypes[fileExt] || 'Other';
};

// Return a name without an extension
Engine._removeExtension = function(filename) {
	return filename.replace(/\.(\w{3,4})$/,"");
};


//*****************************************************************************
// Engine functions
//*****************************************************************************

//=========================================================================
// Loader for Image files
// Required:
// * key
// * src
// Optional:
// * onLoadCallback - gets linked to the load event. Takes the key and Image object as parameters
// * onErrorCallback
Engine.prototype.loadAssetImage = function(key, src, onLoadCallback, onErrorCallback) {
	//console.log(this.options.imagePath + src);
    var img = new Image();		// Image is an HTML5 object
	$(img).on('load', function() { onLoadCallback(key,img); });
	$(img).on('error', onErrorCallback);
	img.src = this.options.imagePath + src;

};

//=========================================================================
// Loader for Audio files
// Required:
// * key
// * src
// Optional:
// * onLoadCallback - gets linked to the load event. Takes the key and Image object as parameters
// * onErrorCallback
Engine.prototype.loadAssetAudio = function(key, src, onLoadCallback, onErrorCallback) {

	// Check for audio support. If non then return
	if(!document.createElement("audio").play || !this.options.sound) {
		onLoadCallback(key,null);
		return;
	}

	var snd = new Audio(),
			baseName = Engine._removeExtension(src),
			extension = null,
			filename = null;

	// Find a supported type
	extension =
		_(this.options.audioSupported)
		.detect(function(extension) {
			return snd.canPlayType(Engine.audioMimeTypes[extension]) ? extension : null;
	});

	// No supported audio = trigger ok callback anyway
	if(!extension) {
		onLoadCallback(key,null);
		return;
	}

	// If sound is turned off,
	// call the callback immediately
	$(snd).on('error',onErrorCallback);
	$(snd).on('canplaythrough',function() {
		onLoadCallback(key,snd);
	});
	snd.src = this.options.audioPath + baseName + "." + extension;
	snd.load();
	return snd;
};

//=========================================================================
// Loader for other file types, just store the data returned from an ajax call
// Required:
// * key
// * src
// Optional:
// * onLoadCallback - gets linked to the load event. Takes the key and Image object as parameters
// * onErrorCallback
Engine.prototype.loadAssetOther = function(key, src, onLoadCallback, onErrorCallback) {
	$.get(this.options.dataPath + src,function(data) {
		onLoadCallback(key,data);
	}).fail(onErrorCallback);
};


//=========================================================================
// Getter for an asset by name
// Use this over accessing the assets array directly just in case there
// are no assets loaded, or so the user can overwrite this function
// for particular a asset name (example: dynamically generated assets).
Engine.prototype.getAsset = function(name) {
	if( this.assets === undefined ) {
		console.error( "No Assets loaded! Error looking for asset name", name);
		return;
	}
	return this.assets[name];
};

//=========================================================================
// Load a list of assets, and call our callback when done
// Required:
// * assetList - a string or array or asset filenames to load
// Optional:
// * onFinishedCallback - triggered once all assets are finished loading
// * options - other parameters: { onErrorCallback, onProgressCallback }
Engine.prototype.load = function(assetList, onFinishedCallback, options) {

	// There are a number of callbacks that will have their context
	// and still need to refer to the original this
	var engine = this;

	// Asset hash storing any loaded assets
	if( engine.assets === undefined ) {
		engine.assets = {};
	}

	// Make sure we have an options hash to work with
	if(!options) { options = {}; }

	// Get our progressCallback if we have one
	var progressCallback = options.onProgressCallback;

	// Error handling - we stop loading assets once there is an error
	// and also trigger the errorCallback or default to an alert
	var errors = false,
		errorCallback = function(itemName) {
			errors = true;
			(options.onErrorCallback  ||
			function(itemName) { alert("Error Loading: " + itemName ); })(itemName);
		};

	// Copy over assetList into a local object.
	// If the user passed in an array, convert it
	// to a hash with lookups by filename
	var assetObj = {};
	if(_.isArray(assetList)) {
		_.each(assetList,function(itemName) {
			if(_.isObject(itemName)) {
				_.extend(assetObj,itemName);
			} else {
				assetObj[itemName] = itemName;
			}
		});
	} else if(_.isString(assetList)) {
		// Turn assets into an object if it's a string
		assetObj[assetList] = assetList;
	} else {
		// Otherwise just use the assets as is
		assetObj = assetList;
	}

	// Find the # of assets we're loading
	var assetsTotal = _(assetObj).keys().length,
		assetsRemaining = assetsTotal;

	// Closure'd per-asset callback gets called
	// each time an asset is successfully loadded
	var assetLoadedCallback = function(key,obj) {
		if(errors) return;

		// Add the object to our asset list
		engine.assets[key] = obj;

		// We've got one less asset to load
		assetsRemaining--;

		// Update our progress if we have it
		if(progressCallback) {
			progressCallback(assetsTotal - assetsRemaining,assetsTotal);
		}

		// If we're out of assets, call our full callback
		// if there is one
		if(assetsRemaining === 0 && onFinishedCallback) {
			onFinishedCallback.apply(engine);
		}
	};

	// Now actually load each asset
	_.each(assetObj,function(itemName,key) {

		// Determine the type of the asset
		var assetType = Engine.assetType(itemName);

		// If we already have the asset loaded,
		// don't load it again but still trigger the callback to update our progress
		if(engine.assets[key]) {
			assetLoadedCallback(key,engine.assets[key]);
		} else {
			// Call the appropriate loader function
			// passing in our per-asset callback
			// Dropping our asset by name into this.assets
			var loadingFunctionName = "loadAsset" + assetType;
			engine[loadingFunctionName](key,itemName, assetLoadedCallback, function() { errorCallback(itemName); });
		}
	});

};

//=========================================================================
// Let us gather assets to load and then load them all at the same time
// Required:
// * assetList - string or array of assets to queue for loading
Engine.prototype.queueLoad = function( assetList ) {
	// Array to store any assets that need to be preloaded
	if( this.preloads === undefined ) {
		this.preloads = [];
	}

	this.preloads = this.preloads.concat(assetList);
};


//=========================================================================
// Tells the system to load all queued files
// Optional:
// * onFinishedCallback - triggered once all assets are finished loading
// * options - other parameters: { onErrorCallback, onProgressCallback }
Engine.prototype.loadQueuedFiles = function( onFinishedCallback, options ) {
	if( this.preloads !== undefined ) {
		this.load(_(this.preloads).uniq(),onFinishedCallback,options);
		this.preloads = [];
	}
};
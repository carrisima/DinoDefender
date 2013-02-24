//*****************************************************************************
// Canvas Management
//
// Used for accessing the Game Container Element
//
// Required Systems:
//  * Engine
//
// Required libraries:
// * JQuery
//
// Features:
// * Canvas access:
// - this.ctx, or this.getCanvas()
// * Wrapper element access:
// - this.el
//
// @TODO, CSS (Chapter 15)
// - image rendering function could take an object with parameters, instead of
// a long list of parameters (to futher support more options like shadows)
// - image-rendering to control resampling method
// - setting fill & stroke styles, drawing lines, curves, rects
// - creating an offscreen canvas
// - rendering text
// - shadow properties for drawing objects (or maybe not, they're expensive)
// - support for composite operations ()
// - Do we want to support a parameter for sprite center
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();


//*****************************************************************************
// Static objects/functions
//*****************************************************************************
var DEFAULT_ENGINE_ID = "defaultEngineID";
var DEFAULT_CANVAS_WIDTH = 800;
var DEFAULT_CANVAS_HEIGHT = 550;

//=========================================================================
// SetupCanvas - gets a handle to the render context
//
// accommodates different usage patterns:
// - called with no parameters
// - with an id of an element
// - with the element itself
//
// If it can't find an element, it creates a new <canvas> element
//
//=========================================================================
Engine.prototype.setupCanvas = function(id, options) {
	var touchDevice = 'ontouchstart' in document;
	options = options || {};
	id = id || DEFAULT_ENGINE_ID;

	this.el = $(_.isString(id) ? "#" + id : id);

	options.width = options.width || DEFAULT_CANVAS_WIDTH;
	options.height = options.height || DEFAULT_CANVAS_HEIGHT;
    options.setWidthHeight = options.setWidthHeight || true;

	if(options.setWidthHeight){
        if(this.el.length === 0) {
            this.el = $("<canvas width='" + options.width + "' height='" + options.height + "'></canvas>").attr('id',id).appendTo("body");
        }
    } else {
        this.el = $("<canvas></canvas>").attr('id',id).appendTo("body");
    }


	var maxWidth = options.maxWidth || 5000,
		maxHeight = options.maxHeight || 5000,
		resampleWidth = options.resampleWidth,
		resampleHeight = options.resampleHeight;

	if(options.maximize) {
		$("html, body").css({ padding:0, margin: 0 });
		var w = Math.min(window.innerWidth,maxWidth);
		var h = Math.min(window.innerHeight - 5,maxHeight);

		if(touchDevice) {
			this.el.css({height: h * 2});
			window.scrollTo(0,1);

			w = Math.min(window.innerWidth,maxWidth);
			h = Math.min(window.innerHeight - 5,maxHeight);
		}

		if(((resampleWidth && w > resampleWidth) ||
			(resampleHeight && h > resampleHeight)) &&
			touchDevice)
		{
			this.el.css({  width:w, height:h }).attr({ width:w/2, height:h/2 });
		}
		else
		{
			this.el.css({  width:w, height:h }).attr({ width:w, height:h });
		}
	}

	this.wrapper = this.el.wrap("<div id='" + id + "_container'/>");
				//.parent();
				//.css({ width: this.el.width(),
				//margin: '0 auto',
                //position:'absolute'});


	this.ctx = this.el[0].getContext && this.el[0].getContext("2d");


	if(touchDevice) {
		window.scrollTo(0,1);
	}
	this.width = parseInt(this.el.attr('width'),10);
	this.height = parseInt(this.el.attr('height'),10);

	$(window).bind('orientationchange',function() {
		setTimeout(function() { window.scrollTo(0,1); }, 0);
	});

	// returns the engine instance allowing it to be chained with further engine calls
	return this;
};

//=========================================================================
// Returns render context
//=========================================================================
Engine.prototype.getCanvas = function() {
	return this.ctx;
};

//=========================================================================
// Clears the entirety of the Canvas
//=========================================================================
Engine.prototype.clearCanvas = function() {
	this.ctx.clearRect(0,0,this.el[0].width,this.el[0].height);
};

//=========================================================================
// Renders a transformed image to the canvas at the given position
// posX, posY can be floating point, but will be floored to pixel coords
// angle is in radians
//=========================================================================
Engine.prototype.drawImage = function(image, posX, posY, width, height, angle, alpha) {

	width = width || image.width;
	height = height || image.height;
	angle = angle || 0;
	alpha = alpha || 1.0;

	posX = Math.floor(posX);
	posY = Math.floor(posY);

	//if( angle === undefined || angle === 0 ) {
	//	posX = posX - (width/2);
	//	posY = posY - (height/2);
	//	this.ctx.drawImage( image, Math.floor(posX), Math.floor(posY), width, height );
	//	return;
	//}

	// save the current co-ordinate system before we screw with it
	//this.ctx.save();
	this.ctx.globalAlpha = alpha;

	// move to the middle of where we want to draw our image
	this.ctx.translate( posX, posY );

	// rotate around that point
	this.ctx.rotate( angle );

	// draw it up and to the left by half the width and height of the image
	this.ctx.drawImage( image, -(width/2), -(height/2), width, height );

	// and restore the co-ords to how they were when we began
	this.ctx.rotate( -angle );
	this.ctx.translate( -posX, -posY );
	this.ctx.globalAlpha = 1.0;
	//this.ctx.restore();
};

//=========================================================================
// Renders a transformed image to the canvas at the given position
// posX, posY can be floating point, but will be floored to pixel coords
// angle is in radians
//=========================================================================
Engine.prototype.drawClippedImage = function(image, sx, sy, tilew, tileh, posX, posY, width, height, angle, alpha ) {

	width = width || tilew;
	height = height || tileh;

	//if( angle === undefined || angle === 0 ) {
	//	this.ctx.drawImage( image, sx, sy,
	//		tilew, tileh,
	//		Math.floor(posX), Math.floor(posY),
	//		width, height );
	//	return;
	//}

	// save the current co-ordinate system before we screw with it
	//this.ctx.save();

	this.ctx.globalAlpha = alpha;

	// move to the middle of where we want to draw our image
	this.ctx.translate( posX, posY );

	// rotate around that point
	this.ctx.rotate( angle );

	// draw it up and to the left by half the width and height of the image
	this.ctx.drawImage( image, sx, sy,
		tilew, tileh,
		-(width/2), -(height/2),
		width, height );

	// and restore the co-ords to how they were when we began
	this.ctx.rotate( -angle );
	this.ctx.translate( -posX, -posY );
	this.ctx.globalAlpha = 1.0;
	//this.ctx.restore();
};



// // Hack test - try to change color of sprite
// var data = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), this.getAsset().width, this.getAsset().height);
// for (var i = 0, length = data.data.length; i < length; i += 4) {	// step over only red channel
//	data.data[i] = 0; // remove all red //Math.max(255, data.data[i]); // increase all red
// }
// ctx.putImageData(data, Math.floor(pos.x)+ 10, Math.floor(pos.y));


// @TODO, centralize canvas drawing functions
// setup support for parameters to this (fill color/style, line Width, stroke)
// if( this.properties.width && this.properties.height ) {
//	var leftX = p.x - this.properties.width / 2,
//		topY = p.y - this.properties.height / 2;
//	ctx.beginPath();
//	ctx.rect(leftX, topY, this.properties.width, this.properties.height);
//	ctx.fillStyle = 'yellow';
//	ctx.fill();
//	ctx.lineWidth = 7;
//	ctx.strokeStyle = 'black';
//	ctx.stroke();
//}
//*****************************************************************************
// SVG Render Module
//
// A scalable vector graphics
//
// Required Systems:
// * Engine
// * Sprite Module
//
// Required libraries:
// * Underscore
// * JQuery
//
// Features:
// * SVGSprite
// * SVGStage
// * SVG Engine Module
//*****************************************************************************

// Requires Engine namespace
(function() {
	engineAssert( Engine, "No Engine Definition" );
})();

//=========================================================================
// SVG Engine Module
//
//=========================================================================
Engine.SVG = function() {

	//*****************************************************************************
	// Static objects/functions
	//*****************************************************************************
	var SVG_NS ="http://www.w3.org/2000/svg";

	//=========================================================================
	// SVG Sprite Entity/GameObject
	//
	//=========================================================================
	Engine.SVGSprite = Engine.Sprite.extend({

		// Class name, for debugging
		name: "SVGSprite",

		defaults: {
			shape: 'block',
			color: 'black',
			angle: 0,
			active: true,
			cx: 0,
			cy: 0
		},

		init: function(props) {
			this._super(props);
			this.createShape();
			this.svg.sprite = this;
			this.rp = {};
			this.setTransform();
		},

		set: function(attr) {
			_.each(attr,function(value,key) {
				this.svg.setAttribute(key,value);
			},this);
		},
		
		createShape: function() {
			var p = this.properties;
			switch(p.shape) {
				case 'block':
					engineAssert( p.shape_width, "SVGSprite: 'block' type requires shape_width property" );
					engineAssert( p.shape_height, "SVGSprite: 'block' type requires shape_height property" );
					this.svg = document.createElementNS(SVG_NS,'rect');
					_.extend(p,{ cx: p.shape_width/2, cy: p.shape_height/2 });
					this.set({ width: p.shape_width, height: p.shape_height });
					break;
				case 'circle':
					this.svg = document.createElementNS(SVG_NS,'circle');
					this.set({ r: p.shape_radius, cx: 0, cy: 0 });
					break;
				case 'polygon':
					this.svg = document.createElementNS(SVG_NS,'polygon');
					var pts = _.map(p.shape_points, function(pt) {
						return pt[0] + "," + pt[1];
					}).join(" ");
					this.set({ points: pts });
					break;
					
			}
			this.set({ fill: p.color });
			if(p.outline) {
				this.set({
					stroke: p.outline,
					"stroke-width": p.outlineWidth || 1
				});
			}
		},

		setTransform: function() {
			var p = this.properties;
			var rp = this.rp;
			if(rp.x !== p.x ||
				rp.y !== p.y ||
				rp.angle !== p.angle ) {
				var transform = "translate(" + (p.x - p.cx) + "," + (p.y - p.cy) + ") " +
								"rotate(" + p.angle + "," + p.cx + "," + p.cy + ")";
				this.svg.setAttribute('transform',transform);
				rp.angle = p.angle;
				rp.x = p.x;
				rp.y = p.y;
			}
		},

		// overwrite base class function without calling into it
		// because Sprite draw uses canvas which we do not want
		draw: function(ctx) {
			this.triggerEvent('draw');
		},

		step: function(dt) {
			this.triggerEvent('step',dt);
			this.setTransform();
		},

		destroy: function() {
			if(this.destroyed) return false;
			this._super();
			this.parentStage.svg.removeChild(this.svg);
		}
	});

	//=========================================================================
	// SVG Stage
	//
	//=========================================================================
	Engine.SVGStage = Engine.Stage.extend({

		// Class name, for debugging
		name: "SVGStage",

		init: function(scene) {
			this.engine = Engine.GetCurrentInstance();

			this.svg = document.createElementNS(SVG_NS,'svg');
			this.svg.setAttribute('width',this.engine.width);
			this.svg.setAttribute('height',this.engine.height);
			this.engine.svg.appendChild(this.svg);
			
			this.viewBox = { x: 0, y: 0, w: this.engine.width, h: this.engine.height };
			this._super(scene);
		},

		insert: function(itm) {
			if(itm.svg) { this.svg.appendChild(itm.svg); }
			return this._super(itm);
		},

		destroy: function() {
			this.engine.svg.removeChild(this.svg);
			this._super();
		},

		viewport: function(w,h) {
			this.viewBox.w = w;
			this.viewBox.h = h;
			if(this.viewBox.cx || this.viewBox.cy) {
				this.centerOn(this.viewBox.cx,
											this.viewBox.cy);
			} else {
				this.setViewBox();
			}
		},

		centerOn: function(x,y) {
			this.viewBox.cx = x;
			this.viewBox.cy = y;
			this.viewBox.x = x - this.viewBox.w/2;
			this.viewBox.y = y - this.viewBox.h/2;
			this.setViewBox();
		},

		setViewBox: function() {
			this.svg.setAttribute('viewBox',
														this.viewBox.x + " " + this.viewBox.y + " " +
														this.viewBox.w + " " + this.viewBox.h);
		},

		browserToWorld: function(x,y) {
			var m = this.svg.getScreenCTM();
			var p = this.svg.createSVGPoint();
			p.x = x; p.y = y;
			return p.matrixTransform(m.inverse());
		}
	});


	//=========================================================================
	// SVG Engine Module
	//
	//=========================================================================
	Engine.prototype.setupSVG = function(id,options) {
		options = options || {};
		id = id || "quintus";
		this.svg = $(_.isString(id) ? "#" + id : id)[0];
		if(!this.svg) {
			console.log( "Creating SVG element" );
			this.svg = document.createElementNS(SVG_NS,'svg');
			this.svg.setAttribute('width',320);
			this.svg.setAttribute('height',420);
			document.body.appendChild(this.svg);
		}

		if(options.maximize) {
			var w = $(window).width()-1;
			var h = $(window).height()-10;
			this.svg.setAttribute('width',w);
			this.svg.setAttribute('height',h);
		}

		this.width = this.svg.getAttribute('width');
		this.height = this.svg.getAttribute('height');
		this.wrapper = $(this.svg)
						.wrap("<div id='" + id + "_container'/>")
						.parent()
						.css({ width: this.width, height: this.height, margin: '0 auto' });

		setTimeout(function() { window.scrollTo(0,1); }, 0);
		$(window).bind('orientationchange',function() {
			setTimeout(function() { window.scrollTo(0,1); }, 0);
		});
		return this;
	};

	Engine.prototype.svgOnly = function() {
		Engine.Stage = Engine.SVGStage;
		Engine.Sprite = Engine.SVGSprite;
		return this;
	};
};
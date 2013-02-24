/*
  CanvasGraphics.js

  Graphics routines with HTML canvas.
*/



//*****************************************************************************



//Our one global object:
var app = app || { };



//=============================================================================



app.graphics =
    (function()
     {
    //-------------------------------------------------------------------------

         var ctx;
         
    //=========================================================================

         function setContext( context )
         {
             ctx = context;
         }

        //-------------------------------------------------------------------------


         function circle( x, y, radius )
         {
             ctx.moveTo( (x + radius), y );
             ctx.arc( x, y, radius, 0, Math.PI * 2 );
         }
         
    //-------------------------------------------------------------------------

         function strokeCircle( x, y, radius )
         {
             ctx.beginPath( );
             circle( x, y, radius );
             ctx.stroke( );
         }
         
    //-------------------------------------------------------------------------

         function fillCircle( x, y, radius )
         {
             ctx.beginPath( );
             circle( x, y, radius );
             ctx.fill( );
         }
         
    //=========================================================================

         function roundedRect( x, y, width, height, radius )
         {
             ctx.moveTo( x, (y + radius) );
             ctx.arc( (x + radius), (y + radius), radius,
                      Math.PI, Math.PI * 3/2 );
             ctx.arc( (x + width - radius), (y + radius), radius,
                      Math.PI * 3/2, 0 );
             ctx.arc( (x + width - radius), (y + height - radius), radius,
                      0, Math.PI * 1/2 );
             ctx.arc( (x + radius), (y + height - radius), radius,
                      Math.PI * 1/2, Math.PI );
             ctx.lineTo( x, (y + radius) );
         }

    //-------------------------------------------------------------------------

         function strokeRoundedRect( x, y, width, height, radius )
         {
             ctx.beginPath( );
             roundedRect( x, y, width, height, radius );
             ctx.stroke( );
         }

    //-------------------------------------------------------------------------

         function fillRoundedRect( x, y, width, height, radius )
         {
             ctx.beginPath( );
             roundedRect( x, y, width, height, radius );
             ctx.fill( );
         }

    //create a path for a rectangle with rounded edges, of radius r, that has a big funky gap in the middle
         function funkyRoundRect ( x, y, w, h, r) {
           ctx.moveTo( x+r, y );
           ctx.lineTo( (x+w-r), y );
           ctx.arc((x+w-r),(y+r), r ,(1.5*Math.PI), 0);
           ctx.moveTo ( (x+w), (y+r));
           ctx.lineTo ((x+w), ( y+h-r));
           ctx.arc((x+w-r),(y+h-r), r ,0, (0.5*Math.PI) );
           ctx.moveTo ( (x+w-r), (y+h));
           ctx.lineTo ((x+r), ( y+h));
           ctx.arc((x+r),(y+h-r), r ,(0.5*Math.PI),Math.PI );
           ctx.moveTo ( x, (y+h-r));
           ctx.lineTo (x, ( y+r));
           ctx.arc((x+r),(y+r), r ,Math.PI,(1.5*Math.PI) );
         }
	
	//create a rectangle with rounded edges that has a funky gap in the middle
   	  function fillFunkyRoundRect ( x, y, w, h, r) {
           ctx.beginPath( );
           funkyRoundRect(x, y, w, h, r);
           ctx.fill( );
       }
	   
	//=========================================================================
    //Public API
	
	
        return {
            setContext: setContext,
            circle: circle,
            strokeCircle: strokeCircle,
            fillCircle: fillCircle,
            roundedRect: roundedRect,
            strokeRoundedRect: strokeRoundedRect,
            fillRoundedRect: fillRoundedRect,
			funkyRoundRect : funkyRoundRect,
			fillFunkyRoundRect : fillFunkyRoundRect
        };
         
    //-------------------------------------------------------------------------
     }
)();



//*****************************************************************************

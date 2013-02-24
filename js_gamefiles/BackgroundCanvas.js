/*
  BackgroundCanvas.js

  About screen for the game.
*/

//*****************************************************************************



var app = app || { };


//*****************************************************************************

app.drawBackgroundCanvas = function(){

      var canvas = $("<canvas />")[0],
	  	  ctx = canvas.getContext("2d"),
		  boardDiv = $("#backgroundDiv"),
          //pink, cream, lavender ,teal, rose
          colors = ['#F73357', '#ECF8A5', '#A496F7', '#0BD2E1', '#EA68D0'],
		  cirX, cirY, cirR, cirDiff, color1, color2,
          cirR2, cirR3;
		  
      
	  canvas.width = boardDiv.width();
	  canvas.height = boardDiv.height();
	  $(canvas).appendTo( boardDiv );
	  
	  
	  //create background of random sized and placed circles, colored with a selection of colors
	  for(var i=0;i<=140;i++){
	      cirR = app.getRandom(80, 150);
		  cirX = app.getRandom(0, canvas.width + cirR);
		  cirY = app.getRandom(0, canvas.height + cirR);
		  color1 = app.getRandom(0, 5, -1);
		  ctx.globalAlpha = 0.25;
		  ctx.fillStyle = colors[color1];
		  app.graphics.setContext(ctx);
          app.graphics.fillRoundedRect( cirX, cirY, cirR, cirR, cirR/10 );

		  //pulling out code to make squares related, just do random squares
		    //app.graphics.fillCircle(cirX, cirY, cirR);
		  /*color2 = color1;
		  color1 = app.getRandom(0, 5, color2);
		  ctx.fillStyle = colors[color1];
		  app.graphics.setContext(ctx);
          cirR2 = cirR - 5;
          app.graphics.fillRoundedRect( cirX + cirR/2, cirY + cirR/2, cirR2, cirR2, cirR2/10 );
          //app.graphics.fillCircle(cirX, cirY, (cirR - 5) );
		  color2 = color1;
		  color1 = app.getRandom(0, 5);
		  
		  ctx.fillStyle = colors[color1];
		  app.graphics.setContext(ctx);
          cirR3 = cirR - (0.33*cirR);
          app.graphics.fillRoundedRect( cirX + cirR2/2, cirY + cirR2/2, cirR3, cirR3, cirR3/10 );
		  //app.graphics.fillCircle(cirX, cirY, (cirR - (0.33*cirR)));*/
      }
	  
	
	  
}
//returns a random number where M <= rand < N that is not equal to startNum
app.getRandom = function (M, N, startNum){

	var randNum;
	randNum = Math.floor( Math.random() * (N - M) ) + M;
	//make sure we get a number that is different from start number
	while (randNum  === startNum)
	{
	    randNum = Math.floor( Math.random() * (N - M) ) + M;
	}
	return randNum;
}

//*****************************************************************************

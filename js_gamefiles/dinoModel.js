/*
  dinoModel.js
  Trying to move as much as possible out of app.run(), messy
  Model for setting up game and controlling game values
  really
*/

//*****************************************************************************


//Global objects:
var app = app || {};


//=============================================================================

app.dinoModel =
    (function () {
        //-------------------------------------------------------------------------
        //Private variables

        var activeUFO,
            activeEngine,
            activeStage,
            canvasH,
            canvasW;





        //=========================================================================
        //Accessors

        function setActiveUFO(isActive){
            activeUFO = isActive;
        }
        //-------------------------------------------------------------------------
        function getActiveUFO(){
            return activeUFO ;
        }
        //-------------------------------------------------------------------------

        function setActiveEngine(myEngine){
            activeEngine = myEngine;
        }
        //-------------------------------------------------------------------------
        function getActiveEngine(){
            return activeEngine ;
        }
        //-------------------------------------------------------------------------
        function setWidthHeight(w,h){
            canvasH = h;
            canvasW = w;
        }
        //-------------------------------------------------------------------------
        function getWidthHeight(){
            return {
                    height:canvasH,
                    width:canvasW
                    } ;
        }




        //=========================================================================
        //Private Methods

        //-------------------------------------------------------------------------
        // Create Engine Instance
        //-------------------------------------------------------------------------
        function setUpEngine()
        {

            var engineConfig = {
                imagePath: "images/",
                audioPath: "audio/",
                dataPath:  "data/"
            };

            activeEngine = Engine( engineConfig );

            activeEngine.includeModule("Input, Sprites, Scenes, Animation, Physics");

            return activeEngine;
        }
        //-------------------------------------------------------------------------

        //=========================================================================
        // Setup Canvas
        //=========================================================================
        function setUpGameCanvas()
        {
            activeEngine.setupCanvas("gameCanvas");
            activeEngine.el.css('backgroundColor','#387FD1');
            //activeEngine.el.addClass("screen");
            canvasH = activeEngine.el.height();
            canvasW = activeEngine.el.width();

            activeEngine.el.addClass("screen");
            return {canvasW: canvasW,
                    canvasH: canvasH
                    }
        }


        //-------------------------------------------------------------------------
        //=========================================================================
        //Public API


        return {
            setActiveUFO: setActiveUFO,
            getActiveUFO: getActiveUFO,
            setActiveEngine: setActiveEngine,
            getActiveEngine: getActiveEngine,
            setUpEngine: setUpEngine,
            setWidthHeight: setWidthHeight,
            getWidthHeight: getWidthHeight,
            setUpGameCanvas:setUpGameCanvas


        };

        //-------------------------------------------------------------------------
    }
)();



//*****************************************************************************

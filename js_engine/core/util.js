
var AssertsEnabled = true;

(function() {

	if( AssertsEnabled ) {

		// Check the expression and use the console to error
		engineAssert = function(exp, message) {
			if( exp === undefined || exp === false ) {
				console.error(message);
			}
		};

	} else {
		// Empty function
		engineAssert = function(exp, message) { };
	}

})();


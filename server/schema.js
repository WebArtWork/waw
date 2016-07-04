var mongoose = require('mongoose');
/*Includes*/
/*Custom Includes*/
/*End Includes*/

var Schema = mongoose.Schema({
	/*Fields*/
	/*Custom Fields*/
	/*End Fields*/
});

/*Methods*/
/*Custom Methods*/
/*End Methods*/

/*Plugins*/
/*Custom Plugins*/
/*End Plugins*/

/*Recreatable Below*/
//var connection = mongoose.createConnection('mongodb://localhost/KickProjectPublicChat');
//module.exports = connection.model('NAMEOFSCHEMA', Schema);
module.exports = mongoose.model('NAMEOFSCHEMAC', Schema);
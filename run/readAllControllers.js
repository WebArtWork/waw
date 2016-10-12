module.exports = function(sd){
	console.log('READING CONTROLERS');
	for (var i = 0; i < sd.parts.length; i++) {
		sd.parts[i].controllers = require(sd.parts[i].src+'/controller.js');
		sd.parts[i].controllers.config(sd, sd.parts[i]);
	}
}
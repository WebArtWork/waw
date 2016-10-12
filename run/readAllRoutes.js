module.exports = function(sd){
	console.log('READING Routes');
	for (var i = 0; i < sd.parts.length; i++) {
		sd.parts[i].routes = require(sd.parts[i].src+'/router.js')(sd.app, sd.express, sd.parts[i].controllers);
	}
}
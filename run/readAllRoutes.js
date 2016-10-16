module.exports = function(sd){
	console.log('READING Routes');
	for (var i = 0; i < sd.parts.length; i++) {
		for (var j = 0; j < sd.parts[i].info.router.length; j++) {
			sd.parts[i][sd.parts[i].info.router[j].name] = require(sd.parts[i].src+sd.parts[i].info.router[j].src)(sd.app, sd.express, sd);
		}
	}
}
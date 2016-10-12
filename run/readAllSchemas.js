module.exports = function(sd){
	console.log('READING SCHEMAS');
	for (var i = 0; i < sd.parts.length; i++) {
		sd.parts[i].schema = require(sd.parts[i].src+'/schema.js');
	}
}
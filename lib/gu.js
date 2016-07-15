var fs = require('fs');
module.exports.ulfirst = function(str) {
	return typeof str != "undefined" ? (str += '', str[0].toLowerCase() + str.substr(1)) : '';
}
module.exports.createFolder = function(folder){
	if(!fs.existsSync(folder)) fs.mkdir(folder);
}
module.exports.createFile = function(src, dest, replace, callback){
	if(!fs.existsSync(dest)){
		fs.readFile(src, 'utf8', function(err, data) {
			if(replace.NAMEOFSCHEMAC){
				data = data.replace(/NAMEOFSCHEMAC/g, replace.NAMEOFSCHEMAC);
			}
			if(replace.NAMEOFSCHEMA){
				data = data.replace(/NAMEOFSCHEMA/g, replace.NAMEOFSCHEMA);
			}
			if(replace.name){
				data = data.replace(/PAGENAME/g, replace.name);
			}
			fs.writeFile(dest, data, function(err) {
				if(typeof callback == 'function') callback();
			});
		});
	}else if(callback) callback();
}
module.exports.createFileFromData=function(data, dest, callback) {
	fs.writeFile(dest, data, function(err) {
		if (typeof callback == 'function') callback();
	});
};
module.exports.rms=function(name) {
	return name && name.replace(/ /g, '') || '';
};
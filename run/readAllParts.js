var fs = require('fs');
var path = require('path');

var getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}
var isPart = function(src){
	if(fs.existsSync(src)) return true;
	else return false;
}

module.exports = function(sd, callback){
	var dirs = getDirectories(process.cwd() + '/server');
	sd.parts = [];
	for (var i = dirs.length - 1; i >= 0; i--) {
		if(!isPart(process.cwd() + '/server/'+dirs[i]+'/part.json')){
			dirs.splice(i,1);
		}else{
			sd.parts.push({
				src: process.cwd() + '/server/'+dirs[i],
				name: dirs[i]
			});
		}
	}
	callback();
}

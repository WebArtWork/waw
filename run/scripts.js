var fs = require('fs');
var path = require('path');
module.exports = function(sd){
	sd.folders = ['css','fonts','gen','html','img','js','lang','page'];
	sd.getDirectories = function(srcpath) {
		return fs.readdirSync(srcpath).filter(function(file) {
			return fs.statSync(path.join(srcpath, file)).isDirectory();
		});
	}
	sd.getFiles = function(srcpath) {
		return fs.readdirSync(srcpath).filter(function(file) {
			return fs.statSync(path.join(srcpath, file)).isFile();
		});
	}
	sd.isPart = function(src) {
		if (fs.existsSync(src)) return true;
		else return false;
	}
}
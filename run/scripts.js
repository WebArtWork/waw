module.exports = function(sd){
	sd.folders = ['css','fonts','gen','html','img','js','lang','page'];
	sd.getDirectories = function(srcpath) {
		return sd.fs.readdirSync(srcpath).filter(function(file) {
			return sd.fs.statSync(sd.path.join(srcpath, file)).isDirectory();
		});
	}
	sd.getFiles = function(srcpath) {
		return sd.fs.readdirSync(srcpath).filter(function(file) {
			return sd.fs.statSync(sd.path.join(srcpath, file)).isFile();
		});
	}
	sd.isPart = function(src) {
		if (sd.fs.existsSync(src)) return true;
		else return false;
	}
}
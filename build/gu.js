var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
module.exports.removeCodeByTag = function(dest, tag){
	var data = fs.readFileSync(dest, 'utf8');
	if (data.indexOf(tag) > -1){
		var newData = data.slice(0,data.indexOf('/*start_'+tag+'*/')-1)+data.slice(data.indexOf('/*end_'+tag+'*/')+tag.length+8,data.length);
		fs.writeFileSync(dest, newData, 'utf8');
	}
}
module.exports.getCodeByTag = function(dest, tag){
	var data = fs.readFileSync(dest, 'utf8');
	if(data.indexOf('/*start_'+tag+'*/')==-1) return false;
	return data.slice(data.indexOf('/*start_'+tag+'*/')+tag.length+11, data.indexOf('/*end_'+tag+'*/')-1);
}
module.exports.addCodeByTag = function(src, dest, tag){
	var data = fs.readFileSync(src, 'utf8');
	var newData = fs.readFileSync(dest, 'utf8');
	newData += '\n/*start_'+tag+'*/\n';
	newData += data;
	newData += '\n/*end_'+tag+'*/';
	fs.writeFileSync(dest, newData, 'utf8');
}
module.exports.addPieceCodeByTag = function(code, dest, tag){
	var newData = fs.readFileSync(dest, 'utf8');
	newData += '\n/*start_'+tag+'*/\n';
	newData += code;
	newData += '\n/*end_'+tag+'*/';
	fs.writeFileSync(dest, newData, 'utf8');
}
module.exports.translate = function(){
	
}
module.exports.getDirectories = function(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}
module.exports.getFiles = function(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isFile();
	});
}
module.exports.getPartInfo = function(part) {
	return fse.readJsonSync(process.cwd() + '/server/'+ part+'/part.json', {throws: false});
}


module.exports.writeFile = function(src, renames, dest, callback) {
	var data = fs.readFileSync(src, 'utf8');
	for (var i = 0; i < renames.length; i++) {
		data=data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
	}
	fs.writeFileSync(dest, data);
	if (typeof callback == 'function') callback();
}
module.exports.removeFile = function(src) {
	fs.unlinkSync(src);
}
module.exports.writeFileFromData = function(data, renames, dest, callback) {
	for (var i = 0; i < renames.length; i++) {
		data=data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
	}
	fs.writeFileSync(dest, data);
	if (typeof callback == 'function') callback();
}
module.exports.getFile = function(src, renames) {
	var data = fs.readFileSync(src, 'utf8');
	for (var i = 0; i < renames.length; i++) {
		data=data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
	}
	return data;
}
module.exports.log = function(message) {
	console.log(message);
}
module.exports.close = function(message) {
	console.log(message);
	process.exit(0);
}
/*
*	General Use scripts.
*/
var fs = require('fs');
var fse = require('fs-extra');
module.exports.removeCodeByTag = function(dest, tag){
	var data = fs.readFileSync(dest, 'utf8');
	if (data.indexOf(tag) > -1){
		var newData = data.slice(0,data.indexOf('/*start_'+tag+'*/')-1)+data.slice(data.indexOf('/*end_'+tag+'*/')+tag.length+8,data.length);
		fs.writeFileSync(dest, newData, 'utf8');
	}
}
module.exports.getCodeByTag = function(dest, tag){
	var data = fs.readFileSync(dest, 'utf8');
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
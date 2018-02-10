var sd = require(__dirname+'/../../sd')();
module.exports = function(name, type){
	name = name.replace(/\s+/g, '');
	var dest = process.cwd() + '/' + name;
	if (sd._fs.existsSync(dest)) return sd._close('Project Exists');
	sd._fse.copy(__dirname + '/' + type, dest, function() {
		sd._close('Your Project "' + name + '" is successfully created');		
	});
}
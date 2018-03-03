var sd = require(__dirname+'/../../sd')();
module.exports = function(name){
	name = name.replace(/\s+/g, '');
	var dest = process.cwd() + '/server/' + name;
	if (sd._fs.existsSync(dest)) return sd._close('Part Exists');
	sd._fse.copy(__dirname + '/repo', dest, function() {
		sd._fse.removeSync(dest+'/.git');
		var renames = [{
			from: 'CNAME',
			to: name.toLowerCase().capitalize()
		}, {
			from: 'NAME',
			to: name.toLowerCase()
		}];
		sd._readdir(dest, function(err, files) {
			if (files) {
				for (var i = 0; i < files.length; i++) {
					sd._writeFile(files[i], renames, files[i]);
				}
			};
			sd._close('Your Part "' + name + '" is successfully created');
		});
	});
}
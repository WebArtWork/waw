module.exports = function(sd){
	var dirs = sd._getDirectories(process.cwd() + '/server');
	sd._parts = [];
	sd._dependencies = [];
	for (var i = dirs.length - 1; i >= 0; i--) {
		var isIgnore = false;
		if(sd._config.ignoreParts){
			for (var j = 0; j < sd._config.ignoreParts.length; j++) {
				if(sd._config.ignoreParts[j].toLowerCase()==dirs[i].toLowerCase()){
					isIgnore = true;
					break;
				}
			}
		}
		if(isIgnore) continue;
		var dest = process.cwd() + '/server/'+dirs[i];
		if(sd._isPart(dest+'/part.json')){
			var info = sd._fse.readJsonSync(dest+'/part.json', {throws: false});
			if(!info) continue;
			var names = [];
			if(info.router){
				for (var k = 0; k < info.router.length; k++) {
					for (var j = 0; j < names.length; j++) {
						if(names[j]==info.router[k].name){
							console.log('Do not use diplicate names in the same part.');
							return process.exit(1);
						}
					}
					names.push(info.router[k].name);
				}
			}
			if(info.dependencies){
				for (var prop in info.dependencies) {
					var needToAdd = true;
					for (var j = 0; j < sd._dependencies.length; j++) {
						if(sd._dependencies[j]==prop){
							needToAdd = false;
							break;
						}
					}
					if(needToAdd) sd._dependencies.push({
						name: prop,
						version: info.dependencies[prop]
					});
				}
			}
			sd._parts.push({
				src: dest,
				name: dirs[i],
				info: info
			});
		}
	}
}
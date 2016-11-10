module.exports = function(sd){
	console.log('READING PARTS');
	var dirs = sd.getDirectories(process.cwd() + '/server');
	sd.parts = [];
	sd.dependencies = [];
	for (var i = dirs.length - 1; i >= 0; i--) {
		var dest = process.cwd() + '/server/'+dirs[i];
		if(!sd.isPart(dest+'/part.json')){
			dirs.splice(i,1);
		}else{
			var info = sd.fse.readJsonSync(dest+'/part.json', {throws: false});
			var names = [];
			if(info.router){
				console.log('LOAD ROUTING');
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
					for (var j = 0; j < sd.dependencies.length; j++) {
						if(sd.dependencies[j]==prop){
							needToAdd = false;
							break;
						}
					}
					if(needToAdd) sd.dependencies.push({
						name: prop,
						version: info.dependencies[prop]
					});
				}
			}
			sd.parts.push({
				src: dest,
				name: dirs[i],
				info: info
			});
		}
	}
}

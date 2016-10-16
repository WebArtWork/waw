module.exports = function(sd){
	console.log('READING PARTS');
	var dirs = sd.getDirectories(process.cwd() + '/server');
	sd.parts = [];
	for (var i = dirs.length - 1; i >= 0; i--) {
		var dest = process.cwd() + '/server/'+dirs[i];
		if(!sd.isPart(dest+'/part.json')){
			dirs.splice(i,1);
		}else{
			var info = sd.fse.readJsonSync(dest+'/part.json', {throws: false});
			var names = [];
			for (var k = 0; k < info.schema.length; k++) {
				for (var j = 0; j < names.length; j++) {
					if(names[j]==info.schema[k].name){
						console.log('Do not use diplicate names in the same part.');
						return process.exit(1);
					}
				}
				names.push(info.schema[k].name);
			}
			for (var k = 0; k < info.controller.length; k++) {
				for (var j = 0; j < names.length; j++) {
					if(names[j]==info.controller[k].name){
						console.log('Do not use diplicate names in the same part.');
						return process.exit(1);
					}
				}
				names.push(info.controller[k].name);
			}
			for (var k = 0; k < info.router.length; k++) {
				for (var j = 0; j < names.length; j++) {
					if(names[j]==info.router[k].name){
						console.log('Do not use diplicate names in the same part.');
						return process.exit(1);
					}
				}
				names.push(info.router[k].name);
			}
			for (var k = 0; k < info.socket.length; k++) {
				for (var j = 0; j < names.length; j++) {
					if(names[j]==info.socket[k].name){
						console.log('Do not use diplicate names in the same part.');
						return process.exit(1);
					}
				}
				names.push(info.socket[k].name);
			}
			sd.parts.push({
				src: dest,
				name: dirs[i],
				info: info
			});
		}
	}
}

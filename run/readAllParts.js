module.exports = function(sd){
	var dirs = sd.getDirectories(process.cwd() + '/server');
	sd.parts = [];
	for (var i = dirs.length - 1; i >= 0; i--) {
		if(!sd.isPart(process.cwd() + '/server/'+dirs[i]+'/part.json')){
			dirs.splice(i,1);
		}else{
			sd.parts.push({
				src: process.cwd() + '/server/'+dirs[i],
				name: dirs[i]
			});
		}
	}
}

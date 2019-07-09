const sd = require(__dirname+'/../helpers');
/*
*	Read
*/
	const sortPriority = function(a, b){
		if(typeof b.priority != 'number') return -1;
		if(typeof a.priority != 'number') return 1;
		if(a.priority < b.priority) return 1;
		return -1;
	}
	const read_part = function(name){
		let url = process.cwd()+'/server/'+name+'/part.json';
		if (sd.fs.existsSync(url)) {
			let config = JSON.parse(sd.fs.readFileSync(url));
			config.__dirname = process.cwd()+'/server/'+name+'/';
			return config;
		}else return false;
	}
/*
*	Start
*/
	const parts = sd.getDirectories(process.cwd()+'/server', true);
	for (let i = parts.length - 1; i >= 0; i--) {
		parts[i] = read_part(parts[i]);
		if(!parts[i]){
			parts.splice(i, 1);
		}
	}
	parts.sort(sortPriority);
	sd.each(parts, function(part, cbParts){
		sd.each(part.dependencies, function(each, dependency, cbInstall){
			sd.npmi(process.cwd(), each, dependency, cbInstall);
		}, cbParts);
	}, function(){
		sd.each(parts, function(part, cbParts){
			sd.each(part.router, function(router, cbRoutes){
				if (sd.fs.existsSync(part.__dirname+router.src)) {
					require(part.__dirname+router.src)(sd);
				}
				cbRoutes();
			}, cbParts);
		}, true);
	}, true);
/*
*	End of parts read
*/
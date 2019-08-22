const sd = require(__dirname+'/../helpers');
const sortPriority = function(a, b){
	if(a.priority < b.priority) return 1;
	return -1;
}
const read_part = function(location, root){
	let url = location+'/part.json';
	if (sd.fs.existsSync(url)) {
		let config;
		try{
			config = JSON.parse(sd.fs.readFileSync(url));
		}catch(err){
			return false;
		}
		config.__dirname = location+'/';
		config.__root = root;
		return config;
	}else return false;
}
const parts = sd.getDirectories(process.cwd()+'/server', true);
let unique = {};
for (let i = parts.length - 1; i >= 0; i--) {
	parts[i] = read_part(process.cwd()+'/server/'+parts[i], process.cwd());
	if(!parts[i] || unique[parts[i].name]){
		parts.splice(i, 1);
		continue;
	}
	unique[parts[i].name] = true;
	if(!parts[i].priority){
		parts[i].priority=0;
	}
}
let executers = [];
const fetch_part = (name, version)=>{
	if(!sd.wawConfig.packages[name]) sd.exit("Part "+name+" is not register, you can add it by 'waw set package PARTNAME REPOLINK'");
	if (sd.fs.existsSync(__dirname+'/'+name+'/'+version)){
		let part = read_part(__dirname+'/'+name+'/'+version, __dirname+'/'+name+'/'+version);
		if(part) parts.push(part);
		return;
	}
	executers.push(function(cb){
		sd.fetch(__dirname+'/'+name+'/'+version, sd.wawConfig.packages[name], err=>{
			if(err) sd.exit("Couldn't pull the repo for part "+name+", please verify that repo LINK is correct and you have access to it.");
			let part = read_part(__dirname+'/'+name+'/'+version, __dirname+'/'+name+'/'+version);
			if(part) parts.push(part);
			cb();
		});
	});
}
if(sd.config.parts){
	sd.each(sd.config.parts, (name, version)=>{
		if(unique[name]) return;
		unique[name] = true;
		fetch_part(name, version);
	});
}
sd.parallel(executers, function(){
	parts.sort(sortPriority);
	sd.parts = parts;
	sd.each(parts, function(part, cbParts){
		sd.each(part.dependencies, function(name, version, cbInstall){
			sd.npmInstall(part.__root, name, version, cbInstall);
		}, cbParts);
	}, function(){
		sd.each(parts, function(part, cbParts){
			sd.each(part.router, function(router, cbRoutes){
				if (sd.fs.existsSync(part.__dirname+router.src)) {
					require(part.__dirname+router.src)(sd);
				}
				cbRoutes();
			}, cbParts);
		}, function(){
			// server is up
		}, true);
	}, true);
});

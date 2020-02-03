#!/usr/bin/env node
const core_parts = {
	core: 'git@github.com:WebArtWork/core.git',
	sem: 'git@github.com:WebArtWork/sem.git'
};
const waw = {};
/*
*	Supportive
*/
	const fs = require('fs');
	waw.isDirectory = source => fs.lstatSync(source).isDirectory();
	waw.getDirectories = source => {
		if (!fs.existsSync(source)) {
			return []; 
		}
		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(waw.isDirectory);
	}
/*
*	Read Project Config
*/
	waw.config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		waw.config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		fs.mkdirSync(process.cwd()+'/client', { recursive: true });
		fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		let serverConfig = fs.readFileSync(process.cwd()+'/server.json');
		for(let each in serverConfig){
			waw.config[each] = serverConfig[each];
		}
	}
/*
*	Read Project Parts
*/
	waw.parts = waw.getDirectories(process.cwd()+'/server');
	for (let i = waw.parts.length-1; i >= 0; i--) {
		waw.parts[i] = waw.parts[i].split('\\').pop();
		let name = waw.parts[i];
		if (fs.existsSync(process.cwd()+'/server/'+name+'/part.json')) {
			waw.parts[i] = JSON.parse(fs.readFileSync(process.cwd()+'/server/'+name+'/part.json'));
			waw.parts[i].__root = process.cwd()+'/server/'+name;
		}else{
			waw.parts.splice(i, 1);
		}
	}
	for(let each in waw.config.parts){
		if (fs.existsSync(__dirname+'/server/'+each)) {
			if (fs.existsSync(__dirname+'/server/'+each+'/part.json')) {
				let part = JSON.parse(fs.readFileSync(__dirname+'/server/'+each+'/part.json'));
				part.__root = __dirname+'/server/'+each;
				waw.parts.unshift(part);
			}
		}
	}
	if(!waw.parts.length){
		for(let each in core_parts){
			if (fs.existsSync(__dirname+'/server/'+each+'/part.json')) {
				let part = JSON.parse(fs.readFileSync(__dirname+'/server/'+each+'/part.json'));
				part.__root = __dirname+'/server/'+each;
				waw.parts.unshift(part);
			}
		}
	}
	let read_part = function(part){
		if(part.router){
			let routers = [];
			if(Array.isArray(part.router)){
				for (var j = part.router.length - 1; j >= 0; j--) {
					if(typeof part.router[j] == 'object' && part.router[j].src){
						routers.push(part.router[j].src);
					}
				}
			}else if(typeof part.router == 'object' && part.router.src){
				routers.push(part.router.src);
			}else if(typeof part.router == 'string'){
				routers = part.router.split(' ');
			}
			for (var i = 0; i < routers.length; i++) {
				let route = require(part.__root+'/'+routers[i])
				if(typeof route == 'function') route(waw);
			}
		}
	}
	waw.parts.sort(function(a, b){
		if(a.priority < b.priority) return 1;
		return -1;
	});
	for (var i = 0; i < waw.parts.length; i++) {
		read_part(waw.parts[i]);
	}
/*
*	End of waw
*/
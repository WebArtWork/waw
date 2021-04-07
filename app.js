#!/usr/bin/env node
/*
*	Supportive
*/
	const waw = {};
	const fs = require('fs');
	const path = require('path');
	const git = require('gitty');
	waw.fs = fs;
	waw.git = git;
	waw.path = path;
	waw.isDirectory = source => fs.lstatSync(source).isDirectory();
	waw.getDirectories = source => {
		if (!fs.existsSync(source)) {
			return []; 
		}
		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(waw.isDirectory);
	}
	waw.isFile = source => fs.lstatSync(source).isFile();  
	waw.getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(waw.isFile);
	waw.getFilesRecursively = (source, opts={}) => {
		let dirs = waw.getDirectories(source);
		let files = dirs.map(dir => waw.getFilesRecursively(dir)).reduce((a,b) => a.concat(b), []);
		files = files.concat(waw.getFiles(source));
		if(opts.end){
			for (var i = files.length - 1; i >= 0; i--) {
				if(!files[i].endsWith(opts.end)){
					files.splice(i, 1);
				}
			}
		}
		return files;
	};
	const core_parts = {
		core: 'git@github.com:WebArtWork/core.git'
	};
	if (fs.existsSync(process.cwd()+'/template.json')) {
		core_parts.template = 'git@github.com:WebArtWork/template.git';
		core_parts.sem = 'git@github.com:WebArtWork/sem.git';
	}
/*
*	Read Project Config
*/
	waw.config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		waw.config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		//fs.mkdirSync(process.cwd()+'/client', { recursive: true });
		//fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		let serverConfig = JSON.parse(fs.readFileSync(process.cwd()+'/server.json'));
		for(let each in serverConfig){
			waw.config[each] = serverConfig[each];
		}
	}
/*
*	Read Project Parts
*/
	waw.parts = waw.getDirectories(process.cwd()+'/server');
	for (let i = waw.parts.length-1; i >= 0; i--) {
		waw.parts[i] = waw.parts[i].split(path.sep).pop();
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
				if (!fs.existsSync(part.__root+'/'+routers[i])) {
					var data = `module.exports = function(waw) {\n\t// add your router code\n};`;
					data = data.split('CNAME').join(part.name.toString().charAt(0).toUpperCase() + part.name.toString().substr(1).toLowerCase());
					data = data.split('NAME').join(part.name.toLowerCase());
					fs.writeFileSync(part.__root+'/'+routers[i], data, 'utf8');
				}
				let route = require(part.__root+'/'+routers[i]);
				if(typeof route == 'function') route(waw);
			}
		}
	}
	waw.parts.sort(function(a, b){
		if(!a.priority) a.priority=0;
		if(!b.priority) b.priority=0;
		if(a.priority < b.priority) return 1;
		return -1;
	});
	for (var i = 0; i < waw.parts.length; i++) {
		read_part(waw.parts[i]);
	}
/*
*	End of waw
*/
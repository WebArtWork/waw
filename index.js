#!/usr/bin/env node
const core_parts = {
	core: 'git@github.com:WebArtWork/core.git',
	sem: 'https://github.com/WebArtWork/sem.git'
};
/*
*	Supportive
*/
	const fs = require('fs');
	const git = require('gitty');
	const isDirectory = source => fs.lstatSync(source).isDirectory();
	const getDirectories = source => {
		if (!fs.existsSync(source)) {
			return [];
		}
		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isDirectory);
	}
	const fetch = (folder, repo, cb, branch='master')=>{
		fs.mkdirSync(folder, { recursive: true });
		folder = git(folder);
		folder.init(function(){
			folder.addRemote('origin', repo, function(err){
				folder.fetch('--all', function(err){
					folder.reset('origin/'+branch, cb);
				});
			});
		});
	};
	const parallel = function(arr, callback){
		let counter = arr.length;
		if(counter===0) return callback();
		for (let i = 0; i < arr.length; i++) {
			arr[i](function(){
				if(--counter===0) callback();
			});
		}
	}
/*
*	Variables
*/
	const parts = getDirectories(process.cwd()+'/server');
	const _parts = {};
/*
*	Read Project Config
*/
	let config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		fs.mkdirSync(process.cwd()+'/client', { recursive: true });
		fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		let serverConfig = fs.readFileSync(process.cwd()+'/server.json');
		for(let each in serverConfig){
			config[each] = serverConfig[each];
		}
	}
/*
*	Execute runners
*/
	const execute_runners = function(){
		const argv = process.argv.slice();
		argv.shift();
		argv.shift();
		if(argv.length){
			let command = argv.shift();
			for (var i = 0; i < parts.length; i++) {
				if(_parts[parts[i]].runner){
					let runners = require(_parts[parts[i]].__root+'/'+_parts[parts[i]].runner);
					if(typeof runners == 'object' && !Array.isArray(runners)){
						for(let each in runners){
							if(each.toLowerCase() == command.toLowerCase()){
								runners[each](argv);
								break;
							}
						}
					}
				}
			}
		}
		process.exit(1);
	}
/*
*	Read Project Parts
*/
	const read_project_parts = function(){
		for (let i = parts.length-1; i >= 0; i--) {
			parts[i] = parts[i].split('\\').pop();
			if (fs.existsSync(process.cwd()+'/server/'+parts[i]+'/part.json')) {
				_parts[parts[i]] = JSON.parse(fs.readFileSync(process.cwd()+'/server/'+parts[i]+'/part.json'));
				_parts[parts[i]].__root = process.cwd()+'/server/'+parts[i];
			}else{
				parts.splice(i, 1);
			}
		}
		for(let each in config.parts){
			if (fs.existsSync(__dirname+'/server/'+each)) {
				if (fs.existsSync(__dirname+'/server/'+each+'/part.json')) {
					parts.unshift(each);
					_parts[each] = JSON.parse(fs.readFileSync(__dirname+'/server/'+each+'/part.json'));
					_parts[each].__root = __dirname+'/server/'+each;
				}
			}
		}
		if(!parts.length){
			for(let each in core_parts){
				if (fs.existsSync(__dirname+'/server/'+each+'/part.json')) {
					parts.unshift(each);
					_parts[each] = JSON.parse(fs.readFileSync(__dirname+'/server/'+each+'/part.json'));
					_parts[each].__root = __dirname+'/server/'+each;
				}
			}
		}
		let installs = [];
		for (var i = 0; i < parts.length; i++) {
			console.log(_parts[parts[i]].dependencies);
		}
		parallel(installs, execute_runners);
	}
/*
*	Read and Install Common Parts
*/
	let installs = [];
	for(let each in core_parts){
		if (!fs.existsSync(__dirname+'/server/'+each)) {
			installs.push(function(next){
				fetch(__dirname+'/server/'+each, core_parts[each], next);
			});
		}
	}
	parallel(installs, read_project_parts);
/*
*	End of waw
*/
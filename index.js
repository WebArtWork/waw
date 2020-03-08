#!/usr/bin/env node
const core_parts = {
	core: 'https://github.com/WebArtWork/core.git'
};
const orgs = {
	waw: 'https://github.com/WebArtWork/NAME.git'
}
/*
*	Supportive
*/
	const fs = require('fs');
	const git = require('gitty');
	const npmi = require('npmi');
	const nodemon = require('nodemon');
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
			let origin_argv = argv.slice();
			let command = argv.shift();
			let done = false;
			for (var i = 0; i < parts.length; i++) {
				if(_parts[parts[i]].runner){
					let runners = require(_parts[parts[i]].__root+'/'+_parts[parts[i]].runner);
					if(typeof runners == 'object' && !Array.isArray(runners)){
						for(let each in runners){
							if(each.toLowerCase() == command.toLowerCase()){
								let stop_process = runners[each]({
									origin_argv: origin_argv,
									argv: argv,
									git: git,
									npmi: npmi,
									nodemon: nodemon,
									parts: parts,
									_parts: _parts,
									config: config,
									part_config: _parts[parts[i]],
									project_root: process.cwd(),
									part_root: _parts[parts[i]].__root,
									waw_root: __dirname
								});
								if(!stop_process) return;
								done = true;
								break;
							}
						}
						if(done) break;
					}
				}
			}
		}
		// remove nodemon from package.json and install it if it's not installed
		nodemon({
			script: __dirname+'/app.js',
			watch: [process.cwd()+'/server', __dirname+'/server', __dirname+'/app.js'],
			ext: 'js json'
		});
		nodemon.on('start', function () {
			console.log(' ===== App has started ===== ');
		}).on('restart', function (files) {
			console.log(' ===== App restarted ===== ');
		});
	}
/*
*	Read Project Parts
*/
	const read_project_parts = function(){
		for (let i = parts.length-1; i >= 0; i--) {
			parts[i] = parts[i].split('\\').pop();
			if (fs.existsSync(process.cwd()+'/server/'+parts[i]+'/part.json')) {
				try{
					_parts[parts[i]] = JSON.parse(fs.readFileSync(process.cwd()+'/server/'+parts[i]+'/part.json'));
				}catch(err){
					console.log('Review your part.json at '+parts[i]+' part.');
					process.exit(0);
				}
				_parts[parts[i]].__root = process.cwd()+'/server/'+parts[i];
			}else{
				parts.splice(i, 1);
			}
		}
		for(let each in config.parts){
			if (fs.existsSync(__dirname+'/server/'+each) && fs.existsSync(__dirname+'/server/'+each+'/part.json')) {
				parts.unshift(each);
				_parts[each] = JSON.parse(fs.readFileSync(__dirname+'/server/'+each+'/part.json'));
				_parts[each].__root = __dirname+'/server/'+each;
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
		const add_install = function(name, version, path){
			installs.push(function(next){
				npmi({
					name: name,
					version: version,
					path: path,
					forceInstall: true,
					npmLoad: {
						loglevel: 'silent'
					}
				}, next);
			});
		}
		for (var i = 0; i < parts.length; i++) {
			for(let each in _parts[parts[i]].dependencies){
				if (fs.existsSync(_parts[parts[i]].__root+'/node_modules/'+each)) {
					continue;
				}
				add_install(each, _parts[parts[i]].dependencies[each], _parts[parts[i]].__root);
			}
		}
		for(let each in config.dependencies){
			if (fs.existsSync(process.cwd()+'/node_modules/'+each)) {
				continue;
			}
			add_install(each, config.dependencies[each], process.cwd());
		}
		parallel(installs, execute_runners);
	}
/*
*	Read and Install Common Parts
*/
	let installs = [];
	const installs_add = function(folder, repo){
		installs.push(function(next){
			fetch(folder, repo, next);
		});
	}
	for(let each in core_parts){
		if (!fs.existsSync(__dirname+'/server/'+each)) {
			installs_add(__dirname+'/server/'+each, core_parts[each]);
		}
	}
	for(let each in config.parts){
		if (!fs.existsSync(__dirname+'/server/'+each)) {
			for(let org in orgs){
				if(config.parts[each].toLowerCase()==org){
					installs_add(__dirname+'/server/'+each, orgs[org].replace('NAME', each));
					break;
				}	
			}
		}
	}
	parallel(installs, read_project_parts);
/*
*	End of waw
*/
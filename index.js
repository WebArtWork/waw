#!/usr/bin/env node
/*
*	Supportive
*/
	const fs = require('fs');
	const path = require('path');
	const git = require('gitty');
	const exec = require('child_process').exec;
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
	let lock = false;
	const npmi = (opts, next)=>{
		if(lock){
			return setTimeout(()=>{
				npmi(opts, next);
			}, 100);
		}
		lock = true;
		opts.name = path.normalize(opts.name);
		if (fs.existsSync(path.resolve(opts.path, opts.name))) {
			return next();
		}
		let cmdString = "npm install " + opts.name;
		if (opts.version == '*') opts.version = '';
		cmdString += (opts.version ? "@" + opts.version : "");
		cmdString += ' --prefix '+opts.path;
		cmdString += (opts.global ? " -g" : "");
		cmdString += (opts.save ? " --save" : "");
		cmdString += (opts.saveDev ? " --save-dev" : "");
		cmdString += (opts.legacyBundling ? " --legacy-bundling" : "");
		cmdString += (opts.noOptional ? " --no-optional" : "");
		cmdString += (opts.ignoreScripts ? " --ignore-scripts" : "");
		const cmd = exec(cmdString, {
			cwd: opts.path ? opts.path : "/",
			maxBuffer: opts.maxBuffer ? opts.maxBuffer : 200 * 1024
		}, (error, stdout, stderr) => {
			if (error) {
				console.log("I cloudn't install " + opts.name + " on path " + opts.path);
				process.exit();
			}else{
				lock = false;
				console.log("Module installed: " + opts.name);
				next();
			}
		});
		if (opts.output) {
			var consoleOutput = function (msg) {
				console.log('npm: ' + msg);
			};
			cmd.stdout.on('data', consoleOutput);
			cmd.stderr.on('data', consoleOutput);
		}
	}
/*
*	Variables
*/
	let waw_project = false;
	const core_parts = {
		core: 'https://github.com/WebArtWork/core.git'
	};
	const orgs = {
		waw: 'https://github.com/WebArtWork/NAME.git'
	}
	if (fs.existsSync(process.cwd()+'/angular.json')) {
		core_parts.angular = 'git@github.com:WebArtWork/angular.git';
	}
	if (fs.existsSync(process.cwd()+'/template.json')) {
		waw_project = true;
		core_parts.template = 'git@github.com:WebArtWork/template.git';
		core_parts.sem = 'git@github.com:WebArtWork/sem.git';
	}
	const parts = getDirectories(process.cwd()+'/server');
	const _parts = {};
/*
*	Read Project Config
*/
	//fs.mkdirSync(__dirname+'/server', { recursive: true });
	let config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		waw_project = true;
		config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		//fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		let serverConfig = JSON.parse(fs.readFileSync(process.cwd()+'/server.json'));
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
		let command;
		/*
		*	Start Runners
		*/
			if(argv.length){
				let origin_argv = argv.slice();
				command = argv.shift();
				let done = false;
				for (var i = 0; i < parts.length; i++) {
					if(_parts[parts[i]].runner){
						let runners = require(_parts[parts[i]].__root+'/'+_parts[parts[i]].runner);
						if(typeof runners == 'object' && !Array.isArray(runners)){
							for(let each in runners){
								if(each.toLowerCase() == command.toLowerCase()){
									let continue_process = runners[each]({
										getDirectories: getDirectories,
										origin_argv: origin_argv,
										argv: argv,
										git: git,
										exec: exec,
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
									if(continue_process !== true) return;
									done = true;
									break;
								}
							}
							if(done) break;
						}
					}
				}
			}
		/*
		*	Frameworks Runners
		*/
			if(command && command.toLowerCase()=='wipe'){
				fs.rmdirSync(__dirname+'/server', { recursive: true });
				process.exit(1);
			}
			if(command && command.toLowerCase()=='renew'){
				let framework = git(__dirname);
				return framework.init(function(){
					framework.addRemote('origin', 'https://github.com/WebArtWork/waw.git', function(err){
						framework.fetch('--all', function(err){
							framework.reset('origin/dev', function(){
								fs.rmdirSync(__dirname+'/server', { recursive: true });
								console.log('Framework has been updated');
								process.exit(1);
							});
						});
					});
				});
			}
		/*
		*	End of runners
		*/
		if(!waw_project){
			console.log('This is not waw project or runner was not executed.');
			process.exit(0);
		}
		// remove nodemon from package.json and install it if it's not installed
		nodemon({
			script: __dirname+'/app.js',
			watch: [process.cwd()+'/server', __dirname+'/server', __dirname+'/pages', __dirname+'/config.json', __dirname+'/template.json', __dirname+'/app.js'],
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
			parts[i] = parts[i].split(path.sep).pop();
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

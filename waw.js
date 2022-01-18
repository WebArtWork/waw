#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const git = require('gitty');
const exec = require('child_process').exec;
const modules_root = process.cwd()+'/server';
const serial = function(i, arr, callback){
	if(i>=arr.length) return callback();
	arr[i](function(){
		serial(++i, arr, callback);
	});
}
const signals = {};
let lock = false;
const node_file = `module.exports.command = function(waw) {\n\t// add your Run code\n};`;
const waw = {
	waw_root: __dirname,
	project_root: process.cwd(),
	core_modules: {
		core: 'https://github.com/WebArtWork/core.git'
	},
	core_orgs: {
		waw: 'https://github.com/WebArtWork/NAME.git'
	},
	core_module: name => waw.core_orgs.waw.replace('NAME', name),
	isDirectory: source => fs.lstatSync(source).isDirectory(),
	getDirectories: function(source) {
		if (!fs.existsSync(source)) {
			return [];
		}
		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(this.isDirectory);
	},
	isFile: source => fs.lstatSync(source).isFile(),
	getFiles: function(source) {
		fs.readdirSync(source).map(name => path.join(source, name)).filter(this.isFile)
	},
	getFilesRecursively: function(source, opts={}) {
		let dirs = this.getDirectories(source);
		let files = dirs.map(dir => this.getFilesRecursively(dir)).reduce((a,b) => a.concat(b), []);
		files = files.concat(this.getFiles(source));
		if(opts.end){
			for (var i = files.length - 1; i >= 0; i--) {
				if(!files[i].endsWith(opts.end)){
					files.splice(i, 1);
				}
			}
		}
		return files;
	},
    readJson: function(source){
    	if (fs.existsSync(source) && this.isFile(source)) {
    		try {
    			return JSON.parse(fs.readFileSync(source));
    		} catch(e){
    			return {};
    		}
    	} else return {};
    },
    writeJson: (path, json)=> fs.writeFileSync(path, JSON.stringify(json)),
    uniteJson: (toObj, fromObj, replace = true)=>{
		for(const each in fromObj){
			if(replace || !toObj[each]) {
				toObj[each] = fromObj[each];
			}
		}
    },
    uniteArray: (toArray, fromArray)=>{
    	for (var i = 0; i < fromArray.length; i++) {
    		toArray.push(fromArray[i]);
    	}
    },
	fetch: (folder, repo, callback, branch='master') => {
		fs.mkdirSync(folder, { recursive: true });
		folder = git(folder);
		folder.init(function(){
			folder.addRemote('origin', repo, function(err){
				folder.fetch('--all', function(err){
					folder.reset('origin/'+branch, callback);
				});
			});
		});
	},
	parallel: (arr, callback) => {
		let counter = arr.length;
		if(counter===0) return callback();
		for (let i = 0; i < arr.length; i++) {
			arr[i](function(){
				if(--counter===0) callback();
			});
		}
	},
	each: function(arrOrObj, func, callback=()=>{}, isSerial=false){
		if(typeof callback == 'boolean'){
			isSerial = callback;
			callback = ()=>{};
		}
		if(Array.isArray(arrOrObj)){
			let counter = arrOrObj.length;
			if(counter===0) return callback();
			if(isSerial){
				let serialArr = [];
				for (let i = 0; i < arrOrObj.length; i++) {
					serialArr.push(function(next){
						func(arrOrObj[i], function(){
							if(--counter===0) callback();
							else next();
						}, i);
					});
				}
				serial(0, serialArr, callback);
			}else{
				for (let i = 0; i < arrOrObj.length; i++) {
					func(arrOrObj[i], function(){
						if(--counter===0) callback();
					}, i);
				}
			}
		}else if(typeof arrOrObj == 'object'){
			if(isSerial){
				let serialArr = [];
				let arr = [];
				for(let each in arrOrObj){
					arr.push({
						value: arrOrObj[each],
						each: each
					});
				}
				let counter = arr.length;
				for (let i = 0; i < arr.length; i++) {
					serialArr.push(function(next){
						func(arr[i].each, arr[i].value, function(){
							if(--counter===0) callback();
							else next();
						}, i);
					});
				}
				serial(0, serialArr, callback);
			}else{
				let counter = 1;
				for(let each in arrOrObj){
					counter++;
					func(each, arrOrObj[each], function(){
						if(--counter===0) callback();
					});
				}
				if(--counter===0) callback();
			}
		}else callback();
	},
	node_files: (source, files, isRouter = false) => {
		if(typeof files == 'object' && files.src){
			files = [files.src];
		}else if(typeof files === 'string'){
			files = files.split(' ');
		}
		for (var i = files.length - 1; i >= 0; i--) {
			if (typeof files[i] === 'object' ) {
				files[i] = files[i].src;
			}
			if (!fs.existsSync(source+'/'+files[i])) {
				let code = node_file;
				if(isRouter){
					code = code.replace('.command', '').replace('Run', 'Router');
				}
				fs.writeFileSync(path.resolve(source, files[i]), code, 'utf8');
			}
			files[i] = require(path.resolve(source, files[i]));
		}
		return files;
	},
	npmi: function(opts, next=()=>{}) {
		if(lock){
			return setTimeout(()=>{
				waw.npmi(opts, next);
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
	},
	install: {
		global: function(name, callback){
			const source = path.resolve(__dirname, 'server', name);
			if(fs.existsSync(source)){
				waw.modules.push(read_module(source, name));
			} else {
				console.log('Installing Global Module', name);
				waw.fetch(source, waw.core_module(name), err => waw.modules.push(read_module(source, name)) );
			}
		},
		npmi: function(source, dependencies, callback=()=>{}){
			waw.each(dependencies, (name, version, next)=>{
				if(fs.existsSync(path.resolve(source, 'node_modules', name))) return next();
				waw.npmi(source, { name, version }, next);
			}, callback);
		}
	},
	emit: function(signal){
		for (var i = 0; i < signals[signal].length; i++) {
			signals[signal][i]();
		}
	},
	on: function(signal, callback){
		if(!signals[signal]) signals[signal]=[];
		if(typeof callback === 'function') signals[signal].push(callback);
	}
}
waw.config = waw.readJson(process.cwd()+'/config.json');
waw.uniteJson(waw.config, waw.readJson(process.cwd()+'/server.json'));
if (fs.existsSync(process.cwd()+'/angular.json')) {
	waw.core_modules.angular = waw.core_module('angular');
}
if (fs.existsSync(process.cwd()+'/template.json')) {
	waw.core_modules.template = waw.core_module('template');
	waw.core_modules.sem = waw.core_module('sem');
}
const read_module = (source, name) => {
	config = waw.readJson(source+'/module.json');
	waw.uniteJson(config, waw.readJson(source+'/part.json'));
	waw.install.npmi(source, config.dependencies);
	config.__root = path.normalize(source);
	config.__name = name;
	waw._modules[config.__name] = config;
	return config;
}
waw.modules = [];
waw._modules = {};
if(waw.isDirectory(modules_root)){
	waw.uniteArray(waw.modules, waw.getDirectories(modules_root));
	waw.module = name => waw._modules[name];
	for (let i = 0; i < waw.modules.length; i++) {
		waw.modules[i] = read_module(waw.modules[i], path.basename(waw.modules[i]));
	}
}
if(waw.config.parts) {
	waw.each(waw.config.parts, module => waw.install.global(module));
}
if(waw.config.modules) {
	waw.each(waw.config.modules, module => waw.install.global(module));
}
if(!waw.modules.length) {
	waw.each(waw.core_modules, module => waw.install.global(module));
}
module.exports = waw;

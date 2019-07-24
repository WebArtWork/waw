const git = require('gitty');
const npmi = require('npmi');
const fs = require('fs');
const path = require('path');
const readline = require('readline');


const isDirectory = source => fs.lstatSync(source).isDirectory();
const getDirectories = source => {
	if (!fs.existsSync(source)) {
		return [];
	}
	return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isDirectory);
}
const isFile = source => fs.lstatSync(source).isFile();
const getFiles = source => fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isFile);
const serial = function(i, arr, callback){
	if(i>=arr.length) return callback();
	arr[i](function(){
		serial(++i, arr, callback);
	});
}
const unite = (...arguments)=>{
	let arr = [];
	for (let i = 0; i < arguments.length; i++) {
		for (let j = 0; j < arguments[i].length; j++) {
			arr.push(arguments[i][j]);
		}
	}
	return arr;
}

const wawConfig = JSON.parse(fs.readFileSync(__dirname+'/../config.json'));
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

const fetch_helper = (name, version)=>{
	if(!sd.wawConfig.packages[name]){
		sd.exit("Helper "+name+" is not register, you can add it by 'waw set package HELPERNAME REPOLINK'");
	}
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
const read_helper = src=>{
	let url = src+'/helper.json';
	if (fs.existsSync(url)) {
		let config = JSON.parse(fs.readFileSync(url));
		if(!config.bin) return false;
		config.__dirname = src;
		for (var i = 0; i < config.bin.length; i++) {
			config.bin[i] = src + '/' + config.bin[i];
		}
		return config;
	}else return false;
}
const helpers_list = unite(getDirectories(process.cwd()+'/helpers', true), getDirectories(__dirname, true));
const helpers = {};
for (let i = helpers_list.length - 1; i >= 0; i--) {
	helpers_list[i] = read_helper(helpers_list[i]);
	if(!helpers_list[i] || helpers[helpers_list[i].name]){
		helpers_list.splice(i, 1);
		continue;
	}
	helpers[helpers_list[i].name] = helpers_list[i];
}
module.exports = {
	readline: readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	log: (...arguments)=>{
		console.log('footer.js 123:', arguments);
		// https://stackoverflow.com/questions/16697791/nodejs-get-filename-of-caller-function
	},
	helper: (name)=>{
		if(!helpers[name]) sd.exit('The helper '+name+' that you are looking for is not existing');
		let helper = {};
		for (var i = 0; i < helpers[name].bin.length; i++) {
			let fetch = helpers[name].bin[i];
			if(typeof fetch == 'string' && fs.existsSync(fetch)){
				fetch = require(fetch);
			}
			if(typeof fetch != 'object') continue;
			for(let each in fetch){
				helper[each] = fetch[each]
			}
		}
		return helper;
	},
	afterWhile: (obj, cb, time=1000)=>{
		if(typeof cb == 'function' && typeof time == 'number'){
			clearTimeout(obj.__updateTimeout);
			obj.__updateTimeout = setTimeout(cb, time);
		}
	},
	capitalize: string=>{
		return string.charAt(0).toUpperCase() + string.slice(1);
	},
	wawConfig: wawConfig,
	config: config,
	git: git,
	fetch: function(folder, repo, cb, branch='master', commit=false){
		fs.mkdirSync(folder, { recursive: true });
		folder = git(folder);
		folder.init(function(){
			folder.addRemote('origin', repo, function(err){
				folder.fetch('--all',function(err){
					folder.reset('origin/'+branch, cb);
				});
			});
		});
	},
	npmi: npmi,
	npmInstall: function(path, dependency, version, cb){
		if (fs.existsSync(path+'/node_modules/'+dependency)) {
			return cb();
		}
		npmi({
			name: dependency,
			version: version,
			path: path,
			forceInstall: true,
			npmLoad: {
				loglevel: 'silent'
			}
		}, cb);
	},
	fs: fs,
	isDirectory: isDirectory,
	getDirectories: function(loc, clear=false){
		if(!clear){
			return getDirectories(loc);
		}
		if (!fs.existsSync(loc)) return [];
		let folders = getDirectories(loc);
		for (let i = 0; i < folders.length; i++) {
			folders[i] = folders[i].split('\\').pop();
		}
		return folders;
	},
	isFile: isFile,
	getFiles: function(loc, clear=false){
		if(!clear){
			return getFiles(loc);
		}
		if (!fs.existsSync(loc)) return [];
		let files = getFiles(loc);
		for (let i = 0; i < files.length; i++) {
			files[i] = files[i].split('\\').pop();
		}
		return files;
	},
	log: message => console.log(message),
	exit: (message, success=0) => {
		console.log(message);
		process.exit(success);
	},
	parallel: function(arr, callback){
		let counter = arr.length;
		if(counter===0) return callback();
		for (let i = 0; i < arr.length; i++) {
			arr[i](function(){
				if(--counter===0) callback();
			});
		}
	},
	serial: (arr, callback) => serial(0, arr, callback) ,
	each: function(arrOrObj, func, callback, isSerial=false){
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
						});
					});
				}
				serial(0, serialArr, callback);
			}else{
				for (let i = 0; i < arrOrObj.length; i++) {
					func(arrOrObj[i], function(){
						if(--counter===0) callback();
					});
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
						});
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
	}
}
const git = require('gitty');
const npmi = require('npmi');
const fs = require('fs');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isDirectory);
const isFile = source => fs.lstatSync(source).isFile();
const getFiles = source => fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isFile);
const serial = function(i, arr, callback){
	if(i>=arr.length) return callback();
	arr[i](function(){
		serial(++i, arr, callback);
	});
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
module.exports = {
	helper: (name)=>{
		return require(__dirname+'/'+name);
	},
	wawConfig: wawConfig,
	config: config,
	git: git,
	fetch: function(){

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
console.log('SERVER STARTS');
/*
*	Modules
*/
	const fs = require('fs');
	const git = require('gitty');
	const npmi = require('npmi');
/*
*	Supportive
*/
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
/*
*	Initialize
*/
	const sd = {
		fs: fs,
		fetch: function(){

		},
		npmi: function(path, dependency, version, cb){
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
		getDirectories: function(loc){
			if (!fs.existsSync(loc)) return [];
			let folders = getDirectories(loc);
			for (let i = 0; i < folders.length; i++) {
				folders[i] = folders[i].split('\\').pop();
			}
			return folders;
		},
		getFiles: function(loc){
			if (!fs.existsSync(loc)) return [];
			let files = getFiles(loc);
			for (let i = 0; i < files.length; i++) {
				files[i] = files[i].split('\\').pop();
			}
			return files;
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
	};
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
		if (fs.existsSync(url)) {
			let config = JSON.parse(fs.readFileSync(url));
			config.__dirname = process.cwd()+'/server/'+name+'/';
			return config;
		}else return false;
	}
/*
*	Start
*/
	const parts = sd.getDirectories(process.cwd()+'/server');
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
		console.log('LOAD ROUTES');
	}, true);
/*
*	End of parts read
*/
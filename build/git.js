var fs = require('fs');
var fse = require('fs-extra');
var gu = require(__dirname+'/gu.js');
var git = require('gitty');
var recursive = require('recursive-readdir');
var wawPages = {
	ng: 'git@github.com:WebArtWork/wawAngular.git'
}
var wawParts = {
	user: 'git@github.com:WebArtWork/part-user.git',
	db: 'git@github.com:WebArtWork/part-local-db.git',
	dbo: 'git@github.com:WebArtWork/part-local-db-original.git',
}
module.exports.init = function(part, url){
	if(url.indexOf('waw@')>-1) url = wawParts[url.split('@')[1]];
	else url = url.replace(/\s+/g, '');
	part = part.replace(/\s+/g, '');
	var dest = process.cwd() + '/server/' + part;
	if(!fs.existsSync(dest)) fse.mkdirs(dest);
	var myRepo = git(dest);
	myRepo.init(function(err){
		myRepo.addRemote('origin', url, function(err){
			if(!err){
				pull(part, function(){
					console.log('Part Successfully connected with repo.');
				});
			}else return console.log('You have added git to this Part.');
		});
	});
}
var pushAll = function(part, message, branch, callback){
	part = part.replace(/\s+/g, '');
	var myRepo = git(process.cwd() + '/server/' + part);
	myRepo.addSync(['.']);
	myRepo.commit(message, function(){
		myRepo.pull('origin', branch||'master', function(){
			myRepo.push('origin', branch||'master', function(){
				if(typeof callback == 'function') callback();
			});
		});
	});
}
module.exports.pushAll = pushAll;
var pull = function(part, callback){
	var myRepo = git(process.cwd() + '/server/' + part);
	myRepo.pull('origin','master', function(err){
		if(typeof callback == 'function') callback();
	});
}
module.exports.create = function(name, callback){
	name = name.replace(/\s+/g, '');
	var dest = process.cwd() + '/' + name;
	if(fs.existsSync(dest)) return console.log('Project exists.');
	fse.mkdirs(dest);
	git.clone(dest,'git@github.com:WebArtWork/waw-sample-auth.git', function(){
		var npmi = require('npmi');
		npmi({
			path: dest,
			npmLoad: {
				loglevel: 'silent'
			}
		}, function(err, result) {
			console.log('Project created Successfully.');
		});
		fse.remove(dest+'/.git', function(err) {});
	});
}
module.exports.createPart = function(name){
	name = name.replace(/\s+/g, '');
	name = name.replace('waw@', '');
	name = name.split(':');
	var wawPart = name[0];
	name = name[1]||name[0];
	var dest = process.cwd() + '/server/' + name;
	if(fs.existsSync(dest)) return gu.close('Part Exists');
	fse.mkdirs(dest);
	git.clone(dest,wawParts[wawPart], function(){
		fse.remove(dest+'/.git', function(err) {
			var renames = [{
				from: 'CNAME',
				to: name.toLowerCase().capitalize()
			}, {
				from: 'NAME',
				to: name.toLowerCase()
			}];
			recursive(dest, function(err, files) {
				if (files) {
					for (var i = 0; i < files.length; i++) {
						gu.writeFile(files[i], renames, files[i]);
					}
				};
				gu.close('Your Part "'+name+'" is successfully pulled.');
			});
		});
	});
}
module.exports.fetchPart = function(name){
	name = name.replace(/\s+/g, '');
	var dest = process.cwd() + '/server/' + name;
	if(!fs.existsSync(dest)) return console.log('Parts dosnt exists.');
	var myRepo = git(dest);
	myRepo.fetch('--all',function(err){
		myRepo.reset('origin/master',function(err){
			console.log('Part has been fetched.');
		});
	});
}
module.exports.fetch = function(branch, callback){
	var myRepo = git(process.cwd());
	myRepo.fetch('--all',function(err){
		myRepo.reset('origin/'+(branch||'master'),function(err){
			if(typeof callback == 'function') callback();
			else process.exit(0);
		});
	});
}
module.exports.fetchOrigin = function(){
	var myRepo = git(__dirname+'/..');
	myRepo.init(function(){
		myRepo.addRemote('origin', 'git@github.com:WebArtWork/waw.git', function(err){
			myRepo.fetch('--all',function(err){
				myRepo.reset('origin/master',function(err){
					gu.close('waw were successfully updated.');
				});
			});
		});
	});
}
var initFolder = function(dest){
	fse.mkdirs(dest+'/client');
	fse.mkdirs(dest+'/server');
	fse.mkdirs(dest+'/server/user');
	var ProjectName = dest.split(require('path').sep);
	ProjectName = ProjectName[ProjectName.length-1].replace(/\s/g, '');
	fse.copySync(__dirname + '/configSample.json', dest+'/config.json');
	fse.copySync(__dirname + '/ignore', dest+'/.gitignore');
	gu.writeFile(dest+'/config.json', [{
		from: 'NAME',
		to: ProjectName
	},{
		from: 'RAND',
		to: Math.floor(Math.random() * 9999) + 1000
	}], dest+'/config.json');
	gu._parallel([function(next){
		var userRepo = git(dest+'/server/user');
		userRepo.init(function() {
			userRepo.addRemote('origin', wawParts.user, function(err) {
				userRepo.checkout('master', ['-b'], function(err) {
					userRepo.pull('origin', 'master', function(err) {
						fse.removeSync(dest+'/server/user/.git');
						next();
					});
				});
			});
		});
	},function(next){
		var clientRepo = git(dest+'/client');
		clientRepo.init(function() {
			clientRepo.addRemote('origin', wawPages.ng, function(err) {
				clientRepo.checkout('master', ['-b'], function(err) {
					clientRepo.pull('origin', 'master', function() {
						fse.removeSync(dest+'/client/.git');
						fse.removeSync(dest+'/client/.gitignore');
						next();
					});
				});
			});
		});
	}],function(){
		gu.close('Project successfully initialized.');
	});	
}
module.exports.initialize = function(url, branch){
	if(url&&url.indexOf('@')>-1){
		var myRepo = git(process.cwd());
		myRepo.init(function(){
			myRepo.addRemote('origin', url, function(err){
				if(err) gu.close('Project exists.');
				myRepo.checkout(branch ||'master', ['-b'], function(err) {
					myRepo.pull('origin', branch || 'master', function() {
						gu.close('Project successfully initialized.');
					});
				});
			});
		});
	}else if(url){
		var dest = process.cwd()+'/'+url;
		if(fs.existsSync(dest)) gu.close('Project already exists.');
		fse.mkdirs(dest);
		initFolder(dest);
	}else{
		fs.readdir(process.cwd(), function(err, files) {
			if (!files.length) {
				initFolder(process.cwd());
			}else gu.close('This folder is not empty.');
		});
	}
}
module.exports.initializePlugin = function(url, branch){
	if(url&&url.indexOf('@')>-1){
		var name = url.split('/');
		name = name[name.length-1].replace('.git','');
		var dest = process.cwd()+'/'+name;
	}else if(url){
		var dest = process.cwd()+'/'+url;
	}else{
		gu.close('Please specify plugin name or repo link.');
	}
	fse.mkdirs(dest);
	var config = fse.readJsonSync(dest+'/client/config.json', {
		throws: false
	})||{};
	gu._serial([function(next){
		var myRepo = git(dest);
		myRepo.init(function(){
			myRepo.addRemote('origin', 'git@github.com:WebArtWork/waw_angular_plugin.git', function(err){
				myRepo.checkout('master', ['-b'], function(err) {
					myRepo.pull('origin', 'master', function() {
						fse.removeSync(dest+'/.git');
						next();
					});
				});
			});
		});
	}, function(next){
		if(url&&url.indexOf('@')>-1){
			fse.mkdirs(dest+'/client/js/'+name);
			config.plugins = [name];
			var repoPlugin = git(dest+'/client/js/'+name);
			repoPlugin.init(function(){
				repoPlugin.addRemote('origin', url, function(err){
					repoPlugin.checkout(branch||'master', ['-b'], function(err) {
						repoPlugin.pull('origin', branch||'master', next);
					});
				});
			});
		}else{
			fse.mkdirs(dest+'/client/js/'+url);
			config.plugins = [url];
		}
	}], function(){
		gu.fse.writeJsonSync(dest+'/client/config.json', config, {
			throws: false
		});
		gu.close('Plugin workground initialized.');
	});
}
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
// end of file
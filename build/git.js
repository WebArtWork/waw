var fs = require('fs');
var fse = require('fs-extra');
var git = require('gitty');
var wawParts = {
	auth: 'git@github.com:WebArtWork/part-user.git',
	seo: 'git@github.com:WebArtWork/part-seo.git'
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
var pushAll = function(part, message, callback){
	part = part.replace(/\s+/g, '');
	var myRepo = git(process.cwd() + '/server/' + part);
	myRepo.addSync(['.']);
	myRepo.commit(message, function(){
		myRepo.pull('origin','master', function(){
			myRepo.push('origin','master', function(){
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
		fse.remove(dest+'/.gitignore', function(err) {});
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
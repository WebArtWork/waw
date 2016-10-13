var fs = require('fs');
var fse = require('fs-extra');
var git = require('gitty');
module.exports.init = function(part, url){
	part = part.replace(/\s+/g, '');
	var dest = process.cwd() + '/server/' + part;
	if(!fs.existsSync(dest)) fse.mkdirs(dest);
	url = url.replace(/\s+/g, '');
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
var pull = function(part, callback){
	var myRepo = git(process.cwd() + '/server/' + part);
	myRepo.pull('origin','master', function(err){
		if(typeof callback == 'function') callback();
	});
}
module.exports.pushAll = pushAll;
var fs = require('fs');
var npmi = require('npmi');
module.exports = function(sd, next){
	console.log('READING MODULES');
	var needToInstall = [];
	for (var i = 0; i < sd.dependencies.length; i++) {
		var module = process.cwd() + '/node_modules/'+sd.dependencies[i].name;
		if(!fs.existsSync(module)) needToInstall.push(sd.dependencies[i]);
	}
	var counter = needToInstall.length;
	if(counter == 0) return next();
	for (var i = 0; i < needToInstall.length; i++) {
		npmi({
			name: needToInstall[i].name,
			version: needToInstall[i].version,
			path: process.cwd(),
			forceInstall: false,
		}, function(err, result) {
			console.log('result');
			console.log(result);
			console.log('err');
			console.log(err);
			if(--counter === 0) next();
		});
	}
}
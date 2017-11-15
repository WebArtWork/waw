try {
	var npmi = require('npmi');
} catch (err) {
	console.log("You have to install npm globally:\nnpm i -g npmi");
	process.exit(0);
}
var fs = require('fs');
var install = function(name, vOrCB, cb, forceInstall, loc){
	loc = loc||process.cwd();
	vOrCB = vOrCB||'*';
	if(typeof vOrCB == 'function'){
		cb = vOrCB;
		vOrCB = '*';
	}
	if(!cb) cb=function(){};
	if(fs.existsSync(loc + '/node_modules/' + name)) return cb();
	npmi({
		name: name,
		version: vOrCB,
		path: loc,
		forceInstall: true,
	}, cb);
}
module.exports.install = install;
module.exports.i = install;
module.exports = function(sd, next){
	console.log('READING MODULES');
	sd._package.i('mongoose');
	var installs = [];
	var addInstall = function(dep){
		installs.push(function(n) {
			sd._package.i(dep.name, dep.version, n);
		});
	}
	for (var i = 0; i < sd._dependencies.length; i++) {
		addInstall(sd._dependencies[i]);
	}
	sd._parallel(installs, next);
}
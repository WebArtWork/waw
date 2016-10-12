var minifier = require('js-minify');
var fs = require('fs');
var path = require('path');
var sd;
module.exports = function(sdGlobal){
	console.log('READING CLIENT SIDE');
	sd = sdGlobal;
	sd.app.use(require('node-sass-middleware')({
		src: process.cwd() + '/client/scss',
		dest: process.cwd() + '/client',
		debug: !sd.config.production,
		outputStyle: 'compressed',
		force: !sd.config.production
	}));
	var pages = sd.getDirectories(process.cwd() + '/client');
	for (var i = 0; i < pages.length; i++) {
		if(pages[i]=='scss') continue;
		var pageUrl = process.cwd()+'/client/'+pages[i];
		generateLibs(pageUrl);
		serveFiles(pageUrl, pages[i], pages[i]==sd.config.root);
	}
}
var getListOfComponents = function(path){
	var libs = sd.getFiles(path);
	libs.sort(function(a,b){
		if(a>b) return 1;
		else return -1;
	});
	for (var i = 0; i < libs.length; i++) {
		libs[i]=path+'/'+libs[i];
	}
	return libs;
}
var generateLibs = function(path){
	minifier({
		files: getListOfComponents(path+'/components'),
		way: path + '/gen/',
		prefix: sd.config.prefix,
		production: false
	});
}
var serveFiles = function(folder, name, isRoot){
	sd.app.get('/' + name + '/:folder/:file', function(req, res) {
		for (var i = 0; i < sd.folders.length; i++) {
			if (sd.folders[i] == req.params.folder) return res.sendFile(process.cwd() + '/client/' + name + '/' + req.params.folder + '/' + req.params.file.replace('.map', ''));
		}
		if (sd.config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
		else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
	});
	if (isRoot) { // make this last
		sd.app.get('/', function(req, res) {
			if (sd.config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
		sd.app.get('/*', function(req, res) {
			if (sd.config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
	} else {
		sd.app.get('/' + name + '/*', function(req, res) {
			if (sd.config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
		sd.app.get('/' + name, function(req, res) {
			if (sd.config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
	}
}
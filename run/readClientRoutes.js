var minifier = require('js-minify');
var fontifier = require('svg-fontify');
var sd;
module.exports = function(sdGlobal){
	console.log('READING CLIENT SIDE');
	sd = sdGlobal;
	sd.app.use(require('node-sass-middleware')({
		src: process.cwd() + '/client',
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
		generateFonts(pageUrl, pages[i]);
		serveFiles(pageUrl, pages[i], pages[i]==sd.config.root);
	}
}
var getListOfComponents = function(dest){
	sd.fse.mkdirs(dest);
	var libs = sd.getFiles(dest);
	libs.sort(function(a,b){
		if(a>b) return 1;
		else return -1;
	});
	for (var i = 0; i < libs.length; i++) {
		libs[i]=dest+'/'+libs[i];
	}
	return libs;
}
var getListOfSvgs = function(dest){
	sd.fse.mkdirs(dest);
	var svgs = sd.getFiles(dest);
	for (var i = svgs.length - 1; i >= 0; i--) {
		if(svgs[i].indexOf('.svg')==-1){
			svgs.splice(i,1);
		};
	}
	for (var i = 0; i < svgs.length; i++) {
		svgs[i]=dest+'/'+svgs[i];
	}
	return svgs;
}
var generateFonts = function(dest, name){
	fontifier({
		name: name,
		files: getListOfSvgs(dest+'/svgs'),
		way: dest + '/fonts/',
		prefix: sd.config.prefix
	});
}
var generateLibs = function(dest){
	minifier({
		files: getListOfComponents(dest+'/components'),
		way: dest + '/gen/',
		prefix: sd.config.prefix,
		production: false
	});
}
var serveFiles = function(folder, name, isRoot){
	sd.app.get('/' + name + '/:folder/:file', function(req, res) {
		for (var i = 0; i < sd.folders.length; i++) {
			if (sd.folders[i] == req.params.folder) return res.sendFile(process.cwd() + '/client/' + name + '/' + req.params.folder + '/' + req.params.file.replace('.map', '').replace('.scss', ''));
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
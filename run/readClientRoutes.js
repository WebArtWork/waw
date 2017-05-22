var minifier = require('js-minify');
var fontifier = require('svg-fontify');
var sd;
module.exports = function(sdGlobal){
	console.log('READING CLIENT SIDE');
	sd = sdGlobal;
	
	sd._app.use(require('node-sass-middleware')({
		src: process.cwd() + '/client',
		dest: process.cwd() + '/client',
		debug: !sd._config.production,
		outputStyle: 'compressed',
		force: !sd._config.production
	}));
	
	sd._app.use(require('postcss-middleware')({
		plugins: [
			/* Plugins */
			require('autoprefixer')({
				/* Options */
			})
		]
	}));

	var pages = sd._getDirectories(process.cwd() + '/client');
	var seoPages = [];
	var folders = ['css','fonts','gen','html','img','js','lang','page'];
	for (var i = 0; i < pages.length; i++) {
		var pageUrl = process.cwd()+'/client/'+pages[i];
		generateLibs(pageUrl);
		generateFonts(pageUrl, pages[i]);
		if(sd._fs.existsSync(pageUrl+'/config.json')) var info = sd._fse
			.readJsonSync(pageUrl+'/config.json', {throws: false});
		else var info = false;
		if(info&&(info.seo||info.swig)) {
			seoPages.push({
				url: pageUrl,
				router: info.router
			});
			simpleServeFiles(pageUrl, pages[i], info.folders||folders);
		}else{
			if(pages[i]!=sd._config.root) serveFiles(pageUrl, pages[i], false, info&&info.folders||folders);
			else{
				var rootPageUrl = pageUrl;
				var page = pages[i];
				var rootFolders = info&&info.folders||folders;
			}
		}
	}
	if(seoPages.length>0){
		var swig  = require('derer');
		sd._swig = swig;
		swig.setDefaults({
			varControls: ['{{{', '}}}'],
			cache: sd._config.production
		});
		sd._app.engine('html', swig.renderFile);
		sd._app.set('view engine', 'html');
		sd._app.set('view cache', true);
		var engines = [];
		for (var i = 0; i < seoPages.length; i++) {
			engines.push(seoPages[i].url+'/html');
			engines.push(seoPages[i].url+'/page');
			for (var j = 0; j < seoPages[i].router.length; j++) {
				require(seoPages[i].url+'/'+seoPages[i].router[j].src)(sd._app, sd);
			}
		}
		sd._app.set('views', engines);
	}
	if(rootPageUrl){
		serveFiles(rootPageUrl, page, true, rootFolders);
	}
}
var getListOfComponents = function(dest){
	sd._fse.mkdirs(dest);
	var libs = sd._getFiles(dest);
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
	sd._fse.mkdirsSync(dest);
	var svgs = sd._getFiles(dest);
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
		way: dest + '/gen/',
		prefix: sd._config.prefix
	});
}
var generateLibs = function(dest){
	minifier({
		files: getListOfComponents(dest+'/components'),
		way: dest + '/gen/',
		prefix: sd._config.prefix,
		production: false
	});
}
var simpleServeFiles = function(folder, name, folders){
	sd._app.get('/' + name + '/:folder/:file', sd['sf'+name]||sd._next, function(req, res) {
		for (var i = 0; i < folders.length; i++) {
			if (folders[i] == req.params.folder) return res.sendFile(process.cwd() + '/client/' + name + '/' + req.params.folder + '/' + req.params.file.replace('.map', '').replace('.scss', ''));
		}
		if(typeof sd['sf'+name] == 'function') sd['sf'+name+'serve'](req, res);
		else res.json(false);
	});
}  
var serveFiles = function(folder, name, isRoot, folders){
	sd._app.get('/' + name + '/:folder/:file', sd['sf'+name]||sd._next, function(req, res) {
		for (var i = 0; i < folders.length; i++) {
			if (folders[i] == req.params.folder) return res.sendFile(process.cwd() + '/client/' + name + '/' + req.params.folder + '/' + req.params.file.replace('.map', '').replace('.scss', ''));
		}
		if (sd._config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
		else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
	});	
	if (isRoot) {
		console.log('SERVING FILES FOR PAGE: '+name+' which is root page.');
		if(!sd._config.customRootLink){
			sd._app.get('/', sd['sf'+name]||sd._next, function(req, res) {
				if (sd._config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
				else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
			});
		}
		sd._app.get('/*', sd['sf'+name]||sd._next, function(req, res) {
			if (sd._config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
	} else {
		console.log('SERVING FILES FOR PAGE: '+name);
		sd._app.get('/' + name + '/*', sd['sf'+name]||sd._next, function(req, res) {
			if (sd._config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
		sd._app.get('/' + name, sd['sf'+name]||sd._next, function(req, res) {
			if (sd._config.production) res.sendFile(process.cwd() + '/client/' + name + '/html/indexProduction.html');
			else res.sendFile(process.cwd() + '/client/' + name + '/html/index.html');
		});
	}
}
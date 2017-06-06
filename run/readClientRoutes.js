var folders = ['css','fonts','gen','html','img','js','lang','page'];
var ext = ['.css','.ttf','.woff','.woff2','.svg','.otf','.js','.html','.gif','.jpg','.png'];
module.exports = function(sd){
	console.log('READING CLIENT SIDE');
	/*
	*	Minify Script
	*/
		if(sd._config.iconsminify){
			var fontifier = require('svg-fontify');
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
				if (sd._fs.existsSync(dest+'/icons')) {
					var icons = getListOfSvgs(dest+'/icons');
					if(icons.length==0) return;
					fontifier({
						name: name,
						files: icons,
						way: dest + '/gen/',
						prefix: sd._config.prefix
					});
				}
			}
		}
		if(sd._config.jsminify){
			var minifier = require('js-minify');
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
			var generateLibs = function(dest){
				if (sd._fs.existsSync(dest+'/lab')) {
					var lab = getListOfComponents(dest+'/lab');
					if(lab.length==0) return;
					minifier({
						files: lab,
						way: dest + '/gen/',
						prefix: sd._config.prefix,
						production: false
					});
				}
			}
		}
	/*
	*	scss
	*/
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
	/*
	*	Files Serving
	*	Basically this is only for localhost,
	*	and if for some reason nginx didn't serve fles
	*/
		sd._app.use(function(req, res, next) {
			if(req.originalUrl.indexOf('api')>-1) return next();
			for (var i = 0; i < ext.length; i++) {
				if( sd._isEndOfStr(req.originalUrl.split('?')[0], ext[i]) ) {
					for (var j = 0; j < folders.length; j++) {
						if(req.originalUrl.indexOf(folders[j])>-1){
							return res.sendFile(process.cwd() + '/client' + req.originalUrl.split('?')[0]);
						}
					}
				}
			}
			next();
		});
	/*
	*	Derer
	*/
		var derer  = require('derer');
		sd._swig = derer; // Delete this one day
		sd._derer = derer;
		var dererOpts = {
			varControls: ['{{{', '}}}']
		}
		if(!sd._config.production){
			dererOpts.cache = false;
		}
		derer.setDefaults(dererOpts);
		sd._app.engine('html', derer.renderFile);
		sd._app.set('view engine', 'html');
		sd._app.set('view cache', true);
	/*
	*	Managing Pages
	*/
		var clientRoot = process.cwd()+'/client';
		var engines = [];
		if(sd._fs.existsSync(clientRoot+'/config.json')){
			if(sd._config.jsminify) generateLibs(clientRoot);
			if(sd._config.iconsminify) generateFonts(clientRoot, 'public');
			engines.push(clientRoot + '/html');
			engines.push(clientRoot + '/page');
			var info = sd._fse.readJsonSync(clientRoot+'/config.json', {throws: false});
			for (var j = 0; j < info.router.length; j++) {
				require(clientRoot + '/' + info.router[j].src)(sd._app, sd);
			}
		}else{
			var pages = sd._getDirectories(clientRoot);
			for (var i = 0; i < pages.length; i++) {
				var pageUrl = clientRoot+'/'+pages[i];
				if(sd._fs.existsSync(pageUrl+'/config.json')) var info = sd._fse
					.readJsonSync(pageUrl+'/config.json', {throws: false});
				else var info = false;
				if(!info) continue;
				if(sd._config.jsminify) generateLibs(pageUrl);
				if(sd._config.iconsminify) generateFonts(pageUrl, pages[i]);
				engines.push(pageUrl + '/html');
				engines.push(pageUrl + '/page');
				for (var j = 0; j < info.router.length; j++) {
					require(pageUrl + '/' + info.router[j].src)(sd._app, sd);
				}
			}
		}
		sd._app.set('views', engines);
	/*
	*	End of Client Routing
	*/
}
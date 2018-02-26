var folders = ['css','fonts','gen','html','img','js','lang','page'];
var ext = ['.css','.ttf','.woff','.woff2','.svg','.otf','.js','.html','.gif','.jpg','.png'];
module.exports = function(sd){
	console.log('READING CLIENT SIDE');
	var clientRoot = process.cwd()+'/client';
/*
*	Docs
*/
	var showdown  = require('showdown');
	var converter = new showdown.Converter();
	var _readFile = function(loc, rpl){
		var text = sd._fs.readFileSync(loc, 'utf8');
		var locs = loc.split(sd._path.sep);
		loc = loc.split(rpl);
		loc.shift();
		loc = loc.join(rpl)
		var file = {
			level: loc.split(sd._path.sep).length-3,
			text: converter.makeHtml(text),
			loc: rpl+loc,
			file: locs[locs.length-2]
		}
		return file;
	}
	var getTemplate = function(_root, rpl, cb){
		sd._readdir(_root, function(err, files){
			files.sort();
			var _files = [];
			for (var i = 0; i < files.length; i++) {
				if(sd._isEndOfStr(files[i].toLowerCase(), '.md')){
					_files.push(_readFile(files[i], rpl));
				}
			}
			cb(_files);
		});
	}
	var renderDocs = function(req, res){
		res.send(sd._derer.renderFile(__dirname+'/html/MD.html', {
			files: req.body.files
		}));
	}
	sd._app.get("/waw/docs", sd._ensureLocalhost, function(req, res, next) {
		getTemplate(__dirname+'/../', 'waw', function(files){
			req.body.files = files;
			next();
		});
	}, renderDocs);
	sd._app.get("/waw/edocs", sd._ensureLocalhost, function(req, res, next) {
		getTemplate(__dirname+'/../../exe', 'waw', function(files){
			req.body.files = files;
			next();
		});
	}, renderDocs);
	sd._app.get("/waw/cdocs", sd._ensureLocalhost, function(req, res, next) {
		getTemplate(process.cwd()+'/client', 'client', function(files){
			req.body.files = files;
			next();
		});
	}, renderDocs);
	sd._app.get("/waw/sdocs", sd._ensureLocalhost, function(req, res, next) {
		getTemplate(process.cwd()+'/server', 'server', function(files){
			req.body.files = files;
			next();
		});
	}, renderDocs);
/*
*	waw clients
*/
	if(sd._config.angular){
		sd._app.use(function(req, res, next){
			var islocal = req.get('host').toLowerCase().indexOf('localhost')==0;
			var url = req.originalUrl.toLowerCase();
			if(islocal) return next();
			if(url.indexOf('/api/')>-1) return next();
			if(url.indexOf('/waw/')>-1) return next();
			for (var i = 0; i < ext.length; i++) {
				if( sd._isEndOfStr(req.originalUrl.split('?')[0], ext[i]) ) {
					for (var j = 0; j < folders.length; j++) {
						if(req.originalUrl.indexOf(folders[j])>-1){
							return res.sendFile(clientRoot + '/dist/' + req.originalUrl.split('?')[0]);
						}
					}
				}
			}
			res.sendFile(clientRoot+'/dist/index.html');
		});
	}else{
		// if (sd._fs.existsSync(__dirname+'/../config.json')) {
		// 	var devConfig = sd._fse.readJsonSync(__dirname+'/../config.json', {
		// 		throws: false
		// 	});
		// }else var devConfig = {};
		if(sd._fs.existsSync(clientRoot+'/config.json')){		
			var info = sd._fse.readJsonSync(clientRoot+'/config.json', {throws: false});
		}else{
			console.log("WAW Project looks to don't have client.");
			process.exit();
		}
		var engines = [];
		/*
		*	Minify Script
		*/
			if(!sd._config.ignoreGenerateFonts){
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
			if(!sd._config.ignoreGenerateLibs){
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
				var generateLibsWithList = function(dest, files, name){
					if (sd._fs.existsSync(dest+'/lab')) {
						console.log('generating!!!: ', name);
						minifier({
							files: files,
							way: dest + '/gen/',
							prefix: sd._config.prefix,
							production: false,
							name: name
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
			// sd._app.use(require('postcss-middleware')({
			// 	plugins: [
			// 		require('autoprefixer')({
			// 		})
			// 	]
			// }));
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
								return res.sendFile(clientRoot + req.originalUrl.split('?')[0]);
							}
						}
					}
				}
				next();
			});
		/*
		*	Derer
		*/
			var dererOpts = {
				varControls: ['{{{', '}}}']
			}
			if(!sd._config.production){
				dererOpts.cache = false;
			}
			sd._derer.setDefaults(dererOpts);
			sd._app.engine('html', sd._derer.renderFile);
			sd._app.set('view engine', 'html');
			sd._app.set('view cache', true);
			sd._derer.setFilter('string',function(input){
				return input&&input.toString()||'';
			});		
			sd._derer.setFilter('fixlink',function(link){
				if(link.indexOf('//')>0) return link;
				else return 'http://'+link;
			});
		/*
		*	Translates
		*/
			var translateFolder = clientRoot + '/lang';
			var df = sd._df = {};
			var ff = {};
			ff = sd._getFiles(translateFolder);
			var addSetLang = function(lang){
				sd['_set_' + lang] = function(req, res, next) {
					if (req.user) {
						req.user.lang = lang;
						req.user.save();
					} else req.session.lang = lang;
					next();
				};
			}
			for (var i = 0; i < ff.length; i++) {
				var previousFileName = ff[i];
				ff[i] = ff[i].replace('.js','');
				addSetLang(ff[i]);
				if(ff[i].indexOf('.')>=0){
					ff[i] = sd._rpl(ff[i], '.', '');
					sd._fs.writeFileSync(translateFolder+'/'+ff[i]+'.js', sd._fs.readFileSync(translateFolder+'/'+previousFileName, 'utf8'), 'utf8');
					sd._fs.unlinkSync(translateFolder+'/'+previousFileName);
				}
			}
			sd._ro = function(req, res, obj){
				if(req.user&&req.user.lang) obj.lang = req.user.lang;
				else if(req.session.lang) obj.lang = req.session.lang;
				else obj.lang = ff[0];
				if(req.originalUrl=='/'){
					for (var i = 0; i < ff.length; i++) {
						obj[ff[i]+'Url'] = '/'+ff[i];
					}
				}else{
					for (var i = 0; i < ff.length; i++) {
						obj[ff[i]+'Url'] = req.originalUrl;
						for (var j = 0; j < ff.length; j++) {
							obj[ff[i]+'Url'] = obj[ff[i]+'Url'].replace('/'+ff[j],'');
						}
						obj[ff[i]+'Url'] += '/' + ff[i];
					}
				}
				obj.user = req.user;
				return obj;
			}
			for (var i = 0; i < ff.length; i++) {
				var words = require(translateFolder+'/'+ff[i]+'.js');
				if(!df[ff[i]]) df[ff[i]]={};
				for(key in words){
					df[ff[i]][key] = words[key];
				}
			}
			sd._generate_translate_file = function(){
				var data = sd._fs.readFileSync(__dirname+'/js/translate.js', 'utf8');
				data=data.replace('LANG_ARR', JSON.stringify(ff)).replace('INNER_DF', JSON.stringify(df));
				sd._fs.writeFileSync(clientRoot + '/gen/translate.js', data, 'utf8');
			}
			if(info.translate&&!sd._fs.existsSync(clientRoot + '/gen/translate.js')){
				sd._generate_translate_file();
			}
			/*
			*	Below we make content accessible by working project
			*/
			var addWordToIdea = function(word){
				return console.log(word);
				// sd._wait(function(){
				// 	sd._request.post({
				// 		uri: 'http://pagefly.webart.work/api/idea/addWord',
				// 		form: {
				// 			_id: sd._config.waw_idea,
				// 			langs: ff,
				// 			word: word,
				// 			token: devConfig.user
				// 		}
				// 	}, sd._wait_next);
				// });
			}
			var fillFiles = function(word){
				var _generate_translate_file = false;
				for (var i = 0; i < ff.length; i++) {
					var words = require(translateFolder+'/'+ff[i]+'.js');
					if(!words[word]){
						words[word] = '';
						_generate_translate_file = true;
						df[ff[i]] = words;
						sd._fs.writeFileSync(translateFolder+'/'+ff[i]+'.js', 'module.exports = '+JSON.stringify(words), 'utf-8');
					}
				}
				if(info.translate&&_generate_translate_file) sd._generate_translate_file();
				if(_generate_translate_file&&sd._config.waw_idea&&devConfig.user){
					addWordToIdea(word);
				}
			}
			var checkFiles = function(word, file){
				for(var folder in ff){
					for (var i = 0; i < ff.length; i++) {
						if(ff[i]==file){
							return fillFiles(word);
						}
					}
				}
			}
			sd._derer.setFilter('tr', function(word, file){
				word = word.replace('"',"'");
				if(df[file]&&df[file][word])
					return df[file][word];
				else{
					if(df[file]&&typeof df[file][word] != 'string') checkFiles(word, file);
					return word;
				}
			});
			sd._app.post("/waw/translate", function(req, res, next){
				if(req.hostname=='localhost') next();
				else res.json(false);
			}, function(req, res) {
				req.body.word = req.body.word.replace('"',"'");
				if(df[req.body.lang]&&df[req.body.lang][req.body.word])
					return res.json(df[req.body.lang][req.body.word]);
				else{
					if(df[req.body.lang]&&typeof df[req.body.lang][req.body.word] != 'string')
						checkFiles(req.body.word, req.body.lang);
					res.json(true);
				}
			});
		/*
		*	Managing Pages
		*/
			if(!sd._config.ignoreGenerateFonts) generateFonts(clientRoot, 'public');
			engines.push(clientRoot + '/html');
			engines.push(clientRoot + '/page');
			
			/*
			*	Generate Script
			*/
			if(!sd._config.ignoreGenerateLibs){
				generateLibs(clientRoot);
				if(info.lab){
					for (var i = 0; i < info.lab.length; i++) {
						for (var j = 0; j < info.lab[i].files.length; j++) {
							info.lab[i].files[j] = clientRoot + '/lab/' + info.lab[i].files[j];
						}
						generateLibsWithList(clientRoot, info.lab[i].files, info.lab[i].name);
					}
				}
			}

			for (var j = 0; j < info.router.length; j++) {
				require(clientRoot + '/' + info.router[j].src)(sd._app, sd);
			}
			sd._app.set('views', engines);
		/*
		*	Plugins Management
		*/
			var jsRoot = clientRoot + '/js';
			var cssRoot = clientRoot + '/css';
			sd._fse.mkdirs(cssRoot+'/plugins');
			var wplugs = [{
				name: 'wdrag',
				repo: 'git@github.com:WebArtWork/wdrag.git'
			},{
				name: 'wcom',
				repo: 'git@github.com:WebArtWork/wcom.git'
			},{
				name: 'wcrop',
				repo: 'git@github.com:WebArtWork/wcrop.git'
			},{
				name: 'wmodal',
				repo: 'git@github.com:WebArtWork/wmodal.git'
			},{
				name: 'wedit',
				repo: 'git@github.com:WebArtWork/wedit.git'
			}];
			var compareCssFiles = function(injsfile, incssfile){
				var mtjs, mtcss;
				if (sd._fs.existsSync(injsfile)) {
					mtjs = sd._fs.statSync(injsfile).mtime;
					mtjs = new Date(mtjs).getTime();
				}
				if (sd._fs.existsSync(incssfile)) {
					mtcss = sd._fs.statSync(incssfile).mtime;
					mtcss = new Date(mtcss).getTime();
				}
				if(!mtjs&&!mtcss){
					sd._fs.writeFileSync(injsfile, '', 'utf8');
					sd._fs.writeFileSync(incssfile, '', 'utf8');
				}else if(!mtjs){
					sd._fs.writeFileSync(injsfile, sd._fs.readFileSync(incssfile,'utf8'), 'utf8');
				}else if(!mtcss){
					sd._fs.writeFileSync(incssfile, sd._fs.readFileSync(injsfile,'utf8'), 'utf8');
				}else if(mtjs>mtcss){
					sd._fs.writeFileSync(incssfile, sd._fs.readFileSync(injsfile,'utf8'), 'utf8');
				}else if(mtjs<mtcss){
					sd._fs.writeFileSync(injsfile, sd._fs.readFileSync(incssfile,'utf8'), 'utf8');
				}
			}
			var createPlugin = function(plugin){
				for (var i = 0; i < wplugs.length; i++) {
					if(wplugs[i].name == plugin){
						return sd._initRepo({
							repo: wplugs[i].repo,
							root: jsRoot+'/'+plugin
						}, function(){
							sd._fse.remove(jsRoot+'/'+plugin+'/.git');
						});
					}
				}
				sd._fse.mkdirs(jsRoot+'/'+plugin);
			}
			if(Array.isArray(info.plugins)&&info.plugins.length>0){
				var plugins = [];
				var includeCss = '';
				for (var i = 0; i < info.plugins.length; i++) {
					if(!sd._fs.existsSync(jsRoot+'/'+info.plugins[i])){
						createPlugin(info.plugins[i]);
						continue;
					}
					includeCss+='@import "plugins/'+info.plugins[i]+'";\r\n';
					compareCssFiles(jsRoot+'/'+info.plugins[i]+'/'+info.plugins[i]+'.scss', cssRoot+'/plugins/'+info.plugins[i]+'.scss');
					sd._fse.removeSync(jsRoot+'/'+info.plugins[i]+'/'+info.plugins[i]+'.js');
					sd._fse.removeSync(jsRoot+'/'+info.plugins[i]+'/'+info.plugins[i]+'-min.js');
					var files = sd._getFiles(jsRoot+'/'+info.plugins[i]);
					let plugin = {
						name: info.plugins[i],
						html: [],
						dep: '',
						js: []
					}
					for (var j = files.length - 1; j >= 0; j--) {
						if(sd._isEndOfStr(files[j], '.js')){
							let file = files[j].slice(0, files[j].length-3);
							plugin.dep+=(plugin.dep&&', '||'')+'"'+file+'"';
							plugin.js.push(file);
						}else if(sd._isEndOfStr(files[j], '.html')){
							let file = files[j].slice(0, files[j].length-5);
							plugin.dep+=(plugin.dep&&', '||'')+'"'+file+'.html"';
							plugin.html.push(file);
						}
					}
					let data = sd._fs.readFileSync(__dirname+'/js/plugin.js.js', 'utf8');
					data=data.replace('NAME', plugin.name);
					data=data.replace('MODULES', plugin.dep);
					for (var j = 0; j < plugin.html.length; j++) {
						let html = sd._fs.readFileSync(__dirname+'/js/plugin.html.js', 'utf8');
						let htmlReplace = sd._fs.readFileSync(jsRoot+'/'+info.plugins[i]+'/'+plugin.html[j]+'.html', 'utf8');
						html=html.replace('HTML', htmlReplace);
						html=html.replace('FILE', plugin.html[j]);
						html=html.replace('FILE', plugin.html[j]);
						data+='\n'+html;
					}
					for (var j = 0; j < plugin.js.length; j++) {
						let jsdata = sd._fs.readFileSync(jsRoot+'/'+info.plugins[i]+'/'+plugin.js[j]+'.js', 'utf8');
						data+='\n'+jsdata;
					}
					sd._fs.writeFileSync(jsRoot+'/'+info.plugins[i]+'/'+info.plugins[i]+'.js', data, 'utf8');
				}
				sd._fs.writeFileSync(cssRoot+'/plugins.scss', includeCss, 'utf8');
			}
		/*
		*	End of Client Routing
		*/
	}
}
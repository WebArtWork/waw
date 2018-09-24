module.exports = function(sd, clientRoot){
	if(sd._fs.existsSync(clientRoot+'/config.json')){		
		var info = sd._fse.readJsonSync(clientRoot+'/config.json', {throws: false});
	}else{
		console.log("WAW Project looks to don't have client.");
		process.exit();
	}
	sd.__derer_viewes.push(process.cwd() + '/client/html');
	/*
	*	scss
	*/
		// add lint
		var sass = require('node-sass');
		sd._app.use(require('node-sass-middleware')({
			src: process.cwd() + '/client',
			dest: process.cwd() + '/client',
			debug: !sd._config.production,
			outputStyle: 'compressed',
			force: !sd._config.production
		}));
		sd._app.use(require('postcss-middleware')({
			plugins: [require('autoprefixer')({})],
			src: function(req) {
				return path.join(process.cwd() + '/client', req.url);
			}
		}));
	/*
	*	Translates
	*	need to be fixed
	*/
		var languages = ['en', 'se', 'ua', 'ru'];
		var _languages = {
			en: true,
			se: true,
			ua: true,
			ru: true
		};
		/*
		*	Initialize
		*/
			var translateFolder = clientRoot + '/lang';
			var df = sd._df = {};
			var ff = {};
			ff = sd._getFiles(translateFolder);
		/*
		*	sd scripts
		*/
			var addSetLang = function(lang){
				sd['_set_' + lang] = function(req, res, next) {
					if (req.user) {
						req.session.lang = lang;
						req.user.lang = lang;
						req.user.save(next);
					} else{
						req.session.lang = lang;
						next();
					}
				};
			}
			sd._ro = function(req, res, obj){
				if(req.user&&req.user.lang) obj.lang = req.user.lang;
				else if(req.session.lang) obj.lang = req.session.lang;
				else obj.lang = sd._config.lang||ff[0];
				obj.host = req.get('host');
				obj.host_no_port = req.get('host').split(':')[0];
				if(obj._translate){
					for(var key in obj._translate){
						obj[key] = sd._tr(obj._translate[key], obj.lang);
					}
				}
				delete obj._translate;
				if(obj._delete){
					for (var i = 0; i < obj._delete.length; i++) {
						delete obj[obj._delete[i]]
					}
				}
				delete obj._delete;

				if(obj._on_lang&&obj._on_lang[obj.lang]){
					for(var key in obj._on_lang[obj.lang]){
						obj[key] = obj._on_lang[obj.lang][key];
					}
				}
				delete obj._on_lang;
				if(obj._translate){
					for(var key in obj._translate){
						obj[key] = sd._tr(obj._translate[key], obj.lang);
					}
				}
				delete obj._translate;
				if(obj._delete){
					for (var i = 0; i < obj._delete.length; i++) {
						delete obj[obj._delete[i]]
					}
				}
				delete obj._delete;

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
				obj.originalUrl = req.originalUrl;
				obj.url = req.originalUrl.toLowerCase();
				obj._config = sd._config;
				return obj;
			}
			sd._tr = function(word, file){
				word = word.replace('"',"'");
				if(df[file]&&df[file][word])
					return df[file][word];
				else{
					if(df[file]&&typeof df[file][word] != 'string') checkFiles(word, file);
					return word;
				}
			}
			sd._derer.setFilter('tr', sd._tr);
			sd._derer.setFilter('translate', sd._tr);
			sd._generate_translate_file = function(){
				var data = sd._fs.readFileSync(__dirname+'/js/translate.js', 'utf8');
				data=data.replace('LANG_ARR', JSON.stringify(ff)).replace('INNER_DF', JSON.stringify(df));
				sd._fs.writeFileSync(clientRoot + '/gen/translate.js', data, 'utf8');
			}
		/*
		*	Translate Tool
		*/
			var addWordToTranslateTool = function(word){
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
					addWordToTranslateTool(word);
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
		*	Boot
		*/
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
			for (var i = 0; i < ff.length; i++) {
				var words = require(translateFolder+'/'+ff[i]+'.js');
				if(!df[ff[i]]) df[ff[i]]={};
				for(key in words){
					df[ff[i]][key] = words[key];
				}
			}
			if(info.translate){
				sd._generate_translate_file();
			}
		// End of Translation
	/*
	*	SVG management
	*	need to add stickers management, not only icons
	*	need to be moved somehow inside wawCss, and on the others client branches also
	*/
		if(!sd._config.ignoreGenerateFonts){
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
			if (sd._fs.existsSync(clientRoot+'/icons')) {
				var icons = getListOfSvgs(clientRoot+'/icons');
				if(icons.length==0) return;
				require('svg-fontify')({
					name: 'public',
					files: icons,
					way: clientRoot + '/gen/',
					prefix: sd._config.prefix
				});
			}
		}
	/*
	*	Javascript Plugins and minify management
	*/
		var plugins = sd._getDirectories(__dirname + '/angular');
		var minifier = function(){};
		if(!sd._config.ignoreGenerateLibs){
			minifier = require('js-minify');
		}
		var jsRoot = clientRoot + '/js';
		var cssRoot = clientRoot + '/css';
		var timeout = {}, includeCss = '';
		// plugins management
		var fill_plugin = function(folder, plugin){
			if(!sd._fs.existsSync(folder+'config.json')) return;
			clearTimeout(timeout[plugin]);
			timeout[plugin] = setTimeout(function(){
				setTimeout(function(){
					clearTimeout(timeout[plugin]);
				}, 100);
				var files = [];
				sd._recursive(folder, [function(file, stats){
					if((!sd._isEndOfStr(file, '.js')&&!sd._isEndOfStr(file, '.html')&&
						!sd._isEndOfStr(file, '.css')&&!sd._isEndOfStr(file, '.scss'))||
						file.split('\\').pop()==plugin+'.js'||
						file.split('\\').pop()==plugin+'.css'||
						file.split('\\').pop()==plugin+'-min.css'||
						file.split('\\').pop()==plugin+'.scss'||
						file.split('\\').pop()==plugin+'-min.js') return;
					files.push({
						isHtml: sd._isEndOfStr(file, '.html'),
						isCss: sd._isEndOfStr(file, '.scss')||sd._isEndOfStr(file, '.css'),
						isJs: sd._isEndOfStr(file, '.js'),
						name: file.split('\\').pop(),
						edit: stats.mtimeMs,
						path: file,
					});
				}], function () {
					if(!files.length) return;
					var config = sd._fse.readJsonSync(folder+'config.json', {throws: false});
					files.sort(function(a, b){
						if(a.name > b.name) return 1;
						return -1;
					});
					var mark = '', dep = '';
					for (var i = 0; i < files.length; i++) {
						mark+= files[i].name+' '+files[i].edit+' | ';
						if(sd._isEndOfStr(files[i].name, '.js')){
							let file = files[i].name.slice(0, files[i].name.length-3);
							dep+=(dep&&', '||'')+'"'+file+'"';
						}else if(sd._isEndOfStr(files[i].name, '.html')){
							dep+=(dep&&', '||'')+'"'+files[i].name+'"';
						}
					}
					if(includeCss.indexOf("plugins/'+plugin+'")==-1){
						includeCss+='@import "plugins/'+plugin+'";\r\n';
						sd._fs.writeFileSync(cssRoot+'/plugins.scss', includeCss, 'utf8');
					}
					if(mark == config.mark) return;
					config.mark = mark;
					sd._fse.writeJsonSync(folder+'config.json', config, {throws: false});
					sd._fse.removeSync(folder+plugin+'.js');
					sd._fse.removeSync(folder+plugin+'-min.js');
					var data = sd._fs.readFileSync(__dirname+'/js/plugin.js.js', 'utf8'), css = '';
					data = data.replace('NAME', plugin);
					data = data.replace('MODULES', dep);
					for (var i = 0; i < files.length; i++) {
						if(sd._isEndOfStr(files[i].name, '.js')){
							data+='\n'+sd._fs.readFileSync(files[i].path, 'utf8');
						}else if(sd._isEndOfStr(files[i].name, '.html')){
							var html = sd._fs.readFileSync(__dirname+'/js/plugin.html.js', 'utf8');
							var htmlReplace = sd._fs.readFileSync(files[i].path, 'utf8');
							htmlReplace = sd._rpl(htmlReplace, '"', '\\"');
							htmlReplace = htmlReplace.replace(/(\r|\t|\n)/gm,"");
							html=html.replace('HTML', htmlReplace);
							html=html.split('FILE').join(files[i].name);
							data+='\n'+html;
						}else if(sd._isEndOfStr(files[i].name, '.scss') || sd._isEndOfStr(files[i].name, '.css')){
							css += sd._fs.readFileSync(files[i].path, 'utf8');
						}
					}
					sd._fs.writeFileSync(folder+plugin+'.scss', css, 'utf8');
					sd._fs.writeFileSync(cssRoot+'/plugins/'+plugin+'.scss', css, 'utf8');
					sass.render({
						data: css,
						outputStyle: 'compressed'
					}, function(err, data){
						if(data){
							sd._fs.writeFileSync(folder+plugin+'-min.css', data.css.toString(), 'utf8');
						}
					});
					sass.render({
						data: css,
						outputStyle: 'expanded'
					}, function(err, data){
						if(data){
							sd._fs.writeFileSync(folder+plugin+'.css', data.css.toString(), 'utf8');
						}
					});
					sd._fs.writeFileSync(folder+plugin+'.js', data, 'utf8');
					minifier({
						files: [folder+plugin+'.js'],
						way: folder,
						prefix: sd._config.prefix,
						production: false,
						name: plugin,
						force: true
					});
				});
			}, 250);
		}
		var watch_subfolder = function(folder, plugin, subfolder){
			sd._fs.watch(folder+subfolder, function() {
				fill_plugin(folder, plugin);
			});
			var folders = sd._getDirectories(folder+subfolder);
			for (var i = 0; i < folders.length; i++) {
				if(folders[i]!='.git'){
					watch_subfolder(folder, plugin, folders[i]);
				}
			}
		}
		var watch_plugin = function(folder, plugin){
			fill_plugin(folder, plugin);
			sd._fs.watch(folder, function(event, filename) {
				if(filename==plugin+'.js'||filename==plugin+'-min.js') return;
				fill_plugin(folder, plugin);
			});
			var folders = sd._getDirectories(folder);
			for (var i = 0; i < folders.length; i++) {
				if(folders[i]!='.git'){
					watch_subfolder(folder, plugin, folders[i]);
				}
			}
		}
		// generation
		var rpl_plugs = function(file, folder) {
			if(file.indexOf('.js')>-1){
				return clientRoot+folder+file;
			}else{
				return __dirname+'/angular/'+file+'/'+file+'.js';
			}
		}
		var gen_plugs = function(dest, files, name, prod_files){
			for (var i = 0; i < files.length; i++) {
				files[i] = rpl_plugs(files[i], '/lab/');
			}
			if(sd._config.production){
				for (var i = 0; i < prod_files.length; i++) {
					prod_files[i] = rpl_plugs(prod_files[i], '/js/');
					files.push(prod_files[i]);
				}
			}
			minifier({
				files: files,
				way: dest + '/gen/',
				prefix: sd._config.prefix,
				production: !!sd._config.production,
				name: name
			});
		}
		if(!sd._config.ignoreGenerateLibs && info.lab){
			for (var i = 0; i < info.lab.length; i++) {
				gen_plugs(clientRoot, info.lab[i].files, info.lab[i].name, info.lab[i].prod);
			}
		}
		info.plugins = info.plugins || [];
		if(info.plugins.length){
			sd._fse.mkdirs(cssRoot+'/plugins');
			for (var i = 0; i < info.plugins.length; i++) {
				watch_plugin(jsRoot+'/'+info.plugins[i]+'/', info.plugins[i]);
			}
			for (var j = plugins.length - 1; j >= 0; j--) {
				if(plugins[j] == info.plugins[i]){
					plugins.splice(j, 1);
				}
			}
		}
		// waw plugins
		for (var i = 0; i < plugins.length; i++) {
			var p = plugins[i].toLowerCase();
			watch_plugin(__dirname + '/angular/' + p + '/', p);
		}
		sd._app.get("/waw/p/:file", function(req, res, next) {
			var p = req.params.file.toLowerCase().slice(0, req.params.file.length-3), send = false;;
			for (var i = 0; i < plugins.length; i++) {
				if(plugins[i] == p){
					send = true;
					break;
				}
			}
			if(send) res.sendFile(__dirname + '/angular/' + p + '/' + p + '.js');
			else res.send('// This is not plugin');
		});
	/*
	*	Live Reload
	*/
		var update = Date.now();
		var folder_on_update = function(folder){
			sd._fs.watch(folder, function(event, filename) {
				update = Date.now();
			});
			var folders = sd._getDirectories(folder);
			for (var i = 0; i < folders.length; i++) {
				folder_on_update(folder+'/'+folders[i]);
			}
		}
		folder_on_update(__dirname + '/angular');
		folder_on_update(clientRoot);
		sd._app.get("/waw/last_update", function(req, res, next) {
			res.send(update.getTime());
		});
	/*
	*	Files Serving / require serve files in client
	*	Basically this is only for localhost,
	*	and if for some reason nginx didn't serve fles
	*/
		sd._app.use(function(req, res, next) {
			if(req.originalUrl.indexOf('/api/')>-1) return next();
			if(req.originalUrl.indexOf('/waw/')>-1) return next();
			for (var i = 0; i < sd._ext.length; i++) {
				if( sd._isEndOfStr(req.originalUrl.split('?')[0], sd._ext[i]) ) {
					for (var j = 0; j < sd._folders.length; j++) {
						if(req.originalUrl.indexOf(sd._folders[j])>-1){
							return res.sendFile(clientRoot + req.originalUrl.split('?')[0]);
						}
					}
				}
			}
			next();
		});
		for (var j = 0; j < info.router.length; j++) {
			require(clientRoot + '/' + info.router[j].src)(sd._app, sd);
		}
	/*
	*	End of Client Routing
	*/
}
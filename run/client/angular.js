module.exports = function(sd){
	if(sd._fs.existsSync(sd._clientRoot+'/config.json')){		
		var info = sd._fse.readJsonSync(sd._clientRoot+'/config.json', {throws: false});
	}else{
		console.log("WAW Project looks to don't have client.");
		process.exit();
	}
	sd.__derer_viewes.push(process.cwd() + '/client/html');
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
	*	Translates
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
			var translateFolder = sd._clientRoot + '/lang';
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
				sd._fs.writeFileSync(sd._clientRoot + '/gen/translate.js', data, 'utf8');
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
			if (sd._fs.existsSync(sd._clientRoot+'/icons')) {
				var icons = getListOfSvgs(sd._clientRoot+'/icons');
				if(icons.length==0) return;
				require('svg-fontify')({
					name: 'public',
					files: icons,
					way: sd._clientRoot + '/gen/',
					prefix: sd._config.prefix
				});
			}
		}
	/*
	*	Javascript Plugins and minify management
	*/
		var jsRoot = sd._clientRoot + '/js';
		var cssRoot = sd._clientRoot + '/css';
		info.plugins = info.plugins || [];
		// plugins management
		var fill_plugin = function(folder, plugin){
			if(!sd._fs.existsSync(folder+'config.json')) return;
			return console.log('THIS IS plugin: ', plugin);
			if(!sd._fs.existsSync(folder)){
				return s 
				d._fse.copySync(__dirname+'/angular/'+plugin, folder+plugin);
			}
			includeCss+='@import "plugins/'+plugin+'";\r\n';
			compareCssFiles(folder+plugin+'.scss', cssRoot+'/plugins/'+plugin+'.scss');
			sd._fse.removeSync(folder+plugin+'.js');
			sd._fse.removeSync(folder+plugin+'-min.js');
			var files = sd._getFiles(jsRoot+'/'+plugin);
			let p_obj = {
				name: plugin,
				html: [],
				dep: '',
				js: []
			}
			for (var j = files.length - 1; j >= 0; j--) {
				if(sd._isEndOfStr(files[j], '.js')){
					let file = files[j].slice(0, files[j].length-3);
					p_obj.dep+=(p_obj.dep&&', '||'')+'"'+file+'"';
					p_obj.js.push(file);
				}else if(sd._isEndOfStr(files[j], '.html')){
					let file = files[j].slice(0, files[j].length-5);
					p_obj.dep+=(p_obj.dep&&', '||'')+'"'+file+'.html"';
					p_obj.html.push(file);
				}
			}
			let data = sd._fs.readFileSync(__dirname+'/js/plugin.js.js', 'utf8');
			data=data.replace('NAME', p_obj.name);
			data=data.replace('MODULES', p_obj.dep);
			for (var j = 0; j < p_obj.html.length; j++) {
				let html = sd._fs.readFileSync(__dirname+'/js/plugin.html.js', 'utf8');
				let htmlReplace = sd._fs.readFileSync(folder+p_obj.html[j]+'.html', 'utf8');
				htmlReplace = sd._rpl(htmlReplace, '"', '\\"');
				htmlReplace = htmlReplace.replace(/(\r|\t|\n)/gm,"");
				html=html.replace('HTML', htmlReplace);
				html=html.replace('FILE', p_obj.html[j]);
				html=html.replace('FILE', p_obj.html[j]);
				data+='\n'+html;
			}
			for (var j = 0; j < p_obj.js.length; j++) {
				let jsdata = sd._fs.readFileSync(folder+p_obj.js[j]+'.js', 'utf8');
				data+='\n'+jsdata;
			}
			sd._fs.writeFileSync(folder+plugin+'.js', data, 'utf8');
		}
		var watch_plugin = function(folder, plugin){
			fill_plugin(folder, plugin);
			sd._fs.watch(folder, function(event, filename) {
				if(filename==plugin+'.js'||filename==plugin+'-min.js') return;
				fill_plugin(folder, plugin);
			});
		}
		// waw plugins
		var plugins = sd._getDirectories(__dirname + '/angular');
		for (var i = 0; i < plugins.length; i++) {
			var p = plugins[i].toLowerCase();
			watch_plugin(__dirname + '/angular/' + p + '/', p);
		}
		sd._app.get("/waw/p/:file", function(req, res, next) {
			var p = req.params.file.toLowerCase().replace('.js',''), send = false;;
			for (var i = 0; i < plugins.length; i++) {
				if(plugins[i] == p){
					send = true;
					break;
				}
			}
			if(send) res.sendFile(__dirname + '/angular/' + p + '/' + req.params.file);
			else res.send('// This is not plugin');
		});
		// generation
		if(!sd._config.ignoreGenerateLibs){
			var minifier = require('js-minify');
			var rpl_plugs = function(file, folder) {
				if(file.indexOf('.js')>-1){
					return sd._clientRoot+folder+file;
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
			if(info.lab){
				for (var i = 0; i < info.lab.length; i++) {
					gen_plugs(sd._clientRoot, info.lab[i].files, info.lab[i].name, info.lab[i].prod);
				}
			}
		}
		// css of plugins
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
		if(info.plugins.length){
			sd._fse.mkdirs(cssRoot+'/plugins');
			var includeCss = '';
			for (var i = 0; i < info.plugins.length; i++) {
				includeCss+='@import "plugins/'+info.plugins[i]+'";\r\n';
				watch_plugin(jsRoot+'/'+info.plugins[i]+'/', info.plugins[i]);
			}
			sd._fs.writeFileSync(cssRoot+'/plugins.scss', includeCss, 'utf8');
		}
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
		folder_on_update(sd._clientRoot);
		sd._app.get("/waw/last_update", function(req, res, next) {
			res.send(update);
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
							return res.sendFile(sd._clientRoot + req.originalUrl.split('?')[0]);
						}
					}
				}
			}
			next();
		});
		for (var j = 0; j < info.router.length; j++) {
			require(sd._clientRoot + '/' + info.router[j].src)(sd._app, sd);
		}
	/*
	*	End of Client Routing
	*/
}
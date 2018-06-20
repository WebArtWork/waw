module.exports = function(sd){
/*
*	waw support
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
	sd._app.get("/sitemap.xml", function(req, res, next) {
		let sitemap='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.google.com/schemas/sitemap/0.90">';
		if(sd._config.sitemap&&sd._config.sitemap[req.get('host')]){
			let arr = sd._config.sitemap[req.get('host')];
			for (var i = 0; i < arr.length; i++) {
				sitemap+='<url><loc>http';
				if(arr[i].secure) sitemap+='s';
				sitemap+='://'+req.get('host')+arr[i].url+'</loc>';
				sitemap+='<lastmod>'+sd._fs.statSync(process.cwd()+'/client'+arr[i].file).mtime+'</lastmod>';
				sitemap+='<changefreq>'+arr[i].changefreq+'</changefreq>';
				sitemap+='<priority>'+arr[i].priority+'</priority>';
				sitemap+='</url>';
			}
		}
		sitemap+='</urlset>';
		res.send(sitemap);
	});
	sd._app.get("/waw/newId", sd._ensure, function(req, res) {
		res.json(sd._mongoose.Types.ObjectId());
	});
	sd._app.get("/waw/dateNow", sd._ensure, function(req, res) {
		res.json(new Date());
	});
	if(sd._config.update&&sd._config.update.key){
		var update = function(req, res) {
			if(sd._config.update.key!=req.params.key) return res.send(false);
			else res.send(true);
			var git = require('gitty');
			var myRepo = git(process.cwd());
			myRepo.fetch('--all',function(err){
				myRepo.reset('origin/'+(req.params.branch||'master'),function(err){
					var pm2 = require('pm2');
					pm2.connect(function(err) {
						if (err) {
							console.error(err);
							process.exit(2);
						}
						pm2.restart({
							name: sd._config.name
						}, function(err, apps) {
							pm2.disconnect();
							process.exit(2);
						});
					});
				});
			});
		}
		sd._app.get("/waw/update/:key/:branch", update);
		sd._app.post("/waw/update/:key/:branch", update);
	}
/*
*	waw clients
*/
}
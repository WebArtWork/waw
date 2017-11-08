module.exports = function(sd){
	console.log('READING Routes');
	sd._app.get("/waw/newId", sd._ensure, function(req, res) {
		res.json(sd._mongoose.Types.ObjectId());
	});
	sd._app.get("/waw/dateNow", sd._ensure, function(req, res) {
		res.json(new Date());
	});
	if(sd._config.update&&sd._config.update.key){
		var update = function(req, res) {
			res.send(true);
			console.log(req.params);
			if(sd._config.update.key!=req.params.key) return res.send(false);
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
	if(sd._parts){
		for (var i = 0; i < sd._parts.length; i++) {
			require(__dirname+'/crud.js')(sd, sd._parts[i].info);
			if(sd._parts[i].info.router){
				for (var j = 0; j < sd._parts[i].info.router.length; j++) {
					sd._parts[i][sd._parts[i].info.router[j].name] = require(sd._parts[i].src+'/'+sd._parts[i].info.router[j].src)(sd);
				}
			}
		}
	}
}
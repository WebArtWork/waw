module.exports = function(sd){
	console.log('READING Routes');
	sd._app.get("/waw/newId", sd._ensure, function(req, res) {
		res.json(sd._mongoose.Types.ObjectId());
	});
	sd._app.get("/waw/dateNow", sd._ensure, function(req, res) {
		res.json(new Date());
	});
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
var Pgen = require(__dirname+'/schema.js');
module.exports = function(sd) {
	var router = sd._initRouter('/api/pgen');
	var ensure = function(req, res, next){
		if(req.user&&req.user.isAdmin) next();
		else res.json(false);
	}
	Pgen.find({}, function(err, docs){
		sd._pages = docs;
	});
	sd._middleware.push(function(next, opt) {
		var req = opt.req;
		var res = opt.res;
		var host = req.get('host');
		if(req.originalUrl.indexOf('/api/')>-1) return next();
		if(sd._pages){
			for (var i = 0; i < sd._pages.length; i++) {
				if(sd._pages[i].url.toLowerCase() == req.originalUrl.toLowerCase()){
					var d = sd._derer.renderFile(__dirname+'/client/index.html', sd._pages[i]);
					return res.send(d);
				}
			}
		}
		next();
	});
	router.get('/edit', ensure, function(req, res){
		res.sendFile(__dirname+'/client/edit.html');
	});
	router.post('/create', ensure, function(req, res){
		Pgen.create({
			name: req.body.name
		}, function(err, doc){
			res.json(doc);
		});
	});
	router.post('/save', ensure, function(req, res){
		Pgen.findOne({
			_id: req.body._id
		}, function(err, doc){
			doc.links_translates = req.body.links_translates;
			doc.description = req.body.description;
			doc.keywords = req.body.keywords;
			doc.title = req.body.title;
			doc.lang = req.body.lang;
			doc.name = req.body.name;
			doc.file = req.body.file;
			doc.html = req.body.html;
			doc.img = req.body.img;
			doc.url = req.body.url;
			doc.save(function(){
				for (var i = 0; i < sd._pages.length; i++) {
					if(sd._pages[i]._id==doc._id){
						sd._pages[i].links_translates = doc.links_translates;
						sd._pages[i].description = doc.description;
						sd._pages[i].keywords = doc.keywords;
						sd._pages[i].title = doc.title;
						sd._pages[i].lang = doc.lang;
						sd._pages[i].name = doc.name;
						sd._pages[i].file = doc.file;
						sd._pages[i].html = doc.html;
						sd._pages[i].img = doc.img;
						sd._pages[i].url = doc.url;
						break;
					}
				}
				res.json(true);
			});
		});
	});
};
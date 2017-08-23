module.exports = function(sd, partJson) {
	// Initialize
		var name = partJson.name.toLowerCase();
		var cname = partJson.name.toLowerCase().capitalize();
		var schemaLoc = process.cwd() + '/server/' + name + '/schema.js';
		if (sd._fs.existsSync(schemaLoc)) {
			var Schema = require(schemaLoc);
			sd[cname] = Schema;
		}else return;
	// Routes
		if(partJson.crud){
			// Init
			var router = sd._initRouter('/api/'+name);
			// create
			router.post("/create", sd['sp'+name+'ensure']||sd._ensure, function(req, res) {
				var doc = new Schema();
				if(typeof doc.create !== 'function'){
					return res.json(false);
				}
				doc.create(req.body, req.user, sd);	
				doc.save(function(err){
					if(err) return res.json(false);
					res.json(doc);
				});			
			});
			router.post("/createCb", sd['sp'+name+'ensure']||sd._ensure, function(req, res) {
				var doc = new Schema();
				if(typeof doc.create !== 'function'){
					return res.json(false);
				}
				doc.create(req.body, req.user, sd, function(){
					doc.save(function(err){
						if(err) return res.json(false);
						req.body._id = doc._id;
						res.json(req.body);
					});
				});
			});
			// update
			if(!partJson.crud.updates) partJson.crud.updates=[];
			var updateRoute = function(update){
				router.post("/update"+update.name, sd['sp'+name+'ensure']||sd._ensure, sd._ensureUpdateObject, function(req, res) {
					Schema.findOne(sd['sp'+name+'q'+update.name]||{
						_id: req.body._id,
						moderators: req.user._id
					}, function(err, doc){
						if(err||!doc) return res.json(false);
						sd._searchInObject(doc, req.body, update.keys);
						doc.save(function(){
							req.body.name = update.name;
							sd._io.in(doc._id).emit(cname+"Update", req.body);
							req.body.doc = doc;
							res.json(req.body);
						});
					});
				});
			}
			for (var i = 0; i < partJson.crud.updates.length; i++) {
				updateRoute(partJson.crud.updates[i]);
			}
			// delete
			router.post("/delete", sd['sp'+name+'ensure']||sd._ensure, function(req, res) {
				Schema.remove(sd['sp'+name+'r']||{
					_id: req.body._id,
					author: req.user._id
				}, function(err){
					if(err) res.json(false);
					else{
						sd._io.in(req.body._id).emit(cname+"Delete", req.body);
						res.json(true);
					}
				});
			});
		}
	// Socket Management
		if (sd._fs.existsSync(schemaLoc)) {
			sd._io.on('connection', function(socket) {
				if (socket.request.user) {
					Schema.find(sd['socket' + cname + 'q'] || {
						moderators: socket.request.user._id
					}, function(err, docs) {
						if (!err&&docs){
							docs.forEach(function(doc) {
								socket.join(doc._id);
							});
						}
					})
					if(!sd.__userJoinedRoom){
						sd.__userJoinedRoom=true;
						socket.join(socket.request.user._id);
					}
				}
			});
		}
	// End of Crud
};
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
// end of file
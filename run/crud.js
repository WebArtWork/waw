module.exports = function(sd, partJson) {
	// Initialize
		var name = partJson.name.toLowerCase();
		var cname = partJson.name.toLowerCase().capitalize();
		var schemaLoc = process.cwd() + '/server/' + name + '/schema.js';
		if (sd._fs.existsSync(schemaLoc)) {
			var Schema = require(schemaLoc);
			sd[cname] = Schema;
		}else return;
	// SOLR
		if(partJson.solr){
			/*
			var solr = require('solr');
			var client = solr.createClient();
			Schema.find({}, function(err, docs){
				var docsArr = [];
				var addDocToArr = function(doc){
					docsArr.push(function(n){
						client.add(doc, n);
					});
				}
				for (var i = 0; i < docs.length; i++) {
					addDocToArr(docs[i]);
				}
				sd._parallel(docsArr, function(){
					client.commit(function(err) {});
				});
			});
			sd['_solr_'+cname] = {
				add: function(doc, next){
					client.add(doc, function(){
						client.commit(next);
					});
				},
				remove: function(doc, next){
					client.del(null, {
						_id: doc._id
					}, function(err, response) {
						client.commit(next);
					});
				},
				update: function(doc){
					client.del(null, {
						_id: doc._id
					}, function(err, response) {
						client.add(doc, function(){
							client.commit(next);
						});
					});
				},
				query: function(query, cb){
					client.query(query, function(err, response) {
						var responseObj = JSON.parse(response);
						cb(responseObj.response.docs);
					});
				},
			}
			//*/
		}
	// Routes
		if(partJson.crud){
			// Init
			var router = sd._initRouter('/api/'+name);
			/*
			*	Get Routes
			*/
				router.get("/get", sd['sp'+name+'ensure']||sd._next, function(req, res) {
					let populate = sd['sp'+name+'qgp']&&sd['sp'+name+'qgp'](req, res)||false;
					let query = sd['sp'+name+'qg']&&sd['sp'+name+'qg'](req, res)||{
						moderators: req.user._id
					};
					query = Schema.find(query);
					if(populate){
						query.populate(populate);
					}
					query.exec(function(err, docs) {
						res.json(docs || []);
					});
				});
			/*
			*	Create Routes
			*/
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
			/*
			*	Update Routes
			*/
			if(!partJson.crud.updates) partJson.crud.updates=[];
			var updateRoute = function(update){
				router.post("/update"+update.name, sd['sp'+name+'ensure']||sd._ensure, sd._ensureUpdateObject, function(req, res) {
					Schema.findOne(sd['sp'+name+'q'+update.name]||{
						_id: req.body._id,
						moderators: req.user._id
					}, function(err, doc){
						if(err||!doc) return res.json(false);
						sd._searchInObject(doc, req.body, update.keys);
						if(req.body.mark) doc.markModified(req.body.mark);
						doc.save(function(err){
							if(err) console.log('Error from save document: ', err);
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
						sd._fse.remove(process.cwd()+'/server/'+name+'/client/files/'+req.body._id);
						sd._io.in(req.body._id).emit(cname+"Delete", req.body);
						res.json(true);
					}
				});
			});
		}
	/*
	*	Socket Register
	*/
	sd._io_connections.push(function(socket){
		if (socket.request.user) {
			Schema.find(sd['socket' + cname + 'q'] || {
				moderators: socket.request.user._id
			}, function(err, docs) {
				if (!err && docs) {
					docs.forEach(function(doc) {
						socket.join(doc._id);
					});
				}
			})
			if (!socket.request.user.__userJoinedRoom) {
				socket.request.user.__userJoinedRoom = true;
				socket.join(socket.request.user._id);
			}
		}
	});
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
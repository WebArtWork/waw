module.exports = function(sd, partJson) {
	// Initialize
		var name = partJson.name.toLowerCase();
		var cname = partJson.name.toLowerCase().capitalize();
		var schemaLoc = process.cwd() + '/server/' + name + '/schema.js';
		if (sd._fs.existsSync(schemaLoc)) {
			var Schema = require(schemaLoc);
			if(partJson.schema) Schema=Schema[partJson.schema];
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
			var router = sd._initRouter('/api/'+name);
			/*
			*	Create Routes
			*/
				router.post("/create", sd['ensure_create_'+name]||sd._ensure, function(req, res) {
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
				// make above as below
				router.post("/createCb", sd['ensure_create_'+name]||sd._ensure, function(req, res) {
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
			*	Get Routes
			*/
				var getRoute = function(get_name){
					let final_name = '_get_'+name;
					if(get_name) final_name += '_'+get_name;
					router.get("/get", sd['ensure'+final_name]||sd._next, function(req, res) {
						let query = sd['query'+final_name]&&sd['query'+final_name](req, res)||{
							moderators: req.user._id
						};
						query = Schema.find(query);
						let sort = sd['sort'+final_name]&&sd['sort'+final_name](req, res)||false;
						if(sort){
							query.sort(sort);
						}
						let skip = sd['skip'+final_name]&&sd['skip'+final_name](req, res)||false;
						if(skip){
							query.skip(skip);
						}
						let limit = sd['limit'+final_name]&&sd['limit'+final_name](req, res)||false;
						if(limit){
							query.limit(limit);
						}
						let select = sd['select'+final_name]&&sd['select'+final_name](req, res)||false;
						if(select){
							query.select(select);
						}
						let populate = sd['populate'+final_name]&&sd['populate'+final_name](req, res)||false;
						if(populate){
							query.populate(populate);
						}
						query.exec(function(err, docs) {
							res.json(docs || []);
						});
					});					
				}
				getRoute('');
				if(partJson.crud.get){
					for (var i = 0; i < partJson.crud.get.length; i++) {
						getRoute(partJson.crud.get[i]);
					}
				}
			/*
			*	Update Routes
			*/
				var updateRoute = function(update){
					let final_name = '_update_'+name;
					if(update) final_name += '_'+update.name;
					router.post("/update"+update.name, sd['ensure'+final_name]||sd._ensure, sd._ensureUpdateObject, function(req, res) {
						Schema.findOne(sd['query'+final_name]&&sd['query'+final_name](req, res)||{
							_id: req.body._id,
							moderators: req.user._id
						}, function(err, doc){
							if(err||!doc) return res.json(false);
							sd._searchInObject(doc, req.body, update.keys);
							if(req.body.mark) doc.markModified(req.body.mark);
							doc.save(function(err){
								if(err) console.log('Error from save document: ', err);
								req.body.name = update.name;
								//sd._io.in(doc._id).emit(cname+"Update", req.body);
								req.body.doc = doc;
								res.json(req.body);
							});
						});
					});
				}
				if(partJson.crud.updates){
					for (var i = 0; i < partJson.crud.updates.length; i++) {
						updateRoute(partJson.crud.updates[i]);
					}
				}
				var updateRouteAll = function(update){
					let final_name = '_update_all_'+name;
					if(update) final_name += '_'+update.name;
					router.post("/update/all"+update.name, sd['ensure'+final_name]||sd._ensure, function(req, res) {
						Schema.findOne(sd['query'+final_name]&&sd['query'+final_name](req, res)||{
							_id: req.body._id,
							moderators: req.user._id
						}, function(err, doc){
							if(err||!doc) return res.json(false);
							for (var i = 0; i < update.keys.length; i++) {
								doc[update.keys[i]] = req.body[update.keys[i]];
							}
							doc.save(function(){
								res.json(doc);
							});
						});
					});
				}
				if(partJson.crud.updatesAll){
					for (var i = 0; i < partJson.crud.updatesAll.length; i++) {
						updateRouteAll(partJson.crud.updatesAll[i]);
					}
				}
				var unique_field = function(update){
					let final_name = '_unique_field_'+name;
					if(update) final_name += '_'+update.name;
					router.post("/unique/field"+update.name, sd['ensure'+final_name]||sd._ensure, function(req, res) {
						let query = sd['search_query'+final_name]&&sd['search_query'+final_name](req, res, update);
						if(!query){
							query = {};
							query[update.key] = req.body[update.key];
						}
						Schema.findOne(query, function(err, sdoc){
							if(sdoc) return res.json(false);
							Schema.findOne(sd['query'+final_name]&&sd['query'+final_name](req, res)||{
								_id: req.body._id,
								moderators: req.user._id
							}, function(err, doc){
								if(err||!doc) return res.json(false);
								doc[update.key] = req.body[update.key];
								doc.save(function(){
									res.json(doc);
								});
							});
						});
					});
				}
				if(partJson.crud.unique_field){
					for (var i = 0; i < partJson.crud.unique_field.length; i++) {
						unique_field(partJson.crud.unique_field[i]);
					}
				}
			/*
			*	Delete Route
			*/
				router.post("/delete", sd['ensure_delete_'+name]||sd._ensure, function(req, res) {
					Schema.remove(sd['delete_'+name]&&sd['delete_'+name](req, res)||{
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
			/*
			*	End of waw crud
			*/
		}
	/*
	*	Socket Register
	*/
	// sd._io_connections.push(function(socket){
	// 	if (socket.request.user) {
	// 		Schema.find(sd['socket' + cname + 'q'] || {
	// 			moderators: socket.request.user._id
	// 		}, function(err, docs) {
	// 			if (!err && docs) {
	// 				docs.forEach(function(doc) {
	// 					socket.join(doc._id);
	// 				});
	// 			}
	// 		});
	// 		if (!socket.request.user.__userJoinedRoom) {
	// 			socket.request.user.__userJoinedRoom = true;
	// 			socket.join(socket.request.user._id);
	// 		}
	// 	}
	// });
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
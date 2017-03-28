module.exports = function(sd, partJson) {
	// Initialize
		var name = partJson.name.toLowerCase();
		var cname = partJson.name.toLowerCase();
		cname[0] = cname[0].toUpperCase();
		var Schema = require(process.cwd() + '/server/' + name + '/schema.js');
		sd[cname] = Schema;
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
				doc.create(req.body, req.user);
				doc.save(function(err){
					if(err) return res.json(false);
					res.json(doc);
				});
			});
			// update
			if(!partJson.crud.updates) partJson.crud.updates=[];
			for (var i = 0; i < partJson.crud.updates.length; i++) {
				router.post("/update"+partJson.crud.updates[i].name, sd['sp'+name+'ensure']||sd._ensure, sd._ensureUpdateObject, function(req, res) {
					Schema.findOne(sd['sp'+name+'q'+partJson.crud.updates[i].name]||{
						_id: req.body._id,
						moderators: req.user._id
					}, function(err, doc){
						if(err||!doc) return res.json(false);
						sd._searchInObject(doc, req.body, partJson.crud.updates[i].keys);
						doc.save(function(){
							res.json(req.body);
						});
					});
				});
			}
			// delete
			router.post("/delete", sd['sp'+name+'ensure']||sd._ensure, function(req, res) {
				Schema.remove(sd['sp'+name+'r']||{
					_id: req.body._id,
					author: req.user._id
				}, function(err){
					if(err) res.json(false);
					else res.json(true);
				});
			});
		}
	// Socket Management
		/*
		sd._io.on('connection', function(socket) {
			// room for each place
			Schema.find({
				$or: [{
					moderators: socket.request.user._id
				},{
					viewers: socket.request.user._id
				}]
			},function(err, places){
				if(err) res.json(false)
				else {
					places.forEach(function(place){
						socket.join('room-' + place._id);
					});
				}
			})
			//room for user
			if(socket.request.user._id) socket.join(socket.request.user._id);

			socket.on('MinePlaceCreated', function(place){
				socket.broadcast.to(socket.request.user._id).emit('MinePlaceCreated', place);
				socket.join('room-' + place._id);
			});
			socket.on('MinePlaceUpdated', function(place){
				socket.broadcast.to(socket.request.user._id).emit('MinePlaceUpdated', place);
				socket.broadcast.to('room-' + place._id).emit('RoomPlaceUpdated', place);
			});
			socket.on('MinePlaceDeleted', function(place){
				socket.broadcast.to(socket.request.user._id).emit('MinePlaceDeleted', place);
			});
			socket.on('MinePlaceLeaved', function(place){
			});
		});
		*/
	// End of Crud
};
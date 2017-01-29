var CNAME = require(__dirname+'/schema.js');
var api = '/api/NAME';
module.exports = function(app, express, sd) {
	// Initialize
		var router = express.Router();
		app.use(api, router);
		sd.CNAME = CNAME;
	// Routes
		router.post("/create", ensure, function(req, res) {
			CNAME.create({
				author: req.user._id,
				moderators: [req.user._id],
				version: 0,
				name: req.body.name
			}, function(err, NAME){
				if(err) return res.json(false);
				res.json(NAME);
				if(sd.NAMEc){
					for (var i = 0; i < sd.NAMEc.length; i++) {
						if(typeof sd.NAMEc[i] == 'function'){
							sd.NAMEc[i](NAME);
						}
					}
				}
			});
		});
		router.post("/update", ensure, function(req, res) {
			CNAME.findOne({
				_id: req.body._id,
				moderators: req.user._id
			}, function(err, NAME){
				if(err||!NAME) return res.json(false);
				NAME.update(req.body, function(err){
					if(err) return res.json(false);
					res.json(true);
				});
			});
		});
		router.post("/adminUpdate", ensure, function(req, res) {
			CNAME.findOne({
				_id: req.body._id,
				author: req.user._id
			}, function(err, NAME){
				if(err||!NAME) return res.json(false);
				NAME.adminUpdate(req.body, function(err){
					if(err) return res.json(false);
					res.json(true);
				});
			});
		});
		router.post("/delete", ensure, function(req, res) {
			CNAME.remove({
				_id: req.body._id,
				author: req.user._id
			}, function(err){
				if(err) res.json(false);
				else res.json(true);
			});
		});
	// Socket Management
		sd.io.on('connection', function(socket) {
			if(socket.request.user._id) socket.join(socket.request.user._id);
			socket.on('MineCNAMECreated', function(NAME){
				socket.broadcast.to(socket.request.user._id).emit('MineCNAMECreated', NAME);
			});
			socket.on('MineCNAMEUpdated', function(NAME){
				socket.broadcast.to(socket.request.user._id).emit('MineCNAMEUpdated', NAME);
			});
			socket.on('MineCNAMEDeleted', function(NAME){
				socket.broadcast.to(socket.request.user._id).emit('MineCNAMEDeleted', NAME);
			});
		});
	// End of Crud
};
var ensure = function(req, res, next){
	if(req.user) next();
	else res.json(false);
}
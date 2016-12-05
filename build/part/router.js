var Schema = require(__dirname+'/schema.js');
var api = '/api/NAME';
module.exports = function(app, express, part) {
	var router = express.Router();
	app.use(api, router);
	router.post("/create", function(req, res) {
		Schema.create({
			author: req.user._id,
			moderators: [req.user._id],
			version: 0,
			name: req.body.name
		}, function(err, NAME){
			if(err) return res.json(false);
			res.json(NAME);
		});
	});
	router.post("/update", function(req, res) {
		Schema.findOne({
			_id: req.body._id,
			moderators: req.user._id
		}, function(err, NAME){
			if(err||!NAME) return res.json(false);
			update(NAME, req, res);
		});
	});
	router.post("/adminUpdate", function(req, res) {
		Schema.findOne({
			_id: req.body._id,
			author: req.user._id
		}, function(err, NAME){
			if(err||!NAME) return res.json(false);
			var moderators = [];
			for (var i = 0; i < req.body.moderators.length; i++) {
				moderators.push(req.body.moderators[i]._id);
			}
			NAME.moderators = moderators;
			update(NAME, req, res);
		});
	});
	var update = function(NAME, req, res){
		NAME.name = req.body.name;
		NAME.description = req.body.description;
		NAME.save(function(){
			res.json(true);
		});
	}
	router.post("/remove", function(req, res) {
		Schema.remove({
			_id: req.body._id,
			author: req.user._id
		}, function(err){
			if(err) res.json(false);
			else res.json(true);
		});
	});
};
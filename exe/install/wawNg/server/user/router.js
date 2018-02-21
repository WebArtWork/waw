var User = require(__dirname+'/schema.js');
module.exports = function(sd) {
	// Initialize
		var router = sd._initRouter('/api/user');
		var updateUser = function(user, newUser, cb){
			user.skills = newUser.skills;
			user.gender = newUser.gender;
			user.name = newUser.name;
			user.birth = newUser.birth;
			user.data = newUser.data;
			if(newUser.avatarUrl.length>100){
				user.avatarUrl = '/api/user/avatar/' + user._id + '.jpg?' + Date.now();
			}
			sd._parallel([function(n){
				user.save(n);
			}, function(n){
				if(!newUser.avatarUrl||newUser.avatarUrl.length<100) return n();
				sd._dataUrlToLocation(newUser.avatarUrl,
				__dirname + '/client/files/', user._id + '.jpg', n);
			}], cb);
		}
	// Admin Routes
		sd._ensureAdmin = function(req, res, next){
			if(req.user&&req.user.isAdmin) next();
			else res.json(false);
		}
		router.get("/admin/users", sd._ensureAdmin, function(req, res) {
			User.find({}).select('-password').populate([{
				path: 'followings'
			},{
				path: 'followers'				
			}]).exec(function(err, users){
				res.json(users||[]);
			});
		});
		router.post("/admin/create", sd._ensureAdmin, function(req, res) {
			var newUser = new User();
			newUser.email = req.body.email.toLowerCase();
			newUser.password = newUser.generateHash(req.body.password);
			newUser.save(function(err) {
				if (err) return res.json(false);
				res.json(newUser);
			});
		});
		router.post("/admin/update", sd._ensureAdmin, function(req, res) {
			User.findOne({
				_id: req.body._id
			}, function(err, doc) {
				if (err || !doc) return res.json(false);
				doc.isAdmin = req.body.isAdmin;
				updateUser(doc, req.body, function(){
					res.json(true);
				});
			});
		});
		router.post("/admin/delete", sd._ensureAdmin, function(req, res) {
			User.remove({
				_id: req.body._id
			}, function(){
				res.json(true);
			});
		});
		router.post("/admin/changePassword", sd._ensureAdmin, function(req, res) {
			User.findOne({_id: req.body._id}, function(err, user){
				user.password = user.generateHash(req.body.newPass);
				user.save(function(){
					res.json(true);
				});
			});
		});
	// User Routes
		router.get("/get", sd._ensure, function(req, res) {
			User.find({
			}).select('avatarUrl skills gender name birth').exec(function(err, users){
				res.json(users||[]);
			});
		});
		router.get("/me", sd._ensure, function(req, res) {
			res.json({
				followings: req.user.followings,
				followers: req.user.followers,
				avatarUrl: req.user.avatarUrl,
				skills: req.user.skills,
				gender: req.user.gender,
				birth: req.user.birth,
				name: req.user.name,
				date: req.user.date,
				_id: req.user._id
			});
		});
		router.post("/update", sd._ensure, function(req, res) {
			User.findOne({
				_id: req.user._id
			}, function(err, doc) {
				if (err || !doc) return res.json(false);
				updateUser(doc, req.body, function(){
					res.json(req.body);
				});
			});
		});
		router.post("/delete", sd._ensure, function(req, res) {
			User.remove({
				_id: req.user._id
			}, function(){
				res.json(true);
			});
		});
		router.post("/changePassword", sd._ensure, function(req, res) {
			if (!req.user.validPassword(req.body.oldPass)){
				req.user.password = req.user.generateHash(req.body.newPass);
				req.user.save(function(){
					res.json(true);
				});
			}else res.json(false);
		});
		router.get("/avatar/:file", function(req, res) {
			res.sendFile(__dirname + '/client/files/' + req.params.file);
		});
		router.get("/default.png", function(req, res) {
			res.sendFile(__dirname + '/client/avatar.png');
		});
	// End of
};
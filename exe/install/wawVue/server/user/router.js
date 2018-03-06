var User = require(__dirname+'/schema.js');
module.exports = function(sd) {
	var router = sd._initRouter('/api/user');
	let ensure_admin = sd.ensure_admin = function(req, res, next){
		if(req.user&&req.user.is&&req.user.is.admin) next();
		else res.send(false);
	};
	/*
	*	waw crud : Get Configuration
	*/
		sd['query_get_user'] = function(){return {}};
		sd['select_get_user'] = function(){return 'avatarUrl skills gender name birth'};
		sd['ensure_get_user_admin'] = ensure_admin;
		sd['query_get_user_admin'] = function(){return {}};
		sd['select_get_user_admin'] = function(){return '-password'};
	/*
	*	waw crud : Update Configuration
	*/
		sd['ensure_update_all_user_admin'] = ensure_admin;
		sd['query_update_all_user_admin'] = function(req, res, next) {
			return {
				_id: req.body._id
			}
		};
		sd['query_update_all_user'] = function(req, res, next) {
			return {
				_id: req.user._id
			}
		};
	/*
	*	waw crud : Delete Configuration
	*/
		sd['ensure_delete_user_admin'] = ensure_admin;
		sd['query_delete_user_admin'] = function(req, res, next){
			return {
				_id: req.body._id
			}
		};
		sd['query_delete_user'] = function(req, res, next){
			return {
				_id: req.user._id
			}
		};
		sd['files_to_remove_delete_user'] = function(req, res, next){
			return __dirname+'/files/'+req.user._id;
		};
	/*
	*	Custom Routes Management
	*/
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
				_id: req.user._id,
				is: req.user.is
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
		router.post("/admin/changePassword", ensure_admin, function(req, res) {
			User.findOne({_id: req.body._id}, function(err, user){
				user.password = user.generateHash(req.body.newPass);
				user.save(function(){
					res.json(true);
				});
			});
		});
	/*
	*	Avatar Management
	*/
		router.post("/avatar", function(req, res) {
			req.user.avatarUrl = '/api/user/avatar/' + req.user._id + '.jpg?' + Date.now();
			sd._parallel([function(n){
				req.user.save(n);
			}, function(n){
				sd._dataUrlToLocation(req.body.dataUrl,
					__dirname + '/files/', req.user._id + '.jpg', n);
			}], function(){
				res.json(req.user.avatarUrl);
			});
		});
		router.get("/avatar/:file", function(req, res) {
			res.sendFile(__dirname + '/files/' + req.params.file);
		});
		router.get("/default.png", function(req, res) {
			res.sendFile(__dirname + '/files/avatar.png');
		});
	// End of
};
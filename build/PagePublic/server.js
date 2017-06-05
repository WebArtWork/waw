module.exports = function(app, sd) {
	/*
	*	Routes
	*/
		app.get('/', function(req, res){
			res.render('Landing', {
				user: req.user,
				text: getText(req)
			});
		});
	/*
	*	Scripts
	*/
		var getText = function(req){
			if(req.user&&req.user.lang=='ua') return require(__dirname+'/lang/ua.js');
			if(req.user&&req.user.lang=='ru') return require(__dirname+'/lang/ru.js');
			if(req.user) return require(__dirname+'/lang/en.js');
			if(req.session.lang=='ua') return require(__dirname+'/lang/ua.js');
			if(req.session.lang=='ru') return require(__dirname+'/lang/ru.js');
			return require(__dirname+'/lang/en.js');
		}
	/*
	*	End of
	*/
};
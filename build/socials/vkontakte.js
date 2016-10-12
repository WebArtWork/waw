var VkontakteStrategy = require('passport-vkontakte').Strategy;
var api = '/api/auth';
module.exports = function(app, passport, express, local, User) {
	var router = express.Router();
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect(local.successRedirect);
	});
	passport.use(new VkontakteStrategy({
		clientID: local.clientID,
		clientSecret: local.clientSecret,
		callbackURL: "/api/auth/vkontakte/callback"
	},function(token, tokenSecret, profile, done) {
		process.nextTick(function() {
			User.findOne({
				'vkontakte.id': profile.id
			}, function(err, user) {
				if (err) return done(err);
				else if (user) return done(null, user);
				else {
					var newUser = new User();
					newUser.vkontakte = {
						displayName : profile.displayName,
						username : profile.username,
						id : profile.id,
						token : token,
					}
					newUser.save(function(err) {
						console.log(newUser);
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	router.get('/vkontakte',passport.authenticate('vkontakte'));

	router.get('/vkontakte/callback',
	passport.authenticate('vkontakte', {
		successRedirect: local.successRedirect,
		failureRedirect: local.failureRedirect
	}),function(req, res) {
		res.redirect(local.successRedirect);
	});
	app.use(api, router);
};
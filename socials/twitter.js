var TwitterStrategy = require('passport-twitter').Strategy;
var api = '/api/auth';
module.exports = function(app, passport, express, local, User) {
	var router = express.Router();
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect(local.successRedirect);
	});
	passport.use(new TwitterStrategy({
		consumerKey: local.consumerKey,
		consumerSecret: local.consumerSecret,
		callbackURL: "/api/auth/twitter/callback"
	},function(token, tokenSecret, profile, done) {
		process.nextTick(function() {
			User.findOne({
				'twitter.id': profile.id
			}, function(err, user) {
				if (err) return done(err);
				else if (user) return done(null, user);
				else {
					var newUser = new User();
					newUser.twitter = {
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

	router.get('/twitter',passport.authenticate('twitter'));

	router.get('/twitter/callback',
	passport.authenticate('twitter', {
		successRedirect: local.successRedirect,
		failureRedirect: local.failureRedirect
	}),function(req, res) {
		res.redirect(local.successRedirect);
	});
	app.use(api, router);
};
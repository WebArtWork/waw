var FacebookStrategy = require('passport-facebook').Strategy;
var api = '/api/auth';
module.exports = function(app, passport, express, local, User) {
	var router = express.Router();
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect(local.successRedirect);
	});
	passport.use(new FacebookStrategy({
		clientID: local.clientID,
		clientSecret: local.clientSecret,
		callbackURL: "/api/auth/facebook/callback"
	},function(token, tokenSecret, profile, done) {
		process.nextTick(function() {
			User.findOne({
				'facebook.id': profile.id
			}, function(err, user) {
				if (err) return done(err);
				else if (user) return done(null, user);
				else {
					var newUser = new User();
					newUser.facebook = {
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

	router.get('/facebook',passport.authenticate('facebook'));

	router.get('/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: local.successRedirect,
		failureRedirect: local.failureRedirect
	}),function(req, res) {
		res.redirect(local.successRedirect);
	});
	app.use(api, router);
};
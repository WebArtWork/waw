var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var api = '/api/auth';
module.exports = function(app, passport, express, local, User) {
	var router = express.Router();
	passport.use('local-login', new LocalStrategy({
		usernameField : 'username',
		passwordField : 'password',
		passReqToCallback : true
	},function(req, username, password, done) {
		User.findOne({
			'username': username.toLowerCase()
		}, function(err, user) {
			if (err) return done(err);
			if (!user) return done(null, false);
			if (!validPassword(password,user.password)) return done(null, false);
			return done(null, user);
		});
	}));
	passport.use('local-signup', new LocalStrategy({
		usernameField : 'username',
		passwordField : 'password',
		passReqToCallback : true
	},function(req, username, password, done) {
		User.findOne({
			'username':username.toLowerCase()
		},function(err, user) {
			if (err) return done(err);
			if (user) return done(null, false);
			else {
				var newUser = new User();
				newUser.username = username;
				newUser.password = generateHash(password);
				newUser.save(function(err) {
					return done(null, newUser);
				});
			}
		});
	}));
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect(local.successRedirect);
	});
	router.post('/login', passport.authenticate('local-login', {
		successRedirect: local.successRedirect,
		failureRedirect: local.failureRedirect
	}));
	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: local.successRedirect,
		failureRedirect: local.failureRedirect
	}));
	app.use(api, router);
};

var generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
var validPassword = function(password, myPassword) {
	return bcrypt.compareSync(password, myPassword);
};
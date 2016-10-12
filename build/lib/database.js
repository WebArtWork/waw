var funcs = require(__dirname+'/functionalities.js');
var gu = require('wawgu');
module.exports = function(config) {
	var mongoose = require('mongoose');
	mongoose.connect(config.database.url);
	if (config.pagination) {
		var paginate = require('express-paginate');
		app.use(paginate.middleware(10, 50));
	}
	if (config.database.schemas || config.passport || config.socket.passport) gu.createFolder(config.server + '/databases');
	/*
	if (config.database.public && config.database.public.length > 0) {
		var npmi = require('npmi');
		var addPublicPackage = function(name) {
			config.clientRequireCounter++;
			npmi({
				name: name,
				npmLoad: {
					loglevel: 'silent'
				}
			}, function(err, result) {
				if (err) {
					config.readyForClient();
					return;
				}
				config.functionsToRequire.push(function() {
					console.log('name');
					console.log(name);
					var public = require(name);
					public.routesConfig(app, express);
				});
				config.readyForClient();
			});
		}
		for (var i = 0; i < config.database.public.length; i++) {
			addPublicPackage(config.database.public[i]);
		}
	}
	*/
	if (config.database.schemas) {
		for (var i = 0; i < config.database.schemas.length; i++) {
			config.clientRequireCounter++;
			funcs.createSchema(config.database.schemas[i], function(schema) {
				config.routesToRequire.push(config.server + '/' + gu.ulfirst(schema.name));
				config.readyForClient();
			});
		}
	}
	if (config.passport) {
		var passport = require('passport');
		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});
		var localCounter = 0,
			socials = [];
		config.clientRequireCounter++;
		if (config.passport.local) {
			config.clientRequireCounter++;
			localCounter++;
			funcs.createSchema({
				name: "User",
				fields: [{
					name: "username",
					field: "String",
					unique: true
				}, {
					name: "password",
					field: "String"
				}]
			}, function() {
				socials.push({
					name: 'local',
					local: config.passport.local
				});
				if (--localCounter === 0) getUserSchema();
				config.readyForClient();
			});
		}
		if (config.passport.twitter) {
			config.clientRequireCounter++;
			localCounter++;
			funcs.createSchema({
				name: "User",
				fields: [{
					name: "twitter",
					field: 'Object',
					fields: [{
						name: 'id',
						unique: true,
						sparse: true,
						field: 'String'
					}, {
						name: 'token',
						field: 'String'
					}, {
						name: 'username',
						field: 'String'
					}, {
						name: 'displayName',
						field: 'String'
					}]
				}]
			}, function() {
				socials.push({
					name: 'twitter',
					local: config.passport.twitter
				});
				if (--localCounter === 0) getUserSchema();
				config.readyForClient();
			});
		}
		var getUserSchema = function() {
			var User = require(config.server + '/databases/User.js');
			passport.deserializeUser(function(id, done) {
				User.findById(id, function(err, user) {
					done(err, user);
				});
			});
			config.app.use(passport.initialize());
			config.app.use(passport.session());
			for (var i = 0; i < socials.length; i++) {
				require(__dirname + '/../socials/' + socials[i].name + '.js')(config.app, passport, config.express, socials[i].local, User);
			}
			config.readyForClient();
		}
	}
}
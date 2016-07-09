var fs = require('fs');
var minifier = require('js-minify');
var io = require('./lib/functionalities.js');
var readme = require('./lib/readme.js');
module.exports = function(config) {
	// Defines
		var clientRequireCounter = 0;
		var routesToRequire = [], functionsToRequire = [];
		var express = require('express');
		var app = express();
		var port = config.port||8080;
		var server = require('http').Server(app);
		var morgan = require('morgan');
		var bodyParser = require('body-parser');
		var cookieParser = require('cookie-parser');
		var methodOverride = require('method-override');
		app.use(bodyParser.urlencoded({'extended':'true'}));
		app.use(bodyParser.json({limit: '50mb'}));
		app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
		app.use(methodOverride('X-HTTP-Method-Override'));
		app.use(morgan('dev'));
		app.use(cookieParser());
		app.use(bodyParser.urlencoded({
			'extended': 'true'
		}));
		app.use(bodyParser.json());
		app.use(methodOverride('X-HTTP-Method-Override'));
		app.set('view cache', true);
	// Selections
		io.createFolder(config.server);
		if(config.database){
			var mongoose = require('mongoose');
			mongoose.connect(config.database.url);
			if(config.pagination){
				var paginate = require('express-paginate');
				app.use(paginate.middleware(10, 50));
			}
			if(config.database.schemas||config.passport||config.socket.passport) io.createFolder(config.server+'/databases');
			if(config.database.public&&config.database.public.length>0){
				var npmi = require('npmi');
				var addPublicPackage = function(name){
					clientRequireCounter++;
					npmi({
						name: name,
						npmLoad: {
							loglevel: 'silent'
						}
					}, function(err, result) {
						if(err){
							readyForClient(); 
							return;
						}
						functionsToRequire.push(function(){
							var public = require(name);
							public.routesConfig(app, express);
						});
						readyForClient();
					});
				}
				for (var i = 0; i < config.database.public.length; i++) {
					addPublicPackage(config.database.public[i]);
				}
			}
			if(config.database.schemas){
				for (var i = 0; i < config.database.schemas.length; i++) {
					clientRequireCounter++;
					io.createSchema(config.database.schemas[i], function(schema){
						routesToRequire.push(config.server+'/'+ulfirst(schema.name));
						readyForClient();
					});
				}
			}
			if(config.passport){
				var passport = require('passport');
				passport.serializeUser(function(user, done) {
					done(null, user.id);
				});
				var localCounter = 0, strategies=[];
				clientRequireCounter++;
				if(config.passport.local){
					clientRequireCounter++;
					localCounter++;
					io.createSchema({
						name: "User",
						fields: [{
							name: "username",
							field: "String",
							unique: true
						},{
							name: "password",
							field: "String"
						}]
					}, function(){
						strategies.push({
							name: 'local',
							local: config.passport.local
						});
						if(--localCounter===0) getUserSchema();
						readyForClient();
					});					
				}
				if(config.passport.twitter){
					clientRequireCounter++;
					localCounter++;
					io.createSchema({
						name: "User",
						fields: [{
							name: "twitter",
							field: 'Object',
							fields: [{
								name: 'id',
								unique: true,
								field: 'String'
							},{
								name: 'token',
								field: 'String'
							},{
								name: 'username',
								field: 'String'
							},{
								name: 'displayName',
								field: 'String'
							}]
						}]
					}, function(){
						strategies.push({
							name: 'twitter',
							local: config.passport.twitter
						});
						if(--localCounter===0) getUserSchema();
						readyForClient();
					});
				}
				var getUserSchema = function(){
					var User = require(config.server+'/databases/User.js');
					passport.deserializeUser(function(id, done) {
						User.findById(id, function(err, user) {
							done(err, user);
						});
					});
					app.use(passport.initialize());
					app.use(passport.session());
					for (var i = 0; i < strategies.length; i++) {
						require(__dirname+'/strategies/'+strategies[i].name+'.js')(app, passport, express, strategies[i].local, User);
					}
					readyForClient();
				}
			}
		}
		if(config.session||config.socket.passport){
			var session = require('express-session');
			var store = new(require("connect-mongo")(session))({
				url: config.database.url
			});
		}else var store;
		if(config.socket){
			var io = require('socket.io').listen(server);
			io.createFile(__dirname+'/templates/socket.js', config.server+'/socket.js',{

			}, function(){
				require(config.server+'/socket.js')(io);
			});			
			if(config.socket.adapter){
				var mongo = require('socket.io-adapter-mongo');
				io.adapter(mongo({ host: config.socket.adapter.host, port: config.socket.adapter.port, db: 'KickProject' }));
			}
			if(config.socket.passport&&config.database){
				var passportSocketIo = require("passport.socketio");
				io.use(passportSocketIo.authorize({
					passport: passport,
					cookieParser: cookieParser,
					key: 'express.sid',
					secret: config.prefix,
					store: store,
					success: onAuthorizeSuccess,
					fail: onAuthorizeFail
				}));
				function onAuthorizeSuccess(data, accept) {
					console.log('successful connection to socket.io');
					accept();
				}
				function onAuthorizeFail(data, message, error, accept) {
					console.log('failed connection to socket.io:', message);
					accept();
				}
			}
		}
		if(config.session){
			var sessionMiddleware = session({
				key: 'express.sid',
				secret: 'anAwesomeSecretForMyApp',
				resave: false,
				saveUninitialized: true,
				cookie: {
					maxAge: (365 * 24 * 60 * 60 * 1000)
				},
				rolling: true,
				store: store
			});
			app.use(sessionMiddleware);
		}
	// Client side
		server.listen(port);
		console.log("App listening on port " + port);
		var readyForClient = function(){
			if(--clientRequireCounter===0){
				for (var i = 0; i < routesToRequire.length; i++){
					require(routesToRequire[i])(app, express);
				}
				for (var i = 0; i < functionsToRequire.length; i++) {
					functionsToRequire[i]();
				}

				var pages = config.pages;
				var production = config.production;
				var root = config.root;
				io.createFolder(root + '/client');
				io.createFolder(root + '/client/scss');
				app.use(require('node-sass-middleware')({
					src: root + '/client/scss',
					dest: root + '/client',
					debug: !production,
					outputStyle: 'compressed',
					force: !production
				}));
				for (var i = 0; i < pages.length; i++) buildPage(pages[i]);
				if (config.icon && fs.existsSync(config.icon)) {
					var favicon = require('serve-favicon');
					app.use(favicon(config.icon));
				}
				// End of

			}
		}
	// End of
};








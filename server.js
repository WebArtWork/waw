var fs = require('fs');
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
	// Functionalities
		var createFolder = function(folder){
			if(!fs.existsSync(folder)) fs.mkdir(folder);
		}
		var createFile = function(src, dest, replace, callback){
			if(!fs.existsSync(dest)){
				fs.readFile(src, 'utf8', function(err, data) {
					if(replace.NAMEOFSCHEMAC){
						data = data.replace(/NAMEOFSCHEMAC/g, replace.NAMEOFSCHEMAC);
					}
					if(replace.NAMEOFSCHEMA){
						data = data.replace(/NAMEOFSCHEMA/g, replace.NAMEOFSCHEMA);
					}
					fs.writeFile(dest, data, function(err) {
						callback();
					});
				});
			}else if(callback) callback();
		}
		var locks=[];
		var createSchema = function(schema, callback){
			for (var i = locks.length - 1; i >= 0; i--) {
				if(locks[i]==schema.name){
					setTimeout(function(){
						createSchema(schema, callback);
					},1000);
					return;
				}
			}
			locks.push(schema.name);
			var counter = 1;
			var src = config.server+'/databases/'+schema.name+'.js';
			createFile(__dirname+'/templates/schema.js', src, {
				NAMEOFSCHEMAC: schema.name
			}, function(){
				setSchemaFields(src, schema, function(){
					if(--counter===0){
						for (var i = 0; i < locks.length; i++) {
							if(locks[i]==schema.name){
								locks.splice(i,1);
								break;
							}
						}
						callback(schema);
					}
				});
			});
			createFile(__dirname+'/templates/schemaService.js', config.server+'/'+ulfirst(schema.name)+'.js',{
				NAMEOFSCHEMAC: schema.name,
				NAMEOFSCHEMA: ulfirst(schema.name)
			}, function(){
				/*setServiceFields(schema, function(){
					if(--counter===0) for (var i = 0; i < locks.length; i++) {
						if(locks[i]==schema.name){
							locks.splice(i,1);
							break;
						}
					}
				});*/
			});
		}
		var ulfirst = function(str) {
			return typeof str != "undefined" ? (str += '', str[0].toLowerCase() + str.substr(1)) : '';
		}
		var setSchemaFields = function(src, schema, callback){
			fs.readFile(src, 'utf8', function(err, data) {
				var fields = getContentBetween(data, '/*Fields*/', '/*Custom Fields*/');
				var fieldsLength = fields.length;
				var counter = schema.fields.length;
				for (var i = schema.fields.length - 1; i >= 0; i--) {
					fields += attachFieldToSchema(fields, schema.fields[i]);
				}
				if(fields.length==fieldsLength){
					callback();
					return;
				}
				var newData = setContentBetween(data, '/*Fields*/', '\r\n\t/*Custom Fields*/', fields);
				fs.writeFile(config.server + '/databases/' + schema.name + '.js', newData, function(err) {
					if (--counter === 0) callback();
				});
			});
		}
		var getContentBetween = function(data, from, to){
			return data.split(from)[1].split(to)[0];
		}
		var setContentBetween = function(data, from, to, replace){
			var newData = data.split(from)[0]+from+replace+to+data.split(from)[1].split(to)[1];
			return newData.replace('\r\n\t\r\n','\r\n');
		}
		var attachFieldToSchema = function(fields, field, callback){
			var allFields = fields.split("/*Field");
			for (var i = 0; i < allFields.length; i++) {
				if(allFields[i].split('#')[1]==JSON.stringify(field)) return '';
			}
			var arr='',arrEnd='';
			if(field.field=='Array'||field.field=='ArrayObject'){
				arr='[';
				arrEnd=']';
			}
			if(field.link){
				var fieldText = field.name+': '+arr+'{type: mongoose.Schema.Types.ObjectId, ref: "'+field.link+'"';
				if(field.unique) fieldText += ', unique: true';
				fieldText += '}'+arrEnd+',';
			}else if(field.field=='Object'||field.field=='ArrayObject'){
				var fieldText = attachFieldObject(field);
			}else{
				var fieldText = field.name+': '+arr+'{type: '+field.field;	
				if(field.unique) fieldText += ', unique: true';
				fieldText += '}'+arrEnd+',';
			}
			return '\r\n\t\t/*Field#'+JSON.stringify(field)+'#*/\r\n\t\t'+fieldText;
		}
		var attachFieldObject = function(field){
			var fieldText = field.name+': {';
			for (var i = 0; i < field.fields.length; i++) {
				fieldText += '\r\n\t\t\t'+field.fields[i].name + ': {type: ' + field.fields[i].field;
				if (field.fields[i].unique) fieldText += ', unique: true';
				if (i + 1 == field.fields.length) fieldText += '}\r\n\t\t},';
				else fieldText += '},';
			}
			return fieldText;
		}
		// var setServiceFields = function(schema,callback){
		// 	fs.readFile(src, 'utf8', function(err, data) {
		// 		var fields = getContentBetween(data, '/*Fields*/', '/*Custom Fields*/');
		// 		var counter = schema.fields.length;
		// 		for (var i = schema.fields.length - 1; i >= 0; i--) {
		// 			fields+=attachFieldToSchema(fields, schema.fields[i]);
		// 		}
		// 		var newData = setContentBetween(data, '/*Fields*/', '/*Custom Fields*/', fields);
		// 		fs.writeFile(config.server+'/databases/'+schema.name+'.js', newData, function(err) {
		// 			if(--counter===0){
		// 				for (var i = 0; i < locks.length; i++) {
		// 					if(locks[i]==schema.name){
		// 						locks.splice(i,1);
		// 						break;
		// 					}
		// 				}
		// 			}
		// 		});
		// 	});
		// }
		// var attachFieldToService = function(fields, field, callback){
		// 	var allFields = fields.split("/*Field");
		// 	for (var i = 0; i < allFields.length; i++) {
		// 		if(allFields[i].split('#')[1]==JSON.parse(field)) return '';
		// 	}
		// var arr = '',
		// 	arrEnd = '';
		// if (field.field == 'Array') {
		// 	arr = '[';
		// 	arrEnd = ']';
		// }
		// 	if(field.link){
		// 		var fieldText = field.name+': '+arr+'{type: mongoose.Schema.Types.ObjectId, red: "'+field.link+'"';
		// 		if(field.unique) fieldText += ', unique: true';
		// 		fieldText += '}'+arrEnd;
		// 	}else if(field.field=='Object'){
		// 		var fieldText = '{\r\n\t\t\t';
		// 		for (var i = 0; i < field.fields.length; i++) {
		// 			if (field.fields[i].field == 'Array') arr = true;
		// 			else arr = false;
		// 			fieldText = field.fields[i].name+': {type: '+field.fields[i].field;	
		// 			if(field.fields[i].unique) fieldText += ', unique: true';
		// 			if(i+1 == field.fields.length) fieldText += '}\r\n\t\t}';
		// 			else fieldText += '}\r\n\t\t\t';
		// 		}
		// 	}else{
		// 		var fieldText = field.name+': '+arr+'{type: '+field.field;	
		// 		if(field.unique) fieldText += ', unique: true';
		// 		fieldText += '}'+arrEnd;
		// 	}
		// 	return '\r\n\t\t/*Field#'+JSON.stringify(field)+'#*/\r\n\t\t'+fieldText;
		// }
	// Selections
		createFolder(config.server);
		if(config.database){
			var mongoose = require('mongoose');
			mongoose.connect(config.database.url);
			if(config.pagination){
				var paginate = require('express-paginate');
				app.use(paginate.middleware(10, 50));
			}
			if(config.database.schemas||config.passport||config.socket.passport) createFolder(config.server+'/databases');
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
					createSchema(config.database.schemas[i], function(schema){
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
					createSchema({
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
					createSchema({
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
			createFile(__dirname+'/templates/socket.js', config.server+'/socket.js',{

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
				secret: 'anAwesomeSecretForMyRoomsApp',
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
				config.clientSide(app,config);
			}
		}
	// README.md
	/*	var routesCannotBeUsed=[{
			h1: config.name,
			text: config.description
		},{
			h2: 'Installation',
			text: 'To workout with our project and develop locally you have to download below technologies: <br />1) git: https://git-scm.com <br />2) nodejs: https://nodejs.org <br />3) mongodb: https://www.mongodb.org/downloads <br />Linux: Simply run those commandsapt-get install git nodejs-legacy npm mongodb'
		},{
			h2: 'SSH',
			text: 'To generate new id.rsa key you have to run in your temirminal: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"'
		},{
			h2: 'Git',
			text: 'We suggest you to download our scripts from https://github.com/WebArtWork/GitScripting and use them.'
		}];
		fs.writeFile(config.root+'/README.md', '', function(err) {
			for (var i = 0; i < routesCannotBeUsed.length; i++) {
				if(routesCannotBeUsed[i].h1) fs.appendFile(config.root + '/README.md', '\r\n# ' + routesCannotBeUsed[i].h1, function(err) {});
				if(routesCannotBeUsed[i].h2) fs.appendFile(config.root + '/README.md', '\r\n## ' + routesCannotBeUsed[i].h2, function(err) {});
				fs.appendFile(config.root + '/README.md', '\r\n'+routesCannotBeUsed[i].text, function(err) {});
			}
		});*/
	// End of
};
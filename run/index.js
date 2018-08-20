/*
*	Initialize
*/
	var sd = {
		_express: require('express'),
		_passport: require('passport'),
		_mongoose: require('mongoose'),
		_request: require('request'),
		_config: {}
	};
	require(__dirname+'/../sd')(sd);
	var derer  = require('derer');
	sd._swig = derer;
	sd._derer = derer;

	if (!sd._fs.existsSync(process.cwd()+'/config.json')) {
		console.log('This is not waw project.');
		return process.exit(0);
	}
	sd._config = JSON.parse(sd._fs.readFileSync(process.cwd()+'/config.json','utf8'));
	if (sd._fs.existsSync(process.cwd()+'/server.json')) {
		var extra = JSON.parse(sd._fs.readFileSync(process.cwd()+'/server.json','utf8'));
		for(var key in extra){
			sd._config[key] = extra[key];
		}
	}
/*
*	Domain Management
*/
	if(sd._config.doamins&&sd._fs.existsSync('/etc/nginx/sites-enabled/default')){
		for (var i = 0; i < sd._config.doamins.length; i++) {
			sd._config.doamins[i].port = sd._config.port;
			require(__dirname+'/../exe/domain').set(sd, sd._config.doamins[i]);
		}
	}
	sd._domain_get_domains = require(__dirname+'/../exe/domain').get_domains;
	sd._domain_remove = require(__dirname+'/../exe/domain').remove;
	sd._domain_list = require(__dirname+'/../exe/domain').list;
	sd._domain_set = require(__dirname+'/../exe/domain').set;
/*
*	Mongo / Sessions / Passport
*/
	var app = sd._app = sd._express();
	require('express-zip');

	var server = require('http').Server(sd._app);
	var session = require('express-session');
	var mongoAuth = '';

	var favicon = require('serve-favicon');
	sd._app.use(favicon(process.cwd() + sd._config.icon));

	if(sd._config.mongo){
		if(sd._config.mongo.user&&sd._config.mongo.pass){
			mongoAuth = sd._config.mongo.user + ':' + sd._config.mongo.pass + '@';
		}
		sd._mongoUrl = 'mongodb://'+mongoAuth+(sd._config.mongo.host||'localhost')+':'+(sd._config.mongo.port||'27017')+'/'+(sd._config.mongo.db||'test');
	}
	let redirect = function(redirect){
		sd._app.use(function(req, res, next) {
			if (req.get('host').toLowerCase() == redirect.from.toLowerCase()) {
				res.redirect(redirect.to);
			} else next();
		});
	}
	if(Array.isArray(sd._config.redirects)){
		for (var i = 0; i < sd._config.redirects.length; i++) {
			redirect(sd._config.redirects[i]);
		}
	}

	var cookieParser = require('cookie-parser');
	sd._app.use(cookieParser());

	var methodOverride = require('method-override');
	sd._app.use(methodOverride('X-HTTP-Method-Override'));

	var bodyParser = require('body-parser');
	sd._app.use(bodyParser.urlencoded({
		'extended': 'true',
		'limit': '50mb'
	}));
	sd._app.use(bodyParser.json({
		'limit': '50mb'
	}));
	var store;
	if(sd._mongoUrl){
		store = new(require("connect-mongo")(session))({
			url: sd._mongoUrl
		});
	}
	var sessionMaxAge = 365 * 24 * 60 * 60 * 1000;
	if(typeof sd._config.session == 'number'){
		sessionMaxAge = sd._config.session;
	}
	var sessionMiddleware = session({
		key: 'express.sid.'+sd._config.prefix,
		secret: 'thisIsCoolSecretFromWaWFramework'+sd._config.prefix,
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: sessionMaxAge,
			domain: sd._config.domain||undefined
		},
		rolling: true,
		store: store
	});
	sd._app.use(sessionMiddleware);
	sd._app.use(sd._passport.initialize());
	sd._app.use(sd._passport.session());
	sd._app.set('view cache', true);
/*
*	Derer
*/
	var dererOpts = {
		varControls: ['{{{', '}}}']
	}
	if(!sd._config.production){
		dererOpts.cache = false;
	}
	sd._derer.setDefaults(dererOpts);
	sd._app.engine('html', sd._derer.renderFile);
	sd._app.set('view engine', 'html');
	sd._app.set('view cache', true);
	sd._derer.setFilter('string',function(input){
		return input&&input.toString()||'';
	});		
	sd._derer.setFilter('fixlink',function(link){
		if(link.indexOf('//')>0) return link;
		else return 'http://'+link;
	});
	sd.__derer_viewes = []
	sd._app.set('views', sd.__derer_viewes);
	sd._page = function(url, page, obj, trUrls) {
		if(!obj) obj = {};
		var render = function(req, res) {
			if (typeof obj == 'function') {
				obj = obj(req, res);
			}
			obj.title = obj.page + ':title';
			obj.description = obj.page + ':description';
			obj.image = obj.page + ':image';
			obj.keywords = obj.page + ':keywords';
			/*for (var i = 0; i < languages.length; i++) {
				obj[languages[i]+'Link'] = langs[languages[i]];
			}*/
			res.render(page, obj);
			//res.render(page, sd._ro(req, res, obj));
		} 
		if (url == '/') url = '';
		var langs = {};
		sd._app.get(url || '/', render);
	/*	for (var key in trUrls) {
			if (_languages[trUrls[key]]) {
				langs[trUrls[key]] = key;
				sd._app.get(key, sd['_set_' + trUrls[key]], render);
			}
		}
		for (var i = 0; i < languages.length; i++) {
			if (!langs[languages[i]]) sd._app.get(url + '/' + languages[i], sd['_set_' + languages[i]], render);
		}*/
	}
/*
*	Middleware for parts
*/
	sd._middleware = []; // make __
	sd._app.use(function(req, res, next){
		if(Array.isArray(sd._middleware)&&sd._middleware.length>0){
			sd._serial(sd._middleware, next, {
				req: req,
				res: res
			});
		}else next();
	});
	sd._route = function(url, cb){
		sd._middleware.push(function(obj, next){
			if(obj.req.originalUrl.toLowerCase() == url.toLowerCase()){
				return cb(obj.req, obj.res, next);
			}
			next();
		});
	}
/*
*	Socket Management
*/
	sd._io = require('socket.io')(server, { origins: '*:*'});
	sd._io_connections = [];
	sd._io.on('connection', function (socket) {
		if (socket.request.user) {
			socket.join(socket.request.user._id);
		}
		for (var i = 0; i < sd._io_connections.length; i++) {
			if(typeof sd._io_connections[i] == 'function'){
				sd._io_connections[i](socket);
			}
		}
	});
	var passportSocketIo = require("passport.socketio");
	sd._io.use(passportSocketIo.authorize({
		passport: sd._passport,
		cookieParser: cookieParser,
		key: 'express.sid.'+sd._config.prefix,
		secret: 'thisIsCoolSecretFromWaWFramework'+sd._config.prefix,
		store: store,
		success: function(data, accept) {
			accept();
		},
		fail: function(data, message, error, accept) {
			accept();
		}
	}));
/*
*	Serve project
*/
require(__dirname + '/server')(sd, function(){
	require(__dirname + '/client')(sd);
	server.listen(sd._config.port || 8080);
	console.log("App listening on port " + (sd._config.port || 8080));
});
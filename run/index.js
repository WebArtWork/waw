var sd = {
	_express: require('express'),
	_passport: require('passport'),
	_mongoose: require('mongoose'),
	_fs: require('fs'),
	_fse: require('fs-extra'),
	_git: require('gitty'),
	_path: require('path'),
	_config: {}
};
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

require(__dirname + '/scripts')(sd);

sd._app = sd._express();

var server = require('http').Server(sd._app);
var session = require('express-session');
var mongoAuth = '';
if(sd._config.mongo.user&&sd._config.mongo.pass){
	mongoAuth = sd._config.mongo.user + ':' + sd._config.mongo.pass + '@';
}
sd._mongoUrl = 'mongodb://'+mongoAuth+(sd._config.mongo.host||'localhost')+':'+(sd._config.mongo.port||'27017')+'/'+(sd._config.mongo.db||'test');
console.log(sd._mongoUrl);

var favicon = require('serve-favicon');

var cookieParser = require('cookie-parser');
sd._app.use(cookieParser());

var methodOverride = require('method-override');
sd._app.use(methodOverride('X-HTTP-Method-Override'));

var morgan = require('morgan');
sd._app.use(morgan('dev'));

var bodyParser = require('body-parser');
sd._app.use(bodyParser.urlencoded({
	'extended': 'true',
	'limit': '50mb'
}));
sd._app.use(bodyParser.json({
	'limit': '50mb'
}));

var store = new(require("connect-mongo")(session))({
	url: sd._mongoUrl
});
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
		maxAge: sessionMaxAge
	},
	rolling: true,
	store: store
});
sd._app.use(sessionMiddleware);

sd._middleware = [];
sd._app.use(function(req, res, next){
	if(Array.isArray(sd._middleware)&&sd._middleware.length>0){
		sd._serial(sd._middleware, function(){
			next();
		},{
			req: req,
			res: res
		});
	}else next();
});

sd._app.use(sd._passport.initialize());
sd._app.use(sd._passport.session());
sd._app.set('view cache', true);



sd._app.use(favicon(process.cwd() + sd._config.icon));

// Socket Management
sd._io = require('socket.io').listen(server);

// var mongo = require('socket.io-adapter-mongo');
// sd._io.adapter(mongo(sd._mongoUrl));

var passportSocketIo = require("passport.socketio");

sd._io.use(passportSocketIo.authorize({
	passport: sd._passport,
	cookieParser: cookieParser,
	key: 'express.sid.'+sd._config.prefix,
	secret: 'thisIsCoolSecretFromWaWFramework'+sd._config.prefix,
	store: store,
	success: function(data, accept) {
		console.log('successful connection to socket.io');
		accept();
	},
	fail: function(data, message, error, accept) {
		console.log('error');
		console.log(error);
		console.log('failed connection to socket.io:', message);
		accept();
	}
}));

require(__dirname + '/readAllParts')(sd);
require(__dirname + '/readAllConfigs')(sd, function(){
	require(__dirname + '/readAllModules')(sd, function(){
		require(__dirname + '/readAllRoutes')(sd);
		require(__dirname + '/readClientRoutes')(sd);

		server.listen(sd._config.port || 8080);
		console.log("App listening on port " + (sd._config.port || 8080));
	});
});
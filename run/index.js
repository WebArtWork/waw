var sd = {
	express: require('express'),
	passport: require('passport'),
	mongoose: require('mongoose'),
	fs: require('fs'),
	path: require('path'),
	fse: require('fs-extra')
};
sd.config = JSON.parse(sd.fs.readFileSync(process.cwd()+'/config.json','utf8'));
sd.app = sd.express();

var server = require('http').Server(sd.app);
var session = require('express-session');
sd.mongoUrl = 'mongodb://'+(sd.config.mongo.host||'localhost')+':'+(sd.config.mongo.port||'27017')+'/'+(sd.config.mongo.db||'test');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
sd.app.use(bodyParser.urlencoded({'extended':'true'}));
sd.app.use(bodyParser.json({limit: '50mb'}));
sd.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
sd.app.use(methodOverride('X-HTTP-Method-Override'));
sd.app.use(morgan('dev'));
sd.app.use(cookieParser());
sd.app.use(bodyParser.urlencoded({
	'extended': 'true'
}));
sd.app.use(bodyParser.json());
sd.app.use(methodOverride('X-HTTP-Method-Override'));
var store = new(require("connect-mongo")(session))({
	url: sd.mongoUrl
});
var sessionMiddleware = session({
	secret: 'thisIsCoolSecretFromWaWFramework'+sd.config.prefix,
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: (365 * 24 * 60 * 60 * 1000)
	},
	rolling: true,
	store: store
});
sd.app.use(sessionMiddleware);
sd.app.use(sd.passport.initialize());
sd.app.use(sd.passport.session());
sd.app.set('view cache', true);

sd.app.use(favicon(process.cwd() + sd.config.icon));

require(__dirname + '/scripts')(sd);
require(__dirname + '/readAllParts')(sd);
require(__dirname + '/readAllModules')(sd, function(){
	require(__dirname + '/readAllRoutes')(sd);
	require(__dirname + '/readClientRoutes')(sd);

	server.listen(sd.config.port || 8080);
	console.log("App listening on port " + (sd.config.port || 8080));
});
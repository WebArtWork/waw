var sd = {
	express: require('express'),
	fs: require('fs')
};
sd.config = JSON.parse(sd.fs.readFileSync(process.cwd()+'/config.json','utf8'));
sd.app = sd.express();

require(__dirname + '/scripts')(sd);
require(__dirname + '/readAllParts')(sd);
require(__dirname + '/readAllSchemas')(sd);
require(__dirname + '/readAllControllers')(sd);
require(__dirname + '/readAllRoutes')(sd);
require(__dirname + '/readClientRoutes')(sd);

var server = require('http').Server(sd.app);
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var mongoUrl = 'mongodb://'+(sd.config.mongo.host||'localhost')+':'+(sd.config.mongo.port||'27017')+'/'+(sd.config.mongo.db||'test');
mongoose.connect(mongoUrl);
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
	url: mongoUrl
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
sd.app.use(passport.initialize());
sd.app.use(passport.session());
sd.app.set('view cache', true);

sd.app.use(favicon(process.cwd() + sd.config.icon));
server.listen(sd.config.port||8080);
console.log("App listening on port " + (sd.config.port||8080) );
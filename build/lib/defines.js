module.exports = function(config){
	config.serverApp = require('http').Server(config.app);
	var morgan = require('morgan');
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var methodOverride = require('method-override');
	config.app.use(bodyParser.urlencoded({'extended':'true'}));
	config.app.use(bodyParser.json({limit: '50mb'}));
	config.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
	config.app.use(methodOverride('X-HTTP-Method-Override'));
	config.app.use(morgan('dev'));
	config.app.use(cookieParser());
	config.app.use(bodyParser.urlencoded({
		'extended': 'true'
	}));
	config.app.use(bodyParser.json());
	config.app.use(methodOverride('X-HTTP-Method-Override'));
	config.app.set('view cache', true);


	if (config.session || config.socket.passport) {
		var session = require('express-session');
		var store = new(require("connect-mongo")(session))({
			url: config.database.url
		});
	} else var store;
	if (config.socket) {
		var io = require('socket.io').listen(config.serverApp);
		funcs.createFile(__dirname + '/templates/socket.js', config.server + '/socket.js', {

		}, function() {
			require(config.server + '/socket.js')(io);
		});
		if (config.socket.adapter) {
			var mongo = require('socket.io-adapter-mongo');
			io.adapter(mongo({
				host: config.socket.adapter.host,
				port: config.socket.adapter.port,
				db: 'KickProject'
			}));
		}
		if (config.socket.passport && config.database) {
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
	if (config.session) {
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
		config.app.use(sessionMiddleware);
	}
}
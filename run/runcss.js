var app = require('express')();
var server = require('http').Server(app);

//app.use(require('serve-favicon')(process.cwd() + config.icon));

/*
*	scss
*/
	app.use(require('node-sass-middleware')({
		src: process.cwd(),
		dest: process.cwd(),
		debug: true,
		outputStyle: 'compressed',
		force: true
	}));

	app.use(function(req, res, next) {
		if(req.originalUrl.slice(req.originalUrl.length - 4).toLowerCase() == '.css')
			res.sendFile(process.cwd() + req.originalUrl.split('?')[0]);
		else next();
	});

	// app.use(require('postcss-middleware')({
	// 	plugins: [
	// 		require('autoprefixer')({
	// 		})
	// 	]
	// }));
/*
*	Derer
*/
	var derer  = require('derer');
	derer.setDefaults({
		varControls: ['{{{', '}}}'],
		cache: false
	});
	app.engine('html', derer.renderFile);
	app.set('view engine', 'html');
	app.set('view cache', true);
	derer.setFilter('string',function(input){
		return input&&input.toString()||'';
	});
	app.set('views', process.cwd()+'/demo');
/*
*	Managing Pages
*/
	var fs = require('fs');
	if (!fs.existsSync(process.cwd()+'/demo')) {
		console.log('Please create demo folder with index.html file to see something on the web browser.');
		process.exit(0);
	}
	if (!fs.existsSync(process.cwd()+'/demo/index.html')) {
		console.log('Please create index.html inside the demo folder to see something on the web browser.');
		process.exit(0);
	}
	app.get('/', function(req, res){
		res.render('index');
	});
	var files = fs.readdirSync(process.cwd()+'/demo').filter(function(file) {
		if(file.toLowerCase()=='index.html') return false;
		if(file.slice(file.length - 5).toLowerCase() != '.html') return false;
		return fs.statSync(require('path').join(process.cwd()+'/demo', file)).isFile();
	});
	var renderFiles = function(file){
		app.get('/'+file.replace('.html',''), function(req, res) {
			res.render(file.replace('.html',''));
		});
	}
	for (var i = 0; i < files.length; i++) {
		renderFiles(files[i]);
	}
/*
*	End of Client Routing
*/
server.listen(8080);
console.log("Css folder listening on port 8080");
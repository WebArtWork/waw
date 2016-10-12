var gu = require('wawgu');
var fs = require('fs');
var funcs = require(__dirname+'/functionalities.js');
module.exports = function(config) {
	for (var i = 0; i < config.routesToRequire.length; i++) {
		require(config.routesToRequire[i])(config.app, config.express);
	}
	/*
	for (var i = 0; i < config.functionsToRequire.length; i++) {
		config.functionsToRequire[i]();
	}
	*/
	var pages = config.pages;
	var root = config.root;
	gu.createFolder(root + '/client');
	gu.createFolder(root + '/client/scss');
	config.app.use(require('node-sass-middleware')({
		src: root + '/client/scss',
		dest: root + '/client',
		debug: !config.production,
		outputStyle: 'compressed',
		force: !config.production
	}));
	for (var i = 0; i < pages.length; i++) funcs.buildPage(pages[i]);
	if (config.icon && fs.existsSync(config.icon)) {
		var favicon = require('serve-favicon');
		config.app.use(favicon(config.icon));
	}
}
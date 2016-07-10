var funcs = require(__dirname+'/lib/functionalities.js');
var readme = require(__dirname+'/lib/readme.js');
var gu = require(__dirname+'/lib/gu.js');
module.exports = function(config) {
	// Defines
		var express = require('express');
		var app = express();
		config.express = express;
		config.app = app;
		config.clientRequireCounter = 0;
		config.routesToRequire = [];
		config.functionsToRequire = [];
		require(__dirname+"/lib/defines.js")(config);
		funcs.setConfig(config);
		gu.createFolder(config.server);
		if(config.database) require(__dirname+"/lib/database.js")(config);
	// Client side
		config.serverApp.listen(config.port||8080);
		console.log("App listening on port " + config.port||8080);
		config.readyForClient = function(){
			if(--config.clientRequireCounter===0) require(__dirname+"/lib/client.js")(config);
		}
	// End of
};
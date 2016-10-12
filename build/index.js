module.exports.add = function(){
	if(process.argv[3]){
		switch(process.argv[3].toLowerCase()){
			case 'part':
				return require(__dirname+'/pm').create(process.argv[4]);
			default: 
				return console.log('Wrong Command.');
		}
	}else return console.log('Wrong Command.');
};

module.exports.build = function(){
	console.log('BUILD THE APP NOW');
};


// require(__dirname+"/lib/defines.js")(config);
// funcs.setConfig(config);
// gu.createFolder(config.server);
// if(config.database) require(__dirname+"/lib/database.js")(config);




// config.serverApp.listen(config.port||8080);
// console.log("App listening on port " + config.port||8080);
// config.readyForClient = function(){
// 	if(--config.clientRequireCounter===0) require(__dirname+"/lib/client.js")(config);
// }
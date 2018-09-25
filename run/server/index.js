module.exports = function(sd, cb){
	require(__dirname + '/parts')(sd);
	require(__dirname + '/modules')(sd, function(){
		if(sd._parts){
			for (var i = 0; i < sd._parts.length; i++) {
				if(sd._parts[i].info.router){
					for (var j = 0; j < sd._parts[i].info.router.length; j++) {
						sd._parts[i][sd._parts[i].info.router[j].name] = require(sd._parts[i].src+'/'+sd._parts[i].info.router[j].src)(sd);
					}
				}
			}
			for (var i = 0; i < sd._parts.length; i++) {
				require(__dirname+'/crud')(sd, sd._parts[i].info);
			}
		}
		cb();
	});
}
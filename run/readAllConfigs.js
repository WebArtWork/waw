var fs = require('fs');
var npmi = require('npmi');
var request = require('request');
module.exports = function(sd, next){

	if (sd._fs.existsSync(__dirname+'/../config.json')) {
		var config = sd._fse.readJsonSync(__dirname+'/../config.json', {
			throws: false
		});
	}else var config = {};

	sd._http = {};
	var url = 'http://pagefly.webart.work'
	sd._http.post = function(link, obj, callback){
		request({
			method: 'POST',
			uri: url + link,
			json: obj
		}, function(error, response, body) {
			if(typeof callback != 'function') return;
			callback(body);
		});
	}
	sd._http.get = function(link, callback){
		request({
			method: 'GET',
			uri: url + link
		}, function(error, response, body) {
			if(typeof callback != 'function') return;
			if(body) callback(body);
		});
	}

	sd._parallel([function(next){
		if(sd._config.idea){
			if(!config.users||config.users.length==0){
				console.log('To connect with waw framework you have to attach waw user token.');
				return next();
			}
			sd._http.post('/api/idea/bridge', {
				idea: sd._config.idea,
				token: config.users[0].token
			}, function(data){
				var save = false;
				for(var key in data){
					save = true;
					sd._config[key] = data[key];
				}
				if(save) sd._fse.writeJsonSync(process.cwd()+'/config.json', sd._config);
				next();
			});  
		}else next();
	}], function(){
		next();
	});	
}




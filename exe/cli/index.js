var fs = require('fs');
var fse = require('fs-extra');
var projectConfig = false;
if (fs.existsSync(process.cwd()+'/config.json')) {
	projectConfig = fse.readJsonSync(process.cwd()+'/config.json', {
		throws: false
	})||{};
}
if (fs.existsSync(process.cwd()+'/server.json')) {
	var extra = fse.readJsonSync(process.cwd()+'/server.json', {
		throws: false
	})||{};
	for(var key in extra){
		projectConfig[key] = extra[key];
	}
}
module.exports = function(){
	if(projectConfig.angular){
		require(__dirname+'/ngx')();
	}else{
		require(__dirname+'/angular')();
	}
}
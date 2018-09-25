module.exports = function(sd){
	sd._folders = ['css','fonts','gen','html','img','js','lang','page'];
	sd._ext = ['.css','.ttf','.woff','.woff2','.svg','.otf','.js','.html','.gif','.jpg','.png'];
	sd._clientRoot = process.cwd()+'/client';
	for (var i = 0; i < sd._parts.length; i++) {
		if(sd._parts[i].info.client == 'react') require(__dirname+'/react.js')(sd, sd._parts[i].src+'/client');
		else if(sd._parts[i].info.client == 'vue') require(__dirname+'/vue.js')(sd, sd._parts[i].src+'/client');
		else if(sd._parts[i].info.client == 'angular') require(__dirname+'/ngx.js')(sd, sd._parts[i].src+'/client');
		else if(sd._parts[i].info.client) require(__dirname+'/angular.js')(sd, sd._parts[i].src+'/client');
	}
	if(sd._config.react) require(__dirname+'/react.js')(sd);
	else if(sd._config.vue) require(__dirname+'/vue.js')(sd);
	else if(sd._config.angular) require(__dirname+'/ngx.js')(sd);
	else require(__dirname+'/angular.js')(sd, sd._clientRoot);
}
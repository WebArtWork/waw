module.exports = function(sd){
	sd._folders = ['css','fonts','gen','html','img','js','lang','page'];
	sd._ext = ['.css','.ttf','.woff','.woff2','.svg','.otf','.js','.html','.gif','.jpg','.png'];
	console.log('READING CLIENT SIDE');
	sd._clientRoot = process.cwd()+'/client';
	if(sd._config.react) require(__dirname+'/react.js')(sd);
	else if(sd._config.vue) require(__dirname+'/vue.js')(sd);
	else if(sd._config.angular) require(__dirname+'/ngx.js')(sd);
	else require(__dirname+'/angular.js')(sd, sd._clientRoot);
}
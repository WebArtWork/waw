module.exports = function(sd){
	sd._app.use(function(req, res, next){
		var islocal = req.get('host').toLowerCase().indexOf('localhost')==0;
		var url = req.originalUrl.toLowerCase();
		if(islocal) return next();
		if(url.indexOf('/api/')>-1) return next();
		if(url.indexOf('/waw/')>-1) return next();
		for (var i = 0; i < sd._ext.length; i++) {
			if( sd._isEndOfStr(req.originalUrl.split('?')[0], sd._ext[i]) ) {
				for (var j = 0; j < sd._folders.length; j++) {
					if(req.originalUrl.indexOf(sd._folders[j])>-1){
						return res.sendFile(sd._clientRoot + '/dist/client/' + req.originalUrl.split('?')[0]);
					}
				}
			}
		}
		res.sendFile(sd._clientRoot+'/dist/client/index.html');
	});
}
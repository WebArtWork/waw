/*
* Crud file for client side NAME
*/
crudServices.CNAME = function($http, $timeout, socket){
	// Initialize
		var srv = {};
	// Routes
		srv.create = function(obj, callback){
			$http.post('/api/NAME/create', obj||{})
			.then(function(resp){
				if(resp.data&&typeof callback == 'function'){
					callback(resp.data);
				}else if(typeof callback == 'function'){
					callback(false);
				}
			});
		}
		srv.update = function(obj, callback){
			if(!obj) return;
			$timeout.cancel(obj.updateTimeout);
			if(!obj.name) obj.name='';
			if(socket) obj.print = socket.id;
			$http.post('/api/NAME/update'+obj.name, obj)
			.then(function(resp){
				if(resp.data&&typeof callback == 'function'){
					callback(resp.data);
				}else if(typeof callback == 'function'){
					callback(false);
				}
			});		
		}
		srv.updateAfterWhile = function(obj, callback){
			$timeout.cancel(obj.updateTimeout);
			obj.updateTimeout = $timeout(function(){
				srv.update(obj, callback);
			}, 1000);
		}
		srv.delete = function(obj, callback){
			if(!obj) return;
			if(socket) obj.print = socket.id;
			$http.post('/api/NAME/delete', obj)
			.then(function(resp){
				if(resp.data&&typeof callback == 'function'){
					callback(resp.data);
				}else if(typeof callback == 'function'){
					callback(false);
				}
			});
		}
	// Sockets
		socket.on('CNAMEUpdate', function(NAME){
			if(!NAME.print||NAME.print==socket.id) return;
			if(typeof srv.CNAMEUpdate == 'function'){
				srv.CNAMEUpdate(NAME);
			}
		});
		socket.on('CNAMEDelete', function(NAME){
			if(!NAME.print||NAME.print==socket.id) return;
			if(typeof srv.CNAMEDelete == 'function'){
				srv.CNAMEDelete(NAME);
			}
		});
	// End of service
	return srv;
}
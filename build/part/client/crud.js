/*
* Crud file for client side NAME
*/
crudServices.CNAME = function($http, $timeout, socket){
	// Initialize
	var srv = {},
		updateTimeout,
		admimnUpdateTimeout;
	// Routes
		srv.create = function(obj, callback){
			$http.post('/api/NAME/create', obj||{})
			.then(function(resp){
				if(resp.data){
					callback(resp.data);
					socket.emit('MineCNAMECreated', resp.data);
				}else callback(false);
			});
		}
		srv.update = function(obj, callback){
			if(!obj) return;
			$timeout.cancel(updateTimeout);
			$http.post('/api/NAME/update', obj)
			.then(function(){
				if(typeof callback == 'function')
					callback();
				socket.emit('MineCNAMEUpdated', obj);
			});		
		}
		srv.updateAfterWhile = function(obj){
			$timeout.cancel(updateTimeout);
			updateTimeout = $timeout(function(){
				srv.update(obj);
			}, 1000);
		}
		srv.adminUpdate = function(obj, callback){
			if(!obj) return;
			$timeout.cancel(admimnUpdateTimeout);
			$http.post('/api/NAME/adminUpdate', obj)
			.then(function(){
				if(typeof callback == 'function')
					callback();
				socket.emit('MineCNAMEUpdated', obj);
			});		
		}
		srv.adminUpdateAfterWhile = function(obj){
			$timeout.cancel(admimnUpdateTimeout);
			admimnUpdateTimeout = $timeout(function(){
				srv.adminUpdate(obj);
			}, 1000);
		}
		srv.delete = function(obj, callback){
			if(!obj) return;
			$http.post('/api/NAME/delete', obj)
			.then(function(){
				if(typeof callback == 'function')
					callback();
				socket.emit('MineCNAMEDeleted', obj);
			});
		}
	// Sockets
		socket.on('MineCNAMECreated', function(NAME){
			if(typeof srv.MineCNAMECreated == 'function'){
				srv.MineCNAMECreated(NAME);
			}
		});
		socket.on('MineCNAMEUpdated', function(NAME){
			if(typeof srv.MineCNAMEUpdated == 'function'){
				srv.MineCNAMEUpdated(NAME);
			}
		});
		socket.on('MineCNAMEDeleted', function(NAME){
			if(typeof srv.MineCNAMEDeleted == 'function'){
				srv.MineCNAMEDeleted(NAME);
			}
		});
	// End of service
	return srv;
}
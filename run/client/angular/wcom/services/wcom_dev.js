angular.module("wcom_dev", []).run([function($http){
	var update;
	var check_refresh = function(){
		setTimeout(function(){
			$http.get('/waw/last_update').then(function(resp){
				if(resp.data != update){
					location.reload();
				}else{
					check_refresh();
				}
			});
		}, 2000);
	}
	// $http.get('/waw/last_update').then(function(resp){
	// 	if(resp.data){
	// 		update = resp.data;
	// 		check_refresh();
	// 	}
	// });
}]);
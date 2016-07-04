services.PageManagement=function(){
	"ngInject";
	return {};
};
services.MyUser=function($http, User, $timeout, $translate, RoomsManager){
	"ngInject";
	var user = User.clone();
	$http.get('/api/user/myUser')
	.success(function(myUser){
		user.save(myUser);
	});
	return user;
};
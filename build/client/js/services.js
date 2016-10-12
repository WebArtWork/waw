services.MyUser=function($http, User, $translate){
	"ngInject";
	var user = User.clone();
	$http.get('/api/user/myUser')
	.success(function(myUser){
		user.save(myUser);
	});
	return user;
};
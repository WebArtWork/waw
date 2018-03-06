var a_directives = {};
app.directive(a_directives);
a_directives.topbar=function(){
	"ngInject";
	return {
		restrict: 'EA',
		templateUrl: '/html/admin/_topbar.html'
	}
};
var userCtrl = function($scope, $http, $timeout, $state, mongo, User){
	var u = $scope.u = User;
	var selectUser = function(){
		for (var i = 0; i < u.allUsers.length; i++) {
			if(u.allUsers[i]._id == $state.params._id){
				u.user = u.allUsers[i];
				break;
			}
		}
	}
	u.allUsers = mongo.get('user', {}, {
		query: 'getadmin'
	}, function(){
		if($state.params._id) selectUser();
	});
	u.delete = function(user){
		return mongo.delete('user', user, 'admin');
	}








	u.update = function(user) {
		$timeout.cancel(user.ut);
		$http.post('/api/user/admin/update', {
			isAdmin: user.isAdmin,
			avatarUrl: user.avatarUrl,
			skills: user.skills,
			followings: user.followings,
			followers: user.followers,
			gender: user.gender,
			name: user.name,
			birth: user.birth,
			data: user.data,
			_id: user._id
		});
	}
	u.updateAfterWhile = function(user){
		$timeout.cancel(user.ut);
		user.ut = $timeout(function(){
			u.update(user);
		}, 1000);
	}
	u.changePassword = function(newPass){
		$http.post('/api/user/admin/changePassword',{
			newPass: newPass
		});
	}
}
app.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
	var root = '/Admin';
	$urlRouterProvider.otherwise(root);
	$stateProvider.state({
		name: 'Users',
		url: root, controller: userCtrl,
		templateUrl: '/html/admin/Users.html'
	}).state({
		name: 'Profile', controller: userCtrl,
		url: root+'/Profile/:_id',
		templateUrl: '/html/admin/Profile.html'
	}).state({
		name: 'SuperAdmin', controller: userCtrl,
		url: root+'/SuperAdmin',
		templateUrl: '/html/admin/SuperAdmin.html'
	});
	$locationProvider.html5Mode(true);
});
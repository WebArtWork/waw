directives.topbar=function(){
	"ngInject";
	return {
		restrict: 'EA',
		templateUrl: '/html/user/_topbar.html'
	}
};
var ctrl = function($scope, User){
	var u = $scope.u = User;
}
app.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
	var root = '/';
	$urlRouterProvider.otherwise(root);
	$stateProvider.state({
		name: 'Explore',
		url: root, controller: ctrl,
		templateUrl: '/html/user/Explore.html'
	}).state({
		name: 'MyProfile',
		url: root+'MyProfile', controller: ctrl,
		templateUrl: '/html/user/MyProfile.html'
	}).state({
		name: 'MySettings',
		url: root+'MySettings', controller: ctrl,
		templateUrl: '/html/user/MySettings.html'
	}).state({
		name: 'Profile', controller: ctrl,
		url: root+'/Profile/:_id',
		templateUrl: '/html/user/Profile.html'
	});
	$locationProvider.html5Mode(true);
});
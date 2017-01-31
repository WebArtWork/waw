var directives = {};
app.directive(directives);
directives.topbar = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope) {
		},
		templateUrl: '/PAGENAME/html/topbar.html'
	};
};
/*start_directive_1479380583639*/
/*
*	stranger directive.
*/
directives.userstrangerdefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope) {
		},
		templateUrl: '/PAGENAME/html/user_stranger_default.html'
	};
};
/*end_directive_1479380583639*/
/*start_directive_1479380627217*/
/*
*	friend directive.
*/
directives.userfrienddefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope, MyUser) {
			$scope.MyUser = MyUser;
		},
		templateUrl: '/PAGENAME/html/user_friend_default.html'
	};
};
/*end_directive_1479380627217*/
/*start_directive_1479381311217*/
/*
*	spinner directive.
*/
directives.userspinnerdefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope) {
		},
		templateUrl: '/PAGENAME/html/user_spinner_default.html'
	};
};
/*end_directive_1479381311217*/
/*start_directive_1479389143137*/
/*
*	search directive.
*/
directives.usersearchdefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope, MyUser) {
			$scope.MyUser = MyUser
		},
		templateUrl: '/PAGENAME/html/user_search_default.html'
	};
};
/*end_directive_1479389143137*/
/*start_directive_1479392640404*/
/*
*	avatar directive.
*/
directives.useravatardefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {},
		controller: function($scope, MyUser, img) {
			$scope.MyUser = MyUser;
			var innerInput=angular.element(document.getElementById("inputAvatarUserDirective"));
			var handleFileSelect=function(evt) {
				img.resizeUpTo({
					file: evt.currentTarget.files[0],
					width: 250,
					height: 250
				}, function(dataUrl){
					MyUser.changeAvatar(dataUrl);
				});
			};
			innerInput.bind('change', handleFileSelect);
		},
		templateUrl: '/PAGENAME/html/user_avatar_default.html'
	};
};
/*end_directive_1479392640404*/
/*start_directive_1479395569709*/
/*
*	user directive.
*/
directives.useruserdefault = function() {
	"ngInject";
	return {
		restrict: 'E',
		scope: {
			user: '='
		},
		controller: function($scope, MyUser) {
			$scope.MyUser = MyUser;
		},
		templateUrl: '/PAGENAME/html/user_user_default.html'
	};
};
/*end_directive_1479395569709*/
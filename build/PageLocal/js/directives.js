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
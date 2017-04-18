var app = angular.module('PAGENAME',['ui.router','pascalprecht.translate']);
app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
	"ngInject";
	$urlRouterProvider.otherwise('/');
	var baseUrl = '/PAGENAME';
	$stateProvider.state('Landing', {
		url: baseUrl,
		controller: "Landing",
		templateUrl: "/PAGENAME/page/Landing.html"
	}).state('User', {
		url: baseUrl+"/User/:code",
		controller: "User",
		templateUrl: "/PAGENAME/page/User.html"
	}).state('AboutUs', {
		url: baseUrl+"/AboutUs",
		controller: "AboutUs",
		templateUrl: "/PAGENAME/page/AboutUs.html"
	}).state('AboutFramework', {
		url: baseUrl+"/AboutFramework",
		controller: "AboutFramework",
		templateUrl: "/PAGENAME/page/AboutFramework.html"
	}).state('Structure', {
		url: baseUrl+"/Structure",
		controller: "Structure",
		templateUrl: "/PAGENAME/page/Structure.html"
	});
	$locationProvider.html5Mode(true);
}).config(function ($translateProvider) {
	"ngInject";
	$translateProvider.translations('en', englishPack);
	$translateProvider.translations('ua', ukrainianPack);
	$translateProvider.translations('rus', russianPack);
	$translateProvider.preferredLanguage('en');
	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
});

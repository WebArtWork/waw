var app = angular.module('public',[/*Injections*//*End Injections*/]);
app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
	"ngInject";
	$urlRouterProvider.otherwise('/');
	$stateProvider
	/*States*/
	/*Custom States*/
	/*End States*/
	$locationProvider.html5Mode(true);
}).config(function ($translateProvider) {
	"ngInject";
	$translateProvider.translations('en', englishPack);
	$translateProvider.translations('ua', ukrainianPack);
	$translateProvider.translations('rus', russianPack);
	$translateProvider.preferredLanguage('en');
	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
});
var filters = {};
app.filter(filters);
var directives = {};
app.directive(directives);
var services = {};
app.factory(services);
var collections = {};
app.service(collections);
var controllers = {};
app.controller(controllers);

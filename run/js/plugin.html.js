angular.module("FILE", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("FILE", "HTML");
}]);
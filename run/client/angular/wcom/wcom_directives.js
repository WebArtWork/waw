angular.module("wcom_directives", [])
.directive('pullfiles', function(){
	"ngInject";
	return{
		restrict: 'E', scope: true, replace: true,
		controller: function($scope, img, $timeout, fm){
			const inputs = $scope.inputs = [];
			const complete = (file, opts, cb) => {
				if(opts.content){
					var reader = new FileReader();
					reader.onload = function() {
						$timeout(function(){
							cb(reader.result);
						});
					}
					reader.readAsText(file);
				}else{
					img.resizeUpTo({
						file: file,
						width: opts.width||1920,
						height: opts.height||1080
					}, function(dataUrl) {
						$timeout(function(){
							cb(dataUrl, file);
						});
					});
				}
			}
			fm.addDelay = function(opts, cb){
				if(typeof cb != 'function' || !opts._id) return;
				opts.multiple = !!opts.multiple;
				inputs.push(opts);
				$timeout(function(){
					if(opts.multiple){
						angular.element(document.getElementById(opts._id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							for (var i = 0; i < target.files.length; i++) {
								complete(target.files[i], opts, cb);
							}
						});
					}else{
						angular.element(document.getElementById(opts._id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							complete(target.files[0], opts, cb);
						});
					}
				}, 250);
			}
		},
		template: '<input ng-repeat="i in inputs" type="file" ng-hide="true" id="{{i._id}}" multiple="{{i.multiple}}">'
	}
}).directive('elsize', function($timeout, $window){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			elsize: '='
		}, link: function(scope, el){
			if(!scope.elsize) scope.elsize={};
			scope.elsize.element = el;
			var resize = function(){
				scope.elsize.width = el[0].clientWidth;
				scope.elsize.height = el[0].clientHeight;
				if(typeof scope.elsize.cb == 'function'){
					scope.elsize.cb(scope.elsize);
				}
				$timeout();
			}
			resize();
			angular.element($window).bind('resize', resize);
			scope.$watch(function () {
				return [el[0].clientWidth, el[0].clientHeight].join('x');
			},function (value) {
				if(value.split('x')[0]>0) scope.elsize.width = value.split('x')[0];
				if(value.split('x')[1]>0) scope.elsize.height = value.split('x')[1];
			});
		}
	}
}).directive('wtags', function($filter){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			object: '=',
			model: '@',
			change: '&'
		}, controller: function($scope){
			$scope.tags = $filter('toArr')($scope.object[$scope.model]);
			$scope.update_tags = function(){
				$scope.object[$scope.model] = $scope.tags.join(', ');
				if(typeof $scope.change == 'function') $scope.change();
			}
			$scope.enter = function(e){
				if(e.keyCode==13){
					if($scope.new_tag){
						$scope.tags.push($scope.new_tag);
						$scope.update_tags();
					}
					$scope.new_tag = null;
				}
			}
		}, templateUrl: 'wcom_wtags.html'
	}
}).directive('wmoderators', function(){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			arr: '=',
			users: '=',
			holder: '@',
			change: '&'
		}, templateUrl: 'wcom_wmoderators.html'
	}
}).directive('wmoderatorsview', function(){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			arr: '='
		}, templateUrl: 'wcom_wmoderatorsview.html'
	}
});
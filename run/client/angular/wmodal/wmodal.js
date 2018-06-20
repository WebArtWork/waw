angular.module("wmodal", ["wmodal_spinner.html", "wmodal_service", "wmodal_popup.yes_no.html", "wmodal_popup.html", "wmodal_popup.alert.html", "wmodal_modal.html"]);
angular.module("wmodal_spinner.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_spinner.html", "<div class='modal cover _spinner'><div class=\"spinner-wrap\"><div class=\"spinner-wrap--in\"><ng-transclude><h1 class=\"mb2 pb2\">webart.work</h1><div class=\"spinner\"></div></ng-transclude></div></div></div>");
}]);
angular.module("wmodal_popup.yes_no.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_popup.yes_no.html", "<p>{{message||'Are you sure about this?'}}</p><button ng-click=\"cbYes(); close();\">{{yes||'Yes'}}</button><button ng-click=\"cbNo(); close();\">{{no||'No'}}</button>");
}]);
angular.module("wmodal_popup.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_popup.html", "<div ng-class=\"{lt: lt, lb: lb, rt: rt, rb: rb, c: c}\" ng-style=\"{background: color}\"><button ng-click=\"close();\">Close</button><ng-transclude></ng-transclude></div>");
}]);
angular.module("wmodal_popup.alert.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_popup.alert.html", "<p>{{message}}</p>");
}]);
angular.module("wmodal_modal.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_modal.html", "<div class='modal' ng-class=\"{_full: full, _large: large, _cover: cover, _center: center}\"><div class='modal_fade' ng-click='close();' title='Close'></div><div class='modal_content viewer'><i class='icon icon-close close-m' ng-click='close();' title='Close'></i><h2 ng-if=\"header\">{{header}}</h2><p ng-if=\"content\">{{content}}</p><ng-transclude></ng-transclude></div></div>");
}]);
angular.module("wmodal_service", [])
.service('wmodal', function($compile, $rootScope, $timeout){
	"ngInject";
	/*
	*	Modals
	*/
		this.modals = [];
		this.modal_link = (scope, el)=>{
			scope.close = ()=>{
				for (var i = 0; i < this.modals.length; i++) {
					if(this.modals[i].id==scope.id){
						this.modals.splice(i, 1);
						break;
					}
				}
				if(this.modals.length == 0){
					angular.element(document).find('html').removeClass('noscroll');
				}
				if(scope.cb) scope.cb();
				el.remove();
			}
			for (var i = 0; i < this.modals.length; i++) {
				if(this.modals[i].id==scope.id){
					this.modals[i].close = scope.close;
					scope._data = this.modals[i];
					for(var key in this.modals[i]){
						scope[key] = this.modals[i][key];
					}
					break;
				}
			}
		}
		this.modal = (obj)=>{
			if(!obj.id) obj.id = Date.now();
			let modal = '<wmodal id="'+obj.id+'">';
			if(obj.template) modal += obj.template;
			else if(obj.templateUrl){
				modal += '<ng-include src="';
				modal += "'"+obj.templateUrl+"'";
				modal += '" ng-controller="wparent"></ng-include>';
			}
			modal += '</wmodal>';
			this.modals.push(obj);
			let body = angular.element(document).find('body').eq(0);
			body.append($compile(angular.element(modal))($rootScope));
			angular.element(document).find('html').addClass('noscroll');
		}
	/*
	*	Morphs
	*/

	/*
	*	Popups
	*/
		this.popups = [];
		this.popup_link = (scope, el)=>{
			scope.close = ()=>{
				for (var i = 0; i < this.popups.length; i++) {
					if(this.popups[i].id==scope.id){
						this.popups.splice(i, 1);
						break;
					}
				}
				if(this.popups.length == 0){
					angular.element(document).find('html').removeClass('noscroll');
				}
				if(scope.cb) scope.cb();
				el.remove();
			}
			for (var i = 0; i < this.popups.length; i++) {
				if(this.popups[i].id==scope.id){
					this.popups[i].close = scope.close;
					scope._data = this.popups[i];
					for(var key in this.popups[i]){
						scope[key] = this.popups[i][key];
					}
					break;
				}
			}
		}
		this.popup = (obj)=>{
			if(!obj) return;
			if(!obj.id) obj.id = Date.now();
			let modal = '<wpopup id="'+obj.id+'">';
			modal += '<ng-include src="';

			if(obj.templateUrl){
				modal += "'"+obj.templateUrl+"'";
			}else if(obj.yesno){
				modal += "'wmodal_popup.yes_no.html'";
			}else if(obj.message){
				modal += "'wmodal_popup.alert.html'";
			}else return;

			modal += '" ng-controller="wparent"></ng-include>';
			modal += '</wpopup>';			
			this.popups.push(obj);
			let body = angular.element(document).find('body').eq(0);
			body.append($compile(angular.element(modal))($rootScope));
			angular.element(document).find('html').addClass('noscroll');
			if(!obj.keep){
				$timeout(function(){
					obj.close();
				}, obj.timeout||2000);
			}
		}
	/*
	*	Spinners
	*/
		this.spinners = [];
		this.spinner_link = (scope, el)=>{
			scope.close = ()=>{
				for (var i = 0; i < this.spinners.length; i++) {
					if(this.spinners[i].id==scope.id){
						this.spinners.splice(i, 1);
						break;
					}
				}
				if(this.spinners.length == 0){
					angular.element(document).find('html').removeClass('noscroll');
				}
				if(scope.cb) scope.cb();
				el.remove();
			}
			for (var i = 0; i < this.spinners.length; i++) {
				if(this.spinners[i].id==scope.id){
					this.spinners[i].close = scope.close;
					scope._data = this.spinners[i];
					for(var key in this.spinners[i]){
						scope[key] = this.spinners[i][key];
					}
					break;
				}
			}
		}
		this.spinner = (obj)=>{
			if(!obj) obj = {};
			if(!obj.id) obj.id = Date.now();
			let modal = '<wspinner id="'+obj.id+'">';
			if(obj.template) modal += obj.template;
			else if(obj.templateUrl){
				modal += '<ng-include src="';
				modal += "'"+obj.templateUrl+"'";
				modal += '" ng-controller="wparent"></ng-include>';
			}
			modal += '</wspinner>';
			this.spinners.push(obj);
			let body = angular.element(document).find('body').eq(0);
			body.append($compile(angular.element(modal))($rootScope));
			angular.element(document).find('html').addClass('noscroll');
			return obj;
		}
	/*
	*	End of wmodal
	*/
}).directive('wmodal', function(wmodal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: wmodal.modal_link, templateUrl: 'wmodal_modal.html'
	};
}).directive('wpopup', function(wmodal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: wmodal.popup_link, templateUrl: 'wmodal_popup.html'
	};
}).directive('wspinner', function(wmodal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: wmodal.spinner_link, templateUrl: 'wmodal_spinner.html'
	};
}).controller('wparent', function($scope, $timeout) {
	"ngInject";
	$timeout(function(){
		if($scope.$parent.$parent._data){
			for (var key in $scope.$parent.$parent._data) {
				$scope[key] = $scope.$parent.$parent._data[key];
			}
		}
		if($scope.$parent._data){
			for (var key in $scope.$parent._data) {
				$scope[key] = $scope.$parent._data[key];
			}
		}
	});
});
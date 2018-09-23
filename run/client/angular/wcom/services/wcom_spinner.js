angular.module("wcom_spinner", [])
    .service('spin', function($compile, $rootScope) {
        "ngInject";
        /*
         *	Spinners
         */
        var self = this;
        this.spinners = [];
        this.close = function(id) {
            for (var i = 0; i < self.spinners.length; i++) {
                if (self.spinners[i].id == id) {
                    self.spinners[i].el.remove();
                    self.spinners.splice(i, 1);
                    break;
                }
            }

        }
        this.open = function(obj) {
            if (!obj) obj = {};
            if (!obj.id) obj.id = Date.now();
            var modal = '<spin  id="' + obj.id + '">';
            if (obj.template) modal += obj.template;
            else if (obj.templateUrl) {
                modal += '<ng-include src="';
                modal += "'" + obj.templateUrl + "'";
                modal += '"></ng-include>';
            } else {
                modal += '<ng-include  src="';
                modal += "'wmodal_spinner.html'";
                modal += '"></ng-include>';
            }
            modal += '</spin>';
            this.spinners.push(obj);
            if (obj.element) {
            	
            	console.log(obj.element);
            } else {
            	var body = angular.element(document).find('body').eq(0);
				body.append($compile(angular.element(modal))($rootScope));
				angular.element(document).find('html').addClass('noscroll');
            }
            return obj.id;
        }
    }).directive('spin', function(spin) {
        "ngInject";
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@'
            },
            link: function(scope, el) {
                for (var i = 0; i < spinner.spinners.length; i++) {
                    if (spinner.spinners[i].id == scope.id) {
                        spinner.spinners[i].el = el;
                    }
                }
            },
            templateUrl: 'wmodal_spinner.html'
        };
    });
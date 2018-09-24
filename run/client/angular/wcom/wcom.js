angular.module("wcom", ["angular-click-outside", "wcom_directives", "wcom_filters", "wcom_modal", "wcom_mongo", "wcom_popup", "wcom_sd", "wcom_services", "wcom_spinner", "wcom_wmodaerators.html", "wcom_wmodaeratorsview.html", "wcom_wmoderators.html", "wcom_wmoderatorsview.html", "wcom_wtags.html", "wmodal_modal.html", "wmodal_popup.html", "wmodal_spinner.html"]);
/*global angular, navigator*/

(function() {
    'use strict';

    angular
        .module('angular-click-outside', [])
        .directive('clickOutside', [
            '$document', '$parse', '$timeout',
            clickOutside
        ]);

    /**
     * @ngdoc directive
     * @name angular-click-outside.directive:clickOutside
     * @description Directive to add click outside capabilities to DOM elements
     * @requires $document
     * @requires $parse
     * @requires $timeout
     **/
    function clickOutside($document, $parse, $timeout) {
        return {
            restrict: 'A',
            link: function($scope, elem, attr) {

                // postpone linking to next digest to allow for unique id generation
                $timeout(function() {
                    var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.split(/[ ,]+/) : [],
                        fn;

                    function eventHandler(e) {
                        var i,
                            element,
                            r,
                            id,
                            classNames,
                            l;

                        // check if our element already hidden and abort if so
                        if (angular.element(elem).hasClass("ng-hide")) {
                            return;
                        }

                        // if there is no click target, no point going on
                        if (!e || !e.target) {
                            return;
                        }

                        // loop through the available elements, looking for classes in the class list that might match and so will eat
                        for (element = e.target; element; element = element.parentNode) {
                            // check if the element is the same element the directive is attached to and exit if so (props @CosticaPuntaru)
                            if (element === elem[0]) {
                                return;
                            }

                            // now we have done the initial checks, start gathering id's and classes
                            id = element.id,
                                classNames = element.className,
                                l = classList.length;

                            // Unwrap SVGAnimatedString classes
                            if (classNames && classNames.baseVal !== undefined) {
                                classNames = classNames.baseVal;
                            }

                            // if there are no class names on the element clicked, skip the check
                            if (classNames || id) {

                                // loop through the elements id's and classnames looking for exceptions
                                for (i = 0; i < l; i++) {
                                    //prepare regex for class word matching
                                    r = new RegExp('\\b' + classList[i] + '\\b');

                                    // check for exact matches on id's or classes, but only if they exist in the first place
                                    if ((id !== undefined && r.test(id)) || (classNames && r.test(classNames))) {
                                        // now let's exit out as it is an element that has been defined as being ignored for clicking outside
                                        return;
                                    }
                                }
                            }
                        }

                        // if we have got this far, then we are good to go with processing the command passed in via the click-outside attribute
                        $timeout(function() {
                            fn = $parse(attr['clickOutside']);
                            fn($scope, {
                                event: e
                            });
                        });
                    }

                    // if the devices has a touchscreen, listen for this event
                    if (_hasTouch()) {
                        $document.on('touchstart', function() {
                            setTimeout(eventHandler)
                        });
                    }

                    // still listen for the click event even if there is touch to cater for touchscreen laptops
                    $document.on('click', eventHandler);

                    // when the scope is destroyed, clean up the documents event handlers as we don't want it hanging around
                    $scope.$on('$destroy', function() {
                        if (_hasTouch()) {
                            $document.off('touchstart', eventHandler);
                        }

                        $document.off('click', eventHandler);
                    });

                    /**
                     * @description Private function to attempt to figure out if we are on a touch device
                     * @private
                     **/
                    function _hasTouch() {
                        // works on most browsers, IE10/11 and Surface
                        return 'ontouchstart' in window || navigator.maxTouchPoints;
                    };
                });
            }
        };
    }
})();
angular.module("wcom_directives", [])
.directive('pullfiles', function(){
	"ngInject";
	return{
		restrict: 'E', scope: true, replace: true,
		controller: ["$scope", "img", "$timeout", "file", function($scope, img, $timeout, file){
			var inputs = $scope.inputs = [];
			file.addDelay = function(opts, cb){
				if(typeof cb != 'function' || !opts.id) return;
				opts.multiple = !!opts.multiple;
				inputs.push(opts);
				$timeout(function(){
					if(opts.multiple){
						var addImage = function(file) {
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
						angular.element(document.getElementById(opts.id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							for (var i = 0; i < target.files.length; i++) {
								addImage(target.files[i]);
							}
						});
					}else{
						angular.element(document.getElementById(opts.id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							img.resizeUpTo({
								file: target.files[0],
								width: opts.width||1920,
								height: opts.height||1080
							}, function(dataUrl) {
								$timeout(function(){
									cb(dataUrl, target.files[0]);
								});
							});
						});
					}
				}, 250);
			}
		}],
		template: '<input ng-repeat="i in inputs" type="file" ng-hide="true" id="{{i.id}}" multiple="{{i.multiple}}">'
	}
}).directive('elsize', ["$timeout", "$window", function($timeout, $window){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			elsize: '='
		}, link: function(scope, el){
			if(!scope.elsize) scope.elsize={};
			var resize = function(){
				scope.elsize.width = el[0].clientWidth;
				scope.elsize.height = el[0].clientHeight;
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
}]).directive('wtags', ["$filter", function($filter){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			object: '=',
			model: '@',
			change: '&'
		}, controller: ["$scope", function($scope){
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
		}], templateUrl: 'wcom_wtags.html'
	}
}]).directive('wmodaerators', ["$filter", function($filter){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			arr: '=',
			users: '=',
			holder: '@',
			change: '&'
		}, templateUrl: 'wcom_wmodaerators.html'
	}
}]).directive('wmodaeratorsview', ["$filter", function($filter){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			arr: '='
		}, templateUrl: 'wcom_wmodaeratorsview.html'
	}
}]);
String.prototype.rAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
angular.module("wcom_filters", [])
.filter('toArr', function(){
	"ngInject";
	return function(str, div){
		if(!str) return [];
		str=str.split((div||',')+' ').join(',');
		var arr = str.split(div||',');
		for (var i = arr.length - 1; i >= 0; i--) {
			if(!arr[i]) arr.splice(i, 1);
		}
		return arr;
	}
}).filter('rArr', function(){
	"ngInject";
	return function(origin_arr, remove_arr){
		var arr = origin_arr.slice();
		for (var i = arr.length - 1; i >= 0; i--) {
			for (var j = 0; j < remove_arr.length; j++) {
				if(remove_arr[j]._id == arr[i]._id){
					arr.splice(i, 1);
					break;
				}
			}
		}
		return arr;
	}
}).filter('mongodate', function(){
	"ngInject";
	return function(_id){
		if(!_id) return new Date();
		var timestamp = _id.toString().substring(0,8);
		return new Date(parseInt(timestamp,16)*1000);
	}
}).filter('fixlink', function(){
	"ngInject";
	return function(link){
		if(!link||link.indexOf('//')>0) return link;
		else return 'http://'+link;
	}
}).filter('wdate', ["$filter", function($filter){
	"ngInject";
	return function(time, addYear, addMonth, addDay){
		time = new Date(time);
		if(addYear){
			time.setFullYear(time.getFullYear() + parseInt(addYear));
		}
		if(addMonth){
			time.setMonth(time.getMonth() + parseInt(addMonth));
		}
		if(addDay){
			time.setDate(time.getDate() + parseInt(addDay));
		}
		var timems = time.getTime();
		var nowms = new Date().getTime();
		var dayms = nowms - 86400000;
		if(timems>dayms){
			return $filter('date')(time, 'hh:mm a');
		}
		var yearms = nowms - (2628000000*12);
		if(timems>yearms){
			return $filter('date')(time, 'MMM dd hh:mm a');
		}
		return $filter('date')(time, 'yyyy MMM dd hh:mm a');
	}
}]).filter('messagetime', ["$filter", function($filter){
	"ngInject";
	return function(time){
		time = new Date(time);
		var timems = time.getTime();
		var nowms = new Date().getTime();
		var minago = nowms - 60000;
		if(timems>minago) return 'A min ago.';
		var dayms = nowms - 86400000;
		if(timems>dayms){
			return $filter('date')(time, 'hh:mm a');
		}
		var yearms = nowms - (2628000000*12);
		if(timems>yearms){
			return $filter('date')(time, 'MMM dd hh:mm a');
		}
		return $filter('date')(time, 'yyyy MMM dd hh:mm a');
	}
}]);
angular.module("wcom_modal", [])
.service('modal', ["$compile", "$rootScope", function($compile, $rootScope){
	"ngInject";
	/*
	*	Modals
	*/
		var self = this;
		self.modals = [];
		this.modal_link = function(scope, el){
			scope.close = function(){
				for (var i = 0; i < self.modals.length; i++) {
					if(self.modals[i].id==scope.id){
						self.modals.splice(i, 1);
						break;
					}
				}
				if(self.modals.length == 0){
					angular.element(document).find('html').removeClass('noscroll');
				}
				if(scope.cb) scope.cb();
				el.remove();
			}
			for (var i = 0; i < self.modals.length; i++) {
				if(self.modals[i].id==scope.id){
					self.modals[i].close = scope.close;
					scope._data = self.modals[i];
					for(var key in self.modals[i]){
						scope[key] = self.modals[i][key];
					}
					break;
				}
			}
		}
		this.open = function(obj){
			if(!obj || (!obj.templateUrl && !obj.template)) 
				return console.warn('Please add templateUrl or template'); 
			if(!obj.id) obj.id = Date.now();
			var modal = '<modal id="'+obj.id+'">';
			if(obj.template) modal += obj.template;
			else if(obj.templateUrl){
				modal += '<ng-include src="';
				modal += "'"+obj.templateUrl+"'";
				modal += '" ng-controller="wparent"></ng-include>';
			}
			modal += '</modal>';
			self.modals.push(obj);
			var body = angular.element(document).find('body').eq(0);
			body.append($compile(angular.element(modal))($rootScope));
			angular.element(document).find('html').addClass('noscroll');
		}
	/*
	*	End of wmodal
	*/
}]).directive('modal', ["modal", function(modal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: modal.modal_link, templateUrl: 'wmodal_modal.html'
	};
}]).controller('wparent', ["$scope", "$timeout", function($scope, $timeout) {
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
}]);
angular.module("wcom_mongo", []).service('mongo', ["$http", "$timeout", "socket", function($http, $timeout, socket){
	/*
	*	Data will be storage for all information we are pulling from waw crud.
	*	data['arr' + part] will host all docs from collection part in array form
	*	data['obj' + part] will host all docs from collection part in object form
	*		and all groups collecitons provided
	*	data['opts' + part] will host options for docs from collection part
	*		Will be initialized only inside get
	*		Will be used inside push
	*/
		var data = {};
	/*
	*	waw crud connect functions
	*/
		this.create = function(part, doc, cb) {
			if (typeof doc == 'function') {
				cb = doc;
				doc = {};
			}
			$http.post('/api/' + part + '/create', doc || {}).then(function(resp) {
				if (resp.data) {
					push(part, resp.data);
					if (typeof cb == 'function') cb(resp.data);
				} else if (typeof cb == 'function') {
					cb(false);
				}
			});
		};
		this.get = function(part, opts, cb) {
			if (typeof opts == 'function') {
				cb = opts;
				opts = {};
			}
			if(data['loaded'+part]){
				if(typeof cb == 'function'){
					cb(data['arr' + part], data['obj' + part]);
				}
				return data['arr' + part];
			}
			data['arr' + part] = [];
			data['obj' + part] = {};
			data['opts' + part] = opts = opts || {};
			if(opts.query){
				for(var key in opts.query){
					if(typeof opts.query[key] == 'function'){
						opts.query[key] = {
							allow: opts.query[key]
						}
					}
				}
			}
			if(opts.groups){
				if(typeof opts.groups == 'string'){
					opts.groups = opts.groups.split(' ');
				}
				if(Array.isArray(opts.groups)){
					var arr = opts.groups;
					opts.groups = {};
					for(var i = 0; i < arr.length; i++){
						if(typeof arr[i] == 'string'){
							opts.groups[arr[i]] = true;
						}else {
							for(var key in arr[i]){
								opts.groups[key] = arr[i][key];
							}
						}
					}
				}
				for(var key in opts.groups){
					if(typeof opts.groups[key] == 'boolean'){
						if(opts.groups[key]){
							opts.groups[key] = {
								field: function(doc){
									return doc[key];
								}
							}
						}else{
							delete opts.groups[key];
							continue;
						}
					}
					if(typeof opts.groups[key] != 'object'){
						delete opts.groups[key];
						continue;
					}
					if(typeof opts.groups[key].field != 'function'){
						delete opts.groups[key];
						continue;
					}
				}
			}
			$http.get('/api/' + part + '/get').then(function(resp) {
				if (resp.data) {
					for (var i = 0; i < resp.data.length; i++) {
						push(part, resp.data[i]);
					}
					if (typeof cb == 'function')
						cb(data['arr' + part], data['obj' + part], opts.name||'', resp.data);
				} else if (typeof cb == 'function') {
					cb(data['arr' + part], data['obj' + part], opts.name||'', resp.data);
				}
				data['loaded'+part]= true;
				if(opts.next){
					next(part, opts.next, cb);
				}
			});
			return data['arr' + part];
		};
		this.updateAll = function(part, doc, opts, cb) {
			if (typeof opts == 'function') {
				cb = opts;
				opts = {};
			}
			if (typeof opts != 'object') opts = {};
			if (opts.fields) {
				if (typeof opts.fields == 'string') opts.fields = opts.fields.split(' ');
				var _doc = {};
				for (var i = 0; i < opts.fields.length; i++) {
					_doc[opts.fields[i]] = doc[opts.fields[i]];
				}
				doc = _doc;
			}
			$http.post('/api/' + part + '/update/all' + (opts.name || ''), doc)
				.then(function(resp) {
					if (resp.data && typeof cb == 'function') {
						cb(resp.data);
					} else if (typeof cb == 'function') {
						cb(false);
					}
				});
		};
		this.updateUnique = function(part, doc, opts, cb) {
			if (!opts) opts = '';
			if (typeof opts == 'function') {
				cb = opts;
				opts = '';
			}
			if (typeof opts != 'object') opts = {};
			if (opts.fields) {
				if (typeof opts.fields == 'string') opts.fields = opts.fields.split(' ');
				var _doc = {};
				for (var i = 0; i < opts.fields.length; i++) {
					_doc[opts.fields[i]] = doc[opts.fields[i]];
				}
				doc = _doc;
			}
			$http.post('/api/' + part + '/unique/field' + opts, doc).
			then(function(resp) {
				if (typeof cb == 'function') {
					cb(resp.data);
				}
			});
		};
		this.delete = function(part, doc, opts, cb) {
			if (!opts) opts = '';
			if (!doc) return;
			if (typeof opts == 'function') {
				cb = opts;
				opts = '';
			}
			$http.post('/api/' + part + '/delete' + opts, doc).then(function(resp) {
				if (resp.data && Array.isArray(data['arr' + part])) {
					for (var i = 0; i < data['arr' + part].length; i++) {
						if (data['arr' + part][i]._id == doc._id) {
							data['arr' + part].splice(i, 1);
							break;
						}
					}
					delete data['obj' + part][doc._id];
					if(data['opts'+part].groups){
						for(var key in data['opts'+part].groups){
							for(var field in data['obj' + part][key]){
								for (var i = data['obj' + part][key][field].length-1; i >= 0 ; i--) {
									if (data['obj' + part][key][field][i]._id == doc._id) {
										data['obj' + part][key][field].splice(i, 1);
									}
								}
							}
						}
					}
					if(data['opts'+part].query){
						for(var key in data['opts'+part].query){
							for (var i = data['obj' + part][key].length-1; i >= 0 ; i--) {
								if (data['obj' + part][key][i]._id == doc._id) {
									data['obj' + part][key].splice(i, 1);
									break;
								}
							}
						}
					}
				}
				if (resp && typeof cb == 'function') {
					cb(resp.data);
				} else if (typeof cb == 'function') {
					cb(false);
				}
			});
		};
		this._id = function(cb) {
			if (typeof cb != 'function') return;
			$http.get('/waw/newId').then(function(resp) {
				cb(resp.data);
			});
		};
		this.to_id = function(docs) {
			if (!arr) return [];
			if(Array.isArray(docs)){
	        	docs = docs.slice();
	        }else if(typeof docs == 'object'){
	        	if(docs._id) return [docs._id];
	        	var _docs = [];
	        	for(var key in docs){
	        		if(docs[key]) _docs.push(docs[key]._id||docs[key]);
	        	}
	        	docs = _docs;
	        }
			for (var i = 0; i < docs.length; ++i) {
				if (docs[i]) docs[i] = docs[i]._id || docs[i];
			}
			return docs;
		}
		this.afterWhile = function(doc, cb, time) {
			if (typeof cb == 'function' && typeof doc == 'object') {
				$timeout.cancel(doc.updateTimeout);
				doc.updateTimeout = $timeout(cb, time || 1000);
			}
		};
		var populate = this.populate = function(doc, field, part) {
			if (!doc || !field || !part) return;
			if (data['loaded' + part]) {
				console.log(data['obj' + part]);
				if (Array.isArray(field)) {
					for (var i = 0; i < field.length; i++) {
						populate(doc, field[i], part);
					}
					return;
				} else if (field.indexOf('.') > -1) {
					field = field.split('.');
					var sub = field.shift();
					if (typeof doc[sub] != 'object') return;
					return populate(doc[sub], field.join('.'), part);
				}
				if (Array.isArray(doc[field])) {
					for (var i = doc[field].length - 1; i >= 0; i--) {
						if (data['obj' + part][doc[field][i]]) {
							doc[field][i] = data['obj' + part][doc[field][i]]
						} else {
							doc[field].splice(i, 1);
						}
					}
					return;
				} else if (typeof doc[field] == 'string') {
					doc[field] = data['obj' + part][doc[field]] || null;
				} else return;
			} else {
				$timeout(function() {
					populate(doc, field, part);
				}, 250);
			}
			console.log(data['obj' + part]);
		};
		var on = this.on = function(parts, cb) {
			if (typeof parts == 'string') {
				parts = parts.split(" ");
			}
			for (var i = 0; i < parts.length; i++) {
				if (!data['loaded' + parts[i]]) {
					return $timeout(function() {
						on(parts, cb);
					}, 100);
				}
			}
			cb();
		};
	/*
	*	mongo sort filters
	*/
	/*
	*	mongo replace filters
	*/
		this.beArr = function(val, cb) {
			if (!Array.isArray(val)) cb([]);
			else cb(val);
		};
		this.beObj = function(val, cb) {
			if (typeof val != 'object' || Array.isArray(val)) {
				val = {};
			}
			cb(val);
		};
		this.beDate = function(val, cb) {
			cb( new Date(val) );
		};
		this.beString = function(val, cb){
			if(typeof val != 'string'){
				val = '';
			}
			cb(val);
		};
		this.forceArr = function(cb) {
			cb([]);
		};
		this.forceObj = function(cb) {
			cb({});
		};
		this.forceString = function(val, cb){ cb(''); };
		this.getCreated = function(val, cb, doc){
			return new Date(parseInt(doc._id.substring(0,8), 16)*1000);
		};
	/*
	*	mongo local support functions
	*/
		var replace = function(doc, value, rpl, part) {
			if (value.indexOf('.') > -1) {
				value = value.split('.');
				var sub = value.shift();
				if (doc[sub] && (typeof doc[sub] != 'object' || Array.isArray(doc[sub])))
					return;
				if (!doc[sub]) doc[sub] = {};
				return replace(doc[sub], value.join('.'), rpl, part);
			}
			if (typeof rpl == 'function') {
				rpl(doc[value], function(newValue) {
					doc[value] = newValue;
				}, doc);
			}
		};
		var push = function(part, doc) {
			if(data['obj' + part][doc._id]) return;
			if (data['opts' + part].replace) {
				for (var key in data['opts' + part].replace) {
					replace(doc, key, data['opts' + part].replace[key], part);
				}
			}
			if(data['opts'+part].populate){
				var p = data['opts'+part].populate;
				if(Array.isArray(p)){
					for(var i = 0; i < p.length; i++){
						if(typeof p == 'object' && p[i].field && p[i].part){
							populate(doc, p[i].field, p[i].part);
						}
					}
				}else if(typeof p == 'object' && p.field && p.part){
					populate(doc, p.field, p.part);
				}
			}
			data['arr' + part].push(doc);
			data['obj' + part][doc._id] = doc;
			if(data['opts'+part].groups){
				for(var key in data['opts'+part].groups){
					var g = data['opts'+part].groups[key];
					if(typeof g.ignore == 'function' && g.ignore(doc)) return;
					if(typeof g.allow == 'function' && !g.allow(doc)) return;
					if(!data['obj' + part][key]){
						data['obj' + part][key] = {};
					}
					var set  = function(field){
						if(!field) return;
						if(!Array.isArray(data['obj' + part][key][field])){
							data['obj' + part][key][field] = [];
						}
						data['obj' + part][key][field].push(doc);
						if(typeof g.sort == 'function'){
							data['obj' + part][key][field].sort(g.sort);
						}
					}
					set(g.field(doc, function(field){
						set(field);
					}));
				}
			}
			if(data['opts'+part].query){
				for(var key in data['opts'+part].query){
					var query = data['opts'+part].query[key];
					if(typeof query.ignore == 'function' && query.ignore(doc)) return;
					if(typeof query.allow == 'function' && !query.allow(doc)) return;
					if(!data['obj' + part][key]){
						data['obj' + part][key] = [];
					}
					 data['obj' + part][key].push(doc);
					if(typeof query.sort == 'function'){
						data['obj' + part][key].sort(query.sort);
					}
				}
			}
		};
		var next = function(part, opts, cb){
			$http.get('/api/' + part + '/get').then(function(resp) {
				if (resp.data) {
					for (var i = 0; i < resp.data.length; i++) {
						push(part, resp.data[i]);
					}
					if (typeof cb == 'function')
						cb(data['arr' + part], data['obj' + part], opts.name||'', resp.data);
				} else if (typeof cb == 'function') {
					cb(data['arr' + part], data['obj' + part], opts.name||'', resp.data);
				}
				if(opts.next){
					next(part, opts.next, cb);
				}
			});
		};
	/*
	*	Endof Mongo Service
	*/
}]);
angular.module("wcom_popup", [])
    .service('popup', ["$compile", "$rootScope", function($compile, $rootScope) {
        "ngInject";
        var self = this;
        var event;
        this.open = function(size, config, event) {
            if (!config || (!config.templateUrl && !config.template))
                return console.warn('Please add templateUrl or template');
            var popup = '<popup style="position: fixed;" config="' + (JSON.stringify(config)).split('"').join("'") + '"size="' + (JSON.stringify(size)).split('"').join("'") + '">';
            if (config.template) popup += config.template;
            else if (config.templateUrl) {
                popup += '<ng-include src="';
                popup += "'" + config.templateUrl + "'";
                popup += '"></ng-include>';
            }
            popup += '</popup>';
            var body = angular.element(document).find('body').eq(0);
            body.append($compile(angular.element(popup))($rootScope));
            angular.element(document).find('html').addClass('noscroll');
        }
    }]).directive('pop', ["popup", function(popup) {
        "ngInject";
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                config: '='
            },
            link: function($scope) {
                $scope.size = {
                    top: 10,
                    left: 370
                };
                $scope.open = function(event) {
                    //Add to scope.size span element left, top from event
                    popup.open($scope.size, $scope.config, event);

                }
            },
            templateUrl: 'wmodal_popup.html'
        };
    }]).directive('popup', ["popup", function(popup) {
        "ngInject";
        return {
            scope: {
                config: '=',
                size: '='
            },
            link: function($scope) {
                switch ($scope.config.pos) {
                    case 'rt':
                        $scope.size.left = event.clientX - event.offsetX + event.target.offsetWidth;
                        $scope.size.top = event.clientY - event.offsetY - (event.target.offsetHeight * 2);
                        console.log(event);
                        break;
                    case 'r':
                        $scope.size.left = event.clientX - event.offsetX + event.target.offsetWidth;
                        $scope.size.top = event.clientY - event.offsetY - (event.target.offsetHeight / 2);

                        break;
                    case 'rb':
                        $scope.size.left = event.clientX - event.offsetX + event.target.offsetWidth;

                        $scope.size.top = event.clientY - event.offsetY + event.target.offsetHeight;

                        break;
                    case 'b':
                        $scope.size.left = event.clientX - event.offsetX + (event.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                         $scope.size.top = event.clientY - event.offsetY + event.target.offsetHeight;

                        break;
                    case 'lb':
                        $scope.size.left = event.clientX - event.offsetX - $scope.size.offsetWidth;
                          $scope.size.top = event.clientY - event.offsetY + event.target.offsetHeight;

                        break;
                    case 'l':
                        $scope.size.left = event.clientX - event.offsetX - $scope.size.offsetWidth;
                         $scope.size.top = event.clientY - event.offsetY - (event.target.offsetHeight / 2);

                        break;
                    case 'lt':
                        $scope.size.left = event.clientX - event.offsetX - $scope.size.offsetWidth;
                        $scope.size.top = event.clientY - event.offsetY - (event.target.offsetHeight * 2);

                        break;
                    case 't':
                        $scope.size.left = event.clientX - event.offsetX + (event.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                        $scope.size.top = event.clientY - event.offsetY - $scope.size.offsetHeight;

                        break;
                    default:
                        return self.default($scope);
                }
                return [$scope.size.left, $scope.size.top];
            
                this.default = function($scope) {
                    console.log(event);
                    var top = event.clientY - event.offsetY > $scope.size.offsetHeight;

                    var left = event.clientX - event.offsetX > $scope.size.offsetWidth;

                    var bottom = document.documentElement.clientHeight - ((event.clientX - event.offsetX) + $scope.size.offsetHeight) > $scope.size.offsetHeight;

                    var right = document.documentElement.clientWidth - ((event.clientX - event.offsetX) + $scope.size.offsetWidth) > $scope.size.offsetWidth;



                    console.log(top);
                    console.log(left);
                    console.log(bottom);
                    console.log(right);


                    if (left && top) {
                        $scope.config.pos = 'lt';
                    } else if (right && top) {
                        $scope.config.pos = 'rt';
                    } else if (right && bottom) {
                        $scope.config.pos = 'rb';
                    } else if (left && bottom) {
                        $scope.config.pos = 'lb';
                    } else if (top) {
                        $scope.config.pos = 't';
                    } else if (right) {
                        $scope.config.pos = 'r';
                    } else if (bottom) {
                        $scope.config.pos = 'b';
                    } else if (left) {
                        $scope.config.pos = 'l';
                    } else $scope.config.pos = 'b';
                    self.open($scope.size, $scope.config, event);
                }
            }
        };
}]);
angular.module("wcom_sd", [])

angular.module("wcom_services", []).run(["$rootScope", "$compile", function($rootScope, $compile){
	var body = angular.element(document).find('body').eq(0);
	body.append($compile(angular.element('<pullfiles></pullfiles>'))($rootScope));
}]).factory('socket', function(){
	"ngInject";
	if(typeof io != 'object') return {};
	var loc = window.location.host;
	var socket = io.connect(loc);
	return socket;
}).service('file', ["$timeout", function($timeout){
	"ngInject";
	var self = this;
	self.add = function(opts, cb){
		if(typeof self.addDelay != 'function'){
			$timeout(function(){
				self.add(opts, cb);
			}, 100);
		}else{
			self.addDelay(opts, cb);
		}
	}
}]).run(["ctrl", function (ctrl) {
	"ngInject";
	angular.element(document).bind('keyup', function (e) {
		ctrl.press(e.keyCode);
	});
}]).service('ctrl', ["$timeout", function($timeout){
	var self = this;
	var cbs = [];
	var enums = {
		'space': 32,
		'esc': 27,
		'backspace': 8,
		'tab': 9,
		'enter': 13,
		'shift': 16,
		'ctrl': 17,
		'alt': 18,
		'pause/break': 19,
		'caps lock': 20,
		'escape': 27,
		'page up': 33,
		'page down': 34,
		'end': 35,
		'home': 36,
		'left': 37,
		'up': 38,
		'right': 39,
		'down': 40,
		'insert': 45,
		'delete': 46,
		'0': 48,
		'1': 49,
		'2': 50,
		'3': 51,
		'4': 52,
		'5': 53,
		'6': 54,
		'7': 55,
		'8': 56,
		'9': 57,
		'a': 65,
		'b': 66,
		'c': 67,
		'd': 68,
		'e': 69,
		'f': 70,
		'g': 71,
		'h': 72,
		'i': 73,
		'j': 74,
		'k': 75,
		'l': 76,
		'm': 77,
		'n': 78,
		'o': 79,
		'p': 80,
		'q': 81,
		'r': 82,
		's': 83,
		't': 84,
		'u': 85,
		'v': 86,
		'w': 87,
		'x': 88,
		'y': 89,
		'z': 90,
		'left window key': 91,
		'right window key': 92,
		'select key': 93,
		'numpad 0': 96,
		'numpad 1': 97,
		'numpad 2': 98,
		'numpad 3': 99,
		'numpad 4': 100,
		'numpad 5': 101,
		'numpad 6': 102,
		'numpad 7': 103,
		'numpad 8': 104,
		'numpad 9': 105,
		'multiply': 106,
		'add': 107,
		'subtract': 109,
		'decimal point': 110,
		'divide': 111,
		'f1': 112,
		'f2': 113,
		'f3': 114,
		'f4': 115,
		'f5': 116,
		'f6': 117,
		'f7': 118,
		'f8': 119,
		'f9': 120,
		'f10': 121,
		'f11': 122,
		'f12': 123,
		'num lock': 144,
		'scroll lock': 145,
		'semi-colon': 186,
		'equal sign': 187,
		'comma': 188,
		'dash': 189,
		'period': 190,
		'forward slash': 191,
		'grave accent': 192,
		'open bracket': 219,
		'back slash': 220,
		'close braket': 221,
		'single quote': 222,
	};
	this.press = function(code){
		for (var i = 0; i < cbs.length; i++) {
			if(cbs[i].key == code) $timeout(cbs[i].cb);
		}
	}
	this.on = function(btns, cb){
		if(typeof cb != 'function') return;
		if(!Array.isArray(btns)&&typeof btns != 'object') return;
		if(!Array.isArray(btns)&&typeof btns == 'object') btns = [btns];
		for (var i = 0; i < btns.length; i++) {
			if(typeof enums[btns[i]] == 'number'){
				cbs.push({
					key: enums[btns[i]],
					cb: cb
				});
			}
		}
	}
}]).service('img', function(){
	"ngInject";
	this.fileToDataUrl = function(file, callback){
		var a = new FileReader();
		a.onload = function(e) {
			callback(e.target.result);
		}
		a.readAsDataURL(file);
	}
	this.resizeUpTo = function(info, callback){
		if(!info.file) return console.log('No image');
		info.width = info.width || 1920;
		info.height = info.height || 1080;
		if(info.file.type!="image/jpeg" && info.file.type!="image/png")
			return console.log("You must upload file only JPEG or PNG format.");
		var reader = new FileReader();
		reader.onload = function (loadEvent) {
			var canvasElement = document.createElement('canvas');
			var imageElement = document.createElement('img');
			imageElement.onload = function() {
				var infoRatio = info.width / info.height;
				var imgRatio = imageElement.width / imageElement.height;
				if (imgRatio > infoRatio) {
					width = info.width;
					height = width / imgRatio;
				} else {
					height = info.height;
					width = height * imgRatio;
				}
				canvasElement.width = width;
				canvasElement.height = height;
				var context = canvasElement.getContext('2d');
				context.drawImage(imageElement, 0, 0 , width, height);
				callback(canvasElement.toDataURL('image/png', 1));
			};
			imageElement.src = loadEvent.target.result;
		};
		reader.readAsDataURL(info.file);
	}
}).service('hash', function(){
	"ngInject";
	this.set = function(obj){
		window.location.hash = '';
		for(var key in obj){
			if(obj[key]) window.location.hash+='&'+key+'='+obj[key];

		}
	}
	this.get = function(){
		var hash = window.location.hash.replace('#!#', '');
		hash = hash.replace('#', '').split('&');
		hash.shift();
		var h = {};
		for (var i = 0; i < hash.length; i++) {
			hash[i] = hash[i].split('=');
			h[hash[i][0]] = hash[i][1];
		}
		return h;
	}
});
angular.module("wcom_spinner", [])
    .service('spin', ["$compile", "$rootScope", function($compile, $rootScope) {
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
    }]).directive('spin', ["spin", function(spin) {
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
    }]);
angular.module("wcom_wmodaerators.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmodaerators.html", "<label class=\"wtags\"><span class='wtag' ng-repeat='obj in arr'><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'><span>{{obj.name}}</span><i class='icon icon-close' ng-click='arr.splice($index, 1); change();'></i></span><input type='text' placeholder='{{holder}}' ng-model='object.new_moderator'></label><div ng-if='object.new_moderator'><div ng-repeat='user in users|rArr:arr|filter:object.new_moderator' ng-click='arr.push(user); object.new_moderator=null; change();'><img ng-src='{{user.avatarUrl}}' alt='{{user.name}}'><span>{{user.name}}</span></div></div>");
}]);
angular.module("wcom_wmodaeratorsview.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmodaeratorsview.html", "<span class='wtag' ng-repeat='obj in arr'><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'><span>{{obj.name}}</span></span>");
}]);
angular.module("wcom_wmoderators.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmoderators.html", "<label class=\"wtags\"><div class='wtag' ng-repeat='obj in arr'><div class=\"wtag--in\"><div class=\"wtag--ava\"><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'></div><div class=\"wtag--text\">{{obj.name}}</div><i class='icon icon-close' ng-click='arr.splice($index, 1); change();' title=\"Delete moderator\"></i></div></div><input type='text' placeholder='{{holder}}' ng-model='object.new_moderator'></label><div ng-if='object.new_moderator'><div ng-repeat='user in users|rArr:arr|filter:object.new_moderator' ng-click='arr.push(user); object.new_moderator=null; change();'><img ng-src='{{user.avatarUrl}}' alt='{{user.name}}'><span>{{user.name}}</span></div></div>");
}]);
angular.module("wcom_wmoderatorsview.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmoderatorsview.html", "<span class='wtag' ng-repeat='obj in arr'><div class=\"wtag--in\"><div class=\"wtag--ava\"><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'></div><div class=\"wtag--text\">{{obj.name}}</div></div></span>");
}]);
angular.module("wcom_wtags.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wtags.html", "<label class='wtags'><span class='wtag' ng-repeat='tag in tags'>#{{tag}} <i class='icon icon-close' ng-click='tags.splice($index, 1); update_tags();'></i></span><input type='text' placeholder='new tag' ng-model='new_tag' ng-keyup='enter($event)'></label>");
}]);
angular.module("wmodal_modal.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_modal.html", "<div class='modal' ng-class=\"{full: full, cover: cover}\"><div class='modal_fade' ng-click='close();' title='Close'></div><div class='modal_content viewer'><i class='icon icon-close close-m' ng-click='close();' title='Close'></i><h2 ng-if=\"header\">{{header}}</h2><p ng-if=\"content\">{{content}}</p><ng-transclude></ng-transclude></div></div>");
}]);
angular.module("wmodal_popup.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_popup.html", "<span ng-click-outside=\"close()\" ng-transclude ng-click=\"open($event)\" elsize=\"size\"></span>");
}]);
angular.module("wmodal_spinner.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wmodal_spinner.html", "<!-- Comments are just to fix whitespace with inline-block --><div class=\"Spinner\"><!--    --><div class=\"Spinner-line Spinner-line--1\"><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--left\"></div><!--        --></div><!--        --><div class=\"Spinner-line-ticker\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--center\"></div><!--        --></div><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--right\"></div><!--        --></div><!--    --></div><!--    --><div class=\"Spinner-line Spinner-line--2\"><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--left\"></div><!--        --></div><!--        --><div class=\"Spinner-line-ticker\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--center\"></div><!--        --></div><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--right\"></div><!--        --></div><!--    --></div><!--    --><div class=\"Spinner-line Spinner-line--3\"><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--left\"></div><!--        --></div><!--        --><div class=\"Spinner-line-ticker\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--center\"></div><!--        --></div><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--right\"></div><!--        --></div><!--    --></div><!--    --><div class=\"Spinner-line Spinner-line--4\"><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--left\"></div><!--        --></div><!--        --><div class=\"Spinner-line-ticker\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--center\"></div><!--        --></div><!--        --><div class=\"Spinner-line-cog\"><!--            --><div class=\"Spinner-line-cog-inner Spinner-line-cog-inner--right\"></div><!--        --></div><!--    --></div><!----></div><!--/spinner -->");
}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndjb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsUUFBQSxPQUFBLFFBQUEsQ0FBQSx5QkFBQSxtQkFBQSxnQkFBQSxjQUFBLGNBQUEsY0FBQSxXQUFBLGlCQUFBLGdCQUFBLDBCQUFBLDhCQUFBLHlCQUFBLDZCQUFBLG1CQUFBLHFCQUFBLHFCQUFBOzs7QUFHQSxDQUFBLFdBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUEseUJBQUE7U0FDQSxVQUFBLGdCQUFBO1lBQ0EsYUFBQSxVQUFBO1lBQ0E7Ozs7Ozs7Ozs7O0lBV0EsU0FBQSxhQUFBLFdBQUEsUUFBQSxVQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxNQUFBLFNBQUEsUUFBQSxNQUFBLE1BQUE7OztnQkFHQSxTQUFBLFdBQUE7b0JBQ0EsSUFBQSxZQUFBLENBQUEsS0FBQSxpQkFBQSxhQUFBLEtBQUEsYUFBQSxNQUFBLFdBQUE7d0JBQ0E7O29CQUVBLFNBQUEsYUFBQSxHQUFBO3dCQUNBLElBQUE7NEJBQ0E7NEJBQ0E7NEJBQ0E7NEJBQ0E7NEJBQ0E7Ozt3QkFHQSxJQUFBLFFBQUEsUUFBQSxNQUFBLFNBQUEsWUFBQTs0QkFDQTs7Ozt3QkFJQSxJQUFBLENBQUEsS0FBQSxDQUFBLEVBQUEsUUFBQTs0QkFDQTs7Ozt3QkFJQSxLQUFBLFVBQUEsRUFBQSxRQUFBLFNBQUEsVUFBQSxRQUFBLFlBQUE7OzRCQUVBLElBQUEsWUFBQSxLQUFBLElBQUE7Z0NBQ0E7Ozs7NEJBSUEsS0FBQSxRQUFBO2dDQUNBLGFBQUEsUUFBQTtnQ0FDQSxJQUFBLFVBQUE7Ozs0QkFHQSxJQUFBLGNBQUEsV0FBQSxZQUFBLFdBQUE7Z0NBQ0EsYUFBQSxXQUFBOzs7OzRCQUlBLElBQUEsY0FBQSxJQUFBOzs7Z0NBR0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7O29DQUVBLElBQUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxLQUFBOzs7b0NBR0EsSUFBQSxDQUFBLE9BQUEsYUFBQSxFQUFBLEtBQUEsU0FBQSxjQUFBLEVBQUEsS0FBQSxjQUFBOzt3Q0FFQTs7Ozs7Ozt3QkFPQSxTQUFBLFdBQUE7NEJBQ0EsS0FBQSxPQUFBLEtBQUE7NEJBQ0EsR0FBQSxRQUFBO2dDQUNBLE9BQUE7Ozs7OztvQkFNQSxJQUFBLGFBQUE7d0JBQ0EsVUFBQSxHQUFBLGNBQUEsV0FBQTs0QkFDQSxXQUFBOzs7OztvQkFLQSxVQUFBLEdBQUEsU0FBQTs7O29CQUdBLE9BQUEsSUFBQSxZQUFBLFdBQUE7d0JBQ0EsSUFBQSxhQUFBOzRCQUNBLFVBQUEsSUFBQSxjQUFBOzs7d0JBR0EsVUFBQSxJQUFBLFNBQUE7Ozs7Ozs7b0JBT0EsU0FBQSxZQUFBOzt3QkFFQSxPQUFBLGtCQUFBLFVBQUEsVUFBQTtxQkFDQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLG1CQUFBO0NBQ0EsVUFBQSxhQUFBLFVBQUE7Q0FDQTtDQUNBLE1BQUE7RUFDQSxVQUFBLEtBQUEsT0FBQSxNQUFBLFNBQUE7RUFDQSxrREFBQSxTQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7R0FDQSxJQUFBLFNBQUEsT0FBQSxTQUFBO0dBQ0EsS0FBQSxXQUFBLFNBQUEsTUFBQSxHQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsY0FBQSxDQUFBLEtBQUEsSUFBQTtJQUNBLEtBQUEsV0FBQSxDQUFBLENBQUEsS0FBQTtJQUNBLE9BQUEsS0FBQTtJQUNBLFNBQUEsVUFBQTtLQUNBLEdBQUEsS0FBQSxTQUFBO01BQ0EsSUFBQSxXQUFBLFNBQUEsTUFBQTtPQUNBLElBQUEsV0FBQTtRQUNBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBOzs7O01BSUEsUUFBQSxRQUFBLFNBQUEsZUFBQSxLQUFBO09BQ0EsS0FBQSxVQUFBLFNBQUEsS0FBQTtPQUNBLElBQUEsU0FBQSxJQUFBLGlCQUFBLElBQUE7T0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsT0FBQSxNQUFBLFFBQUEsS0FBQTtRQUNBLFNBQUEsT0FBQSxNQUFBOzs7VUFHQTtNQUNBLFFBQUEsUUFBQSxTQUFBLGVBQUEsS0FBQTtPQUNBLEtBQUEsVUFBQSxTQUFBLEtBQUE7T0FDQSxJQUFBLFNBQUEsSUFBQSxpQkFBQSxJQUFBO09BQ0EsSUFBQSxXQUFBO1FBQ0EsTUFBQSxPQUFBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBLE9BQUEsTUFBQTs7Ozs7T0FLQTs7O0VBR0EsVUFBQTs7R0FFQSxVQUFBLGtDQUFBLFNBQUEsVUFBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLE9BQUEsR0FBQTtHQUNBLEdBQUEsQ0FBQSxNQUFBLFFBQUEsTUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBLFVBQUE7SUFDQSxNQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7SUFDQSxNQUFBLE9BQUEsU0FBQSxHQUFBLEdBQUE7SUFDQTs7R0FFQTtHQUNBLFFBQUEsUUFBQSxTQUFBLEtBQUEsVUFBQTtHQUNBLE1BQUEsT0FBQSxZQUFBO0lBQ0EsT0FBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsR0FBQSxjQUFBLEtBQUE7S0FDQSxVQUFBLE9BQUE7SUFDQSxHQUFBLE1BQUEsTUFBQSxLQUFBLEdBQUEsR0FBQSxNQUFBLE9BQUEsUUFBQSxNQUFBLE1BQUEsS0FBQTtJQUNBLEdBQUEsTUFBQSxNQUFBLEtBQUEsR0FBQSxHQUFBLE1BQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxLQUFBOzs7O0lBSUEsVUFBQSxxQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUE7RUFDQSxVQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTtLQUNBLHVCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQSxRQUFBLFNBQUEsT0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLGNBQUEsVUFBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFNBQUEsT0FBQSxLQUFBLEtBQUE7SUFDQSxHQUFBLE9BQUEsT0FBQSxVQUFBLFlBQUEsT0FBQTs7R0FFQSxPQUFBLFFBQUEsU0FBQSxFQUFBO0lBQ0EsR0FBQSxFQUFBLFNBQUEsR0FBQTtLQUNBLEdBQUEsT0FBQSxRQUFBO01BQ0EsT0FBQSxLQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7O0tBRUEsT0FBQSxVQUFBOzs7TUFHQSxhQUFBOztLQUVBLFVBQUEsNEJBQUEsU0FBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxLQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxRQUFBO0tBQ0EsYUFBQTs7SUFFQSxVQUFBLGdDQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxPQUFBO0dBQ0EsS0FBQTtLQUNBLGFBQUE7OztBQUdBLE9BQUEsVUFBQSxPQUFBLFNBQUEsUUFBQSxhQUFBO0lBQ0EsSUFBQSxTQUFBO0lBQ0EsT0FBQSxPQUFBLE1BQUEsUUFBQSxLQUFBOztBQUVBLFFBQUEsT0FBQSxnQkFBQTtDQUNBLE9BQUEsU0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQSxJQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsT0FBQTtFQUNBLElBQUEsSUFBQSxNQUFBLENBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsTUFBQSxJQUFBLE1BQUEsS0FBQTtFQUNBLEtBQUEsSUFBQSxJQUFBLElBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0dBQ0EsR0FBQSxDQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsR0FBQTs7RUFFQSxPQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsWUFBQSxXQUFBO0VBQ0EsSUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxJQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLFFBQUEsS0FBQTtJQUNBLEdBQUEsV0FBQSxHQUFBLE9BQUEsSUFBQSxHQUFBLElBQUE7S0FDQSxJQUFBLE9BQUEsR0FBQTtLQUNBOzs7O0VBSUEsT0FBQTs7R0FFQSxPQUFBLGFBQUEsVUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLElBQUE7RUFDQSxHQUFBLENBQUEsS0FBQSxPQUFBLElBQUE7RUFDQSxJQUFBLFlBQUEsSUFBQSxXQUFBLFVBQUEsRUFBQTtFQUNBLE9BQUEsSUFBQSxLQUFBLFNBQUEsVUFBQSxJQUFBOztHQUVBLE9BQUEsV0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQTtFQUNBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsUUFBQSxNQUFBLEdBQUEsT0FBQTtPQUNBLE9BQUEsVUFBQTs7R0FFQSxPQUFBLHFCQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLE1BQUEsU0FBQSxVQUFBLE9BQUE7RUFDQSxPQUFBLElBQUEsS0FBQTtFQUNBLEdBQUEsUUFBQTtHQUNBLEtBQUEsWUFBQSxLQUFBLGdCQUFBLFNBQUE7O0VBRUEsR0FBQSxTQUFBO0dBQ0EsS0FBQSxTQUFBLEtBQUEsYUFBQSxTQUFBOztFQUVBLEdBQUEsT0FBQTtHQUNBLEtBQUEsUUFBQSxLQUFBLFlBQUEsU0FBQTs7RUFFQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7O0lBRUEsT0FBQSwyQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUEsU0FBQSxLQUFBO0VBQ0EsT0FBQSxJQUFBLEtBQUE7RUFDQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFNBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxRQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7OztBQUdBLFFBQUEsT0FBQSxjQUFBO0NBQ0EsUUFBQSxvQ0FBQSxTQUFBLFVBQUEsV0FBQTtDQUNBOzs7O0VBSUEsSUFBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsT0FBQSxHQUFBO0dBQ0EsTUFBQSxRQUFBLFVBQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEdBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxNQUFBLEdBQUE7TUFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBO01BQ0E7OztJQUdBLEdBQUEsS0FBQSxPQUFBLFVBQUEsRUFBQTtLQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxZQUFBOztJQUVBLEdBQUEsTUFBQSxJQUFBLE1BQUE7SUFDQSxHQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLE9BQUEsUUFBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLE1BQUEsR0FBQTtLQUNBLEtBQUEsT0FBQSxHQUFBLFFBQUEsTUFBQTtLQUNBLE1BQUEsUUFBQSxLQUFBLE9BQUE7S0FDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTtNQUNBLE1BQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTs7S0FFQTs7OztFQUlBLEtBQUEsT0FBQSxTQUFBLElBQUE7R0FDQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsZUFBQSxDQUFBLElBQUE7SUFDQSxPQUFBLFFBQUEsS0FBQTtHQUNBLEdBQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxLQUFBLEtBQUE7R0FDQSxJQUFBLFFBQUEsY0FBQSxJQUFBLEdBQUE7R0FDQSxHQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7UUFDQSxHQUFBLElBQUEsWUFBQTtJQUNBLFNBQUE7SUFDQSxTQUFBLElBQUEsSUFBQSxZQUFBO0lBQ0EsU0FBQTs7R0FFQSxTQUFBO0dBQ0EsS0FBQSxPQUFBLEtBQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7R0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtHQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOzs7OztJQUtBLFVBQUEsbUJBQUEsU0FBQSxPQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLFlBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtLQUNBLE1BQUEsTUFBQSxZQUFBLGFBQUE7O0lBRUEsV0FBQSxrQ0FBQSxTQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsU0FBQSxVQUFBO0VBQ0EsR0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLFFBQUEsT0FBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBOzs7RUFHQSxHQUFBLE9BQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsT0FBQSxRQUFBLE1BQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLGNBQUEsSUFBQSxRQUFBLHlDQUFBLFNBQUEsT0FBQSxVQUFBLE9BQUE7Ozs7Ozs7Ozs7RUFVQSxJQUFBLE9BQUE7Ozs7RUFJQSxLQUFBLFNBQUEsU0FBQSxNQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUEsT0FBQSxNQUFBLFlBQUEsR0FBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsU0FBQSxNQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxHQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsV0FBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBOztJQUVBLE9BQUEsS0FBQSxRQUFBOztHQUVBLEtBQUEsUUFBQSxRQUFBO0dBQ0EsS0FBQSxRQUFBLFFBQUE7R0FDQSxLQUFBLFNBQUEsUUFBQSxPQUFBLFFBQUE7R0FDQSxHQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxLQUFBLE1BQUEsUUFBQSxXQUFBO01BQ0EsS0FBQSxNQUFBLE9BQUE7T0FDQSxPQUFBLEtBQUEsTUFBQTs7Ozs7R0FLQSxHQUFBLEtBQUEsT0FBQTtJQUNBLEdBQUEsT0FBQSxLQUFBLFVBQUEsU0FBQTtLQUNBLEtBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTs7SUFFQSxHQUFBLE1BQUEsUUFBQSxLQUFBLFFBQUE7S0FDQSxJQUFBLE1BQUEsS0FBQTtLQUNBLEtBQUEsU0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxJQUFBLE1BQUEsU0FBQTtPQUNBLEtBQUEsT0FBQSxJQUFBLE1BQUE7WUFDQTtPQUNBLElBQUEsSUFBQSxPQUFBLElBQUEsR0FBQTtRQUNBLEtBQUEsT0FBQSxPQUFBLElBQUEsR0FBQTs7Ozs7SUFLQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsS0FBQSxPQUFBLFFBQUEsVUFBQTtNQUNBLEdBQUEsS0FBQSxPQUFBLEtBQUE7T0FDQSxLQUFBLE9BQUEsT0FBQTtRQUNBLE9BQUEsU0FBQSxJQUFBO1NBQ0EsT0FBQSxJQUFBOzs7V0FHQTtPQUNBLE9BQUEsS0FBQSxPQUFBO09BQ0E7OztLQUdBLEdBQUEsT0FBQSxLQUFBLE9BQUEsUUFBQSxTQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7S0FFQSxHQUFBLE9BQUEsS0FBQSxPQUFBLEtBQUEsU0FBQSxXQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7OztHQUlBLE1BQUEsSUFBQSxVQUFBLE9BQUEsUUFBQSxLQUFBLFNBQUEsTUFBQTtJQUNBLElBQUEsS0FBQSxNQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsS0FBQSxRQUFBLEtBQUE7TUFDQSxLQUFBLE1BQUEsS0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxNQUFBO01BQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxNQUFBLElBQUEsS0FBQTs7SUFFQSxLQUFBLFNBQUEsT0FBQTtJQUNBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7O0dBR0EsT0FBQSxLQUFBLFFBQUE7O0VBRUEsS0FBQSxZQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxJQUFBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsT0FBQSxLQUFBLFVBQUEsVUFBQSxLQUFBLFNBQUEsS0FBQSxPQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEtBQUEsS0FBQSxPQUFBLE1BQUEsSUFBQSxLQUFBLE9BQUE7O0lBRUEsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLGlCQUFBLEtBQUEsUUFBQSxLQUFBO0tBQ0EsS0FBQSxTQUFBLE1BQUE7S0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLE1BQUEsWUFBQTtNQUNBLEdBQUEsS0FBQTtZQUNBLElBQUEsT0FBQSxNQUFBLFlBQUE7TUFDQSxHQUFBOzs7O0VBSUEsS0FBQSxlQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxZQUFBO0lBQ0EsS0FBQTtJQUNBLE9BQUE7O0dBRUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUE7SUFDQSxJQUFBLE9BQUEsS0FBQSxVQUFBLFVBQUEsS0FBQSxTQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsT0FBQSxRQUFBLEtBQUE7S0FDQSxLQUFBLEtBQUEsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOztJQUVBLE1BQUE7O0dBRUEsTUFBQSxLQUFBLFVBQUEsT0FBQSxrQkFBQSxNQUFBO0dBQ0EsS0FBQSxTQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBOzs7O0VBSUEsS0FBQSxTQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLENBQUEsS0FBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFlBQUEsTUFBQSxLQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxRQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTtNQUNBLElBQUEsS0FBQSxRQUFBLE1BQUEsR0FBQSxPQUFBLElBQUEsS0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLE9BQUEsR0FBQTtPQUNBOzs7S0FHQSxPQUFBLEtBQUEsUUFBQSxNQUFBLElBQUE7S0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7TUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO09BQ0EsSUFBQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxPQUFBLEdBQUEsS0FBQSxJQUFBLEtBQUE7U0FDQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxLQUFBO1VBQ0EsS0FBQSxRQUFBLE1BQUEsS0FBQSxPQUFBLE9BQUEsR0FBQTs7Ozs7O0tBTUEsR0FBQSxLQUFBLE9BQUEsTUFBQSxNQUFBO01BQ0EsSUFBQSxJQUFBLE9BQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtPQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLEtBQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxLQUFBLEdBQUEsT0FBQSxJQUFBLEtBQUE7U0FDQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsR0FBQTtTQUNBOzs7Ozs7SUFNQSxJQUFBLFFBQUEsT0FBQSxNQUFBLFlBQUE7S0FDQSxHQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQTs7OztFQUlBLEtBQUEsTUFBQSxTQUFBLElBQUE7R0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0dBQ0EsTUFBQSxJQUFBLGNBQUEsS0FBQSxTQUFBLE1BQUE7SUFDQSxHQUFBLEtBQUE7OztFQUdBLEtBQUEsUUFBQSxTQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsS0FBQSxPQUFBO0dBQ0EsR0FBQSxNQUFBLFFBQUEsTUFBQTtVQUNBLE9BQUEsS0FBQTtlQUNBLEdBQUEsT0FBQSxRQUFBLFNBQUE7VUFDQSxHQUFBLEtBQUEsS0FBQSxPQUFBLENBQUEsS0FBQTtVQUNBLElBQUEsUUFBQTtVQUNBLElBQUEsSUFBQSxPQUFBLEtBQUE7V0FDQSxHQUFBLEtBQUEsTUFBQSxNQUFBLEtBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTs7VUFFQSxPQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsRUFBQSxHQUFBO0lBQ0EsSUFBQSxLQUFBLElBQUEsS0FBQSxLQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7RUFFQSxLQUFBLGFBQUEsU0FBQSxLQUFBLElBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxNQUFBLGNBQUEsT0FBQSxPQUFBLFVBQUE7SUFDQSxTQUFBLE9BQUEsSUFBQTtJQUNBLElBQUEsZ0JBQUEsU0FBQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsV0FBQSxLQUFBLFdBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLE1BQUE7R0FDQSxJQUFBLEtBQUEsV0FBQSxPQUFBO0lBQ0EsUUFBQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsTUFBQSxRQUFBLFFBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUEsTUFBQSxJQUFBOztLQUVBO1dBQ0EsSUFBQSxNQUFBLFFBQUEsT0FBQSxDQUFBLEdBQUE7S0FDQSxRQUFBLE1BQUEsTUFBQTtLQUNBLElBQUEsTUFBQSxNQUFBO0tBQ0EsSUFBQSxPQUFBLElBQUEsUUFBQSxVQUFBO0tBQ0EsT0FBQSxTQUFBLElBQUEsTUFBQSxNQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE1BQUEsUUFBQSxJQUFBLFNBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO01BQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUEsS0FBQTtPQUNBLElBQUEsT0FBQSxLQUFBLEtBQUEsUUFBQSxNQUFBLElBQUEsT0FBQTthQUNBO09BQ0EsSUFBQSxPQUFBLE9BQUEsR0FBQTs7O0tBR0E7V0FDQSxJQUFBLE9BQUEsSUFBQSxVQUFBLFVBQUE7S0FDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxXQUFBO1dBQ0E7VUFDQTtJQUNBLFNBQUEsV0FBQTtLQUNBLFNBQUEsS0FBQSxPQUFBO09BQ0E7O0dBRUEsUUFBQSxJQUFBLEtBQUEsUUFBQTs7RUFFQSxJQUFBLEtBQUEsS0FBQSxLQUFBLFNBQUEsT0FBQSxJQUFBO0dBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtJQUNBLFFBQUEsTUFBQSxNQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsS0FBQTtJQUNBLElBQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLFdBQUE7TUFDQSxHQUFBLE9BQUE7UUFDQTs7O0dBR0E7Ozs7Ozs7O0VBUUEsS0FBQSxRQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxDQUFBLE1BQUEsUUFBQSxNQUFBLEdBQUE7UUFDQSxHQUFBOztFQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUEsTUFBQSxRQUFBLE1BQUE7SUFDQSxNQUFBOztHQUVBLEdBQUE7O0VBRUEsS0FBQSxTQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxJQUFBLEtBQUE7O0VBRUEsS0FBQSxXQUFBLFNBQUEsS0FBQSxHQUFBO0dBQ0EsR0FBQSxPQUFBLE9BQUEsU0FBQTtJQUNBLE1BQUE7O0dBRUEsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLGNBQUEsU0FBQSxLQUFBLEdBQUEsRUFBQSxHQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsS0FBQSxJQUFBLElBQUE7R0FDQSxPQUFBLElBQUEsS0FBQSxTQUFBLElBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQSxJQUFBOzs7OztFQUtBLElBQUEsVUFBQSxTQUFBLEtBQUEsT0FBQSxLQUFBLE1BQUE7R0FDQSxJQUFBLE1BQUEsUUFBQSxPQUFBLENBQUEsR0FBQTtJQUNBLFFBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLElBQUEsU0FBQSxPQUFBLElBQUEsUUFBQSxZQUFBLE1BQUEsUUFBQSxJQUFBO0tBQ0E7SUFDQSxJQUFBLENBQUEsSUFBQSxNQUFBLElBQUEsT0FBQTtJQUNBLE9BQUEsUUFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLE1BQUEsS0FBQTs7R0FFQSxJQUFBLE9BQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxJQUFBLFFBQUEsU0FBQSxVQUFBO0tBQ0EsSUFBQSxTQUFBO09BQ0E7OztFQUdBLElBQUEsT0FBQSxTQUFBLE1BQUEsS0FBQTtHQUNBLEdBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxNQUFBO0dBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxTQUFBO0lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQSxTQUFBLE1BQUEsU0FBQTtLQUNBLFFBQUEsS0FBQSxLQUFBLEtBQUEsU0FBQSxNQUFBLFFBQUEsTUFBQTs7O0dBR0EsR0FBQSxLQUFBLE9BQUEsTUFBQSxTQUFBO0lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsR0FBQSxNQUFBLFFBQUEsR0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsRUFBQSxHQUFBLFNBQUEsRUFBQSxHQUFBLEtBQUE7T0FDQSxTQUFBLEtBQUEsRUFBQSxHQUFBLE9BQUEsRUFBQSxHQUFBOzs7VUFHQSxHQUFBLE9BQUEsS0FBQSxZQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUE7S0FDQSxTQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7OztHQUdBLEtBQUEsUUFBQSxNQUFBLEtBQUE7R0FDQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUE7R0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO0tBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxVQUFBLGNBQUEsRUFBQSxPQUFBLE1BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxTQUFBLGNBQUEsQ0FBQSxFQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsQ0FBQSxLQUFBLFFBQUEsTUFBQSxLQUFBO01BQ0EsS0FBQSxRQUFBLE1BQUEsT0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxNQUFBO01BQ0EsR0FBQSxDQUFBLE9BQUE7TUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsUUFBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsU0FBQTs7TUFFQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsS0FBQTtNQUNBLEdBQUEsT0FBQSxFQUFBLFFBQUEsV0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxLQUFBLEVBQUE7OztLQUdBLElBQUEsRUFBQSxNQUFBLEtBQUEsU0FBQSxNQUFBO01BQ0EsSUFBQTs7OztHQUlBLEdBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsT0FBQSxNQUFBLE1BQUE7S0FDQSxJQUFBLFFBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFVBQUEsY0FBQSxNQUFBLE9BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsY0FBQSxDQUFBLE1BQUEsTUFBQSxNQUFBO0tBQ0EsR0FBQSxDQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUE7TUFDQSxLQUFBLFFBQUEsTUFBQSxPQUFBOztNQUVBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFFBQUEsV0FBQTtNQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQSxNQUFBOzs7OztFQUtBLElBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxHQUFBO0dBQ0EsTUFBQSxJQUFBLFVBQUEsT0FBQSxRQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxLQUFBLFFBQUEsS0FBQTtNQUNBLEtBQUEsTUFBQSxLQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLE1BQUE7TUFDQSxHQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsTUFBQSxJQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBOztJQUVBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsY0FBQTtLQUNBLFFBQUEsb0NBQUEsU0FBQSxVQUFBLFlBQUE7UUFDQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLE9BQUEsU0FBQSxNQUFBLFFBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxXQUFBLENBQUEsT0FBQSxlQUFBLENBQUEsT0FBQTtnQkFDQSxPQUFBLFFBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSw2Q0FBQSxDQUFBLEtBQUEsVUFBQSxTQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUEsWUFBQSxDQUFBLEtBQUEsVUFBQSxPQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxTQUFBLE9BQUE7aUJBQ0EsSUFBQSxPQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsT0FBQSxjQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLElBQUEsT0FBQSxRQUFBLFFBQUEsVUFBQSxLQUFBLFFBQUEsR0FBQTtZQUNBLEtBQUEsT0FBQSxTQUFBLFFBQUEsUUFBQSxRQUFBO1lBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLFNBQUE7O1FBRUEsVUFBQSxpQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxVQUFBO1lBQ0EsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxNQUFBOztnQkFFQSxPQUFBLE9BQUEsU0FBQSxPQUFBOztvQkFFQSxNQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUEsUUFBQTs7OztZQUlBLGFBQUE7O1FBRUEsVUFBQSxtQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsTUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxRQUFBLE9BQUEsT0FBQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7d0JBQ0EsUUFBQSxJQUFBO3dCQUNBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE1BQUEsT0FBQTs7d0JBRUEsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsY0FBQSxNQUFBLE9BQUEsS0FBQSxjQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBOzBCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE1BQUEsT0FBQSxjQUFBLE1BQUEsT0FBQSxLQUFBLGNBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O3dCQUVBO29CQUNBO3dCQUNBLE9BQUEsS0FBQSxRQUFBOztnQkFFQSxPQUFBLENBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQSxLQUFBOztnQkFFQSxLQUFBLFVBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE9BQUEsS0FBQTs7b0JBRUEsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsZ0JBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxnQkFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsUUFBQSxTQUFBLGdCQUFBLGVBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxlQUFBLE9BQUEsS0FBQTs7OztvQkFJQSxRQUFBLElBQUE7b0JBQ0EsUUFBQSxJQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxRQUFBLElBQUE7OztvQkFHQSxJQUFBLFFBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFFBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLEtBQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsSUFBQSxPQUFBO3dCQUNBLE9BQUEsT0FBQSxNQUFBOzJCQUNBLElBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLE1BQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsT0FBQSxPQUFBLE1BQUE7b0JBQ0EsS0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBLFFBQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLFdBQUE7O0FBRUEsUUFBQSxPQUFBLGlCQUFBLElBQUEsK0JBQUEsU0FBQSxZQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7Q0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsNEJBQUE7SUFDQSxRQUFBLFVBQUEsVUFBQTtDQUNBO0NBQ0EsR0FBQSxPQUFBLE1BQUEsVUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBLE9BQUEsU0FBQTtDQUNBLElBQUEsU0FBQSxHQUFBLFFBQUE7Q0FDQSxPQUFBO0dBQ0EsUUFBQSxxQkFBQSxTQUFBLFNBQUE7Q0FDQTtDQUNBLElBQUEsT0FBQTtDQUNBLEtBQUEsTUFBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsV0FBQTtHQUNBLFNBQUEsVUFBQTtJQUNBLEtBQUEsSUFBQSxNQUFBO01BQ0E7T0FDQTtHQUNBLEtBQUEsU0FBQSxNQUFBOzs7SUFHQSxhQUFBLFVBQUEsTUFBQTtDQUNBO0NBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxTQUFBLFVBQUEsR0FBQTtFQUNBLEtBQUEsTUFBQSxFQUFBOztJQUVBLFFBQUEscUJBQUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBO0NBQ0EsSUFBQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLE9BQUE7RUFDQSxhQUFBO0VBQ0EsT0FBQTtFQUNBLFNBQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLE9BQUE7RUFDQSxlQUFBO0VBQ0EsYUFBQTtFQUNBLFVBQUE7RUFDQSxXQUFBO0VBQ0EsYUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLFVBQUE7RUFDQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsbUJBQUE7RUFDQSxvQkFBQTtFQUNBLGNBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLE9BQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLE9BQUE7RUFDQSxPQUFBO0VBQ0EsWUFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0VBQ0EsY0FBQTtFQUNBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOztDQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxRQUFBLEtBQUE7R0FDQSxHQUFBLElBQUEsR0FBQSxPQUFBLE1BQUEsU0FBQSxJQUFBLEdBQUE7OztDQUdBLEtBQUEsS0FBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxNQUFBLFlBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUEsT0FBQSxDQUFBO0VBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxLQUFBO0dBQ0EsR0FBQSxPQUFBLE1BQUEsS0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLEtBQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUE7Ozs7O0lBS0EsUUFBQSxPQUFBLFVBQUE7Q0FDQTtDQUNBLEtBQUEsZ0JBQUEsU0FBQSxNQUFBLFNBQUE7RUFDQSxJQUFBLElBQUEsSUFBQTtFQUNBLEVBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxTQUFBLEVBQUEsT0FBQTs7RUFFQSxFQUFBLGNBQUE7O0NBRUEsS0FBQSxhQUFBLFNBQUEsTUFBQSxTQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLFFBQUEsSUFBQTtFQUNBLEtBQUEsUUFBQSxLQUFBLFNBQUE7RUFDQSxLQUFBLFNBQUEsS0FBQSxVQUFBO0VBQ0EsR0FBQSxLQUFBLEtBQUEsTUFBQSxnQkFBQSxLQUFBLEtBQUEsTUFBQTtHQUNBLE9BQUEsUUFBQSxJQUFBO0VBQ0EsSUFBQSxTQUFBLElBQUE7RUFDQSxPQUFBLFNBQUEsVUFBQSxXQUFBO0dBQ0EsSUFBQSxnQkFBQSxTQUFBLGNBQUE7R0FDQSxJQUFBLGVBQUEsU0FBQSxjQUFBO0dBQ0EsYUFBQSxTQUFBLFdBQUE7SUFDQSxJQUFBLFlBQUEsS0FBQSxRQUFBLEtBQUE7SUFDQSxJQUFBLFdBQUEsYUFBQSxRQUFBLGFBQUE7SUFDQSxJQUFBLFdBQUEsV0FBQTtLQUNBLFFBQUEsS0FBQTtLQUNBLFNBQUEsUUFBQTtXQUNBO0tBQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxTQUFBOztJQUVBLGNBQUEsUUFBQTtJQUNBLGNBQUEsU0FBQTtJQUNBLElBQUEsVUFBQSxjQUFBLFdBQUE7SUFDQSxRQUFBLFVBQUEsY0FBQSxHQUFBLElBQUEsT0FBQTtJQUNBLFNBQUEsY0FBQSxVQUFBLGFBQUE7O0dBRUEsYUFBQSxNQUFBLFVBQUEsT0FBQTs7RUFFQSxPQUFBLGNBQUEsS0FBQTs7R0FFQSxRQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsS0FBQSxNQUFBLFNBQUEsSUFBQTtFQUNBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsSUFBQSxJQUFBLE9BQUEsSUFBQTtHQUNBLEdBQUEsSUFBQSxNQUFBLE9BQUEsU0FBQSxNQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Q0FJQSxLQUFBLE1BQUEsVUFBQTtFQUNBLElBQUEsT0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUE7RUFDQSxPQUFBLEtBQUEsUUFBQSxLQUFBLElBQUEsTUFBQTtFQUNBLEtBQUE7RUFDQSxJQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7R0FDQSxLQUFBLEtBQUEsS0FBQSxHQUFBLE1BQUE7R0FDQSxFQUFBLEtBQUEsR0FBQSxNQUFBLEtBQUEsR0FBQTs7RUFFQSxPQUFBOzs7QUFHQSxRQUFBLE9BQUEsZ0JBQUE7S0FDQSxRQUFBLG1DQUFBLFNBQUEsVUFBQSxZQUFBO1FBQ0E7Ozs7UUFJQSxJQUFBLE9BQUE7UUFDQSxLQUFBLFdBQUE7UUFDQSxLQUFBLFFBQUEsU0FBQSxJQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7Z0JBQ0EsSUFBQSxLQUFBLFNBQUEsR0FBQSxNQUFBLElBQUE7b0JBQ0EsS0FBQSxTQUFBLEdBQUEsR0FBQTtvQkFDQSxLQUFBLFNBQUEsT0FBQSxHQUFBO29CQUNBOzs7OztRQUtBLEtBQUEsT0FBQSxTQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBO1lBQ0EsSUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLEtBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxJQUFBLEtBQUE7WUFDQSxJQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7aUJBQ0EsSUFBQSxJQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsSUFBQSxjQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLFNBQUE7O2FBRUEsUUFBQSxJQUFBLElBQUE7bUJBQ0E7YUFDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7SUFDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtJQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOztZQUVBLE9BQUEsSUFBQTs7UUFFQSxVQUFBLGlCQUFBLFNBQUEsTUFBQTtRQUNBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBOztZQUVBLE1BQUEsU0FBQSxPQUFBLElBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsU0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxRQUFBLFNBQUEsR0FBQSxNQUFBLE1BQUEsSUFBQTt3QkFDQSxRQUFBLFNBQUEsR0FBQSxLQUFBOzs7O1lBSUEsYUFBQTs7O0FBR0EsUUFBQSxPQUFBLDBCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsMEJBQUE7O0FBRUEsUUFBQSxPQUFBLDhCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsOEJBQUE7O0FBRUEsUUFBQSxPQUFBLHlCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEseUJBQUE7O0FBRUEsUUFBQSxPQUFBLDZCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsNkJBQUE7O0FBRUEsUUFBQSxPQUFBLG1CQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsbUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHVCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsdUJBQUE7SUFDQSIsImZpbGUiOiJ3Y29tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoXCJ3Y29tXCIsIFtcImFuZ3VsYXItY2xpY2stb3V0c2lkZVwiLCBcIndjb21fZGlyZWN0aXZlc1wiLCBcIndjb21fZmlsdGVyc1wiLCBcIndjb21fbW9kYWxcIiwgXCJ3Y29tX21vbmdvXCIsIFwid2NvbV9wb3B1cFwiLCBcIndjb21fc2RcIiwgXCJ3Y29tX3NlcnZpY2VzXCIsIFwid2NvbV9zcGlubmVyXCIsIFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBcIndjb21fd21vZGFlcmF0b3Jzdmlldy5odG1sXCIsIFwid2NvbV93bW9kZXJhdG9ycy5odG1sXCIsIFwid2NvbV93bW9kZXJhdG9yc3ZpZXcuaHRtbFwiLCBcIndjb21fd3RhZ3MuaHRtbFwiLCBcIndtb2RhbF9tb2RhbC5odG1sXCIsIFwid21vZGFsX3BvcHVwLmh0bWxcIiwgXCJ3bW9kYWxfc3Bpbm5lci5odG1sXCJdKTtcbi8qZ2xvYmFsIGFuZ3VsYXIsIG5hdmlnYXRvciovXG5cbihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FuZ3VsYXItY2xpY2stb3V0c2lkZScsIFtdKVxuICAgICAgICAuZGlyZWN0aXZlKCdjbGlja091dHNpZGUnLCBbXG4gICAgICAgICAgICAnJGRvY3VtZW50JywgJyRwYXJzZScsICckdGltZW91dCcsXG4gICAgICAgICAgICBjbGlja091dHNpZGVcbiAgICAgICAgXSk7XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgZGlyZWN0aXZlXG4gICAgICogQG5hbWUgYW5ndWxhci1jbGljay1vdXRzaWRlLmRpcmVjdGl2ZTpjbGlja091dHNpZGVcbiAgICAgKiBAZGVzY3JpcHRpb24gRGlyZWN0aXZlIHRvIGFkZCBjbGljayBvdXRzaWRlIGNhcGFiaWxpdGllcyB0byBET00gZWxlbWVudHNcbiAgICAgKiBAcmVxdWlyZXMgJGRvY3VtZW50XG4gICAgICogQHJlcXVpcmVzICRwYXJzZVxuICAgICAqIEByZXF1aXJlcyAkdGltZW91dFxuICAgICAqKi9cbiAgICBmdW5jdGlvbiBjbGlja091dHNpZGUoJGRvY3VtZW50LCAkcGFyc2UsICR0aW1lb3V0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlLCBlbGVtLCBhdHRyKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBwb3N0cG9uZSBsaW5raW5nIHRvIG5leHQgZGlnZXN0IHRvIGFsbG93IGZvciB1bmlxdWUgaWQgZ2VuZXJhdGlvblxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2xhc3NMaXN0ID0gKGF0dHIub3V0c2lkZUlmTm90ICE9PSB1bmRlZmluZWQpID8gYXR0ci5vdXRzaWRlSWZOb3Quc3BsaXQoL1sgLF0rLykgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuO1xuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGV2ZW50SGFuZGxlcihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBvdXIgZWxlbWVudCBhbHJlYWR5IGhpZGRlbiBhbmQgYWJvcnQgaWYgc29cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmVsZW1lbnQoZWxlbSkuaGFzQ2xhc3MoXCJuZy1oaWRlXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjbGljayB0YXJnZXQsIG5vIHBvaW50IGdvaW5nIG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWUgfHwgIWUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIGF2YWlsYWJsZSBlbGVtZW50cywgbG9va2luZyBmb3IgY2xhc3NlcyBpbiB0aGUgY2xhc3MgbGlzdCB0aGF0IG1pZ2h0IG1hdGNoIGFuZCBzbyB3aWxsIGVhdFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChlbGVtZW50ID0gZS50YXJnZXQ7IGVsZW1lbnQ7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgZWxlbWVudCBpcyB0aGUgc2FtZSBlbGVtZW50IHRoZSBkaXJlY3RpdmUgaXMgYXR0YWNoZWQgdG8gYW5kIGV4aXQgaWYgc28gKHByb3BzIEBDb3N0aWNhUHVudGFydSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gZWxlbVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm93IHdlIGhhdmUgZG9uZSB0aGUgaW5pdGlhbCBjaGVja3MsIHN0YXJ0IGdhdGhlcmluZyBpZCdzIGFuZCBjbGFzc2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBlbGVtZW50LmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzID0gZWxlbWVudC5jbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBjbGFzc0xpc3QubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW53cmFwIFNWR0FuaW1hdGVkU3RyaW5nIGNsYXNzZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3NOYW1lcyAmJiBjbGFzc05hbWVzLmJhc2VWYWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzID0gY2xhc3NOYW1lcy5iYXNlVmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGFyZSBubyBjbGFzcyBuYW1lcyBvbiB0aGUgZWxlbWVudCBjbGlja2VkLCBza2lwIHRoZSBjaGVja1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc05hbWVzIHx8IGlkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIHRoZSBlbGVtZW50cyBpZCdzIGFuZCBjbGFzc25hbWVzIGxvb2tpbmcgZm9yIGV4Y2VwdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9wcmVwYXJlIHJlZ2V4IGZvciBjbGFzcyB3b3JkIG1hdGNoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gbmV3IFJlZ0V4cCgnXFxcXGInICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxiJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBleGFjdCBtYXRjaGVzIG9uIGlkJ3Mgb3IgY2xhc3NlcywgYnV0IG9ubHkgaWYgdGhleSBleGlzdCBpbiB0aGUgZmlyc3QgcGxhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoaWQgIT09IHVuZGVmaW5lZCAmJiByLnRlc3QoaWQpKSB8fCAoY2xhc3NOYW1lcyAmJiByLnRlc3QoY2xhc3NOYW1lcykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm93IGxldCdzIGV4aXQgb3V0IGFzIGl0IGlzIGFuIGVsZW1lbnQgdGhhdCBoYXMgYmVlbiBkZWZpbmVkIGFzIGJlaW5nIGlnbm9yZWQgZm9yIGNsaWNraW5nIG91dHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGhhdmUgZ290IHRoaXMgZmFyLCB0aGVuIHdlIGFyZSBnb29kIHRvIGdvIHdpdGggcHJvY2Vzc2luZyB0aGUgY29tbWFuZCBwYXNzZWQgaW4gdmlhIHRoZSBjbGljay1vdXRzaWRlIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4gPSAkcGFyc2UoYXR0clsnY2xpY2tPdXRzaWRlJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuKCRzY29wZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgZGV2aWNlcyBoYXMgYSB0b3VjaHNjcmVlbiwgbGlzdGVuIGZvciB0aGlzIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaGFzVG91Y2goKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9uKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChldmVudEhhbmRsZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0aWxsIGxpc3RlbiBmb3IgdGhlIGNsaWNrIGV2ZW50IGV2ZW4gaWYgdGhlcmUgaXMgdG91Y2ggdG8gY2F0ZXIgZm9yIHRvdWNoc2NyZWVuIGxhcHRvcHNcbiAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9uKCdjbGljaycsIGV2ZW50SGFuZGxlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiB0aGUgc2NvcGUgaXMgZGVzdHJveWVkLCBjbGVhbiB1cCB0aGUgZG9jdW1lbnRzIGV2ZW50IGhhbmRsZXJzIGFzIHdlIGRvbid0IHdhbnQgaXQgaGFuZ2luZyBhcm91bmRcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfaGFzVG91Y2goKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkb2N1bWVudC5vZmYoJ3RvdWNoc3RhcnQnLCBldmVudEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub2ZmKCdjbGljaycsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gUHJpdmF0ZSBmdW5jdGlvbiB0byBhdHRlbXB0IHRvIGZpZ3VyZSBvdXQgaWYgd2UgYXJlIG9uIGEgdG91Y2ggZGV2aWNlXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqKi9cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gX2hhc1RvdWNoKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd29ya3Mgb24gbW9zdCBicm93c2VycywgSUUxMC8xMSBhbmQgU3VyZmFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHM7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9kaXJlY3RpdmVzXCIsIFtdKVxuLmRpcmVjdGl2ZSgncHVsbGZpbGVzJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm57XG5cdFx0cmVzdHJpY3Q6ICdFJywgc2NvcGU6IHRydWUsIHJlcGxhY2U6IHRydWUsXG5cdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCBpbWcsICR0aW1lb3V0LCBmaWxlKXtcblx0XHRcdHZhciBpbnB1dHMgPSAkc2NvcGUuaW5wdXRzID0gW107XG5cdFx0XHRmaWxlLmFkZERlbGF5ID0gZnVuY3Rpb24ob3B0cywgY2Ipe1xuXHRcdFx0XHRpZih0eXBlb2YgY2IgIT0gJ2Z1bmN0aW9uJyB8fCAhb3B0cy5pZCkgcmV0dXJuO1xuXHRcdFx0XHRvcHRzLm11bHRpcGxlID0gISFvcHRzLm11bHRpcGxlO1xuXHRcdFx0XHRpbnB1dHMucHVzaChvcHRzKTtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRpZihvcHRzLm11bHRpcGxlKXtcblx0XHRcdFx0XHRcdHZhciBhZGRJbWFnZSA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0aW1nLnJlc2l6ZVVwVG8oe1xuXHRcdFx0XHRcdFx0XHRcdGZpbGU6IGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0d2lkdGg6IG9wdHMud2lkdGh8fDE5MjAsXG5cdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBvcHRzLmhlaWdodHx8MTA4MFxuXHRcdFx0XHRcdFx0XHR9LCBmdW5jdGlvbihkYXRhVXJsKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0XHRcdGNiKGRhdGFVcmwsIGZpbGUpO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRzLmlkKSlcblx0XHRcdFx0XHRcdC5iaW5kKCdjaGFuZ2UnLCBmdW5jdGlvbihldnQpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9IGV2dC5jdXJyZW50VGFyZ2V0IHx8IGV2dC50YXJnZXQ7XG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0LmZpbGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdFx0YWRkSW1hZ2UodGFyZ2V0LmZpbGVzW2ldKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0cy5pZCkpXG5cdFx0XHRcdFx0XHQuYmluZCgnY2hhbmdlJywgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSBldnQuY3VycmVudFRhcmdldCB8fCBldnQudGFyZ2V0O1xuXHRcdFx0XHRcdFx0XHRpbWcucmVzaXplVXBUbyh7XG5cdFx0XHRcdFx0XHRcdFx0ZmlsZTogdGFyZ2V0LmZpbGVzWzBdLFxuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBvcHRzLndpZHRofHwxOTIwLFxuXHRcdFx0XHRcdFx0XHRcdGhlaWdodDogb3B0cy5oZWlnaHR8fDEwODBcblx0XHRcdFx0XHRcdFx0fSwgZnVuY3Rpb24oZGF0YVVybCkge1xuXHRcdFx0XHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYihkYXRhVXJsLCB0YXJnZXQuZmlsZXNbMF0pO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMjUwKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHRlbXBsYXRlOiAnPGlucHV0IG5nLXJlcGVhdD1cImkgaW4gaW5wdXRzXCIgdHlwZT1cImZpbGVcIiBuZy1oaWRlPVwidHJ1ZVwiIGlkPVwie3tpLmlkfX1cIiBtdWx0aXBsZT1cInt7aS5tdWx0aXBsZX19XCI+J1xuXHR9XG59KS5kaXJlY3RpdmUoJ2Vsc2l6ZScsIGZ1bmN0aW9uKCR0aW1lb3V0LCAkd2luZG93KXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRlbHNpemU6ICc9J1xuXHRcdH0sIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCl7XG5cdFx0XHRpZighc2NvcGUuZWxzaXplKSBzY29wZS5lbHNpemU9e307XG5cdFx0XHR2YXIgcmVzaXplID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0c2NvcGUuZWxzaXplLndpZHRoID0gZWxbMF0uY2xpZW50V2lkdGg7XG5cdFx0XHRcdHNjb3BlLmVsc2l6ZS5oZWlnaHQgPSBlbFswXS5jbGllbnRIZWlnaHQ7XG5cdFx0XHRcdCR0aW1lb3V0KCk7XG5cdFx0XHR9XG5cdFx0XHRyZXNpemUoKTtcblx0XHRcdGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5iaW5kKCdyZXNpemUnLCByZXNpemUpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmV0dXJuIFtlbFswXS5jbGllbnRXaWR0aCwgZWxbMF0uY2xpZW50SGVpZ2h0XS5qb2luKCd4Jyk7XG5cdFx0XHR9LGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0XHRpZih2YWx1ZS5zcGxpdCgneCcpWzBdPjApIHNjb3BlLmVsc2l6ZS53aWR0aCA9IHZhbHVlLnNwbGl0KCd4JylbMF07XG5cdFx0XHRcdGlmKHZhbHVlLnNwbGl0KCd4JylbMV0+MCkgc2NvcGUuZWxzaXplLmhlaWdodCA9IHZhbHVlLnNwbGl0KCd4JylbMV07XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pLmRpcmVjdGl2ZSgnd3RhZ3MnLCBmdW5jdGlvbigkZmlsdGVyKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRvYmplY3Q6ICc9Jyxcblx0XHRcdG1vZGVsOiAnQCcsXG5cdFx0XHRjaGFuZ2U6ICcmJ1xuXHRcdH0sIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSl7XG5cdFx0XHQkc2NvcGUudGFncyA9ICRmaWx0ZXIoJ3RvQXJyJykoJHNjb3BlLm9iamVjdFskc2NvcGUubW9kZWxdKTtcblx0XHRcdCRzY29wZS51cGRhdGVfdGFncyA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdCRzY29wZS5vYmplY3RbJHNjb3BlLm1vZGVsXSA9ICRzY29wZS50YWdzLmpvaW4oJywgJyk7XG5cdFx0XHRcdGlmKHR5cGVvZiAkc2NvcGUuY2hhbmdlID09ICdmdW5jdGlvbicpICRzY29wZS5jaGFuZ2UoKTtcblx0XHRcdH1cblx0XHRcdCRzY29wZS5lbnRlciA9IGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRpZihlLmtleUNvZGU9PTEzKXtcblx0XHRcdFx0XHRpZigkc2NvcGUubmV3X3RhZyl7XG5cdFx0XHRcdFx0XHQkc2NvcGUudGFncy5wdXNoKCRzY29wZS5uZXdfdGFnKTtcblx0XHRcdFx0XHRcdCRzY29wZS51cGRhdGVfdGFncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQkc2NvcGUubmV3X3RhZyA9IG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LCB0ZW1wbGF0ZVVybDogJ3djb21fd3RhZ3MuaHRtbCdcblx0fVxufSkuZGlyZWN0aXZlKCd3bW9kYWVyYXRvcnMnLCBmdW5jdGlvbigkZmlsdGVyKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRhcnI6ICc9Jyxcblx0XHRcdHVzZXJzOiAnPScsXG5cdFx0XHRob2xkZXI6ICdAJyxcblx0XHRcdGNoYW5nZTogJyYnXG5cdFx0fSwgdGVtcGxhdGVVcmw6ICd3Y29tX3dtb2RhZXJhdG9ycy5odG1sJ1xuXHR9XG59KS5kaXJlY3RpdmUoJ3dtb2RhZXJhdG9yc3ZpZXcnLCBmdW5jdGlvbigkZmlsdGVyKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRhcnI6ICc9J1xuXHRcdH0sIHRlbXBsYXRlVXJsOiAnd2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWwnXG5cdH1cbn0pO1xuU3RyaW5nLnByb3RvdHlwZS5yQWxsID0gZnVuY3Rpb24oc2VhcmNoLCByZXBsYWNlbWVudCkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzO1xuICAgIHJldHVybiB0YXJnZXQuc3BsaXQoc2VhcmNoKS5qb2luKHJlcGxhY2VtZW50KTtcbn07XG5hbmd1bGFyLm1vZHVsZShcIndjb21fZmlsdGVyc1wiLCBbXSlcbi5maWx0ZXIoJ3RvQXJyJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4gZnVuY3Rpb24oc3RyLCBkaXYpe1xuXHRcdGlmKCFzdHIpIHJldHVybiBbXTtcblx0XHRzdHI9c3RyLnNwbGl0KChkaXZ8fCcsJykrJyAnKS5qb2luKCcsJyk7XG5cdFx0dmFyIGFyciA9IHN0ci5zcGxpdChkaXZ8fCcsJyk7XG5cdFx0Zm9yICh2YXIgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0aWYoIWFycltpXSkgYXJyLnNwbGljZShpLCAxKTtcblx0XHR9XG5cdFx0cmV0dXJuIGFycjtcblx0fVxufSkuZmlsdGVyKCdyQXJyJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4gZnVuY3Rpb24ob3JpZ2luX2FyciwgcmVtb3ZlX2Fycil7XG5cdFx0dmFyIGFyciA9IG9yaWdpbl9hcnIuc2xpY2UoKTtcblx0XHRmb3IgKHZhciBpID0gYXJyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHJlbW92ZV9hcnIubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYocmVtb3ZlX2FycltqXS5faWQgPT0gYXJyW2ldLl9pZCl7XG5cdFx0XHRcdFx0YXJyLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG59KS5maWx0ZXIoJ21vbmdvZGF0ZScsIGZ1bmN0aW9uKCl7XG5cdFwibmdJbmplY3RcIjtcblx0cmV0dXJuIGZ1bmN0aW9uKF9pZCl7XG5cdFx0aWYoIV9pZCkgcmV0dXJuIG5ldyBEYXRlKCk7XG5cdFx0dmFyIHRpbWVzdGFtcCA9IF9pZC50b1N0cmluZygpLnN1YnN0cmluZygwLDgpO1xuXHRcdHJldHVybiBuZXcgRGF0ZShwYXJzZUludCh0aW1lc3RhbXAsMTYpKjEwMDApO1xuXHR9XG59KS5maWx0ZXIoJ2ZpeGxpbmsnLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiBmdW5jdGlvbihsaW5rKXtcblx0XHRpZighbGlua3x8bGluay5pbmRleE9mKCcvLycpPjApIHJldHVybiBsaW5rO1xuXHRcdGVsc2UgcmV0dXJuICdodHRwOi8vJytsaW5rO1xuXHR9XG59KS5maWx0ZXIoJ3dkYXRlJywgZnVuY3Rpb24oJGZpbHRlcil7XG5cdFwibmdJbmplY3RcIjtcblx0cmV0dXJuIGZ1bmN0aW9uKHRpbWUsIGFkZFllYXIsIGFkZE1vbnRoLCBhZGREYXkpe1xuXHRcdHRpbWUgPSBuZXcgRGF0ZSh0aW1lKTtcblx0XHRpZihhZGRZZWFyKXtcblx0XHRcdHRpbWUuc2V0RnVsbFllYXIodGltZS5nZXRGdWxsWWVhcigpICsgcGFyc2VJbnQoYWRkWWVhcikpO1xuXHRcdH1cblx0XHRpZihhZGRNb250aCl7XG5cdFx0XHR0aW1lLnNldE1vbnRoKHRpbWUuZ2V0TW9udGgoKSArIHBhcnNlSW50KGFkZE1vbnRoKSk7XG5cdFx0fVxuXHRcdGlmKGFkZERheSl7XG5cdFx0XHR0aW1lLnNldERhdGUodGltZS5nZXREYXRlKCkgKyBwYXJzZUludChhZGREYXkpKTtcblx0XHR9XG5cdFx0dmFyIHRpbWVtcyA9IHRpbWUuZ2V0VGltZSgpO1xuXHRcdHZhciBub3dtcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdHZhciBkYXltcyA9IG5vd21zIC0gODY0MDAwMDA7XG5cdFx0aWYodGltZW1zPmRheW1zKXtcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ2hoOm1tIGEnKTtcblx0XHR9XG5cdFx0dmFyIHllYXJtcyA9IG5vd21zIC0gKDI2MjgwMDAwMDAqMTIpO1xuXHRcdGlmKHRpbWVtcz55ZWFybXMpe1xuXHRcdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAnTU1NIGRkIGhoOm1tIGEnKTtcblx0XHR9XG5cdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAneXl5eSBNTU0gZGQgaGg6bW0gYScpO1xuXHR9XG59KS5maWx0ZXIoJ21lc3NhZ2V0aW1lJywgZnVuY3Rpb24oJGZpbHRlcil7XG5cdFwibmdJbmplY3RcIjtcblx0cmV0dXJuIGZ1bmN0aW9uKHRpbWUpe1xuXHRcdHRpbWUgPSBuZXcgRGF0ZSh0aW1lKTtcblx0XHR2YXIgdGltZW1zID0gdGltZS5nZXRUaW1lKCk7XG5cdFx0dmFyIG5vd21zID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0dmFyIG1pbmFnbyA9IG5vd21zIC0gNjAwMDA7XG5cdFx0aWYodGltZW1zPm1pbmFnbykgcmV0dXJuICdBIG1pbiBhZ28uJztcblx0XHR2YXIgZGF5bXMgPSBub3dtcyAtIDg2NDAwMDAwO1xuXHRcdGlmKHRpbWVtcz5kYXltcyl7XG5cdFx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICdoaDptbSBhJyk7XG5cdFx0fVxuXHRcdHZhciB5ZWFybXMgPSBub3dtcyAtICgyNjI4MDAwMDAwKjEyKTtcblx0XHRpZih0aW1lbXM+eWVhcm1zKXtcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ01NTSBkZCBoaDptbSBhJyk7XG5cdFx0fVxuXHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ3l5eXkgTU1NIGRkIGhoOm1tIGEnKTtcblx0fVxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fbW9kYWxcIiwgW10pXG4uc2VydmljZSgnbW9kYWwnLCBmdW5jdGlvbigkY29tcGlsZSwgJHJvb3RTY29wZSl7XG5cdFwibmdJbmplY3RcIjtcblx0Lypcblx0Klx0TW9kYWxzXG5cdCovXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNlbGYubW9kYWxzID0gW107XG5cdFx0dGhpcy5tb2RhbF9saW5rID0gZnVuY3Rpb24oc2NvcGUsIGVsKXtcblx0XHRcdHNjb3BlLmNsb3NlID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLm1vZGFscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGlmKHNlbGYubW9kYWxzW2ldLmlkPT1zY29wZS5pZCl7XG5cdFx0XHRcdFx0XHRzZWxmLm1vZGFscy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoc2VsZi5tb2RhbHMubGVuZ3RoID09IDApe1xuXHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaHRtbCcpLnJlbW92ZUNsYXNzKCdub3Njcm9sbCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKHNjb3BlLmNiKSBzY29wZS5jYigpO1xuXHRcdFx0XHRlbC5yZW1vdmUoKTtcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5tb2RhbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYoc2VsZi5tb2RhbHNbaV0uaWQ9PXNjb3BlLmlkKXtcblx0XHRcdFx0XHRzZWxmLm1vZGFsc1tpXS5jbG9zZSA9IHNjb3BlLmNsb3NlO1xuXHRcdFx0XHRcdHNjb3BlLl9kYXRhID0gc2VsZi5tb2RhbHNbaV07XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gc2VsZi5tb2RhbHNbaV0pe1xuXHRcdFx0XHRcdFx0c2NvcGVba2V5XSA9IHNlbGYubW9kYWxzW2ldW2tleV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMub3BlbiA9IGZ1bmN0aW9uKG9iail7XG5cdFx0XHRpZighb2JqIHx8ICghb2JqLnRlbXBsYXRlVXJsICYmICFvYmoudGVtcGxhdGUpKSBcblx0XHRcdFx0cmV0dXJuIGNvbnNvbGUud2FybignUGxlYXNlIGFkZCB0ZW1wbGF0ZVVybCBvciB0ZW1wbGF0ZScpOyBcblx0XHRcdGlmKCFvYmouaWQpIG9iai5pZCA9IERhdGUubm93KCk7XG5cdFx0XHR2YXIgbW9kYWwgPSAnPG1vZGFsIGlkPVwiJytvYmouaWQrJ1wiPic7XG5cdFx0XHRpZihvYmoudGVtcGxhdGUpIG1vZGFsICs9IG9iai50ZW1wbGF0ZTtcblx0XHRcdGVsc2UgaWYob2JqLnRlbXBsYXRlVXJsKXtcblx0XHRcdFx0bW9kYWwgKz0gJzxuZy1pbmNsdWRlIHNyYz1cIic7XG5cdFx0XHRcdG1vZGFsICs9IFwiJ1wiK29iai50ZW1wbGF0ZVVybCtcIidcIjtcblx0XHRcdFx0bW9kYWwgKz0gJ1wiIG5nLWNvbnRyb2xsZXI9XCJ3cGFyZW50XCI+PC9uZy1pbmNsdWRlPic7XG5cdFx0XHR9XG5cdFx0XHRtb2RhbCArPSAnPC9tb2RhbD4nO1xuXHRcdFx0c2VsZi5tb2RhbHMucHVzaChvYmopO1xuXHRcdFx0dmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcblx0XHRcdGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudChtb2RhbCkpKCRyb290U2NvcGUpKTtcblx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaHRtbCcpLmFkZENsYXNzKCdub3Njcm9sbCcpO1xuXHRcdH1cblx0Lypcblx0Klx0RW5kIG9mIHdtb2RhbFxuXHQqL1xufSkuZGlyZWN0aXZlKCdtb2RhbCcsIGZ1bmN0aW9uKG1vZGFsKSB7XG5cdFwibmdJbmplY3RcIjtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRyYW5zY2x1ZGU6IHRydWUsXG5cdFx0c2NvcGU6IHtcblx0XHRcdGlkOiAnQCdcblx0XHR9LCBsaW5rOiBtb2RhbC5tb2RhbF9saW5rLCB0ZW1wbGF0ZVVybDogJ3dtb2RhbF9tb2RhbC5odG1sJ1xuXHR9O1xufSkuY29udHJvbGxlcignd3BhcmVudCcsIGZ1bmN0aW9uKCRzY29wZSwgJHRpbWVvdXQpIHtcblx0XCJuZ0luamVjdFwiO1xuXHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdGlmKCRzY29wZS4kcGFyZW50LiRwYXJlbnQuX2RhdGEpe1xuXHRcdFx0Zm9yICh2YXIga2V5IGluICRzY29wZS4kcGFyZW50LiRwYXJlbnQuX2RhdGEpIHtcblx0XHRcdFx0JHNjb3BlW2tleV0gPSAkc2NvcGUuJHBhcmVudC4kcGFyZW50Ll9kYXRhW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCRzY29wZS4kcGFyZW50Ll9kYXRhKXtcblx0XHRcdGZvciAodmFyIGtleSBpbiAkc2NvcGUuJHBhcmVudC5fZGF0YSkge1xuXHRcdFx0XHQkc2NvcGVba2V5XSA9ICRzY29wZS4kcGFyZW50Ll9kYXRhW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX21vbmdvXCIsIFtdKS5zZXJ2aWNlKCdtb25nbycsIGZ1bmN0aW9uKCRodHRwLCAkdGltZW91dCwgc29ja2V0KXtcblx0Lypcblx0Klx0RGF0YSB3aWxsIGJlIHN0b3JhZ2UgZm9yIGFsbCBpbmZvcm1hdGlvbiB3ZSBhcmUgcHVsbGluZyBmcm9tIHdhdyBjcnVkLlxuXHQqXHRkYXRhWydhcnInICsgcGFydF0gd2lsbCBob3N0IGFsbCBkb2NzIGZyb20gY29sbGVjdGlvbiBwYXJ0IGluIGFycmF5IGZvcm1cblx0Klx0ZGF0YVsnb2JqJyArIHBhcnRdIHdpbGwgaG9zdCBhbGwgZG9jcyBmcm9tIGNvbGxlY3Rpb24gcGFydCBpbiBvYmplY3QgZm9ybVxuXHQqXHRcdGFuZCBhbGwgZ3JvdXBzIGNvbGxlY2l0b25zIHByb3ZpZGVkXG5cdCpcdGRhdGFbJ29wdHMnICsgcGFydF0gd2lsbCBob3N0IG9wdGlvbnMgZm9yIGRvY3MgZnJvbSBjb2xsZWN0aW9uIHBhcnRcblx0Klx0XHRXaWxsIGJlIGluaXRpYWxpemVkIG9ubHkgaW5zaWRlIGdldFxuXHQqXHRcdFdpbGwgYmUgdXNlZCBpbnNpZGUgcHVzaFxuXHQqL1xuXHRcdHZhciBkYXRhID0ge307XG5cdC8qXG5cdCpcdHdhdyBjcnVkIGNvbm5lY3QgZnVuY3Rpb25zXG5cdCovXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIGNiKSB7XG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiID0gZG9jO1xuXHRcdFx0XHRkb2MgPSB7fTtcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL2NyZWF0ZScsIGRvYyB8fCB7fSkudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGlmIChyZXNwLmRhdGEpIHtcblx0XHRcdFx0XHRwdXNoKHBhcnQsIHJlc3AuZGF0YSk7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSBjYihyZXNwLmRhdGEpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2IoZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24ocGFydCwgb3B0cywgY2IpIHtcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiID0gb3B0cztcblx0XHRcdFx0b3B0cyA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0aWYoZGF0YVsnbG9hZGVkJytwYXJ0XSl7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKXtcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGRhdGFbJ2FycicgKyBwYXJ0XTtcblx0XHRcdH1cblx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XSA9IFtdO1xuXHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdID0ge307XG5cdFx0XHRkYXRhWydvcHRzJyArIHBhcnRdID0gb3B0cyA9IG9wdHMgfHwge307XG5cdFx0XHRpZihvcHRzLnF1ZXJ5KXtcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gb3B0cy5xdWVyeSl7XG5cdFx0XHRcdFx0aWYodHlwZW9mIG9wdHMucXVlcnlba2V5XSA9PSAnZnVuY3Rpb24nKXtcblx0XHRcdFx0XHRcdG9wdHMucXVlcnlba2V5XSA9IHtcblx0XHRcdFx0XHRcdFx0YWxsb3c6IG9wdHMucXVlcnlba2V5XVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYob3B0cy5ncm91cHMpe1xuXHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHMgPT0gJ3N0cmluZycpe1xuXHRcdFx0XHRcdG9wdHMuZ3JvdXBzID0gb3B0cy5ncm91cHMuc3BsaXQoJyAnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KG9wdHMuZ3JvdXBzKSl7XG5cdFx0XHRcdFx0dmFyIGFyciA9IG9wdHMuZ3JvdXBzO1xuXHRcdFx0XHRcdG9wdHMuZ3JvdXBzID0ge307XG5cdFx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgYXJyW2ldID09ICdzdHJpbmcnKXtcblx0XHRcdFx0XHRcdFx0b3B0cy5ncm91cHNbYXJyW2ldXSA9IHRydWU7XG5cdFx0XHRcdFx0XHR9ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGZvcih2YXIga2V5IGluIGFycltpXSl7XG5cdFx0XHRcdFx0XHRcdFx0b3B0cy5ncm91cHNba2V5XSA9IGFycltpXVtrZXldO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGZvcih2YXIga2V5IGluIG9wdHMuZ3JvdXBzKXtcblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHNba2V5XSA9PSAnYm9vbGVhbicpe1xuXHRcdFx0XHRcdFx0aWYob3B0cy5ncm91cHNba2V5XSl7XG5cdFx0XHRcdFx0XHRcdG9wdHMuZ3JvdXBzW2tleV0gPSB7XG5cdFx0XHRcdFx0XHRcdFx0ZmllbGQ6IGZ1bmN0aW9uKGRvYyl7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZG9jW2tleV07XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZ3JvdXBzW2tleV07XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHNba2V5XSAhPSAnb2JqZWN0Jyl7XG5cdFx0XHRcdFx0XHRkZWxldGUgb3B0cy5ncm91cHNba2V5XTtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHNba2V5XS5maWVsZCAhPSAnZnVuY3Rpb24nKXtcblx0XHRcdFx0XHRcdGRlbGV0ZSBvcHRzLmdyb3Vwc1trZXldO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5nZXQoJy9hcGkvJyArIHBhcnQgKyAnL2dldCcpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRpZiAocmVzcC5kYXRhKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwLmRhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHB1c2gocGFydCwgcmVzcC5kYXRhW2ldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKVxuXHRcdFx0XHRcdFx0Y2IoZGF0YVsnYXJyJyArIHBhcnRdLCBkYXRhWydvYmonICsgcGFydF0sIG9wdHMubmFtZXx8JycsIHJlc3AuZGF0YSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkYXRhWydsb2FkZWQnK3BhcnRdPSB0cnVlO1xuXHRcdFx0XHRpZihvcHRzLm5leHQpe1xuXHRcdFx0XHRcdG5leHQocGFydCwgb3B0cy5uZXh0LCBjYik7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGRhdGFbJ2FycicgKyBwYXJ0XTtcblx0XHR9O1xuXHRcdHRoaXMudXBkYXRlQWxsID0gZnVuY3Rpb24ocGFydCwgZG9jLCBvcHRzLCBjYikge1xuXHRcdFx0aWYgKHR5cGVvZiBvcHRzID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IgPSBvcHRzO1xuXHRcdFx0XHRvcHRzID0ge307XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgIT0gJ29iamVjdCcpIG9wdHMgPSB7fTtcblx0XHRcdGlmIChvcHRzLmZpZWxkcykge1xuXHRcdFx0XHRpZiAodHlwZW9mIG9wdHMuZmllbGRzID09ICdzdHJpbmcnKSBvcHRzLmZpZWxkcyA9IG9wdHMuZmllbGRzLnNwbGl0KCcgJyk7XG5cdFx0XHRcdHZhciBfZG9jID0ge307XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0cy5maWVsZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRfZG9jW29wdHMuZmllbGRzW2ldXSA9IGRvY1tvcHRzLmZpZWxkc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZG9jID0gX2RvYztcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL3VwZGF0ZS9hbGwnICsgKG9wdHMubmFtZSB8fCAnJyksIGRvYylcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRcdGlmIChyZXNwLmRhdGEgJiYgdHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGNiKHJlc3AuZGF0YSk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Y2IoZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0fTtcblx0XHR0aGlzLnVwZGF0ZVVuaXF1ZSA9IGZ1bmN0aW9uKHBhcnQsIGRvYywgb3B0cywgY2IpIHtcblx0XHRcdGlmICghb3B0cykgb3B0cyA9ICcnO1xuXHRcdFx0aWYgKHR5cGVvZiBvcHRzID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IgPSBvcHRzO1xuXHRcdFx0XHRvcHRzID0gJyc7XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgIT0gJ29iamVjdCcpIG9wdHMgPSB7fTtcblx0XHRcdGlmIChvcHRzLmZpZWxkcykge1xuXHRcdFx0XHRpZiAodHlwZW9mIG9wdHMuZmllbGRzID09ICdzdHJpbmcnKSBvcHRzLmZpZWxkcyA9IG9wdHMuZmllbGRzLnNwbGl0KCcgJyk7XG5cdFx0XHRcdHZhciBfZG9jID0ge307XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0cy5maWVsZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRfZG9jW29wdHMuZmllbGRzW2ldXSA9IGRvY1tvcHRzLmZpZWxkc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZG9jID0gX2RvYztcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL3VuaXF1ZS9maWVsZCcgKyBvcHRzLCBkb2MpLlxuXHRcdFx0dGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNiKHJlc3AuZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIG9wdHMsIGNiKSB7XG5cdFx0XHRpZiAoIW9wdHMpIG9wdHMgPSAnJztcblx0XHRcdGlmICghZG9jKSByZXR1cm47XG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYiA9IG9wdHM7XG5cdFx0XHRcdG9wdHMgPSAnJztcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL2RlbGV0ZScgKyBvcHRzLCBkb2MpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRpZiAocmVzcC5kYXRhICYmIEFycmF5LmlzQXJyYXkoZGF0YVsnYXJyJyArIHBhcnRdKSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsnYXJyJyArIHBhcnRdLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRpZiAoZGF0YVsnYXJyJyArIHBhcnRdW2ldLl9pZCA9PSBkb2MuX2lkKSB7XG5cdFx0XHRcdFx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWxldGUgZGF0YVsnb2JqJyArIHBhcnRdW2RvYy5faWRdO1xuXHRcdFx0XHRcdGlmKGRhdGFbJ29wdHMnK3BhcnRdLmdyb3Vwcyl7XG5cdFx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGZpZWxkIGluIGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldKXtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdLmxlbmd0aC0xOyBpID49IDAgOyBpLS0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF1baV0uX2lkID09IGRvYy5faWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xuXHRcdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xuXHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gZGF0YVsnb2JqJyArIHBhcnRdW2tleV0ubGVuZ3RoLTE7IGkgPj0gMCA7IGktLSkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1ba2V5XVtpXS5faWQgPT0gZG9jLl9pZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChyZXNwICYmIHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2IocmVzcC5kYXRhKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNiKGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHR0aGlzLl9pZCA9IGZ1bmN0aW9uKGNiKSB7XG5cdFx0XHRpZiAodHlwZW9mIGNiICE9ICdmdW5jdGlvbicpIHJldHVybjtcblx0XHRcdCRodHRwLmdldCgnL3dhdy9uZXdJZCcpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRjYihyZXNwLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHR0aGlzLnRvX2lkID0gZnVuY3Rpb24oZG9jcykge1xuXHRcdFx0aWYgKCFhcnIpIHJldHVybiBbXTtcblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoZG9jcykpe1xuXHQgICAgICAgIFx0ZG9jcyA9IGRvY3Muc2xpY2UoKTtcblx0ICAgICAgICB9ZWxzZSBpZih0eXBlb2YgZG9jcyA9PSAnb2JqZWN0Jyl7XG5cdCAgICAgICAgXHRpZihkb2NzLl9pZCkgcmV0dXJuIFtkb2NzLl9pZF07XG5cdCAgICAgICAgXHR2YXIgX2RvY3MgPSBbXTtcblx0ICAgICAgICBcdGZvcih2YXIga2V5IGluIGRvY3Mpe1xuXHQgICAgICAgIFx0XHRpZihkb2NzW2tleV0pIF9kb2NzLnB1c2goZG9jc1trZXldLl9pZHx8ZG9jc1trZXldKTtcblx0ICAgICAgICBcdH1cblx0ICAgICAgICBcdGRvY3MgPSBfZG9jcztcblx0ICAgICAgICB9XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRvY3MubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0aWYgKGRvY3NbaV0pIGRvY3NbaV0gPSBkb2NzW2ldLl9pZCB8fCBkb2NzW2ldO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGRvY3M7XG5cdFx0fVxuXHRcdHRoaXMuYWZ0ZXJXaGlsZSA9IGZ1bmN0aW9uKGRvYywgY2IsIHRpbWUpIHtcblx0XHRcdGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZG9jID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdCR0aW1lb3V0LmNhbmNlbChkb2MudXBkYXRlVGltZW91dCk7XG5cdFx0XHRcdGRvYy51cGRhdGVUaW1lb3V0ID0gJHRpbWVvdXQoY2IsIHRpbWUgfHwgMTAwMCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgcG9wdWxhdGUgPSB0aGlzLnBvcHVsYXRlID0gZnVuY3Rpb24oZG9jLCBmaWVsZCwgcGFydCkge1xuXHRcdFx0aWYgKCFkb2MgfHwgIWZpZWxkIHx8ICFwYXJ0KSByZXR1cm47XG5cdFx0XHRpZiAoZGF0YVsnbG9hZGVkJyArIHBhcnRdKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGRhdGFbJ29iaicgKyBwYXJ0XSk7XG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGZpZWxkKSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgZmllbGRbaV0sIHBhcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH0gZWxzZSBpZiAoZmllbGQuaW5kZXhPZignLicpID4gLTEpIHtcblx0XHRcdFx0XHRmaWVsZCA9IGZpZWxkLnNwbGl0KCcuJyk7XG5cdFx0XHRcdFx0dmFyIHN1YiA9IGZpZWxkLnNoaWZ0KCk7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBkb2Nbc3ViXSAhPSAnb2JqZWN0JykgcmV0dXJuO1xuXHRcdFx0XHRcdHJldHVybiBwb3B1bGF0ZShkb2Nbc3ViXSwgZmllbGQuam9pbignLicpLCBwYXJ0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShkb2NbZmllbGRdKSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSBkb2NbZmllbGRdLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdFx0XHRpZiAoZGF0YVsnb2JqJyArIHBhcnRdW2RvY1tmaWVsZF1baV1dKSB7XG5cdFx0XHRcdFx0XHRcdGRvY1tmaWVsZF1baV0gPSBkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXVtpXV1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGRvY1tmaWVsZF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGRvY1tmaWVsZF0gPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRkb2NbZmllbGRdID0gZGF0YVsnb2JqJyArIHBhcnRdW2RvY1tmaWVsZF1dIHx8IG51bGw7XG5cdFx0XHRcdH0gZWxzZSByZXR1cm47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIGZpZWxkLCBwYXJ0KTtcblx0XHRcdFx0fSwgMjUwKTtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKGRhdGFbJ29iaicgKyBwYXJ0XSk7XG5cdFx0fTtcblx0XHR2YXIgb24gPSB0aGlzLm9uID0gZnVuY3Rpb24ocGFydHMsIGNiKSB7XG5cdFx0XHRpZiAodHlwZW9mIHBhcnRzID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHBhcnRzID0gcGFydHMuc3BsaXQoXCIgXCIpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoIWRhdGFbJ2xvYWRlZCcgKyBwYXJ0c1tpXV0pIHtcblx0XHRcdFx0XHRyZXR1cm4gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRvbihwYXJ0cywgY2IpO1xuXHRcdFx0XHRcdH0sIDEwMCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNiKCk7XG5cdFx0fTtcblx0Lypcblx0Klx0bW9uZ28gc29ydCBmaWx0ZXJzXG5cdCovXG5cdC8qXG5cdCpcdG1vbmdvIHJlcGxhY2UgZmlsdGVyc1xuXHQqL1xuXHRcdHRoaXMuYmVBcnIgPSBmdW5jdGlvbih2YWwsIGNiKSB7XG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkodmFsKSkgY2IoW10pO1xuXHRcdFx0ZWxzZSBjYih2YWwpO1xuXHRcdH07XG5cdFx0dGhpcy5iZU9iaiA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcblx0XHRcdGlmICh0eXBlb2YgdmFsICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkodmFsKSkge1xuXHRcdFx0XHR2YWwgPSB7fTtcblx0XHRcdH1cblx0XHRcdGNiKHZhbCk7XG5cdFx0fTtcblx0XHR0aGlzLmJlRGF0ZSA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcblx0XHRcdGNiKCBuZXcgRGF0ZSh2YWwpICk7XG5cdFx0fTtcblx0XHR0aGlzLmJlU3RyaW5nID0gZnVuY3Rpb24odmFsLCBjYil7XG5cdFx0XHRpZih0eXBlb2YgdmFsICE9ICdzdHJpbmcnKXtcblx0XHRcdFx0dmFsID0gJyc7XG5cdFx0XHR9XG5cdFx0XHRjYih2YWwpO1xuXHRcdH07XG5cdFx0dGhpcy5mb3JjZUFyciA9IGZ1bmN0aW9uKGNiKSB7XG5cdFx0XHRjYihbXSk7XG5cdFx0fTtcblx0XHR0aGlzLmZvcmNlT2JqID0gZnVuY3Rpb24oY2IpIHtcblx0XHRcdGNiKHt9KTtcblx0XHR9O1xuXHRcdHRoaXMuZm9yY2VTdHJpbmcgPSBmdW5jdGlvbih2YWwsIGNiKXsgY2IoJycpOyB9O1xuXHRcdHRoaXMuZ2V0Q3JlYXRlZCA9IGZ1bmN0aW9uKHZhbCwgY2IsIGRvYyl7XG5cdFx0XHRyZXR1cm4gbmV3IERhdGUocGFyc2VJbnQoZG9jLl9pZC5zdWJzdHJpbmcoMCw4KSwgMTYpKjEwMDApO1xuXHRcdH07XG5cdC8qXG5cdCpcdG1vbmdvIGxvY2FsIHN1cHBvcnQgZnVuY3Rpb25zXG5cdCovXG5cdFx0dmFyIHJlcGxhY2UgPSBmdW5jdGlvbihkb2MsIHZhbHVlLCBycGwsIHBhcnQpIHtcblx0XHRcdGlmICh2YWx1ZS5pbmRleE9mKCcuJykgPiAtMSkge1xuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnNwbGl0KCcuJyk7XG5cdFx0XHRcdHZhciBzdWIgPSB2YWx1ZS5zaGlmdCgpO1xuXHRcdFx0XHRpZiAoZG9jW3N1Yl0gJiYgKHR5cGVvZiBkb2Nbc3ViXSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGRvY1tzdWJdKSkpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRpZiAoIWRvY1tzdWJdKSBkb2Nbc3ViXSA9IHt9O1xuXHRcdFx0XHRyZXR1cm4gcmVwbGFjZShkb2Nbc3ViXSwgdmFsdWUuam9pbignLicpLCBycGwsIHBhcnQpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHR5cGVvZiBycGwgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRycGwoZG9jW3ZhbHVlXSwgZnVuY3Rpb24obmV3VmFsdWUpIHtcblx0XHRcdFx0XHRkb2NbdmFsdWVdID0gbmV3VmFsdWU7XG5cdFx0XHRcdH0sIGRvYyk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgcHVzaCA9IGZ1bmN0aW9uKHBhcnQsIGRvYykge1xuXHRcdFx0aWYoZGF0YVsnb2JqJyArIHBhcnRdW2RvYy5faWRdKSByZXR1cm47XG5cdFx0XHRpZiAoZGF0YVsnb3B0cycgKyBwYXJ0XS5yZXBsYWNlKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBkYXRhWydvcHRzJyArIHBhcnRdLnJlcGxhY2UpIHtcblx0XHRcdFx0XHRyZXBsYWNlKGRvYywga2V5LCBkYXRhWydvcHRzJyArIHBhcnRdLnJlcGxhY2Vba2V5XSwgcGFydCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGRhdGFbJ29wdHMnK3BhcnRdLnBvcHVsYXRlKXtcblx0XHRcdFx0dmFyIHAgPSBkYXRhWydvcHRzJytwYXJ0XS5wb3B1bGF0ZTtcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShwKSl7XG5cdFx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IHAubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdFx0aWYodHlwZW9mIHAgPT0gJ29iamVjdCcgJiYgcFtpXS5maWVsZCAmJiBwW2ldLnBhcnQpe1xuXHRcdFx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIHBbaV0uZmllbGQsIHBbaV0ucGFydCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YgcCA9PSAnb2JqZWN0JyAmJiBwLmZpZWxkICYmIHAucGFydCl7XG5cdFx0XHRcdFx0cG9wdWxhdGUoZG9jLCBwLmZpZWxkLCBwLnBhcnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkYXRhWydhcnInICsgcGFydF0ucHVzaChkb2MpO1xuXHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2RvYy5faWRdID0gZG9jO1xuXHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcblx0XHRcdFx0XHR2YXIgZyA9IGRhdGFbJ29wdHMnK3BhcnRdLmdyb3Vwc1trZXldO1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBnLmlnbm9yZSA9PSAnZnVuY3Rpb24nICYmIGcuaWdub3JlKGRvYykpIHJldHVybjtcblx0XHRcdFx0XHRpZih0eXBlb2YgZy5hbGxvdyA9PSAnZnVuY3Rpb24nICYmICFnLmFsbG93KGRvYykpIHJldHVybjtcblx0XHRcdFx0XHRpZighZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xuXHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV0gPSB7fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIHNldCAgPSBmdW5jdGlvbihmaWVsZCl7XG5cdFx0XHRcdFx0XHRpZighZmllbGQpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmKCFBcnJheS5pc0FycmF5KGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXSkpe1xuXHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0gPSBbXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXS5wdXNoKGRvYyk7XG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgZy5zb3J0ID09ICdmdW5jdGlvbicpe1xuXHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0uc29ydChnLnNvcnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzZXQoZy5maWVsZChkb2MsIGZ1bmN0aW9uKGZpZWxkKXtcblx0XHRcdFx0XHRcdHNldChmaWVsZCk7XG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5KXtcblx0XHRcdFx0XHR2YXIgcXVlcnkgPSBkYXRhWydvcHRzJytwYXJ0XS5xdWVyeVtrZXldO1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBxdWVyeS5pZ25vcmUgPT0gJ2Z1bmN0aW9uJyAmJiBxdWVyeS5pZ25vcmUoZG9jKSkgcmV0dXJuO1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBxdWVyeS5hbGxvdyA9PSAnZnVuY3Rpb24nICYmICFxdWVyeS5hbGxvdyhkb2MpKSByZXR1cm47XG5cdFx0XHRcdFx0aWYoIWRhdGFbJ29iaicgKyBwYXJ0XVtrZXldKXtcblx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldID0gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCBkYXRhWydvYmonICsgcGFydF1ba2V5XS5wdXNoKGRvYyk7XG5cdFx0XHRcdFx0aWYodHlwZW9mIHF1ZXJ5LnNvcnQgPT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XS5zb3J0KHF1ZXJ5LnNvcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIG5leHQgPSBmdW5jdGlvbihwYXJ0LCBvcHRzLCBjYil7XG5cdFx0XHQkaHR0cC5nZXQoJy9hcGkvJyArIHBhcnQgKyAnL2dldCcpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRpZiAocmVzcC5kYXRhKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwLmRhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHB1c2gocGFydCwgcmVzcC5kYXRhW2ldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKVxuXHRcdFx0XHRcdFx0Y2IoZGF0YVsnYXJyJyArIHBhcnRdLCBkYXRhWydvYmonICsgcGFydF0sIG9wdHMubmFtZXx8JycsIHJlc3AuZGF0YSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihvcHRzLm5leHQpe1xuXHRcdFx0XHRcdG5leHQocGFydCwgb3B0cy5uZXh0LCBjYik7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdC8qXG5cdCpcdEVuZG9mIE1vbmdvIFNlcnZpY2Vcblx0Ki9cbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3BvcHVwXCIsIFtdKVxuICAgIC5zZXJ2aWNlKCdwb3B1cCcsIGZ1bmN0aW9uKCRjb21waWxlLCAkcm9vdFNjb3BlKSB7XG4gICAgICAgIFwibmdJbmplY3RcIjtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uKHNpemUsIGNvbmZpZywgZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghY29uZmlnIHx8ICghY29uZmlnLnRlbXBsYXRlVXJsICYmICFjb25maWcudGVtcGxhdGUpKVxuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ1BsZWFzZSBhZGQgdGVtcGxhdGVVcmwgb3IgdGVtcGxhdGUnKTtcbiAgICAgICAgICAgIHZhciBwb3B1cCA9ICc8cG9wdXAgc3R5bGU9XCJwb3NpdGlvbjogZml4ZWQ7XCIgY29uZmlnPVwiJyArIChKU09OLnN0cmluZ2lmeShjb25maWcpKS5zcGxpdCgnXCInKS5qb2luKFwiJ1wiKSArICdcInNpemU9XCInICsgKEpTT04uc3RyaW5naWZ5KHNpemUpKS5zcGxpdCgnXCInKS5qb2luKFwiJ1wiKSArICdcIj4nO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy50ZW1wbGF0ZSkgcG9wdXAgKz0gY29uZmlnLnRlbXBsYXRlO1xuICAgICAgICAgICAgZWxzZSBpZiAoY29uZmlnLnRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAgKz0gJzxuZy1pbmNsdWRlIHNyYz1cIic7XG4gICAgICAgICAgICAgICAgcG9wdXAgKz0gXCInXCIgKyBjb25maWcudGVtcGxhdGVVcmwgKyBcIidcIjtcbiAgICAgICAgICAgICAgICBwb3B1cCArPSAnXCI+PC9uZy1pbmNsdWRlPic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3B1cCArPSAnPC9wb3B1cD4nO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudChwb3B1cCkpKCRyb290U2NvcGUpKTtcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaHRtbCcpLmFkZENsYXNzKCdub3Njcm9sbCcpO1xuICAgICAgICB9XG4gICAgfSkuZGlyZWN0aXZlKCdwb3AnLCBmdW5jdGlvbihwb3B1cCkge1xuICAgICAgICBcIm5nSW5qZWN0XCI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY29uZmlnOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAxMCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMzcwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkc2NvcGUub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vQWRkIHRvIHNjb3BlLnNpemUgc3BhbiBlbGVtZW50IGxlZnQsIHRvcCBmcm9tIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLm9wZW4oJHNjb3BlLnNpemUsICRzY29wZS5jb25maWcsIGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3dtb2RhbF9wb3B1cC5odG1sJ1xuICAgICAgICB9O1xuICAgIH0pLmRpcmVjdGl2ZSgncG9wdXAnLCBmdW5jdGlvbihwb3B1cCkge1xuICAgICAgICBcIm5nSW5qZWN0XCI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNvbmZpZzogJz0nLFxuICAgICAgICAgICAgICAgIHNpemU6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoJHNjb3BlLmNvbmZpZy5wb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAqIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmInOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSArIGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCArIChldmVudC50YXJnZXQub2Zmc2V0V2lkdGggLyAyKSAtICgkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aCAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xiJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCAtICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSArIGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCAtICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZIC0gKGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQgLyAyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2x0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCAtICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAqIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyAoZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoIC8gMikgLSAoJHNjb3BlLnNpemUub2Zmc2V0V2lkdGggLyAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZIC0gJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmRlZmF1bHQoJHNjb3BlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFskc2NvcGUuc2l6ZS5sZWZ0LCAkc2NvcGUuc2l6ZS50b3BdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0ID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZID4gJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggPiAkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aDtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYm90dG9tID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAtICgoZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFgpICsgJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0KSA+ICRzY29wZS5zaXplLm9mZnNldEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLSAoKGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYKSArICRzY29wZS5zaXplLm9mZnNldFdpZHRoKSA+ICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xuXG5cblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0b3ApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhsZWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmlnaHQpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnQgJiYgdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdsdCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmlnaHQgJiYgdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdydCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmlnaHQgJiYgYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdyYic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCAmJiBib3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2xiJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3QnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdyJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChib3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2InO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2wnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgJHNjb3BlLmNvbmZpZy5wb3MgPSAnYic7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3Blbigkc2NvcGUuc2l6ZSwgJHNjb3BlLmNvbmZpZywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3NkXCIsIFtdKVxuXG5hbmd1bGFyLm1vZHVsZShcIndjb21fc2VydmljZXNcIiwgW10pLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCAkY29tcGlsZSl7XG5cdHZhciBib2R5ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdib2R5JykuZXEoMCk7XG5cdGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudCgnPHB1bGxmaWxlcz48L3B1bGxmaWxlcz4nKSkoJHJvb3RTY29wZSkpO1xufSkuZmFjdG9yeSgnc29ja2V0JywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHRpZih0eXBlb2YgaW8gIT0gJ29iamVjdCcpIHJldHVybiB7fTtcblx0dmFyIGxvYyA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXHR2YXIgc29ja2V0ID0gaW8uY29ubmVjdChsb2MpO1xuXHRyZXR1cm4gc29ja2V0O1xufSkuc2VydmljZSgnZmlsZScsIGZ1bmN0aW9uKCR0aW1lb3V0KXtcblx0XCJuZ0luamVjdFwiO1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHNlbGYuYWRkID0gZnVuY3Rpb24ob3B0cywgY2Ipe1xuXHRcdGlmKHR5cGVvZiBzZWxmLmFkZERlbGF5ICE9ICdmdW5jdGlvbicpe1xuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0c2VsZi5hZGQob3B0cywgY2IpO1xuXHRcdFx0fSwgMTAwKTtcblx0XHR9ZWxzZXtcblx0XHRcdHNlbGYuYWRkRGVsYXkob3B0cywgY2IpO1xuXHRcdH1cblx0fVxufSkucnVuKGZ1bmN0aW9uIChjdHJsKSB7XG5cdFwibmdJbmplY3RcIjtcblx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uIChlKSB7XG5cdFx0Y3RybC5wcmVzcyhlLmtleUNvZGUpO1xuXHR9KTtcbn0pLnNlcnZpY2UoJ2N0cmwnLCBmdW5jdGlvbigkdGltZW91dCl7XG5cdHZhciBzZWxmID0gdGhpcztcblx0dmFyIGNicyA9IFtdO1xuXHR2YXIgZW51bXMgPSB7XG5cdFx0J3NwYWNlJzogMzIsXG5cdFx0J2VzYyc6IDI3LFxuXHRcdCdiYWNrc3BhY2UnOiA4LFxuXHRcdCd0YWInOiA5LFxuXHRcdCdlbnRlcic6IDEzLFxuXHRcdCdzaGlmdCc6IDE2LFxuXHRcdCdjdHJsJzogMTcsXG5cdFx0J2FsdCc6IDE4LFxuXHRcdCdwYXVzZS9icmVhayc6IDE5LFxuXHRcdCdjYXBzIGxvY2snOiAyMCxcblx0XHQnZXNjYXBlJzogMjcsXG5cdFx0J3BhZ2UgdXAnOiAzMyxcblx0XHQncGFnZSBkb3duJzogMzQsXG5cdFx0J2VuZCc6IDM1LFxuXHRcdCdob21lJzogMzYsXG5cdFx0J2xlZnQnOiAzNyxcblx0XHQndXAnOiAzOCxcblx0XHQncmlnaHQnOiAzOSxcblx0XHQnZG93bic6IDQwLFxuXHRcdCdpbnNlcnQnOiA0NSxcblx0XHQnZGVsZXRlJzogNDYsXG5cdFx0JzAnOiA0OCxcblx0XHQnMSc6IDQ5LFxuXHRcdCcyJzogNTAsXG5cdFx0JzMnOiA1MSxcblx0XHQnNCc6IDUyLFxuXHRcdCc1JzogNTMsXG5cdFx0JzYnOiA1NCxcblx0XHQnNyc6IDU1LFxuXHRcdCc4JzogNTYsXG5cdFx0JzknOiA1Nyxcblx0XHQnYSc6IDY1LFxuXHRcdCdiJzogNjYsXG5cdFx0J2MnOiA2Nyxcblx0XHQnZCc6IDY4LFxuXHRcdCdlJzogNjksXG5cdFx0J2YnOiA3MCxcblx0XHQnZyc6IDcxLFxuXHRcdCdoJzogNzIsXG5cdFx0J2knOiA3Myxcblx0XHQnaic6IDc0LFxuXHRcdCdrJzogNzUsXG5cdFx0J2wnOiA3Nixcblx0XHQnbSc6IDc3LFxuXHRcdCduJzogNzgsXG5cdFx0J28nOiA3OSxcblx0XHQncCc6IDgwLFxuXHRcdCdxJzogODEsXG5cdFx0J3InOiA4Mixcblx0XHQncyc6IDgzLFxuXHRcdCd0JzogODQsXG5cdFx0J3UnOiA4NSxcblx0XHQndic6IDg2LFxuXHRcdCd3JzogODcsXG5cdFx0J3gnOiA4OCxcblx0XHQneSc6IDg5LFxuXHRcdCd6JzogOTAsXG5cdFx0J2xlZnQgd2luZG93IGtleSc6IDkxLFxuXHRcdCdyaWdodCB3aW5kb3cga2V5JzogOTIsXG5cdFx0J3NlbGVjdCBrZXknOiA5Myxcblx0XHQnbnVtcGFkIDAnOiA5Nixcblx0XHQnbnVtcGFkIDEnOiA5Nyxcblx0XHQnbnVtcGFkIDInOiA5OCxcblx0XHQnbnVtcGFkIDMnOiA5OSxcblx0XHQnbnVtcGFkIDQnOiAxMDAsXG5cdFx0J251bXBhZCA1JzogMTAxLFxuXHRcdCdudW1wYWQgNic6IDEwMixcblx0XHQnbnVtcGFkIDcnOiAxMDMsXG5cdFx0J251bXBhZCA4JzogMTA0LFxuXHRcdCdudW1wYWQgOSc6IDEwNSxcblx0XHQnbXVsdGlwbHknOiAxMDYsXG5cdFx0J2FkZCc6IDEwNyxcblx0XHQnc3VidHJhY3QnOiAxMDksXG5cdFx0J2RlY2ltYWwgcG9pbnQnOiAxMTAsXG5cdFx0J2RpdmlkZSc6IDExMSxcblx0XHQnZjEnOiAxMTIsXG5cdFx0J2YyJzogMTEzLFxuXHRcdCdmMyc6IDExNCxcblx0XHQnZjQnOiAxMTUsXG5cdFx0J2Y1JzogMTE2LFxuXHRcdCdmNic6IDExNyxcblx0XHQnZjcnOiAxMTgsXG5cdFx0J2Y4JzogMTE5LFxuXHRcdCdmOSc6IDEyMCxcblx0XHQnZjEwJzogMTIxLFxuXHRcdCdmMTEnOiAxMjIsXG5cdFx0J2YxMic6IDEyMyxcblx0XHQnbnVtIGxvY2snOiAxNDQsXG5cdFx0J3Njcm9sbCBsb2NrJzogMTQ1LFxuXHRcdCdzZW1pLWNvbG9uJzogMTg2LFxuXHRcdCdlcXVhbCBzaWduJzogMTg3LFxuXHRcdCdjb21tYSc6IDE4OCxcblx0XHQnZGFzaCc6IDE4OSxcblx0XHQncGVyaW9kJzogMTkwLFxuXHRcdCdmb3J3YXJkIHNsYXNoJzogMTkxLFxuXHRcdCdncmF2ZSBhY2NlbnQnOiAxOTIsXG5cdFx0J29wZW4gYnJhY2tldCc6IDIxOSxcblx0XHQnYmFjayBzbGFzaCc6IDIyMCxcblx0XHQnY2xvc2UgYnJha2V0JzogMjIxLFxuXHRcdCdzaW5nbGUgcXVvdGUnOiAyMjIsXG5cdH07XG5cdHRoaXMucHJlc3MgPSBmdW5jdGlvbihjb2RlKXtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNicy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYoY2JzW2ldLmtleSA9PSBjb2RlKSAkdGltZW91dChjYnNbaV0uY2IpO1xuXHRcdH1cblx0fVxuXHR0aGlzLm9uID0gZnVuY3Rpb24oYnRucywgY2Ipe1xuXHRcdGlmKHR5cGVvZiBjYiAhPSAnZnVuY3Rpb24nKSByZXR1cm47XG5cdFx0aWYoIUFycmF5LmlzQXJyYXkoYnRucykmJnR5cGVvZiBidG5zICE9ICdvYmplY3QnKSByZXR1cm47XG5cdFx0aWYoIUFycmF5LmlzQXJyYXkoYnRucykmJnR5cGVvZiBidG5zID09ICdvYmplY3QnKSBidG5zID0gW2J0bnNdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYnRucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYodHlwZW9mIGVudW1zW2J0bnNbaV1dID09ICdudW1iZXInKXtcblx0XHRcdFx0Y2JzLnB1c2goe1xuXHRcdFx0XHRcdGtleTogZW51bXNbYnRuc1tpXV0sXG5cdFx0XHRcdFx0Y2I6IGNiXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSkuc2VydmljZSgnaW1nJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHR0aGlzLmZpbGVUb0RhdGFVcmwgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjayl7XG5cdFx0dmFyIGEgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdGEub25sb2FkID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0Y2FsbGJhY2soZS50YXJnZXQucmVzdWx0KTtcblx0XHR9XG5cdFx0YS5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHR9XG5cdHRoaXMucmVzaXplVXBUbyA9IGZ1bmN0aW9uKGluZm8sIGNhbGxiYWNrKXtcblx0XHRpZighaW5mby5maWxlKSByZXR1cm4gY29uc29sZS5sb2coJ05vIGltYWdlJyk7XG5cdFx0aW5mby53aWR0aCA9IGluZm8ud2lkdGggfHwgMTkyMDtcblx0XHRpbmZvLmhlaWdodCA9IGluZm8uaGVpZ2h0IHx8IDEwODA7XG5cdFx0aWYoaW5mby5maWxlLnR5cGUhPVwiaW1hZ2UvanBlZ1wiICYmIGluZm8uZmlsZS50eXBlIT1cImltYWdlL3BuZ1wiKVxuXHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKFwiWW91IG11c3QgdXBsb2FkIGZpbGUgb25seSBKUEVHIG9yIFBORyBmb3JtYXQuXCIpO1xuXHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAobG9hZEV2ZW50KSB7XG5cdFx0XHR2YXIgY2FudmFzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGltYWdlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0aW1hZ2VFbGVtZW50Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgaW5mb1JhdGlvID0gaW5mby53aWR0aCAvIGluZm8uaGVpZ2h0O1xuXHRcdFx0XHR2YXIgaW1nUmF0aW8gPSBpbWFnZUVsZW1lbnQud2lkdGggLyBpbWFnZUVsZW1lbnQuaGVpZ2h0O1xuXHRcdFx0XHRpZiAoaW1nUmF0aW8gPiBpbmZvUmF0aW8pIHtcblx0XHRcdFx0XHR3aWR0aCA9IGluZm8ud2lkdGg7XG5cdFx0XHRcdFx0aGVpZ2h0ID0gd2lkdGggLyBpbWdSYXRpbztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRoZWlnaHQgPSBpbmZvLmhlaWdodDtcblx0XHRcdFx0XHR3aWR0aCA9IGhlaWdodCAqIGltZ1JhdGlvO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhbnZhc0VsZW1lbnQud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzRWxlbWVudC5oZWlnaHQgPSBoZWlnaHQ7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gY2FudmFzRWxlbWVudC5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdFx0XHRjb250ZXh0LmRyYXdJbWFnZShpbWFnZUVsZW1lbnQsIDAsIDAgLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdFx0Y2FsbGJhY2soY2FudmFzRWxlbWVudC50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEpKTtcblx0XHRcdH07XG5cdFx0XHRpbWFnZUVsZW1lbnQuc3JjID0gbG9hZEV2ZW50LnRhcmdldC5yZXN1bHQ7XG5cdFx0fTtcblx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChpbmZvLmZpbGUpO1xuXHR9XG59KS5zZXJ2aWNlKCdoYXNoJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHR0aGlzLnNldCA9IGZ1bmN0aW9uKG9iail7XG5cdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSAnJztcblx0XHRmb3IodmFyIGtleSBpbiBvYmope1xuXHRcdFx0aWYob2JqW2tleV0pIHdpbmRvdy5sb2NhdGlvbi5oYXNoKz0nJicra2V5Kyc9JytvYmpba2V5XTtcblxuXHRcdH1cblx0fVxuXHR0aGlzLmdldCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjISMnLCAnJyk7XG5cdFx0aGFzaCA9IGhhc2gucmVwbGFjZSgnIycsICcnKS5zcGxpdCgnJicpO1xuXHRcdGhhc2guc2hpZnQoKTtcblx0XHR2YXIgaCA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaGFzaC5sZW5ndGg7IGkrKykge1xuXHRcdFx0aGFzaFtpXSA9IGhhc2hbaV0uc3BsaXQoJz0nKTtcblx0XHRcdGhbaGFzaFtpXVswXV0gPSBoYXNoW2ldWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gaDtcblx0fVxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fc3Bpbm5lclwiLCBbXSlcbiAgICAuc2VydmljZSgnc3BpbicsIGZ1bmN0aW9uKCRjb21waWxlLCAkcm9vdFNjb3BlKSB7XG4gICAgICAgIFwibmdJbmplY3RcIjtcbiAgICAgICAgLypcbiAgICAgICAgICpcdFNwaW5uZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3Bpbm5lcnMgPSBbXTtcbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuc3Bpbm5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5zcGlubmVyc1tpXS5pZCA9PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNwaW5uZXJzW2ldLmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNwaW5uZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBpZiAoIW9iaikgb2JqID0ge307XG4gICAgICAgICAgICBpZiAoIW9iai5pZCkgb2JqLmlkID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHZhciBtb2RhbCA9ICc8c3BpbiAgaWQ9XCInICsgb2JqLmlkICsgJ1wiPic7XG4gICAgICAgICAgICBpZiAob2JqLnRlbXBsYXRlKSBtb2RhbCArPSBvYmoudGVtcGxhdGU7XG4gICAgICAgICAgICBlbHNlIGlmIChvYmoudGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnPG5nLWluY2x1ZGUgc3JjPVwiJztcbiAgICAgICAgICAgICAgICBtb2RhbCArPSBcIidcIiArIG9iai50ZW1wbGF0ZVVybCArIFwiJ1wiO1xuICAgICAgICAgICAgICAgIG1vZGFsICs9ICdcIj48L25nLWluY2x1ZGU+JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJzxuZy1pbmNsdWRlICBzcmM9XCInO1xuICAgICAgICAgICAgICAgIG1vZGFsICs9IFwiJ3dtb2RhbF9zcGlubmVyLmh0bWwnXCI7XG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJ1wiPjwvbmctaW5jbHVkZT4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbW9kYWwgKz0gJzwvc3Bpbj4nO1xuICAgICAgICAgICAgdGhpcy5zcGlubmVycy5wdXNoKG9iaik7XG4gICAgICAgICAgICBpZiAob2JqLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIFx0XG4gICAgICAgICAgICBcdGNvbnNvbGUubG9nKG9iai5lbGVtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBcdHZhciBib2R5ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdib2R5JykuZXEoMCk7XG5cdFx0XHRcdGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudChtb2RhbCkpKCRyb290U2NvcGUpKTtcblx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykuYWRkQ2xhc3MoJ25vc2Nyb2xsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqLmlkO1xuICAgICAgICB9XG4gICAgfSkuZGlyZWN0aXZlKCdzcGluJywgZnVuY3Rpb24oc3Bpbikge1xuICAgICAgICBcIm5nSW5qZWN0XCI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgaWQ6ICdAJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3Bpbm5lci5zcGlubmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lci5zcGlubmVyc1tpXS5pZCA9PSBzY29wZS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zcGlubmVyc1tpXS5lbCA9IGVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnd21vZGFsX3NwaW5uZXIuaHRtbCdcbiAgICAgICAgfTtcbiAgICB9KTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGFlcmF0b3JzLmh0bWxcIiwgXCI8bGFiZWwgY2xhc3M9XFxcInd0YWdzXFxcIj48c3BhbiBjbGFzcz0nd3RhZycgbmctcmVwZWF0PSdvYmogaW4gYXJyJz48aW1nIG5nLXNyYz0ne3tvYmouYXZhdGFyVXJsfX0nIGFsdD0ne3tvYmoubmFtZX19Jz48c3Bhbj57e29iai5uYW1lfX08L3NwYW4+PGkgY2xhc3M9J2ljb24gaWNvbi1jbG9zZScgbmctY2xpY2s9J2Fyci5zcGxpY2UoJGluZGV4LCAxKTsgY2hhbmdlKCk7Jz48L2k+PC9zcGFuPjxpbnB1dCB0eXBlPSd0ZXh0JyBwbGFjZWhvbGRlcj0ne3tob2xkZXJ9fScgbmctbW9kZWw9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48L2xhYmVsPjxkaXYgbmctaWY9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48ZGl2IG5nLXJlcGVhdD0ndXNlciBpbiB1c2Vyc3xyQXJyOmFycnxmaWx0ZXI6b2JqZWN0Lm5ld19tb2RlcmF0b3InIG5nLWNsaWNrPSdhcnIucHVzaCh1c2VyKTsgb2JqZWN0Lm5ld19tb2RlcmF0b3I9bnVsbDsgY2hhbmdlKCk7Jz48aW1nIG5nLXNyYz0ne3t1c2VyLmF2YXRhclVybH19JyBhbHQ9J3t7dXNlci5uYW1lfX0nPjxzcGFuPnt7dXNlci5uYW1lfX08L3NwYW4+PC9kaXY+PC9kaXY+XCIpO1xufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RhZXJhdG9yc3ZpZXcuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGFlcmF0b3Jzdmlldy5odG1sXCIsIFwiPHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PHNwYW4+e3tvYmoubmFtZX19PC9zcGFuPjwvc3Bhbj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd21vZGVyYXRvcnMuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGVyYXRvcnMuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz1cXFwid3RhZ3NcXFwiPjxkaXYgY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGRpdiBjbGFzcz1cXFwid3RhZy0taW5cXFwiPjxkaXYgY2xhc3M9XFxcInd0YWctLWF2YVxcXCI+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PC9kaXY+PGRpdiBjbGFzcz1cXFwid3RhZy0tdGV4dFxcXCI+e3tvYmoubmFtZX19PC9kaXY+PGkgY2xhc3M9J2ljb24gaWNvbi1jbG9zZScgbmctY2xpY2s9J2Fyci5zcGxpY2UoJGluZGV4LCAxKTsgY2hhbmdlKCk7JyB0aXRsZT1cXFwiRGVsZXRlIG1vZGVyYXRvclxcXCI+PC9pPjwvZGl2PjwvZGl2PjxpbnB1dCB0eXBlPSd0ZXh0JyBwbGFjZWhvbGRlcj0ne3tob2xkZXJ9fScgbmctbW9kZWw9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48L2xhYmVsPjxkaXYgbmctaWY9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48ZGl2IG5nLXJlcGVhdD0ndXNlciBpbiB1c2Vyc3xyQXJyOmFycnxmaWx0ZXI6b2JqZWN0Lm5ld19tb2RlcmF0b3InIG5nLWNsaWNrPSdhcnIucHVzaCh1c2VyKTsgb2JqZWN0Lm5ld19tb2RlcmF0b3I9bnVsbDsgY2hhbmdlKCk7Jz48aW1nIG5nLXNyYz0ne3t1c2VyLmF2YXRhclVybH19JyBhbHQ9J3t7dXNlci5uYW1lfX0nPjxzcGFuPnt7dXNlci5uYW1lfX08L3NwYW4+PC9kaXY+PC9kaXY+XCIpO1xufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kZXJhdG9yc3ZpZXcuaHRtbFwiLCBcIjxzcGFuIGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J29iaiBpbiBhcnInPjxkaXYgY2xhc3M9XFxcInd0YWctLWluXFxcIj48ZGl2IGNsYXNzPVxcXCJ3dGFnLS1hdmFcXFwiPjxpbWcgbmctc3JjPSd7e29iai5hdmF0YXJVcmx9fScgYWx0PSd7e29iai5uYW1lfX0nPjwvZGl2PjxkaXYgY2xhc3M9XFxcInd0YWctLXRleHRcXFwiPnt7b2JqLm5hbWV9fTwvZGl2PjwvZGl2Pjwvc3Bhbj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd3RhZ3MuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd3RhZ3MuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz0nd3RhZ3MnPjxzcGFuIGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J3RhZyBpbiB0YWdzJz4je3t0YWd9fSA8aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlJyBuZy1jbGljaz0ndGFncy5zcGxpY2UoJGluZGV4LCAxKTsgdXBkYXRlX3RhZ3MoKTsnPjwvaT48L3NwYW4+PGlucHV0IHR5cGU9J3RleHQnIHBsYWNlaG9sZGVyPSduZXcgdGFnJyBuZy1tb2RlbD0nbmV3X3RhZycgbmcta2V5dXA9J2VudGVyKCRldmVudCknPjwvbGFiZWw+XCIpO1xufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3bW9kYWxfbW9kYWwuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndtb2RhbF9tb2RhbC5odG1sXCIsIFwiPGRpdiBjbGFzcz0nbW9kYWwnIG5nLWNsYXNzPVxcXCJ7ZnVsbDogZnVsbCwgY292ZXI6IGNvdmVyfVxcXCI+PGRpdiBjbGFzcz0nbW9kYWxfZmFkZScgbmctY2xpY2s9J2Nsb3NlKCk7JyB0aXRsZT0nQ2xvc2UnPjwvZGl2PjxkaXYgY2xhc3M9J21vZGFsX2NvbnRlbnQgdmlld2VyJz48aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlIGNsb3NlLW0nIG5nLWNsaWNrPSdjbG9zZSgpOycgdGl0bGU9J0Nsb3NlJz48L2k+PGgyIG5nLWlmPVxcXCJoZWFkZXJcXFwiPnt7aGVhZGVyfX08L2gyPjxwIG5nLWlmPVxcXCJjb250ZW50XFxcIj57e2NvbnRlbnR9fTwvcD48bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+PC9kaXY+XCIpO1xufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3bW9kYWxfcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndtb2RhbF9wb3B1cC5odG1sXCIsIFwiPHNwYW4gbmctY2xpY2stb3V0c2lkZT1cXFwiY2xvc2UoKVxcXCIgbmctdHJhbnNjbHVkZSBuZy1jbGljaz1cXFwib3BlbigkZXZlbnQpXFxcIiBlbHNpemU9XFxcInNpemVcXFwiPjwvc3Bhbj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9zcGlubmVyLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3bW9kYWxfc3Bpbm5lci5odG1sXCIsIFwiPCEtLSBDb21tZW50cyBhcmUganVzdCB0byBmaXggd2hpdGVzcGFjZSB3aXRoIGlubGluZS1ibG9jayAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyXFxcIj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTFcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLSAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUgU3Bpbm5lci1saW5lLS0yXFxcIj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1sZWZ0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtdGlja2VyXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1jZW50ZXJcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLXJpZ2h0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tM1xcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTRcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLS0tPjwvZGl2PjwhLS0vc3Bpbm5lciAtLT5cIik7XG59XSk7Il19

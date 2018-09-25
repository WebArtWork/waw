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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndjb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsUUFBQSxPQUFBLFFBQUEsQ0FBQSx5QkFBQSxtQkFBQSxnQkFBQSxjQUFBLGNBQUEsY0FBQSxXQUFBLGlCQUFBLGdCQUFBLDBCQUFBLDhCQUFBLHlCQUFBLDZCQUFBLG1CQUFBLHFCQUFBLHFCQUFBOzs7QUFHQSxDQUFBLFdBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUEseUJBQUE7U0FDQSxVQUFBLGdCQUFBO1lBQ0EsYUFBQSxVQUFBO1lBQ0E7Ozs7Ozs7Ozs7O0lBV0EsU0FBQSxhQUFBLFdBQUEsUUFBQSxVQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxNQUFBLFNBQUEsUUFBQSxNQUFBLE1BQUE7OztnQkFHQSxTQUFBLFdBQUE7b0JBQ0EsSUFBQSxZQUFBLENBQUEsS0FBQSxpQkFBQSxhQUFBLEtBQUEsYUFBQSxNQUFBLFdBQUE7d0JBQ0E7O29CQUVBLFNBQUEsYUFBQSxHQUFBO3dCQUNBLElBQUE7NEJBQ0E7NEJBQ0E7NEJBQ0E7NEJBQ0E7NEJBQ0E7Ozt3QkFHQSxJQUFBLFFBQUEsUUFBQSxNQUFBLFNBQUEsWUFBQTs0QkFDQTs7Ozt3QkFJQSxJQUFBLENBQUEsS0FBQSxDQUFBLEVBQUEsUUFBQTs0QkFDQTs7Ozt3QkFJQSxLQUFBLFVBQUEsRUFBQSxRQUFBLFNBQUEsVUFBQSxRQUFBLFlBQUE7OzRCQUVBLElBQUEsWUFBQSxLQUFBLElBQUE7Z0NBQ0E7Ozs7NEJBSUEsS0FBQSxRQUFBO2dDQUNBLGFBQUEsUUFBQTtnQ0FDQSxJQUFBLFVBQUE7Ozs0QkFHQSxJQUFBLGNBQUEsV0FBQSxZQUFBLFdBQUE7Z0NBQ0EsYUFBQSxXQUFBOzs7OzRCQUlBLElBQUEsY0FBQSxJQUFBOzs7Z0NBR0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7O29DQUVBLElBQUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxLQUFBOzs7b0NBR0EsSUFBQSxDQUFBLE9BQUEsYUFBQSxFQUFBLEtBQUEsU0FBQSxjQUFBLEVBQUEsS0FBQSxjQUFBOzt3Q0FFQTs7Ozs7Ozt3QkFPQSxTQUFBLFdBQUE7NEJBQ0EsS0FBQSxPQUFBLEtBQUE7NEJBQ0EsR0FBQSxRQUFBO2dDQUNBLE9BQUE7Ozs7OztvQkFNQSxJQUFBLGFBQUE7d0JBQ0EsVUFBQSxHQUFBLGNBQUEsV0FBQTs0QkFDQSxXQUFBOzs7OztvQkFLQSxVQUFBLEdBQUEsU0FBQTs7O29CQUdBLE9BQUEsSUFBQSxZQUFBLFdBQUE7d0JBQ0EsSUFBQSxhQUFBOzRCQUNBLFVBQUEsSUFBQSxjQUFBOzs7d0JBR0EsVUFBQSxJQUFBLFNBQUE7Ozs7Ozs7b0JBT0EsU0FBQSxZQUFBOzt3QkFFQSxPQUFBLGtCQUFBLFVBQUEsVUFBQTtxQkFDQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLG1CQUFBO0NBQ0EsVUFBQSxhQUFBLFVBQUE7Q0FDQTtDQUNBLE1BQUE7RUFDQSxVQUFBLEtBQUEsT0FBQSxNQUFBLFNBQUE7RUFDQSxrREFBQSxTQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7R0FDQSxJQUFBLFNBQUEsT0FBQSxTQUFBO0dBQ0EsS0FBQSxXQUFBLFNBQUEsTUFBQSxHQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsY0FBQSxDQUFBLEtBQUEsSUFBQTtJQUNBLEtBQUEsV0FBQSxDQUFBLENBQUEsS0FBQTtJQUNBLE9BQUEsS0FBQTtJQUNBLFNBQUEsVUFBQTtLQUNBLEdBQUEsS0FBQSxTQUFBO01BQ0EsSUFBQSxXQUFBLFNBQUEsTUFBQTtPQUNBLElBQUEsV0FBQTtRQUNBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBOzs7O01BSUEsUUFBQSxRQUFBLFNBQUEsZUFBQSxLQUFBO09BQ0EsS0FBQSxVQUFBLFNBQUEsS0FBQTtPQUNBLElBQUEsU0FBQSxJQUFBLGlCQUFBLElBQUE7T0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsT0FBQSxNQUFBLFFBQUEsS0FBQTtRQUNBLFNBQUEsT0FBQSxNQUFBOzs7VUFHQTtNQUNBLFFBQUEsUUFBQSxTQUFBLGVBQUEsS0FBQTtPQUNBLEtBQUEsVUFBQSxTQUFBLEtBQUE7T0FDQSxJQUFBLFNBQUEsSUFBQSxpQkFBQSxJQUFBO09BQ0EsSUFBQSxXQUFBO1FBQ0EsTUFBQSxPQUFBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBLE9BQUEsTUFBQTs7Ozs7T0FLQTs7O0VBR0EsVUFBQTs7R0FFQSxVQUFBLGtDQUFBLFNBQUEsVUFBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLE9BQUEsR0FBQTtHQUNBLEdBQUEsQ0FBQSxNQUFBLFFBQUEsTUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBLFVBQUE7SUFDQSxNQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7SUFDQSxNQUFBLE9BQUEsU0FBQSxHQUFBLEdBQUE7SUFDQTs7R0FFQTtHQUNBLFFBQUEsUUFBQSxTQUFBLEtBQUEsVUFBQTtHQUNBLE1BQUEsT0FBQSxZQUFBO0lBQ0EsT0FBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsR0FBQSxjQUFBLEtBQUE7S0FDQSxVQUFBLE9BQUE7SUFDQSxHQUFBLE1BQUEsTUFBQSxLQUFBLEdBQUEsR0FBQSxNQUFBLE9BQUEsUUFBQSxNQUFBLE1BQUEsS0FBQTtJQUNBLEdBQUEsTUFBQSxNQUFBLEtBQUEsR0FBQSxHQUFBLE1BQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxLQUFBOzs7O0lBSUEsVUFBQSxxQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUE7RUFDQSxVQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTtLQUNBLHVCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQSxRQUFBLFNBQUEsT0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLGNBQUEsVUFBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFNBQUEsT0FBQSxLQUFBLEtBQUE7SUFDQSxHQUFBLE9BQUEsT0FBQSxVQUFBLFlBQUEsT0FBQTs7R0FFQSxPQUFBLFFBQUEsU0FBQSxFQUFBO0lBQ0EsR0FBQSxFQUFBLFNBQUEsR0FBQTtLQUNBLEdBQUEsT0FBQSxRQUFBO01BQ0EsT0FBQSxLQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7O0tBRUEsT0FBQSxVQUFBOzs7TUFHQSxhQUFBOztLQUVBLFVBQUEsNEJBQUEsU0FBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxLQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxRQUFBO0tBQ0EsYUFBQTs7SUFFQSxVQUFBLGdDQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxPQUFBO0dBQ0EsS0FBQTtLQUNBLGFBQUE7OztBQUdBLE9BQUEsVUFBQSxPQUFBLFNBQUEsUUFBQSxhQUFBO0lBQ0EsSUFBQSxTQUFBO0lBQ0EsT0FBQSxPQUFBLE1BQUEsUUFBQSxLQUFBOztBQUVBLFFBQUEsT0FBQSxnQkFBQTtDQUNBLE9BQUEsU0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQSxJQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsT0FBQTtFQUNBLElBQUEsSUFBQSxNQUFBLENBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsTUFBQSxJQUFBLE1BQUEsS0FBQTtFQUNBLEtBQUEsSUFBQSxJQUFBLElBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0dBQ0EsR0FBQSxDQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsR0FBQTs7RUFFQSxPQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsWUFBQSxXQUFBO0VBQ0EsSUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxJQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLFFBQUEsS0FBQTtJQUNBLEdBQUEsV0FBQSxHQUFBLE9BQUEsSUFBQSxHQUFBLElBQUE7S0FDQSxJQUFBLE9BQUEsR0FBQTtLQUNBOzs7O0VBSUEsT0FBQTs7R0FFQSxPQUFBLGFBQUEsVUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLElBQUE7RUFDQSxHQUFBLENBQUEsS0FBQSxPQUFBLElBQUE7RUFDQSxJQUFBLFlBQUEsSUFBQSxXQUFBLFVBQUEsRUFBQTtFQUNBLE9BQUEsSUFBQSxLQUFBLFNBQUEsVUFBQSxJQUFBOztHQUVBLE9BQUEsV0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQTtFQUNBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsUUFBQSxNQUFBLEdBQUEsT0FBQTtPQUNBLE9BQUEsVUFBQTs7R0FFQSxPQUFBLHFCQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLE1BQUEsU0FBQSxVQUFBLE9BQUE7RUFDQSxPQUFBLElBQUEsS0FBQTtFQUNBLEdBQUEsUUFBQTtHQUNBLEtBQUEsWUFBQSxLQUFBLGdCQUFBLFNBQUE7O0VBRUEsR0FBQSxTQUFBO0dBQ0EsS0FBQSxTQUFBLEtBQUEsYUFBQSxTQUFBOztFQUVBLEdBQUEsT0FBQTtHQUNBLEtBQUEsUUFBQSxLQUFBLFlBQUEsU0FBQTs7RUFFQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7O0lBRUEsT0FBQSwyQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUEsU0FBQSxLQUFBO0VBQ0EsT0FBQSxJQUFBLEtBQUE7RUFDQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFNBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxRQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7OztBQUdBLFFBQUEsT0FBQSxjQUFBO0NBQ0EsUUFBQSxvQ0FBQSxTQUFBLFVBQUEsV0FBQTtDQUNBOzs7O0VBSUEsSUFBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsT0FBQSxHQUFBO0dBQ0EsTUFBQSxRQUFBLFVBQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEdBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxNQUFBLEdBQUE7TUFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBO01BQ0E7OztJQUdBLEdBQUEsS0FBQSxPQUFBLFVBQUEsRUFBQTtLQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxZQUFBOztJQUVBLEdBQUEsTUFBQSxJQUFBLE1BQUE7SUFDQSxHQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLE9BQUEsUUFBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLE1BQUEsR0FBQTtLQUNBLEtBQUEsT0FBQSxHQUFBLFFBQUEsTUFBQTtLQUNBLE1BQUEsUUFBQSxLQUFBLE9BQUE7S0FDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTtNQUNBLE1BQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTs7S0FFQTs7OztFQUlBLEtBQUEsT0FBQSxTQUFBLElBQUE7R0FDQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsZUFBQSxDQUFBLElBQUE7SUFDQSxPQUFBLFFBQUEsS0FBQTtHQUNBLEdBQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxLQUFBLEtBQUE7R0FDQSxJQUFBLFFBQUEsY0FBQSxJQUFBLEdBQUE7R0FDQSxHQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7UUFDQSxHQUFBLElBQUEsWUFBQTtJQUNBLFNBQUE7SUFDQSxTQUFBLElBQUEsSUFBQSxZQUFBO0lBQ0EsU0FBQTs7R0FFQSxTQUFBO0dBQ0EsS0FBQSxPQUFBLEtBQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7R0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtHQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOzs7OztJQUtBLFVBQUEsbUJBQUEsU0FBQSxPQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLFlBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtLQUNBLE1BQUEsTUFBQSxZQUFBLGFBQUE7O0lBRUEsV0FBQSxrQ0FBQSxTQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsU0FBQSxVQUFBO0VBQ0EsR0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLFFBQUEsT0FBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBOzs7RUFHQSxHQUFBLE9BQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsT0FBQSxRQUFBLE1BQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLGNBQUEsSUFBQSxRQUFBLHlDQUFBLFNBQUEsT0FBQSxVQUFBLE9BQUE7Ozs7Ozs7Ozs7RUFVQSxJQUFBLE9BQUE7Ozs7RUFJQSxLQUFBLFNBQUEsU0FBQSxNQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUEsT0FBQSxNQUFBLFlBQUEsR0FBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsU0FBQSxNQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxHQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsV0FBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBOztJQUVBLE9BQUEsS0FBQSxRQUFBOztHQUVBLEtBQUEsUUFBQSxRQUFBO0dBQ0EsS0FBQSxRQUFBLFFBQUE7R0FDQSxLQUFBLFNBQUEsUUFBQSxPQUFBLFFBQUE7R0FDQSxHQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxLQUFBLE1BQUEsUUFBQSxXQUFBO01BQ0EsS0FBQSxNQUFBLE9BQUE7T0FDQSxPQUFBLEtBQUEsTUFBQTs7Ozs7R0FLQSxHQUFBLEtBQUEsT0FBQTtJQUNBLEdBQUEsT0FBQSxLQUFBLFVBQUEsU0FBQTtLQUNBLEtBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTs7SUFFQSxHQUFBLE1BQUEsUUFBQSxLQUFBLFFBQUE7S0FDQSxJQUFBLE1BQUEsS0FBQTtLQUNBLEtBQUEsU0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxJQUFBLE1BQUEsU0FBQTtPQUNBLEtBQUEsT0FBQSxJQUFBLE1BQUE7WUFDQTtPQUNBLElBQUEsSUFBQSxPQUFBLElBQUEsR0FBQTtRQUNBLEtBQUEsT0FBQSxPQUFBLElBQUEsR0FBQTs7Ozs7SUFLQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsS0FBQSxPQUFBLFFBQUEsVUFBQTtNQUNBLEdBQUEsS0FBQSxPQUFBLEtBQUE7T0FDQSxLQUFBLE9BQUEsT0FBQTtRQUNBLE9BQUEsU0FBQSxJQUFBO1NBQ0EsT0FBQSxJQUFBOzs7V0FHQTtPQUNBLE9BQUEsS0FBQSxPQUFBO09BQ0E7OztLQUdBLEdBQUEsT0FBQSxLQUFBLE9BQUEsUUFBQSxTQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7S0FFQSxHQUFBLE9BQUEsS0FBQSxPQUFBLEtBQUEsU0FBQSxXQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7OztHQUlBLE1BQUEsSUFBQSxVQUFBLE9BQUEsUUFBQSxLQUFBLFNBQUEsTUFBQTtJQUNBLElBQUEsS0FBQSxNQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsS0FBQSxRQUFBLEtBQUE7TUFDQSxLQUFBLE1BQUEsS0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxNQUFBO01BQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxNQUFBLElBQUEsS0FBQTs7SUFFQSxLQUFBLFNBQUEsT0FBQTtJQUNBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7O0dBR0EsT0FBQSxLQUFBLFFBQUE7O0VBRUEsS0FBQSxZQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxJQUFBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsT0FBQSxLQUFBLFVBQUEsVUFBQSxLQUFBLFNBQUEsS0FBQSxPQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEtBQUEsS0FBQSxPQUFBLE1BQUEsSUFBQSxLQUFBLE9BQUE7O0lBRUEsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLGlCQUFBLEtBQUEsUUFBQSxLQUFBO0tBQ0EsS0FBQSxTQUFBLE1BQUE7S0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLE1BQUEsWUFBQTtNQUNBLEdBQUEsS0FBQTtZQUNBLElBQUEsT0FBQSxNQUFBLFlBQUE7TUFDQSxHQUFBOzs7O0VBSUEsS0FBQSxlQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxZQUFBO0lBQ0EsS0FBQTtJQUNBLE9BQUE7O0dBRUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUE7SUFDQSxJQUFBLE9BQUEsS0FBQSxVQUFBLFVBQUEsS0FBQSxTQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsT0FBQSxRQUFBLEtBQUE7S0FDQSxLQUFBLEtBQUEsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOztJQUVBLE1BQUE7O0dBRUEsTUFBQSxLQUFBLFVBQUEsT0FBQSxrQkFBQSxNQUFBO0dBQ0EsS0FBQSxTQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBOzs7O0VBSUEsS0FBQSxTQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLENBQUEsS0FBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFlBQUEsTUFBQSxLQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxRQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTtNQUNBLElBQUEsS0FBQSxRQUFBLE1BQUEsR0FBQSxPQUFBLElBQUEsS0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLE9BQUEsR0FBQTtPQUNBOzs7S0FHQSxPQUFBLEtBQUEsUUFBQSxNQUFBLElBQUE7S0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7TUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO09BQ0EsSUFBQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxPQUFBLEdBQUEsS0FBQSxJQUFBLEtBQUE7U0FDQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxLQUFBO1VBQ0EsS0FBQSxRQUFBLE1BQUEsS0FBQSxPQUFBLE9BQUEsR0FBQTs7Ozs7O0tBTUEsR0FBQSxLQUFBLE9BQUEsTUFBQSxNQUFBO01BQ0EsSUFBQSxJQUFBLE9BQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtPQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLEtBQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxLQUFBLEdBQUEsT0FBQSxJQUFBLEtBQUE7U0FDQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsR0FBQTtTQUNBOzs7Ozs7SUFNQSxJQUFBLFFBQUEsT0FBQSxNQUFBLFlBQUE7S0FDQSxHQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQTs7OztFQUlBLEtBQUEsTUFBQSxTQUFBLElBQUE7R0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0dBQ0EsTUFBQSxJQUFBLGNBQUEsS0FBQSxTQUFBLE1BQUE7SUFDQSxHQUFBLEtBQUE7OztFQUdBLEtBQUEsUUFBQSxTQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsS0FBQSxPQUFBO0dBQ0EsR0FBQSxNQUFBLFFBQUEsTUFBQTtVQUNBLE9BQUEsS0FBQTtlQUNBLEdBQUEsT0FBQSxRQUFBLFNBQUE7VUFDQSxHQUFBLEtBQUEsS0FBQSxPQUFBLENBQUEsS0FBQTtVQUNBLElBQUEsUUFBQTtVQUNBLElBQUEsSUFBQSxPQUFBLEtBQUE7V0FDQSxHQUFBLEtBQUEsTUFBQSxNQUFBLEtBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTs7VUFFQSxPQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsRUFBQSxHQUFBO0lBQ0EsSUFBQSxLQUFBLElBQUEsS0FBQSxLQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7RUFFQSxLQUFBLGFBQUEsU0FBQSxLQUFBLElBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxNQUFBLGNBQUEsT0FBQSxPQUFBLFVBQUE7SUFDQSxTQUFBLE9BQUEsSUFBQTtJQUNBLElBQUEsZ0JBQUEsU0FBQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsV0FBQSxLQUFBLFdBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLE1BQUE7R0FDQSxJQUFBLEtBQUEsV0FBQSxPQUFBO0lBQ0EsUUFBQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsTUFBQSxRQUFBLFFBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUEsTUFBQSxJQUFBOztLQUVBO1dBQ0EsSUFBQSxNQUFBLFFBQUEsT0FBQSxDQUFBLEdBQUE7S0FDQSxRQUFBLE1BQUEsTUFBQTtLQUNBLElBQUEsTUFBQSxNQUFBO0tBQ0EsSUFBQSxPQUFBLElBQUEsUUFBQSxVQUFBO0tBQ0EsT0FBQSxTQUFBLElBQUEsTUFBQSxNQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE1BQUEsUUFBQSxJQUFBLFNBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO01BQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUEsS0FBQTtPQUNBLElBQUEsT0FBQSxLQUFBLEtBQUEsUUFBQSxNQUFBLElBQUEsT0FBQTthQUNBO09BQ0EsSUFBQSxPQUFBLE9BQUEsR0FBQTs7O0tBR0E7V0FDQSxJQUFBLE9BQUEsSUFBQSxVQUFBLFVBQUE7S0FDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxXQUFBO1dBQ0E7VUFDQTtJQUNBLFNBQUEsV0FBQTtLQUNBLFNBQUEsS0FBQSxPQUFBO09BQ0E7O0dBRUEsUUFBQSxJQUFBLEtBQUEsUUFBQTs7RUFFQSxJQUFBLEtBQUEsS0FBQSxLQUFBLFNBQUEsT0FBQSxJQUFBO0dBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtJQUNBLFFBQUEsTUFBQSxNQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsS0FBQTtJQUNBLElBQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLFdBQUE7TUFDQSxHQUFBLE9BQUE7UUFDQTs7O0dBR0E7Ozs7Ozs7O0VBUUEsS0FBQSxRQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxDQUFBLE1BQUEsUUFBQSxNQUFBLEdBQUE7UUFDQSxHQUFBOztFQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUEsTUFBQSxRQUFBLE1BQUE7SUFDQSxNQUFBOztHQUVBLEdBQUE7O0VBRUEsS0FBQSxTQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxJQUFBLEtBQUE7O0VBRUEsS0FBQSxXQUFBLFNBQUEsS0FBQSxHQUFBO0dBQ0EsR0FBQSxPQUFBLE9BQUEsU0FBQTtJQUNBLE1BQUE7O0dBRUEsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLGNBQUEsU0FBQSxLQUFBLEdBQUEsRUFBQSxHQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsS0FBQSxJQUFBLElBQUE7R0FDQSxPQUFBLElBQUEsS0FBQSxTQUFBLElBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQSxJQUFBOzs7OztFQUtBLElBQUEsVUFBQSxTQUFBLEtBQUEsT0FBQSxLQUFBLE1BQUE7R0FDQSxJQUFBLE1BQUEsUUFBQSxPQUFBLENBQUEsR0FBQTtJQUNBLFFBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLElBQUEsU0FBQSxPQUFBLElBQUEsUUFBQSxZQUFBLE1BQUEsUUFBQSxJQUFBO0tBQ0E7SUFDQSxJQUFBLENBQUEsSUFBQSxNQUFBLElBQUEsT0FBQTtJQUNBLE9BQUEsUUFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLE1BQUEsS0FBQTs7R0FFQSxJQUFBLE9BQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxJQUFBLFFBQUEsU0FBQSxVQUFBO0tBQ0EsSUFBQSxTQUFBO09BQ0E7OztFQUdBLElBQUEsT0FBQSxTQUFBLE1BQUEsS0FBQTtHQUNBLEdBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxNQUFBO0dBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxTQUFBO0lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQSxTQUFBLE1BQUEsU0FBQTtLQUNBLFFBQUEsS0FBQSxLQUFBLEtBQUEsU0FBQSxNQUFBLFFBQUEsTUFBQTs7O0dBR0EsR0FBQSxLQUFBLE9BQUEsTUFBQSxTQUFBO0lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsR0FBQSxNQUFBLFFBQUEsR0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsRUFBQSxHQUFBLFNBQUEsRUFBQSxHQUFBLEtBQUE7T0FDQSxTQUFBLEtBQUEsRUFBQSxHQUFBLE9BQUEsRUFBQSxHQUFBOzs7VUFHQSxHQUFBLE9BQUEsS0FBQSxZQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUE7S0FDQSxTQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7OztHQUdBLEtBQUEsUUFBQSxNQUFBLEtBQUE7R0FDQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUE7R0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO0tBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxVQUFBLGNBQUEsRUFBQSxPQUFBLE1BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxTQUFBLGNBQUEsQ0FBQSxFQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsQ0FBQSxLQUFBLFFBQUEsTUFBQSxLQUFBO01BQ0EsS0FBQSxRQUFBLE1BQUEsT0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxNQUFBO01BQ0EsR0FBQSxDQUFBLE9BQUE7TUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsUUFBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsU0FBQTs7TUFFQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsS0FBQTtNQUNBLEdBQUEsT0FBQSxFQUFBLFFBQUEsV0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxLQUFBLEVBQUE7OztLQUdBLElBQUEsRUFBQSxNQUFBLEtBQUEsU0FBQSxNQUFBO01BQ0EsSUFBQTs7OztHQUlBLEdBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsT0FBQSxNQUFBLE1BQUE7S0FDQSxJQUFBLFFBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFVBQUEsY0FBQSxNQUFBLE9BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsY0FBQSxDQUFBLE1BQUEsTUFBQSxNQUFBO0tBQ0EsR0FBQSxDQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUE7TUFDQSxLQUFBLFFBQUEsTUFBQSxPQUFBOztNQUVBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFFBQUEsV0FBQTtNQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQSxNQUFBOzs7OztFQUtBLElBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxHQUFBO0dBQ0EsTUFBQSxJQUFBLFVBQUEsT0FBQSxRQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxLQUFBLFFBQUEsS0FBQTtNQUNBLEtBQUEsTUFBQSxLQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLE1BQUE7TUFDQSxHQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsTUFBQSxJQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBOztJQUVBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsY0FBQTtLQUNBLFFBQUEsb0NBQUEsU0FBQSxVQUFBLFlBQUE7UUFDQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLE9BQUEsU0FBQSxNQUFBLFFBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxXQUFBLENBQUEsT0FBQSxlQUFBLENBQUEsT0FBQTtnQkFDQSxPQUFBLFFBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSw2Q0FBQSxDQUFBLEtBQUEsVUFBQSxTQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUEsWUFBQSxDQUFBLEtBQUEsVUFBQSxPQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxTQUFBLE9BQUE7aUJBQ0EsSUFBQSxPQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsT0FBQSxjQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLElBQUEsT0FBQSxRQUFBLFFBQUEsVUFBQSxLQUFBLFFBQUEsR0FBQTtZQUNBLEtBQUEsT0FBQSxTQUFBLFFBQUEsUUFBQSxRQUFBO1lBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLFNBQUE7O1FBRUEsVUFBQSxpQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxVQUFBO1lBQ0EsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxNQUFBOztnQkFFQSxPQUFBLE9BQUEsU0FBQSxPQUFBOztvQkFFQSxNQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUEsUUFBQTs7OztZQUlBLGFBQUE7O1FBRUEsVUFBQSxtQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsTUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxRQUFBLE9BQUEsT0FBQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7d0JBQ0EsUUFBQSxJQUFBO3dCQUNBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE1BQUEsT0FBQTs7d0JBRUEsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsY0FBQSxNQUFBLE9BQUEsS0FBQSxjQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBOzBCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE1BQUEsT0FBQSxjQUFBLE1BQUEsT0FBQSxLQUFBLGNBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O3dCQUVBO29CQUNBO3dCQUNBLE9BQUEsS0FBQSxRQUFBOztnQkFFQSxPQUFBLENBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQSxLQUFBOztnQkFFQSxLQUFBLFVBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE9BQUEsS0FBQTs7b0JBRUEsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsZ0JBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxnQkFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsUUFBQSxTQUFBLGdCQUFBLGVBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxlQUFBLE9BQUEsS0FBQTs7OztvQkFJQSxRQUFBLElBQUE7b0JBQ0EsUUFBQSxJQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxRQUFBLElBQUE7OztvQkFHQSxJQUFBLFFBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFFBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLEtBQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsSUFBQSxPQUFBO3dCQUNBLE9BQUEsT0FBQSxNQUFBOzJCQUNBLElBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLE1BQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsT0FBQSxPQUFBLE1BQUE7b0JBQ0EsS0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBLFFBQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLFdBQUE7O0FBRUEsUUFBQSxPQUFBLGlCQUFBLElBQUEsK0JBQUEsU0FBQSxZQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7Q0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsNEJBQUE7SUFDQSxRQUFBLFVBQUEsVUFBQTtDQUNBO0NBQ0EsR0FBQSxPQUFBLE1BQUEsVUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBLE9BQUEsU0FBQTtDQUNBLElBQUEsU0FBQSxHQUFBLFFBQUE7Q0FDQSxPQUFBO0dBQ0EsUUFBQSxxQkFBQSxTQUFBLFNBQUE7Q0FDQTtDQUNBLElBQUEsT0FBQTtDQUNBLEtBQUEsTUFBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsV0FBQTtHQUNBLFNBQUEsVUFBQTtJQUNBLEtBQUEsSUFBQSxNQUFBO01BQ0E7T0FDQTtHQUNBLEtBQUEsU0FBQSxNQUFBOzs7SUFHQSxhQUFBLFVBQUEsTUFBQTtDQUNBO0NBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxTQUFBLFVBQUEsR0FBQTtFQUNBLEtBQUEsTUFBQSxFQUFBOztJQUVBLFFBQUEscUJBQUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBO0NBQ0EsSUFBQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLE9BQUE7RUFDQSxhQUFBO0VBQ0EsT0FBQTtFQUNBLFNBQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLE9BQUE7RUFDQSxlQUFBO0VBQ0EsYUFBQTtFQUNBLFVBQUE7RUFDQSxXQUFBO0VBQ0EsYUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLFVBQUE7RUFDQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsbUJBQUE7RUFDQSxvQkFBQTtFQUNBLGNBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLE9BQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLE9BQUE7RUFDQSxPQUFBO0VBQ0EsWUFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0VBQ0EsY0FBQTtFQUNBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOztDQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxRQUFBLEtBQUE7R0FDQSxHQUFBLElBQUEsR0FBQSxPQUFBLE1BQUEsU0FBQSxJQUFBLEdBQUE7OztDQUdBLEtBQUEsS0FBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxNQUFBLFlBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUEsT0FBQSxDQUFBO0VBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxLQUFBO0dBQ0EsR0FBQSxPQUFBLE1BQUEsS0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLEtBQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUE7Ozs7O0lBS0EsUUFBQSxPQUFBLFVBQUE7Q0FDQTtDQUNBLEtBQUEsZ0JBQUEsU0FBQSxNQUFBLFNBQUE7RUFDQSxJQUFBLElBQUEsSUFBQTtFQUNBLEVBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxTQUFBLEVBQUEsT0FBQTs7RUFFQSxFQUFBLGNBQUE7O0NBRUEsS0FBQSxhQUFBLFNBQUEsTUFBQSxTQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLFFBQUEsSUFBQTtFQUNBLEtBQUEsUUFBQSxLQUFBLFNBQUE7RUFDQSxLQUFBLFNBQUEsS0FBQSxVQUFBO0VBQ0EsR0FBQSxLQUFBLEtBQUEsTUFBQSxnQkFBQSxLQUFBLEtBQUEsTUFBQTtHQUNBLE9BQUEsUUFBQSxJQUFBO0VBQ0EsSUFBQSxTQUFBLElBQUE7RUFDQSxPQUFBLFNBQUEsVUFBQSxXQUFBO0dBQ0EsSUFBQSxnQkFBQSxTQUFBLGNBQUE7R0FDQSxJQUFBLGVBQUEsU0FBQSxjQUFBO0dBQ0EsYUFBQSxTQUFBLFdBQUE7SUFDQSxJQUFBLFlBQUEsS0FBQSxRQUFBLEtBQUE7SUFDQSxJQUFBLFdBQUEsYUFBQSxRQUFBLGFBQUE7SUFDQSxJQUFBLFdBQUEsV0FBQTtLQUNBLFFBQUEsS0FBQTtLQUNBLFNBQUEsUUFBQTtXQUNBO0tBQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxTQUFBOztJQUVBLGNBQUEsUUFBQTtJQUNBLGNBQUEsU0FBQTtJQUNBLElBQUEsVUFBQSxjQUFBLFdBQUE7SUFDQSxRQUFBLFVBQUEsY0FBQSxHQUFBLElBQUEsT0FBQTtJQUNBLFNBQUEsY0FBQSxVQUFBLGFBQUE7O0dBRUEsYUFBQSxNQUFBLFVBQUEsT0FBQTs7RUFFQSxPQUFBLGNBQUEsS0FBQTs7R0FFQSxRQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsS0FBQSxNQUFBLFNBQUEsSUFBQTtFQUNBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsSUFBQSxJQUFBLE9BQUEsSUFBQTtHQUNBLEdBQUEsSUFBQSxNQUFBLE9BQUEsU0FBQSxNQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Q0FJQSxLQUFBLE1BQUEsVUFBQTtFQUNBLElBQUEsT0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUE7RUFDQSxPQUFBLEtBQUEsUUFBQSxLQUFBLElBQUEsTUFBQTtFQUNBLEtBQUE7RUFDQSxJQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7R0FDQSxLQUFBLEtBQUEsS0FBQSxHQUFBLE1BQUE7R0FDQSxFQUFBLEtBQUEsR0FBQSxNQUFBLEtBQUEsR0FBQTs7RUFFQSxPQUFBOzs7QUFHQSxRQUFBLE9BQUEsZ0JBQUE7S0FDQSxRQUFBLG1DQUFBLFNBQUEsVUFBQSxZQUFBO1FBQ0E7Ozs7UUFJQSxJQUFBLE9BQUE7UUFDQSxLQUFBLFdBQUE7UUFDQSxLQUFBLFFBQUEsU0FBQSxJQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7Z0JBQ0EsSUFBQSxLQUFBLFNBQUEsR0FBQSxNQUFBLElBQUE7b0JBQ0EsS0FBQSxTQUFBLEdBQUEsR0FBQTtvQkFDQSxLQUFBLFNBQUEsT0FBQSxHQUFBO29CQUNBOzs7OztRQUtBLEtBQUEsT0FBQSxTQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBO1lBQ0EsSUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLEtBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxJQUFBLEtBQUE7WUFDQSxJQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7aUJBQ0EsSUFBQSxJQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsSUFBQSxjQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLFNBQUE7O2FBRUEsUUFBQSxJQUFBLElBQUE7bUJBQ0E7YUFDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7SUFDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtJQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOztZQUVBLE9BQUEsSUFBQTs7UUFFQSxVQUFBLGlCQUFBLFNBQUEsTUFBQTtRQUNBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBOztZQUVBLE1BQUEsU0FBQSxPQUFBLElBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsU0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxRQUFBLFNBQUEsR0FBQSxNQUFBLE1BQUEsSUFBQTt3QkFDQSxRQUFBLFNBQUEsR0FBQSxLQUFBOzs7O1lBSUEsYUFBQTs7O0FBR0EsUUFBQSxPQUFBLDBCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsMEJBQUE7O0FBRUEsUUFBQSxPQUFBLDhCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsOEJBQUE7O0FBRUEsUUFBQSxPQUFBLHlCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEseUJBQUE7O0FBRUEsUUFBQSxPQUFBLDZCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsNkJBQUE7O0FBRUEsUUFBQSxPQUFBLG1CQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsbUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHVCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsdUJBQUE7SUFDQSIsImZpbGUiOiJ3Y29tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoXCJ3Y29tXCIsIFtcImFuZ3VsYXItY2xpY2stb3V0c2lkZVwiLCBcIndjb21fZGlyZWN0aXZlc1wiLCBcIndjb21fZmlsdGVyc1wiLCBcIndjb21fbW9kYWxcIiwgXCJ3Y29tX21vbmdvXCIsIFwid2NvbV9wb3B1cFwiLCBcIndjb21fc2RcIiwgXCJ3Y29tX3NlcnZpY2VzXCIsIFwid2NvbV9zcGlubmVyXCIsIFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBcIndjb21fd21vZGFlcmF0b3Jzdmlldy5odG1sXCIsIFwid2NvbV93bW9kZXJhdG9ycy5odG1sXCIsIFwid2NvbV93bW9kZXJhdG9yc3ZpZXcuaHRtbFwiLCBcIndjb21fd3RhZ3MuaHRtbFwiLCBcIndtb2RhbF9tb2RhbC5odG1sXCIsIFwid21vZGFsX3BvcHVwLmh0bWxcIiwgXCJ3bW9kYWxfc3Bpbm5lci5odG1sXCJdKTtcbi8qZ2xvYmFsIGFuZ3VsYXIsIG5hdmlnYXRvciovXHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgYW5ndWxhclxyXG4gICAgICAgIC5tb2R1bGUoJ2FuZ3VsYXItY2xpY2stb3V0c2lkZScsIFtdKVxyXG4gICAgICAgIC5kaXJlY3RpdmUoJ2NsaWNrT3V0c2lkZScsIFtcclxuICAgICAgICAgICAgJyRkb2N1bWVudCcsICckcGFyc2UnLCAnJHRpbWVvdXQnLFxyXG4gICAgICAgICAgICBjbGlja091dHNpZGVcclxuICAgICAgICBdKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICAgICAqIEBuYW1lIGFuZ3VsYXItY2xpY2stb3V0c2lkZS5kaXJlY3RpdmU6Y2xpY2tPdXRzaWRlXHJcbiAgICAgKiBAZGVzY3JpcHRpb24gRGlyZWN0aXZlIHRvIGFkZCBjbGljayBvdXRzaWRlIGNhcGFiaWxpdGllcyB0byBET00gZWxlbWVudHNcclxuICAgICAqIEByZXF1aXJlcyAkZG9jdW1lbnRcclxuICAgICAqIEByZXF1aXJlcyAkcGFyc2VcclxuICAgICAqIEByZXF1aXJlcyAkdGltZW91dFxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24gY2xpY2tPdXRzaWRlKCRkb2N1bWVudCwgJHBhcnNlLCAkdGltZW91dCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgZWxlbSwgYXR0cikge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHBvc3Rwb25lIGxpbmtpbmcgdG8gbmV4dCBkaWdlc3QgdG8gYWxsb3cgZm9yIHVuaXF1ZSBpZCBnZW5lcmF0aW9uXHJcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xhc3NMaXN0ID0gKGF0dHIub3V0c2lkZUlmTm90ICE9PSB1bmRlZmluZWQpID8gYXR0ci5vdXRzaWRlSWZOb3Quc3BsaXQoL1sgLF0rLykgOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGV2ZW50SGFuZGxlcihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgb3VyIGVsZW1lbnQgYWxyZWFkeSBoaWRkZW4gYW5kIGFib3J0IGlmIHNvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmVsZW1lbnQoZWxlbSkuaGFzQ2xhc3MoXCJuZy1oaWRlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGNsaWNrIHRhcmdldCwgbm8gcG9pbnQgZ29pbmcgb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlIHx8ICFlLnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIGF2YWlsYWJsZSBlbGVtZW50cywgbG9va2luZyBmb3IgY2xhc3NlcyBpbiB0aGUgY2xhc3MgbGlzdCB0aGF0IG1pZ2h0IG1hdGNoIGFuZCBzbyB3aWxsIGVhdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGVsZW1lbnQgPSBlLnRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGVsZW1lbnQgaXMgdGhlIHNhbWUgZWxlbWVudCB0aGUgZGlyZWN0aXZlIGlzIGF0dGFjaGVkIHRvIGFuZCBleGl0IGlmIHNvIChwcm9wcyBAQ29zdGljYVB1bnRhcnUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gZWxlbVswXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3cgd2UgaGF2ZSBkb25lIHRoZSBpbml0aWFsIGNoZWNrcywgc3RhcnQgZ2F0aGVyaW5nIGlkJ3MgYW5kIGNsYXNzZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gZWxlbWVudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzID0gZWxlbWVudC5jbGFzc05hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGNsYXNzTGlzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW53cmFwIFNWR0FuaW1hdGVkU3RyaW5nIGNsYXNzZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc05hbWVzICYmIGNsYXNzTmFtZXMuYmFzZVZhbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzTmFtZXMuYmFzZVZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbm8gY2xhc3MgbmFtZXMgb24gdGhlIGVsZW1lbnQgY2xpY2tlZCwgc2tpcCB0aGUgY2hlY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc05hbWVzIHx8IGlkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgZWxlbWVudHMgaWQncyBhbmQgY2xhc3NuYW1lcyBsb29raW5nIGZvciBleGNlcHRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3ByZXBhcmUgcmVnZXggZm9yIGNsYXNzIHdvcmQgbWF0Y2hpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IG5ldyBSZWdFeHAoJ1xcXFxiJyArIGNsYXNzTGlzdFtpXSArICdcXFxcYicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGV4YWN0IG1hdGNoZXMgb24gaWQncyBvciBjbGFzc2VzLCBidXQgb25seSBpZiB0aGV5IGV4aXN0IGluIHRoZSBmaXJzdCBwbGFjZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGlkICE9PSB1bmRlZmluZWQgJiYgci50ZXN0KGlkKSkgfHwgKGNsYXNzTmFtZXMgJiYgci50ZXN0KGNsYXNzTmFtZXMpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm93IGxldCdzIGV4aXQgb3V0IGFzIGl0IGlzIGFuIGVsZW1lbnQgdGhhdCBoYXMgYmVlbiBkZWZpbmVkIGFzIGJlaW5nIGlnbm9yZWQgZm9yIGNsaWNraW5nIG91dHNpZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgaGF2ZSBnb3QgdGhpcyBmYXIsIHRoZW4gd2UgYXJlIGdvb2QgdG8gZ28gd2l0aCBwcm9jZXNzaW5nIHRoZSBjb21tYW5kIHBhc3NlZCBpbiB2aWEgdGhlIGNsaWNrLW91dHNpZGUgYXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4gPSAkcGFyc2UoYXR0clsnY2xpY2tPdXRzaWRlJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4oJHNjb3BlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBkZXZpY2VzIGhhcyBhIHRvdWNoc2NyZWVuLCBsaXN0ZW4gZm9yIHRoaXMgZXZlbnRcclxuICAgICAgICAgICAgICAgICAgICBpZiAoX2hhc1RvdWNoKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9uKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGV2ZW50SGFuZGxlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBzdGlsbCBsaXN0ZW4gZm9yIHRoZSBjbGljayBldmVudCBldmVuIGlmIHRoZXJlIGlzIHRvdWNoIHRvIGNhdGVyIGZvciB0b3VjaHNjcmVlbiBsYXB0b3BzXHJcbiAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9uKCdjbGljaycsIGV2ZW50SGFuZGxlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHdoZW4gdGhlIHNjb3BlIGlzIGRlc3Ryb3llZCwgY2xlYW4gdXAgdGhlIGRvY3VtZW50cyBldmVudCBoYW5kbGVycyBhcyB3ZSBkb24ndCB3YW50IGl0IGhhbmdpbmcgYXJvdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9oYXNUb3VjaCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub2ZmKCd0b3VjaHN0YXJ0JywgZXZlbnRIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9mZignY2xpY2snLCBldmVudEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gUHJpdmF0ZSBmdW5jdGlvbiB0byBhdHRlbXB0IHRvIGZpZ3VyZSBvdXQgaWYgd2UgYXJlIG9uIGEgdG91Y2ggZGV2aWNlXHJcbiAgICAgICAgICAgICAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gX2hhc1RvdWNoKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3b3JrcyBvbiBtb3N0IGJyb3dzZXJzLCBJRTEwLzExIGFuZCBTdXJmYWNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn0pKCk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fZGlyZWN0aXZlc1wiLCBbXSlcclxuLmRpcmVjdGl2ZSgncHVsbGZpbGVzJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJue1xyXG5cdFx0cmVzdHJpY3Q6ICdFJywgc2NvcGU6IHRydWUsIHJlcGxhY2U6IHRydWUsXHJcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsIGltZywgJHRpbWVvdXQsIGZpbGUpe1xyXG5cdFx0XHR2YXIgaW5wdXRzID0gJHNjb3BlLmlucHV0cyA9IFtdO1xyXG5cdFx0XHRmaWxlLmFkZERlbGF5ID0gZnVuY3Rpb24ob3B0cywgY2Ipe1xyXG5cdFx0XHRcdGlmKHR5cGVvZiBjYiAhPSAnZnVuY3Rpb24nIHx8ICFvcHRzLmlkKSByZXR1cm47XHJcblx0XHRcdFx0b3B0cy5tdWx0aXBsZSA9ICEhb3B0cy5tdWx0aXBsZTtcclxuXHRcdFx0XHRpbnB1dHMucHVzaChvcHRzKTtcclxuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0aWYob3B0cy5tdWx0aXBsZSl7XHJcblx0XHRcdFx0XHRcdHZhciBhZGRJbWFnZSA9IGZ1bmN0aW9uKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0XHRpbWcucmVzaXplVXBUbyh7XHJcblx0XHRcdFx0XHRcdFx0XHRmaWxlOiBmaWxlLFxyXG5cdFx0XHRcdFx0XHRcdFx0d2lkdGg6IG9wdHMud2lkdGh8fDE5MjAsXHJcblx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IG9wdHMuaGVpZ2h0fHwxMDgwXHJcblx0XHRcdFx0XHRcdFx0fSwgZnVuY3Rpb24oZGF0YVVybCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y2IoZGF0YVVybCwgZmlsZSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0cy5pZCkpXHJcblx0XHRcdFx0XHRcdC5iaW5kKCdjaGFuZ2UnLCBmdW5jdGlvbihldnQpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gZXZ0LmN1cnJlbnRUYXJnZXQgfHwgZXZ0LnRhcmdldDtcclxuXHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldC5maWxlcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0XHRcdFx0YWRkSW1hZ2UodGFyZ2V0LmZpbGVzW2ldKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRzLmlkKSlcclxuXHRcdFx0XHRcdFx0LmJpbmQoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2dCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSBldnQuY3VycmVudFRhcmdldCB8fCBldnQudGFyZ2V0O1xyXG5cdFx0XHRcdFx0XHRcdGltZy5yZXNpemVVcFRvKHtcclxuXHRcdFx0XHRcdFx0XHRcdGZpbGU6IHRhcmdldC5maWxlc1swXSxcclxuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBvcHRzLndpZHRofHwxOTIwLFxyXG5cdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBvcHRzLmhlaWdodHx8MTA4MFxyXG5cdFx0XHRcdFx0XHRcdH0sIGZ1bmN0aW9uKGRhdGFVcmwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGNiKGRhdGFVcmwsIHRhcmdldC5maWxlc1swXSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSwgMjUwKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdHRlbXBsYXRlOiAnPGlucHV0IG5nLXJlcGVhdD1cImkgaW4gaW5wdXRzXCIgdHlwZT1cImZpbGVcIiBuZy1oaWRlPVwidHJ1ZVwiIGlkPVwie3tpLmlkfX1cIiBtdWx0aXBsZT1cInt7aS5tdWx0aXBsZX19XCI+J1xyXG5cdH1cclxufSkuZGlyZWN0aXZlKCdlbHNpemUnLCBmdW5jdGlvbigkdGltZW91dCwgJHdpbmRvdyl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0FFJyxcclxuXHRcdHNjb3BlOiB7XHJcblx0XHRcdGVsc2l6ZTogJz0nXHJcblx0XHR9LCBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwpe1xyXG5cdFx0XHRpZighc2NvcGUuZWxzaXplKSBzY29wZS5lbHNpemU9e307XHJcblx0XHRcdHZhciByZXNpemUgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHNjb3BlLmVsc2l6ZS53aWR0aCA9IGVsWzBdLmNsaWVudFdpZHRoO1xyXG5cdFx0XHRcdHNjb3BlLmVsc2l6ZS5oZWlnaHQgPSBlbFswXS5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0JHRpbWVvdXQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNpemUoKTtcclxuXHRcdFx0YW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIHJlc2l6ZSk7XHJcblx0XHRcdHNjb3BlLiR3YXRjaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0cmV0dXJuIFtlbFswXS5jbGllbnRXaWR0aCwgZWxbMF0uY2xpZW50SGVpZ2h0XS5qb2luKCd4Jyk7XHJcblx0XHRcdH0sZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYodmFsdWUuc3BsaXQoJ3gnKVswXT4wKSBzY29wZS5lbHNpemUud2lkdGggPSB2YWx1ZS5zcGxpdCgneCcpWzBdO1xyXG5cdFx0XHRcdGlmKHZhbHVlLnNwbGl0KCd4JylbMV0+MCkgc2NvcGUuZWxzaXplLmhlaWdodCA9IHZhbHVlLnNwbGl0KCd4JylbMV07XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxufSkuZGlyZWN0aXZlKCd3dGFncycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdBRScsXHJcblx0XHRzY29wZToge1xyXG5cdFx0XHRvYmplY3Q6ICc9JyxcclxuXHRcdFx0bW9kZWw6ICdAJyxcclxuXHRcdFx0Y2hhbmdlOiAnJidcclxuXHRcdH0sIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSl7XHJcblx0XHRcdCRzY29wZS50YWdzID0gJGZpbHRlcigndG9BcnInKSgkc2NvcGUub2JqZWN0WyRzY29wZS5tb2RlbF0pO1xyXG5cdFx0XHQkc2NvcGUudXBkYXRlX3RhZ3MgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdCRzY29wZS5vYmplY3RbJHNjb3BlLm1vZGVsXSA9ICRzY29wZS50YWdzLmpvaW4oJywgJyk7XHJcblx0XHRcdFx0aWYodHlwZW9mICRzY29wZS5jaGFuZ2UgPT0gJ2Z1bmN0aW9uJykgJHNjb3BlLmNoYW5nZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCRzY29wZS5lbnRlciA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0XHRcdGlmKGUua2V5Q29kZT09MTMpe1xyXG5cdFx0XHRcdFx0aWYoJHNjb3BlLm5ld190YWcpe1xyXG5cdFx0XHRcdFx0XHQkc2NvcGUudGFncy5wdXNoKCRzY29wZS5uZXdfdGFnKTtcclxuXHRcdFx0XHRcdFx0JHNjb3BlLnVwZGF0ZV90YWdzKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQkc2NvcGUubmV3X3RhZyA9IG51bGw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9LCB0ZW1wbGF0ZVVybDogJ3djb21fd3RhZ3MuaHRtbCdcclxuXHR9XHJcbn0pLmRpcmVjdGl2ZSgnd21vZGFlcmF0b3JzJywgZnVuY3Rpb24oJGZpbHRlcil7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0FFJyxcclxuXHRcdHNjb3BlOiB7XHJcblx0XHRcdGFycjogJz0nLFxyXG5cdFx0XHR1c2VyczogJz0nLFxyXG5cdFx0XHRob2xkZXI6ICdAJyxcclxuXHRcdFx0Y2hhbmdlOiAnJidcclxuXHRcdH0sIHRlbXBsYXRlVXJsOiAnd2NvbV93bW9kYWVyYXRvcnMuaHRtbCdcclxuXHR9XHJcbn0pLmRpcmVjdGl2ZSgnd21vZGFlcmF0b3JzdmlldycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdBRScsXHJcblx0XHRzY29wZToge1xyXG5cdFx0XHRhcnI6ICc9J1xyXG5cdFx0fSwgdGVtcGxhdGVVcmw6ICd3Y29tX3dtb2RhZXJhdG9yc3ZpZXcuaHRtbCdcclxuXHR9XHJcbn0pO1xuU3RyaW5nLnByb3RvdHlwZS5yQWxsID0gZnVuY3Rpb24oc2VhcmNoLCByZXBsYWNlbWVudCkge1xyXG4gICAgdmFyIHRhcmdldCA9IHRoaXM7XHJcbiAgICByZXR1cm4gdGFyZ2V0LnNwbGl0KHNlYXJjaCkuam9pbihyZXBsYWNlbWVudCk7XHJcbn07XHJcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9maWx0ZXJzXCIsIFtdKVxyXG4uZmlsdGVyKCd0b0FycicsIGZ1bmN0aW9uKCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiBmdW5jdGlvbihzdHIsIGRpdil7XHJcblx0XHRpZighc3RyKSByZXR1cm4gW107XHJcblx0XHRzdHI9c3RyLnNwbGl0KChkaXZ8fCcsJykrJyAnKS5qb2luKCcsJyk7XHJcblx0XHR2YXIgYXJyID0gc3RyLnNwbGl0KGRpdnx8JywnKTtcclxuXHRcdGZvciAodmFyIGkgPSBhcnIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuXHRcdFx0aWYoIWFycltpXSkgYXJyLnNwbGljZShpLCAxKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBhcnI7XHJcblx0fVxyXG59KS5maWx0ZXIoJ3JBcnInLCBmdW5jdGlvbigpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4gZnVuY3Rpb24ob3JpZ2luX2FyciwgcmVtb3ZlX2Fycil7XHJcblx0XHR2YXIgYXJyID0gb3JpZ2luX2Fyci5zbGljZSgpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHJlbW92ZV9hcnIubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0XHRpZihyZW1vdmVfYXJyW2pdLl9pZCA9PSBhcnJbaV0uX2lkKXtcclxuXHRcdFx0XHRcdGFyci5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBhcnI7XHJcblx0fVxyXG59KS5maWx0ZXIoJ21vbmdvZGF0ZScsIGZ1bmN0aW9uKCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiBmdW5jdGlvbihfaWQpe1xyXG5cdFx0aWYoIV9pZCkgcmV0dXJuIG5ldyBEYXRlKCk7XHJcblx0XHR2YXIgdGltZXN0YW1wID0gX2lkLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDAsOCk7XHJcblx0XHRyZXR1cm4gbmV3IERhdGUocGFyc2VJbnQodGltZXN0YW1wLDE2KSoxMDAwKTtcclxuXHR9XHJcbn0pLmZpbHRlcignZml4bGluaycsIGZ1bmN0aW9uKCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiBmdW5jdGlvbihsaW5rKXtcclxuXHRcdGlmKCFsaW5rfHxsaW5rLmluZGV4T2YoJy8vJyk+MCkgcmV0dXJuIGxpbms7XHJcblx0XHRlbHNlIHJldHVybiAnaHR0cDovLycrbGluaztcclxuXHR9XHJcbn0pLmZpbHRlcignd2RhdGUnLCBmdW5jdGlvbigkZmlsdGVyKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKHRpbWUsIGFkZFllYXIsIGFkZE1vbnRoLCBhZGREYXkpe1xyXG5cdFx0dGltZSA9IG5ldyBEYXRlKHRpbWUpO1xyXG5cdFx0aWYoYWRkWWVhcil7XHJcblx0XHRcdHRpbWUuc2V0RnVsbFllYXIodGltZS5nZXRGdWxsWWVhcigpICsgcGFyc2VJbnQoYWRkWWVhcikpO1xyXG5cdFx0fVxyXG5cdFx0aWYoYWRkTW9udGgpe1xyXG5cdFx0XHR0aW1lLnNldE1vbnRoKHRpbWUuZ2V0TW9udGgoKSArIHBhcnNlSW50KGFkZE1vbnRoKSk7XHJcblx0XHR9XHJcblx0XHRpZihhZGREYXkpe1xyXG5cdFx0XHR0aW1lLnNldERhdGUodGltZS5nZXREYXRlKCkgKyBwYXJzZUludChhZGREYXkpKTtcclxuXHRcdH1cclxuXHRcdHZhciB0aW1lbXMgPSB0aW1lLmdldFRpbWUoKTtcclxuXHRcdHZhciBub3dtcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cdFx0dmFyIGRheW1zID0gbm93bXMgLSA4NjQwMDAwMDtcclxuXHRcdGlmKHRpbWVtcz5kYXltcyl7XHJcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ2hoOm1tIGEnKTtcclxuXHRcdH1cclxuXHRcdHZhciB5ZWFybXMgPSBub3dtcyAtICgyNjI4MDAwMDAwKjEyKTtcclxuXHRcdGlmKHRpbWVtcz55ZWFybXMpe1xyXG5cdFx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICdNTU0gZGQgaGg6bW0gYScpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAneXl5eSBNTU0gZGQgaGg6bW0gYScpO1xyXG5cdH1cclxufSkuZmlsdGVyKCdtZXNzYWdldGltZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4gZnVuY3Rpb24odGltZSl7XHJcblx0XHR0aW1lID0gbmV3IERhdGUodGltZSk7XHJcblx0XHR2YXIgdGltZW1zID0gdGltZS5nZXRUaW1lKCk7XHJcblx0XHR2YXIgbm93bXMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHRcdHZhciBtaW5hZ28gPSBub3dtcyAtIDYwMDAwO1xyXG5cdFx0aWYodGltZW1zPm1pbmFnbykgcmV0dXJuICdBIG1pbiBhZ28uJztcclxuXHRcdHZhciBkYXltcyA9IG5vd21zIC0gODY0MDAwMDA7XHJcblx0XHRpZih0aW1lbXM+ZGF5bXMpe1xyXG5cdFx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICdoaDptbSBhJyk7XHJcblx0XHR9XHJcblx0XHR2YXIgeWVhcm1zID0gbm93bXMgLSAoMjYyODAwMDAwMCoxMik7XHJcblx0XHRpZih0aW1lbXM+eWVhcm1zKXtcclxuXHRcdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAnTU1NIGRkIGhoOm1tIGEnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ3l5eXkgTU1NIGRkIGhoOm1tIGEnKTtcclxuXHR9XHJcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX21vZGFsXCIsIFtdKVxyXG4uc2VydmljZSgnbW9kYWwnLCBmdW5jdGlvbigkY29tcGlsZSwgJHJvb3RTY29wZSl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdC8qXHJcblx0Klx0TW9kYWxzXHJcblx0Ki9cclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHRcdHNlbGYubW9kYWxzID0gW107XHJcblx0XHR0aGlzLm1vZGFsX2xpbmsgPSBmdW5jdGlvbihzY29wZSwgZWwpe1xyXG5cdFx0XHRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLm1vZGFscy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0aWYoc2VsZi5tb2RhbHNbaV0uaWQ9PXNjb3BlLmlkKXtcclxuXHRcdFx0XHRcdFx0c2VsZi5tb2RhbHMuc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYoc2VsZi5tb2RhbHMubGVuZ3RoID09IDApe1xyXG5cdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ25vc2Nyb2xsJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKHNjb3BlLmNiKSBzY29wZS5jYigpO1xyXG5cdFx0XHRcdGVsLnJlbW92ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5tb2RhbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZihzZWxmLm1vZGFsc1tpXS5pZD09c2NvcGUuaWQpe1xyXG5cdFx0XHRcdFx0c2VsZi5tb2RhbHNbaV0uY2xvc2UgPSBzY29wZS5jbG9zZTtcclxuXHRcdFx0XHRcdHNjb3BlLl9kYXRhID0gc2VsZi5tb2RhbHNbaV07XHJcblx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBzZWxmLm1vZGFsc1tpXSl7XHJcblx0XHRcdFx0XHRcdHNjb3BlW2tleV0gPSBzZWxmLm1vZGFsc1tpXVtrZXldO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHR0aGlzLm9wZW4gPSBmdW5jdGlvbihvYmope1xyXG5cdFx0XHRpZighb2JqIHx8ICghb2JqLnRlbXBsYXRlVXJsICYmICFvYmoudGVtcGxhdGUpKSBcclxuXHRcdFx0XHRyZXR1cm4gY29uc29sZS53YXJuKCdQbGVhc2UgYWRkIHRlbXBsYXRlVXJsIG9yIHRlbXBsYXRlJyk7IFxyXG5cdFx0XHRpZighb2JqLmlkKSBvYmouaWQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHR2YXIgbW9kYWwgPSAnPG1vZGFsIGlkPVwiJytvYmouaWQrJ1wiPic7XHJcblx0XHRcdGlmKG9iai50ZW1wbGF0ZSkgbW9kYWwgKz0gb2JqLnRlbXBsYXRlO1xyXG5cdFx0XHRlbHNlIGlmKG9iai50ZW1wbGF0ZVVybCl7XHJcblx0XHRcdFx0bW9kYWwgKz0gJzxuZy1pbmNsdWRlIHNyYz1cIic7XHJcblx0XHRcdFx0bW9kYWwgKz0gXCInXCIrb2JqLnRlbXBsYXRlVXJsK1wiJ1wiO1xyXG5cdFx0XHRcdG1vZGFsICs9ICdcIiBuZy1jb250cm9sbGVyPVwid3BhcmVudFwiPjwvbmctaW5jbHVkZT4nO1xyXG5cdFx0XHR9XHJcblx0XHRcdG1vZGFsICs9ICc8L21vZGFsPic7XHJcblx0XHRcdHNlbGYubW9kYWxzLnB1c2gob2JqKTtcclxuXHRcdFx0dmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcclxuXHRcdFx0Ym9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KG1vZGFsKSkoJHJvb3RTY29wZSkpO1xyXG5cdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2h0bWwnKS5hZGRDbGFzcygnbm9zY3JvbGwnKTtcclxuXHRcdH1cclxuXHQvKlxyXG5cdCpcdEVuZCBvZiB3bW9kYWxcclxuXHQqL1xyXG59KS5kaXJlY3RpdmUoJ21vZGFsJywgZnVuY3Rpb24obW9kYWwpIHtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHR0cmFuc2NsdWRlOiB0cnVlLFxyXG5cdFx0c2NvcGU6IHtcclxuXHRcdFx0aWQ6ICdAJ1xyXG5cdFx0fSwgbGluazogbW9kYWwubW9kYWxfbGluaywgdGVtcGxhdGVVcmw6ICd3bW9kYWxfbW9kYWwuaHRtbCdcclxuXHR9O1xyXG59KS5jb250cm9sbGVyKCd3cGFyZW50JywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCkge1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0aWYoJHNjb3BlLiRwYXJlbnQuJHBhcmVudC5fZGF0YSl7XHJcblx0XHRcdGZvciAodmFyIGtleSBpbiAkc2NvcGUuJHBhcmVudC4kcGFyZW50Ll9kYXRhKSB7XHJcblx0XHRcdFx0JHNjb3BlW2tleV0gPSAkc2NvcGUuJHBhcmVudC4kcGFyZW50Ll9kYXRhW2tleV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmKCRzY29wZS4kcGFyZW50Ll9kYXRhKXtcclxuXHRcdFx0Zm9yICh2YXIga2V5IGluICRzY29wZS4kcGFyZW50Ll9kYXRhKSB7XHJcblx0XHRcdFx0JHNjb3BlW2tleV0gPSAkc2NvcGUuJHBhcmVudC5fZGF0YVtrZXldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSk7XHJcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX21vbmdvXCIsIFtdKS5zZXJ2aWNlKCdtb25nbycsIGZ1bmN0aW9uKCRodHRwLCAkdGltZW91dCwgc29ja2V0KXtcclxuXHQvKlxyXG5cdCpcdERhdGEgd2lsbCBiZSBzdG9yYWdlIGZvciBhbGwgaW5mb3JtYXRpb24gd2UgYXJlIHB1bGxpbmcgZnJvbSB3YXcgY3J1ZC5cclxuXHQqXHRkYXRhWydhcnInICsgcGFydF0gd2lsbCBob3N0IGFsbCBkb2NzIGZyb20gY29sbGVjdGlvbiBwYXJ0IGluIGFycmF5IGZvcm1cclxuXHQqXHRkYXRhWydvYmonICsgcGFydF0gd2lsbCBob3N0IGFsbCBkb2NzIGZyb20gY29sbGVjdGlvbiBwYXJ0IGluIG9iamVjdCBmb3JtXHJcblx0Klx0XHRhbmQgYWxsIGdyb3VwcyBjb2xsZWNpdG9ucyBwcm92aWRlZFxyXG5cdCpcdGRhdGFbJ29wdHMnICsgcGFydF0gd2lsbCBob3N0IG9wdGlvbnMgZm9yIGRvY3MgZnJvbSBjb2xsZWN0aW9uIHBhcnRcclxuXHQqXHRcdFdpbGwgYmUgaW5pdGlhbGl6ZWQgb25seSBpbnNpZGUgZ2V0XHJcblx0Klx0XHRXaWxsIGJlIHVzZWQgaW5zaWRlIHB1c2hcclxuXHQqL1xyXG5cdFx0dmFyIGRhdGEgPSB7fTtcclxuXHQvKlxyXG5cdCpcdHdhdyBjcnVkIGNvbm5lY3QgZnVuY3Rpb25zXHJcblx0Ki9cclxuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24ocGFydCwgZG9jLCBjYikge1xyXG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y2IgPSBkb2M7XHJcblx0XHRcdFx0ZG9jID0ge307XHJcblx0XHRcdH1cclxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvY3JlYXRlJywgZG9jIHx8IHt9KS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRpZiAocmVzcC5kYXRhKSB7XHJcblx0XHRcdFx0XHRwdXNoKHBhcnQsIHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIGNiKHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0Y2IoZmFsc2UpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbihwYXJ0LCBvcHRzLCBjYikge1xyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGNiID0gb3B0cztcclxuXHRcdFx0XHRvcHRzID0ge307XHJcblx0XHRcdH1cclxuXHRcdFx0aWYoZGF0YVsnbG9hZGVkJytwYXJ0XSl7XHJcblx0XHRcdFx0aWYodHlwZW9mIGNiID09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0Y2IoZGF0YVsnYXJyJyArIHBhcnRdLCBkYXRhWydvYmonICsgcGFydF0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YVsnYXJyJyArIHBhcnRdO1xyXG5cdFx0XHR9XHJcblx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XSA9IFtdO1xyXG5cdFx0XHRkYXRhWydvYmonICsgcGFydF0gPSB7fTtcclxuXHRcdFx0ZGF0YVsnb3B0cycgKyBwYXJ0XSA9IG9wdHMgPSBvcHRzIHx8IHt9O1xyXG5cdFx0XHRpZihvcHRzLnF1ZXJ5KXtcclxuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBvcHRzLnF1ZXJ5KXtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLnF1ZXJ5W2tleV0gPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRcdG9wdHMucXVlcnlba2V5XSA9IHtcclxuXHRcdFx0XHRcdFx0XHRhbGxvdzogb3B0cy5xdWVyeVtrZXldXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYob3B0cy5ncm91cHMpe1xyXG5cdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3VwcyA9PSAnc3RyaW5nJyl7XHJcblx0XHRcdFx0XHRvcHRzLmdyb3VwcyA9IG9wdHMuZ3JvdXBzLnNwbGl0KCcgJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKEFycmF5LmlzQXJyYXkob3B0cy5ncm91cHMpKXtcclxuXHRcdFx0XHRcdHZhciBhcnIgPSBvcHRzLmdyb3VwcztcclxuXHRcdFx0XHRcdG9wdHMuZ3JvdXBzID0ge307XHJcblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0XHRcdFx0aWYodHlwZW9mIGFycltpXSA9PSAnc3RyaW5nJyl7XHJcblx0XHRcdFx0XHRcdFx0b3B0cy5ncm91cHNbYXJyW2ldXSA9IHRydWU7XHJcblx0XHRcdFx0XHRcdH1lbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBhcnJbaV0pe1xyXG5cdFx0XHRcdFx0XHRcdFx0b3B0cy5ncm91cHNba2V5XSA9IGFycltpXVtrZXldO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBvcHRzLmdyb3Vwcyl7XHJcblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHNba2V5XSA9PSAnYm9vbGVhbicpe1xyXG5cdFx0XHRcdFx0XHRpZihvcHRzLmdyb3Vwc1trZXldKXtcclxuXHRcdFx0XHRcdFx0XHRvcHRzLmdyb3Vwc1trZXldID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZmllbGQ6IGZ1bmN0aW9uKGRvYyl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBkb2Nba2V5XTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBvcHRzLmdyb3Vwc1trZXldO1xyXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5ncm91cHNba2V5XSAhPSAnb2JqZWN0Jyl7XHJcblx0XHRcdFx0XHRcdGRlbGV0ZSBvcHRzLmdyb3Vwc1trZXldO1xyXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldLmZpZWxkICE9ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0XHRkZWxldGUgb3B0cy5ncm91cHNba2V5XTtcclxuXHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdCRodHRwLmdldCgnL2FwaS8nICsgcGFydCArICcvZ2V0JykudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0aWYgKHJlc3AuZGF0YSkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwLmRhdGEubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0cHVzaChwYXJ0LCByZXNwLmRhdGFbaV0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKVxyXG5cdFx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGF0YVsnbG9hZGVkJytwYXJ0XT0gdHJ1ZTtcclxuXHRcdFx0XHRpZihvcHRzLm5leHQpe1xyXG5cdFx0XHRcdFx0bmV4dChwYXJ0LCBvcHRzLm5leHQsIGNiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gZGF0YVsnYXJyJyArIHBhcnRdO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMudXBkYXRlQWxsID0gZnVuY3Rpb24ocGFydCwgZG9jLCBvcHRzLCBjYikge1xyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGNiID0gb3B0cztcclxuXHRcdFx0XHRvcHRzID0ge307XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRzICE9ICdvYmplY3QnKSBvcHRzID0ge307XHJcblx0XHRcdGlmIChvcHRzLmZpZWxkcykge1xyXG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0cy5maWVsZHMgPT0gJ3N0cmluZycpIG9wdHMuZmllbGRzID0gb3B0cy5maWVsZHMuc3BsaXQoJyAnKTtcclxuXHRcdFx0XHR2YXIgX2RvYyA9IHt9O1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0cy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdF9kb2Nbb3B0cy5maWVsZHNbaV1dID0gZG9jW29wdHMuZmllbGRzW2ldXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZG9jID0gX2RvYztcclxuXHRcdFx0fVxyXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpLycgKyBwYXJ0ICsgJy91cGRhdGUvYWxsJyArIChvcHRzLm5hbWUgfHwgJycpLCBkb2MpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0aWYgKHJlc3AuZGF0YSAmJiB0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRjYihyZXNwLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRjYihmYWxzZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy51cGRhdGVVbmlxdWUgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIG9wdHMsIGNiKSB7XHJcblx0XHRcdGlmICghb3B0cykgb3B0cyA9ICcnO1xyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGNiID0gb3B0cztcclxuXHRcdFx0XHRvcHRzID0gJyc7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRzICE9ICdvYmplY3QnKSBvcHRzID0ge307XHJcblx0XHRcdGlmIChvcHRzLmZpZWxkcykge1xyXG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0cy5maWVsZHMgPT0gJ3N0cmluZycpIG9wdHMuZmllbGRzID0gb3B0cy5maWVsZHMuc3BsaXQoJyAnKTtcclxuXHRcdFx0XHR2YXIgX2RvYyA9IHt9O1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0cy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdF9kb2Nbb3B0cy5maWVsZHNbaV1dID0gZG9jW29wdHMuZmllbGRzW2ldXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZG9jID0gX2RvYztcclxuXHRcdFx0fVxyXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpLycgKyBwYXJ0ICsgJy91bmlxdWUvZmllbGQnICsgb3B0cywgZG9jKS5cclxuXHRcdFx0dGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihyZXNwLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIG9wdHMsIGNiKSB7XHJcblx0XHRcdGlmICghb3B0cykgb3B0cyA9ICcnO1xyXG5cdFx0XHRpZiAoIWRvYykgcmV0dXJuO1xyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGNiID0gb3B0cztcclxuXHRcdFx0XHRvcHRzID0gJyc7XHJcblx0XHRcdH1cclxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvZGVsZXRlJyArIG9wdHMsIGRvYykudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0aWYgKHJlc3AuZGF0YSAmJiBBcnJheS5pc0FycmF5KGRhdGFbJ2FycicgKyBwYXJ0XSkpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsnYXJyJyArIHBhcnRdLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhWydhcnInICsgcGFydF1baV0uX2lkID09IGRvYy5faWQpIHtcclxuXHRcdFx0XHRcdFx0XHRkYXRhWydhcnInICsgcGFydF0uc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRkZWxldGUgZGF0YVsnb2JqJyArIHBhcnRdW2RvYy5faWRdO1xyXG5cdFx0XHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcclxuXHRcdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcclxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGZpZWxkIGluIGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldKXtcclxuXHRcdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSBkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0ubGVuZ3RoLTE7IGkgPj0gMCA7IGktLSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdW2ldLl9pZCA9PSBkb2MuX2lkKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdLnNwbGljZShpLCAxKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xyXG5cdFx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XHJcblx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLmxlbmd0aC0xOyBpID49IDAgOyBpLS0pIHtcclxuXHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1ba2V5XVtpXS5faWQgPT0gZG9jLl9pZCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XS5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocmVzcCAmJiB0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0Y2IocmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihmYWxzZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLl9pZCA9IGZ1bmN0aW9uKGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgY2IgIT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xyXG5cdFx0XHQkaHR0cC5nZXQoJy93YXcvbmV3SWQnKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRjYihyZXNwLmRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLnRvX2lkID0gZnVuY3Rpb24oZG9jcykge1xyXG5cdFx0XHRpZiAoIWFycikgcmV0dXJuIFtdO1xyXG5cdFx0XHRpZihBcnJheS5pc0FycmF5KGRvY3MpKXtcclxuXHQgICAgICAgIFx0ZG9jcyA9IGRvY3Muc2xpY2UoKTtcclxuXHQgICAgICAgIH1lbHNlIGlmKHR5cGVvZiBkb2NzID09ICdvYmplY3QnKXtcclxuXHQgICAgICAgIFx0aWYoZG9jcy5faWQpIHJldHVybiBbZG9jcy5faWRdO1xyXG5cdCAgICAgICAgXHR2YXIgX2RvY3MgPSBbXTtcclxuXHQgICAgICAgIFx0Zm9yKHZhciBrZXkgaW4gZG9jcyl7XHJcblx0ICAgICAgICBcdFx0aWYoZG9jc1trZXldKSBfZG9jcy5wdXNoKGRvY3Nba2V5XS5faWR8fGRvY3Nba2V5XSk7XHJcblx0ICAgICAgICBcdH1cclxuXHQgICAgICAgIFx0ZG9jcyA9IF9kb2NzO1xyXG5cdCAgICAgICAgfVxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRvY3MubGVuZ3RoOyArK2kpIHtcclxuXHRcdFx0XHRpZiAoZG9jc1tpXSkgZG9jc1tpXSA9IGRvY3NbaV0uX2lkIHx8IGRvY3NbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRvY3M7XHJcblx0XHR9XHJcblx0XHR0aGlzLmFmdGVyV2hpbGUgPSBmdW5jdGlvbihkb2MsIGNiLCB0aW1lKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZG9jID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKGRvYy51cGRhdGVUaW1lb3V0KTtcclxuXHRcdFx0XHRkb2MudXBkYXRlVGltZW91dCA9ICR0aW1lb3V0KGNiLCB0aW1lIHx8IDEwMDApO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0dmFyIHBvcHVsYXRlID0gdGhpcy5wb3B1bGF0ZSA9IGZ1bmN0aW9uKGRvYywgZmllbGQsIHBhcnQpIHtcclxuXHRcdFx0aWYgKCFkb2MgfHwgIWZpZWxkIHx8ICFwYXJ0KSByZXR1cm47XHJcblx0XHRcdGlmIChkYXRhWydsb2FkZWQnICsgcGFydF0pIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhkYXRhWydvYmonICsgcGFydF0pO1xyXG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGZpZWxkKSkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIGZpZWxkW2ldLCBwYXJ0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJy4nKSA+IC0xKSB7XHJcblx0XHRcdFx0XHRmaWVsZCA9IGZpZWxkLnNwbGl0KCcuJyk7XHJcblx0XHRcdFx0XHR2YXIgc3ViID0gZmllbGQuc2hpZnQoKTtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgZG9jW3N1Yl0gIT0gJ29iamVjdCcpIHJldHVybjtcclxuXHRcdFx0XHRcdHJldHVybiBwb3B1bGF0ZShkb2Nbc3ViXSwgZmllbGQuam9pbignLicpLCBwYXJ0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZG9jW2ZpZWxkXSkpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSBkb2NbZmllbGRdLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXVtpXV0pIHtcclxuXHRcdFx0XHRcdFx0XHRkb2NbZmllbGRdW2ldID0gZGF0YVsnb2JqJyArIHBhcnRdW2RvY1tmaWVsZF1baV1dXHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0ZG9jW2ZpZWxkXS5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBkb2NbZmllbGRdID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRkb2NbZmllbGRdID0gZGF0YVsnb2JqJyArIHBhcnRdW2RvY1tmaWVsZF1dIHx8IG51bGw7XHJcblx0XHRcdFx0fSBlbHNlIHJldHVybjtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgZmllbGQsIHBhcnQpO1xyXG5cdFx0XHRcdH0sIDI1MCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YVsnb2JqJyArIHBhcnRdKTtcclxuXHRcdH07XHJcblx0XHR2YXIgb24gPSB0aGlzLm9uID0gZnVuY3Rpb24ocGFydHMsIGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgcGFydHMgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJ0cyA9IHBhcnRzLnNwbGl0KFwiIFwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKCFkYXRhWydsb2FkZWQnICsgcGFydHNbaV1dKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdG9uKHBhcnRzLCBjYik7XHJcblx0XHRcdFx0XHR9LCAxMDApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjYigpO1xyXG5cdFx0fTtcclxuXHQvKlxyXG5cdCpcdG1vbmdvIHNvcnQgZmlsdGVyc1xyXG5cdCovXHJcblx0LypcclxuXHQqXHRtb25nbyByZXBsYWNlIGZpbHRlcnNcclxuXHQqL1xyXG5cdFx0dGhpcy5iZUFyciA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHZhbCkpIGNiKFtdKTtcclxuXHRcdFx0ZWxzZSBjYih2YWwpO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuYmVPYmogPSBmdW5jdGlvbih2YWwsIGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgdmFsICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkodmFsKSkge1xyXG5cdFx0XHRcdHZhbCA9IHt9O1xyXG5cdFx0XHR9XHJcblx0XHRcdGNiKHZhbCk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5iZURhdGUgPSBmdW5jdGlvbih2YWwsIGNiKSB7XHJcblx0XHRcdGNiKCBuZXcgRGF0ZSh2YWwpICk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5iZVN0cmluZyA9IGZ1bmN0aW9uKHZhbCwgY2Ipe1xyXG5cdFx0XHRpZih0eXBlb2YgdmFsICE9ICdzdHJpbmcnKXtcclxuXHRcdFx0XHR2YWwgPSAnJztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYih2YWwpO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuZm9yY2VBcnIgPSBmdW5jdGlvbihjYikge1xyXG5cdFx0XHRjYihbXSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5mb3JjZU9iaiA9IGZ1bmN0aW9uKGNiKSB7XHJcblx0XHRcdGNiKHt9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmZvcmNlU3RyaW5nID0gZnVuY3Rpb24odmFsLCBjYil7IGNiKCcnKTsgfTtcclxuXHRcdHRoaXMuZ2V0Q3JlYXRlZCA9IGZ1bmN0aW9uKHZhbCwgY2IsIGRvYyl7XHJcblx0XHRcdHJldHVybiBuZXcgRGF0ZShwYXJzZUludChkb2MuX2lkLnN1YnN0cmluZygwLDgpLCAxNikqMTAwMCk7XHJcblx0XHR9O1xyXG5cdC8qXHJcblx0Klx0bW9uZ28gbG9jYWwgc3VwcG9ydCBmdW5jdGlvbnNcclxuXHQqL1xyXG5cdFx0dmFyIHJlcGxhY2UgPSBmdW5jdGlvbihkb2MsIHZhbHVlLCBycGwsIHBhcnQpIHtcclxuXHRcdFx0aWYgKHZhbHVlLmluZGV4T2YoJy4nKSA+IC0xKSB7XHJcblx0XHRcdFx0dmFsdWUgPSB2YWx1ZS5zcGxpdCgnLicpO1xyXG5cdFx0XHRcdHZhciBzdWIgPSB2YWx1ZS5zaGlmdCgpO1xyXG5cdFx0XHRcdGlmIChkb2Nbc3ViXSAmJiAodHlwZW9mIGRvY1tzdWJdICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoZG9jW3N1Yl0pKSlcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRpZiAoIWRvY1tzdWJdKSBkb2Nbc3ViXSA9IHt9O1xyXG5cdFx0XHRcdHJldHVybiByZXBsYWNlKGRvY1tzdWJdLCB2YWx1ZS5qb2luKCcuJyksIHJwbCwgcGFydCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBycGwgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHJwbChkb2NbdmFsdWVdLCBmdW5jdGlvbihuZXdWYWx1ZSkge1xyXG5cdFx0XHRcdFx0ZG9jW3ZhbHVlXSA9IG5ld1ZhbHVlO1xyXG5cdFx0XHRcdH0sIGRvYyk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0XHR2YXIgcHVzaCA9IGZ1bmN0aW9uKHBhcnQsIGRvYykge1xyXG5cdFx0XHRpZihkYXRhWydvYmonICsgcGFydF1bZG9jLl9pZF0pIHJldHVybjtcclxuXHRcdFx0aWYgKGRhdGFbJ29wdHMnICsgcGFydF0ucmVwbGFjZSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBkYXRhWydvcHRzJyArIHBhcnRdLnJlcGxhY2UpIHtcclxuXHRcdFx0XHRcdHJlcGxhY2UoZG9jLCBrZXksIGRhdGFbJ29wdHMnICsgcGFydF0ucmVwbGFjZVtrZXldLCBwYXJ0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0ucG9wdWxhdGUpe1xyXG5cdFx0XHRcdHZhciBwID0gZGF0YVsnb3B0cycrcGFydF0ucG9wdWxhdGU7XHJcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShwKSl7XHJcblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgcC5sZW5ndGg7IGkrKyl7XHJcblx0XHRcdFx0XHRcdGlmKHR5cGVvZiBwID09ICdvYmplY3QnICYmIHBbaV0uZmllbGQgJiYgcFtpXS5wYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIHBbaV0uZmllbGQsIHBbaV0ucGFydCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YgcCA9PSAnb2JqZWN0JyAmJiBwLmZpZWxkICYmIHAucGFydCl7XHJcblx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIHAuZmllbGQsIHAucGFydCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XS5wdXNoKGRvYyk7XHJcblx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtkb2MuX2lkXSA9IGRvYztcclxuXHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcclxuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xyXG5cdFx0XHRcdFx0dmFyIGcgPSBkYXRhWydvcHRzJytwYXJ0XS5ncm91cHNba2V5XTtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBnLmlnbm9yZSA9PSAnZnVuY3Rpb24nICYmIGcuaWdub3JlKGRvYykpIHJldHVybjtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBnLmFsbG93ID09ICdmdW5jdGlvbicgJiYgIWcuYWxsb3coZG9jKSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0aWYoIWRhdGFbJ29iaicgKyBwYXJ0XVtrZXldKXtcclxuXHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV0gPSB7fTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHZhciBzZXQgID0gZnVuY3Rpb24oZmllbGQpe1xyXG5cdFx0XHRcdFx0XHRpZighZmllbGQpIHJldHVybjtcclxuXHRcdFx0XHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdKSl7XHJcblx0XHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdID0gW107XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdLnB1c2goZG9jKTtcclxuXHRcdFx0XHRcdFx0aWYodHlwZW9mIGcuc29ydCA9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0uc29ydChnLnNvcnQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRzZXQoZy5maWVsZChkb2MsIGZ1bmN0aW9uKGZpZWxkKXtcclxuXHRcdFx0XHRcdFx0c2V0KGZpZWxkKTtcclxuXHRcdFx0XHRcdH0pKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xyXG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5KXtcclxuXHRcdFx0XHRcdHZhciBxdWVyeSA9IGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5W2tleV07XHJcblx0XHRcdFx0XHRpZih0eXBlb2YgcXVlcnkuaWdub3JlID09ICdmdW5jdGlvbicgJiYgcXVlcnkuaWdub3JlKGRvYykpIHJldHVybjtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBxdWVyeS5hbGxvdyA9PSAnZnVuY3Rpb24nICYmICFxdWVyeS5hbGxvdyhkb2MpKSByZXR1cm47XHJcblx0XHRcdFx0XHRpZighZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xyXG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XSA9IFtdO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0IGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLnB1c2goZG9jKTtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBxdWVyeS5zb3J0ID09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XS5zb3J0KHF1ZXJ5LnNvcnQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHZhciBuZXh0ID0gZnVuY3Rpb24ocGFydCwgb3B0cywgY2Ipe1xyXG5cdFx0XHQkaHR0cC5nZXQoJy9hcGkvJyArIHBhcnQgKyAnL2dldCcpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdGlmIChyZXNwLmRhdGEpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcC5kYXRhLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdHB1c2gocGFydCwgcmVzcC5kYXRhW2ldKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJylcclxuXHRcdFx0XHRcdFx0Y2IoZGF0YVsnYXJyJyArIHBhcnRdLCBkYXRhWydvYmonICsgcGFydF0sIG9wdHMubmFtZXx8JycsIHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0Y2IoZGF0YVsnYXJyJyArIHBhcnRdLCBkYXRhWydvYmonICsgcGFydF0sIG9wdHMubmFtZXx8JycsIHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKG9wdHMubmV4dCl7XHJcblx0XHRcdFx0XHRuZXh0KHBhcnQsIG9wdHMubmV4dCwgY2IpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdC8qXHJcblx0Klx0RW5kb2YgTW9uZ28gU2VydmljZVxyXG5cdCovXHJcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3BvcHVwXCIsIFtdKVxyXG4gICAgLnNlcnZpY2UoJ3BvcHVwJywgZnVuY3Rpb24oJGNvbXBpbGUsICRyb290U2NvcGUpIHtcclxuICAgICAgICBcIm5nSW5qZWN0XCI7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHZhciBldmVudDtcclxuICAgICAgICB0aGlzLm9wZW4gPSBmdW5jdGlvbihzaXplLCBjb25maWcsIGV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghY29uZmlnIHx8ICghY29uZmlnLnRlbXBsYXRlVXJsICYmICFjb25maWcudGVtcGxhdGUpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybignUGxlYXNlIGFkZCB0ZW1wbGF0ZVVybCBvciB0ZW1wbGF0ZScpO1xyXG4gICAgICAgICAgICB2YXIgcG9wdXAgPSAnPHBvcHVwIHN0eWxlPVwicG9zaXRpb246IGZpeGVkO1wiIGNvbmZpZz1cIicgKyAoSlNPTi5zdHJpbmdpZnkoY29uZmlnKSkuc3BsaXQoJ1wiJykuam9pbihcIidcIikgKyAnXCJzaXplPVwiJyArIChKU09OLnN0cmluZ2lmeShzaXplKSkuc3BsaXQoJ1wiJykuam9pbihcIidcIikgKyAnXCI+JztcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy50ZW1wbGF0ZSkgcG9wdXAgKz0gY29uZmlnLnRlbXBsYXRlO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcudGVtcGxhdGVVcmwpIHtcclxuICAgICAgICAgICAgICAgIHBvcHVwICs9ICc8bmctaW5jbHVkZSBzcmM9XCInO1xyXG4gICAgICAgICAgICAgICAgcG9wdXAgKz0gXCInXCIgKyBjb25maWcudGVtcGxhdGVVcmwgKyBcIidcIjtcclxuICAgICAgICAgICAgICAgIHBvcHVwICs9ICdcIj48L25nLWluY2x1ZGU+JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb3B1cCArPSAnPC9wb3B1cD4nO1xyXG4gICAgICAgICAgICB2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xyXG4gICAgICAgICAgICBib2R5LmFwcGVuZCgkY29tcGlsZShhbmd1bGFyLmVsZW1lbnQocG9wdXApKSgkcm9vdFNjb3BlKSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaHRtbCcpLmFkZENsYXNzKCdub3Njcm9sbCcpO1xyXG4gICAgICAgIH1cclxuICAgIH0pLmRpcmVjdGl2ZSgncG9wJywgZnVuY3Rpb24ocG9wdXApIHtcclxuICAgICAgICBcIm5nSW5qZWN0XCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZzogJz0nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAxMCxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAzNzBcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9BZGQgdG8gc2NvcGUuc2l6ZSBzcGFuIGVsZW1lbnQgbGVmdCwgdG9wIGZyb20gZXZlbnRcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cC5vcGVuKCRzY29wZS5zaXplLCAkc2NvcGUuY29uZmlnLCBldmVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3dtb2RhbF9wb3B1cC5odG1sJ1xyXG4gICAgICAgIH07XHJcbiAgICB9KS5kaXJlY3RpdmUoJ3BvcHVwJywgZnVuY3Rpb24ocG9wdXApIHtcclxuICAgICAgICBcIm5nSW5qZWN0XCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZzogJz0nLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJz0nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICgkc2NvcGUuY29uZmlnLnBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3J0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtIChldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0ICogMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCArIGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAvIDIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmInOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSArIGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdiJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgKGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aCAvIDIpIC0gKCRzY29wZS5zaXplLm9mZnNldFdpZHRoIC8gMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSArIGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdsYic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCAtICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2wnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggLSAkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZIC0gKGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQgLyAyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2x0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYIC0gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZIC0gKGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQgKiAyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3QnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyAoZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoIC8gMikgLSAoJHNjb3BlLnNpemUub2Zmc2V0V2lkdGggLyAyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAkc2NvcGUuc2l6ZS5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5kZWZhdWx0KCRzY29wZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gWyRzY29wZS5zaXplLmxlZnQsICRzY29wZS5zaXplLnRvcF07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0ID0gZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSA+ICRzY29wZS5zaXplLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCA+ICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYm90dG9tID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAtICgoZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFgpICsgJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0KSA+ICRzY29wZS5zaXplLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC0gKChldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCkgKyAkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aCkgPiAkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aDtcclxuXHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0b3ApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGxlZnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGJvdHRvbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmlnaHQpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnQgJiYgdG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2x0JztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJpZ2h0ICYmIHRvcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdydCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyaWdodCAmJiBib3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAncmInO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCAmJiBib3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnbGInO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3QnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAncic7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChib3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnYic7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2wnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSAkc2NvcGUuY29uZmlnLnBvcyA9ICdiJztcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm9wZW4oJHNjb3BlLnNpemUsICRzY29wZS5jb25maWcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3NkXCIsIFtdKVxyXG5cbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9zZXJ2aWNlc1wiLCBbXSkucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRjb21waWxlKXtcclxuXHR2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xyXG5cdGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudCgnPHB1bGxmaWxlcz48L3B1bGxmaWxlcz4nKSkoJHJvb3RTY29wZSkpO1xyXG59KS5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbigpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRpZih0eXBlb2YgaW8gIT0gJ29iamVjdCcpIHJldHVybiB7fTtcclxuXHR2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uLmhvc3Q7XHJcblx0dmFyIHNvY2tldCA9IGlvLmNvbm5lY3QobG9jKTtcclxuXHRyZXR1cm4gc29ja2V0O1xyXG59KS5zZXJ2aWNlKCdmaWxlJywgZnVuY3Rpb24oJHRpbWVvdXQpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0c2VsZi5hZGQgPSBmdW5jdGlvbihvcHRzLCBjYil7XHJcblx0XHRpZih0eXBlb2Ygc2VsZi5hZGREZWxheSAhPSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRzZWxmLmFkZChvcHRzLCBjYik7XHJcblx0XHRcdH0sIDEwMCk7XHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0c2VsZi5hZGREZWxheShvcHRzLCBjYik7XHJcblx0XHR9XHJcblx0fVxyXG59KS5ydW4oZnVuY3Rpb24gKGN0cmwpIHtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uIChlKSB7XHJcblx0XHRjdHJsLnByZXNzKGUua2V5Q29kZSk7XHJcblx0fSk7XHJcbn0pLnNlcnZpY2UoJ2N0cmwnLCBmdW5jdGlvbigkdGltZW91dCl7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBjYnMgPSBbXTtcclxuXHR2YXIgZW51bXMgPSB7XHJcblx0XHQnc3BhY2UnOiAzMixcclxuXHRcdCdlc2MnOiAyNyxcclxuXHRcdCdiYWNrc3BhY2UnOiA4LFxyXG5cdFx0J3RhYic6IDksXHJcblx0XHQnZW50ZXInOiAxMyxcclxuXHRcdCdzaGlmdCc6IDE2LFxyXG5cdFx0J2N0cmwnOiAxNyxcclxuXHRcdCdhbHQnOiAxOCxcclxuXHRcdCdwYXVzZS9icmVhayc6IDE5LFxyXG5cdFx0J2NhcHMgbG9jayc6IDIwLFxyXG5cdFx0J2VzY2FwZSc6IDI3LFxyXG5cdFx0J3BhZ2UgdXAnOiAzMyxcclxuXHRcdCdwYWdlIGRvd24nOiAzNCxcclxuXHRcdCdlbmQnOiAzNSxcclxuXHRcdCdob21lJzogMzYsXHJcblx0XHQnbGVmdCc6IDM3LFxyXG5cdFx0J3VwJzogMzgsXHJcblx0XHQncmlnaHQnOiAzOSxcclxuXHRcdCdkb3duJzogNDAsXHJcblx0XHQnaW5zZXJ0JzogNDUsXHJcblx0XHQnZGVsZXRlJzogNDYsXHJcblx0XHQnMCc6IDQ4LFxyXG5cdFx0JzEnOiA0OSxcclxuXHRcdCcyJzogNTAsXHJcblx0XHQnMyc6IDUxLFxyXG5cdFx0JzQnOiA1MixcclxuXHRcdCc1JzogNTMsXHJcblx0XHQnNic6IDU0LFxyXG5cdFx0JzcnOiA1NSxcclxuXHRcdCc4JzogNTYsXHJcblx0XHQnOSc6IDU3LFxyXG5cdFx0J2EnOiA2NSxcclxuXHRcdCdiJzogNjYsXHJcblx0XHQnYyc6IDY3LFxyXG5cdFx0J2QnOiA2OCxcclxuXHRcdCdlJzogNjksXHJcblx0XHQnZic6IDcwLFxyXG5cdFx0J2cnOiA3MSxcclxuXHRcdCdoJzogNzIsXHJcblx0XHQnaSc6IDczLFxyXG5cdFx0J2onOiA3NCxcclxuXHRcdCdrJzogNzUsXHJcblx0XHQnbCc6IDc2LFxyXG5cdFx0J20nOiA3NyxcclxuXHRcdCduJzogNzgsXHJcblx0XHQnbyc6IDc5LFxyXG5cdFx0J3AnOiA4MCxcclxuXHRcdCdxJzogODEsXHJcblx0XHQncic6IDgyLFxyXG5cdFx0J3MnOiA4MyxcclxuXHRcdCd0JzogODQsXHJcblx0XHQndSc6IDg1LFxyXG5cdFx0J3YnOiA4NixcclxuXHRcdCd3JzogODcsXHJcblx0XHQneCc6IDg4LFxyXG5cdFx0J3knOiA4OSxcclxuXHRcdCd6JzogOTAsXHJcblx0XHQnbGVmdCB3aW5kb3cga2V5JzogOTEsXHJcblx0XHQncmlnaHQgd2luZG93IGtleSc6IDkyLFxyXG5cdFx0J3NlbGVjdCBrZXknOiA5MyxcclxuXHRcdCdudW1wYWQgMCc6IDk2LFxyXG5cdFx0J251bXBhZCAxJzogOTcsXHJcblx0XHQnbnVtcGFkIDInOiA5OCxcclxuXHRcdCdudW1wYWQgMyc6IDk5LFxyXG5cdFx0J251bXBhZCA0JzogMTAwLFxyXG5cdFx0J251bXBhZCA1JzogMTAxLFxyXG5cdFx0J251bXBhZCA2JzogMTAyLFxyXG5cdFx0J251bXBhZCA3JzogMTAzLFxyXG5cdFx0J251bXBhZCA4JzogMTA0LFxyXG5cdFx0J251bXBhZCA5JzogMTA1LFxyXG5cdFx0J211bHRpcGx5JzogMTA2LFxyXG5cdFx0J2FkZCc6IDEwNyxcclxuXHRcdCdzdWJ0cmFjdCc6IDEwOSxcclxuXHRcdCdkZWNpbWFsIHBvaW50JzogMTEwLFxyXG5cdFx0J2RpdmlkZSc6IDExMSxcclxuXHRcdCdmMSc6IDExMixcclxuXHRcdCdmMic6IDExMyxcclxuXHRcdCdmMyc6IDExNCxcclxuXHRcdCdmNCc6IDExNSxcclxuXHRcdCdmNSc6IDExNixcclxuXHRcdCdmNic6IDExNyxcclxuXHRcdCdmNyc6IDExOCxcclxuXHRcdCdmOCc6IDExOSxcclxuXHRcdCdmOSc6IDEyMCxcclxuXHRcdCdmMTAnOiAxMjEsXHJcblx0XHQnZjExJzogMTIyLFxyXG5cdFx0J2YxMic6IDEyMyxcclxuXHRcdCdudW0gbG9jayc6IDE0NCxcclxuXHRcdCdzY3JvbGwgbG9jayc6IDE0NSxcclxuXHRcdCdzZW1pLWNvbG9uJzogMTg2LFxyXG5cdFx0J2VxdWFsIHNpZ24nOiAxODcsXHJcblx0XHQnY29tbWEnOiAxODgsXHJcblx0XHQnZGFzaCc6IDE4OSxcclxuXHRcdCdwZXJpb2QnOiAxOTAsXHJcblx0XHQnZm9yd2FyZCBzbGFzaCc6IDE5MSxcclxuXHRcdCdncmF2ZSBhY2NlbnQnOiAxOTIsXHJcblx0XHQnb3BlbiBicmFja2V0JzogMjE5LFxyXG5cdFx0J2JhY2sgc2xhc2gnOiAyMjAsXHJcblx0XHQnY2xvc2UgYnJha2V0JzogMjIxLFxyXG5cdFx0J3NpbmdsZSBxdW90ZSc6IDIyMixcclxuXHR9O1xyXG5cdHRoaXMucHJlc3MgPSBmdW5jdGlvbihjb2RlKXtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2JzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmKGNic1tpXS5rZXkgPT0gY29kZSkgJHRpbWVvdXQoY2JzW2ldLmNiKTtcclxuXHRcdH1cclxuXHR9XHJcblx0dGhpcy5vbiA9IGZ1bmN0aW9uKGJ0bnMsIGNiKXtcclxuXHRcdGlmKHR5cGVvZiBjYiAhPSAnZnVuY3Rpb24nKSByZXR1cm47XHJcblx0XHRpZighQXJyYXkuaXNBcnJheShidG5zKSYmdHlwZW9mIGJ0bnMgIT0gJ29iamVjdCcpIHJldHVybjtcclxuXHRcdGlmKCFBcnJheS5pc0FycmF5KGJ0bnMpJiZ0eXBlb2YgYnRucyA9PSAnb2JqZWN0JykgYnRucyA9IFtidG5zXTtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYnRucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZih0eXBlb2YgZW51bXNbYnRuc1tpXV0gPT0gJ251bWJlcicpe1xyXG5cdFx0XHRcdGNicy5wdXNoKHtcclxuXHRcdFx0XHRcdGtleTogZW51bXNbYnRuc1tpXV0sXHJcblx0XHRcdFx0XHRjYjogY2JcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufSkuc2VydmljZSgnaW1nJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0dGhpcy5maWxlVG9EYXRhVXJsID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spe1xyXG5cdFx0dmFyIGEgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0YS5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGNhbGxiYWNrKGUudGFyZ2V0LnJlc3VsdCk7XHJcblx0XHR9XHJcblx0XHRhLnJlYWRBc0RhdGFVUkwoZmlsZSk7XHJcblx0fVxyXG5cdHRoaXMucmVzaXplVXBUbyA9IGZ1bmN0aW9uKGluZm8sIGNhbGxiYWNrKXtcclxuXHRcdGlmKCFpbmZvLmZpbGUpIHJldHVybiBjb25zb2xlLmxvZygnTm8gaW1hZ2UnKTtcclxuXHRcdGluZm8ud2lkdGggPSBpbmZvLndpZHRoIHx8IDE5MjA7XHJcblx0XHRpbmZvLmhlaWdodCA9IGluZm8uaGVpZ2h0IHx8IDEwODA7XHJcblx0XHRpZihpbmZvLmZpbGUudHlwZSE9XCJpbWFnZS9qcGVnXCIgJiYgaW5mby5maWxlLnR5cGUhPVwiaW1hZ2UvcG5nXCIpXHJcblx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhcIllvdSBtdXN0IHVwbG9hZCBmaWxlIG9ubHkgSlBFRyBvciBQTkcgZm9ybWF0LlwiKTtcclxuXHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChsb2FkRXZlbnQpIHtcclxuXHRcdFx0dmFyIGNhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuXHRcdFx0dmFyIGltYWdlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG5cdFx0XHRpbWFnZUVsZW1lbnQub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIGluZm9SYXRpbyA9IGluZm8ud2lkdGggLyBpbmZvLmhlaWdodDtcclxuXHRcdFx0XHR2YXIgaW1nUmF0aW8gPSBpbWFnZUVsZW1lbnQud2lkdGggLyBpbWFnZUVsZW1lbnQuaGVpZ2h0O1xyXG5cdFx0XHRcdGlmIChpbWdSYXRpbyA+IGluZm9SYXRpbykge1xyXG5cdFx0XHRcdFx0d2lkdGggPSBpbmZvLndpZHRoO1xyXG5cdFx0XHRcdFx0aGVpZ2h0ID0gd2lkdGggLyBpbWdSYXRpbztcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0aGVpZ2h0ID0gaW5mby5oZWlnaHQ7XHJcblx0XHRcdFx0XHR3aWR0aCA9IGhlaWdodCAqIGltZ1JhdGlvO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYW52YXNFbGVtZW50LndpZHRoID0gd2lkdGg7XHJcblx0XHRcdFx0Y2FudmFzRWxlbWVudC5oZWlnaHQgPSBoZWlnaHQ7XHJcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYW52YXNFbGVtZW50LmdldENvbnRleHQoJzJkJyk7XHJcblx0XHRcdFx0Y29udGV4dC5kcmF3SW1hZ2UoaW1hZ2VFbGVtZW50LCAwLCAwICwgd2lkdGgsIGhlaWdodCk7XHJcblx0XHRcdFx0Y2FsbGJhY2soY2FudmFzRWxlbWVudC50b0RhdGFVUkwoJ2ltYWdlL3BuZycsIDEpKTtcclxuXHRcdFx0fTtcclxuXHRcdFx0aW1hZ2VFbGVtZW50LnNyYyA9IGxvYWRFdmVudC50YXJnZXQucmVzdWx0O1xyXG5cdFx0fTtcclxuXHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGluZm8uZmlsZSk7XHJcblx0fVxyXG59KS5zZXJ2aWNlKCdoYXNoJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0dGhpcy5zZXQgPSBmdW5jdGlvbihvYmope1xyXG5cdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSAnJztcclxuXHRcdGZvcih2YXIga2V5IGluIG9iail7XHJcblx0XHRcdGlmKG9ialtrZXldKSB3aW5kb3cubG9jYXRpb24uaGFzaCs9JyYnK2tleSsnPScrb2JqW2tleV07XHJcblxyXG5cdFx0fVxyXG5cdH1cclxuXHR0aGlzLmdldCA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhIycsICcnKTtcclxuXHRcdGhhc2ggPSBoYXNoLnJlcGxhY2UoJyMnLCAnJykuc3BsaXQoJyYnKTtcclxuXHRcdGhhc2guc2hpZnQoKTtcclxuXHRcdHZhciBoID0ge307XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGhhc2gubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aGFzaFtpXSA9IGhhc2hbaV0uc3BsaXQoJz0nKTtcclxuXHRcdFx0aFtoYXNoW2ldWzBdXSA9IGhhc2hbaV1bMV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gaDtcclxuXHR9XHJcbn0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3NwaW5uZXJcIiwgW10pXHJcbiAgICAuc2VydmljZSgnc3BpbicsIGZ1bmN0aW9uKCRjb21waWxlLCAkcm9vdFNjb3BlKSB7XHJcbiAgICAgICAgXCJuZ0luamVjdFwiO1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpcdFNwaW5uZXJzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuc3Bpbm5lcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLnNwaW5uZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5zcGlubmVyc1tpXS5pZCA9PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3Bpbm5lcnNbaV0uZWwucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zcGlubmVycy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICBpZiAoIW9iaikgb2JqID0ge307XHJcbiAgICAgICAgICAgIGlmICghb2JqLmlkKSBvYmouaWQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICB2YXIgbW9kYWwgPSAnPHNwaW4gIGlkPVwiJyArIG9iai5pZCArICdcIj4nO1xyXG4gICAgICAgICAgICBpZiAob2JqLnRlbXBsYXRlKSBtb2RhbCArPSBvYmoudGVtcGxhdGU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG9iai50ZW1wbGF0ZVVybCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJzxuZy1pbmNsdWRlIHNyYz1cIic7XHJcbiAgICAgICAgICAgICAgICBtb2RhbCArPSBcIidcIiArIG9iai50ZW1wbGF0ZVVybCArIFwiJ1wiO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJ1wiPjwvbmctaW5jbHVkZT4nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJzxuZy1pbmNsdWRlICBzcmM9XCInO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gXCInd21vZGFsX3NwaW5uZXIuaHRtbCdcIjtcclxuICAgICAgICAgICAgICAgIG1vZGFsICs9ICdcIj48L25nLWluY2x1ZGU+JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtb2RhbCArPSAnPC9zcGluPic7XHJcbiAgICAgICAgICAgIHRoaXMuc3Bpbm5lcnMucHVzaChvYmopO1xyXG4gICAgICAgICAgICBpZiAob2JqLmVsZW1lbnQpIHtcclxuICAgICAgICAgICAgXHRcclxuICAgICAgICAgICAgXHRjb25zb2xlLmxvZyhvYmouZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFx0dmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcclxuXHRcdFx0XHRib2R5LmFwcGVuZCgkY29tcGlsZShhbmd1bGFyLmVsZW1lbnQobW9kYWwpKSgkcm9vdFNjb3BlKSk7XHJcblx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykuYWRkQ2xhc3MoJ25vc2Nyb2xsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG9iai5pZDtcclxuICAgICAgICB9XHJcbiAgICB9KS5kaXJlY3RpdmUoJ3NwaW4nLCBmdW5jdGlvbihzcGluKSB7XHJcbiAgICAgICAgXCJuZ0luamVjdFwiO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogJ0AnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGlubmVyLnNwaW5uZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwaW5uZXIuc3Bpbm5lcnNbaV0uaWQgPT0gc2NvcGUuaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zcGlubmVyc1tpXS5lbCA9IGVsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd3bW9kYWxfc3Bpbm5lci5odG1sJ1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XHJcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz1cXFwid3RhZ3NcXFwiPjxzcGFuIGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J29iaiBpbiBhcnInPjxpbWcgbmctc3JjPSd7e29iai5hdmF0YXJVcmx9fScgYWx0PSd7e29iai5uYW1lfX0nPjxzcGFuPnt7b2JqLm5hbWV9fTwvc3Bhbj48aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlJyBuZy1jbGljaz0nYXJyLnNwbGljZSgkaW5kZXgsIDEpOyBjaGFuZ2UoKTsnPjwvaT48L3NwYW4+PGlucHV0IHR5cGU9J3RleHQnIHBsYWNlaG9sZGVyPSd7e2hvbGRlcn19JyBuZy1tb2RlbD0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjwvbGFiZWw+PGRpdiBuZy1pZj0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjxkaXYgbmctcmVwZWF0PSd1c2VyIGluIHVzZXJzfHJBcnI6YXJyfGZpbHRlcjpvYmplY3QubmV3X21vZGVyYXRvcicgbmctY2xpY2s9J2Fyci5wdXNoKHVzZXIpOyBvYmplY3QubmV3X21vZGVyYXRvcj1udWxsOyBjaGFuZ2UoKTsnPjxpbWcgbmctc3JjPSd7e3VzZXIuYXZhdGFyVXJsfX0nIGFsdD0ne3t1c2VyLm5hbWV9fSc+PHNwYW4+e3t1c2VyLm5hbWV9fTwvc3Bhbj48L2Rpdj48L2Rpdj5cIik7XHJcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGFlcmF0b3Jzdmlldy5odG1sXCIsIFwiPHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PHNwYW4+e3tvYmoubmFtZX19PC9zcGFuPjwvc3Bhbj5cIik7XHJcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93bW9kZXJhdG9ycy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3Y29tX3dtb2RlcmF0b3JzLmh0bWxcIiwgXCI8bGFiZWwgY2xhc3M9XFxcInd0YWdzXFxcIj48ZGl2IGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J29iaiBpbiBhcnInPjxkaXYgY2xhc3M9XFxcInd0YWctLWluXFxcIj48ZGl2IGNsYXNzPVxcXCJ3dGFnLS1hdmFcXFwiPjxpbWcgbmctc3JjPSd7e29iai5hdmF0YXJVcmx9fScgYWx0PSd7e29iai5uYW1lfX0nPjwvZGl2PjxkaXYgY2xhc3M9XFxcInd0YWctLXRleHRcXFwiPnt7b2JqLm5hbWV9fTwvZGl2PjxpIGNsYXNzPSdpY29uIGljb24tY2xvc2UnIG5nLWNsaWNrPSdhcnIuc3BsaWNlKCRpbmRleCwgMSk7IGNoYW5nZSgpOycgdGl0bGU9XFxcIkRlbGV0ZSBtb2RlcmF0b3JcXFwiPjwvaT48L2Rpdj48L2Rpdj48aW5wdXQgdHlwZT0ndGV4dCcgcGxhY2Vob2xkZXI9J3t7aG9sZGVyfX0nIG5nLW1vZGVsPSdvYmplY3QubmV3X21vZGVyYXRvcic+PC9sYWJlbD48ZGl2IG5nLWlmPSdvYmplY3QubmV3X21vZGVyYXRvcic+PGRpdiBuZy1yZXBlYXQ9J3VzZXIgaW4gdXNlcnN8ckFycjphcnJ8ZmlsdGVyOm9iamVjdC5uZXdfbW9kZXJhdG9yJyBuZy1jbGljaz0nYXJyLnB1c2godXNlcik7IG9iamVjdC5uZXdfbW9kZXJhdG9yPW51bGw7IGNoYW5nZSgpOyc+PGltZyBuZy1zcmM9J3t7dXNlci5hdmF0YXJVcmx9fScgYWx0PSd7e3VzZXIubmFtZX19Jz48c3Bhbj57e3VzZXIubmFtZX19PC9zcGFuPjwvZGl2PjwvZGl2PlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFwiPHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGRpdiBjbGFzcz1cXFwid3RhZy0taW5cXFwiPjxkaXYgY2xhc3M9XFxcInd0YWctLWF2YVxcXCI+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PC9kaXY+PGRpdiBjbGFzcz1cXFwid3RhZy0tdGV4dFxcXCI+e3tvYmoubmFtZX19PC9kaXY+PC9kaXY+PC9zcGFuPlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3d0YWdzLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd3RhZ3MuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz0nd3RhZ3MnPjxzcGFuIGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J3RhZyBpbiB0YWdzJz4je3t0YWd9fSA8aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlJyBuZy1jbGljaz0ndGFncy5zcGxpY2UoJGluZGV4LCAxKTsgdXBkYXRlX3RhZ3MoKTsnPjwvaT48L3NwYW4+PGlucHV0IHR5cGU9J3RleHQnIHBsYWNlaG9sZGVyPSduZXcgdGFnJyBuZy1tb2RlbD0nbmV3X3RhZycgbmcta2V5dXA9J2VudGVyKCRldmVudCknPjwvbGFiZWw+XCIpO1xyXG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9tb2RhbC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3bW9kYWxfbW9kYWwuaHRtbFwiLCBcIjxkaXYgY2xhc3M9J21vZGFsJyBuZy1jbGFzcz1cXFwie2Z1bGw6IGZ1bGwsIGNvdmVyOiBjb3Zlcn1cXFwiPjxkaXYgY2xhc3M9J21vZGFsX2ZhZGUnIG5nLWNsaWNrPSdjbG9zZSgpOycgdGl0bGU9J0Nsb3NlJz48L2Rpdj48ZGl2IGNsYXNzPSdtb2RhbF9jb250ZW50IHZpZXdlcic+PGkgY2xhc3M9J2ljb24gaWNvbi1jbG9zZSBjbG9zZS1tJyBuZy1jbGljaz0nY2xvc2UoKTsnIHRpdGxlPSdDbG9zZSc+PC9pPjxoMiBuZy1pZj1cXFwiaGVhZGVyXFxcIj57e2hlYWRlcn19PC9oMj48cCBuZy1pZj1cXFwiY29udGVudFxcXCI+e3tjb250ZW50fX08L3A+PG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPjwvZGl2PjwvZGl2PlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3bW9kYWxfcG9wdXAuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XHJcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid21vZGFsX3BvcHVwLmh0bWxcIiwgXCI8c3BhbiBuZy1jbGljay1vdXRzaWRlPVxcXCJjbG9zZSgpXFxcIiBuZy10cmFuc2NsdWRlIG5nLWNsaWNrPVxcXCJvcGVuKCRldmVudClcXFwiIGVsc2l6ZT1cXFwic2l6ZVxcXCI+PC9zcGFuPlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3bW9kYWxfc3Bpbm5lci5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3bW9kYWxfc3Bpbm5lci5odG1sXCIsIFwiPCEtLSBDb21tZW50cyBhcmUganVzdCB0byBmaXggd2hpdGVzcGFjZSB3aXRoIGlubGluZS1ibG9jayAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyXFxcIj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTFcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLSAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUgU3Bpbm5lci1saW5lLS0yXFxcIj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1sZWZ0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtdGlja2VyXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1jZW50ZXJcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLXJpZ2h0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tM1xcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTRcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLS0tPjwvZGl2PjwhLS0vc3Bpbm5lciAtLT5cIik7XHJcbn1dKTsiXX0=

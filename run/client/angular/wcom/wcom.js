angular.module("wcom", ["angular-click-outside", "wcom_dev", "wcom_directives", "wcom_filters", "wcom_modal", "wcom_mongo", "wcom_popup", "wcom_sd", "wcom_services", "wcom_spinner", "wcom_wmodaerators.html", "wcom_wmodaeratorsview.html", "wcom_wmoderators.html", "wcom_wmoderatorsview.html", "wcom_wtags.html", "wmodal_modal.html", "wmodal_popup.html", "wmodal_spinner.html"]);
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
angular.module("wcom_dev", []).run([function($http){
	var update;
	var check_refresh = function(){
		setTimeout(function(){
			$http.get('/waw/last_update').then(function(resp){
				if(resp.data != update){
					location.reload();
				}else{
					check_refresh();
				}
			});
		}, 2000);
	}
	$http.get('/waw/last_update').then(function(resp){
		if(resp.data){
			update = resp.data;
			check_refresh();
		}
	});
}]);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndjb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsUUFBQSxPQUFBLFFBQUEsQ0FBQSx5QkFBQSxZQUFBLG1CQUFBLGdCQUFBLGNBQUEsY0FBQSxjQUFBLFdBQUEsaUJBQUEsZ0JBQUEsMEJBQUEsOEJBQUEseUJBQUEsNkJBQUEsbUJBQUEscUJBQUEscUJBQUE7OztBQUdBLENBQUEsV0FBQTtJQUNBOztJQUVBO1NBQ0EsT0FBQSx5QkFBQTtTQUNBLFVBQUEsZ0JBQUE7WUFDQSxhQUFBLFVBQUE7WUFDQTs7Ozs7Ozs7Ozs7SUFXQSxTQUFBLGFBQUEsV0FBQSxRQUFBLFVBQUE7UUFDQSxPQUFBO1lBQ0EsVUFBQTtZQUNBLE1BQUEsU0FBQSxRQUFBLE1BQUEsTUFBQTs7O2dCQUdBLFNBQUEsV0FBQTtvQkFDQSxJQUFBLFlBQUEsQ0FBQSxLQUFBLGlCQUFBLGFBQUEsS0FBQSxhQUFBLE1BQUEsV0FBQTt3QkFDQTs7b0JBRUEsU0FBQSxhQUFBLEdBQUE7d0JBQ0EsSUFBQTs0QkFDQTs0QkFDQTs0QkFDQTs0QkFDQTs0QkFDQTs7O3dCQUdBLElBQUEsUUFBQSxRQUFBLE1BQUEsU0FBQSxZQUFBOzRCQUNBOzs7O3dCQUlBLElBQUEsQ0FBQSxLQUFBLENBQUEsRUFBQSxRQUFBOzRCQUNBOzs7O3dCQUlBLEtBQUEsVUFBQSxFQUFBLFFBQUEsU0FBQSxVQUFBLFFBQUEsWUFBQTs7NEJBRUEsSUFBQSxZQUFBLEtBQUEsSUFBQTtnQ0FDQTs7Ozs0QkFJQSxLQUFBLFFBQUE7Z0NBQ0EsYUFBQSxRQUFBO2dDQUNBLElBQUEsVUFBQTs7OzRCQUdBLElBQUEsY0FBQSxXQUFBLFlBQUEsV0FBQTtnQ0FDQSxhQUFBLFdBQUE7Ozs7NEJBSUEsSUFBQSxjQUFBLElBQUE7OztnQ0FHQSxLQUFBLElBQUEsR0FBQSxJQUFBLEdBQUEsS0FBQTs7b0NBRUEsSUFBQSxJQUFBLE9BQUEsUUFBQSxVQUFBLEtBQUE7OztvQ0FHQSxJQUFBLENBQUEsT0FBQSxhQUFBLEVBQUEsS0FBQSxTQUFBLGNBQUEsRUFBQSxLQUFBLGNBQUE7O3dDQUVBOzs7Ozs7O3dCQU9BLFNBQUEsV0FBQTs0QkFDQSxLQUFBLE9BQUEsS0FBQTs0QkFDQSxHQUFBLFFBQUE7Z0NBQ0EsT0FBQTs7Ozs7O29CQU1BLElBQUEsYUFBQTt3QkFDQSxVQUFBLEdBQUEsY0FBQSxXQUFBOzRCQUNBLFdBQUE7Ozs7O29CQUtBLFVBQUEsR0FBQSxTQUFBOzs7b0JBR0EsT0FBQSxJQUFBLFlBQUEsV0FBQTt3QkFDQSxJQUFBLGFBQUE7NEJBQ0EsVUFBQSxJQUFBLGNBQUE7Ozt3QkFHQSxVQUFBLElBQUEsU0FBQTs7Ozs7OztvQkFPQSxTQUFBLFlBQUE7O3dCQUVBLE9BQUEsa0JBQUEsVUFBQSxVQUFBO3FCQUNBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsWUFBQSxJQUFBLElBQUEsQ0FBQSxTQUFBLE1BQUE7Q0FDQSxJQUFBO0NBQ0EsSUFBQSxnQkFBQSxVQUFBO0VBQ0EsV0FBQSxVQUFBO0dBQ0EsTUFBQSxJQUFBLG9CQUFBLEtBQUEsU0FBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQTtLQUNBLFNBQUE7U0FDQTtLQUNBOzs7S0FHQTs7Q0FFQSxNQUFBLElBQUEsb0JBQUEsS0FBQSxTQUFBLEtBQUE7RUFDQSxHQUFBLEtBQUEsS0FBQTtHQUNBLFNBQUEsS0FBQTtHQUNBOzs7O0FBSUEsUUFBQSxPQUFBLG1CQUFBO0NBQ0EsVUFBQSxhQUFBLFVBQUE7Q0FDQTtDQUNBLE1BQUE7RUFDQSxVQUFBLEtBQUEsT0FBQSxNQUFBLFNBQUE7RUFDQSxrREFBQSxTQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7R0FDQSxJQUFBLFNBQUEsT0FBQSxTQUFBO0dBQ0EsS0FBQSxXQUFBLFNBQUEsTUFBQSxHQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsY0FBQSxDQUFBLEtBQUEsSUFBQTtJQUNBLEtBQUEsV0FBQSxDQUFBLENBQUEsS0FBQTtJQUNBLE9BQUEsS0FBQTtJQUNBLFNBQUEsVUFBQTtLQUNBLEdBQUEsS0FBQSxTQUFBO01BQ0EsSUFBQSxXQUFBLFNBQUEsTUFBQTtPQUNBLElBQUEsV0FBQTtRQUNBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBOzs7O01BSUEsUUFBQSxRQUFBLFNBQUEsZUFBQSxLQUFBO09BQ0EsS0FBQSxVQUFBLFNBQUEsS0FBQTtPQUNBLElBQUEsU0FBQSxJQUFBLGlCQUFBLElBQUE7T0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsT0FBQSxNQUFBLFFBQUEsS0FBQTtRQUNBLFNBQUEsT0FBQSxNQUFBOzs7VUFHQTtNQUNBLFFBQUEsUUFBQSxTQUFBLGVBQUEsS0FBQTtPQUNBLEtBQUEsVUFBQSxTQUFBLEtBQUE7T0FDQSxJQUFBLFNBQUEsSUFBQSxpQkFBQSxJQUFBO09BQ0EsSUFBQSxXQUFBO1FBQ0EsTUFBQSxPQUFBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBLE9BQUEsTUFBQTs7Ozs7T0FLQTs7O0VBR0EsVUFBQTs7R0FFQSxVQUFBLGtDQUFBLFNBQUEsVUFBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLE9BQUEsR0FBQTtHQUNBLEdBQUEsQ0FBQSxNQUFBLFFBQUEsTUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBLFVBQUE7SUFDQSxNQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7SUFDQSxNQUFBLE9BQUEsU0FBQSxHQUFBLEdBQUE7SUFDQTs7R0FFQTtHQUNBLFFBQUEsUUFBQSxTQUFBLEtBQUEsVUFBQTtHQUNBLE1BQUEsT0FBQSxZQUFBO0lBQ0EsT0FBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsR0FBQSxjQUFBLEtBQUE7S0FDQSxVQUFBLE9BQUE7SUFDQSxHQUFBLE1BQUEsTUFBQSxLQUFBLEdBQUEsR0FBQSxNQUFBLE9BQUEsUUFBQSxNQUFBLE1BQUEsS0FBQTtJQUNBLEdBQUEsTUFBQSxNQUFBLEtBQUEsR0FBQSxHQUFBLE1BQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxLQUFBOzs7O0lBSUEsVUFBQSxxQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUE7RUFDQSxVQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTtLQUNBLHVCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQSxRQUFBLFNBQUEsT0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLGNBQUEsVUFBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFNBQUEsT0FBQSxLQUFBLEtBQUE7SUFDQSxHQUFBLE9BQUEsT0FBQSxVQUFBLFlBQUEsT0FBQTs7R0FFQSxPQUFBLFFBQUEsU0FBQSxFQUFBO0lBQ0EsR0FBQSxFQUFBLFNBQUEsR0FBQTtLQUNBLEdBQUEsT0FBQSxRQUFBO01BQ0EsT0FBQSxLQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7O0tBRUEsT0FBQSxVQUFBOzs7TUFHQSxhQUFBOztLQUVBLFVBQUEsNEJBQUEsU0FBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxLQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxRQUFBO0tBQ0EsYUFBQTs7SUFFQSxVQUFBLGdDQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxPQUFBO0dBQ0EsS0FBQTtLQUNBLGFBQUE7OztBQUdBLE9BQUEsVUFBQSxPQUFBLFNBQUEsUUFBQSxhQUFBO0lBQ0EsSUFBQSxTQUFBO0lBQ0EsT0FBQSxPQUFBLE1BQUEsUUFBQSxLQUFBOztBQUVBLFFBQUEsT0FBQSxnQkFBQTtDQUNBLE9BQUEsU0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQSxJQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsT0FBQTtFQUNBLElBQUEsSUFBQSxNQUFBLENBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsTUFBQSxJQUFBLE1BQUEsS0FBQTtFQUNBLEtBQUEsSUFBQSxJQUFBLElBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0dBQ0EsR0FBQSxDQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsR0FBQTs7RUFFQSxPQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsWUFBQSxXQUFBO0VBQ0EsSUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxJQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLFFBQUEsS0FBQTtJQUNBLEdBQUEsV0FBQSxHQUFBLE9BQUEsSUFBQSxHQUFBLElBQUE7S0FDQSxJQUFBLE9BQUEsR0FBQTtLQUNBOzs7O0VBSUEsT0FBQTs7R0FFQSxPQUFBLGFBQUEsVUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLElBQUE7RUFDQSxHQUFBLENBQUEsS0FBQSxPQUFBLElBQUE7RUFDQSxJQUFBLFlBQUEsSUFBQSxXQUFBLFVBQUEsRUFBQTtFQUNBLE9BQUEsSUFBQSxLQUFBLFNBQUEsVUFBQSxJQUFBOztHQUVBLE9BQUEsV0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQTtFQUNBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsUUFBQSxNQUFBLEdBQUEsT0FBQTtPQUNBLE9BQUEsVUFBQTs7R0FFQSxPQUFBLHFCQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLE1BQUEsU0FBQSxVQUFBLE9BQUE7RUFDQSxPQUFBLElBQUEsS0FBQTtFQUNBLEdBQUEsUUFBQTtHQUNBLEtBQUEsWUFBQSxLQUFBLGdCQUFBLFNBQUE7O0VBRUEsR0FBQSxTQUFBO0dBQ0EsS0FBQSxTQUFBLEtBQUEsYUFBQSxTQUFBOztFQUVBLEdBQUEsT0FBQTtHQUNBLEtBQUEsUUFBQSxLQUFBLFlBQUEsU0FBQTs7RUFFQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7O0lBRUEsT0FBQSwyQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUEsU0FBQSxLQUFBO0VBQ0EsT0FBQSxJQUFBLEtBQUE7RUFDQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFNBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxRQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7OztBQUdBLFFBQUEsT0FBQSxjQUFBO0NBQ0EsUUFBQSxvQ0FBQSxTQUFBLFVBQUEsV0FBQTtDQUNBOzs7O0VBSUEsSUFBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsT0FBQSxHQUFBO0dBQ0EsTUFBQSxRQUFBLFVBQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEdBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxNQUFBLEdBQUE7TUFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBO01BQ0E7OztJQUdBLEdBQUEsS0FBQSxPQUFBLFVBQUEsRUFBQTtLQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxZQUFBOztJQUVBLEdBQUEsTUFBQSxJQUFBLE1BQUE7SUFDQSxHQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLE9BQUEsUUFBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLE1BQUEsR0FBQTtLQUNBLEtBQUEsT0FBQSxHQUFBLFFBQUEsTUFBQTtLQUNBLE1BQUEsUUFBQSxLQUFBLE9BQUE7S0FDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTtNQUNBLE1BQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTs7S0FFQTs7OztFQUlBLEtBQUEsT0FBQSxTQUFBLElBQUE7R0FDQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsZUFBQSxDQUFBLElBQUE7SUFDQSxPQUFBLFFBQUEsS0FBQTtHQUNBLEdBQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxLQUFBLEtBQUE7R0FDQSxJQUFBLFFBQUEsY0FBQSxJQUFBLEdBQUE7R0FDQSxHQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7UUFDQSxHQUFBLElBQUEsWUFBQTtJQUNBLFNBQUE7SUFDQSxTQUFBLElBQUEsSUFBQSxZQUFBO0lBQ0EsU0FBQTs7R0FFQSxTQUFBO0dBQ0EsS0FBQSxPQUFBLEtBQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7R0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtHQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOzs7OztJQUtBLFVBQUEsbUJBQUEsU0FBQSxPQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLFlBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtLQUNBLE1BQUEsTUFBQSxZQUFBLGFBQUE7O0lBRUEsV0FBQSxrQ0FBQSxTQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsU0FBQSxVQUFBO0VBQ0EsR0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLFFBQUEsT0FBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBOzs7RUFHQSxHQUFBLE9BQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsT0FBQSxRQUFBLE1BQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLGNBQUEsSUFBQSxRQUFBLHlDQUFBLFNBQUEsT0FBQSxVQUFBLE9BQUE7Ozs7Ozs7Ozs7RUFVQSxJQUFBLE9BQUE7Ozs7RUFJQSxLQUFBLFNBQUEsU0FBQSxNQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUEsT0FBQSxNQUFBLFlBQUEsR0FBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsU0FBQSxNQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxHQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsV0FBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBOztJQUVBLE9BQUEsS0FBQSxRQUFBOztHQUVBLEtBQUEsUUFBQSxRQUFBO0dBQ0EsS0FBQSxRQUFBLFFBQUE7R0FDQSxLQUFBLFNBQUEsUUFBQSxPQUFBLFFBQUE7R0FDQSxHQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxLQUFBLE1BQUEsUUFBQSxXQUFBO01BQ0EsS0FBQSxNQUFBLE9BQUE7T0FDQSxPQUFBLEtBQUEsTUFBQTs7Ozs7R0FLQSxHQUFBLEtBQUEsT0FBQTtJQUNBLEdBQUEsT0FBQSxLQUFBLFVBQUEsU0FBQTtLQUNBLEtBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTs7SUFFQSxHQUFBLE1BQUEsUUFBQSxLQUFBLFFBQUE7S0FDQSxJQUFBLE1BQUEsS0FBQTtLQUNBLEtBQUEsU0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxJQUFBLE1BQUEsU0FBQTtPQUNBLEtBQUEsT0FBQSxJQUFBLE1BQUE7WUFDQTtPQUNBLElBQUEsSUFBQSxPQUFBLElBQUEsR0FBQTtRQUNBLEtBQUEsT0FBQSxPQUFBLElBQUEsR0FBQTs7Ozs7SUFLQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsS0FBQSxPQUFBLFFBQUEsVUFBQTtNQUNBLEdBQUEsS0FBQSxPQUFBLEtBQUE7T0FDQSxLQUFBLE9BQUEsT0FBQTtRQUNBLE9BQUEsU0FBQSxJQUFBO1NBQ0EsT0FBQSxJQUFBOzs7V0FHQTtPQUNBLE9BQUEsS0FBQSxPQUFBO09BQ0E7OztLQUdBLEdBQUEsT0FBQSxLQUFBLE9BQUEsUUFBQSxTQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7S0FFQSxHQUFBLE9BQUEsS0FBQSxPQUFBLEtBQUEsU0FBQSxXQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7OztHQUlBLE1BQUEsSUFBQSxVQUFBLE9BQUEsUUFBQSxLQUFBLFNBQUEsTUFBQTtJQUNBLElBQUEsS0FBQSxNQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsS0FBQSxRQUFBLEtBQUE7TUFDQSxLQUFBLE1BQUEsS0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxNQUFBO01BQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxNQUFBLElBQUEsS0FBQTs7SUFFQSxLQUFBLFNBQUEsT0FBQTtJQUNBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7O0dBR0EsT0FBQSxLQUFBLFFBQUE7O0VBRUEsS0FBQSxZQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxJQUFBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsT0FBQSxLQUFBLFVBQUEsVUFBQSxLQUFBLFNBQUEsS0FBQSxPQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEtBQUEsS0FBQSxPQUFBLE1BQUEsSUFBQSxLQUFBLE9BQUE7O0lBRUEsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLGlCQUFBLEtBQUEsUUFBQSxLQUFBO0tBQ0EsS0FBQSxTQUFBLE1BQUE7S0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLE1BQUEsWUFBQTtNQUNBLEdBQUEsS0FBQTtZQUNBLElBQUEsT0FBQSxNQUFBLFlBQUE7TUFDQSxHQUFBOzs7O0VBSUEsS0FBQSxlQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxZQUFBO0lBQ0EsS0FBQTtJQUNBLE9BQUE7O0dBRUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUE7SUFDQSxJQUFBLE9BQUEsS0FBQSxVQUFBLFVBQUEsS0FBQSxTQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsT0FBQSxRQUFBLEtBQUE7S0FDQSxLQUFBLEtBQUEsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOztJQUVBLE1BQUE7O0dBRUEsTUFBQSxLQUFBLFVBQUEsT0FBQSxrQkFBQSxNQUFBO0dBQ0EsS0FBQSxTQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBOzs7O0VBSUEsS0FBQSxTQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLENBQUEsS0FBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFlBQUEsTUFBQSxLQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxRQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTtNQUNBLElBQUEsS0FBQSxRQUFBLE1BQUEsR0FBQSxPQUFBLElBQUEsS0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLE9BQUEsR0FBQTtPQUNBOzs7S0FHQSxPQUFBLEtBQUEsUUFBQSxNQUFBLElBQUE7S0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7TUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO09BQ0EsSUFBQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxPQUFBLEdBQUEsS0FBQSxJQUFBLEtBQUE7U0FDQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxLQUFBO1VBQ0EsS0FBQSxRQUFBLE1BQUEsS0FBQSxPQUFBLE9BQUEsR0FBQTs7Ozs7O0tBTUEsR0FBQSxLQUFBLE9BQUEsTUFBQSxNQUFBO01BQ0EsSUFBQSxJQUFBLE9BQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtPQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLEtBQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxLQUFBLEdBQUEsT0FBQSxJQUFBLEtBQUE7U0FDQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsR0FBQTtTQUNBOzs7Ozs7SUFNQSxJQUFBLFFBQUEsT0FBQSxNQUFBLFlBQUE7S0FDQSxHQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQTs7OztFQUlBLEtBQUEsTUFBQSxTQUFBLElBQUE7R0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0dBQ0EsTUFBQSxJQUFBLGNBQUEsS0FBQSxTQUFBLE1BQUE7SUFDQSxHQUFBLEtBQUE7OztFQUdBLEtBQUEsUUFBQSxTQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsS0FBQSxPQUFBO0dBQ0EsR0FBQSxNQUFBLFFBQUEsTUFBQTtVQUNBLE9BQUEsS0FBQTtlQUNBLEdBQUEsT0FBQSxRQUFBLFNBQUE7VUFDQSxHQUFBLEtBQUEsS0FBQSxPQUFBLENBQUEsS0FBQTtVQUNBLElBQUEsUUFBQTtVQUNBLElBQUEsSUFBQSxPQUFBLEtBQUE7V0FDQSxHQUFBLEtBQUEsTUFBQSxNQUFBLEtBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTs7VUFFQSxPQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsRUFBQSxHQUFBO0lBQ0EsSUFBQSxLQUFBLElBQUEsS0FBQSxLQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7RUFFQSxLQUFBLGFBQUEsU0FBQSxLQUFBLElBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxNQUFBLGNBQUEsT0FBQSxPQUFBLFVBQUE7SUFDQSxTQUFBLE9BQUEsSUFBQTtJQUNBLElBQUEsZ0JBQUEsU0FBQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsV0FBQSxLQUFBLFdBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLE1BQUE7R0FDQSxJQUFBLEtBQUEsV0FBQSxPQUFBO0lBQ0EsUUFBQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsTUFBQSxRQUFBLFFBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUEsTUFBQSxJQUFBOztLQUVBO1dBQ0EsSUFBQSxNQUFBLFFBQUEsT0FBQSxDQUFBLEdBQUE7S0FDQSxRQUFBLE1BQUEsTUFBQTtLQUNBLElBQUEsTUFBQSxNQUFBO0tBQ0EsSUFBQSxPQUFBLElBQUEsUUFBQSxVQUFBO0tBQ0EsT0FBQSxTQUFBLElBQUEsTUFBQSxNQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE1BQUEsUUFBQSxJQUFBLFNBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO01BQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUEsS0FBQTtPQUNBLElBQUEsT0FBQSxLQUFBLEtBQUEsUUFBQSxNQUFBLElBQUEsT0FBQTthQUNBO09BQ0EsSUFBQSxPQUFBLE9BQUEsR0FBQTs7O0tBR0E7V0FDQSxJQUFBLE9BQUEsSUFBQSxVQUFBLFVBQUE7S0FDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxXQUFBO1dBQ0E7VUFDQTtJQUNBLFNBQUEsV0FBQTtLQUNBLFNBQUEsS0FBQSxPQUFBO09BQ0E7O0dBRUEsUUFBQSxJQUFBLEtBQUEsUUFBQTs7RUFFQSxJQUFBLEtBQUEsS0FBQSxLQUFBLFNBQUEsT0FBQSxJQUFBO0dBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtJQUNBLFFBQUEsTUFBQSxNQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsS0FBQTtJQUNBLElBQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLFdBQUE7TUFDQSxHQUFBLE9BQUE7UUFDQTs7O0dBR0E7Ozs7Ozs7O0VBUUEsS0FBQSxRQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxDQUFBLE1BQUEsUUFBQSxNQUFBLEdBQUE7UUFDQSxHQUFBOztFQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUEsTUFBQSxRQUFBLE1BQUE7SUFDQSxNQUFBOztHQUVBLEdBQUE7O0VBRUEsS0FBQSxTQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxJQUFBLEtBQUE7O0VBRUEsS0FBQSxXQUFBLFNBQUEsS0FBQSxHQUFBO0dBQ0EsR0FBQSxPQUFBLE9BQUEsU0FBQTtJQUNBLE1BQUE7O0dBRUEsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLGNBQUEsU0FBQSxLQUFBLEdBQUEsRUFBQSxHQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsS0FBQSxJQUFBLElBQUE7R0FDQSxPQUFBLElBQUEsS0FBQSxTQUFBLElBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQSxJQUFBOzs7OztFQUtBLElBQUEsVUFBQSxTQUFBLEtBQUEsT0FBQSxLQUFBLE1BQUE7R0FDQSxJQUFBLE1BQUEsUUFBQSxPQUFBLENBQUEsR0FBQTtJQUNBLFFBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLElBQUEsU0FBQSxPQUFBLElBQUEsUUFBQSxZQUFBLE1BQUEsUUFBQSxJQUFBO0tBQ0E7SUFDQSxJQUFBLENBQUEsSUFBQSxNQUFBLElBQUEsT0FBQTtJQUNBLE9BQUEsUUFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLE1BQUEsS0FBQTs7R0FFQSxJQUFBLE9BQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxJQUFBLFFBQUEsU0FBQSxVQUFBO0tBQ0EsSUFBQSxTQUFBO09BQ0E7OztFQUdBLElBQUEsT0FBQSxTQUFBLE1BQUEsS0FBQTtHQUNBLEdBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxNQUFBO0dBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxTQUFBO0lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQSxTQUFBLE1BQUEsU0FBQTtLQUNBLFFBQUEsS0FBQSxLQUFBLEtBQUEsU0FBQSxNQUFBLFFBQUEsTUFBQTs7O0dBR0EsR0FBQSxLQUFBLE9BQUEsTUFBQSxTQUFBO0lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsR0FBQSxNQUFBLFFBQUEsR0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsRUFBQSxHQUFBLFNBQUEsRUFBQSxHQUFBLEtBQUE7T0FDQSxTQUFBLEtBQUEsRUFBQSxHQUFBLE9BQUEsRUFBQSxHQUFBOzs7VUFHQSxHQUFBLE9BQUEsS0FBQSxZQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUE7S0FDQSxTQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7OztHQUdBLEtBQUEsUUFBQSxNQUFBLEtBQUE7R0FDQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUE7R0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO0tBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxVQUFBLGNBQUEsRUFBQSxPQUFBLE1BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxTQUFBLGNBQUEsQ0FBQSxFQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsQ0FBQSxLQUFBLFFBQUEsTUFBQSxLQUFBO01BQ0EsS0FBQSxRQUFBLE1BQUEsT0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxNQUFBO01BQ0EsR0FBQSxDQUFBLE9BQUE7TUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsUUFBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsU0FBQTs7TUFFQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsS0FBQTtNQUNBLEdBQUEsT0FBQSxFQUFBLFFBQUEsV0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxLQUFBLEVBQUE7OztLQUdBLElBQUEsRUFBQSxNQUFBLEtBQUEsU0FBQSxNQUFBO01BQ0EsSUFBQTs7OztHQUlBLEdBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsT0FBQSxNQUFBLE1BQUE7S0FDQSxJQUFBLFFBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFVBQUEsY0FBQSxNQUFBLE9BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsY0FBQSxDQUFBLE1BQUEsTUFBQSxNQUFBO0tBQ0EsR0FBQSxDQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUE7TUFDQSxLQUFBLFFBQUEsTUFBQSxPQUFBOztNQUVBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFFBQUEsV0FBQTtNQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQSxNQUFBOzs7OztFQUtBLElBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxHQUFBO0dBQ0EsTUFBQSxJQUFBLFVBQUEsT0FBQSxRQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxLQUFBLFFBQUEsS0FBQTtNQUNBLEtBQUEsTUFBQSxLQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLE1BQUE7TUFDQSxHQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsTUFBQSxJQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBOztJQUVBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsY0FBQTtLQUNBLFFBQUEsb0NBQUEsU0FBQSxVQUFBLFlBQUE7UUFDQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLE9BQUEsU0FBQSxNQUFBLFFBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxXQUFBLENBQUEsT0FBQSxlQUFBLENBQUEsT0FBQTtnQkFDQSxPQUFBLFFBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSw2Q0FBQSxDQUFBLEtBQUEsVUFBQSxTQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUEsWUFBQSxDQUFBLEtBQUEsVUFBQSxPQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxTQUFBLE9BQUE7aUJBQ0EsSUFBQSxPQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsT0FBQSxjQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLElBQUEsT0FBQSxRQUFBLFFBQUEsVUFBQSxLQUFBLFFBQUEsR0FBQTtZQUNBLEtBQUEsT0FBQSxTQUFBLFFBQUEsUUFBQSxRQUFBO1lBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLFNBQUE7O1FBRUEsVUFBQSxpQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxVQUFBO1lBQ0EsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxNQUFBOztnQkFFQSxPQUFBLE9BQUEsU0FBQSxPQUFBOztvQkFFQSxNQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUEsUUFBQTs7OztZQUlBLGFBQUE7O1FBRUEsVUFBQSxtQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsTUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxRQUFBLE9BQUEsT0FBQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7d0JBQ0EsUUFBQSxJQUFBO3dCQUNBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE1BQUEsT0FBQTs7d0JBRUEsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsY0FBQSxNQUFBLE9BQUEsS0FBQSxjQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBOzBCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE1BQUEsT0FBQSxjQUFBLE1BQUEsT0FBQSxLQUFBLGNBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O3dCQUVBO29CQUNBO3dCQUNBLE9BQUEsS0FBQSxRQUFBOztnQkFFQSxPQUFBLENBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQSxLQUFBOztnQkFFQSxLQUFBLFVBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE9BQUEsS0FBQTs7b0JBRUEsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsZ0JBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxnQkFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsUUFBQSxTQUFBLGdCQUFBLGVBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxlQUFBLE9BQUEsS0FBQTs7OztvQkFJQSxRQUFBLElBQUE7b0JBQ0EsUUFBQSxJQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxRQUFBLElBQUE7OztvQkFHQSxJQUFBLFFBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFFBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLEtBQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsSUFBQSxPQUFBO3dCQUNBLE9BQUEsT0FBQSxNQUFBOzJCQUNBLElBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLE1BQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsT0FBQSxPQUFBLE1BQUE7b0JBQ0EsS0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBLFFBQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLFdBQUE7O0FBRUEsUUFBQSxPQUFBLGlCQUFBLElBQUEsK0JBQUEsU0FBQSxZQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7Q0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsNEJBQUE7SUFDQSxRQUFBLFVBQUEsVUFBQTtDQUNBO0NBQ0EsR0FBQSxPQUFBLE1BQUEsVUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBLE9BQUEsU0FBQTtDQUNBLElBQUEsU0FBQSxHQUFBLFFBQUE7Q0FDQSxPQUFBO0dBQ0EsUUFBQSxxQkFBQSxTQUFBLFNBQUE7Q0FDQTtDQUNBLElBQUEsT0FBQTtDQUNBLEtBQUEsTUFBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsV0FBQTtHQUNBLFNBQUEsVUFBQTtJQUNBLEtBQUEsSUFBQSxNQUFBO01BQ0E7T0FDQTtHQUNBLEtBQUEsU0FBQSxNQUFBOzs7SUFHQSxhQUFBLFVBQUEsTUFBQTtDQUNBO0NBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxTQUFBLFVBQUEsR0FBQTtFQUNBLEtBQUEsTUFBQSxFQUFBOztJQUVBLFFBQUEscUJBQUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBO0NBQ0EsSUFBQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLE9BQUE7RUFDQSxhQUFBO0VBQ0EsT0FBQTtFQUNBLFNBQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLE9BQUE7RUFDQSxlQUFBO0VBQ0EsYUFBQTtFQUNBLFVBQUE7RUFDQSxXQUFBO0VBQ0EsYUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLFVBQUE7RUFDQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsbUJBQUE7RUFDQSxvQkFBQTtFQUNBLGNBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLE9BQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLE9BQUE7RUFDQSxPQUFBO0VBQ0EsWUFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0VBQ0EsY0FBQTtFQUNBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOztDQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxRQUFBLEtBQUE7R0FDQSxHQUFBLElBQUEsR0FBQSxPQUFBLE1BQUEsU0FBQSxJQUFBLEdBQUE7OztDQUdBLEtBQUEsS0FBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxNQUFBLFlBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUEsT0FBQSxDQUFBO0VBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxLQUFBO0dBQ0EsR0FBQSxPQUFBLE1BQUEsS0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLEtBQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUE7Ozs7O0lBS0EsUUFBQSxPQUFBLFVBQUE7Q0FDQTtDQUNBLEtBQUEsZ0JBQUEsU0FBQSxNQUFBLFNBQUE7RUFDQSxJQUFBLElBQUEsSUFBQTtFQUNBLEVBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxTQUFBLEVBQUEsT0FBQTs7RUFFQSxFQUFBLGNBQUE7O0NBRUEsS0FBQSxhQUFBLFNBQUEsTUFBQSxTQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLFFBQUEsSUFBQTtFQUNBLEtBQUEsUUFBQSxLQUFBLFNBQUE7RUFDQSxLQUFBLFNBQUEsS0FBQSxVQUFBO0VBQ0EsR0FBQSxLQUFBLEtBQUEsTUFBQSxnQkFBQSxLQUFBLEtBQUEsTUFBQTtHQUNBLE9BQUEsUUFBQSxJQUFBO0VBQ0EsSUFBQSxTQUFBLElBQUE7RUFDQSxPQUFBLFNBQUEsVUFBQSxXQUFBO0dBQ0EsSUFBQSxnQkFBQSxTQUFBLGNBQUE7R0FDQSxJQUFBLGVBQUEsU0FBQSxjQUFBO0dBQ0EsYUFBQSxTQUFBLFdBQUE7SUFDQSxJQUFBLFlBQUEsS0FBQSxRQUFBLEtBQUE7SUFDQSxJQUFBLFdBQUEsYUFBQSxRQUFBLGFBQUE7SUFDQSxJQUFBLFdBQUEsV0FBQTtLQUNBLFFBQUEsS0FBQTtLQUNBLFNBQUEsUUFBQTtXQUNBO0tBQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxTQUFBOztJQUVBLGNBQUEsUUFBQTtJQUNBLGNBQUEsU0FBQTtJQUNBLElBQUEsVUFBQSxjQUFBLFdBQUE7SUFDQSxRQUFBLFVBQUEsY0FBQSxHQUFBLElBQUEsT0FBQTtJQUNBLFNBQUEsY0FBQSxVQUFBLGFBQUE7O0dBRUEsYUFBQSxNQUFBLFVBQUEsT0FBQTs7RUFFQSxPQUFBLGNBQUEsS0FBQTs7R0FFQSxRQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsS0FBQSxNQUFBLFNBQUEsSUFBQTtFQUNBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsSUFBQSxJQUFBLE9BQUEsSUFBQTtHQUNBLEdBQUEsSUFBQSxNQUFBLE9BQUEsU0FBQSxNQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Q0FJQSxLQUFBLE1BQUEsVUFBQTtFQUNBLElBQUEsT0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUE7RUFDQSxPQUFBLEtBQUEsUUFBQSxLQUFBLElBQUEsTUFBQTtFQUNBLEtBQUE7RUFDQSxJQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7R0FDQSxLQUFBLEtBQUEsS0FBQSxHQUFBLE1BQUE7R0FDQSxFQUFBLEtBQUEsR0FBQSxNQUFBLEtBQUEsR0FBQTs7RUFFQSxPQUFBOzs7QUFHQSxRQUFBLE9BQUEsZ0JBQUE7S0FDQSxRQUFBLG1DQUFBLFNBQUEsVUFBQSxZQUFBO1FBQ0E7Ozs7UUFJQSxJQUFBLE9BQUE7UUFDQSxLQUFBLFdBQUE7UUFDQSxLQUFBLFFBQUEsU0FBQSxJQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7Z0JBQ0EsSUFBQSxLQUFBLFNBQUEsR0FBQSxNQUFBLElBQUE7b0JBQ0EsS0FBQSxTQUFBLEdBQUEsR0FBQTtvQkFDQSxLQUFBLFNBQUEsT0FBQSxHQUFBO29CQUNBOzs7OztRQUtBLEtBQUEsT0FBQSxTQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBO1lBQ0EsSUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLEtBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxJQUFBLEtBQUE7WUFDQSxJQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7aUJBQ0EsSUFBQSxJQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsSUFBQSxjQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLFNBQUE7O2FBRUEsUUFBQSxJQUFBLElBQUE7bUJBQ0E7YUFDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7SUFDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtJQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOztZQUVBLE9BQUEsSUFBQTs7UUFFQSxVQUFBLGlCQUFBLFNBQUEsTUFBQTtRQUNBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBOztZQUVBLE1BQUEsU0FBQSxPQUFBLElBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsU0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxRQUFBLFNBQUEsR0FBQSxNQUFBLE1BQUEsSUFBQTt3QkFDQSxRQUFBLFNBQUEsR0FBQSxLQUFBOzs7O1lBSUEsYUFBQTs7O0FBR0EsUUFBQSxPQUFBLDBCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsMEJBQUE7O0FBRUEsUUFBQSxPQUFBLDhCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsOEJBQUE7O0FBRUEsUUFBQSxPQUFBLHlCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEseUJBQUE7O0FBRUEsUUFBQSxPQUFBLDZCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsNkJBQUE7O0FBRUEsUUFBQSxPQUFBLG1CQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsbUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHVCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsdUJBQUE7SUFDQSIsImZpbGUiOiJ3Y29tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoXCJ3Y29tXCIsIFtcImFuZ3VsYXItY2xpY2stb3V0c2lkZVwiLCBcIndjb21fZGV2XCIsIFwid2NvbV9kaXJlY3RpdmVzXCIsIFwid2NvbV9maWx0ZXJzXCIsIFwid2NvbV9tb2RhbFwiLCBcIndjb21fbW9uZ29cIiwgXCJ3Y29tX3BvcHVwXCIsIFwid2NvbV9zZFwiLCBcIndjb21fc2VydmljZXNcIiwgXCJ3Y29tX3NwaW5uZXJcIiwgXCJ3Y29tX3dtb2RhZXJhdG9ycy5odG1sXCIsIFwid2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWxcIiwgXCJ3Y29tX3dtb2RlcmF0b3JzLmh0bWxcIiwgXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFwid2NvbV93dGFncy5odG1sXCIsIFwid21vZGFsX21vZGFsLmh0bWxcIiwgXCJ3bW9kYWxfcG9wdXAuaHRtbFwiLCBcIndtb2RhbF9zcGlubmVyLmh0bWxcIl0pO1xuLypnbG9iYWwgYW5ndWxhciwgbmF2aWdhdG9yKi9cblxuKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYW5ndWxhci1jbGljay1vdXRzaWRlJywgW10pXG4gICAgICAgIC5kaXJlY3RpdmUoJ2NsaWNrT3V0c2lkZScsIFtcbiAgICAgICAgICAgICckZG9jdW1lbnQnLCAnJHBhcnNlJywgJyR0aW1lb3V0JyxcbiAgICAgICAgICAgIGNsaWNrT3V0c2lkZVxuICAgICAgICBdKTtcblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAgICAgKiBAbmFtZSBhbmd1bGFyLWNsaWNrLW91dHNpZGUuZGlyZWN0aXZlOmNsaWNrT3V0c2lkZVxuICAgICAqIEBkZXNjcmlwdGlvbiBEaXJlY3RpdmUgdG8gYWRkIGNsaWNrIG91dHNpZGUgY2FwYWJpbGl0aWVzIHRvIERPTSBlbGVtZW50c1xuICAgICAqIEByZXF1aXJlcyAkZG9jdW1lbnRcbiAgICAgKiBAcmVxdWlyZXMgJHBhcnNlXG4gICAgICogQHJlcXVpcmVzICR0aW1lb3V0XG4gICAgICoqL1xuICAgIGZ1bmN0aW9uIGNsaWNrT3V0c2lkZSgkZG9jdW1lbnQsICRwYXJzZSwgJHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbigkc2NvcGUsIGVsZW0sIGF0dHIpIHtcblxuICAgICAgICAgICAgICAgIC8vIHBvc3Rwb25lIGxpbmtpbmcgdG8gbmV4dCBkaWdlc3QgdG8gYWxsb3cgZm9yIHVuaXF1ZSBpZCBnZW5lcmF0aW9uXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSAoYXR0ci5vdXRzaWRlSWZOb3QgIT09IHVuZGVmaW5lZCkgPyBhdHRyLm91dHNpZGVJZk5vdC5zcGxpdCgvWyAsXSsvKSA6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm47XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZXZlbnRIYW5kbGVyKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIG91ciBlbGVtZW50IGFscmVhZHkgaGlkZGVuIGFuZCBhYm9ydCBpZiBzb1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuZWxlbWVudChlbGVtKS5oYXNDbGFzcyhcIm5nLWhpZGVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGNsaWNrIHRhcmdldCwgbm8gcG9pbnQgZ29pbmcgb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZSB8fCAhZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgYXZhaWxhYmxlIGVsZW1lbnRzLCBsb29raW5nIGZvciBjbGFzc2VzIGluIHRoZSBjbGFzcyBsaXN0IHRoYXQgbWlnaHQgbWF0Y2ggYW5kIHNvIHdpbGwgZWF0XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGVsZW1lbnQgPSBlLnRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBlbGVtZW50IGlzIHRoZSBzYW1lIGVsZW1lbnQgdGhlIGRpcmVjdGl2ZSBpcyBhdHRhY2hlZCB0byBhbmQgZXhpdCBpZiBzbyAocHJvcHMgQENvc3RpY2FQdW50YXJ1KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBlbGVtWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3cgd2UgaGF2ZSBkb25lIHRoZSBpbml0aWFsIGNoZWNrcywgc3RhcnQgZ2F0aGVyaW5nIGlkJ3MgYW5kIGNsYXNzZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGVsZW1lbnQuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMgPSBlbGVtZW50LmNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGNsYXNzTGlzdC5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbndyYXAgU1ZHQW5pbWF0ZWRTdHJpbmcgY2xhc3Nlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc05hbWVzICYmIGNsYXNzTmFtZXMuYmFzZVZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMgPSBjbGFzc05hbWVzLmJhc2VWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgYXJlIG5vIGNsYXNzIG5hbWVzIG9uIHRoZSBlbGVtZW50IGNsaWNrZWQsIHNraXAgdGhlIGNoZWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzTmFtZXMgfHwgaWQpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIGVsZW1lbnRzIGlkJ3MgYW5kIGNsYXNzbmFtZXMgbG9va2luZyBmb3IgZXhjZXB0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3ByZXBhcmUgcmVnZXggZm9yIGNsYXNzIHdvcmQgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBuZXcgUmVnRXhwKCdcXFxcYicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXGInKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGV4YWN0IG1hdGNoZXMgb24gaWQncyBvciBjbGFzc2VzLCBidXQgb25seSBpZiB0aGV5IGV4aXN0IGluIHRoZSBmaXJzdCBwbGFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChpZCAhPT0gdW5kZWZpbmVkICYmIHIudGVzdChpZCkpIHx8IChjbGFzc05hbWVzICYmIHIudGVzdChjbGFzc05hbWVzKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3cgbGV0J3MgZXhpdCBvdXQgYXMgaXQgaXMgYW4gZWxlbWVudCB0aGF0IGhhcyBiZWVuIGRlZmluZWQgYXMgYmVpbmcgaWdub3JlZCBmb3IgY2xpY2tpbmcgb3V0c2lkZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgaGF2ZSBnb3QgdGhpcyBmYXIsIHRoZW4gd2UgYXJlIGdvb2QgdG8gZ28gd2l0aCBwcm9jZXNzaW5nIHRoZSBjb21tYW5kIHBhc3NlZCBpbiB2aWEgdGhlIGNsaWNrLW91dHNpZGUgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiA9ICRwYXJzZShhdHRyWydjbGlja091dHNpZGUnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm4oJHNjb3BlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBkZXZpY2VzIGhhcyBhIHRvdWNoc2NyZWVuLCBsaXN0ZW4gZm9yIHRoaXMgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9oYXNUb3VjaCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGV2ZW50SGFuZGxlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc3RpbGwgbGlzdGVuIGZvciB0aGUgY2xpY2sgZXZlbnQgZXZlbiBpZiB0aGVyZSBpcyB0b3VjaCB0byBjYXRlciBmb3IgdG91Y2hzY3JlZW4gbGFwdG9wc1xuICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub24oJ2NsaWNrJywgZXZlbnRIYW5kbGVyKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBzY29wZSBpcyBkZXN0cm95ZWQsIGNsZWFuIHVwIHRoZSBkb2N1bWVudHMgZXZlbnQgaGFuZGxlcnMgYXMgd2UgZG9uJ3Qgd2FudCBpdCBoYW5naW5nIGFyb3VuZFxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9oYXNUb3VjaCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGRvY3VtZW50Lm9mZigndG91Y2hzdGFydCcsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRkb2N1bWVudC5vZmYoJ2NsaWNrJywgZXZlbnRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBQcml2YXRlIGZ1bmN0aW9uIHRvIGF0dGVtcHQgdG8gZmlndXJlIG91dCBpZiB3ZSBhcmUgb24gYSB0b3VjaCBkZXZpY2VcbiAgICAgICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICoqL1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfaGFzVG91Y2goKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3b3JrcyBvbiBtb3N0IGJyb3dzZXJzLCBJRTEwLzExIGFuZCBTdXJmYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IHx8IG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59KSgpO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX2RldlwiLCBbXSkucnVuKFtmdW5jdGlvbigkaHR0cCl7XHJcblx0dmFyIHVwZGF0ZTtcclxuXHR2YXIgY2hlY2tfcmVmcmVzaCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdCRodHRwLmdldCgnL3dhdy9sYXN0X3VwZGF0ZScpLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcblx0XHRcdFx0aWYocmVzcC5kYXRhICE9IHVwZGF0ZSl7XHJcblx0XHRcdFx0XHRsb2NhdGlvbi5yZWxvYWQoKTtcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdGNoZWNrX3JlZnJlc2goKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSwgMjAwMCk7XHJcblx0fVxyXG5cdCRodHRwLmdldCgnL3dhdy9sYXN0X3VwZGF0ZScpLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcblx0XHRpZihyZXNwLmRhdGEpe1xyXG5cdFx0XHR1cGRhdGUgPSByZXNwLmRhdGE7XHJcblx0XHRcdGNoZWNrX3JlZnJlc2goKTtcclxuXHRcdH1cclxuXHR9KTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX2RpcmVjdGl2ZXNcIiwgW10pXG4uZGlyZWN0aXZlKCdwdWxsZmlsZXMnLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybntcblx0XHRyZXN0cmljdDogJ0UnLCBzY29wZTogdHJ1ZSwgcmVwbGFjZTogdHJ1ZSxcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsIGltZywgJHRpbWVvdXQsIGZpbGUpe1xuXHRcdFx0dmFyIGlucHV0cyA9ICRzY29wZS5pbnB1dHMgPSBbXTtcblx0XHRcdGZpbGUuYWRkRGVsYXkgPSBmdW5jdGlvbihvcHRzLCBjYil7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYiAhPSAnZnVuY3Rpb24nIHx8ICFvcHRzLmlkKSByZXR1cm47XG5cdFx0XHRcdG9wdHMubXVsdGlwbGUgPSAhIW9wdHMubXVsdGlwbGU7XG5cdFx0XHRcdGlucHV0cy5wdXNoKG9wdHMpO1xuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdGlmKG9wdHMubXVsdGlwbGUpe1xuXHRcdFx0XHRcdFx0dmFyIGFkZEltYWdlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0XHRcdFx0XHRpbWcucmVzaXplVXBUbyh7XG5cdFx0XHRcdFx0XHRcdFx0ZmlsZTogZmlsZSxcblx0XHRcdFx0XHRcdFx0XHR3aWR0aDogb3B0cy53aWR0aHx8MTkyMCxcblx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IG9wdHMuaGVpZ2h0fHwxMDgwXG5cdFx0XHRcdFx0XHRcdH0sIGZ1bmN0aW9uKGRhdGFVcmwpIHtcblx0XHRcdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2IoZGF0YVVybCwgZmlsZSk7XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdHMuaWQpKVxuXHRcdFx0XHRcdFx0LmJpbmQoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2dCkge1xuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gZXZ0LmN1cnJlbnRUYXJnZXQgfHwgZXZ0LnRhcmdldDtcblx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQuZmlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRhZGRJbWFnZSh0YXJnZXQuZmlsZXNbaV0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRzLmlkKSlcblx0XHRcdFx0XHRcdC5iaW5kKCdjaGFuZ2UnLCBmdW5jdGlvbihldnQpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9IGV2dC5jdXJyZW50VGFyZ2V0IHx8IGV2dC50YXJnZXQ7XG5cdFx0XHRcdFx0XHRcdGltZy5yZXNpemVVcFRvKHtcblx0XHRcdFx0XHRcdFx0XHRmaWxlOiB0YXJnZXQuZmlsZXNbMF0sXG5cdFx0XHRcdFx0XHRcdFx0d2lkdGg6IG9wdHMud2lkdGh8fDE5MjAsXG5cdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBvcHRzLmhlaWdodHx8MTA4MFxuXHRcdFx0XHRcdFx0XHR9LCBmdW5jdGlvbihkYXRhVXJsKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0XHRcdGNiKGRhdGFVcmwsIHRhcmdldC5maWxlc1swXSk7XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAyNTApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dGVtcGxhdGU6ICc8aW5wdXQgbmctcmVwZWF0PVwiaSBpbiBpbnB1dHNcIiB0eXBlPVwiZmlsZVwiIG5nLWhpZGU9XCJ0cnVlXCIgaWQ9XCJ7e2kuaWR9fVwiIG11bHRpcGxlPVwie3tpLm11bHRpcGxlfX1cIj4nXG5cdH1cbn0pLmRpcmVjdGl2ZSgnZWxzaXplJywgZnVuY3Rpb24oJHRpbWVvdXQsICR3aW5kb3cpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0c2NvcGU6IHtcblx0XHRcdGVsc2l6ZTogJz0nXG5cdFx0fSwgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsKXtcblx0XHRcdGlmKCFzY29wZS5lbHNpemUpIHNjb3BlLmVsc2l6ZT17fTtcblx0XHRcdHZhciByZXNpemUgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRzY29wZS5lbHNpemUud2lkdGggPSBlbFswXS5jbGllbnRXaWR0aDtcblx0XHRcdFx0c2NvcGUuZWxzaXplLmhlaWdodCA9IGVsWzBdLmNsaWVudEhlaWdodDtcblx0XHRcdFx0JHRpbWVvdXQoKTtcblx0XHRcdH1cblx0XHRcdHJlc2l6ZSgpO1xuXHRcdFx0YW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIHJlc2l6ZSk7XG5cdFx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRyZXR1cm4gW2VsWzBdLmNsaWVudFdpZHRoLCBlbFswXS5jbGllbnRIZWlnaHRdLmpvaW4oJ3gnKTtcblx0XHRcdH0sZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRcdGlmKHZhbHVlLnNwbGl0KCd4JylbMF0+MCkgc2NvcGUuZWxzaXplLndpZHRoID0gdmFsdWUuc3BsaXQoJ3gnKVswXTtcblx0XHRcdFx0aWYodmFsdWUuc3BsaXQoJ3gnKVsxXT4wKSBzY29wZS5lbHNpemUuaGVpZ2h0ID0gdmFsdWUuc3BsaXQoJ3gnKVsxXTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufSkuZGlyZWN0aXZlKCd3dGFncycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0c2NvcGU6IHtcblx0XHRcdG9iamVjdDogJz0nLFxuXHRcdFx0bW9kZWw6ICdAJyxcblx0XHRcdGNoYW5nZTogJyYnXG5cdFx0fSwgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlKXtcblx0XHRcdCRzY29wZS50YWdzID0gJGZpbHRlcigndG9BcnInKSgkc2NvcGUub2JqZWN0WyRzY29wZS5tb2RlbF0pO1xuXHRcdFx0JHNjb3BlLnVwZGF0ZV90YWdzID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0JHNjb3BlLm9iamVjdFskc2NvcGUubW9kZWxdID0gJHNjb3BlLnRhZ3Muam9pbignLCAnKTtcblx0XHRcdFx0aWYodHlwZW9mICRzY29wZS5jaGFuZ2UgPT0gJ2Z1bmN0aW9uJykgJHNjb3BlLmNoYW5nZSgpO1xuXHRcdFx0fVxuXHRcdFx0JHNjb3BlLmVudGVyID0gZnVuY3Rpb24oZSl7XG5cdFx0XHRcdGlmKGUua2V5Q29kZT09MTMpe1xuXHRcdFx0XHRcdGlmKCRzY29wZS5uZXdfdGFnKXtcblx0XHRcdFx0XHRcdCRzY29wZS50YWdzLnB1c2goJHNjb3BlLm5ld190YWcpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnVwZGF0ZV90YWdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCRzY29wZS5uZXdfdGFnID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIHRlbXBsYXRlVXJsOiAnd2NvbV93dGFncy5odG1sJ1xuXHR9XG59KS5kaXJlY3RpdmUoJ3dtb2RhZXJhdG9ycycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0c2NvcGU6IHtcblx0XHRcdGFycjogJz0nLFxuXHRcdFx0dXNlcnM6ICc9Jyxcblx0XHRcdGhvbGRlcjogJ0AnLFxuXHRcdFx0Y2hhbmdlOiAnJidcblx0XHR9LCB0ZW1wbGF0ZVVybDogJ3djb21fd21vZGFlcmF0b3JzLmh0bWwnXG5cdH1cbn0pLmRpcmVjdGl2ZSgnd21vZGFlcmF0b3JzdmlldycsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0c2NvcGU6IHtcblx0XHRcdGFycjogJz0nXG5cdFx0fSwgdGVtcGxhdGVVcmw6ICd3Y29tX3dtb2RhZXJhdG9yc3ZpZXcuaHRtbCdcblx0fVxufSk7XG5TdHJpbmcucHJvdG90eXBlLnJBbGwgPSBmdW5jdGlvbihzZWFyY2gsIHJlcGxhY2VtZW50KSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXM7XG4gICAgcmV0dXJuIHRhcmdldC5zcGxpdChzZWFyY2gpLmpvaW4ocmVwbGFjZW1lbnQpO1xufTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9maWx0ZXJzXCIsIFtdKVxuLmZpbHRlcigndG9BcnInLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiBmdW5jdGlvbihzdHIsIGRpdil7XG5cdFx0aWYoIXN0cikgcmV0dXJuIFtdO1xuXHRcdHN0cj1zdHIuc3BsaXQoKGRpdnx8JywnKSsnICcpLmpvaW4oJywnKTtcblx0XHR2YXIgYXJyID0gc3RyLnNwbGl0KGRpdnx8JywnKTtcblx0XHRmb3IgKHZhciBpID0gYXJyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRpZighYXJyW2ldKSBhcnIuc3BsaWNlKGksIDEpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG59KS5maWx0ZXIoJ3JBcnInLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHJldHVybiBmdW5jdGlvbihvcmlnaW5fYXJyLCByZW1vdmVfYXJyKXtcblx0XHR2YXIgYXJyID0gb3JpZ2luX2Fyci5zbGljZSgpO1xuXHRcdGZvciAodmFyIGkgPSBhcnIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcmVtb3ZlX2Fyci5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihyZW1vdmVfYXJyW2pdLl9pZCA9PSBhcnJbaV0uX2lkKXtcblx0XHRcdFx0XHRhcnIuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBhcnI7XG5cdH1cbn0pLmZpbHRlcignbW9uZ29kYXRlJywgZnVuY3Rpb24oKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4gZnVuY3Rpb24oX2lkKXtcblx0XHRpZighX2lkKSByZXR1cm4gbmV3IERhdGUoKTtcblx0XHR2YXIgdGltZXN0YW1wID0gX2lkLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDAsOCk7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKHBhcnNlSW50KHRpbWVzdGFtcCwxNikqMTAwMCk7XG5cdH1cbn0pLmZpbHRlcignZml4bGluaycsIGZ1bmN0aW9uKCl7XG5cdFwibmdJbmplY3RcIjtcblx0cmV0dXJuIGZ1bmN0aW9uKGxpbmspe1xuXHRcdGlmKCFsaW5rfHxsaW5rLmluZGV4T2YoJy8vJyk+MCkgcmV0dXJuIGxpbms7XG5cdFx0ZWxzZSByZXR1cm4gJ2h0dHA6Ly8nK2xpbms7XG5cdH1cbn0pLmZpbHRlcignd2RhdGUnLCBmdW5jdGlvbigkZmlsdGVyKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4gZnVuY3Rpb24odGltZSwgYWRkWWVhciwgYWRkTW9udGgsIGFkZERheSl7XG5cdFx0dGltZSA9IG5ldyBEYXRlKHRpbWUpO1xuXHRcdGlmKGFkZFllYXIpe1xuXHRcdFx0dGltZS5zZXRGdWxsWWVhcih0aW1lLmdldEZ1bGxZZWFyKCkgKyBwYXJzZUludChhZGRZZWFyKSk7XG5cdFx0fVxuXHRcdGlmKGFkZE1vbnRoKXtcblx0XHRcdHRpbWUuc2V0TW9udGgodGltZS5nZXRNb250aCgpICsgcGFyc2VJbnQoYWRkTW9udGgpKTtcblx0XHR9XG5cdFx0aWYoYWRkRGF5KXtcblx0XHRcdHRpbWUuc2V0RGF0ZSh0aW1lLmdldERhdGUoKSArIHBhcnNlSW50KGFkZERheSkpO1xuXHRcdH1cblx0XHR2YXIgdGltZW1zID0gdGltZS5nZXRUaW1lKCk7XG5cdFx0dmFyIG5vd21zID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0dmFyIGRheW1zID0gbm93bXMgLSA4NjQwMDAwMDtcblx0XHRpZih0aW1lbXM+ZGF5bXMpe1xuXHRcdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAnaGg6bW0gYScpO1xuXHRcdH1cblx0XHR2YXIgeWVhcm1zID0gbm93bXMgLSAoMjYyODAwMDAwMCoxMik7XG5cdFx0aWYodGltZW1zPnllYXJtcyl7XG5cdFx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICdNTU0gZGQgaGg6bW0gYScpO1xuXHRcdH1cblx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICd5eXl5IE1NTSBkZCBoaDptbSBhJyk7XG5cdH1cbn0pLmZpbHRlcignbWVzc2FnZXRpbWUnLCBmdW5jdGlvbigkZmlsdGVyKXtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4gZnVuY3Rpb24odGltZSl7XG5cdFx0dGltZSA9IG5ldyBEYXRlKHRpbWUpO1xuXHRcdHZhciB0aW1lbXMgPSB0aW1lLmdldFRpbWUoKTtcblx0XHR2YXIgbm93bXMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHR2YXIgbWluYWdvID0gbm93bXMgLSA2MDAwMDtcblx0XHRpZih0aW1lbXM+bWluYWdvKSByZXR1cm4gJ0EgbWluIGFnby4nO1xuXHRcdHZhciBkYXltcyA9IG5vd21zIC0gODY0MDAwMDA7XG5cdFx0aWYodGltZW1zPmRheW1zKXtcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ2hoOm1tIGEnKTtcblx0XHR9XG5cdFx0dmFyIHllYXJtcyA9IG5vd21zIC0gKDI2MjgwMDAwMDAqMTIpO1xuXHRcdGlmKHRpbWVtcz55ZWFybXMpe1xuXHRcdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAnTU1NIGRkIGhoOm1tIGEnKTtcblx0XHR9XG5cdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAneXl5eSBNTU0gZGQgaGg6bW0gYScpO1xuXHR9XG59KTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9tb2RhbFwiLCBbXSlcbi5zZXJ2aWNlKCdtb2RhbCcsIGZ1bmN0aW9uKCRjb21waWxlLCAkcm9vdFNjb3BlKXtcblx0XCJuZ0luamVjdFwiO1xuXHQvKlxuXHQqXHRNb2RhbHNcblx0Ki9cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2VsZi5tb2RhbHMgPSBbXTtcblx0XHR0aGlzLm1vZGFsX2xpbmsgPSBmdW5jdGlvbihzY29wZSwgZWwpe1xuXHRcdFx0c2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYubW9kYWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYoc2VsZi5tb2RhbHNbaV0uaWQ9PXNjb3BlLmlkKXtcblx0XHRcdFx0XHRcdHNlbGYubW9kYWxzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZihzZWxmLm1vZGFscy5sZW5ndGggPT0gMCl7XG5cdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ25vc2Nyb2xsJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoc2NvcGUuY2IpIHNjb3BlLmNiKCk7XG5cdFx0XHRcdGVsLnJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLm1vZGFscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZihzZWxmLm1vZGFsc1tpXS5pZD09c2NvcGUuaWQpe1xuXHRcdFx0XHRcdHNlbGYubW9kYWxzW2ldLmNsb3NlID0gc2NvcGUuY2xvc2U7XG5cdFx0XHRcdFx0c2NvcGUuX2RhdGEgPSBzZWxmLm1vZGFsc1tpXTtcblx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBzZWxmLm1vZGFsc1tpXSl7XG5cdFx0XHRcdFx0XHRzY29wZVtrZXldID0gc2VsZi5tb2RhbHNbaV1ba2V5XTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5vcGVuID0gZnVuY3Rpb24ob2JqKXtcblx0XHRcdGlmKCFvYmogfHwgKCFvYmoudGVtcGxhdGVVcmwgJiYgIW9iai50ZW1wbGF0ZSkpIFxuXHRcdFx0XHRyZXR1cm4gY29uc29sZS53YXJuKCdQbGVhc2UgYWRkIHRlbXBsYXRlVXJsIG9yIHRlbXBsYXRlJyk7IFxuXHRcdFx0aWYoIW9iai5pZCkgb2JqLmlkID0gRGF0ZS5ub3coKTtcblx0XHRcdHZhciBtb2RhbCA9ICc8bW9kYWwgaWQ9XCInK29iai5pZCsnXCI+Jztcblx0XHRcdGlmKG9iai50ZW1wbGF0ZSkgbW9kYWwgKz0gb2JqLnRlbXBsYXRlO1xuXHRcdFx0ZWxzZSBpZihvYmoudGVtcGxhdGVVcmwpe1xuXHRcdFx0XHRtb2RhbCArPSAnPG5nLWluY2x1ZGUgc3JjPVwiJztcblx0XHRcdFx0bW9kYWwgKz0gXCInXCIrb2JqLnRlbXBsYXRlVXJsK1wiJ1wiO1xuXHRcdFx0XHRtb2RhbCArPSAnXCIgbmctY29udHJvbGxlcj1cIndwYXJlbnRcIj48L25nLWluY2x1ZGU+Jztcblx0XHRcdH1cblx0XHRcdG1vZGFsICs9ICc8L21vZGFsPic7XG5cdFx0XHRzZWxmLm1vZGFscy5wdXNoKG9iaik7XG5cdFx0XHR2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xuXHRcdFx0Ym9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KG1vZGFsKSkoJHJvb3RTY29wZSkpO1xuXHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykuYWRkQ2xhc3MoJ25vc2Nyb2xsJyk7XG5cdFx0fVxuXHQvKlxuXHQqXHRFbmQgb2Ygd21vZGFsXG5cdCovXG59KS5kaXJlY3RpdmUoJ21vZGFsJywgZnVuY3Rpb24obW9kYWwpIHtcblx0XCJuZ0luamVjdFwiO1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dHJhbnNjbHVkZTogdHJ1ZSxcblx0XHRzY29wZToge1xuXHRcdFx0aWQ6ICdAJ1xuXHRcdH0sIGxpbms6IG1vZGFsLm1vZGFsX2xpbmssIHRlbXBsYXRlVXJsOiAnd21vZGFsX21vZGFsLmh0bWwnXG5cdH07XG59KS5jb250cm9sbGVyKCd3cGFyZW50JywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCkge1xuXHRcIm5nSW5qZWN0XCI7XG5cdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0aWYoJHNjb3BlLiRwYXJlbnQuJHBhcmVudC5fZGF0YSl7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gJHNjb3BlLiRwYXJlbnQuJHBhcmVudC5fZGF0YSkge1xuXHRcdFx0XHQkc2NvcGVba2V5XSA9ICRzY29wZS4kcGFyZW50LiRwYXJlbnQuX2RhdGFba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoJHNjb3BlLiRwYXJlbnQuX2RhdGEpe1xuXHRcdFx0Zm9yICh2YXIga2V5IGluICRzY29wZS4kcGFyZW50Ll9kYXRhKSB7XG5cdFx0XHRcdCRzY29wZVtrZXldID0gJHNjb3BlLiRwYXJlbnQuX2RhdGFba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fbW9uZ29cIiwgW10pLnNlcnZpY2UoJ21vbmdvJywgZnVuY3Rpb24oJGh0dHAsICR0aW1lb3V0LCBzb2NrZXQpe1xuXHQvKlxuXHQqXHREYXRhIHdpbGwgYmUgc3RvcmFnZSBmb3IgYWxsIGluZm9ybWF0aW9uIHdlIGFyZSBwdWxsaW5nIGZyb20gd2F3IGNydWQuXG5cdCpcdGRhdGFbJ2FycicgKyBwYXJ0XSB3aWxsIGhvc3QgYWxsIGRvY3MgZnJvbSBjb2xsZWN0aW9uIHBhcnQgaW4gYXJyYXkgZm9ybVxuXHQqXHRkYXRhWydvYmonICsgcGFydF0gd2lsbCBob3N0IGFsbCBkb2NzIGZyb20gY29sbGVjdGlvbiBwYXJ0IGluIG9iamVjdCBmb3JtXG5cdCpcdFx0YW5kIGFsbCBncm91cHMgY29sbGVjaXRvbnMgcHJvdmlkZWRcblx0Klx0ZGF0YVsnb3B0cycgKyBwYXJ0XSB3aWxsIGhvc3Qgb3B0aW9ucyBmb3IgZG9jcyBmcm9tIGNvbGxlY3Rpb24gcGFydFxuXHQqXHRcdFdpbGwgYmUgaW5pdGlhbGl6ZWQgb25seSBpbnNpZGUgZ2V0XG5cdCpcdFx0V2lsbCBiZSB1c2VkIGluc2lkZSBwdXNoXG5cdCovXG5cdFx0dmFyIGRhdGEgPSB7fTtcblx0Lypcblx0Klx0d2F3IGNydWQgY29ubmVjdCBmdW5jdGlvbnNcblx0Ki9cblx0XHR0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKHBhcnQsIGRvYywgY2IpIHtcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IgPSBkb2M7XG5cdFx0XHRcdGRvYyA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvY3JlYXRlJywgZG9jIHx8IHt9KS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0aWYgKHJlc3AuZGF0YSkge1xuXHRcdFx0XHRcdHB1c2gocGFydCwgcmVzcC5kYXRhKTtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIGNiKHJlc3AuZGF0YSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYihmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbihwYXJ0LCBvcHRzLCBjYikge1xuXHRcdFx0aWYgKHR5cGVvZiBvcHRzID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IgPSBvcHRzO1xuXHRcdFx0XHRvcHRzID0ge307XG5cdFx0XHR9XG5cdFx0XHRpZihkYXRhWydsb2FkZWQnK3BhcnRdKXtcblx0XHRcdFx0aWYodHlwZW9mIGNiID09ICdmdW5jdGlvbicpe1xuXHRcdFx0XHRcdGNiKGRhdGFbJ2FycicgKyBwYXJ0XSwgZGF0YVsnb2JqJyArIHBhcnRdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZGF0YVsnYXJyJyArIHBhcnRdO1xuXHRcdFx0fVxuXHRcdFx0ZGF0YVsnYXJyJyArIHBhcnRdID0gW107XG5cdFx0XHRkYXRhWydvYmonICsgcGFydF0gPSB7fTtcblx0XHRcdGRhdGFbJ29wdHMnICsgcGFydF0gPSBvcHRzID0gb3B0cyB8fCB7fTtcblx0XHRcdGlmKG9wdHMucXVlcnkpe1xuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBvcHRzLnF1ZXJ5KXtcblx0XHRcdFx0XHRpZih0eXBlb2Ygb3B0cy5xdWVyeVtrZXldID09ICdmdW5jdGlvbicpe1xuXHRcdFx0XHRcdFx0b3B0cy5xdWVyeVtrZXldID0ge1xuXHRcdFx0XHRcdFx0XHRhbGxvdzogb3B0cy5xdWVyeVtrZXldXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihvcHRzLmdyb3Vwcyl7XG5cdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3VwcyA9PSAnc3RyaW5nJyl7XG5cdFx0XHRcdFx0b3B0cy5ncm91cHMgPSBvcHRzLmdyb3Vwcy5zcGxpdCgnICcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKEFycmF5LmlzQXJyYXkob3B0cy5ncm91cHMpKXtcblx0XHRcdFx0XHR2YXIgYXJyID0gb3B0cy5ncm91cHM7XG5cdFx0XHRcdFx0b3B0cy5ncm91cHMgPSB7fTtcblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0XHRcdGlmKHR5cGVvZiBhcnJbaV0gPT0gJ3N0cmluZycpe1xuXHRcdFx0XHRcdFx0XHRvcHRzLmdyb3Vwc1thcnJbaV1dID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1lbHNlIHtcblx0XHRcdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gYXJyW2ldKXtcblx0XHRcdFx0XHRcdFx0XHRvcHRzLmdyb3Vwc1trZXldID0gYXJyW2ldW2tleV07XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gb3B0cy5ncm91cHMpe1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldID09ICdib29sZWFuJyl7XG5cdFx0XHRcdFx0XHRpZihvcHRzLmdyb3Vwc1trZXldKXtcblx0XHRcdFx0XHRcdFx0b3B0cy5ncm91cHNba2V5XSA9IHtcblx0XHRcdFx0XHRcdFx0XHRmaWVsZDogZnVuY3Rpb24oZG9jKXtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBkb2Nba2V5XTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRkZWxldGUgb3B0cy5ncm91cHNba2V5XTtcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldICE9ICdvYmplY3QnKXtcblx0XHRcdFx0XHRcdGRlbGV0ZSBvcHRzLmdyb3Vwc1trZXldO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldLmZpZWxkICE9ICdmdW5jdGlvbicpe1xuXHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZ3JvdXBzW2tleV07XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdCRodHRwLmdldCgnL2FwaS8nICsgcGFydCArICcvZ2V0JykudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGlmIChyZXNwLmRhdGEpIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlc3AuZGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0cHVzaChwYXJ0LCByZXNwLmRhdGFbaV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpXG5cdFx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNiKGRhdGFbJ2FycicgKyBwYXJ0XSwgZGF0YVsnb2JqJyArIHBhcnRdLCBvcHRzLm5hbWV8fCcnLCByZXNwLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRhdGFbJ2xvYWRlZCcrcGFydF09IHRydWU7XG5cdFx0XHRcdGlmKG9wdHMubmV4dCl7XG5cdFx0XHRcdFx0bmV4dChwYXJ0LCBvcHRzLm5leHQsIGNiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gZGF0YVsnYXJyJyArIHBhcnRdO1xuXHRcdH07XG5cdFx0dGhpcy51cGRhdGVBbGwgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIG9wdHMsIGNiKSB7XG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYiA9IG9wdHM7XG5cdFx0XHRcdG9wdHMgPSB7fTtcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2Ygb3B0cyAhPSAnb2JqZWN0Jykgb3B0cyA9IHt9O1xuXHRcdFx0aWYgKG9wdHMuZmllbGRzKSB7XG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0cy5maWVsZHMgPT0gJ3N0cmluZycpIG9wdHMuZmllbGRzID0gb3B0cy5maWVsZHMuc3BsaXQoJyAnKTtcblx0XHRcdFx0dmFyIF9kb2MgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvcHRzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdF9kb2Nbb3B0cy5maWVsZHNbaV1dID0gZG9jW29wdHMuZmllbGRzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkb2MgPSBfZG9jO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvdXBkYXRlL2FsbCcgKyAob3B0cy5uYW1lIHx8ICcnKSwgZG9jKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0aWYgKHJlc3AuZGF0YSAmJiB0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Y2IocmVzcC5kYXRhKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjYihmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHR9O1xuXHRcdHRoaXMudXBkYXRlVW5pcXVlID0gZnVuY3Rpb24ocGFydCwgZG9jLCBvcHRzLCBjYikge1xuXHRcdFx0aWYgKCFvcHRzKSBvcHRzID0gJyc7XG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYiA9IG9wdHM7XG5cdFx0XHRcdG9wdHMgPSAnJztcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2Ygb3B0cyAhPSAnb2JqZWN0Jykgb3B0cyA9IHt9O1xuXHRcdFx0aWYgKG9wdHMuZmllbGRzKSB7XG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0cy5maWVsZHMgPT0gJ3N0cmluZycpIG9wdHMuZmllbGRzID0gb3B0cy5maWVsZHMuc3BsaXQoJyAnKTtcblx0XHRcdFx0dmFyIF9kb2MgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvcHRzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdF9kb2Nbb3B0cy5maWVsZHNbaV1dID0gZG9jW29wdHMuZmllbGRzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkb2MgPSBfZG9jO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvdW5pcXVlL2ZpZWxkJyArIG9wdHMsIGRvYykuXG5cdFx0XHR0aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2IocmVzcC5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKHBhcnQsIGRvYywgb3B0cywgY2IpIHtcblx0XHRcdGlmICghb3B0cykgb3B0cyA9ICcnO1xuXHRcdFx0aWYgKCFkb2MpIHJldHVybjtcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiID0gb3B0cztcblx0XHRcdFx0b3B0cyA9ICcnO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS8nICsgcGFydCArICcvZGVsZXRlJyArIG9wdHMsIGRvYykudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGlmIChyZXNwLmRhdGEgJiYgQXJyYXkuaXNBcnJheShkYXRhWydhcnInICsgcGFydF0pKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydhcnInICsgcGFydF0ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGlmIChkYXRhWydhcnInICsgcGFydF1baV0uX2lkID09IGRvYy5faWQpIHtcblx0XHRcdFx0XHRcdFx0ZGF0YVsnYXJyJyArIHBhcnRdLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhWydvYmonICsgcGFydF1bZG9jLl9pZF07XG5cdFx0XHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzKXtcblx0XHRcdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGFbJ29wdHMnK3BhcnRdLmdyb3Vwcyl7XG5cdFx0XHRcdFx0XHRcdGZvcih2YXIgZmllbGQgaW4gZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xuXHRcdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSBkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0ubGVuZ3RoLTE7IGkgPj0gMCA7IGktLSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXVtpXS5faWQgPT0gZG9jLl9pZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XG5cdFx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSBkYXRhWydvYmonICsgcGFydF1ba2V5XS5sZW5ndGgtMTsgaSA+PSAwIDsgaS0tKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ldLl9pZCA9PSBkb2MuX2lkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHJlc3AgJiYgdHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYihyZXNwLmRhdGEpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2IoZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdHRoaXMuX2lkID0gZnVuY3Rpb24oY2IpIHtcblx0XHRcdGlmICh0eXBlb2YgY2IgIT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xuXHRcdFx0JGh0dHAuZ2V0KCcvd2F3L25ld0lkJykudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGNiKHJlc3AuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdHRoaXMudG9faWQgPSBmdW5jdGlvbihkb2NzKSB7XG5cdFx0XHRpZiAoIWFycikgcmV0dXJuIFtdO1xuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShkb2NzKSl7XG5cdCAgICAgICAgXHRkb2NzID0gZG9jcy5zbGljZSgpO1xuXHQgICAgICAgIH1lbHNlIGlmKHR5cGVvZiBkb2NzID09ICdvYmplY3QnKXtcblx0ICAgICAgICBcdGlmKGRvY3MuX2lkKSByZXR1cm4gW2RvY3MuX2lkXTtcblx0ICAgICAgICBcdHZhciBfZG9jcyA9IFtdO1xuXHQgICAgICAgIFx0Zm9yKHZhciBrZXkgaW4gZG9jcyl7XG5cdCAgICAgICAgXHRcdGlmKGRvY3Nba2V5XSkgX2RvY3MucHVzaChkb2NzW2tleV0uX2lkfHxkb2NzW2tleV0pO1xuXHQgICAgICAgIFx0fVxuXHQgICAgICAgIFx0ZG9jcyA9IF9kb2NzO1xuXHQgICAgICAgIH1cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZG9jcy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRpZiAoZG9jc1tpXSkgZG9jc1tpXSA9IGRvY3NbaV0uX2lkIHx8IGRvY3NbaV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZG9jcztcblx0XHR9XG5cdFx0dGhpcy5hZnRlcldoaWxlID0gZnVuY3Rpb24oZG9jLCBjYiwgdGltZSkge1xuXHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkb2MgPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKGRvYy51cGRhdGVUaW1lb3V0KTtcblx0XHRcdFx0ZG9jLnVwZGF0ZVRpbWVvdXQgPSAkdGltZW91dChjYiwgdGltZSB8fCAxMDAwKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwb3B1bGF0ZSA9IHRoaXMucG9wdWxhdGUgPSBmdW5jdGlvbihkb2MsIGZpZWxkLCBwYXJ0KSB7XG5cdFx0XHRpZiAoIWRvYyB8fCAhZmllbGQgfHwgIXBhcnQpIHJldHVybjtcblx0XHRcdGlmIChkYXRhWydsb2FkZWQnICsgcGFydF0pIHtcblx0XHRcdFx0Y29uc29sZS5sb2coZGF0YVsnb2JqJyArIHBhcnRdKTtcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGQpKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0cG9wdWxhdGUoZG9jLCBmaWVsZFtpXSwgcGFydCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fSBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCcuJykgPiAtMSkge1xuXHRcdFx0XHRcdGZpZWxkID0gZmllbGQuc3BsaXQoJy4nKTtcblx0XHRcdFx0XHR2YXIgc3ViID0gZmllbGQuc2hpZnQoKTtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGRvY1tzdWJdICE9ICdvYmplY3QnKSByZXR1cm47XG5cdFx0XHRcdFx0cmV0dXJuIHBvcHVsYXRlKGRvY1tzdWJdLCBmaWVsZC5qb2luKCcuJyksIHBhcnQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGRvY1tmaWVsZF0pKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IGRvY1tmaWVsZF0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXVtpXV0pIHtcblx0XHRcdFx0XHRcdFx0ZG9jW2ZpZWxkXVtpXSA9IGRhdGFbJ29iaicgKyBwYXJ0XVtkb2NbZmllbGRdW2ldXVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZG9jW2ZpZWxkXS5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgZG9jW2ZpZWxkXSA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGRvY1tmaWVsZF0gPSBkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXV0gfHwgbnVsbDtcblx0XHRcdFx0fSBlbHNlIHJldHVybjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgZmllbGQsIHBhcnQpO1xuXHRcdFx0XHR9LCAyNTApO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5sb2coZGF0YVsnb2JqJyArIHBhcnRdKTtcblx0XHR9O1xuXHRcdHZhciBvbiA9IHRoaXMub24gPSBmdW5jdGlvbihwYXJ0cywgY2IpIHtcblx0XHRcdGlmICh0eXBlb2YgcGFydHMgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0cGFydHMgPSBwYXJ0cy5zcGxpdChcIiBcIik7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICghZGF0YVsnbG9hZGVkJyArIHBhcnRzW2ldXSkge1xuXHRcdFx0XHRcdHJldHVybiAkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdG9uKHBhcnRzLCBjYik7XG5cdFx0XHRcdFx0fSwgMTAwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2IoKTtcblx0XHR9O1xuXHQvKlxuXHQqXHRtb25nbyBzb3J0IGZpbHRlcnNcblx0Ki9cblx0Lypcblx0Klx0bW9uZ28gcmVwbGFjZSBmaWx0ZXJzXG5cdCovXG5cdFx0dGhpcy5iZUFyciA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheSh2YWwpKSBjYihbXSk7XG5cdFx0XHRlbHNlIGNiKHZhbCk7XG5cdFx0fTtcblx0XHR0aGlzLmJlT2JqID0gZnVuY3Rpb24odmFsLCBjYikge1xuXHRcdFx0aWYgKHR5cGVvZiB2YWwgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheSh2YWwpKSB7XG5cdFx0XHRcdHZhbCA9IHt9O1xuXHRcdFx0fVxuXHRcdFx0Y2IodmFsKTtcblx0XHR9O1xuXHRcdHRoaXMuYmVEYXRlID0gZnVuY3Rpb24odmFsLCBjYikge1xuXHRcdFx0Y2IoIG5ldyBEYXRlKHZhbCkgKTtcblx0XHR9O1xuXHRcdHRoaXMuYmVTdHJpbmcgPSBmdW5jdGlvbih2YWwsIGNiKXtcblx0XHRcdGlmKHR5cGVvZiB2YWwgIT0gJ3N0cmluZycpe1xuXHRcdFx0XHR2YWwgPSAnJztcblx0XHRcdH1cblx0XHRcdGNiKHZhbCk7XG5cdFx0fTtcblx0XHR0aGlzLmZvcmNlQXJyID0gZnVuY3Rpb24oY2IpIHtcblx0XHRcdGNiKFtdKTtcblx0XHR9O1xuXHRcdHRoaXMuZm9yY2VPYmogPSBmdW5jdGlvbihjYikge1xuXHRcdFx0Y2Ioe30pO1xuXHRcdH07XG5cdFx0dGhpcy5mb3JjZVN0cmluZyA9IGZ1bmN0aW9uKHZhbCwgY2IpeyBjYignJyk7IH07XG5cdFx0dGhpcy5nZXRDcmVhdGVkID0gZnVuY3Rpb24odmFsLCBjYiwgZG9jKXtcblx0XHRcdHJldHVybiBuZXcgRGF0ZShwYXJzZUludChkb2MuX2lkLnN1YnN0cmluZygwLDgpLCAxNikqMTAwMCk7XG5cdFx0fTtcblx0Lypcblx0Klx0bW9uZ28gbG9jYWwgc3VwcG9ydCBmdW5jdGlvbnNcblx0Ki9cblx0XHR2YXIgcmVwbGFjZSA9IGZ1bmN0aW9uKGRvYywgdmFsdWUsIHJwbCwgcGFydCkge1xuXHRcdFx0aWYgKHZhbHVlLmluZGV4T2YoJy4nKSA+IC0xKSB7XG5cdFx0XHRcdHZhbHVlID0gdmFsdWUuc3BsaXQoJy4nKTtcblx0XHRcdFx0dmFyIHN1YiA9IHZhbHVlLnNoaWZ0KCk7XG5cdFx0XHRcdGlmIChkb2Nbc3ViXSAmJiAodHlwZW9mIGRvY1tzdWJdICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoZG9jW3N1Yl0pKSlcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdGlmICghZG9jW3N1Yl0pIGRvY1tzdWJdID0ge307XG5cdFx0XHRcdHJldHVybiByZXBsYWNlKGRvY1tzdWJdLCB2YWx1ZS5qb2luKCcuJyksIHJwbCwgcGFydCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZW9mIHJwbCA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHJwbChkb2NbdmFsdWVdLCBmdW5jdGlvbihuZXdWYWx1ZSkge1xuXHRcdFx0XHRcdGRvY1t2YWx1ZV0gPSBuZXdWYWx1ZTtcblx0XHRcdFx0fSwgZG9jKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwdXNoID0gZnVuY3Rpb24ocGFydCwgZG9jKSB7XG5cdFx0XHRpZihkYXRhWydvYmonICsgcGFydF1bZG9jLl9pZF0pIHJldHVybjtcblx0XHRcdGlmIChkYXRhWydvcHRzJyArIHBhcnRdLnJlcGxhY2UpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGRhdGFbJ29wdHMnICsgcGFydF0ucmVwbGFjZSkge1xuXHRcdFx0XHRcdHJlcGxhY2UoZG9jLCBrZXksIGRhdGFbJ29wdHMnICsgcGFydF0ucmVwbGFjZVtrZXldLCBwYXJ0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoZGF0YVsnb3B0cycrcGFydF0ucG9wdWxhdGUpe1xuXHRcdFx0XHR2YXIgcCA9IGRhdGFbJ29wdHMnK3BhcnRdLnBvcHVsYXRlO1xuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KHApKXtcblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgcC5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgcCA9PSAnb2JqZWN0JyAmJiBwW2ldLmZpZWxkICYmIHBbaV0ucGFydCl7XG5cdFx0XHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgcFtpXS5maWVsZCwgcFtpXS5wYXJ0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZiBwID09ICdvYmplY3QnICYmIHAuZmllbGQgJiYgcC5wYXJ0KXtcblx0XHRcdFx0XHRwb3B1bGF0ZShkb2MsIHAuZmllbGQsIHAucGFydCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XS5wdXNoKGRvYyk7XG5cdFx0XHRkYXRhWydvYmonICsgcGFydF1bZG9jLl9pZF0gPSBkb2M7XG5cdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xuXHRcdFx0XHRcdHZhciBnID0gZGF0YVsnb3B0cycrcGFydF0uZ3JvdXBzW2tleV07XG5cdFx0XHRcdFx0aWYodHlwZW9mIGcuaWdub3JlID09ICdmdW5jdGlvbicgJiYgZy5pZ25vcmUoZG9jKSkgcmV0dXJuO1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBnLmFsbG93ID09ICdmdW5jdGlvbicgJiYgIWcuYWxsb3coZG9jKSkgcmV0dXJuO1xuXHRcdFx0XHRcdGlmKCFkYXRhWydvYmonICsgcGFydF1ba2V5XSl7XG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XSA9IHt9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgc2V0ICA9IGZ1bmN0aW9uKGZpZWxkKXtcblx0XHRcdFx0XHRcdGlmKCFmaWVsZCkgcmV0dXJuO1xuXHRcdFx0XHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdKSl7XG5cdFx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXSA9IFtdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV1bZmllbGRdLnB1c2goZG9jKTtcblx0XHRcdFx0XHRcdGlmKHR5cGVvZiBnLnNvcnQgPT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXS5zb3J0KGcuc29ydCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHNldChnLmZpZWxkKGRvYywgZnVuY3Rpb24oZmllbGQpe1xuXHRcdFx0XHRcdFx0c2V0KGZpZWxkKTtcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5KXtcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xuXHRcdFx0XHRcdHZhciBxdWVyeSA9IGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5W2tleV07XG5cdFx0XHRcdFx0aWYodHlwZW9mIHF1ZXJ5Lmlnbm9yZSA9PSAnZnVuY3Rpb24nICYmIHF1ZXJ5Lmlnbm9yZShkb2MpKSByZXR1cm47XG5cdFx0XHRcdFx0aWYodHlwZW9mIHF1ZXJ5LmFsbG93ID09ICdmdW5jdGlvbicgJiYgIXF1ZXJ5LmFsbG93KGRvYykpIHJldHVybjtcblx0XHRcdFx0XHRpZighZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xuXHRcdFx0XHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2tleV0gPSBbXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0IGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLnB1c2goZG9jKTtcblx0XHRcdFx0XHRpZih0eXBlb2YgcXVlcnkuc29ydCA9PSAnZnVuY3Rpb24nKXtcblx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLnNvcnQocXVlcnkuc29ydCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgbmV4dCA9IGZ1bmN0aW9uKHBhcnQsIG9wdHMsIGNiKXtcblx0XHRcdCRodHRwLmdldCgnL2FwaS8nICsgcGFydCArICcvZ2V0JykudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdGlmIChyZXNwLmRhdGEpIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlc3AuZGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0cHVzaChwYXJ0LCByZXNwLmRhdGFbaV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpXG5cdFx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNiKGRhdGFbJ2FycicgKyBwYXJ0XSwgZGF0YVsnb2JqJyArIHBhcnRdLCBvcHRzLm5hbWV8fCcnLCByZXNwLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKG9wdHMubmV4dCl7XG5cdFx0XHRcdFx0bmV4dChwYXJ0LCBvcHRzLm5leHQsIGNiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0Lypcblx0Klx0RW5kb2YgTW9uZ28gU2VydmljZVxuXHQqL1xufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fcG9wdXBcIiwgW10pXG4gICAgLnNlcnZpY2UoJ3BvcHVwJywgZnVuY3Rpb24oJGNvbXBpbGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgXCJuZ0luamVjdFwiO1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBldmVudDtcbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24oc2l6ZSwgY29uZmlnLCBldmVudCkge1xuICAgICAgICAgICAgaWYgKCFjb25maWcgfHwgKCFjb25maWcudGVtcGxhdGVVcmwgJiYgIWNvbmZpZy50ZW1wbGF0ZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybignUGxlYXNlIGFkZCB0ZW1wbGF0ZVVybCBvciB0ZW1wbGF0ZScpO1xuICAgICAgICAgICAgdmFyIHBvcHVwID0gJzxwb3B1cCBzdHlsZT1cInBvc2l0aW9uOiBmaXhlZDtcIiBjb25maWc9XCInICsgKEpTT04uc3RyaW5naWZ5KGNvbmZpZykpLnNwbGl0KCdcIicpLmpvaW4oXCInXCIpICsgJ1wic2l6ZT1cIicgKyAoSlNPTi5zdHJpbmdpZnkoc2l6ZSkpLnNwbGl0KCdcIicpLmpvaW4oXCInXCIpICsgJ1wiPic7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnRlbXBsYXRlKSBwb3B1cCArPSBjb25maWcudGVtcGxhdGU7XG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcudGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICBwb3B1cCArPSAnPG5nLWluY2x1ZGUgc3JjPVwiJztcbiAgICAgICAgICAgICAgICBwb3B1cCArPSBcIidcIiArIGNvbmZpZy50ZW1wbGF0ZVVybCArIFwiJ1wiO1xuICAgICAgICAgICAgICAgIHBvcHVwICs9ICdcIj48L25nLWluY2x1ZGU+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvcHVwICs9ICc8L3BvcHVwPic7XG4gICAgICAgICAgICB2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KHBvcHVwKSkoJHJvb3RTY29wZSkpO1xuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykuYWRkQ2xhc3MoJ25vc2Nyb2xsJyk7XG4gICAgICAgIH1cbiAgICB9KS5kaXJlY3RpdmUoJ3BvcCcsIGZ1bmN0aW9uKHBvcHVwKSB7XG4gICAgICAgIFwibmdJbmplY3RcIjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBjb25maWc6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zaXplID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IDEwLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAzNzBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICRzY29wZS5vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9BZGQgdG8gc2NvcGUuc2l6ZSBzcGFuIGVsZW1lbnQgbGVmdCwgdG9wIGZyb20gZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAub3Blbigkc2NvcGUuc2l6ZSwgJHNjb3BlLmNvbmZpZywgZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnd21vZGFsX3BvcHVwLmh0bWwnXG4gICAgICAgIH07XG4gICAgfSkuZGlyZWN0aXZlKCdwb3B1cCcsIGZ1bmN0aW9uKHBvcHVwKSB7XG4gICAgICAgIFwibmdJbmplY3RcIjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY29uZmlnOiAnPScsXG4gICAgICAgICAgICAgICAgc2l6ZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICgkc2NvcGUuY29uZmlnLnBvcykge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdydCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtIChldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0ICogMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtIChldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0IC8gMik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdyYic6XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgKGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aCAvIDIpIC0gKCRzY29wZS5zaXplLm9mZnNldFdpZHRoIC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgKyBldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbGInOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYIC0gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYIC0gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYIC0gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtIChldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0ICogMik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCArIChldmVudC50YXJnZXQub2Zmc2V0V2lkdGggLyAyKSAtICgkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aCAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAkc2NvcGUuc2l6ZS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZGVmYXVsdCgkc2NvcGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gWyRzY29wZS5zaXplLmxlZnQsICRzY29wZS5zaXplLnRvcF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHQgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgPiAkc2NvcGUuc2l6ZS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCA+ICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC0gKChldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCkgKyAkc2NvcGUuc2l6ZS5vZmZzZXRIZWlnaHQpID4gJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciByaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCAtICgoZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFgpICsgJHNjb3BlLnNpemUub2Zmc2V0V2lkdGgpID4gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XG5cblxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGxlZnQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhib3R0b20pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyaWdodCk7XG5cblxuICAgICAgICAgICAgICAgICAgICBpZiAobGVmdCAmJiB0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ2x0JztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyaWdodCAmJiB0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3J0JztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyaWdodCAmJiBib3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3JiJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsZWZ0ICYmIGJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnbGInO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAndCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3InO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnYic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnbCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSAkc2NvcGUuY29uZmlnLnBvcyA9ICdiJztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vcGVuKCRzY29wZS5zaXplLCAkc2NvcGUuY29uZmlnLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fc2RcIiwgW10pXG5cbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9zZXJ2aWNlc1wiLCBbXSkucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRjb21waWxlKXtcblx0dmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcblx0Ym9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KCc8cHVsbGZpbGVzPjwvcHVsbGZpbGVzPicpKSgkcm9vdFNjb3BlKSk7XG59KS5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdGlmKHR5cGVvZiBpbyAhPSAnb2JqZWN0JykgcmV0dXJuIHt9O1xuXHR2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cdHZhciBzb2NrZXQgPSBpby5jb25uZWN0KGxvYyk7XG5cdHJldHVybiBzb2NrZXQ7XG59KS5zZXJ2aWNlKCdmaWxlJywgZnVuY3Rpb24oJHRpbWVvdXQpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHZhciBzZWxmID0gdGhpcztcblx0c2VsZi5hZGQgPSBmdW5jdGlvbihvcHRzLCBjYil7XG5cdFx0aWYodHlwZW9mIHNlbGYuYWRkRGVsYXkgIT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRzZWxmLmFkZChvcHRzLCBjYik7XG5cdFx0XHR9LCAxMDApO1xuXHRcdH1lbHNle1xuXHRcdFx0c2VsZi5hZGREZWxheShvcHRzLCBjYik7XG5cdFx0fVxuXHR9XG59KS5ydW4oZnVuY3Rpb24gKGN0cmwpIHtcblx0XCJuZ0luamVjdFwiO1xuXHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24gKGUpIHtcblx0XHRjdHJsLnByZXNzKGUua2V5Q29kZSk7XG5cdH0pO1xufSkuc2VydmljZSgnY3RybCcsIGZ1bmN0aW9uKCR0aW1lb3V0KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHR2YXIgY2JzID0gW107XG5cdHZhciBlbnVtcyA9IHtcblx0XHQnc3BhY2UnOiAzMixcblx0XHQnZXNjJzogMjcsXG5cdFx0J2JhY2tzcGFjZSc6IDgsXG5cdFx0J3RhYic6IDksXG5cdFx0J2VudGVyJzogMTMsXG5cdFx0J3NoaWZ0JzogMTYsXG5cdFx0J2N0cmwnOiAxNyxcblx0XHQnYWx0JzogMTgsXG5cdFx0J3BhdXNlL2JyZWFrJzogMTksXG5cdFx0J2NhcHMgbG9jayc6IDIwLFxuXHRcdCdlc2NhcGUnOiAyNyxcblx0XHQncGFnZSB1cCc6IDMzLFxuXHRcdCdwYWdlIGRvd24nOiAzNCxcblx0XHQnZW5kJzogMzUsXG5cdFx0J2hvbWUnOiAzNixcblx0XHQnbGVmdCc6IDM3LFxuXHRcdCd1cCc6IDM4LFxuXHRcdCdyaWdodCc6IDM5LFxuXHRcdCdkb3duJzogNDAsXG5cdFx0J2luc2VydCc6IDQ1LFxuXHRcdCdkZWxldGUnOiA0Nixcblx0XHQnMCc6IDQ4LFxuXHRcdCcxJzogNDksXG5cdFx0JzInOiA1MCxcblx0XHQnMyc6IDUxLFxuXHRcdCc0JzogNTIsXG5cdFx0JzUnOiA1Myxcblx0XHQnNic6IDU0LFxuXHRcdCc3JzogNTUsXG5cdFx0JzgnOiA1Nixcblx0XHQnOSc6IDU3LFxuXHRcdCdhJzogNjUsXG5cdFx0J2InOiA2Nixcblx0XHQnYyc6IDY3LFxuXHRcdCdkJzogNjgsXG5cdFx0J2UnOiA2OSxcblx0XHQnZic6IDcwLFxuXHRcdCdnJzogNzEsXG5cdFx0J2gnOiA3Mixcblx0XHQnaSc6IDczLFxuXHRcdCdqJzogNzQsXG5cdFx0J2snOiA3NSxcblx0XHQnbCc6IDc2LFxuXHRcdCdtJzogNzcsXG5cdFx0J24nOiA3OCxcblx0XHQnbyc6IDc5LFxuXHRcdCdwJzogODAsXG5cdFx0J3EnOiA4MSxcblx0XHQncic6IDgyLFxuXHRcdCdzJzogODMsXG5cdFx0J3QnOiA4NCxcblx0XHQndSc6IDg1LFxuXHRcdCd2JzogODYsXG5cdFx0J3cnOiA4Nyxcblx0XHQneCc6IDg4LFxuXHRcdCd5JzogODksXG5cdFx0J3onOiA5MCxcblx0XHQnbGVmdCB3aW5kb3cga2V5JzogOTEsXG5cdFx0J3JpZ2h0IHdpbmRvdyBrZXknOiA5Mixcblx0XHQnc2VsZWN0IGtleSc6IDkzLFxuXHRcdCdudW1wYWQgMCc6IDk2LFxuXHRcdCdudW1wYWQgMSc6IDk3LFxuXHRcdCdudW1wYWQgMic6IDk4LFxuXHRcdCdudW1wYWQgMyc6IDk5LFxuXHRcdCdudW1wYWQgNCc6IDEwMCxcblx0XHQnbnVtcGFkIDUnOiAxMDEsXG5cdFx0J251bXBhZCA2JzogMTAyLFxuXHRcdCdudW1wYWQgNyc6IDEwMyxcblx0XHQnbnVtcGFkIDgnOiAxMDQsXG5cdFx0J251bXBhZCA5JzogMTA1LFxuXHRcdCdtdWx0aXBseSc6IDEwNixcblx0XHQnYWRkJzogMTA3LFxuXHRcdCdzdWJ0cmFjdCc6IDEwOSxcblx0XHQnZGVjaW1hbCBwb2ludCc6IDExMCxcblx0XHQnZGl2aWRlJzogMTExLFxuXHRcdCdmMSc6IDExMixcblx0XHQnZjInOiAxMTMsXG5cdFx0J2YzJzogMTE0LFxuXHRcdCdmNCc6IDExNSxcblx0XHQnZjUnOiAxMTYsXG5cdFx0J2Y2JzogMTE3LFxuXHRcdCdmNyc6IDExOCxcblx0XHQnZjgnOiAxMTksXG5cdFx0J2Y5JzogMTIwLFxuXHRcdCdmMTAnOiAxMjEsXG5cdFx0J2YxMSc6IDEyMixcblx0XHQnZjEyJzogMTIzLFxuXHRcdCdudW0gbG9jayc6IDE0NCxcblx0XHQnc2Nyb2xsIGxvY2snOiAxNDUsXG5cdFx0J3NlbWktY29sb24nOiAxODYsXG5cdFx0J2VxdWFsIHNpZ24nOiAxODcsXG5cdFx0J2NvbW1hJzogMTg4LFxuXHRcdCdkYXNoJzogMTg5LFxuXHRcdCdwZXJpb2QnOiAxOTAsXG5cdFx0J2ZvcndhcmQgc2xhc2gnOiAxOTEsXG5cdFx0J2dyYXZlIGFjY2VudCc6IDE5Mixcblx0XHQnb3BlbiBicmFja2V0JzogMjE5LFxuXHRcdCdiYWNrIHNsYXNoJzogMjIwLFxuXHRcdCdjbG9zZSBicmFrZXQnOiAyMjEsXG5cdFx0J3NpbmdsZSBxdW90ZSc6IDIyMixcblx0fTtcblx0dGhpcy5wcmVzcyA9IGZ1bmN0aW9uKGNvZGUpe1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2JzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZihjYnNbaV0ua2V5ID09IGNvZGUpICR0aW1lb3V0KGNic1tpXS5jYik7XG5cdFx0fVxuXHR9XG5cdHRoaXMub24gPSBmdW5jdGlvbihidG5zLCBjYil7XG5cdFx0aWYodHlwZW9mIGNiICE9ICdmdW5jdGlvbicpIHJldHVybjtcblx0XHRpZighQXJyYXkuaXNBcnJheShidG5zKSYmdHlwZW9mIGJ0bnMgIT0gJ29iamVjdCcpIHJldHVybjtcblx0XHRpZighQXJyYXkuaXNBcnJheShidG5zKSYmdHlwZW9mIGJ0bnMgPT0gJ29iamVjdCcpIGJ0bnMgPSBbYnRuc107XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBidG5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZih0eXBlb2YgZW51bXNbYnRuc1tpXV0gPT0gJ251bWJlcicpe1xuXHRcdFx0XHRjYnMucHVzaCh7XG5cdFx0XHRcdFx0a2V5OiBlbnVtc1tidG5zW2ldXSxcblx0XHRcdFx0XHRjYjogY2Jcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KS5zZXJ2aWNlKCdpbWcnLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHRoaXMuZmlsZVRvRGF0YVVybCA9IGZ1bmN0aW9uKGZpbGUsIGNhbGxiYWNrKXtcblx0XHR2YXIgYSA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0YS5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRjYWxsYmFjayhlLnRhcmdldC5yZXN1bHQpO1xuXHRcdH1cblx0XHRhLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cdH1cblx0dGhpcy5yZXNpemVVcFRvID0gZnVuY3Rpb24oaW5mbywgY2FsbGJhY2spe1xuXHRcdGlmKCFpbmZvLmZpbGUpIHJldHVybiBjb25zb2xlLmxvZygnTm8gaW1hZ2UnKTtcblx0XHRpbmZvLndpZHRoID0gaW5mby53aWR0aCB8fCAxOTIwO1xuXHRcdGluZm8uaGVpZ2h0ID0gaW5mby5oZWlnaHQgfHwgMTA4MDtcblx0XHRpZihpbmZvLmZpbGUudHlwZSE9XCJpbWFnZS9qcGVnXCIgJiYgaW5mby5maWxlLnR5cGUhPVwiaW1hZ2UvcG5nXCIpXG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coXCJZb3UgbXVzdCB1cGxvYWQgZmlsZSBvbmx5IEpQRUcgb3IgUE5HIGZvcm1hdC5cIik7XG5cdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChsb2FkRXZlbnQpIHtcblx0XHRcdHZhciBjYW52YXNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgaW1hZ2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRpbWFnZUVsZW1lbnQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBpbmZvUmF0aW8gPSBpbmZvLndpZHRoIC8gaW5mby5oZWlnaHQ7XG5cdFx0XHRcdHZhciBpbWdSYXRpbyA9IGltYWdlRWxlbWVudC53aWR0aCAvIGltYWdlRWxlbWVudC5oZWlnaHQ7XG5cdFx0XHRcdGlmIChpbWdSYXRpbyA+IGluZm9SYXRpbykge1xuXHRcdFx0XHRcdHdpZHRoID0gaW5mby53aWR0aDtcblx0XHRcdFx0XHRoZWlnaHQgPSB3aWR0aCAvIGltZ1JhdGlvO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGhlaWdodCA9IGluZm8uaGVpZ2h0O1xuXHRcdFx0XHRcdHdpZHRoID0gaGVpZ2h0ICogaW1nUmF0aW87XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FudmFzRWxlbWVudC53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXNFbGVtZW50LmhlaWdodCA9IGhlaWdodDtcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYW52YXNFbGVtZW50LmdldENvbnRleHQoJzJkJyk7XG5cdFx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKGltYWdlRWxlbWVudCwgMCwgMCAsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHRjYWxsYmFjayhjYW52YXNFbGVtZW50LnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMSkpO1xuXHRcdFx0fTtcblx0XHRcdGltYWdlRWxlbWVudC5zcmMgPSBsb2FkRXZlbnQudGFyZ2V0LnJlc3VsdDtcblx0XHR9O1xuXHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGluZm8uZmlsZSk7XG5cdH1cbn0pLnNlcnZpY2UoJ2hhc2gnLCBmdW5jdGlvbigpe1xuXHRcIm5nSW5qZWN0XCI7XG5cdHRoaXMuc2V0ID0gZnVuY3Rpb24ob2JqKXtcblx0XHR3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xuXHRcdGZvcih2YXIga2V5IGluIG9iail7XG5cdFx0XHRpZihvYmpba2V5XSkgd2luZG93LmxvY2F0aW9uLmhhc2grPScmJytrZXkrJz0nK29ialtrZXldO1xuXG5cdFx0fVxuXHR9XG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhIycsICcnKTtcblx0XHRoYXNoID0gaGFzaC5yZXBsYWNlKCcjJywgJycpLnNwbGl0KCcmJyk7XG5cdFx0aGFzaC5zaGlmdCgpO1xuXHRcdHZhciBoID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBoYXNoLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRoYXNoW2ldID0gaGFzaFtpXS5zcGxpdCgnPScpO1xuXHRcdFx0aFtoYXNoW2ldWzBdXSA9IGhhc2hbaV1bMV07XG5cdFx0fVxuXHRcdHJldHVybiBoO1xuXHR9XG59KTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9zcGlubmVyXCIsIFtdKVxuICAgIC5zZXJ2aWNlKCdzcGluJywgZnVuY3Rpb24oJGNvbXBpbGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgXCJuZ0luamVjdFwiO1xuICAgICAgICAvKlxuICAgICAgICAgKlx0U3Bpbm5lcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5zcGlubmVycyA9IFtdO1xuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5zcGlubmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNwaW5uZXJzW2ldLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3Bpbm5lcnNbaV0uZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3Bpbm5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wZW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIGlmICghb2JqKSBvYmogPSB7fTtcbiAgICAgICAgICAgIGlmICghb2JqLmlkKSBvYmouaWQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdmFyIG1vZGFsID0gJzxzcGluICBpZD1cIicgKyBvYmouaWQgKyAnXCI+JztcbiAgICAgICAgICAgIGlmIChvYmoudGVtcGxhdGUpIG1vZGFsICs9IG9iai50ZW1wbGF0ZTtcbiAgICAgICAgICAgIGVsc2UgaWYgKG9iai50ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgICAgIG1vZGFsICs9ICc8bmctaW5jbHVkZSBzcmM9XCInO1xuICAgICAgICAgICAgICAgIG1vZGFsICs9IFwiJ1wiICsgb2JqLnRlbXBsYXRlVXJsICsgXCInXCI7XG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJ1wiPjwvbmctaW5jbHVkZT4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnPG5nLWluY2x1ZGUgIHNyYz1cIic7XG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gXCInd21vZGFsX3NwaW5uZXIuaHRtbCdcIjtcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnXCI+PC9uZy1pbmNsdWRlPic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtb2RhbCArPSAnPC9zcGluPic7XG4gICAgICAgICAgICB0aGlzLnNwaW5uZXJzLnB1c2gob2JqKTtcbiAgICAgICAgICAgIGlmIChvYmouZWxlbWVudCkge1xuICAgICAgICAgICAgXHRcbiAgICAgICAgICAgIFx0Y29uc29sZS5sb2cob2JqLmVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFx0dmFyIGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2JvZHknKS5lcSgwKTtcblx0XHRcdFx0Ym9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KG1vZGFsKSkoJHJvb3RTY29wZSkpO1xuXHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2h0bWwnKS5hZGRDbGFzcygnbm9zY3JvbGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvYmouaWQ7XG4gICAgICAgIH1cbiAgICB9KS5kaXJlY3RpdmUoJ3NwaW4nLCBmdW5jdGlvbihzcGluKSB7XG4gICAgICAgIFwibmdJbmplY3RcIjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBpZDogJ0AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGlubmVyLnNwaW5uZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGlubmVyLnNwaW5uZXJzW2ldLmlkID09IHNjb3BlLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnNwaW5uZXJzW2ldLmVsID0gZWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd3bW9kYWxfc3Bpbm5lci5odG1sJ1xuICAgICAgICB9O1xuICAgIH0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RhZXJhdG9ycy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kYWVyYXRvcnMuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz1cXFwid3RhZ3NcXFwiPjxzcGFuIGNsYXNzPSd3dGFnJyBuZy1yZXBlYXQ9J29iaiBpbiBhcnInPjxpbWcgbmctc3JjPSd7e29iai5hdmF0YXJVcmx9fScgYWx0PSd7e29iai5uYW1lfX0nPjxzcGFuPnt7b2JqLm5hbWV9fTwvc3Bhbj48aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlJyBuZy1jbGljaz0nYXJyLnNwbGljZSgkaW5kZXgsIDEpOyBjaGFuZ2UoKTsnPjwvaT48L3NwYW4+PGlucHV0IHR5cGU9J3RleHQnIHBsYWNlaG9sZGVyPSd7e2hvbGRlcn19JyBuZy1tb2RlbD0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjwvbGFiZWw+PGRpdiBuZy1pZj0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjxkaXYgbmctcmVwZWF0PSd1c2VyIGluIHVzZXJzfHJBcnI6YXJyfGZpbHRlcjpvYmplY3QubmV3X21vZGVyYXRvcicgbmctY2xpY2s9J2Fyci5wdXNoKHVzZXIpOyBvYmplY3QubmV3X21vZGVyYXRvcj1udWxsOyBjaGFuZ2UoKTsnPjxpbWcgbmctc3JjPSd7e3VzZXIuYXZhdGFyVXJsfX0nIGFsdD0ne3t1c2VyLm5hbWV9fSc+PHNwYW4+e3t1c2VyLm5hbWV9fTwvc3Bhbj48L2Rpdj48L2Rpdj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd21vZGFlcmF0b3Jzdmlldy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWxcIiwgXCI8c3BhbiBjbGFzcz0nd3RhZycgbmctcmVwZWF0PSdvYmogaW4gYXJyJz48aW1nIG5nLXNyYz0ne3tvYmouYXZhdGFyVXJsfX0nIGFsdD0ne3tvYmoubmFtZX19Jz48c3Bhbj57e29iai5uYW1lfX08L3NwYW4+PC9zcGFuPlwiKTtcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93bW9kZXJhdG9ycy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kZXJhdG9ycy5odG1sXCIsIFwiPGxhYmVsIGNsYXNzPVxcXCJ3dGFnc1xcXCI+PGRpdiBjbGFzcz0nd3RhZycgbmctcmVwZWF0PSdvYmogaW4gYXJyJz48ZGl2IGNsYXNzPVxcXCJ3dGFnLS1pblxcXCI+PGRpdiBjbGFzcz1cXFwid3RhZy0tYXZhXFxcIj48aW1nIG5nLXNyYz0ne3tvYmouYXZhdGFyVXJsfX0nIGFsdD0ne3tvYmoubmFtZX19Jz48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ3dGFnLS10ZXh0XFxcIj57e29iai5uYW1lfX08L2Rpdj48aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlJyBuZy1jbGljaz0nYXJyLnNwbGljZSgkaW5kZXgsIDEpOyBjaGFuZ2UoKTsnIHRpdGxlPVxcXCJEZWxldGUgbW9kZXJhdG9yXFxcIj48L2k+PC9kaXY+PC9kaXY+PGlucHV0IHR5cGU9J3RleHQnIHBsYWNlaG9sZGVyPSd7e2hvbGRlcn19JyBuZy1tb2RlbD0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjwvbGFiZWw+PGRpdiBuZy1pZj0nb2JqZWN0Lm5ld19tb2RlcmF0b3InPjxkaXYgbmctcmVwZWF0PSd1c2VyIGluIHVzZXJzfHJBcnI6YXJyfGZpbHRlcjpvYmplY3QubmV3X21vZGVyYXRvcicgbmctY2xpY2s9J2Fyci5wdXNoKHVzZXIpOyBvYmplY3QubmV3X21vZGVyYXRvcj1udWxsOyBjaGFuZ2UoKTsnPjxpbWcgbmctc3JjPSd7e3VzZXIuYXZhdGFyVXJsfX0nIGFsdD0ne3t1c2VyLm5hbWV9fSc+PHNwYW4+e3t1c2VyLm5hbWV9fTwvc3Bhbj48L2Rpdj48L2Rpdj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd21vZGVyYXRvcnN2aWV3Lmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFwiPHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGRpdiBjbGFzcz1cXFwid3RhZy0taW5cXFwiPjxkaXYgY2xhc3M9XFxcInd0YWctLWF2YVxcXCI+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PC9kaXY+PGRpdiBjbGFzcz1cXFwid3RhZy0tdGV4dFxcXCI+e3tvYmoubmFtZX19PC9kaXY+PC9kaXY+PC9zcGFuPlwiKTtcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV93dGFncy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93dGFncy5odG1sXCIsIFwiPGxhYmVsIGNsYXNzPSd3dGFncyc+PHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0ndGFnIGluIHRhZ3MnPiN7e3RhZ319IDxpIGNsYXNzPSdpY29uIGljb24tY2xvc2UnIG5nLWNsaWNrPSd0YWdzLnNwbGljZSgkaW5kZXgsIDEpOyB1cGRhdGVfdGFncygpOyc+PC9pPjwvc3Bhbj48aW5wdXQgdHlwZT0ndGV4dCcgcGxhY2Vob2xkZXI9J25ldyB0YWcnIG5nLW1vZGVsPSduZXdfdGFnJyBuZy1rZXl1cD0nZW50ZXIoJGV2ZW50KSc+PC9sYWJlbD5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9tb2RhbC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid21vZGFsX21vZGFsLmh0bWxcIiwgXCI8ZGl2IGNsYXNzPSdtb2RhbCcgbmctY2xhc3M9XFxcIntmdWxsOiBmdWxsLCBjb3ZlcjogY292ZXJ9XFxcIj48ZGl2IGNsYXNzPSdtb2RhbF9mYWRlJyBuZy1jbGljaz0nY2xvc2UoKTsnIHRpdGxlPSdDbG9zZSc+PC9kaXY+PGRpdiBjbGFzcz0nbW9kYWxfY29udGVudCB2aWV3ZXInPjxpIGNsYXNzPSdpY29uIGljb24tY2xvc2UgY2xvc2UtbScgbmctY2xpY2s9J2Nsb3NlKCk7JyB0aXRsZT0nQ2xvc2UnPjwvaT48aDIgbmctaWY9XFxcImhlYWRlclxcXCI+e3toZWFkZXJ9fTwvaDI+PHAgbmctaWY9XFxcImNvbnRlbnRcXFwiPnt7Y29udGVudH19PC9wPjxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT48L2Rpdj48L2Rpdj5cIik7XG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9wb3B1cC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid21vZGFsX3BvcHVwLmh0bWxcIiwgXCI8c3BhbiBuZy1jbGljay1vdXRzaWRlPVxcXCJjbG9zZSgpXFxcIiBuZy10cmFuc2NsdWRlIG5nLWNsaWNrPVxcXCJvcGVuKCRldmVudClcXFwiIGVsc2l6ZT1cXFwic2l6ZVxcXCI+PC9zcGFuPlwiKTtcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid21vZGFsX3NwaW5uZXIuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndtb2RhbF9zcGlubmVyLmh0bWxcIiwgXCI8IS0tIENvbW1lbnRzIGFyZSBqdXN0IHRvIGZpeCB3aGl0ZXNwYWNlIHdpdGggaW5saW5lLWJsb2NrIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXJcXFwiPjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tMVxcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTJcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLSAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUgU3Bpbm5lci1saW5lLS0zXFxcIj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1sZWZ0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtdGlja2VyXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1jZW50ZXJcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLXJpZ2h0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tNFxcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tLS0+PC9kaXY+PCEtLS9zcGlubmVyIC0tPlwiKTtcbn1dKTsiXX0=

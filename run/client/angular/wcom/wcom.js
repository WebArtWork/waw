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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndjb20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsUUFBQSxPQUFBLFFBQUEsQ0FBQSx5QkFBQSxZQUFBLG1CQUFBLGdCQUFBLGNBQUEsY0FBQSxjQUFBLFdBQUEsaUJBQUEsZ0JBQUEsMEJBQUEsOEJBQUEseUJBQUEsNkJBQUEsbUJBQUEscUJBQUEscUJBQUE7OztBQUdBLENBQUEsV0FBQTtJQUNBOztJQUVBO1NBQ0EsT0FBQSx5QkFBQTtTQUNBLFVBQUEsZ0JBQUE7WUFDQSxhQUFBLFVBQUE7WUFDQTs7Ozs7Ozs7Ozs7SUFXQSxTQUFBLGFBQUEsV0FBQSxRQUFBLFVBQUE7UUFDQSxPQUFBO1lBQ0EsVUFBQTtZQUNBLE1BQUEsU0FBQSxRQUFBLE1BQUEsTUFBQTs7O2dCQUdBLFNBQUEsV0FBQTtvQkFDQSxJQUFBLFlBQUEsQ0FBQSxLQUFBLGlCQUFBLGFBQUEsS0FBQSxhQUFBLE1BQUEsV0FBQTt3QkFDQTs7b0JBRUEsU0FBQSxhQUFBLEdBQUE7d0JBQ0EsSUFBQTs0QkFDQTs0QkFDQTs0QkFDQTs0QkFDQTs0QkFDQTs7O3dCQUdBLElBQUEsUUFBQSxRQUFBLE1BQUEsU0FBQSxZQUFBOzRCQUNBOzs7O3dCQUlBLElBQUEsQ0FBQSxLQUFBLENBQUEsRUFBQSxRQUFBOzRCQUNBOzs7O3dCQUlBLEtBQUEsVUFBQSxFQUFBLFFBQUEsU0FBQSxVQUFBLFFBQUEsWUFBQTs7NEJBRUEsSUFBQSxZQUFBLEtBQUEsSUFBQTtnQ0FDQTs7Ozs0QkFJQSxLQUFBLFFBQUE7Z0NBQ0EsYUFBQSxRQUFBO2dDQUNBLElBQUEsVUFBQTs7OzRCQUdBLElBQUEsY0FBQSxXQUFBLFlBQUEsV0FBQTtnQ0FDQSxhQUFBLFdBQUE7Ozs7NEJBSUEsSUFBQSxjQUFBLElBQUE7OztnQ0FHQSxLQUFBLElBQUEsR0FBQSxJQUFBLEdBQUEsS0FBQTs7b0NBRUEsSUFBQSxJQUFBLE9BQUEsUUFBQSxVQUFBLEtBQUE7OztvQ0FHQSxJQUFBLENBQUEsT0FBQSxhQUFBLEVBQUEsS0FBQSxTQUFBLGNBQUEsRUFBQSxLQUFBLGNBQUE7O3dDQUVBOzs7Ozs7O3dCQU9BLFNBQUEsV0FBQTs0QkFDQSxLQUFBLE9BQUEsS0FBQTs0QkFDQSxHQUFBLFFBQUE7Z0NBQ0EsT0FBQTs7Ozs7O29CQU1BLElBQUEsYUFBQTt3QkFDQSxVQUFBLEdBQUEsY0FBQSxXQUFBOzRCQUNBLFdBQUE7Ozs7O29CQUtBLFVBQUEsR0FBQSxTQUFBOzs7b0JBR0EsT0FBQSxJQUFBLFlBQUEsV0FBQTt3QkFDQSxJQUFBLGFBQUE7NEJBQ0EsVUFBQSxJQUFBLGNBQUE7Ozt3QkFHQSxVQUFBLElBQUEsU0FBQTs7Ozs7OztvQkFPQSxTQUFBLFlBQUE7O3dCQUVBLE9BQUEsa0JBQUEsVUFBQSxVQUFBO3FCQUNBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsWUFBQSxJQUFBLElBQUEsQ0FBQSxTQUFBLE1BQUE7Q0FDQSxJQUFBO0NBQ0EsSUFBQSxnQkFBQSxVQUFBO0VBQ0EsV0FBQSxVQUFBO0dBQ0EsTUFBQSxJQUFBLG9CQUFBLEtBQUEsU0FBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQTtLQUNBLFNBQUE7U0FDQTtLQUNBOzs7S0FHQTs7Q0FFQSxNQUFBLElBQUEsb0JBQUEsS0FBQSxTQUFBLEtBQUE7RUFDQSxHQUFBLEtBQUEsS0FBQTtHQUNBLFNBQUEsS0FBQTtHQUNBOzs7O0FBSUEsUUFBQSxPQUFBLG1CQUFBO0NBQ0EsVUFBQSxhQUFBLFVBQUE7Q0FDQTtDQUNBLE1BQUE7RUFDQSxVQUFBLEtBQUEsT0FBQSxNQUFBLFNBQUE7RUFDQSxrREFBQSxTQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7R0FDQSxJQUFBLFNBQUEsT0FBQSxTQUFBO0dBQ0EsS0FBQSxXQUFBLFNBQUEsTUFBQSxHQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsY0FBQSxDQUFBLEtBQUEsSUFBQTtJQUNBLEtBQUEsV0FBQSxDQUFBLENBQUEsS0FBQTtJQUNBLE9BQUEsS0FBQTtJQUNBLFNBQUEsVUFBQTtLQUNBLEdBQUEsS0FBQSxTQUFBO01BQ0EsSUFBQSxXQUFBLFNBQUEsTUFBQTtPQUNBLElBQUEsV0FBQTtRQUNBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBOzs7O01BSUEsUUFBQSxRQUFBLFNBQUEsZUFBQSxLQUFBO09BQ0EsS0FBQSxVQUFBLFNBQUEsS0FBQTtPQUNBLElBQUEsU0FBQSxJQUFBLGlCQUFBLElBQUE7T0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsT0FBQSxNQUFBLFFBQUEsS0FBQTtRQUNBLFNBQUEsT0FBQSxNQUFBOzs7VUFHQTtNQUNBLFFBQUEsUUFBQSxTQUFBLGVBQUEsS0FBQTtPQUNBLEtBQUEsVUFBQSxTQUFBLEtBQUE7T0FDQSxJQUFBLFNBQUEsSUFBQSxpQkFBQSxJQUFBO09BQ0EsSUFBQSxXQUFBO1FBQ0EsTUFBQSxPQUFBLE1BQUE7UUFDQSxPQUFBLEtBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxRQUFBO1VBQ0EsU0FBQSxTQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsR0FBQSxTQUFBLE9BQUEsTUFBQTs7Ozs7T0FLQTs7O0VBR0EsVUFBQTs7R0FFQSxVQUFBLGtDQUFBLFNBQUEsVUFBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLE9BQUEsR0FBQTtHQUNBLEdBQUEsQ0FBQSxNQUFBLFFBQUEsTUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBLFVBQUE7SUFDQSxNQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7SUFDQSxNQUFBLE9BQUEsU0FBQSxHQUFBLEdBQUE7SUFDQTs7R0FFQTtHQUNBLFFBQUEsUUFBQSxTQUFBLEtBQUEsVUFBQTtHQUNBLE1BQUEsT0FBQSxZQUFBO0lBQ0EsT0FBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLEdBQUEsR0FBQSxjQUFBLEtBQUE7S0FDQSxVQUFBLE9BQUE7SUFDQSxHQUFBLE1BQUEsTUFBQSxLQUFBLEdBQUEsR0FBQSxNQUFBLE9BQUEsUUFBQSxNQUFBLE1BQUEsS0FBQTtJQUNBLEdBQUEsTUFBQSxNQUFBLEtBQUEsR0FBQSxHQUFBLE1BQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxLQUFBOzs7O0lBSUEsVUFBQSxxQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUE7RUFDQSxVQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTtLQUNBLHVCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQSxRQUFBLFNBQUEsT0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLGNBQUEsVUFBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFNBQUEsT0FBQSxLQUFBLEtBQUE7SUFDQSxHQUFBLE9BQUEsT0FBQSxVQUFBLFlBQUEsT0FBQTs7R0FFQSxPQUFBLFFBQUEsU0FBQSxFQUFBO0lBQ0EsR0FBQSxFQUFBLFNBQUEsR0FBQTtLQUNBLEdBQUEsT0FBQSxRQUFBO01BQ0EsT0FBQSxLQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7O0tBRUEsT0FBQSxVQUFBOzs7TUFHQSxhQUFBOztLQUVBLFVBQUEsNEJBQUEsU0FBQSxRQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxLQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7R0FDQSxRQUFBO0tBQ0EsYUFBQTs7SUFFQSxVQUFBLGdDQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQTtFQUNBLFVBQUE7RUFDQSxPQUFBO0dBQ0EsS0FBQTtLQUNBLGFBQUE7OztBQUdBLE9BQUEsVUFBQSxPQUFBLFNBQUEsUUFBQSxhQUFBO0lBQ0EsSUFBQSxTQUFBO0lBQ0EsT0FBQSxPQUFBLE1BQUEsUUFBQSxLQUFBOztBQUVBLFFBQUEsT0FBQSxnQkFBQTtDQUNBLE9BQUEsU0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQSxJQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsT0FBQTtFQUNBLElBQUEsSUFBQSxNQUFBLENBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsTUFBQSxJQUFBLE1BQUEsS0FBQTtFQUNBLEtBQUEsSUFBQSxJQUFBLElBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0dBQ0EsR0FBQSxDQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsR0FBQTs7RUFFQSxPQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsWUFBQSxXQUFBO0VBQ0EsSUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxJQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLFFBQUEsS0FBQTtJQUNBLEdBQUEsV0FBQSxHQUFBLE9BQUEsSUFBQSxHQUFBLElBQUE7S0FDQSxJQUFBLE9BQUEsR0FBQTtLQUNBOzs7O0VBSUEsT0FBQTs7R0FFQSxPQUFBLGFBQUEsVUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLElBQUE7RUFDQSxHQUFBLENBQUEsS0FBQSxPQUFBLElBQUE7RUFDQSxJQUFBLFlBQUEsSUFBQSxXQUFBLFVBQUEsRUFBQTtFQUNBLE9BQUEsSUFBQSxLQUFBLFNBQUEsVUFBQSxJQUFBOztHQUVBLE9BQUEsV0FBQSxVQUFBO0NBQ0E7Q0FDQSxPQUFBLFNBQUEsS0FBQTtFQUNBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsUUFBQSxNQUFBLEdBQUEsT0FBQTtPQUNBLE9BQUEsVUFBQTs7R0FFQSxPQUFBLHFCQUFBLFNBQUEsUUFBQTtDQUNBO0NBQ0EsT0FBQSxTQUFBLE1BQUEsU0FBQSxVQUFBLE9BQUE7RUFDQSxPQUFBLElBQUEsS0FBQTtFQUNBLEdBQUEsUUFBQTtHQUNBLEtBQUEsWUFBQSxLQUFBLGdCQUFBLFNBQUE7O0VBRUEsR0FBQSxTQUFBO0dBQ0EsS0FBQSxTQUFBLEtBQUEsYUFBQSxTQUFBOztFQUVBLEdBQUEsT0FBQTtHQUNBLEtBQUEsUUFBQSxLQUFBLFlBQUEsU0FBQTs7RUFFQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7O0lBRUEsT0FBQSwyQkFBQSxTQUFBLFFBQUE7Q0FDQTtDQUNBLE9BQUEsU0FBQSxLQUFBO0VBQ0EsT0FBQSxJQUFBLEtBQUE7RUFDQSxJQUFBLFNBQUEsS0FBQTtFQUNBLElBQUEsUUFBQSxJQUFBLE9BQUE7RUFDQSxJQUFBLFNBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxRQUFBLE9BQUE7RUFDQSxJQUFBLFFBQUEsUUFBQTtFQUNBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxRQUFBLFFBQUEsTUFBQTs7RUFFQSxJQUFBLFNBQUEsU0FBQSxXQUFBO0VBQ0EsR0FBQSxPQUFBLE9BQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxNQUFBOztFQUVBLE9BQUEsUUFBQSxRQUFBLE1BQUE7OztBQUdBLFFBQUEsT0FBQSxjQUFBO0NBQ0EsUUFBQSxvQ0FBQSxTQUFBLFVBQUEsV0FBQTtDQUNBOzs7O0VBSUEsSUFBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsT0FBQSxHQUFBO0dBQ0EsTUFBQSxRQUFBLFVBQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEdBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxNQUFBLEdBQUE7TUFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBO01BQ0E7OztJQUdBLEdBQUEsS0FBQSxPQUFBLFVBQUEsRUFBQTtLQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxZQUFBOztJQUVBLEdBQUEsTUFBQSxJQUFBLE1BQUE7SUFDQSxHQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLE9BQUEsUUFBQSxLQUFBO0lBQ0EsR0FBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLE1BQUEsR0FBQTtLQUNBLEtBQUEsT0FBQSxHQUFBLFFBQUEsTUFBQTtLQUNBLE1BQUEsUUFBQSxLQUFBLE9BQUE7S0FDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTtNQUNBLE1BQUEsT0FBQSxLQUFBLE9BQUEsR0FBQTs7S0FFQTs7OztFQUlBLEtBQUEsT0FBQSxTQUFBLElBQUE7R0FDQSxHQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsZUFBQSxDQUFBLElBQUE7SUFDQSxPQUFBLFFBQUEsS0FBQTtHQUNBLEdBQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxLQUFBLEtBQUE7R0FDQSxJQUFBLFFBQUEsY0FBQSxJQUFBLEdBQUE7R0FDQSxHQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7UUFDQSxHQUFBLElBQUEsWUFBQTtJQUNBLFNBQUE7SUFDQSxTQUFBLElBQUEsSUFBQSxZQUFBO0lBQ0EsU0FBQTs7R0FFQSxTQUFBO0dBQ0EsS0FBQSxPQUFBLEtBQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7R0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtHQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOzs7OztJQUtBLFVBQUEsbUJBQUEsU0FBQSxPQUFBO0NBQ0E7Q0FDQSxPQUFBO0VBQ0EsVUFBQTtFQUNBLFlBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtLQUNBLE1BQUEsTUFBQSxZQUFBLGFBQUE7O0lBRUEsV0FBQSxrQ0FBQSxTQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsU0FBQSxVQUFBO0VBQ0EsR0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLFFBQUEsT0FBQTtJQUNBLE9BQUEsT0FBQSxPQUFBLFFBQUEsUUFBQSxNQUFBOzs7RUFHQSxHQUFBLE9BQUEsUUFBQSxNQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQSxRQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsT0FBQSxRQUFBLE1BQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLGNBQUEsSUFBQSxRQUFBLHlDQUFBLFNBQUEsT0FBQSxVQUFBLE9BQUE7Ozs7Ozs7Ozs7RUFVQSxJQUFBLE9BQUE7Ozs7RUFJQSxLQUFBLFNBQUEsU0FBQSxNQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUEsT0FBQSxNQUFBLFlBQUEsR0FBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsU0FBQSxNQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxHQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsR0FBQSxPQUFBLE1BQUEsV0FBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBOztJQUVBLE9BQUEsS0FBQSxRQUFBOztHQUVBLEtBQUEsUUFBQSxRQUFBO0dBQ0EsS0FBQSxRQUFBLFFBQUE7R0FDQSxLQUFBLFNBQUEsUUFBQSxPQUFBLFFBQUE7R0FDQSxHQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxLQUFBLE1BQUEsUUFBQSxXQUFBO01BQ0EsS0FBQSxNQUFBLE9BQUE7T0FDQSxPQUFBLEtBQUEsTUFBQTs7Ozs7R0FLQSxHQUFBLEtBQUEsT0FBQTtJQUNBLEdBQUEsT0FBQSxLQUFBLFVBQUEsU0FBQTtLQUNBLEtBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTs7SUFFQSxHQUFBLE1BQUEsUUFBQSxLQUFBLFFBQUE7S0FDQSxJQUFBLE1BQUEsS0FBQTtLQUNBLEtBQUEsU0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxJQUFBLE1BQUEsU0FBQTtPQUNBLEtBQUEsT0FBQSxJQUFBLE1BQUE7WUFDQTtPQUNBLElBQUEsSUFBQSxPQUFBLElBQUEsR0FBQTtRQUNBLEtBQUEsT0FBQSxPQUFBLElBQUEsR0FBQTs7Ozs7SUFLQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsS0FBQSxPQUFBLFFBQUEsVUFBQTtNQUNBLEdBQUEsS0FBQSxPQUFBLEtBQUE7T0FDQSxLQUFBLE9BQUEsT0FBQTtRQUNBLE9BQUEsU0FBQSxJQUFBO1NBQ0EsT0FBQSxJQUFBOzs7V0FHQTtPQUNBLE9BQUEsS0FBQSxPQUFBO09BQ0E7OztLQUdBLEdBQUEsT0FBQSxLQUFBLE9BQUEsUUFBQSxTQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7S0FFQSxHQUFBLE9BQUEsS0FBQSxPQUFBLEtBQUEsU0FBQSxXQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQTs7OztHQUlBLE1BQUEsSUFBQSxVQUFBLE9BQUEsUUFBQSxLQUFBLFNBQUEsTUFBQTtJQUNBLElBQUEsS0FBQSxNQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsS0FBQSxRQUFBLEtBQUE7TUFDQSxLQUFBLE1BQUEsS0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxNQUFBO01BQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBO1dBQ0EsSUFBQSxPQUFBLE1BQUEsWUFBQTtLQUNBLEdBQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxRQUFBLE9BQUEsS0FBQSxNQUFBLElBQUEsS0FBQTs7SUFFQSxLQUFBLFNBQUEsT0FBQTtJQUNBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7O0dBR0EsT0FBQSxLQUFBLFFBQUE7O0VBRUEsS0FBQSxZQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxJQUFBLE9BQUEsUUFBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsT0FBQSxLQUFBLFVBQUEsVUFBQSxLQUFBLFNBQUEsS0FBQSxPQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxPQUFBLFFBQUEsS0FBQTtLQUNBLEtBQUEsS0FBQSxPQUFBLE1BQUEsSUFBQSxLQUFBLE9BQUE7O0lBRUEsTUFBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLGlCQUFBLEtBQUEsUUFBQSxLQUFBO0tBQ0EsS0FBQSxTQUFBLE1BQUE7S0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLE1BQUEsWUFBQTtNQUNBLEdBQUEsS0FBQTtZQUNBLElBQUEsT0FBQSxNQUFBLFlBQUE7TUFDQSxHQUFBOzs7O0VBSUEsS0FBQSxlQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsUUFBQSxZQUFBO0lBQ0EsS0FBQTtJQUNBLE9BQUE7O0dBRUEsSUFBQSxPQUFBLFFBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUE7SUFDQSxJQUFBLE9BQUEsS0FBQSxVQUFBLFVBQUEsS0FBQSxTQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsT0FBQSxRQUFBLEtBQUE7S0FDQSxLQUFBLEtBQUEsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOztJQUVBLE1BQUE7O0dBRUEsTUFBQSxLQUFBLFVBQUEsT0FBQSxrQkFBQSxNQUFBO0dBQ0EsS0FBQSxTQUFBLE1BQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBOzs7O0VBSUEsS0FBQSxTQUFBLFNBQUEsTUFBQSxLQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7R0FDQSxJQUFBLENBQUEsS0FBQTtHQUNBLElBQUEsT0FBQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsT0FBQTs7R0FFQSxNQUFBLEtBQUEsVUFBQSxPQUFBLFlBQUEsTUFBQSxLQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxRQUFBO0tBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLFFBQUEsS0FBQTtNQUNBLElBQUEsS0FBQSxRQUFBLE1BQUEsR0FBQSxPQUFBLElBQUEsS0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLE9BQUEsR0FBQTtPQUNBOzs7S0FHQSxPQUFBLEtBQUEsUUFBQSxNQUFBLElBQUE7S0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7TUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO09BQ0EsSUFBQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxPQUFBLEdBQUEsS0FBQSxJQUFBLEtBQUE7U0FDQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxLQUFBO1VBQ0EsS0FBQSxRQUFBLE1BQUEsS0FBQSxPQUFBLE9BQUEsR0FBQTs7Ozs7O0tBTUEsR0FBQSxLQUFBLE9BQUEsTUFBQSxNQUFBO01BQ0EsSUFBQSxJQUFBLE9BQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtPQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxHQUFBLEtBQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxLQUFBLEdBQUEsT0FBQSxJQUFBLEtBQUE7U0FDQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsR0FBQTtTQUNBOzs7Ozs7SUFNQSxJQUFBLFFBQUEsT0FBQSxNQUFBLFlBQUE7S0FDQSxHQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQTs7OztFQUlBLEtBQUEsTUFBQSxTQUFBLElBQUE7R0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0dBQ0EsTUFBQSxJQUFBLGNBQUEsS0FBQSxTQUFBLE1BQUE7SUFDQSxHQUFBLEtBQUE7OztFQUdBLEtBQUEsUUFBQSxTQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsS0FBQSxPQUFBO0dBQ0EsR0FBQSxNQUFBLFFBQUEsTUFBQTtVQUNBLE9BQUEsS0FBQTtlQUNBLEdBQUEsT0FBQSxRQUFBLFNBQUE7VUFDQSxHQUFBLEtBQUEsS0FBQSxPQUFBLENBQUEsS0FBQTtVQUNBLElBQUEsUUFBQTtVQUNBLElBQUEsSUFBQSxPQUFBLEtBQUE7V0FDQSxHQUFBLEtBQUEsTUFBQSxNQUFBLEtBQUEsS0FBQSxLQUFBLEtBQUEsS0FBQTs7VUFFQSxPQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsRUFBQSxHQUFBO0lBQ0EsSUFBQSxLQUFBLElBQUEsS0FBQSxLQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7RUFFQSxLQUFBLGFBQUEsU0FBQSxLQUFBLElBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxNQUFBLGNBQUEsT0FBQSxPQUFBLFVBQUE7SUFDQSxTQUFBLE9BQUEsSUFBQTtJQUNBLElBQUEsZ0JBQUEsU0FBQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsV0FBQSxLQUFBLFdBQUEsU0FBQSxLQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLE1BQUE7R0FDQSxJQUFBLEtBQUEsV0FBQSxPQUFBO0lBQ0EsUUFBQSxJQUFBLEtBQUEsUUFBQTtJQUNBLElBQUEsTUFBQSxRQUFBLFFBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUEsTUFBQSxJQUFBOztLQUVBO1dBQ0EsSUFBQSxNQUFBLFFBQUEsT0FBQSxDQUFBLEdBQUE7S0FDQSxRQUFBLE1BQUEsTUFBQTtLQUNBLElBQUEsTUFBQSxNQUFBO0tBQ0EsSUFBQSxPQUFBLElBQUEsUUFBQSxVQUFBO0tBQ0EsT0FBQSxTQUFBLElBQUEsTUFBQSxNQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE1BQUEsUUFBQSxJQUFBLFNBQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO01BQ0EsSUFBQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUEsS0FBQTtPQUNBLElBQUEsT0FBQSxLQUFBLEtBQUEsUUFBQSxNQUFBLElBQUEsT0FBQTthQUNBO09BQ0EsSUFBQSxPQUFBLE9BQUEsR0FBQTs7O0tBR0E7V0FDQSxJQUFBLE9BQUEsSUFBQSxVQUFBLFVBQUE7S0FDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxXQUFBO1dBQ0E7VUFDQTtJQUNBLFNBQUEsV0FBQTtLQUNBLFNBQUEsS0FBQSxPQUFBO09BQ0E7O0dBRUEsUUFBQSxJQUFBLEtBQUEsUUFBQTs7RUFFQSxJQUFBLEtBQUEsS0FBQSxLQUFBLFNBQUEsT0FBQSxJQUFBO0dBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtJQUNBLFFBQUEsTUFBQSxNQUFBOztHQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsS0FBQTtJQUNBLElBQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLFdBQUE7TUFDQSxHQUFBLE9BQUE7UUFDQTs7O0dBR0E7Ozs7Ozs7O0VBUUEsS0FBQSxRQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxDQUFBLE1BQUEsUUFBQSxNQUFBLEdBQUE7UUFDQSxHQUFBOztFQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUEsSUFBQTtHQUNBLElBQUEsT0FBQSxPQUFBLFlBQUEsTUFBQSxRQUFBLE1BQUE7SUFDQSxNQUFBOztHQUVBLEdBQUE7O0VBRUEsS0FBQSxTQUFBLFNBQUEsS0FBQSxJQUFBO0dBQ0EsSUFBQSxJQUFBLEtBQUE7O0VBRUEsS0FBQSxXQUFBLFNBQUEsS0FBQSxHQUFBO0dBQ0EsR0FBQSxPQUFBLE9BQUEsU0FBQTtJQUNBLE1BQUE7O0dBRUEsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLFdBQUEsU0FBQSxJQUFBO0dBQ0EsR0FBQTs7RUFFQSxLQUFBLGNBQUEsU0FBQSxLQUFBLEdBQUEsRUFBQSxHQUFBO0VBQ0EsS0FBQSxhQUFBLFNBQUEsS0FBQSxJQUFBLElBQUE7R0FDQSxPQUFBLElBQUEsS0FBQSxTQUFBLElBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQSxJQUFBOzs7OztFQUtBLElBQUEsVUFBQSxTQUFBLEtBQUEsT0FBQSxLQUFBLE1BQUE7R0FDQSxJQUFBLE1BQUEsUUFBQSxPQUFBLENBQUEsR0FBQTtJQUNBLFFBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLElBQUEsU0FBQSxPQUFBLElBQUEsUUFBQSxZQUFBLE1BQUEsUUFBQSxJQUFBO0tBQ0E7SUFDQSxJQUFBLENBQUEsSUFBQSxNQUFBLElBQUEsT0FBQTtJQUNBLE9BQUEsUUFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLE1BQUEsS0FBQTs7R0FFQSxJQUFBLE9BQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxJQUFBLFFBQUEsU0FBQSxVQUFBO0tBQ0EsSUFBQSxTQUFBO09BQ0E7OztFQUdBLElBQUEsT0FBQSxTQUFBLE1BQUEsS0FBQTtHQUNBLEdBQUEsS0FBQSxRQUFBLE1BQUEsSUFBQSxNQUFBO0dBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxTQUFBO0lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQSxTQUFBLE1BQUEsU0FBQTtLQUNBLFFBQUEsS0FBQSxLQUFBLEtBQUEsU0FBQSxNQUFBLFFBQUEsTUFBQTs7O0dBR0EsR0FBQSxLQUFBLE9BQUEsTUFBQSxTQUFBO0lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBO0lBQ0EsR0FBQSxNQUFBLFFBQUEsR0FBQTtLQUNBLElBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQTtNQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsRUFBQSxHQUFBLFNBQUEsRUFBQSxHQUFBLEtBQUE7T0FDQSxTQUFBLEtBQUEsRUFBQSxHQUFBLE9BQUEsRUFBQSxHQUFBOzs7VUFHQSxHQUFBLE9BQUEsS0FBQSxZQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUE7S0FDQSxTQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7OztHQUdBLEtBQUEsUUFBQSxNQUFBLEtBQUE7R0FDQSxLQUFBLFFBQUEsTUFBQSxJQUFBLE9BQUE7R0FDQSxHQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLElBQUEsT0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBO0tBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxVQUFBLGNBQUEsRUFBQSxPQUFBLE1BQUE7S0FDQSxHQUFBLE9BQUEsRUFBQSxTQUFBLGNBQUEsQ0FBQSxFQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsQ0FBQSxLQUFBLFFBQUEsTUFBQSxLQUFBO01BQ0EsS0FBQSxRQUFBLE1BQUEsT0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxNQUFBO01BQ0EsR0FBQSxDQUFBLE9BQUE7TUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUEsUUFBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsU0FBQTs7TUFFQSxLQUFBLFFBQUEsTUFBQSxLQUFBLE9BQUEsS0FBQTtNQUNBLEdBQUEsT0FBQSxFQUFBLFFBQUEsV0FBQTtPQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsT0FBQSxLQUFBLEVBQUE7OztLQUdBLElBQUEsRUFBQSxNQUFBLEtBQUEsU0FBQSxNQUFBO01BQ0EsSUFBQTs7OztHQUlBLEdBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsSUFBQSxPQUFBLEtBQUEsT0FBQSxNQUFBLE1BQUE7S0FDQSxJQUFBLFFBQUEsS0FBQSxPQUFBLE1BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFVBQUEsY0FBQSxNQUFBLE9BQUEsTUFBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsY0FBQSxDQUFBLE1BQUEsTUFBQSxNQUFBO0tBQ0EsR0FBQSxDQUFBLEtBQUEsUUFBQSxNQUFBLEtBQUE7TUFDQSxLQUFBLFFBQUEsTUFBQSxPQUFBOztNQUVBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQTtLQUNBLEdBQUEsT0FBQSxNQUFBLFFBQUEsV0FBQTtNQUNBLEtBQUEsUUFBQSxNQUFBLEtBQUEsS0FBQSxNQUFBOzs7OztFQUtBLElBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxHQUFBO0dBQ0EsTUFBQSxJQUFBLFVBQUEsT0FBQSxRQUFBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsSUFBQSxLQUFBLE1BQUE7S0FDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxLQUFBLFFBQUEsS0FBQTtNQUNBLEtBQUEsTUFBQSxLQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLE1BQUE7TUFDQSxHQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsUUFBQSxPQUFBLEtBQUEsTUFBQSxJQUFBLEtBQUE7V0FDQSxJQUFBLE9BQUEsTUFBQSxZQUFBO0tBQ0EsR0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsT0FBQSxLQUFBLE1BQUEsSUFBQSxLQUFBOztJQUVBLEdBQUEsS0FBQSxLQUFBO0tBQ0EsS0FBQSxNQUFBLEtBQUEsTUFBQTs7Ozs7Ozs7QUFRQSxRQUFBLE9BQUEsY0FBQTtLQUNBLFFBQUEsb0NBQUEsU0FBQSxVQUFBLFlBQUE7UUFDQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLE9BQUEsU0FBQSxNQUFBLFFBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxXQUFBLENBQUEsT0FBQSxlQUFBLENBQUEsT0FBQTtnQkFDQSxPQUFBLFFBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSw2Q0FBQSxDQUFBLEtBQUEsVUFBQSxTQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUEsWUFBQSxDQUFBLEtBQUEsVUFBQSxPQUFBLE1BQUEsS0FBQSxLQUFBLE9BQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxTQUFBLE9BQUE7aUJBQ0EsSUFBQSxPQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsT0FBQSxjQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLElBQUEsT0FBQSxRQUFBLFFBQUEsVUFBQSxLQUFBLFFBQUEsR0FBQTtZQUNBLEtBQUEsT0FBQSxTQUFBLFFBQUEsUUFBQSxRQUFBO1lBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLFNBQUE7O1FBRUEsVUFBQSxpQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxVQUFBO1lBQ0EsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxNQUFBOztnQkFFQSxPQUFBLE9BQUEsU0FBQSxPQUFBOztvQkFFQSxNQUFBLEtBQUEsT0FBQSxNQUFBLE9BQUEsUUFBQTs7OztZQUlBLGFBQUE7O1FBRUEsVUFBQSxtQkFBQSxTQUFBLE9BQUE7UUFDQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsTUFBQTs7WUFFQSxNQUFBLFNBQUEsUUFBQTtnQkFDQSxRQUFBLE9BQUEsT0FBQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7d0JBQ0EsUUFBQSxJQUFBO3dCQUNBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE1BQUEsT0FBQTs7d0JBRUEsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxNQUFBLE9BQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsY0FBQSxNQUFBLE9BQUEsS0FBQSxjQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBOzBCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsTUFBQSxPQUFBOzt3QkFFQTtvQkFDQSxLQUFBO3dCQUNBLE9BQUEsS0FBQSxPQUFBLE1BQUEsVUFBQSxNQUFBLFVBQUEsT0FBQSxLQUFBO3lCQUNBLE9BQUEsS0FBQSxNQUFBLE1BQUEsVUFBQSxNQUFBLFdBQUEsTUFBQSxPQUFBLGVBQUE7O3dCQUVBO29CQUNBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE9BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsV0FBQSxNQUFBLE9BQUEsZUFBQTs7d0JBRUE7b0JBQ0EsS0FBQTt3QkFDQSxPQUFBLEtBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE1BQUEsT0FBQSxjQUFBLE1BQUEsT0FBQSxLQUFBLGNBQUE7d0JBQ0EsT0FBQSxLQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O3dCQUVBO29CQUNBO3dCQUNBLE9BQUEsS0FBQSxRQUFBOztnQkFFQSxPQUFBLENBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQSxLQUFBOztnQkFFQSxLQUFBLFVBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsTUFBQSxVQUFBLE1BQUEsVUFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsT0FBQSxNQUFBLFVBQUEsTUFBQSxVQUFBLE9BQUEsS0FBQTs7b0JBRUEsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsZ0JBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxnQkFBQSxPQUFBLEtBQUE7O29CQUVBLElBQUEsUUFBQSxTQUFBLGdCQUFBLGVBQUEsQ0FBQSxNQUFBLFVBQUEsTUFBQSxXQUFBLE9BQUEsS0FBQSxlQUFBLE9BQUEsS0FBQTs7OztvQkFJQSxRQUFBLElBQUE7b0JBQ0EsUUFBQSxJQUFBO29CQUNBLFFBQUEsSUFBQTtvQkFDQSxRQUFBLElBQUE7OztvQkFHQSxJQUFBLFFBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsS0FBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFNBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLFFBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLEtBQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsSUFBQSxPQUFBO3dCQUNBLE9BQUEsT0FBQSxNQUFBOzJCQUNBLElBQUEsUUFBQTt3QkFDQSxPQUFBLE9BQUEsTUFBQTsyQkFDQSxJQUFBLE1BQUE7d0JBQ0EsT0FBQSxPQUFBLE1BQUE7MkJBQ0EsT0FBQSxPQUFBLE1BQUE7b0JBQ0EsS0FBQSxLQUFBLE9BQUEsTUFBQSxPQUFBLFFBQUE7Ozs7O0FBS0EsUUFBQSxPQUFBLFdBQUE7O0FBRUEsUUFBQSxPQUFBLGlCQUFBLElBQUEsK0JBQUEsU0FBQSxZQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7Q0FDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsNEJBQUE7SUFDQSxRQUFBLFVBQUEsVUFBQTtDQUNBO0NBQ0EsR0FBQSxPQUFBLE1BQUEsVUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBLE9BQUEsU0FBQTtDQUNBLElBQUEsU0FBQSxHQUFBLFFBQUE7Q0FDQSxPQUFBO0dBQ0EsUUFBQSxxQkFBQSxTQUFBLFNBQUE7Q0FDQTtDQUNBLElBQUEsT0FBQTtDQUNBLEtBQUEsTUFBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxLQUFBLFlBQUEsV0FBQTtHQUNBLFNBQUEsVUFBQTtJQUNBLEtBQUEsSUFBQSxNQUFBO01BQ0E7T0FDQTtHQUNBLEtBQUEsU0FBQSxNQUFBOzs7SUFHQSxhQUFBLFVBQUEsTUFBQTtDQUNBO0NBQ0EsUUFBQSxRQUFBLFVBQUEsS0FBQSxTQUFBLFVBQUEsR0FBQTtFQUNBLEtBQUEsTUFBQSxFQUFBOztJQUVBLFFBQUEscUJBQUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxPQUFBO0NBQ0EsSUFBQSxNQUFBO0NBQ0EsSUFBQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLE9BQUE7RUFDQSxhQUFBO0VBQ0EsT0FBQTtFQUNBLFNBQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLE9BQUE7RUFDQSxlQUFBO0VBQ0EsYUFBQTtFQUNBLFVBQUE7RUFDQSxXQUFBO0VBQ0EsYUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7RUFDQSxTQUFBO0VBQ0EsUUFBQTtFQUNBLFVBQUE7RUFDQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsbUJBQUE7RUFDQSxvQkFBQTtFQUNBLGNBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLE9BQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsTUFBQTtFQUNBLE1BQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLE9BQUE7RUFDQSxPQUFBO0VBQ0EsWUFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0VBQ0EsY0FBQTtFQUNBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOztDQUVBLEtBQUEsUUFBQSxTQUFBLEtBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxRQUFBLEtBQUE7R0FDQSxHQUFBLElBQUEsR0FBQSxPQUFBLE1BQUEsU0FBQSxJQUFBLEdBQUE7OztDQUdBLEtBQUEsS0FBQSxTQUFBLE1BQUEsR0FBQTtFQUNBLEdBQUEsT0FBQSxNQUFBLFlBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUE7RUFDQSxHQUFBLENBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxRQUFBLFVBQUEsT0FBQSxDQUFBO0VBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxLQUFBO0dBQ0EsR0FBQSxPQUFBLE1BQUEsS0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLEtBQUE7S0FDQSxLQUFBLE1BQUEsS0FBQTtLQUNBLElBQUE7Ozs7O0lBS0EsUUFBQSxPQUFBLFVBQUE7Q0FDQTtDQUNBLEtBQUEsZ0JBQUEsU0FBQSxNQUFBLFNBQUE7RUFDQSxJQUFBLElBQUEsSUFBQTtFQUNBLEVBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxTQUFBLEVBQUEsT0FBQTs7RUFFQSxFQUFBLGNBQUE7O0NBRUEsS0FBQSxhQUFBLFNBQUEsTUFBQSxTQUFBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLFFBQUEsSUFBQTtFQUNBLEtBQUEsUUFBQSxLQUFBLFNBQUE7RUFDQSxLQUFBLFNBQUEsS0FBQSxVQUFBO0VBQ0EsR0FBQSxLQUFBLEtBQUEsTUFBQSxnQkFBQSxLQUFBLEtBQUEsTUFBQTtHQUNBLE9BQUEsUUFBQSxJQUFBO0VBQ0EsSUFBQSxTQUFBLElBQUE7RUFDQSxPQUFBLFNBQUEsVUFBQSxXQUFBO0dBQ0EsSUFBQSxnQkFBQSxTQUFBLGNBQUE7R0FDQSxJQUFBLGVBQUEsU0FBQSxjQUFBO0dBQ0EsYUFBQSxTQUFBLFdBQUE7SUFDQSxJQUFBLFlBQUEsS0FBQSxRQUFBLEtBQUE7SUFDQSxJQUFBLFdBQUEsYUFBQSxRQUFBLGFBQUE7SUFDQSxJQUFBLFdBQUEsV0FBQTtLQUNBLFFBQUEsS0FBQTtLQUNBLFNBQUEsUUFBQTtXQUNBO0tBQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxTQUFBOztJQUVBLGNBQUEsUUFBQTtJQUNBLGNBQUEsU0FBQTtJQUNBLElBQUEsVUFBQSxjQUFBLFdBQUE7SUFDQSxRQUFBLFVBQUEsY0FBQSxHQUFBLElBQUEsT0FBQTtJQUNBLFNBQUEsY0FBQSxVQUFBLGFBQUE7O0dBRUEsYUFBQSxNQUFBLFVBQUEsT0FBQTs7RUFFQSxPQUFBLGNBQUEsS0FBQTs7R0FFQSxRQUFBLFFBQUEsVUFBQTtDQUNBO0NBQ0EsS0FBQSxNQUFBLFNBQUEsSUFBQTtFQUNBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsSUFBQSxJQUFBLE9BQUEsSUFBQTtHQUNBLEdBQUEsSUFBQSxNQUFBLE9BQUEsU0FBQSxNQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Q0FJQSxLQUFBLE1BQUEsVUFBQTtFQUNBLElBQUEsT0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUE7RUFDQSxPQUFBLEtBQUEsUUFBQSxLQUFBLElBQUEsTUFBQTtFQUNBLEtBQUE7RUFDQSxJQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7R0FDQSxLQUFBLEtBQUEsS0FBQSxHQUFBLE1BQUE7R0FDQSxFQUFBLEtBQUEsR0FBQSxNQUFBLEtBQUEsR0FBQTs7RUFFQSxPQUFBOzs7QUFHQSxRQUFBLE9BQUEsZ0JBQUE7S0FDQSxRQUFBLG1DQUFBLFNBQUEsVUFBQSxZQUFBO1FBQ0E7Ozs7UUFJQSxJQUFBLE9BQUE7UUFDQSxLQUFBLFdBQUE7UUFDQSxLQUFBLFFBQUEsU0FBQSxJQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7Z0JBQ0EsSUFBQSxLQUFBLFNBQUEsR0FBQSxNQUFBLElBQUE7b0JBQ0EsS0FBQSxTQUFBLEdBQUEsR0FBQTtvQkFDQSxLQUFBLFNBQUEsT0FBQSxHQUFBO29CQUNBOzs7OztRQUtBLEtBQUEsT0FBQSxTQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBO1lBQ0EsSUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLEtBQUEsS0FBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxJQUFBLEtBQUE7WUFDQSxJQUFBLElBQUEsVUFBQSxTQUFBLElBQUE7aUJBQ0EsSUFBQSxJQUFBLGFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBLE1BQUEsSUFBQSxjQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsU0FBQTtnQkFDQSxTQUFBO2dCQUNBLFNBQUE7O1lBRUEsU0FBQTtZQUNBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLFNBQUE7O2FBRUEsUUFBQSxJQUFBLElBQUE7bUJBQ0E7YUFDQSxJQUFBLE9BQUEsUUFBQSxRQUFBLFVBQUEsS0FBQSxRQUFBLEdBQUE7SUFDQSxLQUFBLE9BQUEsU0FBQSxRQUFBLFFBQUEsUUFBQTtJQUNBLFFBQUEsUUFBQSxVQUFBLEtBQUEsUUFBQSxTQUFBOztZQUVBLE9BQUEsSUFBQTs7UUFFQSxVQUFBLGlCQUFBLFNBQUEsTUFBQTtRQUNBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7WUFDQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBOztZQUVBLE1BQUEsU0FBQSxPQUFBLElBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLFFBQUEsU0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxRQUFBLFNBQUEsR0FBQSxNQUFBLE1BQUEsSUFBQTt3QkFDQSxRQUFBLFNBQUEsR0FBQSxLQUFBOzs7O1lBSUEsYUFBQTs7O0FBR0EsUUFBQSxPQUFBLDBCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsMEJBQUE7O0FBRUEsUUFBQSxPQUFBLDhCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsOEJBQUE7O0FBRUEsUUFBQSxPQUFBLHlCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEseUJBQUE7O0FBRUEsUUFBQSxPQUFBLDZCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsNkJBQUE7O0FBRUEsUUFBQSxPQUFBLG1CQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsbUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHFCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEscUJBQUE7O0FBRUEsUUFBQSxPQUFBLHVCQUFBLElBQUEsSUFBQSxDQUFBLGtCQUFBLFNBQUEsZ0JBQUE7Q0FDQSxlQUFBLElBQUEsdUJBQUE7SUFDQSIsImZpbGUiOiJ3Y29tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoXCJ3Y29tXCIsIFtcImFuZ3VsYXItY2xpY2stb3V0c2lkZVwiLCBcIndjb21fZGV2XCIsIFwid2NvbV9kaXJlY3RpdmVzXCIsIFwid2NvbV9maWx0ZXJzXCIsIFwid2NvbV9tb2RhbFwiLCBcIndjb21fbW9uZ29cIiwgXCJ3Y29tX3BvcHVwXCIsIFwid2NvbV9zZFwiLCBcIndjb21fc2VydmljZXNcIiwgXCJ3Y29tX3NwaW5uZXJcIiwgXCJ3Y29tX3dtb2RhZXJhdG9ycy5odG1sXCIsIFwid2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWxcIiwgXCJ3Y29tX3dtb2RlcmF0b3JzLmh0bWxcIiwgXCJ3Y29tX3dtb2RlcmF0b3Jzdmlldy5odG1sXCIsIFwid2NvbV93dGFncy5odG1sXCIsIFwid21vZGFsX21vZGFsLmh0bWxcIiwgXCJ3bW9kYWxfcG9wdXAuaHRtbFwiLCBcIndtb2RhbF9zcGlubmVyLmh0bWxcIl0pO1xuLypnbG9iYWwgYW5ndWxhciwgbmF2aWdhdG9yKi9cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBhbmd1bGFyXHJcbiAgICAgICAgLm1vZHVsZSgnYW5ndWxhci1jbGljay1vdXRzaWRlJywgW10pXHJcbiAgICAgICAgLmRpcmVjdGl2ZSgnY2xpY2tPdXRzaWRlJywgW1xyXG4gICAgICAgICAgICAnJGRvY3VtZW50JywgJyRwYXJzZScsICckdGltZW91dCcsXHJcbiAgICAgICAgICAgIGNsaWNrT3V0c2lkZVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gICAgICogQG5hbWUgYW5ndWxhci1jbGljay1vdXRzaWRlLmRpcmVjdGl2ZTpjbGlja091dHNpZGVcclxuICAgICAqIEBkZXNjcmlwdGlvbiBEaXJlY3RpdmUgdG8gYWRkIGNsaWNrIG91dHNpZGUgY2FwYWJpbGl0aWVzIHRvIERPTSBlbGVtZW50c1xyXG4gICAgICogQHJlcXVpcmVzICRkb2N1bWVudFxyXG4gICAgICogQHJlcXVpcmVzICRwYXJzZVxyXG4gICAgICogQHJlcXVpcmVzICR0aW1lb3V0XHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiBjbGlja091dHNpZGUoJGRvY3VtZW50LCAkcGFyc2UsICR0aW1lb3V0KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlLCBlbGVtLCBhdHRyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcG9zdHBvbmUgbGlua2luZyB0byBuZXh0IGRpZ2VzdCB0byBhbGxvdyBmb3IgdW5pcXVlIGlkIGdlbmVyYXRpb25cclxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSAoYXR0ci5vdXRzaWRlSWZOb3QgIT09IHVuZGVmaW5lZCkgPyBhdHRyLm91dHNpZGVJZk5vdC5zcGxpdCgvWyAsXSsvKSA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZXZlbnRIYW5kbGVyKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBvdXIgZWxlbWVudCBhbHJlYWR5IGhpZGRlbiBhbmQgYWJvcnQgaWYgc29cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuZWxlbWVudChlbGVtKS5oYXNDbGFzcyhcIm5nLWhpZGVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gY2xpY2sgdGFyZ2V0LCBubyBwb2ludCBnb2luZyBvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWUgfHwgIWUudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgYXZhaWxhYmxlIGVsZW1lbnRzLCBsb29raW5nIGZvciBjbGFzc2VzIGluIHRoZSBjbGFzcyBsaXN0IHRoYXQgbWlnaHQgbWF0Y2ggYW5kIHNvIHdpbGwgZWF0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoZWxlbWVudCA9IGUudGFyZ2V0OyBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgZWxlbWVudCBpcyB0aGUgc2FtZSBlbGVtZW50IHRoZSBkaXJlY3RpdmUgaXMgYXR0YWNoZWQgdG8gYW5kIGV4aXQgaWYgc28gKHByb3BzIEBDb3N0aWNhUHVudGFydSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBlbGVtWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdyB3ZSBoYXZlIGRvbmUgdGhlIGluaXRpYWwgY2hlY2tzLCBzdGFydCBnYXRoZXJpbmcgaWQncyBhbmQgY2xhc3Nlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBlbGVtZW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMgPSBlbGVtZW50LmNsYXNzTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gY2xhc3NMaXN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbndyYXAgU1ZHQW5pbWF0ZWRTdHJpbmcgY2xhc3Nlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzTmFtZXMgJiYgY2xhc3NOYW1lcy5iYXNlVmFsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzID0gY2xhc3NOYW1lcy5iYXNlVmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGFyZSBubyBjbGFzcyBuYW1lcyBvbiB0aGUgZWxlbWVudCBjbGlja2VkLCBza2lwIHRoZSBjaGVja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzTmFtZXMgfHwgaWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIHRoZSBlbGVtZW50cyBpZCdzIGFuZCBjbGFzc25hbWVzIGxvb2tpbmcgZm9yIGV4Y2VwdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vcHJlcGFyZSByZWdleCBmb3IgY2xhc3Mgd29yZCBtYXRjaGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gbmV3IFJlZ0V4cCgnXFxcXGInICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxiJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3IgZXhhY3QgbWF0Y2hlcyBvbiBpZCdzIG9yIGNsYXNzZXMsIGJ1dCBvbmx5IGlmIHRoZXkgZXhpc3QgaW4gdGhlIGZpcnN0IHBsYWNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoaWQgIT09IHVuZGVmaW5lZCAmJiByLnRlc3QoaWQpKSB8fCAoY2xhc3NOYW1lcyAmJiByLnRlc3QoY2xhc3NOYW1lcykpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3cgbGV0J3MgZXhpdCBvdXQgYXMgaXQgaXMgYW4gZWxlbWVudCB0aGF0IGhhcyBiZWVuIGRlZmluZWQgYXMgYmVpbmcgaWdub3JlZCBmb3IgY2xpY2tpbmcgb3V0c2lkZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBoYXZlIGdvdCB0aGlzIGZhciwgdGhlbiB3ZSBhcmUgZ29vZCB0byBnbyB3aXRoIHByb2Nlc3NpbmcgdGhlIGNvbW1hbmQgcGFzc2VkIGluIHZpYSB0aGUgY2xpY2stb3V0c2lkZSBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiA9ICRwYXJzZShhdHRyWydjbGlja091dHNpZGUnXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbigkc2NvcGUsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGRldmljZXMgaGFzIGEgdG91Y2hzY3JlZW4sIGxpc3RlbiBmb3IgdGhpcyBldmVudFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfaGFzVG91Y2goKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZXZlbnRIYW5kbGVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0aWxsIGxpc3RlbiBmb3IgdGhlIGNsaWNrIGV2ZW50IGV2ZW4gaWYgdGhlcmUgaXMgdG91Y2ggdG8gY2F0ZXIgZm9yIHRvdWNoc2NyZWVuIGxhcHRvcHNcclxuICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub24oJ2NsaWNrJywgZXZlbnRIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiB0aGUgc2NvcGUgaXMgZGVzdHJveWVkLCBjbGVhbiB1cCB0aGUgZG9jdW1lbnRzIGV2ZW50IGhhbmRsZXJzIGFzIHdlIGRvbid0IHdhbnQgaXQgaGFuZ2luZyBhcm91bmRcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX2hhc1RvdWNoKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkb2N1bWVudC5vZmYoJ3RvdWNoc3RhcnQnLCBldmVudEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9jdW1lbnQub2ZmKCdjbGljaycsIGV2ZW50SGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBQcml2YXRlIGZ1bmN0aW9uIHRvIGF0dGVtcHQgdG8gZmlndXJlIG91dCBpZiB3ZSBhcmUgb24gYSB0b3VjaCBkZXZpY2VcclxuICAgICAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfaGFzVG91Y2goKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdvcmtzIG9uIG1vc3QgYnJvd3NlcnMsIElFMTAvMTEgYW5kIFN1cmZhY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHM7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufSkoKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9kZXZcIiwgW10pLnJ1bihbZnVuY3Rpb24oJGh0dHApe1xyXG5cdHZhciB1cGRhdGU7XHJcblx0dmFyIGNoZWNrX3JlZnJlc2ggPSBmdW5jdGlvbigpe1xyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHQkaHR0cC5nZXQoJy93YXcvbGFzdF91cGRhdGUnKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG5cdFx0XHRcdGlmKHJlc3AuZGF0YSAhPSB1cGRhdGUpe1xyXG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRjaGVja19yZWZyZXNoKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sIDIwMDApO1xyXG5cdH1cclxuXHQkaHR0cC5nZXQoJy93YXcvbGFzdF91cGRhdGUnKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG5cdFx0aWYocmVzcC5kYXRhKXtcclxuXHRcdFx0dXBkYXRlID0gcmVzcC5kYXRhO1xyXG5cdFx0XHRjaGVja19yZWZyZXNoKCk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid2NvbV9kaXJlY3RpdmVzXCIsIFtdKVxyXG4uZGlyZWN0aXZlKCdwdWxsZmlsZXMnLCBmdW5jdGlvbigpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm57XHJcblx0XHRyZXN0cmljdDogJ0UnLCBzY29wZTogdHJ1ZSwgcmVwbGFjZTogdHJ1ZSxcclxuXHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgaW1nLCAkdGltZW91dCwgZmlsZSl7XHJcblx0XHRcdHZhciBpbnB1dHMgPSAkc2NvcGUuaW5wdXRzID0gW107XHJcblx0XHRcdGZpbGUuYWRkRGVsYXkgPSBmdW5jdGlvbihvcHRzLCBjYil7XHJcblx0XHRcdFx0aWYodHlwZW9mIGNiICE9ICdmdW5jdGlvbicgfHwgIW9wdHMuaWQpIHJldHVybjtcclxuXHRcdFx0XHRvcHRzLm11bHRpcGxlID0gISFvcHRzLm11bHRpcGxlO1xyXG5cdFx0XHRcdGlucHV0cy5wdXNoKG9wdHMpO1xyXG5cdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRpZihvcHRzLm11bHRpcGxlKXtcclxuXHRcdFx0XHRcdFx0dmFyIGFkZEltYWdlID0gZnVuY3Rpb24oZmlsZSkge1xyXG5cdFx0XHRcdFx0XHRcdGltZy5yZXNpemVVcFRvKHtcclxuXHRcdFx0XHRcdFx0XHRcdGZpbGU6IGZpbGUsXHJcblx0XHRcdFx0XHRcdFx0XHR3aWR0aDogb3B0cy53aWR0aHx8MTkyMCxcclxuXHRcdFx0XHRcdFx0XHRcdGhlaWdodDogb3B0cy5oZWlnaHR8fDEwODBcclxuXHRcdFx0XHRcdFx0XHR9LCBmdW5jdGlvbihkYXRhVXJsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRjYihkYXRhVXJsLCBmaWxlKTtcclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRzLmlkKSlcclxuXHRcdFx0XHRcdFx0LmJpbmQoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2dCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSBldnQuY3VycmVudFRhcmdldCB8fCBldnQudGFyZ2V0O1xyXG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0LmZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRhZGRJbWFnZSh0YXJnZXQuZmlsZXNbaV0pO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdHMuaWQpKVxyXG5cdFx0XHRcdFx0XHQuYmluZCgnY2hhbmdlJywgZnVuY3Rpb24oZXZ0KSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9IGV2dC5jdXJyZW50VGFyZ2V0IHx8IGV2dC50YXJnZXQ7XHJcblx0XHRcdFx0XHRcdFx0aW1nLnJlc2l6ZVVwVG8oe1xyXG5cdFx0XHRcdFx0XHRcdFx0ZmlsZTogdGFyZ2V0LmZpbGVzWzBdLFxyXG5cdFx0XHRcdFx0XHRcdFx0d2lkdGg6IG9wdHMud2lkdGh8fDE5MjAsXHJcblx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IG9wdHMuaGVpZ2h0fHwxMDgwXHJcblx0XHRcdFx0XHRcdFx0fSwgZnVuY3Rpb24oZGF0YVVybCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y2IoZGF0YVVybCwgdGFyZ2V0LmZpbGVzWzBdKTtcclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LCAyNTApO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0dGVtcGxhdGU6ICc8aW5wdXQgbmctcmVwZWF0PVwiaSBpbiBpbnB1dHNcIiB0eXBlPVwiZmlsZVwiIG5nLWhpZGU9XCJ0cnVlXCIgaWQ9XCJ7e2kuaWR9fVwiIG11bHRpcGxlPVwie3tpLm11bHRpcGxlfX1cIj4nXHJcblx0fVxyXG59KS5kaXJlY3RpdmUoJ2Vsc2l6ZScsIGZ1bmN0aW9uKCR0aW1lb3V0LCAkd2luZG93KXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnQUUnLFxyXG5cdFx0c2NvcGU6IHtcclxuXHRcdFx0ZWxzaXplOiAnPSdcclxuXHRcdH0sIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCl7XHJcblx0XHRcdGlmKCFzY29wZS5lbHNpemUpIHNjb3BlLmVsc2l6ZT17fTtcclxuXHRcdFx0dmFyIHJlc2l6ZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0c2NvcGUuZWxzaXplLndpZHRoID0gZWxbMF0uY2xpZW50V2lkdGg7XHJcblx0XHRcdFx0c2NvcGUuZWxzaXplLmhlaWdodCA9IGVsWzBdLmNsaWVudEhlaWdodDtcclxuXHRcdFx0XHQkdGltZW91dCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2l6ZSgpO1xyXG5cdFx0XHRhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZCgncmVzaXplJywgcmVzaXplKTtcclxuXHRcdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRyZXR1cm4gW2VsWzBdLmNsaWVudFdpZHRoLCBlbFswXS5jbGllbnRIZWlnaHRdLmpvaW4oJ3gnKTtcclxuXHRcdFx0fSxmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRpZih2YWx1ZS5zcGxpdCgneCcpWzBdPjApIHNjb3BlLmVsc2l6ZS53aWR0aCA9IHZhbHVlLnNwbGl0KCd4JylbMF07XHJcblx0XHRcdFx0aWYodmFsdWUuc3BsaXQoJ3gnKVsxXT4wKSBzY29wZS5lbHNpemUuaGVpZ2h0ID0gdmFsdWUuc3BsaXQoJ3gnKVsxXTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG59KS5kaXJlY3RpdmUoJ3d0YWdzJywgZnVuY3Rpb24oJGZpbHRlcil7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0FFJyxcclxuXHRcdHNjb3BlOiB7XHJcblx0XHRcdG9iamVjdDogJz0nLFxyXG5cdFx0XHRtb2RlbDogJ0AnLFxyXG5cdFx0XHRjaGFuZ2U6ICcmJ1xyXG5cdFx0fSwgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlKXtcclxuXHRcdFx0JHNjb3BlLnRhZ3MgPSAkZmlsdGVyKCd0b0FycicpKCRzY29wZS5vYmplY3RbJHNjb3BlLm1vZGVsXSk7XHJcblx0XHRcdCRzY29wZS51cGRhdGVfdGFncyA9IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHNjb3BlLm9iamVjdFskc2NvcGUubW9kZWxdID0gJHNjb3BlLnRhZ3Muam9pbignLCAnKTtcclxuXHRcdFx0XHRpZih0eXBlb2YgJHNjb3BlLmNoYW5nZSA9PSAnZnVuY3Rpb24nKSAkc2NvcGUuY2hhbmdlKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0JHNjb3BlLmVudGVyID0gZnVuY3Rpb24oZSl7XHJcblx0XHRcdFx0aWYoZS5rZXlDb2RlPT0xMyl7XHJcblx0XHRcdFx0XHRpZigkc2NvcGUubmV3X3RhZyl7XHJcblx0XHRcdFx0XHRcdCRzY29wZS50YWdzLnB1c2goJHNjb3BlLm5ld190YWcpO1xyXG5cdFx0XHRcdFx0XHQkc2NvcGUudXBkYXRlX3RhZ3MoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdCRzY29wZS5uZXdfdGFnID0gbnVsbDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0sIHRlbXBsYXRlVXJsOiAnd2NvbV93dGFncy5odG1sJ1xyXG5cdH1cclxufSkuZGlyZWN0aXZlKCd3bW9kYWVyYXRvcnMnLCBmdW5jdGlvbigkZmlsdGVyKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnQUUnLFxyXG5cdFx0c2NvcGU6IHtcclxuXHRcdFx0YXJyOiAnPScsXHJcblx0XHRcdHVzZXJzOiAnPScsXHJcblx0XHRcdGhvbGRlcjogJ0AnLFxyXG5cdFx0XHRjaGFuZ2U6ICcmJ1xyXG5cdFx0fSwgdGVtcGxhdGVVcmw6ICd3Y29tX3dtb2RhZXJhdG9ycy5odG1sJ1xyXG5cdH1cclxufSkuZGlyZWN0aXZlKCd3bW9kYWVyYXRvcnN2aWV3JywgZnVuY3Rpb24oJGZpbHRlcil7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0FFJyxcclxuXHRcdHNjb3BlOiB7XHJcblx0XHRcdGFycjogJz0nXHJcblx0XHR9LCB0ZW1wbGF0ZVVybDogJ3djb21fd21vZGFlcmF0b3Jzdmlldy5odG1sJ1xyXG5cdH1cclxufSk7XG5TdHJpbmcucHJvdG90eXBlLnJBbGwgPSBmdW5jdGlvbihzZWFyY2gsIHJlcGxhY2VtZW50KSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcztcclxuICAgIHJldHVybiB0YXJnZXQuc3BsaXQoc2VhcmNoKS5qb2luKHJlcGxhY2VtZW50KTtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX2ZpbHRlcnNcIiwgW10pXHJcbi5maWx0ZXIoJ3RvQXJyJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKHN0ciwgZGl2KXtcclxuXHRcdGlmKCFzdHIpIHJldHVybiBbXTtcclxuXHRcdHN0cj1zdHIuc3BsaXQoKGRpdnx8JywnKSsnICcpLmpvaW4oJywnKTtcclxuXHRcdHZhciBhcnIgPSBzdHIuc3BsaXQoZGl2fHwnLCcpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRpZighYXJyW2ldKSBhcnIuc3BsaWNlKGksIDEpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGFycjtcclxuXHR9XHJcbn0pLmZpbHRlcignckFycicsIGZ1bmN0aW9uKCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiBmdW5jdGlvbihvcmlnaW5fYXJyLCByZW1vdmVfYXJyKXtcclxuXHRcdHZhciBhcnIgPSBvcmlnaW5fYXJyLnNsaWNlKCk7XHJcblx0XHRmb3IgKHZhciBpID0gYXJyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcmVtb3ZlX2Fyci5sZW5ndGg7IGorKykge1xyXG5cdFx0XHRcdGlmKHJlbW92ZV9hcnJbal0uX2lkID09IGFycltpXS5faWQpe1xyXG5cdFx0XHRcdFx0YXJyLnNwbGljZShpLCAxKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGFycjtcclxuXHR9XHJcbn0pLmZpbHRlcignbW9uZ29kYXRlJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKF9pZCl7XHJcblx0XHRpZighX2lkKSByZXR1cm4gbmV3IERhdGUoKTtcclxuXHRcdHZhciB0aW1lc3RhbXAgPSBfaWQudG9TdHJpbmcoKS5zdWJzdHJpbmcoMCw4KTtcclxuXHRcdHJldHVybiBuZXcgRGF0ZShwYXJzZUludCh0aW1lc3RhbXAsMTYpKjEwMDApO1xyXG5cdH1cclxufSkuZmlsdGVyKCdmaXhsaW5rJywgZnVuY3Rpb24oKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKGxpbmspe1xyXG5cdFx0aWYoIWxpbmt8fGxpbmsuaW5kZXhPZignLy8nKT4wKSByZXR1cm4gbGluaztcclxuXHRcdGVsc2UgcmV0dXJuICdodHRwOi8vJytsaW5rO1xyXG5cdH1cclxufSkuZmlsdGVyKCd3ZGF0ZScsIGZ1bmN0aW9uKCRmaWx0ZXIpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4gZnVuY3Rpb24odGltZSwgYWRkWWVhciwgYWRkTW9udGgsIGFkZERheSl7XHJcblx0XHR0aW1lID0gbmV3IERhdGUodGltZSk7XHJcblx0XHRpZihhZGRZZWFyKXtcclxuXHRcdFx0dGltZS5zZXRGdWxsWWVhcih0aW1lLmdldEZ1bGxZZWFyKCkgKyBwYXJzZUludChhZGRZZWFyKSk7XHJcblx0XHR9XHJcblx0XHRpZihhZGRNb250aCl7XHJcblx0XHRcdHRpbWUuc2V0TW9udGgodGltZS5nZXRNb250aCgpICsgcGFyc2VJbnQoYWRkTW9udGgpKTtcclxuXHRcdH1cclxuXHRcdGlmKGFkZERheSl7XHJcblx0XHRcdHRpbWUuc2V0RGF0ZSh0aW1lLmdldERhdGUoKSArIHBhcnNlSW50KGFkZERheSkpO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHRpbWVtcyA9IHRpbWUuZ2V0VGltZSgpO1xyXG5cdFx0dmFyIG5vd21zID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHR2YXIgZGF5bXMgPSBub3dtcyAtIDg2NDAwMDAwO1xyXG5cdFx0aWYodGltZW1zPmRheW1zKXtcclxuXHRcdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAnaGg6bW0gYScpO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHllYXJtcyA9IG5vd21zIC0gKDI2MjgwMDAwMDAqMTIpO1xyXG5cdFx0aWYodGltZW1zPnllYXJtcyl7XHJcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ01NTSBkZCBoaDptbSBhJyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICd5eXl5IE1NTSBkZCBoaDptbSBhJyk7XHJcblx0fVxyXG59KS5maWx0ZXIoJ21lc3NhZ2V0aW1lJywgZnVuY3Rpb24oJGZpbHRlcil7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHJldHVybiBmdW5jdGlvbih0aW1lKXtcclxuXHRcdHRpbWUgPSBuZXcgRGF0ZSh0aW1lKTtcclxuXHRcdHZhciB0aW1lbXMgPSB0aW1lLmdldFRpbWUoKTtcclxuXHRcdHZhciBub3dtcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cdFx0dmFyIG1pbmFnbyA9IG5vd21zIC0gNjAwMDA7XHJcblx0XHRpZih0aW1lbXM+bWluYWdvKSByZXR1cm4gJ0EgbWluIGFnby4nO1xyXG5cdFx0dmFyIGRheW1zID0gbm93bXMgLSA4NjQwMDAwMDtcclxuXHRcdGlmKHRpbWVtcz5kYXltcyl7XHJcblx0XHRcdHJldHVybiAkZmlsdGVyKCdkYXRlJykodGltZSwgJ2hoOm1tIGEnKTtcclxuXHRcdH1cclxuXHRcdHZhciB5ZWFybXMgPSBub3dtcyAtICgyNjI4MDAwMDAwKjEyKTtcclxuXHRcdGlmKHRpbWVtcz55ZWFybXMpe1xyXG5cdFx0XHRyZXR1cm4gJGZpbHRlcignZGF0ZScpKHRpbWUsICdNTU0gZGQgaGg6bW0gYScpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuICRmaWx0ZXIoJ2RhdGUnKSh0aW1lLCAneXl5eSBNTU0gZGQgaGg6bW0gYScpO1xyXG5cdH1cclxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fbW9kYWxcIiwgW10pXHJcbi5zZXJ2aWNlKCdtb2RhbCcsIGZ1bmN0aW9uKCRjb21waWxlLCAkcm9vdFNjb3BlKXtcclxuXHRcIm5nSW5qZWN0XCI7XHJcblx0LypcclxuXHQqXHRNb2RhbHNcclxuXHQqL1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdFx0c2VsZi5tb2RhbHMgPSBbXTtcclxuXHRcdHRoaXMubW9kYWxfbGluayA9IGZ1bmN0aW9uKHNjb3BlLCBlbCl7XHJcblx0XHRcdHNjb3BlLmNsb3NlID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYubW9kYWxzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZihzZWxmLm1vZGFsc1tpXS5pZD09c2NvcGUuaWQpe1xyXG5cdFx0XHRcdFx0XHRzZWxmLm1vZGFscy5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZihzZWxmLm1vZGFscy5sZW5ndGggPT0gMCl7XHJcblx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2h0bWwnKS5yZW1vdmVDbGFzcygnbm9zY3JvbGwnKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYoc2NvcGUuY2IpIHNjb3BlLmNiKCk7XHJcblx0XHRcdFx0ZWwucmVtb3ZlKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLm1vZGFscy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmKHNlbGYubW9kYWxzW2ldLmlkPT1zY29wZS5pZCl7XHJcblx0XHRcdFx0XHRzZWxmLm1vZGFsc1tpXS5jbG9zZSA9IHNjb3BlLmNsb3NlO1xyXG5cdFx0XHRcdFx0c2NvcGUuX2RhdGEgPSBzZWxmLm1vZGFsc1tpXTtcclxuXHRcdFx0XHRcdGZvcih2YXIga2V5IGluIHNlbGYubW9kYWxzW2ldKXtcclxuXHRcdFx0XHRcdFx0c2NvcGVba2V5XSA9IHNlbGYubW9kYWxzW2ldW2tleV07XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRoaXMub3BlbiA9IGZ1bmN0aW9uKG9iail7XHJcblx0XHRcdGlmKCFvYmogfHwgKCFvYmoudGVtcGxhdGVVcmwgJiYgIW9iai50ZW1wbGF0ZSkpIFxyXG5cdFx0XHRcdHJldHVybiBjb25zb2xlLndhcm4oJ1BsZWFzZSBhZGQgdGVtcGxhdGVVcmwgb3IgdGVtcGxhdGUnKTsgXHJcblx0XHRcdGlmKCFvYmouaWQpIG9iai5pZCA9IERhdGUubm93KCk7XHJcblx0XHRcdHZhciBtb2RhbCA9ICc8bW9kYWwgaWQ9XCInK29iai5pZCsnXCI+JztcclxuXHRcdFx0aWYob2JqLnRlbXBsYXRlKSBtb2RhbCArPSBvYmoudGVtcGxhdGU7XHJcblx0XHRcdGVsc2UgaWYob2JqLnRlbXBsYXRlVXJsKXtcclxuXHRcdFx0XHRtb2RhbCArPSAnPG5nLWluY2x1ZGUgc3JjPVwiJztcclxuXHRcdFx0XHRtb2RhbCArPSBcIidcIitvYmoudGVtcGxhdGVVcmwrXCInXCI7XHJcblx0XHRcdFx0bW9kYWwgKz0gJ1wiIG5nLWNvbnRyb2xsZXI9XCJ3cGFyZW50XCI+PC9uZy1pbmNsdWRlPic7XHJcblx0XHRcdH1cclxuXHRcdFx0bW9kYWwgKz0gJzwvbW9kYWw+JztcclxuXHRcdFx0c2VsZi5tb2RhbHMucHVzaChvYmopO1xyXG5cdFx0XHR2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xyXG5cdFx0XHRib2R5LmFwcGVuZCgkY29tcGlsZShhbmd1bGFyLmVsZW1lbnQobW9kYWwpKSgkcm9vdFNjb3BlKSk7XHJcblx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnaHRtbCcpLmFkZENsYXNzKCdub3Njcm9sbCcpO1xyXG5cdFx0fVxyXG5cdC8qXHJcblx0Klx0RW5kIG9mIHdtb2RhbFxyXG5cdCovXHJcbn0pLmRpcmVjdGl2ZSgnbW9kYWwnLCBmdW5jdGlvbihtb2RhbCkge1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHRyYW5zY2x1ZGU6IHRydWUsXHJcblx0XHRzY29wZToge1xyXG5cdFx0XHRpZDogJ0AnXHJcblx0XHR9LCBsaW5rOiBtb2RhbC5tb2RhbF9saW5rLCB0ZW1wbGF0ZVVybDogJ3dtb2RhbF9tb2RhbC5odG1sJ1xyXG5cdH07XHJcbn0pLmNvbnRyb2xsZXIoJ3dwYXJlbnQnLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0KSB7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRpZigkc2NvcGUuJHBhcmVudC4kcGFyZW50Ll9kYXRhKXtcclxuXHRcdFx0Zm9yICh2YXIga2V5IGluICRzY29wZS4kcGFyZW50LiRwYXJlbnQuX2RhdGEpIHtcclxuXHRcdFx0XHQkc2NvcGVba2V5XSA9ICRzY29wZS4kcGFyZW50LiRwYXJlbnQuX2RhdGFba2V5XTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYoJHNjb3BlLiRwYXJlbnQuX2RhdGEpe1xyXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gJHNjb3BlLiRwYXJlbnQuX2RhdGEpIHtcclxuXHRcdFx0XHQkc2NvcGVba2V5XSA9ICRzY29wZS4kcGFyZW50Ll9kYXRhW2tleV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KTtcclxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fbW9uZ29cIiwgW10pLnNlcnZpY2UoJ21vbmdvJywgZnVuY3Rpb24oJGh0dHAsICR0aW1lb3V0LCBzb2NrZXQpe1xyXG5cdC8qXHJcblx0Klx0RGF0YSB3aWxsIGJlIHN0b3JhZ2UgZm9yIGFsbCBpbmZvcm1hdGlvbiB3ZSBhcmUgcHVsbGluZyBmcm9tIHdhdyBjcnVkLlxyXG5cdCpcdGRhdGFbJ2FycicgKyBwYXJ0XSB3aWxsIGhvc3QgYWxsIGRvY3MgZnJvbSBjb2xsZWN0aW9uIHBhcnQgaW4gYXJyYXkgZm9ybVxyXG5cdCpcdGRhdGFbJ29iaicgKyBwYXJ0XSB3aWxsIGhvc3QgYWxsIGRvY3MgZnJvbSBjb2xsZWN0aW9uIHBhcnQgaW4gb2JqZWN0IGZvcm1cclxuXHQqXHRcdGFuZCBhbGwgZ3JvdXBzIGNvbGxlY2l0b25zIHByb3ZpZGVkXHJcblx0Klx0ZGF0YVsnb3B0cycgKyBwYXJ0XSB3aWxsIGhvc3Qgb3B0aW9ucyBmb3IgZG9jcyBmcm9tIGNvbGxlY3Rpb24gcGFydFxyXG5cdCpcdFx0V2lsbCBiZSBpbml0aWFsaXplZCBvbmx5IGluc2lkZSBnZXRcclxuXHQqXHRcdFdpbGwgYmUgdXNlZCBpbnNpZGUgcHVzaFxyXG5cdCovXHJcblx0XHR2YXIgZGF0YSA9IHt9O1xyXG5cdC8qXHJcblx0Klx0d2F3IGNydWQgY29ubmVjdCBmdW5jdGlvbnNcclxuXHQqL1xyXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRjYiA9IGRvYztcclxuXHRcdFx0XHRkb2MgPSB7fTtcclxuXHRcdFx0fVxyXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpLycgKyBwYXJ0ICsgJy9jcmVhdGUnLCBkb2MgfHwge30pLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdGlmIChyZXNwLmRhdGEpIHtcclxuXHRcdFx0XHRcdHB1c2gocGFydCwgcmVzcC5kYXRhKTtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykgY2IocmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihmYWxzZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmdldCA9IGZ1bmN0aW9uKHBhcnQsIG9wdHMsIGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y2IgPSBvcHRzO1xyXG5cdFx0XHRcdG9wdHMgPSB7fTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZihkYXRhWydsb2FkZWQnK3BhcnRdKXtcclxuXHRcdFx0XHRpZih0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhWydhcnInICsgcGFydF07XHJcblx0XHRcdH1cclxuXHRcdFx0ZGF0YVsnYXJyJyArIHBhcnRdID0gW107XHJcblx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XSA9IHt9O1xyXG5cdFx0XHRkYXRhWydvcHRzJyArIHBhcnRdID0gb3B0cyA9IG9wdHMgfHwge307XHJcblx0XHRcdGlmKG9wdHMucXVlcnkpe1xyXG5cdFx0XHRcdGZvcih2YXIga2V5IGluIG9wdHMucXVlcnkpe1xyXG5cdFx0XHRcdFx0aWYodHlwZW9mIG9wdHMucXVlcnlba2V5XSA9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0XHRcdFx0b3B0cy5xdWVyeVtrZXldID0ge1xyXG5cdFx0XHRcdFx0XHRcdGFsbG93OiBvcHRzLnF1ZXJ5W2tleV1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZihvcHRzLmdyb3Vwcyl7XHJcblx0XHRcdFx0aWYodHlwZW9mIG9wdHMuZ3JvdXBzID09ICdzdHJpbmcnKXtcclxuXHRcdFx0XHRcdG9wdHMuZ3JvdXBzID0gb3B0cy5ncm91cHMuc3BsaXQoJyAnKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShvcHRzLmdyb3Vwcykpe1xyXG5cdFx0XHRcdFx0dmFyIGFyciA9IG9wdHMuZ3JvdXBzO1xyXG5cdFx0XHRcdFx0b3B0cy5ncm91cHMgPSB7fTtcclxuXHRcdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgYXJyW2ldID09ICdzdHJpbmcnKXtcclxuXHRcdFx0XHRcdFx0XHRvcHRzLmdyb3Vwc1thcnJbaV1dID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0fWVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGZvcih2YXIga2V5IGluIGFycltpXSl7XHJcblx0XHRcdFx0XHRcdFx0XHRvcHRzLmdyb3Vwc1trZXldID0gYXJyW2ldW2tleV07XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvcih2YXIga2V5IGluIG9wdHMuZ3JvdXBzKXtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldID09ICdib29sZWFuJyl7XHJcblx0XHRcdFx0XHRcdGlmKG9wdHMuZ3JvdXBzW2tleV0pe1xyXG5cdFx0XHRcdFx0XHRcdG9wdHMuZ3JvdXBzW2tleV0gPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmaWVsZDogZnVuY3Rpb24oZG9jKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGRvY1trZXldO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZ3JvdXBzW2tleV07XHJcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBvcHRzLmdyb3Vwc1trZXldICE9ICdvYmplY3QnKXtcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZ3JvdXBzW2tleV07XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYodHlwZW9mIG9wdHMuZ3JvdXBzW2tleV0uZmllbGQgIT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRcdGRlbGV0ZSBvcHRzLmdyb3Vwc1trZXldO1xyXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0JGh0dHAuZ2V0KCcvYXBpLycgKyBwYXJ0ICsgJy9nZXQnKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRpZiAocmVzcC5kYXRhKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlc3AuZGF0YS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0XHRwdXNoKHBhcnQsIHJlc3AuZGF0YVtpXSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpXHJcblx0XHRcdFx0XHRcdGNiKGRhdGFbJ2FycicgKyBwYXJ0XSwgZGF0YVsnb2JqJyArIHBhcnRdLCBvcHRzLm5hbWV8fCcnLCByZXNwLmRhdGEpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGNiKGRhdGFbJ2FycicgKyBwYXJ0XSwgZGF0YVsnb2JqJyArIHBhcnRdLCBvcHRzLm5hbWV8fCcnLCByZXNwLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkYXRhWydsb2FkZWQnK3BhcnRdPSB0cnVlO1xyXG5cdFx0XHRcdGlmKG9wdHMubmV4dCl7XHJcblx0XHRcdFx0XHRuZXh0KHBhcnQsIG9wdHMubmV4dCwgY2IpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBkYXRhWydhcnInICsgcGFydF07XHJcblx0XHR9O1xyXG5cdFx0dGhpcy51cGRhdGVBbGwgPSBmdW5jdGlvbihwYXJ0LCBkb2MsIG9wdHMsIGNiKSB7XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y2IgPSBvcHRzO1xyXG5cdFx0XHRcdG9wdHMgPSB7fTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgIT0gJ29iamVjdCcpIG9wdHMgPSB7fTtcclxuXHRcdFx0aWYgKG9wdHMuZmllbGRzKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRzLmZpZWxkcyA9PSAnc3RyaW5nJykgb3B0cy5maWVsZHMgPSBvcHRzLmZpZWxkcy5zcGxpdCgnICcpO1xyXG5cdFx0XHRcdHZhciBfZG9jID0ge307XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvcHRzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0X2RvY1tvcHRzLmZpZWxkc1tpXV0gPSBkb2Nbb3B0cy5maWVsZHNbaV1dO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkb2MgPSBfZG9jO1xyXG5cdFx0XHR9XHJcblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL3VwZGF0ZS9hbGwnICsgKG9wdHMubmFtZSB8fCAnJyksIGRvYylcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRpZiAocmVzcC5kYXRhICYmIHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGNiKHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGNiKGZhbHNlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLnVwZGF0ZVVuaXF1ZSA9IGZ1bmN0aW9uKHBhcnQsIGRvYywgb3B0cywgY2IpIHtcclxuXHRcdFx0aWYgKCFvcHRzKSBvcHRzID0gJyc7XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y2IgPSBvcHRzO1xyXG5cdFx0XHRcdG9wdHMgPSAnJztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdHMgIT0gJ29iamVjdCcpIG9wdHMgPSB7fTtcclxuXHRcdFx0aWYgKG9wdHMuZmllbGRzKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRzLmZpZWxkcyA9PSAnc3RyaW5nJykgb3B0cy5maWVsZHMgPSBvcHRzLmZpZWxkcy5zcGxpdCgnICcpO1xyXG5cdFx0XHRcdHZhciBfZG9jID0ge307XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvcHRzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0X2RvY1tvcHRzLmZpZWxkc1tpXV0gPSBkb2Nbb3B0cy5maWVsZHNbaV1dO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkb2MgPSBfZG9jO1xyXG5cdFx0XHR9XHJcblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvJyArIHBhcnQgKyAnL3VuaXF1ZS9maWVsZCcgKyBvcHRzLCBkb2MpLlxyXG5cdFx0XHR0aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGNiKHJlc3AuZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKHBhcnQsIGRvYywgb3B0cywgY2IpIHtcclxuXHRcdFx0aWYgKCFvcHRzKSBvcHRzID0gJyc7XHJcblx0XHRcdGlmICghZG9jKSByZXR1cm47XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0cyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y2IgPSBvcHRzO1xyXG5cdFx0XHRcdG9wdHMgPSAnJztcclxuXHRcdFx0fVxyXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpLycgKyBwYXJ0ICsgJy9kZWxldGUnICsgb3B0cywgZG9jKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRpZiAocmVzcC5kYXRhICYmIEFycmF5LmlzQXJyYXkoZGF0YVsnYXJyJyArIHBhcnRdKSkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydhcnInICsgcGFydF0ubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbJ2FycicgKyBwYXJ0XVtpXS5faWQgPT0gZG9jLl9pZCkge1xyXG5cdFx0XHRcdFx0XHRcdGRhdGFbJ2FycicgKyBwYXJ0XS5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhWydvYmonICsgcGFydF1bZG9jLl9pZF07XHJcblx0XHRcdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xyXG5cdFx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xyXG5cdFx0XHRcdFx0XHRcdGZvcih2YXIgZmllbGQgaW4gZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xyXG5cdFx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXS5sZW5ndGgtMTsgaSA+PSAwIDsgaS0tKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF1baV0uX2lkID09IGRvYy5faWQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0uc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XHJcblx0XHRcdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGFbJ29wdHMnK3BhcnRdLnF1ZXJ5KXtcclxuXHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gZGF0YVsnb2JqJyArIHBhcnRdW2tleV0ubGVuZ3RoLTE7IGkgPj0gMCA7IGktLSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ldLl9pZCA9PSBkb2MuX2lkKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLnNwbGljZShpLCAxKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChyZXNwICYmIHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihyZXNwLmRhdGEpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGNiKGZhbHNlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuX2lkID0gZnVuY3Rpb24oY2IpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBjYiAhPSAnZnVuY3Rpb24nKSByZXR1cm47XHJcblx0XHRcdCRodHRwLmdldCgnL3dhdy9uZXdJZCcpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdGNiKHJlc3AuZGF0YSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMudG9faWQgPSBmdW5jdGlvbihkb2NzKSB7XHJcblx0XHRcdGlmICghYXJyKSByZXR1cm4gW107XHJcblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoZG9jcykpe1xyXG5cdCAgICAgICAgXHRkb2NzID0gZG9jcy5zbGljZSgpO1xyXG5cdCAgICAgICAgfWVsc2UgaWYodHlwZW9mIGRvY3MgPT0gJ29iamVjdCcpe1xyXG5cdCAgICAgICAgXHRpZihkb2NzLl9pZCkgcmV0dXJuIFtkb2NzLl9pZF07XHJcblx0ICAgICAgICBcdHZhciBfZG9jcyA9IFtdO1xyXG5cdCAgICAgICAgXHRmb3IodmFyIGtleSBpbiBkb2NzKXtcclxuXHQgICAgICAgIFx0XHRpZihkb2NzW2tleV0pIF9kb2NzLnB1c2goZG9jc1trZXldLl9pZHx8ZG9jc1trZXldKTtcclxuXHQgICAgICAgIFx0fVxyXG5cdCAgICAgICAgXHRkb2NzID0gX2RvY3M7XHJcblx0ICAgICAgICB9XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZG9jcy5sZW5ndGg7ICsraSkge1xyXG5cdFx0XHRcdGlmIChkb2NzW2ldKSBkb2NzW2ldID0gZG9jc1tpXS5faWQgfHwgZG9jc1tpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZG9jcztcclxuXHRcdH1cclxuXHRcdHRoaXMuYWZ0ZXJXaGlsZSA9IGZ1bmN0aW9uKGRvYywgY2IsIHRpbWUpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkb2MgPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHQkdGltZW91dC5jYW5jZWwoZG9jLnVwZGF0ZVRpbWVvdXQpO1xyXG5cdFx0XHRcdGRvYy51cGRhdGVUaW1lb3V0ID0gJHRpbWVvdXQoY2IsIHRpbWUgfHwgMTAwMCk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0XHR2YXIgcG9wdWxhdGUgPSB0aGlzLnBvcHVsYXRlID0gZnVuY3Rpb24oZG9jLCBmaWVsZCwgcGFydCkge1xyXG5cdFx0XHRpZiAoIWRvYyB8fCAhZmllbGQgfHwgIXBhcnQpIHJldHVybjtcclxuXHRcdFx0aWYgKGRhdGFbJ2xvYWRlZCcgKyBwYXJ0XSkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGRhdGFbJ29iaicgKyBwYXJ0XSk7XHJcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGQpKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgZmllbGRbaV0sIHBhcnQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoZmllbGQuaW5kZXhPZignLicpID4gLTEpIHtcclxuXHRcdFx0XHRcdGZpZWxkID0gZmllbGQuc3BsaXQoJy4nKTtcclxuXHRcdFx0XHRcdHZhciBzdWIgPSBmaWVsZC5zaGlmdCgpO1xyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBkb2Nbc3ViXSAhPSAnb2JqZWN0JykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBvcHVsYXRlKGRvY1tzdWJdLCBmaWVsZC5qb2luKCcuJyksIHBhcnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShkb2NbZmllbGRdKSkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IGRvY1tmaWVsZF0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbJ29iaicgKyBwYXJ0XVtkb2NbZmllbGRdW2ldXSkge1xyXG5cdFx0XHRcdFx0XHRcdGRvY1tmaWVsZF1baV0gPSBkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXVtpXV1cclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRkb2NbZmllbGRdLnNwbGljZShpLCAxKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGRvY1tmaWVsZF0gPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGRvY1tmaWVsZF0gPSBkYXRhWydvYmonICsgcGFydF1bZG9jW2ZpZWxkXV0gfHwgbnVsbDtcclxuXHRcdFx0XHR9IGVsc2UgcmV0dXJuO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cG9wdWxhdGUoZG9jLCBmaWVsZCwgcGFydCk7XHJcblx0XHRcdFx0fSwgMjUwKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhWydvYmonICsgcGFydF0pO1xyXG5cdFx0fTtcclxuXHRcdHZhciBvbiA9IHRoaXMub24gPSBmdW5jdGlvbihwYXJ0cywgY2IpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwYXJ0cyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcnRzID0gcGFydHMuc3BsaXQoXCIgXCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoIWRhdGFbJ2xvYWRlZCcgKyBwYXJ0c1tpXV0pIHtcclxuXHRcdFx0XHRcdHJldHVybiAkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0b24ocGFydHMsIGNiKTtcclxuXHRcdFx0XHRcdH0sIDEwMCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGNiKCk7XHJcblx0XHR9O1xyXG5cdC8qXHJcblx0Klx0bW9uZ28gc29ydCBmaWx0ZXJzXHJcblx0Ki9cclxuXHQvKlxyXG5cdCpcdG1vbmdvIHJlcGxhY2UgZmlsdGVyc1xyXG5cdCovXHJcblx0XHR0aGlzLmJlQXJyID0gZnVuY3Rpb24odmFsLCBjYikge1xyXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkodmFsKSkgY2IoW10pO1xyXG5cdFx0XHRlbHNlIGNiKHZhbCk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5iZU9iaiA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWwgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheSh2YWwpKSB7XHJcblx0XHRcdFx0dmFsID0ge307XHJcblx0XHRcdH1cclxuXHRcdFx0Y2IodmFsKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmJlRGF0ZSA9IGZ1bmN0aW9uKHZhbCwgY2IpIHtcclxuXHRcdFx0Y2IoIG5ldyBEYXRlKHZhbCkgKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmJlU3RyaW5nID0gZnVuY3Rpb24odmFsLCBjYil7XHJcblx0XHRcdGlmKHR5cGVvZiB2YWwgIT0gJ3N0cmluZycpe1xyXG5cdFx0XHRcdHZhbCA9ICcnO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNiKHZhbCk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5mb3JjZUFyciA9IGZ1bmN0aW9uKGNiKSB7XHJcblx0XHRcdGNiKFtdKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmZvcmNlT2JqID0gZnVuY3Rpb24oY2IpIHtcclxuXHRcdFx0Y2Ioe30pO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuZm9yY2VTdHJpbmcgPSBmdW5jdGlvbih2YWwsIGNiKXsgY2IoJycpOyB9O1xyXG5cdFx0dGhpcy5nZXRDcmVhdGVkID0gZnVuY3Rpb24odmFsLCBjYiwgZG9jKXtcclxuXHRcdFx0cmV0dXJuIG5ldyBEYXRlKHBhcnNlSW50KGRvYy5faWQuc3Vic3RyaW5nKDAsOCksIDE2KSoxMDAwKTtcclxuXHRcdH07XHJcblx0LypcclxuXHQqXHRtb25nbyBsb2NhbCBzdXBwb3J0IGZ1bmN0aW9uc1xyXG5cdCovXHJcblx0XHR2YXIgcmVwbGFjZSA9IGZ1bmN0aW9uKGRvYywgdmFsdWUsIHJwbCwgcGFydCkge1xyXG5cdFx0XHRpZiAodmFsdWUuaW5kZXhPZignLicpID4gLTEpIHtcclxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnNwbGl0KCcuJyk7XHJcblx0XHRcdFx0dmFyIHN1YiA9IHZhbHVlLnNoaWZ0KCk7XHJcblx0XHRcdFx0aWYgKGRvY1tzdWJdICYmICh0eXBlb2YgZG9jW3N1Yl0gIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShkb2Nbc3ViXSkpKVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdGlmICghZG9jW3N1Yl0pIGRvY1tzdWJdID0ge307XHJcblx0XHRcdFx0cmV0dXJuIHJlcGxhY2UoZG9jW3N1Yl0sIHZhbHVlLmpvaW4oJy4nKSwgcnBsLCBwYXJ0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIHJwbCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0cnBsKGRvY1t2YWx1ZV0sIGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XHJcblx0XHRcdFx0XHRkb2NbdmFsdWVdID0gbmV3VmFsdWU7XHJcblx0XHRcdFx0fSwgZG9jKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHZhciBwdXNoID0gZnVuY3Rpb24ocGFydCwgZG9jKSB7XHJcblx0XHRcdGlmKGRhdGFbJ29iaicgKyBwYXJ0XVtkb2MuX2lkXSkgcmV0dXJuO1xyXG5cdFx0XHRpZiAoZGF0YVsnb3B0cycgKyBwYXJ0XS5yZXBsYWNlKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGRhdGFbJ29wdHMnICsgcGFydF0ucmVwbGFjZSkge1xyXG5cdFx0XHRcdFx0cmVwbGFjZShkb2MsIGtleSwgZGF0YVsnb3B0cycgKyBwYXJ0XS5yZXBsYWNlW2tleV0sIHBhcnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5wb3B1bGF0ZSl7XHJcblx0XHRcdFx0dmFyIHAgPSBkYXRhWydvcHRzJytwYXJ0XS5wb3B1bGF0ZTtcclxuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KHApKXtcclxuXHRcdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBwLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0XHRcdFx0aWYodHlwZW9mIHAgPT0gJ29iamVjdCcgJiYgcFtpXS5maWVsZCAmJiBwW2ldLnBhcnQpe1xyXG5cdFx0XHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgcFtpXS5maWVsZCwgcFtpXS5wYXJ0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZiBwID09ICdvYmplY3QnICYmIHAuZmllbGQgJiYgcC5wYXJ0KXtcclxuXHRcdFx0XHRcdHBvcHVsYXRlKGRvYywgcC5maWVsZCwgcC5wYXJ0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZGF0YVsnYXJyJyArIHBhcnRdLnB1c2goZG9jKTtcclxuXHRcdFx0ZGF0YVsnb2JqJyArIHBhcnRdW2RvYy5faWRdID0gZG9jO1xyXG5cdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5ncm91cHMpe1xyXG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGFbJ29wdHMnK3BhcnRdLmdyb3Vwcyl7XHJcblx0XHRcdFx0XHR2YXIgZyA9IGRhdGFbJ29wdHMnK3BhcnRdLmdyb3Vwc1trZXldO1xyXG5cdFx0XHRcdFx0aWYodHlwZW9mIGcuaWdub3JlID09ICdmdW5jdGlvbicgJiYgZy5pZ25vcmUoZG9jKSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0aWYodHlwZW9mIGcuYWxsb3cgPT0gJ2Z1bmN0aW9uJyAmJiAhZy5hbGxvdyhkb2MpKSByZXR1cm47XHJcblx0XHRcdFx0XHRpZighZGF0YVsnb2JqJyArIHBhcnRdW2tleV0pe1xyXG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XSA9IHt9O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dmFyIHNldCAgPSBmdW5jdGlvbihmaWVsZCl7XHJcblx0XHRcdFx0XHRcdGlmKCFmaWVsZCkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRpZighQXJyYXkuaXNBcnJheShkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0pKXtcclxuXHRcdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0gPSBbXTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRkYXRhWydvYmonICsgcGFydF1ba2V5XVtmaWVsZF0ucHVzaChkb2MpO1xyXG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgZy5zb3J0ID09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldW2ZpZWxkXS5zb3J0KGcuc29ydCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHNldChnLmZpZWxkKGRvYywgZnVuY3Rpb24oZmllbGQpe1xyXG5cdFx0XHRcdFx0XHRzZXQoZmllbGQpO1xyXG5cdFx0XHRcdFx0fSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZihkYXRhWydvcHRzJytwYXJ0XS5xdWVyeSl7XHJcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YVsnb3B0cycrcGFydF0ucXVlcnkpe1xyXG5cdFx0XHRcdFx0dmFyIHF1ZXJ5ID0gZGF0YVsnb3B0cycrcGFydF0ucXVlcnlba2V5XTtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZiBxdWVyeS5pZ25vcmUgPT0gJ2Z1bmN0aW9uJyAmJiBxdWVyeS5pZ25vcmUoZG9jKSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0aWYodHlwZW9mIHF1ZXJ5LmFsbG93ID09ICdmdW5jdGlvbicgJiYgIXF1ZXJ5LmFsbG93KGRvYykpIHJldHVybjtcclxuXHRcdFx0XHRcdGlmKCFkYXRhWydvYmonICsgcGFydF1ba2V5XSl7XHJcblx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldID0gW107XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQgZGF0YVsnb2JqJyArIHBhcnRdW2tleV0ucHVzaChkb2MpO1xyXG5cdFx0XHRcdFx0aWYodHlwZW9mIHF1ZXJ5LnNvcnQgPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRcdGRhdGFbJ29iaicgKyBwYXJ0XVtrZXldLnNvcnQocXVlcnkuc29ydCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0dmFyIG5leHQgPSBmdW5jdGlvbihwYXJ0LCBvcHRzLCBjYil7XHJcblx0XHRcdCRodHRwLmdldCgnL2FwaS8nICsgcGFydCArICcvZ2V0JykudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0aWYgKHJlc3AuZGF0YSkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwLmRhdGEubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0cHVzaChwYXJ0LCByZXNwLmRhdGFbaV0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKVxyXG5cdFx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYihkYXRhWydhcnInICsgcGFydF0sIGRhdGFbJ29iaicgKyBwYXJ0XSwgb3B0cy5uYW1lfHwnJywgcmVzcC5kYXRhKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYob3B0cy5uZXh0KXtcclxuXHRcdFx0XHRcdG5leHQocGFydCwgb3B0cy5uZXh0LCBjYik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0LypcclxuXHQqXHRFbmRvZiBNb25nbyBTZXJ2aWNlXHJcblx0Ki9cclxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fcG9wdXBcIiwgW10pXHJcbiAgICAuc2VydmljZSgncG9wdXAnLCBmdW5jdGlvbigkY29tcGlsZSwgJHJvb3RTY29wZSkge1xyXG4gICAgICAgIFwibmdJbmplY3RcIjtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGV2ZW50O1xyXG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uKHNpemUsIGNvbmZpZywgZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCFjb25maWcgfHwgKCFjb25maWcudGVtcGxhdGVVcmwgJiYgIWNvbmZpZy50ZW1wbGF0ZSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdQbGVhc2UgYWRkIHRlbXBsYXRlVXJsIG9yIHRlbXBsYXRlJyk7XHJcbiAgICAgICAgICAgIHZhciBwb3B1cCA9ICc8cG9wdXAgc3R5bGU9XCJwb3NpdGlvbjogZml4ZWQ7XCIgY29uZmlnPVwiJyArIChKU09OLnN0cmluZ2lmeShjb25maWcpKS5zcGxpdCgnXCInKS5qb2luKFwiJ1wiKSArICdcInNpemU9XCInICsgKEpTT04uc3RyaW5naWZ5KHNpemUpKS5zcGxpdCgnXCInKS5qb2luKFwiJ1wiKSArICdcIj4nO1xyXG4gICAgICAgICAgICBpZiAoY29uZmlnLnRlbXBsYXRlKSBwb3B1cCArPSBjb25maWcudGVtcGxhdGU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy50ZW1wbGF0ZVVybCkge1xyXG4gICAgICAgICAgICAgICAgcG9wdXAgKz0gJzxuZy1pbmNsdWRlIHNyYz1cIic7XHJcbiAgICAgICAgICAgICAgICBwb3B1cCArPSBcIidcIiArIGNvbmZpZy50ZW1wbGF0ZVVybCArIFwiJ1wiO1xyXG4gICAgICAgICAgICAgICAgcG9wdXAgKz0gJ1wiPjwvbmctaW5jbHVkZT4nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBvcHVwICs9ICc8L3BvcHVwPic7XHJcbiAgICAgICAgICAgIHZhciBib2R5ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdib2R5JykuZXEoMCk7XHJcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudChwb3B1cCkpKCRyb290U2NvcGUpKTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdodG1sJykuYWRkQ2xhc3MoJ25vc2Nyb2xsJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkuZGlyZWN0aXZlKCdwb3AnLCBmdW5jdGlvbihwb3B1cCkge1xyXG4gICAgICAgIFwibmdJbmplY3RcIjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnOiAnPSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IDEwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDM3MFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL0FkZCB0byBzY29wZS5zaXplIHNwYW4gZWxlbWVudCBsZWZ0LCB0b3AgZnJvbSBldmVudFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLm9wZW4oJHNjb3BlLnNpemUsICRzY29wZS5jb25maWcsIGV2ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnd21vZGFsX3BvcHVwLmh0bWwnXHJcbiAgICAgICAgfTtcclxuICAgIH0pLmRpcmVjdGl2ZSgncG9wdXAnLCBmdW5jdGlvbihwb3B1cCkge1xyXG4gICAgICAgIFwibmdJbmplY3RcIjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICAgICAgY29uZmlnOiAnPScsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnPSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCRzY29wZS5jb25maWcucG9zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncnQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZIC0gKGV2ZW50LnRhcmdldC5vZmZzZXRIZWlnaHQgKiAyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdyJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYICsgZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtIChldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0IC8gMik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdyYic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCArIGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2InOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggKyAoZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoIC8gMikgLSAoJHNjb3BlLnNpemUub2Zmc2V0V2lkdGggLyAyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLnRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZICsgZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xiJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUubGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYIC0gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgKyBldmVudC50YXJnZXQub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCAtICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAvIDIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCAtIGV2ZW50Lm9mZnNldFggLSAkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpemUudG9wID0gZXZlbnQuY2xpZW50WSAtIGV2ZW50Lm9mZnNldFkgLSAoZXZlbnQudGFyZ2V0Lm9mZnNldEhlaWdodCAqIDIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaXplLmxlZnQgPSBldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCArIChldmVudC50YXJnZXQub2Zmc2V0V2lkdGggLyAyKSAtICgkc2NvcGUuc2l6ZS5vZmZzZXRXaWR0aCAvIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2l6ZS50b3AgPSBldmVudC5jbGllbnRZIC0gZXZlbnQub2Zmc2V0WSAtICRzY29wZS5zaXplLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmRlZmF1bHQoJHNjb3BlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBbJHNjb3BlLnNpemUubGVmdCwgJHNjb3BlLnNpemUudG9wXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHQgPSBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcCA9IGV2ZW50LmNsaWVudFkgLSBldmVudC5vZmZzZXRZID4gJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGVmdCA9IGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYID4gJHNjb3BlLnNpemUub2Zmc2V0V2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC0gKChldmVudC5jbGllbnRYIC0gZXZlbnQub2Zmc2V0WCkgKyAkc2NvcGUuc2l6ZS5vZmZzZXRIZWlnaHQpID4gJHNjb3BlLnNpemUub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLSAoKGV2ZW50LmNsaWVudFggLSBldmVudC5vZmZzZXRYKSArICRzY29wZS5zaXplLm9mZnNldFdpZHRoKSA+ICRzY29wZS5zaXplLm9mZnNldFdpZHRoO1xyXG5cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobGVmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYm90dG9tKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyaWdodCk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVmdCAmJiB0b3ApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnbHQnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmlnaHQgJiYgdG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcucG9zID0gJ3J0JztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJpZ2h0ICYmIGJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdyYic7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsZWZ0ICYmIGJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdsYic7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0b3ApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAndCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdyJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLnBvcyA9ICdiJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5wb3MgPSAnbCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlICRzY29wZS5jb25maWcucG9zID0gJ2InO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3Blbigkc2NvcGUuc2l6ZSwgJHNjb3BlLmNvbmZpZywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fc2RcIiwgW10pXHJcblxuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3NlcnZpY2VzXCIsIFtdKS5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJGNvbXBpbGUpe1xyXG5cdHZhciBib2R5ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5maW5kKCdib2R5JykuZXEoMCk7XHJcblx0Ym9keS5hcHBlbmQoJGNvbXBpbGUoYW5ndWxhci5lbGVtZW50KCc8cHVsbGZpbGVzPjwvcHVsbGZpbGVzPicpKSgkcm9vdFNjb3BlKSk7XHJcbn0pLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdGlmKHR5cGVvZiBpbyAhPSAnb2JqZWN0JykgcmV0dXJuIHt9O1xyXG5cdHZhciBsb2MgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcclxuXHR2YXIgc29ja2V0ID0gaW8uY29ubmVjdChsb2MpO1xyXG5cdHJldHVybiBzb2NrZXQ7XHJcbn0pLnNlcnZpY2UoJ2ZpbGUnLCBmdW5jdGlvbigkdGltZW91dCl7XHJcblx0XCJuZ0luamVjdFwiO1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHRzZWxmLmFkZCA9IGZ1bmN0aW9uKG9wdHMsIGNiKXtcclxuXHRcdGlmKHR5cGVvZiBzZWxmLmFkZERlbGF5ICE9ICdmdW5jdGlvbicpe1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHNlbGYuYWRkKG9wdHMsIGNiKTtcclxuXHRcdFx0fSwgMTAwKTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRzZWxmLmFkZERlbGF5KG9wdHMsIGNiKTtcclxuXHRcdH1cclxuXHR9XHJcbn0pLnJ1bihmdW5jdGlvbiAoY3RybCkge1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24gKGUpIHtcclxuXHRcdGN0cmwucHJlc3MoZS5rZXlDb2RlKTtcclxuXHR9KTtcclxufSkuc2VydmljZSgnY3RybCcsIGZ1bmN0aW9uKCR0aW1lb3V0KXtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIGNicyA9IFtdO1xyXG5cdHZhciBlbnVtcyA9IHtcclxuXHRcdCdzcGFjZSc6IDMyLFxyXG5cdFx0J2VzYyc6IDI3LFxyXG5cdFx0J2JhY2tzcGFjZSc6IDgsXHJcblx0XHQndGFiJzogOSxcclxuXHRcdCdlbnRlcic6IDEzLFxyXG5cdFx0J3NoaWZ0JzogMTYsXHJcblx0XHQnY3RybCc6IDE3LFxyXG5cdFx0J2FsdCc6IDE4LFxyXG5cdFx0J3BhdXNlL2JyZWFrJzogMTksXHJcblx0XHQnY2FwcyBsb2NrJzogMjAsXHJcblx0XHQnZXNjYXBlJzogMjcsXHJcblx0XHQncGFnZSB1cCc6IDMzLFxyXG5cdFx0J3BhZ2UgZG93bic6IDM0LFxyXG5cdFx0J2VuZCc6IDM1LFxyXG5cdFx0J2hvbWUnOiAzNixcclxuXHRcdCdsZWZ0JzogMzcsXHJcblx0XHQndXAnOiAzOCxcclxuXHRcdCdyaWdodCc6IDM5LFxyXG5cdFx0J2Rvd24nOiA0MCxcclxuXHRcdCdpbnNlcnQnOiA0NSxcclxuXHRcdCdkZWxldGUnOiA0NixcclxuXHRcdCcwJzogNDgsXHJcblx0XHQnMSc6IDQ5LFxyXG5cdFx0JzInOiA1MCxcclxuXHRcdCczJzogNTEsXHJcblx0XHQnNCc6IDUyLFxyXG5cdFx0JzUnOiA1MyxcclxuXHRcdCc2JzogNTQsXHJcblx0XHQnNyc6IDU1LFxyXG5cdFx0JzgnOiA1NixcclxuXHRcdCc5JzogNTcsXHJcblx0XHQnYSc6IDY1LFxyXG5cdFx0J2InOiA2NixcclxuXHRcdCdjJzogNjcsXHJcblx0XHQnZCc6IDY4LFxyXG5cdFx0J2UnOiA2OSxcclxuXHRcdCdmJzogNzAsXHJcblx0XHQnZyc6IDcxLFxyXG5cdFx0J2gnOiA3MixcclxuXHRcdCdpJzogNzMsXHJcblx0XHQnaic6IDc0LFxyXG5cdFx0J2snOiA3NSxcclxuXHRcdCdsJzogNzYsXHJcblx0XHQnbSc6IDc3LFxyXG5cdFx0J24nOiA3OCxcclxuXHRcdCdvJzogNzksXHJcblx0XHQncCc6IDgwLFxyXG5cdFx0J3EnOiA4MSxcclxuXHRcdCdyJzogODIsXHJcblx0XHQncyc6IDgzLFxyXG5cdFx0J3QnOiA4NCxcclxuXHRcdCd1JzogODUsXHJcblx0XHQndic6IDg2LFxyXG5cdFx0J3cnOiA4NyxcclxuXHRcdCd4JzogODgsXHJcblx0XHQneSc6IDg5LFxyXG5cdFx0J3onOiA5MCxcclxuXHRcdCdsZWZ0IHdpbmRvdyBrZXknOiA5MSxcclxuXHRcdCdyaWdodCB3aW5kb3cga2V5JzogOTIsXHJcblx0XHQnc2VsZWN0IGtleSc6IDkzLFxyXG5cdFx0J251bXBhZCAwJzogOTYsXHJcblx0XHQnbnVtcGFkIDEnOiA5NyxcclxuXHRcdCdudW1wYWQgMic6IDk4LFxyXG5cdFx0J251bXBhZCAzJzogOTksXHJcblx0XHQnbnVtcGFkIDQnOiAxMDAsXHJcblx0XHQnbnVtcGFkIDUnOiAxMDEsXHJcblx0XHQnbnVtcGFkIDYnOiAxMDIsXHJcblx0XHQnbnVtcGFkIDcnOiAxMDMsXHJcblx0XHQnbnVtcGFkIDgnOiAxMDQsXHJcblx0XHQnbnVtcGFkIDknOiAxMDUsXHJcblx0XHQnbXVsdGlwbHknOiAxMDYsXHJcblx0XHQnYWRkJzogMTA3LFxyXG5cdFx0J3N1YnRyYWN0JzogMTA5LFxyXG5cdFx0J2RlY2ltYWwgcG9pbnQnOiAxMTAsXHJcblx0XHQnZGl2aWRlJzogMTExLFxyXG5cdFx0J2YxJzogMTEyLFxyXG5cdFx0J2YyJzogMTEzLFxyXG5cdFx0J2YzJzogMTE0LFxyXG5cdFx0J2Y0JzogMTE1LFxyXG5cdFx0J2Y1JzogMTE2LFxyXG5cdFx0J2Y2JzogMTE3LFxyXG5cdFx0J2Y3JzogMTE4LFxyXG5cdFx0J2Y4JzogMTE5LFxyXG5cdFx0J2Y5JzogMTIwLFxyXG5cdFx0J2YxMCc6IDEyMSxcclxuXHRcdCdmMTEnOiAxMjIsXHJcblx0XHQnZjEyJzogMTIzLFxyXG5cdFx0J251bSBsb2NrJzogMTQ0LFxyXG5cdFx0J3Njcm9sbCBsb2NrJzogMTQ1LFxyXG5cdFx0J3NlbWktY29sb24nOiAxODYsXHJcblx0XHQnZXF1YWwgc2lnbic6IDE4NyxcclxuXHRcdCdjb21tYSc6IDE4OCxcclxuXHRcdCdkYXNoJzogMTg5LFxyXG5cdFx0J3BlcmlvZCc6IDE5MCxcclxuXHRcdCdmb3J3YXJkIHNsYXNoJzogMTkxLFxyXG5cdFx0J2dyYXZlIGFjY2VudCc6IDE5MixcclxuXHRcdCdvcGVuIGJyYWNrZXQnOiAyMTksXHJcblx0XHQnYmFjayBzbGFzaCc6IDIyMCxcclxuXHRcdCdjbG9zZSBicmFrZXQnOiAyMjEsXHJcblx0XHQnc2luZ2xlIHF1b3RlJzogMjIyLFxyXG5cdH07XHJcblx0dGhpcy5wcmVzcyA9IGZ1bmN0aW9uKGNvZGUpe1xyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYoY2JzW2ldLmtleSA9PSBjb2RlKSAkdGltZW91dChjYnNbaV0uY2IpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR0aGlzLm9uID0gZnVuY3Rpb24oYnRucywgY2Ipe1xyXG5cdFx0aWYodHlwZW9mIGNiICE9ICdmdW5jdGlvbicpIHJldHVybjtcclxuXHRcdGlmKCFBcnJheS5pc0FycmF5KGJ0bnMpJiZ0eXBlb2YgYnRucyAhPSAnb2JqZWN0JykgcmV0dXJuO1xyXG5cdFx0aWYoIUFycmF5LmlzQXJyYXkoYnRucykmJnR5cGVvZiBidG5zID09ICdvYmplY3QnKSBidG5zID0gW2J0bnNdO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBidG5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmKHR5cGVvZiBlbnVtc1tidG5zW2ldXSA9PSAnbnVtYmVyJyl7XHJcblx0XHRcdFx0Y2JzLnB1c2goe1xyXG5cdFx0XHRcdFx0a2V5OiBlbnVtc1tidG5zW2ldXSxcclxuXHRcdFx0XHRcdGNiOiBjYlxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59KS5zZXJ2aWNlKCdpbWcnLCBmdW5jdGlvbigpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHR0aGlzLmZpbGVUb0RhdGFVcmwgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjayl7XHJcblx0XHR2YXIgYSA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRhLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0Y2FsbGJhY2soZS50YXJnZXQucmVzdWx0KTtcclxuXHRcdH1cclxuXHRcdGEucmVhZEFzRGF0YVVSTChmaWxlKTtcclxuXHR9XHJcblx0dGhpcy5yZXNpemVVcFRvID0gZnVuY3Rpb24oaW5mbywgY2FsbGJhY2spe1xyXG5cdFx0aWYoIWluZm8uZmlsZSkgcmV0dXJuIGNvbnNvbGUubG9nKCdObyBpbWFnZScpO1xyXG5cdFx0aW5mby53aWR0aCA9IGluZm8ud2lkdGggfHwgMTkyMDtcclxuXHRcdGluZm8uaGVpZ2h0ID0gaW5mby5oZWlnaHQgfHwgMTA4MDtcclxuXHRcdGlmKGluZm8uZmlsZS50eXBlIT1cImltYWdlL2pwZWdcIiAmJiBpbmZvLmZpbGUudHlwZSE9XCJpbWFnZS9wbmdcIilcclxuXHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKFwiWW91IG11c3QgdXBsb2FkIGZpbGUgb25seSBKUEVHIG9yIFBORyBmb3JtYXQuXCIpO1xyXG5cdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGxvYWRFdmVudCkge1xyXG5cdFx0XHR2YXIgY2FudmFzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG5cdFx0XHR2YXIgaW1hZ2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcblx0XHRcdGltYWdlRWxlbWVudC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgaW5mb1JhdGlvID0gaW5mby53aWR0aCAvIGluZm8uaGVpZ2h0O1xyXG5cdFx0XHRcdHZhciBpbWdSYXRpbyA9IGltYWdlRWxlbWVudC53aWR0aCAvIGltYWdlRWxlbWVudC5oZWlnaHQ7XHJcblx0XHRcdFx0aWYgKGltZ1JhdGlvID4gaW5mb1JhdGlvKSB7XHJcblx0XHRcdFx0XHR3aWR0aCA9IGluZm8ud2lkdGg7XHJcblx0XHRcdFx0XHRoZWlnaHQgPSB3aWR0aCAvIGltZ1JhdGlvO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRoZWlnaHQgPSBpbmZvLmhlaWdodDtcclxuXHRcdFx0XHRcdHdpZHRoID0gaGVpZ2h0ICogaW1nUmF0aW87XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhbnZhc0VsZW1lbnQud2lkdGggPSB3aWR0aDtcclxuXHRcdFx0XHRjYW52YXNFbGVtZW50LmhlaWdodCA9IGhlaWdodDtcclxuXHRcdFx0XHR2YXIgY29udGV4dCA9IGNhbnZhc0VsZW1lbnQuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHRcdFx0XHRjb250ZXh0LmRyYXdJbWFnZShpbWFnZUVsZW1lbnQsIDAsIDAgLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHRcdFx0XHRjYWxsYmFjayhjYW52YXNFbGVtZW50LnRvRGF0YVVSTCgnaW1hZ2UvcG5nJywgMSkpO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpbWFnZUVsZW1lbnQuc3JjID0gbG9hZEV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcblx0XHR9O1xyXG5cdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoaW5mby5maWxlKTtcclxuXHR9XHJcbn0pLnNlcnZpY2UoJ2hhc2gnLCBmdW5jdGlvbigpe1xyXG5cdFwibmdJbmplY3RcIjtcclxuXHR0aGlzLnNldCA9IGZ1bmN0aW9uKG9iail7XHJcblx0XHR3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xyXG5cdFx0Zm9yKHZhciBrZXkgaW4gb2JqKXtcclxuXHRcdFx0aWYob2JqW2tleV0pIHdpbmRvdy5sb2NhdGlvbi5oYXNoKz0nJicra2V5Kyc9JytvYmpba2V5XTtcclxuXHJcblx0XHR9XHJcblx0fVxyXG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24oKXtcclxuXHRcdHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIyEjJywgJycpO1xyXG5cdFx0aGFzaCA9IGhhc2gucmVwbGFjZSgnIycsICcnKS5zcGxpdCgnJicpO1xyXG5cdFx0aGFzaC5zaGlmdCgpO1xyXG5cdFx0dmFyIGggPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaGFzaC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRoYXNoW2ldID0gaGFzaFtpXS5zcGxpdCgnPScpO1xyXG5cdFx0XHRoW2hhc2hbaV1bMF1dID0gaGFzaFtpXVsxXTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBoO1xyXG5cdH1cclxufSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fc3Bpbm5lclwiLCBbXSlcclxuICAgIC5zZXJ2aWNlKCdzcGluJywgZnVuY3Rpb24oJGNvbXBpbGUsICRyb290U2NvcGUpIHtcclxuICAgICAgICBcIm5nSW5qZWN0XCI7XHJcbiAgICAgICAgLypcclxuICAgICAgICAgKlx0U3Bpbm5lcnNcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5zcGlubmVycyA9IFtdO1xyXG4gICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuc3Bpbm5lcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNwaW5uZXJzW2ldLmlkID09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zcGlubmVyc1tpXS5lbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNwaW5uZXJzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIGlmICghb2JqKSBvYmogPSB7fTtcclxuICAgICAgICAgICAgaWYgKCFvYmouaWQpIG9iai5pZCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIHZhciBtb2RhbCA9ICc8c3BpbiAgaWQ9XCInICsgb2JqLmlkICsgJ1wiPic7XHJcbiAgICAgICAgICAgIGlmIChvYmoudGVtcGxhdGUpIG1vZGFsICs9IG9iai50ZW1wbGF0ZTtcclxuICAgICAgICAgICAgZWxzZSBpZiAob2JqLnRlbXBsYXRlVXJsKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnPG5nLWluY2x1ZGUgc3JjPVwiJztcclxuICAgICAgICAgICAgICAgIG1vZGFsICs9IFwiJ1wiICsgb2JqLnRlbXBsYXRlVXJsICsgXCInXCI7XHJcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnXCI+PC9uZy1pbmNsdWRlPic7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbCArPSAnPG5nLWluY2x1ZGUgIHNyYz1cIic7XHJcbiAgICAgICAgICAgICAgICBtb2RhbCArPSBcIid3bW9kYWxfc3Bpbm5lci5odG1sJ1wiO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwgKz0gJ1wiPjwvbmctaW5jbHVkZT4nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1vZGFsICs9ICc8L3NwaW4+JztcclxuICAgICAgICAgICAgdGhpcy5zcGlubmVycy5wdXNoKG9iaik7XHJcbiAgICAgICAgICAgIGlmIChvYmouZWxlbWVudCkge1xyXG4gICAgICAgICAgICBcdFxyXG4gICAgICAgICAgICBcdGNvbnNvbGUubG9nKG9iai5lbGVtZW50KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgXHR2YXIgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkuZmluZCgnYm9keScpLmVxKDApO1xyXG5cdFx0XHRcdGJvZHkuYXBwZW5kKCRjb21waWxlKGFuZ3VsYXIuZWxlbWVudChtb2RhbCkpKCRyb290U2NvcGUpKTtcclxuXHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLmZpbmQoJ2h0bWwnKS5hZGRDbGFzcygnbm9zY3JvbGwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb2JqLmlkO1xyXG4gICAgICAgIH1cclxuICAgIH0pLmRpcmVjdGl2ZSgnc3BpbicsIGZ1bmN0aW9uKHNwaW4pIHtcclxuICAgICAgICBcIm5nSW5qZWN0XCI7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAnQCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwaW5uZXIuc3Bpbm5lcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bpbm5lci5zcGlubmVyc1tpXS5pZCA9PSBzY29wZS5pZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnNwaW5uZXJzW2ldLmVsID0gZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3dtb2RhbF9zcGlubmVyLmh0bWwnXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RhZXJhdG9ycy5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3Y29tX3dtb2RhZXJhdG9ycy5odG1sXCIsIFwiPGxhYmVsIGNsYXNzPVxcXCJ3dGFnc1xcXCI+PHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PHNwYW4+e3tvYmoubmFtZX19PC9zcGFuPjxpIGNsYXNzPSdpY29uIGljb24tY2xvc2UnIG5nLWNsaWNrPSdhcnIuc3BsaWNlKCRpbmRleCwgMSk7IGNoYW5nZSgpOyc+PC9pPjwvc3Bhbj48aW5wdXQgdHlwZT0ndGV4dCcgcGxhY2Vob2xkZXI9J3t7aG9sZGVyfX0nIG5nLW1vZGVsPSdvYmplY3QubmV3X21vZGVyYXRvcic+PC9sYWJlbD48ZGl2IG5nLWlmPSdvYmplY3QubmV3X21vZGVyYXRvcic+PGRpdiBuZy1yZXBlYXQ9J3VzZXIgaW4gdXNlcnN8ckFycjphcnJ8ZmlsdGVyOm9iamVjdC5uZXdfbW9kZXJhdG9yJyBuZy1jbGljaz0nYXJyLnB1c2godXNlcik7IG9iamVjdC5uZXdfbW9kZXJhdG9yPW51bGw7IGNoYW5nZSgpOyc+PGltZyBuZy1zcmM9J3t7dXNlci5hdmF0YXJVcmx9fScgYWx0PSd7e3VzZXIubmFtZX19Jz48c3Bhbj57e3VzZXIubmFtZX19PC9zcGFuPjwvZGl2PjwvZGl2PlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RhZXJhdG9yc3ZpZXcuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XHJcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93bW9kYWVyYXRvcnN2aWV3Lmh0bWxcIiwgXCI8c3BhbiBjbGFzcz0nd3RhZycgbmctcmVwZWF0PSdvYmogaW4gYXJyJz48aW1nIG5nLXNyYz0ne3tvYmouYXZhdGFyVXJsfX0nIGFsdD0ne3tvYmoubmFtZX19Jz48c3Bhbj57e29iai5uYW1lfX08L3NwYW4+PC9zcGFuPlwiKTtcclxufV0pO1xuYW5ndWxhci5tb2R1bGUoXCJ3Y29tX3dtb2RlcmF0b3JzLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGVyYXRvcnMuaHRtbFwiLCBcIjxsYWJlbCBjbGFzcz1cXFwid3RhZ3NcXFwiPjxkaXYgY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0nb2JqIGluIGFycic+PGRpdiBjbGFzcz1cXFwid3RhZy0taW5cXFwiPjxkaXYgY2xhc3M9XFxcInd0YWctLWF2YVxcXCI+PGltZyBuZy1zcmM9J3t7b2JqLmF2YXRhclVybH19JyBhbHQ9J3t7b2JqLm5hbWV9fSc+PC9kaXY+PGRpdiBjbGFzcz1cXFwid3RhZy0tdGV4dFxcXCI+e3tvYmoubmFtZX19PC9kaXY+PGkgY2xhc3M9J2ljb24gaWNvbi1jbG9zZScgbmctY2xpY2s9J2Fyci5zcGxpY2UoJGluZGV4LCAxKTsgY2hhbmdlKCk7JyB0aXRsZT1cXFwiRGVsZXRlIG1vZGVyYXRvclxcXCI+PC9pPjwvZGl2PjwvZGl2PjxpbnB1dCB0eXBlPSd0ZXh0JyBwbGFjZWhvbGRlcj0ne3tob2xkZXJ9fScgbmctbW9kZWw9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48L2xhYmVsPjxkaXYgbmctaWY9J29iamVjdC5uZXdfbW9kZXJhdG9yJz48ZGl2IG5nLXJlcGVhdD0ndXNlciBpbiB1c2Vyc3xyQXJyOmFycnxmaWx0ZXI6b2JqZWN0Lm5ld19tb2RlcmF0b3InIG5nLWNsaWNrPSdhcnIucHVzaCh1c2VyKTsgb2JqZWN0Lm5ld19tb2RlcmF0b3I9bnVsbDsgY2hhbmdlKCk7Jz48aW1nIG5nLXNyYz0ne3t1c2VyLmF2YXRhclVybH19JyBhbHQ9J3t7dXNlci5uYW1lfX0nPjxzcGFuPnt7dXNlci5uYW1lfX08L3NwYW4+PC9kaXY+PC9kaXY+XCIpO1xyXG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd21vZGVyYXRvcnN2aWV3Lmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndjb21fd21vZGVyYXRvcnN2aWV3Lmh0bWxcIiwgXCI8c3BhbiBjbGFzcz0nd3RhZycgbmctcmVwZWF0PSdvYmogaW4gYXJyJz48ZGl2IGNsYXNzPVxcXCJ3dGFnLS1pblxcXCI+PGRpdiBjbGFzcz1cXFwid3RhZy0tYXZhXFxcIj48aW1nIG5nLXNyYz0ne3tvYmouYXZhdGFyVXJsfX0nIGFsdD0ne3tvYmoubmFtZX19Jz48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ3dGFnLS10ZXh0XFxcIj57e29iai5uYW1lfX08L2Rpdj48L2Rpdj48L3NwYW4+XCIpO1xyXG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndjb21fd3RhZ3MuaHRtbFwiLCBbXSkucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7XHJcblx0JHRlbXBsYXRlQ2FjaGUucHV0KFwid2NvbV93dGFncy5odG1sXCIsIFwiPGxhYmVsIGNsYXNzPSd3dGFncyc+PHNwYW4gY2xhc3M9J3d0YWcnIG5nLXJlcGVhdD0ndGFnIGluIHRhZ3MnPiN7e3RhZ319IDxpIGNsYXNzPSdpY29uIGljb24tY2xvc2UnIG5nLWNsaWNrPSd0YWdzLnNwbGljZSgkaW5kZXgsIDEpOyB1cGRhdGVfdGFncygpOyc+PC9pPjwvc3Bhbj48aW5wdXQgdHlwZT0ndGV4dCcgcGxhY2Vob2xkZXI9J25ldyB0YWcnIG5nLW1vZGVsPSduZXdfdGFnJyBuZy1rZXl1cD0nZW50ZXIoJGV2ZW50KSc+PC9sYWJlbD5cIik7XHJcbn1dKTtcbmFuZ3VsYXIubW9kdWxlKFwid21vZGFsX21vZGFsLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndtb2RhbF9tb2RhbC5odG1sXCIsIFwiPGRpdiBjbGFzcz0nbW9kYWwnIG5nLWNsYXNzPVxcXCJ7ZnVsbDogZnVsbCwgY292ZXI6IGNvdmVyfVxcXCI+PGRpdiBjbGFzcz0nbW9kYWxfZmFkZScgbmctY2xpY2s9J2Nsb3NlKCk7JyB0aXRsZT0nQ2xvc2UnPjwvZGl2PjxkaXYgY2xhc3M9J21vZGFsX2NvbnRlbnQgdmlld2VyJz48aSBjbGFzcz0naWNvbiBpY29uLWNsb3NlIGNsb3NlLW0nIG5nLWNsaWNrPSdjbG9zZSgpOycgdGl0bGU9J0Nsb3NlJz48L2k+PGgyIG5nLWlmPVxcXCJoZWFkZXJcXFwiPnt7aGVhZGVyfX08L2gyPjxwIG5nLWlmPVxcXCJjb250ZW50XFxcIj57e2NvbnRlbnR9fTwvcD48bmctdHJhbnNjbHVkZT48L25nLXRyYW5zY2x1ZGU+PC9kaXY+PC9kaXY+XCIpO1xyXG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9wb3B1cC5odG1sXCIsIFtdKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcclxuXHQkdGVtcGxhdGVDYWNoZS5wdXQoXCJ3bW9kYWxfcG9wdXAuaHRtbFwiLCBcIjxzcGFuIG5nLWNsaWNrLW91dHNpZGU9XFxcImNsb3NlKClcXFwiIG5nLXRyYW5zY2x1ZGUgbmctY2xpY2s9XFxcIm9wZW4oJGV2ZW50KVxcXCIgZWxzaXplPVxcXCJzaXplXFxcIj48L3NwYW4+XCIpO1xyXG59XSk7XG5hbmd1bGFyLm1vZHVsZShcIndtb2RhbF9zcGlubmVyLmh0bWxcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xyXG5cdCR0ZW1wbGF0ZUNhY2hlLnB1dChcIndtb2RhbF9zcGlubmVyLmh0bWxcIiwgXCI8IS0tIENvbW1lbnRzIGFyZSBqdXN0IHRvIGZpeCB3aGl0ZXNwYWNlIHdpdGggaW5saW5lLWJsb2NrIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXJcXFwiPjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tMVxcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZSBTcGlubmVyLWxpbmUtLTJcXFwiPjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWxlZnRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS10aWNrZXJcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLWNlbnRlclxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tcmlnaHRcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PC9kaXY+PCEtLSAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUgU3Bpbm5lci1saW5lLS0zXFxcIj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1sZWZ0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtdGlja2VyXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1jZW50ZXJcXFwiPjwvZGl2PjwhLS0gICAgICAgIC0tPjwvZGl2PjwhLS0gICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2dcXFwiPjwhLS0gICAgICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nLWlubmVyIFNwaW5uZXItbGluZS1jb2ctaW5uZXItLXJpZ2h0XFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgIC0tPjwvZGl2PjwhLS0gICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lIFNwaW5uZXItbGluZS0tNFxcXCI+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZ1xcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tbGVmdFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLXRpY2tlclxcXCI+PCEtLSAgICAgICAgICAgIC0tPjxkaXYgY2xhc3M9XFxcIlNwaW5uZXItbGluZS1jb2ctaW5uZXIgU3Bpbm5lci1saW5lLWNvZy1pbm5lci0tY2VudGVyXFxcIj48L2Rpdj48IS0tICAgICAgICAtLT48L2Rpdj48IS0tICAgICAgICAtLT48ZGl2IGNsYXNzPVxcXCJTcGlubmVyLWxpbmUtY29nXFxcIj48IS0tICAgICAgICAgICAgLS0+PGRpdiBjbGFzcz1cXFwiU3Bpbm5lci1saW5lLWNvZy1pbm5lciBTcGlubmVyLWxpbmUtY29nLWlubmVyLS1yaWdodFxcXCI+PC9kaXY+PCEtLSAgICAgICAgLS0+PC9kaXY+PCEtLSAgICAtLT48L2Rpdj48IS0tLS0+PC9kaXY+PCEtLS9zcGlubmVyIC0tPlwiKTtcclxufV0pOyJdfQ==

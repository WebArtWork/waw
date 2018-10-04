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
		controller: function($scope, img, $timeout, file){
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
		},
		template: '<input ng-repeat="i in inputs" type="file" ng-hide="true" id="{{i.id}}" multiple="{{i.multiple}}">'
	}
}).directive('elsize', function($timeout, $window){
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
}).directive('wmodaerators', function($filter){
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
}).directive('wmodaeratorsview', function($filter){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			arr: '='
		}, templateUrl: 'wcom_wmodaeratorsview.html'
	}
});
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
}).filter('wdate', function($filter){
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
}).filter('messagetime', function($filter){
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
});
angular.module("wcom_modal", [])
.service('modal', function($compile, $rootScope){
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
}).directive('modal', function(modal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: modal.modal_link, templateUrl: 'wmodal_modal.html'
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
angular.module("wcom_mongo", []).service('mongo', function($http, $timeout, socket){
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
});
angular.module("wcom_popup", [])
    .service('popup', function($compile, $rootScope) {
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
    }).directive('pop', function(popup) {
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
    }).directive('popup', function(popup) {
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
});
angular.module("wcom_sd", [])

angular.module("wcom_services", []).run(function($rootScope, $compile){
	var body = angular.element(document).find('body').eq(0);
	body.append($compile(angular.element('<pullfiles></pullfiles>'))($rootScope));
}).factory('socket', function(){
	"ngInject";
	if(typeof io != 'object') return {};
	var loc = window.location.host;
	var socket = io.connect(loc);
	return socket;
}).service('file', function($timeout){
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
}).run(function (ctrl) {
	"ngInject";
	angular.element(document).bind('keyup', function (e) {
		ctrl.press(e.keyCode);
	});
}).service('ctrl', function($timeout){
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
}).service('img', function(){
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
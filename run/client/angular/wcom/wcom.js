angular.module("wcom", ["wcom_wtags.html", "wcom_wmoderatorsview.html", "wcom_wmoderators.html", "wcom_services", "wcom_mongo", "wcom_filters", "wcom_directives"]);
angular.module("wcom_wtags.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wtags.html", "<label class='wtags'><div class='wtag' ng-repeat='tag in tags'><div class=\"wtag--in\"><div class=\"wtag--text\">#{{tag}}</div><i class='icon icon-close' ng-click='tags.splice($index, 1); update_tags();' title=\"Delete tag\"></i></div></div><input type='text' placeholder='new tag' ng-model='new_tag' ng-keyup='enter($event)' title=\"Type tag and press Enter\"></label>");
}]);
angular.module("wcom_wmoderatorsview.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmoderatorsview.html", "<span class='wtag' ng-repeat='obj in arr'><div class=\"wtag--in\"><div class=\"wtag--ava\"><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'></div><div class=\"wtag--text\">{{obj.name}}</div></div></span>");
}]);
angular.module("wcom_wmoderators.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("wcom_wmoderators.html", "<label class=\"wtags\"><div class='wtag' ng-repeat='obj in arr'><div class=\"wtag--in\"><div class=\"wtag--ava\"><img ng-src='{{obj.avatarUrl}}' alt='{{obj.name}}'></div><div class=\"wtag--text\">{{obj.name}}</div><i class='icon icon-close' ng-click='arr.splice($index, 1); change();' title=\"Delete moderator\"></i></div></div><input type='text' placeholder='{{holder}}' ng-model='object.new_moderator'></label><div ng-if='object.new_moderator'><div ng-repeat='user in users|rArr:arr|filter:object.new_moderator' ng-click='arr.push(user); object.new_moderator=null; change();'><img ng-src='{{user.avatarUrl}}' alt='{{user.name}}'><span>{{user.name}}</span></div></div>");
}]);
angular.module("wcom_services", []).run(function($rootScope, $compile){
	let body = angular.element(document).find('body').eq(0);
	body.append($compile(angular.element('<pullfiles></pullfiles>'))($rootScope));
}).factory('socket', function(){
	"ngInject";
	if(typeof io != 'object') return {};
	var loc = window.location.host;
	var socket = io.connect(loc);
	return socket;
}).service('fm', function($timeout){
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
}).service('css', function(){
	this.add = (rules) => {
		var styleEl = document.createElement('style'),
			styleSheet;
		// Append style element to head
		document.head.appendChild(styleEl);
		// Grab style sheet
		styleSheet = styleEl.sheet;
		for (var i = 0, rl = rules.length; i < rl; i++) {
			var j = 1,
				rule = rules[i],
				selector = rules[i][0],
				propStr = '';
			// If the second argument of a rule is an array of arrays, correct our variables.
			if (Object.prototype.toString.call(rule[1][0]) === '[object Array]') {
				rule = rule[1];
				j = 0;
			}
			for (var pl = rule.length; j < pl; j++) {
				var prop = rule[j];
				propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
			}
			// Insert CSS Rule
			styleSheet.insertRule(selector + '{' + propStr + '}', styleSheet.cssRules.length);
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
		if(info.file.type!="image/jpeg" && info.file.type!="image/png"){
			callback(false);
			return console.log("You must upload file only JPEG or PNG format.");
		}
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
	this.set = (obj)=>{
		window.location.hash = '';
		for(let key in obj){
			if(obj[key]) window.location.hash+='&'+key+'='+obj[key];

		}
	}
	this.get = ()=>{
		let hash = window.location.hash.replace('#!#', '');
		hash = hash.replace('#', '').split('&');
		hash.shift();
		let h = {};
		for (var i = 0; i < hash.length; i++) {
			hash[i] = hash[i].split('=');
			h[hash[i][0]] = hash[i][1];
		}
		return h;
	}
});
angular.module("wcom_mongo", []).service('mongo', function($http, $timeout, socket){
	let self = this, replaces={}, options={}, docs={};
	this.cl = {}; // collection
	this.clpc = {}; // complete collection pulled boolean
	this._id = (cb)=>{
		if(typeof cb != 'function') return;
		$http.get('/waw/newId').then(function(resp){
			cb(resp.data);
		});
	};
	var replace = function(doc, value, rpl){
		if(typeof rpl == 'function'){
			rpl(doc[value], function(newValue){
				doc[value] = newValue;
			}, doc);
		}
	};
	this.push = (part, doc, rpl)=>{
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		if(Array.isArray(self.cl[part])){
			this.cl[part].push(doc);
		}
	};
	this.unshift = (part, doc, rpl)=>{
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		Array.isArray(this.cl[part])&&this.cl[part].unshift(doc);
	};
	this.use = function(part, cb){
		if(!self.clpc[part]){
			return $timeout(function(){
				self.use(part, cb);
			}, 250);
		}
		return cb&&cb(self.cl[part]);
	};
	this.pull = (part, route, query, cb)=>{
		if(typeof cb != 'function') return;
		$http.get('/api/'+part+'/get'+route, query).then(function(resp){
			cb(resp.data);
		});
	};
	this.get = (part, rpl, opts, cb)=>{
		if(typeof rpl == 'function') cb = rpl;
		if(typeof opts == 'function') cb = opts;
		if(Array.isArray(this.cl[part])) return this.cl[part];
		if(!Array.isArray(this.cl[part])) this.cl[part] = [];
		replaces[part] = rpl;
		options[part] = opts;
		let pull;
		if(opts&&opts.query){
			pull = $http.get('/api/'+part+'/'+opts.query);
		}else pull = $http.get('/api/'+part+'/get');
		pull.then((resp)=>{
			if(Array.isArray(resp.data)){
				for (var i = 0; i < resp.data.length; i++) {
					docs[part+'_'+resp.data[i]._id] = resp.data[i];
					this.cl[part].push(resp.data[i]);
					if(rpl){
						for(var key in rpl){
							replace(resp.data[i], key, rpl[key]);
						}
					}
				}
			}
			if(opts){
				if(opts.sort) this.cl[part].sort(opts.sort);
				if(opts.populate){
					if(Array.isArray(opts.populate)){
						for (var i = 0; i < opts.populate.length; i++) {
							this.populate(part, opts.populate[i].model, opts.populate[i].path);
						}
					}else if(typeof opts.populate == 'object'){
						this.populate(part, opts.populate.model, opts.populate.path);
					}
				};
			}
			this.clpc[part] = true;
			typeof cb=='function'&&cb(this.cl[part]);
		}, function(err){
			console.log(err);
		});
		return this.cl[part];
	};
	this.run = (parts, cb)=>{
		if(Array.isArray(parts)){
			for (var i = 0; i < parts.length; i++) {
				if (!this.clpc[parts[i]]) {
					return $timeout(function() {
						this.run(parts, cb);
					}, 250);
				}
			}
		}else if(typeof parts == 'string'){
			if (!this.clpc[parts]) {
				return $timeout(function() {
					this.run(parts, cb);
				}, 250);
			}
		}
		cb();
	};

	this.populate = function(toPart, fromPart, toField, fields, cb){
		if(typeof fields == 'function'){
			cb = fields;
			fields = null;
		}
		if(!self.clpc[toPart]||!self.clpc[fromPart]){
			return $timeout(function(){
				self.populate(toPart, fromPart, toField, fields, cb);
			}, 250);
		}
		for (var i = 0; i < self.cl[toPart].length; i++) {
			fill(self.cl[toPart][i], fromPart, toField, fields, cb);
		}
		cb&&cb();
	};
	this.fill = (obj, fromPart, toField, fields, cb)=>{
		if(typeof fields == 'function'){
			cb = fields;
			fields = null;
		}
		if(!self.clpc[fromPart]){
			return $timeout(function(){
				self.fill(obj, fromPart, toField, fields, cb);
			}, 250);
		}
		fill(obj, fromPart, toField, fields, cb);
	};
	let fill = (obj, fromPart, toField, fields, cb)=>{
		while(toField.indexOf('.')>-1){
			toField = toField.split('.');
			obj = obj[toField.shift()];
			toField = toField.join('.');
			if(Array.isArray(obj)){
				for (var i = 0; i < obj.length; i++) {
					this.fill(obj[i], fromPart, toField, fields, cb);
				}
				return;
			}
		}
		if(Array.isArray(obj[toField])){
			for (var k = obj[toField].length - 1; k >= 0; k--) {
				if(docs[fromPart+'_'+obj[toField][k]]){
					fill_obj(obj[toField], k, docs[fromPart+'_'+obj[toField][k]], fields);
				}else{
					obj[toField].splice(k, 1);
				}
			}
		}else if(docs[fromPart+'_'+obj[toField]]){
			fill_obj(obj, toField, docs[fromPart+'_'+obj[toField]], fields);
		}else{
			delete obj[toField];
		}
		cb&&cb();
	}
	let fill_obj = (obj, to, doc, fields)=>{
		if (fields) {
			obj[to] = {};
			for (var key in fields) {
				obj[to][key] = doc[key];
			}
		} else obj[to] = doc;
	}

	this.create = (part, obj, cb)=>{
		if(typeof obj == 'function'){
			cb = obj;
			obj = {};
		}
		$http.post('/api/'+part+'/create', obj||{})
		.then((resp)=>{
			if(resp.data){
				this.push(part, resp.data, replaces[part]);
				let o = options[part];
				if(o&&o.sort)
					this.cl[part].sort(o.sort);
				if(o&&o.populate){
					if (Array.isArray(o.populate)) {
						for (var i = 0; i < o.populate.length; i++) {
							this.fill(resp.data, o.populate[i].model, o.populate[i].path);
						}
					} else if (typeof o.populate == 'object') {
						this.fill(resp.data, o.populate.model, o.populate.path);
					}
				}
				if(typeof cb == 'function') cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.afterWhile = (obj, cb, time)=>{
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(cb, time||1000);
	};
	this.update = (part, obj, custom, cb)=>{
		if(typeof custom == 'function') cb = custom;
		if(typeof custom != 'string') custom = '';
		if(!obj) return;
		$timeout.cancel(obj.updateTimeout);
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/update'+(obj._name||''), obj)
		.then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.updateAll = (part, obj, custom, cb)=>{
		if(typeof custom == 'function') cb = custom;
		if(typeof custom != 'string') custom = '';
		$http.post('/api/'+part+'/update/all'+custom, obj).then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.updateUnique = (part, obj, custom='', cb)=>{
		if(typeof custom == 'function'){
			cb = custom;
			custom='';
		}
		$http.post('/api/'+part+'/unique/field'+custom, obj).then(function(resp){
			if(typeof cb == 'function'){
				cb(resp.data);
			}
		});
	};
	this.updateAfterWhile = (part, obj, cb)=>{
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.update(part, obj, cb);
		}, 1000);
	};
	this.updateAfterWhileAll = function(part, obj, cb){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.updateAll(part, obj, cb);
		}, 1000);
	};
	this.delete = (part, obj, custom='', cb)=>{
		if(!obj) return;
		if(typeof custom == 'function'){
			cb = custom;
			custom = '';
		}
		$http.post('/api/'+part+'/delete'+custom, obj).then((resp)=>{
			if(resp.data&&Array.isArray(this.cl[part])){
				for (var i = 0; i < this.cl[part].length; i++) {
					if(this.cl[part][i]._id == obj._id){
						this.cl[part].splice(i, 1);
						break;
					}
				}
			}
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};

	this.inDocs = function(doc, docs){
		for (var i = 0; i < docs.length; i++) {
			if(docs[i]._id == doc._id) return true;
		}
		return false;
	};
	this.c_text = function(text, clear){
		text = text.split(clear||' ');
		for (var i = text.length - 1; i >= 0; i--) {
			if(text[i]=='') text.splice(i, 1);
		}
		return text.join('');
	};
	// doc fill
	this.beArray = (val, cb)=>{
		if(!Array.isArray(val)) cb([]);
		else cb(val);
	};
	this.forceObj = (val, cb)=>cb({});
	this.user_is = (users, is) =>{
		let get_arr = [];
		for (var i = 0; i < users.length; i++) {
			if(users[i].is&&users[i].is[is]){
				get_arr.push(users[i]);
			}
		}
		return get_arr;
	}
	this.rpla = (str, div=' ')=>{
		return str.split(div).join('');
	}
	this.arr_to_id =arr=>{
		let new_arr = [];
		if(Array.isArray(arr)){
			for (var i = 0; i < arr.length; i++) {
				if(arr[i]._id) new_arr.push(arr[i]._id);
				else new_arr.push(arr[i]);
			}
		}
		return new_arr;
	}
	// search in docs
	this.keepByBiggerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (docs[i][field][j] >= number) {
						keep = true;
						break;
					}
				}
				if(keep) continue;
			}else{
				if(docs[i][field] >= number){
					continue;
				}
			}
			docs.splice(i, 1);
		}
	};
	this.keepBySmallerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (docs[i][field][j] <= number) {
						keep = true;
						break;
					}
				}
				if(keep) continue;
			}else{
				if(docs[i][field] <= number){
					continue;
				}
			}
			docs.splice(i, 1);
		}
	};
	this.cutByBiggerNumber = function(docs, field, number){};
	this.cutBySmallerNumber = function(docs, field, number){};
	this.keepByText = function(docs, field, string, equal){
		string = string.toLowerCase();
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (equal) {
						if (docs[i][field][j].toLowerCase() == string) {
							keep = true;
							break;
						}
					} else {
						if (docs[i][field][j].toLowerCase().indexOf(string)>-1) {
							keep = true;
							break;
						}
					}
				}
				if(keep) continue;
			}else{
				if(equal){
					if(docs[i][field].toLowerCase() == string){
						continue;
					}
				}else{
					if(docs[i][field].toLowerCase().indexOf(string)>-1){
						continue;
					}
				}
			}
			docs.splice(i, 1);
		}
	};
	this.cutByText = function(docs, field, string, equal){
		string = string.toLowerCase();
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				for (var j = 0; j < docs[i][field].length; j++) {
					if (equal) {
						if (docs[i][field][j].toLowerCase() == string) {
							docs.splice(i, 1);
							break;
						}
					} else {
						if (docs[i][field][j].toLowerCase().indexOf(string)>-1) {
							docs.splice(i, 1);
							break;
						}
					}
				}
			}else{
				if(equal){
					if(docs[i][field].toLowerCase() == string){
						docs.splice(i, 1);
					}
				}else{
					if(docs[i][field].toLowerCase().indexOf(string)>-1){
						docs.splice(i, 1);
					}
				}
			}
		}
	};
	this.mine = function(arr, check, _id){
		let new_arr = [];
		for (var i = 0; i < arr.length; i++) {
			for (var j = 0; j < arr[i][check].length; j++) {
				if(arr[i][check][j] == _id||arr[i][check][j]._id == _id){
					new_arr.push(arr[i]);
					break;
				}
			}
		}
		return new_arr;
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
		let arr = origin_arr.slice();
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
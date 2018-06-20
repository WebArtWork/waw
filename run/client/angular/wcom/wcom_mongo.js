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
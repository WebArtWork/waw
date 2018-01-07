/*
* Crud file for client side NAME
*/
crudServices.CNAME = function(mongo){
	var self = this;
	this.NAMEs = mongo.get('post', {
		boolVar: function(val, cb){cb(!!val)}
	}, {
		query: null, // custom pull, made in router.js
		sort: function(a, b){
			if(a._id>b._id) return -1;
			return 1;
		}
	});
	this.create = function(obj, callback){
		mongo.create('NAME', obj, callback);
	}
	this.update = function(obj, callback){
		mongo.update('NAME', obj, callback);
	}
	this.updateAfterWhile = function(obj, callback){
		mongo.updateAfterWhile('NAME', obj, callback);
	}
	this.delete = function(obj, callback){
		mongo.delete('NAME', obj, callback);
	}
}
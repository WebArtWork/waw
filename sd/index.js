String.prototype.capitalize = function(all) {
	if (all) {
		return this.split(' ').map(e => e.capitalize()).join(' ');
	} else {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
}
module.exports = function(sd){
	if(!sd) sd = {};
	/*
	*	Pckages Load
	*/
		sd._package = require(__dirname+'/npm');
		sd._fs = require('fs');
		sd._fse = require('fs-extra');
		sd._git = require('gitty');
		sd._path = require('path');
		sd._readdir = require('recursive-readdir');
		sd._cmd = require('node-cmd');
	/*
	*	Framework Support
	*/
		sd._getDirectories = function(srcpath) {
			return sd._fs.readdirSync(srcpath).filter(function(file) {
				return sd._fs.statSync(sd._path.join(srcpath, file)).isDirectory();
			});
		}
		sd._getFiles = function(srcpath) {
			return sd._fs.readdirSync(srcpath).filter(function(file) {
				return sd._fs.statSync(sd._path.join(srcpath, file)).isFile();
			});
		}
		sd._isPart = function(src) {
			if (sd._fs.existsSync(src)) return true;
			else return false;
		}
		sd._next = function(req, res, next){
			next();
		}
		sd._ensure = function(req, res, next){
			if(req.user) next();
			else res.json(false);
		}
		sd._ensure_block = function(req, res, next){
			res.json(false);
		}
		sd._ensureAdmin = function(req, res, next){
			if(req.user&&req.user.isAdmin) next();
			else res.json(false);
		}
		sd._ensureUrl = function(req, res, next){
			if(req.user) next();
			else res.redirect('/');
		}
		sd._ensureAdminUrl = function(req, res, next){
			if(req.user&&req.user.isAdmin) next();
			else res.redirect('/');
		}
		sd._nextAfterTimeout = function(req, res, next){
			if(!req.session) return next();
			req.session.ti=req.local.ti;
			req.session.save();
			setTimeout(function(){
				req.session.reload(function(err) {
					if(req.session.ti==req.local.ti){
						next();
					}
				});
			}, req.local.t);
		}
		sd._initRouter = function(api){
			var router = sd._express.Router();
			sd._app.use(api, router);
			return router;
		}
		sd._ensureLocalhost = function(req, res, next){
			if(req.host.toLowerCase()=='localhost') next();
			else res.redirect('/');
		}
	/*
	*	Crud Use
	*/
		var waits = [];
		sd._wait_next = function(){
			if(waits.length>0){
				waits.pop();
			}
			if(waits.length>0) waits[waits.length-1]();
		}
		sd._wait = function(funcs){
			waits.unshift(funcs);
			if(waits.length==1) waits[0]();
		}
		sd._ensureUpdateObject = function(req, res, next){
			if(Array.isArray(req.body)) return res.json(false);
			if(typeof req.body != 'object')  return res.json(false);
			if(!req.body._id||(!req.body.val&&typeof req.body.val!='number'&&typeof req.body.val!='boolean')||!req.body.place||!req.body.loc)
				return res.json(false);
			next();
		}
		sd._searchInObject = function(checkingObj, obj, inKeys) {
			if (obj.loc && checkingObj._id && checkingObj._id.toString() == obj.loc) {
				if(Array.isArray(checkingObj[obj.place])&&obj.push){
					return checkingObj[obj.place].push(obj.val);
				}else if(Array.isArray(checkingObj[obj.place])&&obj.unshift){
					return checkingObj[obj.place].unshift(obj.val);
				}else if(Array.isArray(checkingObj[obj.place])&&obj.remove){
					return checkingObj[obj.place].splice(obj.val, 1);
				}else if(Array.isArray(checkingObj[obj.place])&&obj.splice){
					return checkingObj[obj.place].splice(obj.val, 1, obj.add);
				}else if(Array.isArray(checkingObj[obj.place])&&typeof obj.save == 'number'){
					return checkingObj[obj.place][obj.save] = obj.val;
				}
				return checkingObj[obj.place] = obj.val;
			}
			var key = (checkingObj.schema)?Object.keys(checkingObj.schema.obj):Object.getOwnPropertyNames(checkingObj);
			for (var i = 0; i < key.length; i++) {
				if(inKeys){
					var check = false;
					for (var j = 0; j < inKeys.length; j++) {
						if(inKeys[j]==key[i]){
							check = true;
						}
					}
					if(!check) continue;
				}
				if (Array.isArray(checkingObj[key[i]]))
					sd._searchInArray(checkingObj[key[i]], obj);
				else if (typeof checkingObj[key[i]] == 'object')
					sd._searchInObject(checkingObj[key[i]], obj);
			}
		}
		sd._searchInArray = function(checkingArr, obj) {
			for (var i = 0; i < checkingArr.length; i++) {
				if (Array.isArray(checkingArr[i])) sd._searchInArray(checkingArr[i], obj);
				else if (typeof checkingArr[i] == 'object') sd._searchInObject(checkingArr[i], obj);
			}
		}
		sd._dataUrl2loc = function(dataUrl, url, cb){
			var base64Data = dataUrl.replace(/^data:image\/png;base64,/,'').replace(/^data:image\/jpeg;base64,/,'');
			var decodeData=new Buffer(base64Data,'base64');
			sd._fs.writeFile(url, decodeData, cb);
		}
	/*
	*	Image Management
	*/
		sd._dataUrlToLocation = function(dataUrl, loc, file, cb){
			var base64Data = dataUrl.replace(/^data:image\/png;base64,/, '').replace(/^data:image\/jpeg;base64,/, '');
			var decodeData = new Buffer(base64Data, 'base64');
			sd._fse.mkdirs(loc);
			sd._fs.writeFile(loc+'/'+file, decodeData, cb);
		}
	/*
	*	General Use
	*/
		sd._parallel = function(arr, callback){
			var counter = arr.length;
			for (var i = 0; i < arr.length; i++) {
				arr[i](function(){
					if(--counter===0) callback();
				});
			}
		}
		sd._serial = function(arr, callback, opt){
			serial(0, arr, callback, opt);
		}
		var serial = function(i, arr, callback, opt){
			if(i>=arr.length) return callback();
			arr[i](function(){
				serial(++i, arr, callback, opt);
			}, opt);
		}
		sd._each = function(arr, func, callback){
			var counter = arr.length;
			if(counter===0) return callback();
			for (var i = 0; i < arr.length; i++) {
				func(arr[i], function(){
					if(--counter===0) callback();
				});
			}
		}
		sd._strToArr = function(str, div){
			if (!str) return [];
			str = str.split((div || ',') + ' ').join(',');
			var arr = str.split(div || ',');
			for (var i = arr.length - 1; i >= 0; i--) {
				if (!arr[i]) arr.splice(i, 1);
			}
			return arr;
		}
		sd._arrsToArr = function(arrs){
			var newArr = [];
			for (var i = 0; i < arrs.length; i++) {
				for (var j = 0; j < arrs[i].length; j++) {
					newArr.push(arrs[i][j]);
				}
			}
			return newArr;
		}
		sd._isEndOfStr = function(str, strCheck){
			var length = strCheck.length;
			return str.slice(str.length-length).toLowerCase()==strCheck.toLowerCase();
		}
		sd._cmpId = function(objA, objB){
			return objA._id.toString()==objB._id.toString();
		}
		sd._hasId = function(arr, obj) {
			for (var i = arr.length - 1; i >= 0; i--) {
				if (arr[i]._id === obj._id) {
					return i;
				}
			}
			return false;
		}
		sd._rpl = function(str, g, r){
			return str.split(g).join(r);
		}
		sd._id = function(doc, id){
			return doc._id.toString() == id.toString();
		}
	/*
	*	Files Management
	*/

		sd._writeFile = function(src, renames, dest, callback) {
			var data = sd._fs.readFileSync(src, 'utf8');
			for (var i = 0; i < renames.length; i++) {
				data = data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
			}
			sd._fs.writeFileSync(dest, data);
			if (typeof callback == 'function') callback();
		}
	/*
	*	Git Management
	*/
		var git = require('gitty');
		sd._initRepo = function(opts, cb){
			if(!cb) cb=function(){};
			if(!opts.root||!opts.repo) return cb();
			sd._fse.mkdirs(opts.root);
			git.clone(opts.root, opts.repo, {}, cb);
		}
	/*
	*	Loging
	*/
		sd._close = function(message) {
			message&&console.log(message);
			process.exit(0);
		}
		sd._log = function(message) {
			console.log(message);
		}
	/*
	*	End of support Scritping
	*/
	return sd;
}
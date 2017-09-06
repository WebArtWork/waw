module.exports = function(sd){
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
		sd._initRouter = function(api){
			var router = sd._express.Router();
			sd._app.use(api, router);
			return router;
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
	/*
	*	End of support Scritping
	*/
}
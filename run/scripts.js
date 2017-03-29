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
		sd._ensureUpdateObject = function(req, res, next){
			if(Array.isArray(req.body)) return res.json(false);
			if(typeof req.body != 'object')  return res.json(false);
			if(!req.body._id||!req.body.val||!req.body.place||!req.body.loc)
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
					for (var i = 0; i < inKeys.length; i++) {
						if(inKeys[i]==key){
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
	/*
	*	End of support Scritping
	*/
}
var services = {};
app.factory(services);
/*start_service_1478858326525*/
/*
*	MyUser service.
*/
services.MyUser=function($http, $timeout){
	"ngInject";
	var obj = {
		done: false
	};
	$http.get('/api/user/myUser')
	.then(function(resp){
		obj.done = true;
		obj.auth = resp.data.auth;
		obj.users = resp.data.users;
		if(obj.selectedUserCode) obj.selectUser(obj.selectedUserCode);
		if(obj.auth){
			obj.isAdmin = resp.data.isAdmin;
			obj.email = resp.data.email;
			obj.twitter = resp.data.twitter;
			obj.name = resp.data.name;
			obj.avatarUrl = resp.data.avatarUrl;
		}
	});
	obj.addLocalAccount = function(email, pass){
		if(!email||!pass) return;
		obj.email = email;
		$http.post('/api/user/addLocalAccount',{
			email: email,
			password: pass
		});
	}
	obj.changePassword = function(oldPass, newPass){
		if(!oldPass||!newPass) return;
		$http.post('/api/user/changePassword',{
			oldPass: oldPass,
			newPass: newPass
		});
	}
	obj.changeAvatar = function(dataUrl){
		$timeout(function(){
			obj.avatarUrl = dataUrl;
		});
		$http.post('/api/user/changeAvatar', {
			dataUrl: dataUrl
		});
	}
	obj.update = function(){
		$timeout.cancel(timeoutUpdate);
		$http.post('/api/user/update', obj);
	}
	var timeoutUpdate;
	obj.updateAfterWhile = function(){
		$timeout.cancel(timeoutUpdate);
		timeoutUpdate = $timeout(function(){
			obj.update();
		}, 1000);
	}
	obj.selectUser = function(code){
		obj.selectedUserCode = code;
		if(obj.users){
			for (var i = 0; i < obj.users.length; i++) {
				if(obj.users[i].userUrl==code||obj.users[i]._id==code){
					return obj.userSelected = obj.users[i];
				}
			}
		}
	}
	console.log(obj);
	return obj;
};
/*end_service_1478858326525*/
/*start_service_1479391751929*/
/*
*	img service.
*/
services.img=function($http){
	"ngInject";
	var obj = {};
	obj.resizeUpTo = function(info, callback){
		if(!info.file) return console.log('No image');
		info.width = info.width || 1920;
		info.height = info.height || 1080;
		if(info.file.type!="image/jpeg" && info.file.type!="image/png")
			return console.log("You must upload file only JPEG or PNG format.");
		var reader = new FileReader();
		reader.onload = function (loadEvent) {
			var ratioToFloat = function(val) {
				var r = val.toString(),
					xIndex = r.search(/[x:]/i);
				if (xIndex > -1) {
					r = parseFloat(r.substring(0, xIndex)) / parseFloat(r.substring(xIndex + 1));
				} else {
					r = parseFloat(r);
				}
				return r;
			};
			var canvasElement = document.createElement('canvas');
			var imageElement = document.createElement('img');
			imageElement.onload = function() {
				var ratioFloat = ratioToFloat(info.width/info.height);
				var imgRatio = imageElement.width / imageElement.height;
				if (imgRatio < ratioFloat) {
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
	return obj;
};
/*end_service_1479391751929*/
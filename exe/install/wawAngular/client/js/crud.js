var services = {}, filters = {}, directives = {}, controllers = {};
app.service(services).filter(filters).directive(directives).controller(controllers);
services.socket = function(){
	"ngInject";
	var loc = window.location.host;
	var socket = io.connect(loc);
	socket.on('disconnect', function(){
		socket = io.connect(loc);
	});
	this.emit = function(){

	}
	this.on = function(){

	}
}
services.img=function(){
	"ngInject";
	this.resizeUpTo = function(info, callback){
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
};
directives.fm = function(){
	"ngInject";
	return{
		restrict: 'E',
		controller: function(img, User, $timeout){
			angular.element(document.getElementById("profileID"))
			.bind('change', function(evt) {
				img.resizeUpTo({
					file: evt.currentTarget.files[0],
					width: 300,
					height: 300
				}, function(dataUrl) {
					$timeout(function() {
						User.avatarUrl = dataUrl;
						User.save();
					});
				});
			});
		},
		template: '<input type="file" ng-hide="true" id="profileID">'
	}
}
/*start_user*/
/*
*	Crud file for client side user
*	We don't use waw crud on the user as it's basically personal update.
*	And if user use more then one device we can easly handle that with sockets.
*/
services.User = function($http, $timeout){
	// Initialize
		var self = this, ut;
		this.all_skills = ['cooking','fishing','painting'];
		$http.get('/api/user/get').then(function(resp){
			self.avatarUrl = resp.data.avatarUrl;
			self.skills = resp.data.skills;
			self.gender = resp.data.gender;
			self.name = resp.data.name;
			self.birth = resp.data.birth;
			self.data = resp.data.data;
			self._id = resp.data._id;
			$http.get('/api/user/users').then(function(resp){
				self.users = resp.data;
			});
		});
	// Skills
		this.addSkill = function(skill){

			self.update();
		}
		this.removeSkill = function(skill){

			self.update();
		}
	// Follow
		this.follow = function(user){

		}
		this.unfollow = function(user){

		}
	// Routes
		this.update = function(){
			$timeout.cancel(ut);
			$http.post('/api/user/update', {
				avatarUrl: self.avatarUrl,
				skills: self.skills,
				gender: self.gender,
				name: self.name,
				birth: self.birth,
				date: self.date,
				_id: self._id
			});
		}
		this.updateAfterWhile = function(){
			$timeout.cancel(ut);
			ut = $timeout(self.update, 1000);
		}
		this.delete = function(){
			$http.get('/api/user/delete');
		}
		this.changePassword = function(oldPass, newPass, passRepeated){
			if(!oldPass||oldPass.length<8||!newPass) return;
			$http.post('/api/user/changePassword',{
				oldPass: oldPass,
				newPass: newPass
			});
		}
	// End of service
}
/*
*	End for User Crud.
*/
/*end_user*/
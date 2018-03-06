var services = {}, filters = {}, directives = {}, controllers = {};
app.service(services).filter(filters).directive(directives).controller(controllers);
/*
*	Crud file for client side user
*	We don't use waw crud on the user as it's basically personal update.
*	And if user use more then one device we can easly handle that with sockets.
*/
services.User = function($http, $timeout, mongo, fm){
	// waw crud
		let self = this;
		this.all_skills = ['cooking','fishing','painting'];
		let updateAll = function(){
			return {
				followings: self.followings,
				followers: self.followers,
				gender: self.gender,
				skills: self.skills,
				birth: self.birth,
				name: self.name,
				data: self.data,
				_id: self._id,
				is: self.is
			};
		}
		$http.get('/api/user/me').then(function(resp){
			for(let key in resp.data){
				self[key] = resp.data[key];
			}
			self.skills_checked = {};
			for (var i = 0; i < self.skills.length; i++) {
				self.skills_checked[self.skills[i]] = true;
			}
			self.users = mongo.get('user');
			console.log(self);
		});
		this.updateSkill = function(skill){
			self.skills = [];
			for(let key in self.skills_checked){
				if(self.skills_checked[key]){
					self.skills.push(key);
				}
			}
			mongo.updateAll('user', updateAll());
		}



		this.follow = function(user){
			mongo.updateAll('user', updateAll());
		}
		this.unfollow = function(user){
			mongo.updateAll('user', updateAll());
		}
	// Custom Routes
		this.updateAfterWhile = function(){
			mongo.afterWhile(self, function(){
				mongo.updateAll('user', updateAll());
			});
		}
		fm.add({
			_id: 'ProfileID',
			width: 350,
			height: 350
		}, function(dataUrl) {
			self.avatarUrl = dataUrl;
			$http.post('/api/user/avatar',{
				dataUrl: dataUrl
			}).then(function(resp){
				if(resp) self.avatarUrl = resp.data;
			});
		});
		this.delete = function(){
			mongo.delete('user', {}, function(){
				window.location.href = "/";
			});
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
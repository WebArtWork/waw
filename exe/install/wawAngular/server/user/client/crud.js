
/*
*	Crud file for client side user
*/
crudServices.User = function($http, $timeout, mongo){
	// Initialize
		var self = this, updateTimeout, fields=[];
		$http.get('/api/user/me').then(function(resp){
			if (!resp.data) return;
			for (var key in resp.data) {
				self[key] = resp.data[key];
				fields.push(key);
			}
			self.users = mongo.get('user');
		});
	// Skills
		var enum = [];
		this.addSkill = function(skill){

			self.update();
		}
		this.removeSkill = function(skill){

			self.update();
		}
	// Followings
		this.addFollowiner = function(user){

			self.update();
		}
		this.removeFollowiner = function(user){

			self.update();
		}
	// Followers
		this.addFollower = function(user){

			self.update();
		}
		this.removeFollower = function(user){

			self.update();
		}
	// Routes
		this.update = function(){
			$timeout.cancel(updateTimeout);
			var v = {};
			for (var i = 0; i < fields.length; i++) {
				v[fields[i]] = self[fields[i]];
			}
			$http.post('/api/user/update', v);
		}
		this.updateAfterWhile = function(){
			$timeout.cancel(updateTimeout);
			obj.updateTimeout = $timeout(self.update, 1000);
		}
		this.delete = function(){
			$http.post('/api/user/delete', {
				_id: self._id
			});
		}
		this.changePassword = function(oldPass, newPass){
			if(!oldPass||!newPass) return;
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

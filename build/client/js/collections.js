collections.User = function() {
	"ngInject";
	this.clone = function(data) {
		var newUser = angular.copy(this);
		if (data) newUser.save(data);
		return newUser;
	};
	this.save = function(newUser) {
		this._id = newUser._id;
	};
};
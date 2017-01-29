var mongoose = require('mongoose');
var Schema = mongoose.Schema({
	name: String,
	description: String,
	author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	moderators: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		unique: true
	}],
});

Schema.methods.update = function(obj, callback) {
	this.name = obj.name;
	this.description = obj.description;
	this.save(callback);
};

Schema.methods.adminUpdate = function(obj, callback) {
	this.moderators = [];
	for (var i = 0; i < obj.moderators.length; i++) {
		if(obj.moderators[i]&&obj.moderators[i]._id)
			this.moderators.push(obj.moderators[i]._id);
		else if(typeof obj.moderators[i] == 'string')
			this.moderators.push(obj.moderators[i]);
	}
	this.name = obj.name;
	this.description = obj.description;
	this.save(callback);
};

module.exports = mongoose.model('CNAME', Schema);

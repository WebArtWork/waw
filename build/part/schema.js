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
module.exports = mongoose.model('NAME', Schema);
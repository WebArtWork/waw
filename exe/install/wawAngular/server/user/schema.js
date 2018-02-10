var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var schema = mongoose.Schema({
		email: {type: String, unique: true},
		password: {type: String},
		isAdmin: {type: Boolean, default: false},
		avatarUrl: {type: String, default: '/api/user/default.png'},
	skills: [{type: String, enum: ['cooking','fishing','painting']}],
	followings: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	followers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	gender: {type: Boolean},
	name: {type: String},
	birth: {type: Date},
	data: {}
});
schema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
schema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model('User', schema);



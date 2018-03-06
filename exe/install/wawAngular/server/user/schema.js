var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var schema = mongoose.Schema({
	email: {type: String, unique: true, sparse: true, trim: true},
	reg_email: {type: String, unique: true, sparse: true, trim: true},

	/*
	*	Auth Management
	*/
	is: {},

	/*
	*	Custom Updateable fields
	*/
	password: {type: String},
	avatarUrl: {type: String, default: '/api/user/default.png'},

	/*
	*	Updatable fields
	*/
	gender: {type: Boolean},
	name: {type: String},
	birth: {type: Date},
	skills: [{type: String, enum: ['cooking','fishing','painting']}],
	followings: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	followers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	data: {}
});
schema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
schema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model('User', schema);
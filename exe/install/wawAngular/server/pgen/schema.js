var mongoose = require('mongoose');
var Schema = mongoose.Schema({
	// SEO
	links_translates: [{
		url: String,
		lang: String
	}],
	img: {
		url: String,
		width: String,
		height: String
	},
		description: String,
		keywords: String,
		title: String,
	lang: String,
	// Design
	cssFiles: [String],
	// Info
	author: String,
	name: String,
	file: String,
	html: String,
	url: String
});

module.exports = mongoose.model('Pgen', Schema);

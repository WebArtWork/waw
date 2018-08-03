var CNAME = require(__dirname+'/schema.js');
module.exports = function(sd) {
	var router = sd._initRouter('/api/NAME');
	sd['query_update_all_NAME_author'] = function(req, res){
		return {
			_id: req.body._id,
			author: req.user._id
		};
	};
	sd['query_unique_field_NAME'] = function(req, res){
		return {
			_id: req.body._id,
			author: req.user._id
		};
	};
};

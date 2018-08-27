module.exports = function(sd) {
	sd['query_update_all_NAME_author'] = function(req, res) {
		return {
			_id: req.body._id,
			author: req.user._id
		};
	};
	sd['query_unique_field_NAME'] = function(req, res) {
		return {
			_id: req.body._id,
			author: req.user._id
		};
	};
}
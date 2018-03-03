var CNAME = require(__dirname+'/schema.js');
module.exports = function(sd) {
	var router = sd._initRouter('/api/NAME');
	/*
	*	/api/NAME/create
	*	custom  query below code

		// Ensure route
		sd['ensure_create_NAME'] = function(req, res, next){
			if(req.user) next();
			else res.json(false);
		};
	*/

	/*
	*	/api/NAME/get
	*	custom  query below code

		// Default Route Management
		sd['ensure_get_NAME'] = function(req, res, next){
			next();
		};
		sd['populate_get_NAME'] = function(req, res){
			return false;
		};
		sd['sort_get_NAME'] = function(req, res){
			return false;
		};
		sd['skip_get_NAME'] = function(req, res){
			return false;
		};
		sd['limit_get_NAME'] = function(req, res){
			return false;
		};
		sd['select_get_NAME'] = function(req, res){
			return false;
		};
		sd['query_get_NAME'] = function(req, res){
			return {
				moderators: req.user._id
			}
		};


		// Custom Route Management with name 'all'
		sd['ensure_get_NAME_all'] = function(req, res, next){
			next();
		};
		sd['populate_get_NAME_all'] = function(req, res){
			return false;
		};
		sd['sort_get_NAME_all'] = function(req, res){
			return false;
		};
		sd['skip_get_NAME_all'] = function(req, res){
			return false;
		};
		sd['limit_get_NAME_all'] = function(req, res){
			return false;
		};
		sd['select_get_NAME_all'] = function(req, res){
			return false;
		};
		sd['query_get_NAME_all'] = function(req, res){
			return {};
		};
	*/

	/*
	*	/api/NAME/update
	*	custom  query below code

		// Update
		sd['ensure_update_NAME'] = function(req, res, next){
			next();
		};
		sd['query_update_NAME'] = function(req, res){
			return {
				_id: req.body._id,
				moderators: req.user._id
			};
		};
	*/
	
	/*
	*	/api/NAME/update/all
	*	custom  query below code

		// Update All
		sd['ensure_update_all_NAME'] = function(req, res, next){
			next();
		};
		sd['query_update_all_NAME'] = function(req, res){
			return {
				_id: req.body._id,
				moderators: req.user._id
			};
		};

		// Update All AUthor
		sd['ensure_update_all_NAME_author'] = function(req, res, next){
			next();
		};
	*/
		sd['query_update_all_NAME_author'] = function(req, res){
			return {
				_id: req.body._id,
				author: req.user._id
			};
		};

	/*
	*	/api/NAME/unique/field
	*	custom  query below code

		// Update All AUthor
		sd['ensure_unique_field_NAME_url'] = function(req, res, next){
			next();
		};
		sd['search_query_unique_field_NAME_url'] = function(req, res, update){
			let query = {};
			query[update.key] = req.body[update.key];
			return query;
		};
	*/
		sd['query_unique_field_NAME_url'] = function(req, res){
			return {
				_id: req.body._id,
				author: req.user._id
			};
		};

	/*
	*	/api/NAME/delete
	*	custom  query below code

		// Ensure route
		sd['ensure_delete_NAME'] = function(req, res, next){
			if(req.user) next();
			else res.json(false);
		};

		// Query for delete
		sd['delete_NAME'] = function(req, res){
			return {
				_id: req.body._id,
				author: req.user._id
			}
		}
	*/

	/*
	*	End of router
	*/
};

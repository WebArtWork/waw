var CNAME = require(__dirname+'/schema.js');
module.exports = function(sd) {
	var router = sd.router('/api/NAME');
	sd.crud('NAME', {
		names: {
			author: {
				update: function(req, res){
					return {
						author: req.user._id,
						_id: req.body._id
					};
				}
			}
		},
		unique: function(req, res){
			return {
				author: req.user._id,
				_id: req.body._id
			};
		}
	});
};
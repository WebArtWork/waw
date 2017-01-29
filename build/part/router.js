var CNAME = require(__dirname+'/schema.js');
var api = '/api/NAME';
module.exports = function(app, express, sd) {
	var router = express.Router();
	app.use(api, router);
};
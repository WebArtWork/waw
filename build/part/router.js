var Schema = require(__dirname+'/schema.js');
var api = '/api/NAME';
module.exports = function(app, express, part) {
	var router = express.Router();
	app.use(api, router);
};
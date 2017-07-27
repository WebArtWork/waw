var gu = require(__dirname+'/gu.js');
var cmd = require('node-cmd');
module.exports.android = function(){
	if(gu.fileExist(__dirname+'/../../cordova/cordova.js')){

		cmd.get("ls",function(err, data, stderr) {
			if(err) gu.close(err);
			if(data) gu.close(data);
		});


	}else gu.close('Please run: waw install android');
}
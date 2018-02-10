var sd = require(__dirname+'/../../sd')();
module.exports.project = function(branch, callback){
	if(typeof branch == 'function') callback = branch;
	var myRepo = sd._git(process.cwd());
	myRepo.fetch('--all',function(err){
		myRepo.reset('origin/'+(branch||'master'),function(err){
			sd._log('Project were successfully updated.');
			if(typeof callback == 'function') callback();
			else process.exit(0);
		});
	});
}
module.exports.framework = function(){
	var myRepo = sd._git(__dirname+'/../..');
	myRepo.init(function(){
		myRepo.addRemote('origin', 'git@github.com:WebArtWork/waw.git', function(err){
			myRepo.fetch('--all',function(err){
				myRepo.reset('origin/master',function(err){
					sd._close('Framework waw were successfully updated.');
				});
			});
		});
	});
}
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
module.exports.framework = function(cb){
	var myRepo = sd._git(__dirname+'/../..');
	myRepo.init(function(){
		myRepo.addRemote('origin', 'git@github.com:WebArtWork/waw.git', function(err){
			myRepo.fetch('--all',function(err){
				myRepo.reset('origin/master', function(){
					cb(sd);
				});
			});
		});
	});
}
module.exports.install = function(name, repo){
	sd._fse.mkdirs(process.cwd() + '/' + name);
	var myRepo = sd._git(process.cwd() + '/' + name);
	myRepo.init(function(){
		myRepo.addRemote('origin', repo, function(err){
			myRepo.fetch('--all',function(err){
				myRepo.reset('origin/master', function(){
					sd._fse.removeSync(process.cwd() + '/' + name + '/.git');
					sd._close('Project successfully created.');
				});
			});
		});
	});
}
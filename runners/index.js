const sd = require(__dirname+'/../helpers');
const argv = process.argv.slice();
argv.shift();
argv.shift();
if(!argv.length) argv.push('');
/*
*	Read
*/
	const commands = {};
	const install_modules = function(location, dependencies, cb){
		sd.each(dependencies, (name, version, cbModule)=>{
			if (sd.fs.existsSync(location+'/node_modules/'+name)) return cbModule();
			sd.npmi({
				name: name,
				version: version,
				path: location,
				forceInstall: true,
				npmLoad: {
					loglevel: 'silent'
				}
			}, cbModule);
		}, cb);
	}
	const fetch_runner = function(location, cb){
		let runner = location.split('/');
		runner = {
			version: runner[runner.length-1],
			name: runner[runner.length-2]
		}
		if(!sd.wawConfig.packages[runner.name]) sd.exit("Runner "+runner.name+" is not register, you can add it by 'waw set package RUNNERNAME REPOLINK'");
		sd.fetch(location, sd.wawConfig.packages[runner.name], err=>{
			if(err) sd.exit("Couldn't pull the repo for runner "+runner.name+", please verify that repo LINK is correct and you have access to it.");
			read_runner(location, cb);
		});
	}
	const read_runner = function(location, cb){
		if (!sd.fs.existsSync(location+'/runner.json')) {
			return fetch_runner(location, cb);
		}
		let runnerConfig = JSON.parse(sd.fs.readFileSync(location+'/runner.json'));
		if(Array.isArray(runnerConfig.commands)){
			for (let i = 0; i < runnerConfig.commands.length; i++) {
				if(commands[runnerConfig.commands[i]]){
					sd.exit('Multiple commands detected on runners. You can review all runners that you are using to customize the commands.'); 
				}
				commands[runnerConfig.commands[i]] = location;
			}
		}
		install_modules(location, runnerConfig.dependencies, cb);
	}
/*
*	Start
*/
	module.exports = function(root){
		let executers = [];
		let unique = {};
		const runners = sd.getDirectories(process.cwd()+'/runners', true);
		for (let i = 0; i < runners.length; i++) {
			if(unique[runners[i]]) continue;
			unique[runners[i]] = true;
			executers.push(function(cb){
				read_runner(process.cwd()+'/runners/'+runners[i], cb);
			});
		}
		if(!unique.default){
			executers.push(function(cb){
				read_runner(__dirname+'/default', cb);
			});
		}
		if(sd.config.runners){
			sd.each(sd.config.runners, (name, version)=>{
				executers.push(function(cb){
					read_runner(__dirname+'/'+name+'/'+version, cb);
				});
			});
		}
		sd.parallel(executers, function(){
			if(commands[argv[0]]){
				require(commands[argv[0]])(sd, argv, root);
			}
		});
	}
/*
*	End
*/
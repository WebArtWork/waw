const sd = require(__dirname+'/../helpers');
const argv = process.argv.slice();
argv.shift();
argv.shift();
if(!argv.length) argv.push('');
/*
*	Read
*/
	const commands = {};
	const install_modules = function(modulesLoc, dependencies, cb){
		sd.each(dependencies, (name, version, cbModule)=>{
			if (sd.fs.existsSync(modulesLoc+'/node_modules/'+name)) return cbModule();
			sd.npmi({
				name: name,
				version: version,
				path: modulesLoc,
				forceInstall: true,
				npmLoad: {
					loglevel: 'silent'
				}
			}, cbModule);
		}, cb);
	}
	const read_runner = function(modulesLoc, runnerLoc, cb){
		let runnerConfig = JSON.parse(sd.fs.readFileSync(runnerLoc+'/runner.json'));
		if(Array.isArray(runnerConfig.commands)){
			for (let i = 0; i < runnerConfig.commands.length; i++) {
				if(commands[runnerConfig.commands[i]]){
					sd.exit('Multiple commands detected on runners. You can review all runners that you are using to customize the commands.'); 
				}
				commands[runnerConfig.commands[i]] = runnerLoc;
			}
		}
		install_modules(modulesLoc, runnerConfig.dependencies, cb);
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
				read_runner(process.cwd(), process.cwd()+'/runners/'+runners[i], cb);
			});
		}
		if(!unique.default){
			executers.push(function(cb){
				read_runner(root, __dirname+'/default', cb);
			});
		}
		if(sd.config.runners){
			sd.each(sd.config.runners, (name, version)=>{
				executers.push(function(cb){
					read_runner(root, __dirname+'/'+name+'/'+version, cb);
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
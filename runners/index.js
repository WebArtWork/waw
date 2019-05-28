/*
*	Initialize
*/
	var git = require('gitty');
	var npmi = require('npmi');
	var fs = require('fs');
	var wawConfig = JSON.parse(fs.readFileSync(__dirname+'/../config.json'));
	var config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		fs.mkdirSync(process.cwd()+'/client', { recursive: true });
		fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		var serverConfig = fs.readFileSync(process.cwd()+'/server.json');
		for(var each in serverConfig){
			config[each] = serverConfig[each];
		}
	}
	var argv = process.argv.slice();
	argv.shift();
	argv.shift();
	if(!argv.length) argv.push('');
/*
*	Read
*/
	const { lstatSync, readdirSync } = fs;
	const { join } = require('path');
	const isDirectory = source => lstatSync(source).isDirectory();
	const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory).map(source=>{source});
	console.log(getDirectories(process.cwd()+'/runners'));
/*
*	Read
*/
	var commands = {};
	var install_modules = function(modulesLoc, dependencies, cb){
		var counter = 1;
		for(var each in dependencies){
			if (fs.existsSync(modulesLoc+'/node_modules/'+each)) continue;
			counter++;
			npmi({
			    name: each,
			    version: dependencies[each],
			    path: modulesLoc,
			    forceInstall: true,
			    npmLoad: {
			        loglevel: 'silent'
			    }
			}, function(){
				if(--counter==0) cb();
			});
		}
		if(--counter==0) cb();
	}
	var read_runner = function(modulesLoc, runnerLoc, cb){
		var runnerConfig = JSON.parse(fs.readFileSync(runnerLoc+'/runner.json'));
		if(Array.isArray(runnerConfig.commands)){
			for (var i = 0; i < runnerConfig.commands.length; i++) {
				commands[runnerConfig.commands[i]] = runnerLoc;
			}
		}
		install_modules(modulesLoc, runnerConfig.dependencies, cb);
	}
/*
*	Start
*/
	module.exports = function(appJs){
		/*
		var local = config.runners.local;
		for (var i = 0; i < local.length; i++) {
			if(typeof local[i] == 'string' && local[i].length < 30){
				read_runner(process.cwd(), process.cwd()+'/runners/'+local[i], function(){
					if(commands[argv[0]]){
						require(commands[argv[0]])(appJs);
					}
				});
			}
		}
		*/
	}
/*
*	End
*/
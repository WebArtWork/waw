/*
*	Initialize
*/
	const git = require('gitty');
	const npmi = require('npmi');
	const fs = require('fs');
	const wawConfig = JSON.parse(fs.readFileSync(__dirname+'/../config.json'));
	let config = {};
	if (fs.existsSync(process.cwd()+'/config.json')) {
		config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json'));
		fs.mkdirSync(process.cwd()+'/client', { recursive: true });
		fs.mkdirSync(process.cwd()+'/server', { recursive: true });
	}
	if (fs.existsSync(process.cwd()+'/server.json')) {
		let serverConfig = fs.readFileSync(process.cwd()+'/server.json');
		for(let each in serverConfig){
			config[each] = serverConfig[each];
		}
	}
	const argv = process.argv.slice();
	argv.shift();
	argv.shift();
	if(!argv.length) argv.push('');
/*
*	Read
*/
	const isDirectory = source => fs.lstatSync(source).isDirectory();
	const isFile = source => fs.lstatSync(source).isFile();
	const getDirectories = source => fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isDirectory);
	const getFolders = function(loc){
		if (!fs.existsSync(loc)) return [];
		let folders = getDirectories(loc);
		for (let i = 0; i < folders.length; i++) {
			folders[i] = folders[i].split('\\').pop();
		}
		return folders;
	}
/*
*	Read
*/
	const commands = {};
	const install_modules = function(modulesLoc, dependencies, cb){
		let counter = 1;
		for(let each in dependencies){
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
	const read_runner = function(modulesLoc, runnerLoc, cb){
		let runnerConfig = JSON.parse(fs.readFileSync(runnerLoc+'/runner.json'));
		if(Array.isArray(runnerConfig.commands)){
			for (let i = 0; i < runnerConfig.commands.length; i++) {
				commands[runnerConfig.commands[i]] = runnerLoc;
			}
		}
		install_modules(modulesLoc, runnerConfig.dependencies, cb);
	}
/*
*	Start
*/
	module.exports = function(appJs){
		let runners = getFolders(process.cwd()+'/runners');
		for (let i = 0; i < runners.length; i++) {
			if(typeof runners[i] == 'string' && runners[i].length < 30){
				read_runner(process.cwd(), process.cwd()+'/runners/'+runners[i], function(){
					if(commands[argv[0]]){
						require(commands[argv[0]])(appJs, argv);
					}
				});
			}
		}
	}
/*
*	End
*/
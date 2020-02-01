#!/usr/bin/env node
const fs = require('fs');
/*
*	Read Project Config
*/
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
	console.log('config:', config);
/*
*	Read Project Parts
*/
	const isDirectory = source => fs.lstatSync(source).isDirectory();
	const getDirectories = source => {
		if (!fs.existsSync(source)) {
			return [];
		}
		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(isDirectory);
	}
	const parts = getDirectories(process.cwd()+'/server');
	let _parts = {};
	for (let i = 0; i < parts.length; i++) {
		parts[i] = parts[i].split('\\').pop();
		_parts[parts[i]] = true;
	}
	console.log(parts);
/*
*	End of waw
*/

process.exit(1);
/*
From config read/install common parts
Execute runners
Require routers
*/
//require(__dirname+'/runners')(__dirname);
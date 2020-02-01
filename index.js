#!/usr/bin/env node
const fs = require('fs');
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
console.log(config);
process.exit(1);
/*
Read local parts
From config read/install common parts
Execute runners
Require routers
*/
//require(__dirname+'/runners')(__dirname);
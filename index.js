#!/usr/bin/env node
var nodemon = require('nodemon');
var pm2 = require('pm2');
var fse = require('fs-extra');
var run = function(){
	// add check if this is waw project
	nodemon({
		script: __dirname+'/run/index.js',
		ext: 'js json',
		watch: process.cwd()+'/server'
	});
}
var serve = function(){
	var config = fse.readJsonSync(process.cwd()+'/config.json', {throws: false});
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.start({
			name: config.name,
			script: __dirname+'/run/index.js',
			exec_mode: 'cluster',
			instances: 1,
			max_memory_restart: '200M'
		}, function(err, apps) {
			pm2.disconnect();
			process.exit(2);
		});
	});
}
var list = function(){
	var config = fse.readJsonSync(process.cwd()+'/config.json', {throws: false});
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.list(function(err, list) {
			for (var i = 0; i < list.length; i++) {
				console.log(list[i].name + ' : ' + list[i].monit.memory + ' : ' + list[i].monit.cpu);
			}
			pm2.disconnect();
			process.exit(2);
		});
	});
}
var stopServe = function(){
	var config = fse.readJsonSync(process.cwd()+'/config.json', {throws: false});
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(config.name, function(err, apps) {
			pm2.disconnect();
			process.exit(2);
		});
	});
}
if(process.argv[2]){
	switch(process.argv[2].toLowerCase()){
		case 'git':
			require(__dirname+'/build').git();
			return;
		case 'c':
		case 'create':
			require(__dirname+'/build').create();
			return;
		case 'r':
		case 'run':
			return run();
		case 's':
		case 'start':
			return serve();
		case 'l':
		case 'list':
			return list();
		case 'stop':
			return stopServe();
		case 'f':
		case 'fetch':
			require(__dirname+'/build').fetch();
			return;
		case 'a':
		case 'add':
			require(__dirname+'/build').add();
			return;
		case 'remove':
			require(__dirname+'/build').remove();
			return;
		case '--version':
		case '-version':
		case '--v':
		case '-v':
			var config = fse.readJsonSync(__dirname+'/package.json', {throws: false});
			console.log('waw version is '+config.version);
			return;
		default:
			return console.log('Wrong Command.');
	}
}else return run();
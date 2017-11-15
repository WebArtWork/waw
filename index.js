#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var gu = require(__dirname+'/build/gu.js');
if (fs.existsSync(__dirname+'/config.json')) {
	var config = fse.readJsonSync(__dirname+'/config.json', {
		throws: false
	});
}else var config = {};
var projectConfig = false;

if (fs.existsSync(process.cwd()+'/config.json')) {
	projectConfig = fse.readJsonSync(process.cwd()+'/config.json', {
		throws: false
	})||{};
}
if (fs.existsSync(process.cwd()+'/server.json')) {
	var extra = fse.readJsonSync(process.cwd()+'/server.json', {
		throws: false
	})||{};
	for(var key in extra){
		projectConfig[key] = extra[key];
	}
}

var runcss = function(){
	require('../nodemon')({
		script: __dirname+'/run/runcss.js',
		ext: 'js json'
	});
}
var run = function(){
	if(!projectConfig){
		console.log('This is not waw project');
		process.exit();
	}
	fse.mkdirsSync(process.cwd()+'/server');
	fse.mkdirsSync(process.cwd()+'/client');
	var nodemon = require('../nodemon');
	// add check if this is waw project
	var obj = {
		script: __dirname+'/run/index.js',
		ext: 'js json html css'
	}
	obj.watch = [process.cwd()+'/server'];
	var clientRoot = process.cwd()+'/client';
	fse.mkdirsSync(clientRoot);
	fse.mkdirsSync(process.cwd()+'/client');
	obj.ignore = projectConfig.dererIgnore||[];
	if (fs.existsSync(clientRoot + '/config.json')) {
		var info = fse.readJsonSync(clientRoot + '/config.json', {
			throws: false
		});
		for (var j = 0; j < info.router.length; j++) {
			obj.watch.push(clientRoot + '/' + info.router[j].src);
		}
		if(Array.isArray(info.plugins)){			
			for (var j = 0; j < info.plugins.length; j++) {
				let pluginLoc = clientRoot + '/js/' + info.plugins[j];
				fse.mkdirsSync(pluginLoc);
				obj.ignore.push(pluginLoc+'/'+info.plugins[j]+'.js');
				obj.ignore.push(pluginLoc+'/'+info.plugins[j]+'-min.js');
				obj.watch.push(pluginLoc);
			}
		}
	} else {
		var pages = fs.readdirSync(process.cwd() + '/client').filter(function(file) {
			return fs.statSync(path.join(process.cwd() + '/client', file)).isDirectory();
		});
		for (var i = 0; i < pages.length; i++) {
			var pageUrl = clientRoot + '/' + pages[i];
			if (fs.existsSync(pageUrl + '/config.json')) var info = fse
				.readJsonSync(pageUrl + '/config.json', {
					throws: false
				});
			else var info = false;
			if (!info) continue;
			for (var j = 0; j < info.router.length; j++) {
				obj.watch.push(pageUrl + '/' + info.router[j].src);
			}
		}
	}
	nodemon(obj);
}
var serve = function(){
	if(!projectConfig){
		console.log('This is not waw project');
		process.exit();
	}
	var pm2 = require('../pm2');
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.start({
			name: projectConfig.name||process.cwd(),
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
	if(!projectConfig){
		console.log('This is not waw project');
		process.exit();
	}
	var pm2 = require('../pm2');
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
	var pm2 = require('../pm2');
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(projectConfig.name||process.cwd(), function(err, apps) {
			pm2.disconnect();
			process.exit(2);
		});
	});
}
var restart = function(){
	if(!projectConfig){
		console.log('This is not waw project');
		process.exit();
	}
	var pm2 = require('../pm2');
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(projectConfig.name||process.cwd(), function(err, apps) {
			pm2.start({
				name: projectConfig.name||process.cwd(),
				script: __dirname+'/run/index.js',
				exec_mode: 'cluster',
				instances: 1,
				max_memory_restart: '200M'
			}, function(err, apps) {
				pm2.disconnect();
				process.exit(2);
			});
		});
	});
}
var adduser = function(){
	config.user = process.argv[3];
	fse.writeJsonSync(__dirname+'/config.json', config);
	gu.close("User successfully added.");
}
var listusers = function(){
	if(!config.users) gu.close("You don't have any users");
	gu.close(config.users);
}
if(process.argv[2]){
	switch(process.argv[2].toLowerCase()){
		// Waw User Management
		case 'adduser':
			return adduser();
		case 'listusers':
			return listusers();
		// Project Build
		case 'n':
		case 'new':
			require(__dirname+'/build').new();
			return;
		case 'r':
		case 'run':
			return run();
		case 'rc':
		case 'runcss':
			return runcss();
		case 's':
		case 'start':
			return serve();
		case 'r':
		case 'restart':
			return restart();
		case 'l':
		case 'list':
			return list();
		case 'w':
		case 'watch':
			return list();
		case 't':
		case 'tr':
		case 'translate':
			if(process.argv[3].toLowerCase()=='update'||process.argv[3].toLowerCase()=='u')
				require(__dirname+'/build/tr.js').update();
			else require(__dirname+'/build/tr.js').fetch();
			return;
		case 'tf':
			require(__dirname+'/build/tr.js').fetch();
			return;
		case 'tu':
			require(__dirname+'/build/tr.js').update();
			return;
		case 'u':
		case 'update':
			require(__dirname+'/build/git.js').fetch(process.argv[3], function(){
				restart();
			});
			return;
		case 'uw':
			require(__dirname+'/build/git.js').fetchOrigin();
			return;
		case 'lu':
		case 'lupdate':
			require(__dirname+'/build/git.js').fetch(process.argv[3], function(){
				run();
			});
			return;
		case 'p':
		case 'plugin':
			return require(__dirname+'/build/git.js')
			.initializePlugin(process.argv[3], process.argv[4], process.argv[5]);
		case 'i':
		case 'init':
			return require(__dirname+'/build/git.js')
			.initialize(process.argv[3], process.argv[4]);
		case 'stop':
			return stopServe();
		case 'c':
		case 'crud':
			require(__dirname+'/build').crud();
			return;
		case 'cs':
			process.argv[5]=process.argv[4];
			process.argv[4]=process.argv[3];
			process.argv[3]='server';
			require(__dirname+'/build').crud();
			return;
		case 'cc':
			process.argv[5]=process.argv[4];
			process.argv[4]=process.argv[3];
			process.argv[3]='client';
			require(__dirname+'/build').crud();
			return;
		case 'd':
		case 'domain':
			require(__dirname+'/build').domain();
			return;
		case 'config':
			require(__dirname+'/build').config(process.argv[3], process.argv[4]);
			return;
		case 'a':
		case 'add':
			require(__dirname+'/build').add();
			return;
		case 'android':
			require(__dirname+'/build/cordova.js').android();
			return;
		case 'ap':
			process.argv[4]=process.argv[3];
			process.argv[3]='part';
			require(__dirname+'/build').add();
			return;
		case 'arp':
			process.argv[4]=process.argv[3];
			process.argv[3]='routepage';
			require(__dirname+'/build').add();
			return;
		case 'alp':
			process.argv[4]=process.argv[3];
			process.argv[3]='localpage';
			require(__dirname+'/build').add();
			return;
		case 'asp':
			process.argv[4]=process.argv[3];
			process.argv[3]='simplepage';
			require(__dirname+'/build').add();
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
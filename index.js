#!/usr/bin/env node
var nodemon = require('nodemon');
var pm2 = require('pm2');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var gu = require(__dirname+'/build/gu.js');
if (fs.existsSync(__dirname+'/config.json')) {
	var config = fse.readJsonSync(__dirname+'/config.json', {
		throws: false
	});
}else var config = {};
var projectConfig = {};
if (fs.existsSync(process.cwd()+'/server.json')) {
	projectConfig = fse.readJsonSync(__dirname+'/server.json', {
		throws: false
	});
}else if (fs.existsSync(process.cwd()+'/config.json')) {
	projectConfig = fse.readJsonSync(__dirname+'/config.json', {
		throws: false
	});
}

var run = function(){
	// add check if this is waw project
	var obj = {
		script: __dirname+'/run/index.js',
		ext: 'js json'
	}
	obj.watch = [process.cwd()+'/server'];
	var clientRoot = process.cwd()+'/client';
	if (fs.existsSync(clientRoot + '/config.json')) {
		var info = fse.readJsonSync(clientRoot + '/config.json', {
			throws: false
		});
		for (var j = 0; j < info.router.length; j++) {
			obj.watch.push(clientRoot + '/' + info.router[j].src);
		}
	} else {
		var pages = sd._getDirectories(clientRoot);
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
	if(projectConfig.swigIgnore) obj.ignore = projectConfig.swigIgnore;
	nodemon(obj);
}
var serve = function(){
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
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(projectConfig.name, function(err, apps) {
			pm2.disconnect();
			process.exit(2);
		});
	});
}
var restart = function(){
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(projectConfig.name, function(err, apps) {
			pm2.start({
				name: projectConfig.name,
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
	var newUser = JSON.parse(process.argv[3]);
	if(!newUser.name||!newUser.token) gu.close("Not correct user.");
	if(!config.users) config.users=[];
	config.users.unshift(newUser);
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
		case 'i':
		case 'init':
			require(__dirname+'/build/git.js').initialize(process.argv[3], process.argv[4]);
			return;
		case 'stop':
			return stopServe();
		case 'c':
		case 'crud':
			require(__dirname+'/build').crud();
			return;
		case 'd':
		case 'domain':
			require(__dirname+'/build').domain();
			return;
		case 'config':
			require(__dirname+'/build').config(process.argv[3], process.argv[4]);
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
		case 'a':
		case 'add':
			require(__dirname+'/build').add();
			return;
		case 'ap':
			process.argv[4]=process.argv[3];
			process.argv[3]='part';
			require(__dirname+'/build').add();
			return;
		case 'app':
			process.argv[4]=process.argv[3];
			process.argv[3]='publicpage';
			require(__dirname+'/build').add();
			return;
		case 'alp':
			process.argv[4]=process.argv[3];
			process.argv[3]='localpage';
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
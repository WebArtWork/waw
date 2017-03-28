#!/usr/bin/env node
var nodemon = require('nodemon');
var pm2 = require('pm2');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var run = function(){
	// add check if this is waw project
	var obj = {
		script: __dirname+'/run/index.js',
		ext: 'js json'
	}
	obj.watch = [process.cwd()+'/server'];
	var pages = fs.readdirSync(process.cwd() + '/client').filter(function(file) {
		return fs.statSync(path.join(process.cwd() + '/client', file)).isDirectory();
	});
	for (var i = 0; i < pages.length; i++) {
		if (pages[i] == 'scss') continue; // remove this one day
		var pageUrl = process.cwd() + '/client/' + pages[i];
		if (fs.existsSync(pageUrl + '/config.json')) var info = fse
			.readJsonSync(pageUrl + '/config.json', {
				throws: false
			});
		else continue;
		if (info&&info.seo) {
			for (var j = 0; j < info.router.length; j++) {
				obj.watch.push(pageUrl + '/' + info.router[j].src);
			}
		}
	}
	nodemon(obj);
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
var restart = function(){
	var config = fse.readJsonSync(process.cwd()+'/config.json', {throws: false});
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			process.exit(2);
		}
		pm2.delete(config.name, function(err, apps) {
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
	});
}
if(process.argv[2]){
	switch(process.argv[2].toLowerCase()){
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
#!/usr/bin/env node
var nodemon = require('nodemon');
var run = function(){
	nodemon({
		script: __dirname+'/run/index.js',
		ext: 'js json',
		watch: process.cwd()+'/server'
	});
}
if(process.argv[2]){
	switch(process.argv[2].toLowerCase()){
		case 'git':
			require(__dirname+'/build').git();
			return;
		case 'create':
			require(__dirname+'/build').create();
			return;
		case 'run':
			return run();
		case 'fetch':
			require(__dirname+'/build').fetch();
			return;
		case 'add':
			require(__dirname+'/build').add();
			return;
		case 'remove':
			require(__dirname+'/build').remove();
			return;
		default:
			return console.log('Wrong Command.');
	}
}else{
	console.log('INFO ABOUT YOUR PROJECT');
}
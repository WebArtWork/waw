#!/usr/bin/env node

/*
waw
waw build
waw run
waw add part NAME

waw git init user git@github.com:WebArtWork/part-user.git
waw git update user "Message"

(waw git init user waw:NAME)


npm i -g waw
[
	waw create NAME
	waw create auth NAME
]
waw run
*/
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
		case 'build':
			require(__dirname+'/build').build();
			return;
		case 'git':
			require(__dirname+'/build').git();
			return;
		case 'create':
			require(__dirname+'/build').create();
			return;
		case 'run':
			run();
			return;
		case 'add':
			require(__dirname+'/build').add();
			return;
		default:
			return console.log('Wrong Command.');
	}
}else{
	console.log('INFO ABOUT YOUR PROJECT');
}

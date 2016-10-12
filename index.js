/*
waw
waw build
waw run
waw add part NAME

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

/*
waw build
waw run
waw
waw add part NAME

waw need to add
waw create NAME
*/
var nodemon = require('nodemon');
var run = function(){
	nodemon({
		script: __dirname+'/run/index.js',
		ext: 'js json'
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

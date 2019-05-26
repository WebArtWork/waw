#!/usr/bin/env node
process.argv.shift();
process.argv.shift();
require(__dirname+'/runners')(process.argv, function(params){
	require(__dirname+'/parts')(params);
});
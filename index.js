#!/usr/bin/env node
const fs = require('fs');
const argv = process.argv.slice();
argv.shift();
argv.shift();
if(argv.length && argv[0].toLowerCase()=='update'){
	waw.fetch(__dirname, 'https://github.com/WebArtWork/waw.git', err => {
		fs.rmdirSync(__dirname + '/server', { recursive: true });
		console.log('Framework has been updated and global modules removed');
		process.exit(1);
	}, waw.argv.length > 1 && waw.argv[1] || 'master');
}
const waw = require(__dirname + '/waw.js');
waw.argv = argv;
waw.ready('modules installed', ()=>{
	if(argv.length){
		const command = argv.shift();
		let done = false;
		for (var i = 0; i < waw.modules.length; i++) {
			if(!waw.modules[i].runner) continue;
			let runners = waw.node_files(waw.modules[i].__root, waw.modules[i].runner);
			runners = runners[0];
			if(typeof runners !== 'object' || Array.isArray(runners)) continue;
			for(let each in runners){
				if(each.toLowerCase() !== command.toLowerCase()) continue;
				waw.part_config = waw.modules[i];
				waw.part_root = waw.modules[i].__root;
				waw.parts = waw.modules;
				let continue_process = runners[each](waw);
				if(continue_process !== true) return;
				done = true;
				break;
			}
			if(done) break;
		}
	}
	const nodemon = require('nodemon');
	nodemon({
		script: __dirname+'/app.js',
		watch: [process.cwd()+'/server', __dirname+'/server', __dirname+'/pages', __dirname+'/config.json', __dirname+'/template.json', __dirname+'/app.js'],
		ext: 'js json'
	});
	nodemon.on('start', function () {
		console.log(' ===== App has started ===== ');
	}).on('restart', function (files) {
		console.log(' ===== App restarted ===== ');
	});
});

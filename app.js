#!/usr/bin/env node
const waw = require(__dirname + '/waw.js');
waw.ready('modules installed', () => {
	waw.modules.sort(function(a, b){
		if(!a.priority) a.priority=0;
		if(!b.priority) b.priority=0;
		if(a.priority < b.priority) return 1;
		return -1;
	});
	waw.parts = waw.modules;
	for (var i = 0; i < waw.modules.length; i++) {
		if(!waw.modules[i].router) continue;
		const routers = waw.node_files(waw.modules[i].__root, waw.modules[i].router, true);
		waw.each(routers, router => {
			if( typeof router === 'function' ) router(waw);
		});
	}
});

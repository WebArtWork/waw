#!/usr/bin/env node
const waw = require(__dirname + '/waw.js');
waw.ready('modules installed', () => {
	for (var i = 0; i < waw.modules.length; i++) {
		if(!waw.modules[i].router) continue;
		const routers = waw.node_files(waw.modules[i].__root, waw.modules[i].router, true);
		waw.each(routers, router => {
			if( typeof router === 'function' ) router(waw);
		});
	}
});

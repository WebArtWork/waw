#!/usr/bin/env node
const waw = require(__dirname + '/waw.js');
waw.modules.sort(function(a, b){
	if(!a.priority) a.priority=0;
	if(!b.priority) b.priority=0;
	if(a.priority < b.priority) return 1;
	return -1;
});
for (var i = 0; i < waw.modules.length; i++) {
	if(!waw.modules[i].router) continue;
	const routers = waw.node_files(waw.modules[i].__root, waw.modules[i].router, true);
	console.log(routers);
	waw.each(routers, router => {
		console.log(router);
		if( typeof router === 'function' ) router(waw);
	});
}
#!/usr/bin/env node

// Import waw utilities and modules
const waw = require(__dirname + "/waw.js");

/**
 * Wait until all modules are installed, then:
 * For each loaded module that has a 'router' property,
 * load its router files, and execute each router function with waw as argument.
 */
waw.ready("modules installed", () => {
	for (var i = 0; i < waw.modules.length; i++) {
		if (!waw.modules[i].router) continue;

		// Load router files for this module
		const routers = waw.node_files(
			waw.modules[i].__root,
			waw.modules[i].router,
			true
		);

		// Run each router function if it's callable
		waw.each(routers, (router) => {
			if (typeof router === "function") {
				router(waw);
			}
		});
	}
});

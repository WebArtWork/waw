#!/usr/bin/env node

// Import waw utilities and modules
const waw = require(__dirname + "/waw.js");

/**
 * app.js
 * ------
 * Runtime entrypoint used by nodemon (see index.js).
 *
 * What it does:
 * 1) Waits until all modules are installed and loaded by `waw.js`
 * 2) For every loaded module that declares a `router` field in its module.json,
 *    it loads router files (Node modules)
 * 3) Executes each exported router function with `waw` as the only argument
 *
 * Router files are expected to export a function:
 *   module.exports = function (waw) { ...register routes... }
 *
 * The actual HTTP server (Express/Socket/etc.) is typically provided by modules (e.g. sem),
 * not by this core entrypoint.
 */

/**
 * Wait until all modules are installed, then:
 * For each loaded module that has a 'router' property,
 * load its router files, and execute each router function with waw as argument.
 */
waw.ready("modules installed", () => {
	for (var i = 0; i < waw.modules.length; i++) {
		if (!waw.modules[i].router) continue;

		/**
		 * Module router declaration:
		 * - `waw.modules[i].router` usually points to one or more file paths
		 * - `waw.node_files()` resolves, creates a template if missing, and `require()`s them
		 */
		const routers = waw.node_files(
			waw.modules[i].__root,
			waw.modules[i].router,
			true
		);

		/**
		 * Run each router if it is callable.
		 * Non-function exports are ignored to avoid crashing startup.
		 */
		waw.each(routers, (router) => {
			if (typeof router === "function") {
				router(waw);
			}
		});
	}
});

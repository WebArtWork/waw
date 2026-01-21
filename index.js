#!/usr/bin/env node

/**
 * index.js
 * --------
 * Main waw CLI entrypoint (the `waw` binary).
 *
 * Two modes:
 * 1) `waw update [branch]`
 *    - Pulls latest waw framework code from GitHub into the global install folder
 *    - Removes previously installed global modules (server/*) after update
 *
 * 2) Default (no update)
 *    - Waits for modules to be installed
 *    - Tries to find a "runner" command in any module that provides one
 *    - If no runner handles the command (or runner returns `true` to continue),
 *      starts nodemon to run app.js and watch important folders/files
 */

// Import waw core utilities
const waw = require(__dirname + "/waw.js");

// Add runner functionality to waw
require(__dirname + "/runner.js")(waw);

// File system module for file operations
const fs = require("fs");

/**
 * If the first argument is 'update', update waw CLI from GitHub repo.
 * Sets branch (from CLI or default 'master'), fetches the repo,
 * cleans up old modules, saves branch info, then exits.
 */
if (waw.argv.length && waw.argv[0].toLowerCase() == "update") {
	let json = waw.readJson(waw.waw_root + "/server.json");
	json.branch = (waw.argv.length > 1 && waw.argv[1]) || "master";

	/**
	 * Updates the waw global install directory in-place.
	 * - Repo is fetched into __dirname (global install folder)
	 * - Then `server/` is removed to force fresh global module installs later
	 */
	waw.fetch(
		__dirname,
		"https://github.com/WebArtWork/waw.git",
		(err) => {
			if (err) {
				console.log("Framework could not be updated");
				process.exit(1);
			}
			fs.rmSync(__dirname + "/server", { recursive: true });
			waw.writeJson(waw.waw_root + "/server.json", json);
			console.log(
				"Framework has been updated and global modules removed"
			);
			process.exit(1);
		},
		json.branch
	);

	/**
	 * If not updating, wait for modules to be ready, then process commands.
	 * Tries to find a runner matching the first CLI argument in any loaded module.
	 * If found, executes the runner and sets module context.
	 * If no runner is found or executed, starts nodemon to watch app/server files and auto-restart.
	 */
} else {
	waw.ready("modules installed", () => {
		/**
		 * Runner resolution:
		 * - A module can expose a `runner` entry in module.json
		 * - That entry points to a file exporting an object: { commandName: (waw) => ... }
		 * - We match by `waw.argv[0]` (case-insensitive)
		 *
		 * Runner contract:
		 * - If runner returns `true` → continue into nodemon startup
		 * - Otherwise → stop (runner fully handled the process)
		 */
		if (waw.argv.length) {
			let done = false;
			// Search each module for a runner matching the CLI command
			for (var i = waw.modules.length - 1; i >= 0; i--) {
				if (!waw.modules[i].runner) continue;
				let runners = waw.node_files(
					waw.modules[i].__root,
					waw.modules[i].runner
				);
				runners = runners[0];
				if (typeof runners !== "object" || Array.isArray(runners))
					continue;
				for (let each in runners) {
					if (each.toLowerCase() !== waw.argv[0].toLowerCase())
						continue;

					// Context helpers for runner implementations
					waw.module_config = waw.modules[i];
					waw.module_root = waw.modules[i].__root;

					let continue_process = runners[each](waw);
					if (continue_process !== true) return;

					done = true;
					break;
				}
				if (done) break;
			}
		}

		/**
		 * Development runtime:
		 * nodemon runs app.js and restarts when watched paths change.
		 */
		const nodemon = require("nodemon");
		nodemon({
			script: __dirname + "/app.js",
			watch: [
				process.cwd() + "/server",
				process.cwd() + "/angular.json",
				process.cwd() + "/react.json",
				process.cwd() + "/vue.json",
				process.cwd() + "/config.json",
				__dirname + "/server",
				__dirname + "/config.json",
			],
			ext: "js json",
		});
		nodemon
			.on("start", function () {
				console.log(" ===== App has started ===== ");
			})
			.on("restart", function (files) {
				console.log(" ===== App restarted ===== ");
			});
	});
}

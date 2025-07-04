#!/usr/bin/env node

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
		// Start app in development mode with nodemon (auto-reloads on changes)
		const nodemon = require("nodemon");
		nodemon({
			script: __dirname + "/app.js",
			watch: [
				process.cwd() + "/server",
				__dirname + "/server",
				__dirname + "/pages",
				__dirname + "/template.json",
				__dirname + "/app.js",
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

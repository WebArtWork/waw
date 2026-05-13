#!/usr/bin/env node

const cmd = process.argv[2];
if (cmd === "-v" || cmd === "--version" || cmd === "version") {
	console.log(require("./package.json").version);
	process.exit(0);
}

const modules = require('./util.modules');

const executed = require('./util.cli')(modules);

if (!executed) {
	const nodemon = require("nodemon");

	nodemon({
		script: __dirname + "/util.runtime.js",
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
		.on("start", () => {
			console.log(" ===== App has started ===== ");
		})
		.on("restart", () => {
			console.log(" ===== App restarted ===== ");
		});
}

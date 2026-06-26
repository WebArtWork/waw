#!/usr/bin/env node

const cmd = process.argv[2];
if (cmd === "-v" || cmd === "--version" || cmd === "version") {
	const { wawPath } = require('./util.waw');
	const modules = require('./util.modules');
	const version = require("./package.json").version;
	console.log(`waw location: ${wawPath}`);
	console.log(`waw: ${version}`);
	const names = modules
		.map(m => (m.__name || m.name || ''))
		.filter(Boolean)
		.map(n => n.charAt(0).toUpperCase() + n.slice(1));
	console.log(`Accessible Modules: ${names.length ? names.join(', ') : 'none'}`);
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

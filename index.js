#!/usr/bin/env node

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

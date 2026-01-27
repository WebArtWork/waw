#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const modules = require('waw/util.modules');
const waw = require('waw/util.waw');
waw.modules = modules;

(async () => {
	for (const m of modules) {
		if (!m || !m.__root) continue;

		const index = path.join(m.__root, "index.js");

		if (!fs.existsSync(index)) continue;

		try {
			const func = require(index);

			if (typeof func === 'function') {
				await func(waw);
			}
		} catch (e) {
			console.error(e);
		}
	}
})();

const path = require("node:path");
const fs = require("node:fs");

const project_root = process.cwd();

// where the globally installed `waw` package lives (folder that contains its index.js)
const waw_root = path.dirname(require.resolve("waw"));

// cli args after `waw`
const argv = process.argv.slice(2);

// common project paths
const server_root = path.join(project_root, "server");
const config_path = path.join(project_root, "config.json");
const server_config_path = path.join(project_root, "server.json");

// common waw global paths
const waw_server_root = path.join(waw_root, "server");
const waw_config_path = path.join(waw_root, "config.json");

const readJson = (p) => {
	try {
		if (!fs.existsSync(p)) return {};

		return JSON.parse(fs.readFileSync(p, "utf8"));
	} catch {
		return {};
	}
};

module.exports = {
	argv,

	project_root,
	server_root,

	config_path,
	server_config_path,

	waw_root,
	waw_config_path,
	waw_server_root,

	config: {
		...readJson(config_path),
		...readJson(server_config_path),
	}
};

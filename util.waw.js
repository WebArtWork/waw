const path = require("node:path");

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

module.exports = {
	argv,

	project_root,
	server_root,

	config_path,
	server_config_path,

	waw_root,
	waw_server_root,
	waw_config_path,
};

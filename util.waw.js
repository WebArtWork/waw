const fs = require("node:fs");
const path = require("node:path");

// ---------- tiny fs helpers ----------
const exists = (p) => fs.existsSync(p);

const isFile = (p) => {
	try {
		return fs.existsSync(p) && fs.lstatSync(p).isFile();
	} catch {
		return false;
	}
};

const isDir = (p) => {
	try {
		return fs.existsSync(p) && fs.lstatSync(p).isDirectory();
	} catch {
		return false;
	}
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });

const readText = (p, fallback = "") => {
	try {
		return fs.readFileSync(p, "utf8");
	} catch {
		return fallback;
	}
};

const writeText = (p, data) => {
	ensureDir(path.dirname(p));
	fs.writeFileSync(p, String(data ?? ""), "utf8");
};

const readJson = (p, fallback = {}) => {
	try {
		if (!fs.existsSync(p)) return fallback;
		return JSON.parse(fs.readFileSync(p, "utf8"));
	} catch {
		return fallback;
	}
};

const writeJson = (p, obj, pretty = true) => {
	const json = pretty ? JSON.stringify(obj ?? {}, null, "\t") : JSON.stringify(obj ?? {});
	writeText(p, json + "\n");
};

const readWrite = (fromPath, toPath, replace = {}) => {
	let code = readText(fromPath);
	for (const from in replace) {
		code = code.split(from).join(replace[from]);
	}
	writeText(toPath, code);
}

// cli args after `waw`
const argv = process.argv.slice(2);

// where the globally installed `waw` package lives (folder that contains its index.js)
const wawPath = path.dirname(require.resolve("waw"));

// common waw global paths
const wawModulesPath = path.join(wawPath, "server");
const wawConfigPath = path.join(wawPath, "config.json");
const wawConfigServerPath = path.join(wawPath, "server.json");

const projectPath = process.cwd();
// common project paths (default; some projects may use config.server === "")
const configPath = path.join(projectPath, "config.json");
const configServerPath = path.join(projectPath, "server.json");

const config = {
	...readJson(wawConfigPath, {}),
	...readJson(wawConfigServerPath, {}),
	...readJson(configPath, {}),
	...readJson(configServerPath, {}),
}

const modulesPath =
	path.join(projectPath, Object.prototype.hasOwnProperty.call(config, "server") &&
		typeof config.server === "string"
		? config.server
		: "server");


const detectProjectType = () => {
	const cwd = process.cwd();
	return {
		isAngular: exists(path.join(cwd, "angular.json")),
		isReact: fs.existsSync(path.join(cwd, "react.json")),
		isVue: fs.existsSync(path.join(cwd, "vue.json")),
		isWjst:
			fs.existsSync(path.join(cwd, "template.json")) ||
			fs.existsSync(path.join(cwd, "wjst.json")),
	};
};

// ---------- exported context ----------
module.exports = {
	argv,

	wawPath,
	wawModulesPath,
	wawConfigPath,
	wawConfigServerPath,
	projectPath,
	configPath,
	configServerPath,
	modulesPath,
	projectType:
		exists(path.join(projectPath, "angular.json")) ? 'angular' :
		exists(path.join(projectPath, "react.json")) ? 'react' :
		exists(path.join(projectPath, "vue.json")) ? 'vue' :
		exists(path.join(projectPath, "wjst.json")) ? 'wjst' :
		exists(path.join(projectPath, "config.json")) ? 'waw' : '',

	// fs helpers
	exists,
	isFile,
	isDir,
	ensureDir,
	rm,
	readText,
	writeText,
	readJson,
	writeJson,
	readWrite,

	// merged config snapshot (kept for compatibility)
	config,
};

// util.modules.js
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const git = require("./util.git");

// global waw root (where this CLI package is installed)
const wawRoot = __dirname;

const j = (p) => {
	try {
		return JSON.parse(fs.readFileSync(p, "utf8"));
	} catch {
		return {};
	}
};

const walk = (dir, out = []) => {
	for (const n of fs.readdirSync(dir)) {
		if (n === "node_modules" || n === ".git") continue;
		const p = path.join(dir, n);
		const s = fs.lstatSync(p);
		s.isDirectory() ? walk(p, out) : out.push(p);
	}
	return out;
};

// --- tiny semver helpers (enough for waw-style deps) ---
const parseVer = (v) => {
	const m = ("" + v).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
	return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
};
const cmp = (a, b) => {
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
	return 0;
};
const satisfies = (installed, wanted) => {
	if (!wanted || wanted === "*" || wanted === "latest") return true;
	const i = parseVer(installed);
	if (!i) return false;

	const w = ("" + wanted).trim();
	if (/^\d+\.\d+\.\d+$/.test(w)) return installed.startsWith(w);

	const wv = parseVer(w.replace(/^[^\d]*/, ""));
	if (!wv) return false;

	if (w.startsWith("^")) {
		// ^1.2.3 => same major, >= 1.2.3
		return i[0] === wv[0] && cmp(i, wv) >= 0;
	}
	if (w.startsWith("~")) {
		// ~1.2.3 => same major+minor, >= 1.2.3
		return i[0] === wv[0] && i[1] === wv[1] && cmp(i, wv) >= 0;
	}
	if (w.startsWith(">=")) return cmp(i, wv) >= 0;

	// fallback: if it contains a number, treat it as exact prefix match
	return installed.startsWith(wv.join("."));
};

const installedVersion = (moduleRoot, name) => {
	try {
		const pj = path.join(moduleRoot, "node_modules", name, "package.json");
		return j(pj).version || "";
	} catch {
		return "";
	}
};

const orange = (s) => `\x1b[38;2;255;165;0m${s}\x1b[0m`;

const ensureDeps = (moduleRoot, deps, moduleName) => {
	if (!deps || typeof deps !== "object") return;

	let needsInstall = false;

	// 1) detect if anything is missing / incompatible
	for (const name of Object.keys(deps)) {
		const wanted = deps[name];
		const has = installedVersion(moduleRoot, name);
		if (!has || !satisfies(has, wanted)) {
			needsInstall = true;
			break;
		}
	}

	if (!needsInstall) return;

	// 2) install ALL declared deps in one shot (stable resolution)
	const installAll = [];
	const namesPretty = [];

	for (const name of Object.keys(deps)) {
		const wanted = deps[name];
		namesPretty.push(name);

		if (!wanted || wanted === "*" || wanted === "latest") installAll.push(name);
		else installAll.push(`${name}@${wanted}`);
	}

	console.log(
		`Installing node module${namesPretty.length ? "s" : ''} ${orange(namesPretty.join(", "))} at module ${orange(
			moduleName || path.basename(moduleRoot)
		)}`
	);

	const cmd =
		`npm i --prefix ${JSON.stringify(moduleRoot)} ` +
		`--workspaces=false --include-workspace-root=false ` +
		`--legacy-peer-deps --no-save --no-package-lock --no-fund --no-audit --loglevel=error ` +
		installAll.join(" ");

	execSync(cmd, { cwd: moduleRoot, stdio: "inherit" });
};


const load = (dir, name, isGlobal) => {
	const part = path.join(dir, "part.json");
	const mod = path.join(dir, "module.json");
	if (fs.existsSync(part) && !fs.existsSync(mod)) try { fs.renameSync(part, mod); } catch {}
	if (!fs.existsSync(mod)) return;

	const m = j(mod);
	m.rootPath = m.__root = path.normalize(dir);
	m.__name = name;
	m.__global = !!isGlobal;

	// install deps declared by module itself
	ensureDeps(m.__root, m.dependencies, name);

	// files snapshot (after install; still excludes node_modules)
	m.files = walk(m.__root);
	return m;
};

const orderModules = (modules) => {
	// case-insensitive names
	const by = Object.fromEntries(modules.map((m) => [(m.__name || "").toLowerCase(), m]));
	const names = Object.keys(by);

	const adj = Object.fromEntries(names.map((n) => [n, new Set()]));
	const indeg = Object.fromEntries(names.map((n) => [n, 0]));
	const add = (a, b) => {
		if (a === b) return;
		if (!adj[a].has(b)) {
			adj[a].add(b);
			indeg[b]++;
		}
	};
	const norm = (v) => (v ? (Array.isArray(v) ? v : [v]) : []);
	const normNames = (v) => norm(v).map((x) => ("" + x).toLowerCase()).filter(Boolean);

	// explicit constraints (used to prevent "*" creating cycles)
	const expAfter = {}, expBefore = {};
	for (const me of names) {
		const m = by[me];
		expAfter[me] = new Set(normNames(m.after).filter((x) => x !== "*"));
		expBefore[me] = new Set(normNames(m.before).filter((x) => x !== "*"));
	}

	for (const me of names) {
		const m = by[me];

		for (const x of normNames(m.before)) {
			if (x === "*") {
				// before everyone except those I'm explicitly after
				for (const other of names) if (other !== me && !expAfter[me].has(other)) add(me, other);
			} else if (by[x]) add(me, x);
		}

		for (const x of normNames(m.after)) {
			if (x === "*") {
				// after everyone except those I'm explicitly before
				for (const other of names) if (other !== me && !expBefore[me].has(other)) add(other, me);
			} else if (by[x]) add(x, me);
		}
	}

	// stable topo queue: keep discovery order
	const original = modules
		.map((m) => (m.__name || "").toLowerCase())
		.filter((n) => by[n]);

	const q = [];
	const seen = new Set();
	for (const n of original) if (indeg[n] === 0 && !seen.has(n)) q.push(n), seen.add(n);
	for (const n of names) if (indeg[n] === 0 && !seen.has(n)) q.push(n), seen.add(n);

	const out = [];
	for (let i = 0; i < q.length; i++) {
		const n = q[i];
		out.push(n);
		for (const to of adj[n]) if (--indeg[to] === 0) q.push(to);
	}

	// cycle fallback: old priority
	if (out.length !== names.length) {
		return modules.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
	}

	const idx = Object.fromEntries(out.map((n, i) => [n, i]));
	return modules.slice().sort(
		(a, b) => idx[(a.__name || "").toLowerCase()] - idx[(b.__name || "").toLowerCase()]
	);
};

// ---- ensure global module exists (installs from github if missing) ----
const ensureGlobalModuleExists = (name, repo, branch = "master") => {
	const dir = path.join(wawRoot, "server", name);
	if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) return dir;

	git.forceSync(dir, { repo, branch, silent: true });
	return dir;
};

// ---- ensure an npm module exists in its OWN isolated prefix ----
// Each module gets a private dir under <installRoot>/node_modules/.waw/<name> so
// installs are additive: `npm i --no-save` only ever reconciles the prefix it
// targets, so installing one module can never prune another. (Sharing one
// node_modules made each install delete the previously installed sibling — and
// across the cli + nodemon-runtime processes the two modules ping-ponged,
// leaving core deleted before its index.js ran, hence `waw.wait is not a
// function`.) The dot-prefixed dir lives alongside npm's own .bin / .cache and
// is left untouched by npm reconciliation at the project root.
const ensureNpmModuleIsolated = (name, pkgName, installRoot) => {
	const home = path.join(installRoot, "node_modules", ".waw", name);
	const dir = path.join(home, "node_modules", pkgName);
	if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) return dir;

	fs.mkdirSync(home, { recursive: true });
	console.log(`Installing waw module ${orange(pkgName)} at ${orange(path.basename(installRoot))}`);
	const cmd =
		`npm i --prefix ${JSON.stringify(home)} ` +
		`--no-save --no-package-lock --no-fund --no-audit --loglevel=error ${pkgName}`;
	execSync(cmd, { cwd: home, stdio: "inherit" });
	return dir;
};

// ---- process a modules:{} config block, loading and recursing into each entry ----
const processModules = (modulesConfig, installRoot, collected) => {
	if (!modulesConfig || typeof modulesConfig !== 'object') return;

	for (const name in modulesConfig) {
		const value = modulesConfig[name];
		let dir;

		if (orgMocks[value]) {
			// git-based org — always cloned into wawRoot/server/ (unchanged)
			dir = ensureGlobalModuleExists(name, orgMocks[value].replace('{NAME}', name));
		} else {
			// "npm" = shorthand for @wawjs/waw-{name}, anything else = literal package name
			const pkgName = value === 'npm' ? `@wawjs/waw-${name}` : value;
			dir = ensureNpmModuleIsolated(name, pkgName, installRoot);
		}

		if (!dir || !fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) continue;

		const m = load(dir, name, !!orgMocks[value]);
		if (!m) continue;

		collected.push(m);

		// recurse into sub-modules declared in the module's own module.json
		if (m.modules && typeof m.modules === 'object') {
			processModules(m.modules, m.__root, collected);
		}
	}
};

// ---- read project config ----
const cwd = process.cwd();
const config = Object.assign(j(path.join(cwd, "config.json")), j(path.join(cwd, "server.json")));
if (typeof config.server !== "string" && fs.existsSync(path.join(cwd, "server"))) config.server = "server";

const modules = [];

// local modules
const localRoot = path.join(cwd, config.server || "");
if (fs.existsSync(localRoot)) {
	for (const n of fs.readdirSync(localRoot)) {
		if (n === "node_modules" || n === ".git") continue;
		const dir = path.join(localRoot, n);
		if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) continue;
		const m = load(dir, n, false);
		if (m) modules.push(m);
	}
}


// required global modules (your config.modules object map)
const orgMocks = {
	waw: 'https://github.com/WebArtWork/waw-{NAME}.git',
	itkp: 'git@github.com:IT-Kamianets/waw-{NAME}.git'
};
config.modules ||= {};
processModules(config.modules, cwd, modules);

if (!modules.length) {
	const dir = ensureGlobalModuleExists('core', orgMocks['waw'].replace('{NAME}', 'core'));

	if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
		const core = load(dir, 'core', true);
		if (core) modules.push(core);
	}
}

const projectTypes = {
	'angular.json': 'angular',
	'react.json': 'react',
	'vue.json': 'vue',
	'wjst.json': 'wjst',
}
for (const jsonName in projectTypes) {
	const name = projectTypes[jsonName];
	if (fs.existsSync(path.join(cwd, jsonName)) && !modules.find(m => m.name === name)) {
		const dir = ensureGlobalModuleExists(name, orgMocks['waw'].replace('{NAME}', name));

		if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
			const core = load(dir, name, true);
			if (core) modules.push(core);
		}
	}
}

module.exports = orderModules(modules);

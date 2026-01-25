// util.modules.js
const fs = require("node:fs");
const path = require("node:path");

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

const load = (dir, name, isGlobal) => {
	const part = path.join(dir, "part.json");
	const mod = path.join(dir, "module.json");
	if (fs.existsSync(part) && !fs.existsSync(mod)) try { fs.renameSync(part, mod); } catch {}
	if (!fs.existsSync(mod)) return;

	const m = j(mod);
	m.__root = path.normalize(dir);
	m.__name = name;
	m.__global = !!isGlobal;
	m.files = walk(m.__root);
	return m;
};

const orderModules = (modules) => {
	// case-insensitive name map
	const byLower = Object.fromEntries(
		modules.map((m) => [(m.__name || "").toLowerCase(), m])
	);
	const names = Object.keys(byLower); // lowercased names

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

	// precompute explicit before/after sets (lowercased, without "*")
	const explicitAfter = {};
	const explicitBefore = {};
	for (const n of names) {
		const m = byLower[n];
		explicitAfter[n] = new Set(norm(m.after).map(x => (""+x).toLowerCase()).filter(x => x && x !== "*"));
		explicitBefore[n] = new Set(norm(m.before).map(x => (""+x).toLowerCase()).filter(x => x && x !== "*"));
	}

	for (const me of names) {
		const m = byLower[me];

		// BEFORE
		for (const raw of norm(m.before)) {
			const x = ("" + raw).toLowerCase();
			if (!x) continue;

			if (x === "*") {
				// before all EXCEPT the ones I'm explicitly after
				for (const other of names) {
					if (other !== me && !explicitAfter[me].has(other)) add(me, other);
				}
			} else if (byLower[x]) {
				add(me, x);
			}
		}

		// AFTER
		for (const raw of norm(m.after)) {
			const x = ("" + raw).toLowerCase();
			if (!x) continue;

			if (x === "*") {
				// after all EXCEPT the ones I'm explicitly before
				for (const other of names) {
					if (other !== me && !explicitBefore[me].has(other)) add(other, me);
				}
			} else if (byLower[x]) {
				add(x, me);
			}
		}
	}

	// Kahn topo sort (stable-ish: queue in original discovery order)
	const original = modules.map(m => (m.__name || "").toLowerCase()).filter(n => byLower[n]);
	const q = original.filter((n) => indeg[n] === 0);
	const seen = new Set(q);
	for (const n of names) if (indeg[n] === 0 && !seen.has(n)) q.push(n);

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
		if (!fs.lstatSync(dir).isDirectory()) continue;
		const m = load(dir, n, false);
		if (m) modules.push(m);
	}
}

// global waw install root (where waw's index.js is)
const wawRoot = path.dirname(require.resolve("waw"));

// global modules required by project
// supports both:
//   modules: { core:"waw", sem:"waw" }
//   modules: ["core","sem"]
const required = config.modules;

if (Array.isArray(required)) {
	for (const name of required) {
		const dir = path.join(wawRoot, "server", name);
		if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
			const m = load(dir, name, true);
			if (m) modules.push(m);
		}
	}
} else if (required && typeof required === "object") {
	for (const name of Object.keys(required)) {
		const dir = path.join(wawRoot, "server", name);
		if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
			const m = load(dir, name, true);
			if (m) modules.push(m);
		}
	}
}

module.exports = orderModules(modules);

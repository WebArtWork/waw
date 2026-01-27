const waw = require("./util.waw");

module.exports = function runExe(modules) {
	const cmdRaw = process.argv[2];

	if (!cmdRaw) return false;

	const cmd = String(cmdRaw).toLowerCase();

	for (let mi = modules.length - 1; mi >= 0; mi--) {
		const m = modules[mi];
		if (!m || !Array.isArray(m.files)) continue;

		for (let fi = m.files.length - 1; fi >= 0; fi--) {
			const f = m.files[fi];
			if (typeof f !== "string") continue;

			// Only match exact filename: cli.js (not *.cli.js)
			const normalized = f.replace(/\\/g, "/");
			const base = normalized.split("/").pop();

			if (base.toLowerCase() !== "cli.js") continue;

			const ex = require(f);
			if (!ex) continue;

			const ctx = {
				...waw,
				modules,
				module: m,
				module_root: m.__root,
				module_config: m,
			};

			// case 1: export is object OR function with command keys
			if ((typeof ex === "object" || typeof ex === "function") && !Array.isArray(ex)) {
				// direct match first
				if (typeof ex[cmdRaw] === "function") {
					ex[cmdRaw](ctx);
					return true;
				}
				if (typeof ex[cmd] === "function") {
					ex[cmd](ctx);
					return true;
				}

				// case-insensitive key scan (covers "--V", etc.)
				for (const k of Object.keys(ex)) {
					if (k.toLowerCase() !== cmd) continue;
					if (typeof ex[k] !== "function") continue;
					ex[k](ctx);
					return true;
				}
			}

			// case 2: export is a function that decides itself
			// module.exports = (cmd, waw) => boolean/void
			if (typeof ex === "function") {
				const handled = ex(cmdRaw, ctx);
				if (handled !== false) return true;
			}
		}
	}

	return false;
};

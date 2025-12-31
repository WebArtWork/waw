#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, exec } = require("child_process");

/**
 * waw.js
 * ------
 * Core runtime + module loader for the waw framework.
 *
 * Responsibilities:
 * - Parse CLI args and read project config (config.json/server.json)
 * - Detect project type (Angular/React/Vue/wjst) and add default core modules
 * - Load local modules from the project's server folder
 * - Install missing global modules from GitHub (WebArtWork org) into global install
 * - Install npm dependencies declared by modules and/or project config
 * - Provide small utility API (fs helpers, iterator helpers, signal/ready system)
 *
 * Important runtime signals:
 * - "modules installed"
 *   Fired when all async installs complete (used by index.js/app.js)
 */

/**
 * Runs an array of async functions serially (one after another).
 *
 * @param {number} i Current index
 * @param {Function[]} arr Array of functions in shape: (next) => void
 * @param {Function} callback Called when the whole chain is completed
 */
const serial = function (i, arr, callback) {
	if (i >= arr.length) return callback();
	arr[i](function () {
		serial(++i, arr, callback);
	});
};

// Signals for pub/sub event system
const signals = {};

// Counter for module installation tasks
let count = 1;

/**
 * Increments the global counter.
 * Used to track async install operations.
 */
const inc = () => ++count;

/**
 * Decrements the global counter.
 * When it reaches zero, fires the "modules installed" signal.
 */
const dec = () => {
	if (--count === 0) {
		waw.done("modules installed");
	}
};

// Default node command file template
const node_file = `module.exports.command = function(waw) {\n\t// add your Run code\n};`;

// Flag to avoid multiple concurrent npm installs
let installing_node_module = false;

/**
 * Main waw utility object with helper methods and module handling.
 * Exported at the bottom: module.exports = waw
 */
const waw = {
	/**
	 * CLI arguments (excluding "node" and the entry script).
	 * Example:
	 * - running `waw new project-name`
	 * - argv might be ["new", "project-name"]
	 */
	argv: process.argv.splice(2, process.argv.length - 2),

	/** Absolute path to waw global install folder (where index.js lives). */
	waw_root: __dirname,

	/** Current working directory (the user's project root). */
	project_root: process.cwd(),

	/** Predefined core module repo URLs (filled by detectors below). */
	core_modules: {
		core: "https://github.com/WebArtWork/waw-core.git",
	},

	/**
	 * Organization repo URL templates used for global module install.
	 * `waw.core_module("sem")` → "https://github.com/WebArtWork/waw-sem.git"
	 */
	core_orgs: {
		waw: "https://github.com/WebArtWork/waw-NAME.git",
		itkp: "https://github.com/IT-Kamianets/waw-NAME.git",
	},

	/** Get waw org repo URL for a given module name. */
	core_module: (name) => waw.core_orgs.waw.replace("NAME", name),

	/** Returns true if the path is a directory. */
	isDirectory: (source) => fs.lstatSync(source).isDirectory(),

	/**
	 * Lists all directories in the given source folder.
	 * Returns [] if folder does not exist.
	 */
	getDirectories: function (source) {
		if (!fs.existsSync(source)) {
			return [];
		}
		return fs
			.readdirSync(source)
			.map((name) => require("path").join(source, name))
			.filter(this.isDirectory);
	},

	/** Returns true if the path is a file. */
	isFile: (source) => fs.lstatSync(source).isFile(),

	/** Lists all files in the given source folder (non-recursive). */
	getFiles: function (source) {
		return fs
			.readdirSync(source)
			.map((name) => path.join(source, name))
			.filter(this.isFile);
	},

	/**
	 * Recursively gets all files from a folder.
	 * Optional filter:
	 * - opts.end: only keep files ending with this suffix (e.g. ".js")
	 */
	getFilesRecursively: function (source, opts = {}) {
		let dirs = this.getDirectories(source);
		let files = dirs
			.map((dir) => this.getFilesRecursively(dir))
			.reduce((a, b) => a.concat(b), []);
		files = files.concat(this.getFiles(source));
		if (opts.end) {
			for (var i = files.length - 1; i >= 0; i--) {
				if (!files[i].endsWith(opts.end)) {
					files.splice(i, 1);
				}
			}
		}
		return files;
	},

	/**
	 * Reads and parses a JSON file.
	 * Returns {} if file doesn't exist or is invalid JSON.
	 */
	readJson: function (source) {
		if (fs.existsSync(source) && this.isFile(source)) {
			try {
				return JSON.parse(fs.readFileSync(source));
			} catch (e) {
				return {};
			}
		} else return {};
	},

	/** Writes a JSON object to a file (no pretty-print). */
	writeJson: (path, json) => fs.writeFileSync(path, JSON.stringify(json)),

	/**
	 * Merges properties from fromObj into toObj.
	 * If replace=false, it only fills missing fields.
	 */
	uniteJson: (toObj, fromObj, replace = true) => {
		for (const each in fromObj) {
			if (replace || !toObj[each]) {
				toObj[each] = fromObj[each];
			}
		}
	},

	/** Pushes all elements from fromArray into toArray. */
	uniteArray: (toArray, fromArray) => {
		for (var i = 0; i < fromArray.length; i++) {
			toArray.push(fromArray[i]);
		}
	},

	/**
	 * Clones/updates a git repo into a folder (optionally removes .git).
	 *
	 * Notes:
	 * - Uses "git init + git fetch + git reset --hard origin/branch"
	 * - On Windows, stdout is redirected to NUL in git fetch
	 *
	 * @param {string} cwd Target folder
	 * @param {string} repo Remote repo URL
	 * @param {Function} callback Called after repo is ready
	 * @param {string} [branch="master"] Branch to pull from origin
	 * @param {boolean} [removeGit=true] Remove .git folder after fetch
	 */
	fetch: (cwd, repo, callback, branch = "master", removeGit = true) => {
		cwd = cwd.split("\\").join("/");
		fs.mkdirSync(cwd, { recursive: true });
		if (!fs.existsSync(path.join(cwd, ".git"))) {
			execSync("git init", { cwd });
			execSync("git remote add origin " + repo, { cwd });
		}
		execSync("git fetch --all > NUL 2>&1", { cwd });
		execSync("git reset --hard origin/" + branch, { cwd });
		if (removeGit) {
			fs.rmSync(path.join(cwd, ".git"), { recursive: true });
		}
		callback();
	},

	/**
	 * Fetches repo into a temp subfolder (used for update flows).
	 * Keeps .git (removeGit=false).
	 */
	update: (folder, repo, callback, branch = "master") => {
		waw.fetch(folder + "/temp", repo, callback, branch, false);
	},

	/**
	 * Runs all functions in arr in parallel, then calls callback.
	 * Each function must call its provided `next()` exactly once.
	 */
	parallel: (arr, callback) => {
		let counter = arr.length;
		if (counter === 0) return callback();
		for (let i = 0; i < arr.length; i++) {
			arr[i](function () {
				if (--counter === 0) callback();
			});
		}
	},

	/**
	 * Iterates over arrays or objects with optional serial execution.
	 *
	 * Array mode callback signature:
	 *   func(item, next, index)
	 *
	 * Object mode callback signature:
	 *   func(key, value, next, index)
	 *
	 * @param {any[]|Record<string, any>} arrOrObj
	 * @param {Function} func iterator callback
	 * @param {Function|boolean} [callback] completion callback or boolean for isSerial
	 * @param {boolean} [isSerial=false] run sequentially if true
	 */
	each: function (arrOrObj, func, callback = () => {}, isSerial = false) {
		if (typeof callback == "boolean") {
			isSerial = callback;
			callback = () => {};
		}
		if (Array.isArray(arrOrObj)) {
			let counter = arrOrObj.length;
			if (counter === 0) return callback();
			if (isSerial) {
				let serialArr = [];
				for (let i = 0; i < arrOrObj.length; i++) {
					serialArr.push(function (next) {
						func(
							arrOrObj[i],
							function () {
								if (--counter === 0) callback();
								else next();
							},
							i
						);
					});
				}
				serial(0, serialArr, callback);
			} else {
				for (let i = 0; i < arrOrObj.length; i++) {
					func(
						arrOrObj[i],
						function () {
							if (--counter === 0) callback();
						},
						i
					);
				}
			}
		} else if (typeof arrOrObj == "object") {
			if (isSerial) {
				let serialArr = [];
				let arr = [];
				for (let each in arrOrObj) {
					arr.push({
						value: arrOrObj[each],
						each: each,
					});
				}
				let counter = arr.length;
				for (let i = 0; i < arr.length; i++) {
					serialArr.push(function (next) {
						func(
							arr[i].each,
							arr[i].value,
							function () {
								if (--counter === 0) callback();
								else next();
							},
							i
						);
					});
				}
				serial(0, serialArr, callback);
			} else {
				let counter = 1;
				for (let each in arrOrObj) {
					counter++;
					func(each, arrOrObj[each], function () {
						if (--counter === 0) callback();
					});
				}
				if (--counter === 0) callback();
			}
		} else callback();
	},

	/**
	 * Loads node command/router files.
	 * - Accepts space-separated string or array of paths
	 * - Creates a default template file if missing
	 * - Returns the required exports
	 *
	 * @param {string} source Folder where the files are located
	 * @param {string|string[]|{src:string}} files File(s) to load
	 * @param {boolean} [isRouter=false] If true, changes the template to router format
	 * @returns {any[]} Array of required exports
	 */
	node_files: (source, files, isRouter = false) => {
		if (typeof files == "object" && files.src) {
			files = [files.src];
		} else if (typeof files === "string") {
			files = files.split(" ");
		}
		for (var i = files.length - 1; i >= 0; i--) {
			if (typeof files[i] === "object") {
				files[i] = files[i].src;
			}
			if (!fs.existsSync(source + "/" + files[i])) {
				let code = node_file;
				if (isRouter) {
					code = code
						.replace(".command", "")
						.replace("Run", "Router");
				}
				fs.writeFileSync(path.resolve(source, files[i]), code, "utf8");
			}
			files[i] = require(path.resolve(source, files[i]));
		}
		return files;
	},

	/**
	 * Installs a node module using npm, with retries on failure.
	 * This is a "single module" installer, separate from install.npmi which installs multiple deps.
	 *
	 * opts:
	 * - name: package name (supports "pkg@ver" but name is normalized)
	 * - version: version string or "*" for latest
	 * - path: folder to run npm in
	 * - save: if falsy, removes package.json/package-lock.json inside the installed module folder
	 */
	npmi: function (opts, next = () => {}, shutdown = 3) {
		opts.name = opts.name.split("@")[0];
		const modulePath = path.resolve(opts.path, "node_modules", opts.name);
		if (!fs.existsSync(modulePath)) {
			if (installing_node_module) {
				return setTimeout(() => waw.npmi(opts, next, shutdown), 100);
			}
			installing_node_module = true;
			const version = opts.version === "*" ? "" : "@" + opts.version;
			const base = "npm i";
			console.log(
				`${
					shutdown === 3 ? "Installing" : "Re-installing"
				} node module \x1b[38;2;255;165;0m${
					opts.name
				}\x1b[0m at module \x1b[38;2;255;165;0m${path.basename(
					opts.path
				)}\x1b[0m`
			);
			exec(
				`${base} ${opts.name}${version}`,
				{
					cwd: opts.path,
				},
				(err) => {
					installing_node_module = false;
					if (err) {
						if (fs.existsSync(modulePath)) {
							fs.rmSync(modulePath, { recursive: true });
						}
						if (--shutdown) {
							waw.npmi(opts, next, shutdown);
						} else {
							console.log(
								"Probably internet is not stable, check your connection and try \x1b[38;2;255;165;0mwaw update\x1b[0m"
							);
							process.exit(1);
						}
					} else {
						if (!opts.save) {
							if (
								fs.existsSync(
									path.join(modulePath, "package.json")
								)
							) {
								fs.rmSync(
									path.join(modulePath, "package.json"),
									{ recursive: true }
								);
							}
							if (
								fs.existsSync(
									path.join(modulePath, "package-lock.json")
								)
							) {
								fs.rmSync(
									path.join(modulePath, "package-lock.json"),
									{ recursive: true }
								);
							}
						}
						next();
					}
				}
			);
		} else {
			next();
		}
	},

	install: {
		/**
		 * Installs a waw module globally into `<waw_root>/server/<name>`.
		 * If already present, just reads its module.json and adds to waw.modules.
		 *
		 * @param {string} name Module name (e.g. "sem")
		 * @param {Function} [callback] Called after module is loaded
		 * @param {string} [branch="master"] Branch to pull
		 */
		global: function (name, callback = () => {}, branch = "master") {
			const source = path.resolve(__dirname, "server", name);
			if (fs.existsSync(source)) {
				waw.modules.push(read_module(source, name));
				if (typeof callback === "function") callback();
			} else {
				console.log(
					`Installing module \x1b[38;2;255;165;0m${name}\x1b[0m`
				);
				inc();
				waw.fetch(
					source,
					waw.core_module(name),
					() => {
						waw.modules.push(read_module(source, name));
						if (typeof callback === "function") callback();
						dec();
					},
					branch
				);
			}
		},

		/**
		 * Installs multiple npm dependencies for a given folder.
		 * Expects `dependencies` in shape: { "pkg": "version" }.
		 * Uses `--no-save --no-package-lock` to avoid mutating consumer package files.
		 */
		npmi: function (source, dependencies, callback = () => {}, opts = {}) {
			if (
				typeof dependencies !== "object" ||
				!Object.keys(dependencies).length
			)
				return;
			inc(); // start
			let command = "npm i -prefix . --no-save --no-package-lock",
				install = false,
				names = "";
			waw.each(
				dependencies,
				(name, version, next) => {
					if (
						!fs.existsSync(path.join(source, "node_modules", name))
					) {
						install = true;
					}
					command +=
						" " +
						name +
						(version && version !== "*" ? "@" + version : "");
					names += (names ? ", " : "") + name;
					next();
				},
				() => {
					if (install) {
						console.log(
							`Installing node module \x1b[38;2;255;165;0m${names}\x1b[0m at module \x1b[38;2;255;165;0m${path.basename(
								source
							)}\x1b[0m`
						);
						exec(command, { cwd: source }, () => {
							callback();
							dec(); // finish
						});
					} else {
						callback();
						dec(); // finish
					}
				}
			);
		},
	},

	/**
	 * Triggers all registered callbacks for a given signal name.
	 * Used as a tiny pub/sub system.
	 */
	emit: function (signal, doc) {
		if (!signals[signal]) return;
		for (var i = 0; i < signals[signal].length; i++) {
			if (typeof signals[signal][i] === "function") {
				signals[signal][i](doc);
			}
		}
	},

	/** Registers a callback for a signal. */
	on: function (signal, callback) {
		if (!signals[signal]) signals[signal] = [];
		if (typeof callback === "function") signals[signal].push(callback);
	},

	/**
	 * Marks a signal as completed.
	 * `ready(signal, cb)` checks "done" + signal.
	 */
	done: function (signal) {
		signals["done" + signal] = true;
	},

	/**
	 * Waits until a signal is marked done, then calls callback.
	 * Polling interval: 100ms.
	 */
	ready: function (signal, callback) {
		if (signals["done" + signal]) {
			callback();
		} else {
			setTimeout(() => {
				waw.ready(signal, callback);
			}, 100);
		}
	},

	/**
	 * Calls callback for each file in all modules (optionally filtered by extension).
	 * Note: uses `waw.wait(500)` which is expected to be provided by some module (core/sem/etc.).
	 */
	each_file: async function (callback, ext) {
		await waw.wait(500);
		for (const module of waw.modules) {
			const files = waw.getFiles(module.__root);
			for (const file of files) {
				if (!ext || file.endsWith(ext)) {
					callback(file);
				}
			}
		}
	},
};

// ----- Config and bootstrapping -----

// Load config from project and merge with server.json
waw.config = waw.readJson(process.cwd() + "/config.json");
waw.uniteJson(waw.config, waw.readJson(process.cwd() + "/server.json"));

// Detect angular/react/template and add their modules to core_modules
if (fs.existsSync(process.cwd() + "/angular.json")) {
	waw.core_modules.angular = waw.core_module("angular");
}
if (fs.existsSync(process.cwd() + "/react.json")) {
	waw.core_modules.react = waw.core_module("react");
}
if (fs.existsSync(process.cwd() + "/vue.json")) {
	waw.core_modules.vue = waw.core_module("vue");
}
if (fs.existsSync(process.cwd() + "/wjst.json")) {
	waw.core_modules.wjst = waw.core_module("wjst");
	waw.core_modules.sem = waw.core_module("sem");
}

/**
 * Loads a waw module's config and dependencies from disk.
 *
 * Side effects:
 * - Renames legacy part.json → module.json (legacy migration)
 * - Installs module npm deps declared in module.json (via install.npmi)
 * - Attaches metadata:
 *   • __root  absolute module folder
 *   • __name  module name
 * - Registers into waw._modules by name
 */
const read_module = (source, name) => {
	// Remove this in 23.x.x version
	if (fs.existsSync(source + "/part.json")) {
		fs.renameSync(source + "/part.json", source + "/module.json");
	}
	if (!fs.existsSync(source + "/module.json")) {
		return {};
	}
	config = waw.readJson(source + "/module.json");
	waw.install.npmi(source, config.dependencies);
	config.__root = path.normalize(source);
	config.__name = name;
	waw._modules[config.__name] = config;
	return config;
};

// Set server root dir in config if not already set
if (
	typeof waw.config.server !== "string" &&
	fs.existsSync(process.cwd() + "/server")
) {
	waw.config.server = "server";
}

// Bootstrap modules and attach to waw.modules/_modules
const modules_root = path.join(process.cwd(), waw.config.server || "");
waw.modules = [];
waw._modules = {};

if (fs.existsSync(modules_root) && waw.isDirectory(modules_root)) {
	// Load local modules from project folder
	waw.uniteArray(
		waw.modules,
		waw.getDirectories(modules_root).filter((path) => {
			return !path.endsWith(".git") && !path.endsWith("node_modules");
		})
	);

	// Convenience accessor: waw.module("sem")
	waw.module = (name) => waw._modules[name];

	for (let i = 0; i < waw.modules.length; i++) {
		waw.modules[i] = read_module(
			waw.modules[i],
			path.basename(waw.modules[i])
		);
	}
}

// Install modules defined in config.modules (global modules)
if (waw.config.modules) {
	waw.each(waw.config.modules, (module) => waw.install.global(module));
}

// Filter out empty modules
waw.modules = waw.modules.filter((module) => Object.keys(module).length);

// If no modules found, install all from core_modules
if (!waw.modules.length) {
	waw.each(waw.core_modules, (module) => {
		// Clean up half-installed global modules (folder exists but no module.json)
		if (
			fs.existsSync(path.join(__dirname, "server", module)) &&
			!fs.existsSync(
				path.join(__dirname, "server", module, "module.json")
			)
		) {
			fs.rmSync(path.join(__dirname, "server", module), {
				recursive: true,
			});
		}
		waw.install.global(module);
	});
}

// Install global dependencies from config if any
if (waw.config.dependencies && Object.keys(waw.config.dependencies).length) {
	waw.install.npmi(process.cwd(), waw.config.dependencies, dec);
} else {
	dec();
}

// Filter again, sort modules by priority (desc)
waw.modules = waw.modules.filter((module) => Object.keys(module).length);
waw.modules.sort(function (a, b) {
	if (!a.priority) a.priority = 0;
	if (!b.priority) b.priority = 0;
	if (a.priority < b.priority) return 1;
	return -1;
});

module.exports = waw;

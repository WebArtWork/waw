const fs = require("fs");

/**
 * runner.js
 * ---------
 * Attaches CLI helper utilities to the `waw` object.
 *
 * Added members:
 * - waw.readline: readline interface (interactive prompts)
 * - waw.ensure(): parses CLI args and prepares folders for new module/component
 * - waw.read_customization(): prompts to select template/customization option
 * - waw.add_code(): simple in-place string replacement helper for codegen
 */
module.exports = function (waw) {
	// Create readline interface for CLI user input
	waw.readline = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	/**
	 * Prepares filesystem + naming context for generators.
	 *
	 * Typical usage:
	 * - Called by a module runner (CLI command) before generating files.
	 *
	 * Behaviour:
	 * - Requires at least 2 CLI args (command + name/path)
	 * - Supports repo shortcut:
	 *   • last arg endsWith ".git" → use as repo URL
	 *   • last arg like "org-repo" → assumes WebArtWork org and builds URL
	 * - Builds:
	 *   • waw.name  (lowercase leaf name)
	 *   • waw.Name  (capitalized)
	 *   • waw.path  (folder + arg path)
	 *   • waw.base  (absolute base path where code will be placed)
	 *
	 * Repo install behaviour:
	 * - If repo is provided, it clones into waw.base and exits the process.
	 *
	 * @param {string} base Absolute base path for the project generation root
	 * @param {string} folder Folder name under base (e.g. "server" or "modules")
	 * @param {string} message_exists Console message when target already exists
	 * @param {boolean} [is_component=true] If true, appends "/{name}" to waw.base
	 * @returns {boolean|string|undefined} true when repo cloning is triggered, otherwise repo value (if any)
	 */
	waw.ensure = (base, folder, message_exists, is_component = true) => {
		if (waw.argv.length < 2) {
			console.log("Provide name");
			process.exit(0);
		}

		// Repo URL resolution (explicit .git or shorthand "waw-xyz" style)
		if (waw.argv[waw.argv.length - 1].endsWith(".git")) {
			waw.repo = waw.argv.pop();
		} else if (waw.argv[waw.argv.length - 1].split("-").length === 2) {
			waw.repo = waw.argv.pop();
			if (waw.argv.length === 1) {
				waw.argv.push(waw.repo.split("-")[1]);
			}
			waw.repo = "https://github.com/WebArtWork/" + waw.repo + ".git";
		}

		// Normalize name and path arguments
		waw.name = waw.argv[waw.argv.length - 1].toLowerCase();
		if (waw.argv.length > 2) {
			waw.argv[1] = folder + "/" + waw.argv[1];
		}
		while (waw.argv.length > 2) {
			waw.argv[1] += "/" + waw.argv.splice(2, 1);
		}

		// Ensure folder root exists
		if (!fs.existsSync(base + folder)) {
			fs.mkdirSync(base + folder);
		}

		// Resolve final target path and name (supports nested paths)
		if (waw.argv[1].indexOf("/") >= 0) {
			waw.path = waw.argv[1];
			waw.name = waw.name.split("/").pop();
		} else {
			waw.path = folder + "/" + waw.argv[1];
		}

		// Absolute target base folder
		waw.base = base + waw.path;

		// Guard: do not overwrite existing folder
		if (fs.existsSync(waw.base)) {
			console.log(message_exists);
			process.exit(0);
		}

		// Repo install shortcut (clone + exit)
		if (waw.repo) {
			fs.mkdirSync(waw.base);
			waw.fetch(waw.base, waw.repo, (err) => {
				if (err) console.log("Repository was not found");
				else console.log("Code is successfully installed");
				process.exit(1);
			});
			return true;
		}

		// Component generators usually create an extra folder for the component name
		if (is_component) {
			waw.base += "/" + waw.name;
		}

		// Capitalized name helper for templates
		waw.Name = waw.name.slice(0, 1).toUpperCase() + waw.name.slice(1);
		return waw.repo;
	};

	/**
	 * Lets the user choose between multiple customization/template options.
	 *
	 * If defaults[element] has more than one key:
	 * - Print a numbered list
	 * - Ask user to select option number
	 * - Stores selected template into `waw.template`
	 *
	 * If only one option exists:
	 * - Uses defaults[element].default
	 *
	 * @param {Record<string, Record<string, string>>} defaults e.g. { page: { default: "/path" , alt:"/path2" } }
	 * @param {string} element Key in defaults to choose from
	 * @param {Function} next Callback invoked after `waw.template` is set
	 */
	waw.read_customization = (defaults, element, next) => {
		if (defaults && Object.keys(defaults[element]).length > 1) {
			waw.template = defaults[element];
			let text = "Which element you want to use?",
				counter = 0,
				repos = {};
			for (let key in defaults[element]) {
				repos[++counter] = defaults[element][key];
				text += "\n" + counter + ") " + key;
			}
			text += "\nChoose number: ";
			return waw.readline.question(text, (answer) => {
				if (!answer || !repos[parseInt(answer)]) {
					return this.read_customization(waw, element, next);
				}
				waw.template = repos[parseInt(answer)];
				next();
			});
		} else {
			waw.template = defaults[element].default;
			next();
		}
	};

	/**
	 * In-place code patch helper.
	 *
	 * Reads opts.file and replaces the first occurrence of opts.search with opts.replace.
	 * Does nothing if:
	 * - file does not exist
	 * - search string is not found
	 *
	 * @param {{ file: string, search: string, replace: string }} opts
	 */
	waw.add_code = (opts) => {
		if (!fs.existsSync(opts.file)) return;
		let code = fs.readFileSync(opts.file, "utf8");
		if (code && code.indexOf(opts.search) > -1) {
			code = code.replace(opts.search, opts.replace);
			fs.writeFileSync(opts.file, code, "utf8");
		}
	};
};

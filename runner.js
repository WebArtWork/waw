const fs = require("fs");
module.exports = function (waw) {
	waw.readline = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	waw.ensure = (base, folder, message_exists, is_component = true) => {
		if (waw.argv.length < 2) {
			console.log("Provide name");
			process.exit(0);
		}
		if (waw.argv[waw.argv.length - 1].endsWith(".git")) {
			waw.repo = waw.argv.pop();
		} else if (waw.argv[waw.argv.length - 1].split("-").length === 2) {
			waw.repo = waw.argv.pop();
			if (waw.argv.length === 1) {
				waw.argv.push(waw.repo.split("-")[1]);
			}
			waw.repo = "https://github.com/WebArtWork/" + waw.repo + ".git";
		}
		waw.name = waw.argv[waw.argv.length - 1].toLowerCase();
		if (waw.argv.length > 2) {
			waw.argv[1] = folder + "/" + waw.argv[1];
		}
		while (waw.argv.length > 2) {
			waw.argv[1] += "/" + waw.argv.splice(2, 1);
		}
		if (!fs.existsSync(base + folder)) {
			fs.mkdirSync(base + folder);
		}
		if (waw.argv[1].indexOf("/") >= 0) {
			waw.path = waw.argv[1];
			waw.name = waw.name.split("/").pop();
		} else {
			waw.path = folder + "/" + waw.argv[1];
		}
		waw.base = base + waw.path;
		if (fs.existsSync(waw.base)) {
			console.log(message_exists);
			process.exit(0);
		}
		if (waw.repo) {
			fs.mkdirSync(waw.base);
			waw.fetch(waw.base, waw.repo, (err) => {
				if (err) console.log("Repository was not found");
				else console.log("Code is successfully installed");
				process.exit(1);
			});
			return true;
		}
		if (is_component) {
			waw.base += "/" + waw.name;
		}
		waw.Name = waw.name.slice(0, 1).toUpperCase() + waw.name.slice(1);
		return waw.repo;
	};
	waw.read_customization = (defaults, element, next) => {
		// let elements = waw.getDirectories(process.cwd() + '/template/' + element);
		// for (var i = 0; i < elements.length; i++) {
		// 	defaults[element][path.basename(elements[i])] = elements[i];
		// }
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
	waw.add_code = (opts) => {
		if (!fs.existsSync(opts.file)) return;
		let code = fs.readFileSync(opts.file, "utf8");
		if (code && code.indexOf(opts.search) > -1) {
			code = code.replace(opts.search, opts.replace);
			fs.writeFileSync(opts.file, code, "utf8");
		}
	};
};

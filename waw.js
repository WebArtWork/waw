#!/usr/bin/env node

const fs = require('fs');

const path = require('path');

const { execSync, exec } = require("child_process");

const serial = function (i, arr, callback) {
	if (i >= arr.length) return callback();

	arr[i](function () {
		serial(++i, arr, callback);
	});
}

const signals = {};

let count = 1;

const inc = () => ++count;

const dec = () => {
	if (--count === 0) {
		waw.done('modules installed');
	}
};

const node_file = `module.exports.command = function(waw) {\n\t// add your Run code\n};`;

let installing_node_module = false;

const waw = {
	argv: process.argv.splice(2, process.argv.length - 2),
	waw_root: __dirname,
	project_root: process.cwd(),
	core_modules: {
		core: 'https://github.com/WebArtWork/waw-core.git'
	},
	core_orgs: {
		waw: 'https://github.com/WebArtWork/waw-NAME.git',
		itkp: 'https://github.com/IT-Kamianets/waw-NAME.git'
	},
	core_module: name => waw.core_orgs.waw.replace('NAME', name),
	isDirectory: source => fs.lstatSync(source).isDirectory(),
	getDirectories: function (source) {
		if (!fs.existsSync(source)) {
			return [];
		}

		return fs.readdirSync(source).map(name => require('path').join(source, name)).filter(this.isDirectory);
	},
	isFile: source => fs.lstatSync(source).isFile(),
	getFiles: function (source) {
		return fs.readdirSync(source).map(name => path.join(source, name)).filter(this.isFile);
	},
	getFilesRecursively: function (source, opts = {}) {
		let dirs = this.getDirectories(source);

		let files = dirs.map(dir => this.getFilesRecursively(dir)).reduce((a, b) => a.concat(b), []);

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
	readJson: function (source) {
		if (fs.existsSync(source) && this.isFile(source)) {
			try {
				return JSON.parse(fs.readFileSync(source));
			} catch (e) {
				return {};
			}
		} else return {};
	},
	writeJson: (path, json) => fs.writeFileSync(path, JSON.stringify(json)),
	uniteJson: (toObj, fromObj, replace = true) => {
		for (const each in fromObj) {
			if (replace || !toObj[each]) {
				toObj[each] = fromObj[each];
			}
		}
	},
	uniteArray: (toArray, fromArray) => {
		for (var i = 0; i < fromArray.length; i++) {
			toArray.push(fromArray[i]);
		}
	},
	fetch: (cwd, repo, callback, branch = 'master', removeGit = true) => {
		cwd = cwd.split('\\').join('/');

		fs.mkdirSync(cwd, { recursive: true });

		if (!fs.existsSync(path.join(cwd, '.git'))) {
			execSync('git init', { cwd });

			execSync('git remote add origin ' + repo, { cwd });
		}

		execSync('git fetch --all > NUL 2>&1', { cwd });

		execSync('git reset --hard origin/' + branch, { cwd });

		if (removeGit) {
			fs.rmSync(path.join(cwd, '.git'), { recursive: true });
		}

		callback();
	},
	update: (folder, repo, callback, branch = 'master') => {
		waw.fetch(folder + '/temp', repo, callback, branch, false);
	},
	parallel: (arr, callback) => {
		let counter = arr.length;

		if (counter === 0) return callback();

		for (let i = 0; i < arr.length; i++) {
			arr[i](function () {
				if (--counter === 0) callback();
			});
		}
	},
	each: function (arrOrObj, func, callback = () => { }, isSerial = false) {
		if (typeof callback == 'boolean') {
			isSerial = callback;

			callback = () => { };
		}

		if (Array.isArray(arrOrObj)) {
			let counter = arrOrObj.length;

			if (counter === 0) return callback();

			if (isSerial) {
				let serialArr = [];

				for (let i = 0; i < arrOrObj.length; i++) {
					serialArr.push(function (next) {
						func(arrOrObj[i], function () {
							if (--counter === 0) callback();
							else next();
						}, i);
					});
				}
				serial(0, serialArr, callback);
			} else {
				for (let i = 0; i < arrOrObj.length; i++) {
					func(arrOrObj[i], function () {
						if (--counter === 0) callback();
					}, i);
				}
			}
		} else if (typeof arrOrObj == 'object') {
			if (isSerial) {
				let serialArr = [];

				let arr = [];

				for (let each in arrOrObj) {
					arr.push({
						value: arrOrObj[each],
						each: each
					});
				}

				let counter = arr.length;

				for (let i = 0; i < arr.length; i++) {
					serialArr.push(function (next) {
						func(arr[i].each, arr[i].value, function () {
							if (--counter === 0) callback();
							else next();
						}, i);
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
	node_files: (source, files, isRouter = false) => {
		if (typeof files == 'object' && files.src) {
			files = [files.src];
		} else if (typeof files === 'string') {
			files = files.split(' ');
		}
		for (var i = files.length - 1; i >= 0; i--) {
			if (typeof files[i] === 'object') {
				files[i] = files[i].src;
			}
			if (!fs.existsSync(source + '/' + files[i])) {
				let code = node_file;

				if (isRouter) {
					code = code.replace('.command', '').replace('Run', 'Router');
				}

				fs.writeFileSync(path.resolve(source, files[i]), code, 'utf8');
			}
			files[i] = require(path.resolve(source, files[i]));
		}
		return files;
	},
	npmi: function (opts, next = () => { }, shutdown = 3) {
		opts.name = opts.name.split('@')[0];
		const modulePath = path.resolve(
			opts.path,
			'node_modules',
			opts.name
		);
		if (!fs.existsSync(modulePath)) {
			if (installing_node_module) {
				return setTimeout(() => waw.npmi(opts, next, shutdown), 100);
			}
			installing_node_module = true;
			const version = opts.version === '*' ? '' : '@' + opts.version;
			const base = 'npm i';
			console.log(`${shutdown === 3 ? 'Installing' : 'Re-installing'} node module \x1b[38;2;255;165;0m${opts.name}\x1b[0m at module \x1b[38;2;255;165;0m${path.basename(opts.path)}\x1b[0m`);
			exec(`${base} ${opts.name}${version}`, {
				cwd: opts.path
			}, (err) => {
				installing_node_module = false;

				if (err) {
					if (fs.existsSync(modulePath)) {
						fs.rmSync(modulePath, { recursive: true });
					}

					if (--shutdown) {
						waw.npmi(opts, next, shutdown);
					} else {
						console.log('Probably internet is not stable, check your connection and try \x1b[38;2;255;165;0mwaw update\x1b[0m');

						process.exit(1);
					}
				} else {
					if (!opts.save) {
						if (fs.existsSync(path.join(modulePath, 'package.json'))) {
							fs.rmSync(path.join(modulePath, 'package.json'), { recursive: true });
						}

						if (fs.existsSync(path.join(modulePath, 'package-lock.json'))) {
							fs.rmSync(path.join(modulePath, 'package-lock.json'), { recursive: true });
						}
					}

					next();
				}
			});
		} else {
			next();
		}
	},
	install: {
		global: function (name, callback = () => { }, branch = 'master') {
			const source = path.resolve(__dirname, 'server', name);

			if (fs.existsSync(source)) {
				waw.modules.push(read_module(source, name));

				if (typeof callback === 'function') callback();
			} else {
				console.log(`Installing module \x1b[38;2;255;165;0m${name}\x1b[0m`);

				inc();

				waw.fetch(source, waw.core_module(name), () => {
					waw.modules.push(read_module(source, name));

					if (typeof callback === 'function') callback();

					dec();
				}, branch);
			}
		},
		npmi: function (source, dependencies, callback = () => { }, opts = {}) {
			if (typeof dependencies !== 'object' || !Object.keys(dependencies).length) return;

			inc(); // start

			let command = 'npm i -prefix . --no-save --no-package-lock', install = false, names = '';

			waw.each(dependencies, (name, version, next) => {
				if (!fs.existsSync(path.join(source, 'node_modules', name))) {
					install = true;
				}

				command += ' ' + name + (version && version !== '*' ? '@' + version : '');

				names += (names ? ', ' : '') + name;

				next();
			}, () => {
				if (install) {
					console.log(`Installing node module \x1b[38;2;255;165;0m${names}\x1b[0m at module \x1b[38;2;255;165;0m${path.basename(source)}\x1b[0m`);

					exec(command, { cwd: source }, () => {
						callback();

						dec(); // finish
					});
				} else {
					callback();

					dec(); // finish
				}
			});
		}
	},
	emit: function (signal, doc) {
		if (!signals[signal]) return;

		for (var i = 0; i < signals[signal].length; i++) {
			if (typeof signals[signal][i] === 'function') {
				signals[signal][i](doc);
			}
		}
	},
	on: function (signal, callback) {
		if (!signals[signal]) signals[signal] = [];

		if (typeof callback === 'function') signals[signal].push(callback);
	},
	done: function (signal) {
		signals['done' + signal] = true;
	},
	ready: function (signal, callback) {
		if (signals['done' + signal]) {
			callback();
		} else {
			setTimeout(() => {
				waw.ready(signal, callback);
			}, 100);
		}
	},
	each_file: async function (callback, ext) {
		await waw.wait(500);
		for (const module of waw.modules) {
			const files = waw.getFiles(module.__root);
			for (const file of files) {
				if (
					!ext ||
					file.endsWith(ext)
				) {
					callback(file);
				}
			}
		}
	}
}

waw.config = waw.readJson(process.cwd() + '/config.json');

waw.uniteJson(waw.config, waw.readJson(process.cwd() + '/server.json'));

if (fs.existsSync(process.cwd() + '/angular.json')) {
	waw.core_modules.angular = waw.core_module('angular');
}

if (fs.existsSync(process.cwd() + '/react.json')) {
	waw.core_modules.react = waw.core_module('react');
}

if (fs.existsSync(process.cwd() + '/template.json')) {
	waw.core_modules.template = waw.core_module('template');

	waw.core_modules.sem = waw.core_module('sem');
}

const read_module = (source, name) => {
	// remove this in 23.x.x version
	if (fs.existsSync(source + '/part.json')) {
		fs.renameSync(source + '/part.json', source + '/module.json');
	}

	if (!fs.existsSync(source + '/module.json')) {
		return {};
	}

	config = waw.readJson(source + '/module.json');

	waw.install.npmi(source, config.dependencies);

	config.__root = path.normalize(source);

	config.__name = name;

	waw._modules[config.__name] = config;

	return config;
}

if (typeof waw.config.server !== 'string' && fs.existsSync(process.cwd() + '/server')) {
	waw.config.server = 'server';
}

const modules_root = path.join(process.cwd(), waw.config.server);

waw.modules = [];

waw._modules = {};


if (fs.existsSync(modules_root) && waw.isDirectory(modules_root)) {
	waw.uniteArray(waw.modules, waw.getDirectories(modules_root).filter(path => {
		return !path.endsWith('.git') && !path.endsWith('node_modules')
	}));

	waw.module = name => waw._modules[name];

	for (let i = 0; i < waw.modules.length; i++) {
		waw.modules[i] = read_module(waw.modules[i], path.basename(waw.modules[i]));
	}
}

if (waw.config.modules) {
	waw.each(waw.config.modules, module => waw.install.global(module));
}

waw.modules = waw.modules.filter(module => Object.keys(module).length);

if (!waw.modules.length) {
	waw.each(waw.core_modules, module => {
		if (
			fs.existsSync(path.join(__dirname, 'server', module)) &&
			!fs.existsSync(path.join(__dirname, 'server', module, 'module.json'))
		) {
			fs.rmSync(path.join(__dirname, 'server', module), {
				recursive: true
			});
		}
		waw.install.global(module);
	});
}

if (waw.config.dependencies && Object.keys(waw.config.dependencies).length) {
	waw.install.npmi(process.cwd(), waw.config.dependencies, dec);
} else {
	dec();
}

waw.modules = waw.modules.filter(module => Object.keys(module).length);

waw.modules.sort(function (a, b) {
	if (!a.priority) a.priority = 0;

	if (!b.priority) b.priority = 0;

	if (a.priority < b.priority) return 1;

	return -1;
});

module.exports = waw;

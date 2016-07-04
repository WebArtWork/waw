var minifier = require('js-minify');
var fs = require('fs');
module.exports = function(config) {
	// Configuration
	var app = config.app;
	var pages = config.pages;
	var production = config.production;
	var root = config.root;
	// Structure
	var structureViews = function(fields, html, view, activeHtml) {
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].layout) {
				html.states.push({
					name: rms(fields[i].name),
					state: view + rms(fields[i].name),
					templateUrl: 'gen'
				});
				var newHtml = {
					text: '',
					name: rms(fields[i].name)
				};
				html.structures.push(newHtml);
				checkStructureObject(fields[i], html, rms(fields[i].name) + ".", newHtml);
			} else {
				html.states.push({
					name: rms(fields[i].name),
					state: view + rms(fields[i].name),
					controller: true,
					url: true,
					templateUrl: 'html'
				});
				createFile(__dirname + '/template/empty.html', root + '/client/' + rms(html.name) + '/html/' + rms(fields[i].name) + '.html', {});

			}

			html.ctrl.push(rms(fields[i].name));
		}
		activeHtml.text += '<div ui-view class="box"></div>';
	};
	var checkStructureObject = function(structure, html, view, activeHtml) {
		if (structure.layout == 'Rows') {
			structureRows(structure.fields, html, view, activeHtml);
		} else if (structure.layout == "Columns") {
			structureColumns(structure.fields, html, view, activeHtml);
		} else if (structure.layout == "Views") {
			structureViews(structure.fields, html, view, activeHtml);
		}
	};
	var structureRows = function(fields, html, view, activeHtml) {
		if (fields[0].height) activeHtml.text += '<div class="row" style="height:' + fields[0].height + '"><div class="row-in">';
		else activeHtml.text += '<div class="row"><div class="row-in">';
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].file) {
				var text = structureFile(html, fields[i].file);
				activeHtml.text += text;
			} else if (fields[i].layout) checkStructureObject(fields[i], html, view, activeHtml);
			if (i == fields.length - 1) activeHtml.text += "</div></div>"
			else {
				if (fields[i + 1].height) activeHtml.text += '</div></div><div class="row" style="height:' + fields[i + 1].height + '"><div class="row-in">'
				else activeHtml.text += '</div></div><div class="row"><div class="row-in">'
			}
		}
	};
	var structureColumns = function(fields, html, view, activeHtml) {
		if (fields[0].width) activeHtml.text += '<div class="col" style="width:' + fields[0].width + '"><div class="col-in">';
		else activeHtml.text += '<div class="col"><div class="col-in">';
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].file) {
				var text = structureFile(html, fields[i].file);
				activeHtml.text += text;
			} else if (fields[i].layout) checkStructureObject(fields[i], html, view, activeHtml);
			if (i == fields.length - 1) activeHtml.text += "</div></div>"
			else {
				if (fields[i + 1].width) activeHtml.text += '</div></div><div class="col" style="width:' + fields[i + 1].width + '"><div class="col-in">'
				else activeHtml.text += '</div></div><div class="col"><div class="col-in">'
			}
		}
	};
	var structureFile = function(html, file) {
		file = rms(file);
		html.ctrl.push(file);
		createFile(__dirname + '/template/empty.html', root + '/client/' + rms(html.name) + '/html/' + file + '.html', {});
		return parse('<ng-include class="box" src="%s/%s/html/%s.html%s" ng-controller="%s"></ng-include>', "'", rms(html.name), file, "'", file);
	};
	var createStates = function(dest, states, name) {
		fs.readFile(dest, 'utf8', function(err, data) {
			var fields = getContentBetween(data, '/*States*/', '/*Custom States*/');
			for (var i = states.length - 1; i >= 0; i--) {
				fields += attachFieldToState(fields, states[i], data, name);
			}
			if (fields[fields.length - 1] == ')') fields += '\r\n\t';
			var newData = setContentBetween(data, '/*States*/', '/*Custom States*/', fields);
			fs.writeFile(dest, newData);
		});
	};
	var createControllers = function(dest, structure) {
		fs.readFile(dest, 'utf8', function(err, data) {
			var fields = getContentBetween(data, '/*Controllers*/', '/*Custom Controllers*/');
			for (var i = structure.length - 1; i >= 0; i--) {
				fields += attachFieldToController(fields, rms(structure[i]), data);
			}
			if (fields[2] != '/') fields = fields.replace('\r\n', '');
			if (fields[fields.length - 1] == ';') fields += '\r\n';
			var newData = setContentBetween(data, '/*Controllers*/', '/*Custom Controllers*/', fields);
			fs.writeFile(dest, newData);
		});
	};
	var structureInitialize = function(page) {
		var structureObj = {
			name: rms(page.name),
			ctrl: [],
			states: [],
			structures: [{
				text: '',
				name: 'structure'
			}]
		};
		checkStructureObject(page.structure, structureObj, '', structureObj.structures[0]); // huge proccess
		createControllers(root + '/client/' + rms(page.name) + '/js/controllers.js', structureObj.ctrl);
		createStates(root + '/client/' + rms(page.name) + '/js/initialize.js', structureObj.states, rms(page.name));
		for (var i = 0; i < structureObj.structures.length; i++) {
			createFileFromData(structureObj.structures[i].text, root + '/client/' + rms(page.name) + '/gen/' + structureObj.structures[i].name + '.html');
		}
	}
	var buildPage = function(page) {
		createFolder(root + '/client/' + rms(page.name));
		createFolder(root + '/client/scss/' + rms(page.name));
		createFolder(root + '/client/scss/' + rms(page.name) + '/css');
		createScssFromTemplate(page);
		var counter = page.folders.length;
		for (var i = 0; i < page.folders.length; i++) {
			createFolder(root + '/client/' + rms(page.name) + '/' + page.folders[i]);
			createFilesFromTemplate(root + '/client/' + rms(page.name) + '/' + page.folders[i], page.folders[i], page.template, page, function() {
				if (--counter === 0) structureInitialize(page);
			});
		}
		minifier({
			files: getFilesOfComponents(page.components),
			productionFiles: addProductionFiles(page.jsfiles, getFilesOfComponents(page.components)),
			way: root + '/client/' + rms(page.name) + '/js/',
			prefix: page.prefix,
			production: production
		});
		app.get('/' + rms(page.name) + '/:folder/:file', page.ensure, function(req, res) {
			for (var i = 0; i < page.folders.length; i++) {
				if (page.folders[i] == req.params.folder) return res.sendFile(root + '/client/' + rms(page.name) + '/' + req.params.folder + '/' + req.params.file.replace('.map', ''));
			}
			if (production) res.sendFile(root + '/client/' + rms(page.name) + '/html/indexProduction.html');
			else res.sendFile(root + '/client/' + rms(page.name) + '/html/index.html');
		});
		if (page.isRoot) {
			app.get('/', page.ensure, function(req, res) {
				if (production) res.sendFile(root + '/client/' + rms(page.name) + '/html/indexProduction.html');
				else res.sendFile(root + '/client/' + rms(page.name) + '/html/index.html');
			});
			app.get('/*', page.ensure, function(req, res) {
				if (production) res.sendFile(root + '/client/' + rms(page.name) + '/html/indexProduction.html');
				else res.sendFile(root + '/client/' + rms(page.name) + '/html/index.html');
			});
		} else {
			app.get('/' + rms(page.name) + '/*', page.ensure, function(req, res) {
				if (production) res.sendFile(root + '/client/' + rms(page.name) + '/html/indexProduction.html');
				else res.sendFile(root + '/client/' + rms(page.name) + '/html/index.html');
			});
			app.get('/' + rms(page.name), page.ensure, function(req, res) {
				if (production) res.sendFile(root + '/client/' + rms(page.name) + '/html/indexProduction.html');
				else res.sendFile(root + '/client/' + rms(page.name) + '/html/index.html');
			});
		}
	};
	// Support Functionalities
	var rms = function(name) {
		return name && name.replace(/ /g, '') || '';
	}
	var getFilesOfComponents = function(files) {
		var needFiles = [];
		for (var i = 0; i < files.length; i++) {
			if (files[i].toLowerCase() == 'angular') needFiles.push(__dirname + '/plugins/angular.js');
			else if (files[i].toLowerCase() == 'router') needFiles.push(__dirname + '/plugins/angular-ui-router.js');
			else if (files[i].toLowerCase() == 'translate') needFiles.push(__dirname + '/plugins/angular-translate.js');
			else if (files[i].toLowerCase() == 'fabricfilters') needFiles.push(__dirname + '/plugins/fabric.js');
			else if (files[i].toLowerCase() == 'colorpicker'){
				needFiles.push(__dirname + '/plugins/angularjs-color-picker.js');
				needFiles.push(__dirname + '/plugins/tinycolor.js');
			}
		}
		return needFiles;
	};
	var createFolder = function(folder) {
		if (!fs.existsSync(folder)) fs.mkdir(folder);
	};
	var createFilesFromTemplate = function(dest, folder, template, page, callback) {
		if (fs.existsSync(__dirname + '/template/' + template + '/' + folder))
			fs.readdir(__dirname + '/template/' + template + '/' + folder, function(err, files) {
				var counter = files.length;
				for (var i = 0; i < files.length; i++) {
					createFile(__dirname + '/template/' + template + '/' + folder + '/' + files[i], dest + '/' + files[i], page, function() {
						if (--counter === 0 && callback) callback();
					});
				}
			});
	};
	var createScssFromTemplate = function(page) {
		if (fs.existsSync(__dirname + '/template/' + page.template + '/scss'))
			fs.readdir(__dirname + '/template/' + page.template + '/scss', function(err, files) {
				for (var i = 0; i < files.length; i++) {
					createFile(__dirname + '/template/' + page.template + '/scss/' + files[i], root + '/client/scss/' + rms(page.name) + '/css/' + files[i], page);
				}
			});
	};
	var createFileFromData = function(data, dest, callback) {
		fs.writeFile(dest, data, function(err) {
			if (callback) callback();
		});
	};
	var createFile = function(src, dest, page, callback) {
		if (!fs.existsSync(dest)) {
			fs.readFile(src, 'utf8', function(err, data) {
				data = data.replace(/PAGENAME/g, rms(page.name));
				fs.writeFile(dest, data, function(err) {
					if (callback) callback();
				});
			});
		} else if (callback) callback();
	};
	var attachFieldToState = function(fields, state, data, name) {
		var allFields = fields.split("/*State#");
		for (var i = 0; i < allFields.length; i++) {
			if (allFields[i].split('#')[0] == JSON.stringify(state)) return '';
		}
		var data = ".state('STATEFIELD', {";
		if (state.url) data += '\r\n\t\t\turl: "/STATENAME",';
		if (state.controller) data += '\r\n\t\t\tcontroller: "STATENAME",';
		if (state.templateUrl) data += '\r\n\t\t\ttemplateUrl: "/' + name + '/' + state.templateUrl + '/STATENAME.html",';
		data += "\r\n\t\t})";
		data = data.replace(/STATENAME/g, rms(state.name));
		data = data.replace(/STATEFIELD/g, state.state);
		return '\r\n\t\t/*State#' + JSON.stringify(state) + '#*/\r\n\t\t' + data;
	};
	var attachFieldToController = function(fields, name, data) {
		var allFields = fields.split("/*Controller#");
		0
		for (var i = 0; i < allFields.length; i++) {
			if (allFields[i].split('#')[0] == name) return '';
		}
		var data = fs.readFileSync(__dirname + '/template/newController.js', 'utf8')
		data = data.replace(/CONTROLLERNAME/g, name);
		return '\r\n/*Controller#' + name + '#*/\r\n' + data;
	};
	// fix for production
	var addProductionFiles = function(jsfiles, files) {
		return files;
	};
	var getContentBetween = function(data, from, to) {
		return data.split(from)[1].split(to)[0];
	};
	var setContentBetween = function(data, from, to, replace) {
		var newData = data.split(from)[0] + from + replace + to + data.split(from)[1].split(to)[1];
		return newData.replace('\r\n\t\r\n', '\r\n');
	};

	function parse(str) {
		var args = [].slice.call(arguments, 1),
			i = 0;

		return str.replace(/%s/g, function() {
			return args[i++];
		});
	}
	// end of file
	// Initialize
	createFolder(root + '/client');
	createFolder(root + '/client/scss');
	app.use(require('node-sass-middleware')({
		src: root + '/client/scss',
		dest: root + '/client',
		debug: !production,
		outputStyle: 'compressed',
		force: !production
	}));
	for (var i = 0; i < pages.length; i++) buildPage(pages[i]);
	if (config.icon && fs.existsSync(config.icon)) {
		var favicon = require('serve-favicon');
		app.use(favicon(config.icon));
	}
	// End of
};
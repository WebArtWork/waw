var fs = require('fs');
var gu = require('wawgu');
var minifier = require('js-minify');
var config;


var locks=[];
var createSchema = function(schema, callback){
	for (var i = locks.length - 1; i >= 0; i--) {
		if(locks[i]==schema.name){
			setTimeout(function(){
				createSchema(schema, callback);
			},1000);
			return;
		}
	}
	locks.push(schema.name);
	var counter = 1;
	var src = config.server+'/databases/'+schema.name+'.js';
	gu.createFile(__dirname+'/../server/schema.js', src, {
		NAMEOFSCHEMAC: schema.name
	}, function(){
		setSchemaFields(src, schema, function(){
			if(--counter===0){
				for (var i = 0; i < locks.length; i++) {
					if(locks[i]==schema.name){
						locks.splice(i,1);
						break;
					}
				}
				callback(schema);
			}
		});
	});
	gu.createFile(__dirname+'/../server/schemaService.js', config.server+'/'+gu.ulfirst(schema.name)+'.js',{
		NAMEOFSCHEMAC: schema.name,
		NAMEOFSCHEMA: gu.ulfirst(schema.name)
	}, function(){
		/*setServiceFields(schema, function(){
			if(--counter===0) for (var i = 0; i < locks.length; i++) {
				if(locks[i]==schema.name){
					locks.splice(i,1);
					break;
				}
			}
		});*/
	});
}
module.exports.setConfig=function(conf){
	config = conf;
};
module.exports.createSchema=createSchema;

var setSchemaFields = function(src, schema, callback){
	fs.readFile(src, 'utf8', function(err, data) {
		var fields = gu.getContentBetween(data, '/*Fields*/', '/*Custom Fields*/');
		var fieldsLength = fields.length;
		var counter = schema.fields.length;
		for (var i = schema.fields.length - 1; i >= 0; i--) {
			fields += attachFieldToSchema(fields, schema.fields[i]);
		}
		if(fields.length==fieldsLength){
			callback();
			return;
		}
		var newData = gu.setContentBetween(data, '/*Fields*/', '\r\n\t/*Custom Fields*/', fields);
		fs.writeFile(config.server + '/databases/' + schema.name + '.js', newData, function(err) {
			if (--counter === 0) callback();
		});
	});
}
var attachFieldToSchema = function(fields, field, callback){
	var allFields = fields.split("/*Field");
	for (var i = 0; i < allFields.length; i++) {
		if(allFields[i].split('#')[1]==JSON.stringify(field)) return '';
	}
	var arr='',arrEnd='';
	if(field.array){
		arr='[';
		arrEnd=']';
	}
	if(field.link){
		var fieldText = field.name+': '+arr+'{type: mongoose.Schema.Types.ObjectId, ref: "'+field.link+'"';
		if(field.unique) fieldText += ', unique: true';
		fieldText += '}'+arrEnd+',';
	}else if(field.object||field.field=='Object'||field.field=='ArrayObject'){
		var fieldText = attachFieldObject(field);
	}else{
		var fieldText = field.name+': '+arr+'{type: '+field.field;	
		if(field.enum) fieldText += ', enum: '+field.enum;
		if(field.trim) fieldText += ', trim: true';
		if(field.sparse) fieldText += ', sparse: true';
		if(field.default) fieldText += ', default: '+field.default;
		if(field.unique) fieldText += ', unique: true';
		fieldText += '}'+arrEnd+',';
	}
	return '\r\n\t\t/*Field#'+JSON.stringify(field)+'#*/\r\n\t\t'+fieldText;
}
var attachFieldObject = function(field){
	var fieldText = field.name+': {';
	for (var i = 0; i < field.fields.length; i++) {
		fieldText += '\r\n\t\t\t'+field.fields[i].name + ': {type: ' + field.fields[i].field;
		if (field.fields[i].unique) fieldText += ', unique: true';
		if (field.fields[i].trim) fieldText += ', trim: true';
		if (field.fields[i].sparse) fieldText += ', sparse: true';
		if (field.fields[i].enum) fieldText += ', enum: '+field.fields[i].enum;
		if (field.fields[i].default) fieldText += ', default: '+field.fields[i].default;
		if (i + 1 == field.fields.length) fieldText += '}\r\n\t\t},';
		else fieldText += '},';
	}
	return fieldText;
}



var structureInitialize = function(page) {
	var structureObj = {
		name: gu.rms(page.name),
		ctrl: [],
		states: [],
		structures: [{
			text: '',
			name: 'structure'
		}]
	};
	checkStructureObject(page.structure, structureObj, '', structureObj.structures[0]); // huge proccess
	
	createControllers(config.root + '/client/' + gu.rms(page.name) + '/js/controllers.js', structureObj.ctrl);
	
	createStates(config.root + '/client/' + gu.rms(page.name) + '/gen/initialize.js', structureObj.states, gu.rms(page.name), page.injections);
	
	for (var i = 0; i < structureObj.structures.length; i++) {
		gu.createFileFromData(structureObj.structures[i].text, config.root + '/client/' + gu.rms(page.name) + '/gen/' + structureObj.structures[i].name + '.html');
	}
	
}
var checkStructureObject = function(structure, html, view, activeHtml) {
	if (structure.layout == 'Rows') {
		structureRows(structure.fields, html, view, activeHtml, structure.scroll);
	} else if (structure.layout == "Columns") {
		structureColumns(structure.fields, html, view, activeHtml, structure.scroll);
	} else if (structure.layout == "Views") {
		structureViews(structure.fields, html, view, activeHtml, structure.scroll);
	}
};
var structureViews = function(fields, html, view, activeHtml, scroll) {
	for (var i = 0; i < fields.length; i++) {
		var state = {
			name: gu.rms(fields[i].file||fields[i].name),
			state: view + gu.rms(fields[i].file||fields[i].name)
		}
		if (fields[i].page) state.url = fields[i].page.url;
		if (fields[i].layout) {
			if (fields[i].page){
				html.ctrl.push(gu.rms(fields[i].name));
				state.controller = true;
			}
			state.templateUrl = 'gen';
			html.states.push(state);
			var newHtml = {
				text: '',
				name: gu.rms(fields[i].name)
			};
			html.structures.push(newHtml);
			checkStructureObject(fields[i], html, gu.rms(fields[i].name) + ".", newHtml);
		} else {
			html.ctrl.push(gu.rms(fields[i].file||fields[i].name));
			state.controller = true;
			state.templateUrl = 'html';
			html.states.push(state);
			gu.createFileFromData('', config.root + '/client/' + gu.rms(html.name) + '/html/' + gu.rms(fields[i].file||fields[i].name) + '.html');
		}
	}
	activeHtml.text += '<div ui-view class="box"></div>';
};
var structureRows = function(fields, html, view, activeHtml) {
	if (fields[0].height) activeHtml.text += '<div class="row" style="height:' + fields[0].height + '"><div class="row-in">';
	else activeHtml.text += '<div class="row"><div class="row-in">';

	for (var i = 0; i < fields.length; i++) {

		//if()
		if (fields[i].file) {
			var text = structureFile(html, fields[i].file, fields[i].scroll);
			activeHtml.text += text;
		}else if (fields[i].layout) checkStructureObject(fields[i], html, view, activeHtml);



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
			var text = structureFile(html, fields[i].file, fields[i].scroll);
			activeHtml.text += text;
		} else if (fields[i].layout) checkStructureObject(fields[i], html, view, activeHtml);
		if (i == fields.length - 1) activeHtml.text += "</div></div>"
		else {
			if (fields[i + 1].width) activeHtml.text += '</div></div><div class="col" style="width:' + fields[i + 1].width + '"><div class="col-in">'
			else activeHtml.text += '</div></div><div class="col"><div class="col-in">'
		}
	}
};
var structureFile = function(html, file, scroll) {
	file = gu.rms(file);
	html.ctrl.push(file);
	gu.createFileFromData('', config.root + '/client/' + gu.rms(html.name) + '/html/' + file + '.html');
	if(scroll) return parse('<ng-include class="scrollInside" src="%s/%s/html/%s.html%s" ng-controller="%s"></ng-include>', "'", gu.rms(html.name), file, "'", file);
	else return parse('<ng-include class="box" src="%s/%s/html/%s.html%s" ng-controller="%s"></ng-include>', "'", gu.rms(html.name), file, "'", file);
};

var createStates = function(dest, states, name, injections) {
	fs.readFile(dest, 'utf8', function(err, data) {
		var fields = gu.getContentBetween(data, '/*States*/', '/*Custom States*/');
		for (var i = states.length - 1; i >= 0; i--) {
			fields += attachFieldToState(fields, states[i], data, name);
		}
		if (fields[fields.length - 1] == ')') fields += '\r\n\t';
		var newData = gu.setContentBetween(data, '/*States*/', '/*Custom States*/', fields);


		var injectionsText = '';
		for (var i = 0; i < injections.length; i++) {
			if(i==0) injectionsText+="'"+injections[i]+"'";
			else injectionsText+=",'"+injections[i]+"'";
		}
		newData = gu.setContentBetween(newData, '/*Injections*/', '/*End Injections*/', injectionsText);
		fs.writeFile(dest, newData);
	});
};
// Controllers Generation
	var createControllers = function(dest, structure) {
		fs.readFile(dest, 'utf8', function(err, data) {
			var fields = gu.getContentBetween(data, '/*Controllers*/', '/*Custom Controllers*/');
			for (var i = structure.length - 1; i >= 0; i--) {
				fields += attachFieldToController(fields, gu.rms(structure[i]), data);
			}
			if (fields[fields.length - 1] == ';') fields += '\r\n';
			var newData = gu.setContentBetween(data, '/*Controllers*/', '/*Custom Controllers*/', fields);
			fs.writeFile(dest, newData);
		});
	};
	var attachFieldToController = function(fields, name, data) {
		var allFields = fields.split("/*Controller#");
		for (var i = 0; i < allFields.length; i++) {
			if (allFields[i].split('#')[0] == name) return '';
		}
		var data = fs.readFileSync(__dirname + '/../client/newController.js', 'utf8')
		data = data.replace(/CONTROLLERNAME/g, name);
		return '\r\n/*Controller#' + name + '#*/\r\n' + data;
	};
// Export
// Export
module.exports.buildPage = function(page) {
	gu.createFolder(config.root + '/client/' + gu.rms(page.name));
	gu.createFolder(config.root + '/client/scss/' + gu.rms(page.name));
	gu.createFolder(config.root + '/client/scss/' + gu.rms(page.name) + '/css');
	createScssFromTemplate(page);
	var counter = page.folders.length;
	for (var i = 0; i < page.folders.length; i++) {
		gu.createFolder(config.root + '/client/' + gu.rms(page.name) + '/' + page.folders[i]);
		createFilesFromTemplate(config.root + '/client/' + gu.rms(page.name) + '/' + page.folders[i], page.folders[i], page, function() {
			if (--counter === 0) structureInitialize(page);
		});
	}
	minifier({
		files: getFilesOfComponents(page.components),
		productionFiles: addProductionFiles(page.jsfiles, getFilesOfComponents(page.components)),
		way: config.root + '/client/' + gu.rms(page.name) + '/gen/',
		prefix: page.prefix,
		production: config.production
	});
	config.app.get('/' + gu.rms(page.name) + '/:folder/:file', page.ensure, function(req, res) {
		for (var i = 0; i < page.folders.length; i++) {
			if (page.folders[i] == req.params.folder) return res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/' + req.params.folder + '/' + req.params.file.replace('.map', ''));
		}
		if (config.production) res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/indexProduction.html');
		else res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/index.html');
	});
	if (page.isRoot) { // make this last
		config.app.get('/', page.ensure, function(req, res) {
			if (config.production) res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/indexProduction.html');
			else res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/index.html');
		});
		config.app.get('/*', page.ensure, function(req, res) {
			if (config.production) res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/indexProduction.html');
			else res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/index.html');
		});
	} else {
		config.app.get('/' + gu.rms(page.name) + '/*', page.ensure, function(req, res) {
			if (config.production) res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/indexProduction.html');
			else res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/index.html');
		});
		config.app.get('/' + gu.rms(page.name), page.ensure, function(req, res) {
			if (config.production) res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/indexProduction.html');
			else res.sendFile(config.root + '/client/' + gu.rms(page.name) + '/html/index.html');
		});
	}
};
// Support Functionalities
var getFilesOfComponents = function(files) {
	var needFiles = [];
	for (var i = 0; i < files.length; i++) {
		if (files[i].toLowerCase() == 'angular') needFiles.push(__dirname + '/../components/angular.js');
		else if (files[i].toLowerCase() == 'router') needFiles.push(__dirname + '/../components/angular-ui-router.js');
		else if (files[i].toLowerCase() == 'translate') needFiles.push(__dirname + '/../components/angular-translate.js');
		else if (files[i].toLowerCase() == 'fabricfilters') needFiles.push(__dirname + '/../components/fabric.js');
		else if (files[i].toLowerCase() == 'tree') needFiles.push(__dirname + '/../components/angular-ui-tree.js');
		else if (files[i].toLowerCase() == 'colorpicker'){
			needFiles.push(__dirname + '/../components/angularjs-color-picker.js');
			needFiles.push(__dirname + '/../components/tinycolor.js');
		}else if (files[i].toLowerCase() == 'ace'){
			needFiles.push(__dirname + '/../components/ace/ace.js');
			needFiles.push(__dirname + '/../components/ace/theme-twilight.js');
			needFiles.push(__dirname + '/../components/ui-ace.js');
		}
	}
	return needFiles;
};
var createFilesFromTemplate = function(dest, folder, page, callback) {
	if (fs.existsSync(__dirname + '/../client/' + folder)) fs.readdir(__dirname + '/../client/' + folder, function(err, files) {
		var counter = files.length;
		for (var i = 0; i < files.length; i++) {
			gu.createFile(__dirname + '/../client/' + folder + '/' + files[i], dest + '/' + files[i], page, function() {
				if (--counter === 0 && callback) callback();
			});
		}
	});
};
var createScssFromTemplate = function(page) {
	if (fs.existsSync(__dirname + '/../client/scss'))
		fs.readdir(__dirname + '/../client/scss', function(err, files) {
			for (var i = 0; i < files.length; i++) {
				gu.createFile(__dirname + '/../client/scss/' + files[i], config.root + '/client/scss/' + gu.rms(page.name) + '/css/' + files[i], page);
			}
		});
};
var attachFieldToState = function(fields, state, data, name) {
	var allFields = fields.split("/*State#");
	for (var i = 0; i < allFields.length; i++) {
		if (allFields[i].split('#')[0] == JSON.stringify(state)) return '';
	}

	var data = ".state('STATEFIELD', {";
	if (typeof state.url == 'string') data += '\r\n\t\t\turl: "/'+state.url+'",';
	if (state.controller) data += '\r\n\t\t\tcontroller: "STATENAME",';
	if (state.templateUrl) data += '\r\n\t\t\ttemplateUrl: "/' + name + '/' + state.templateUrl + '/STATENAME.html",';
	data += "\r\n\t\t})";
	data = data.replace(/STATENAME/g, gu.rms(state.name));
	data = data.replace(/STATEFIELD/g, state.state);
	return '\r\n\t\t/*State#' + JSON.stringify(state) + '#*/\r\n\t\t' + data;
};
// fix for production
var addProductionFiles = function(jsfiles, files) {
	return files;
};
function parse(str) {
	var args = [].slice.call(arguments, 1),
		i = 0;

	return str.replace(/%s/g, function() {
		return args[i++];
	});
}


// var setServiceFields = function(schema,callback){
// 	fs.readFile(src, 'utf8', function(err, data) {
// 		var fields = gu.getContentBetween(data, '/*Fields*/', '/*Custom Fields*/');
// 		var counter = schema.fields.length;
// 		for (var i = schema.fields.length - 1; i >= 0; i--) {
// 			fields+=attachFieldToSchema(fields, schema.fields[i]);
// 		}
// 		var newData = gu.setContentBetween(data, '/*Fields*/', '/*Custom Fields*/', fields);
// 		fs.writeFile(config.server+'/databases/'+schema.name+'.js', newData, function(err) {
// 			if(--counter===0){
// 				for (var i = 0; i < locks.length; i++) {
// 					if(locks[i]==schema.name){
// 						locks.splice(i,1);
// 						break;
// 					}
// 				}
// 			}
// 		});
// 	});
// }
// var attachFieldToService = function(fields, field, callback){
// 	var allFields = fields.split("/*Field");
// 	for (var i = 0; i < allFields.length; i++) {
// 		if(allFields[i].split('#')[1]==JSON.parse(field)) return '';
// 	}
// var arr = '',
// 	arrEnd = '';
// if (field.field == 'Array') {
// 	arr = '[';
// 	arrEnd = ']';
// }
// 	if(field.link){
// 		var fieldText = field.name+': '+arr+'{type: mongoose.Schema.Types.ObjectId, red: "'+field.link+'"';
// 		if(field.unique) fieldText += ', unique: true';
// 		fieldText += '}'+arrEnd;
// 	}else if(field.field=='Object'){
// 		var fieldText = '{\r\n\t\t\t';
// 		for (var i = 0; i < field.fields.length; i++) {
// 			if (field.fields[i].field == 'Array') arr = true;
// 			else arr = false;
// 			fieldText = field.fields[i].name+': {type: '+field.fields[i].field;	
// 			if(field.fields[i].unique) fieldText += ', unique: true';
// 			if(i+1 == field.fields.length) fieldText += '}\r\n\t\t}';
// 			else fieldText += '}\r\n\t\t\t';
// 		}
// 	}else{
// 		var fieldText = field.name+': '+arr+'{type: '+field.field;	
// 		if(field.unique) fieldText += ', unique: true';
// 		fieldText += '}'+arrEnd;
// 	}
// 	return '\r\n\t\t/*Field#'+JSON.stringify(field)+'#*/\r\n\t\t'+fieldText;
// }

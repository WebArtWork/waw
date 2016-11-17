var gu = require(__dirname+'/gu.js');
var fs = require('fs');
var fse = require('fs-extra');
/*
*	Parts Manager
*/
	module.exports.create = function(name){
		name = name.replace(/\s+/g, '');
		var dest = process.cwd() + '/server/' + name;
		if(fs.existsSync(dest)) return gu.close('Part Exists');
		fse.mkdirsSync(dest);
		fse.copy(__dirname+'/part', dest, function() {
			var counter = 3, renames = [{
				from: 'NAME',
				to: name.capitalize()
			}];
			gu.writeFile(dest + '/router.js', [{
				from: 'NAME',
				to: name
			}], dest + '/router.js', function() {
				if (--counter === 0) gu.close('Your Part "'+name+'" is successfully created');
			});
			gu.writeFile(dest + '/schema.js', renames, dest + '/schema.js', function() {
				if (--counter === 0) gu.close('Your Part "'+name+'" is successfully created');
			});
			gu.writeFile(dest + '/part.json', renames, dest + '/part.json', function() {
				if (--counter === 0) gu.close('Your Part "'+name+'" is successfully created');
			});
		})
	}
/*
*	Parts Manager - Services
*/
	module.exports.addService = function(partName, service, page){
		if(!partName) return gu.close('Please select part to add service.');
		if(!service) return gu.close('Please select service name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+service+'.js'))
			return gu.close("This service already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.services)) partInfo.services = [];
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name == service)
				return gu.close('This service already exists.');
		}
		partInfo.services.push({
			id: 'service_'+Date.now(),
			name: service,
		});
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirsSync(part+'/client/services');
		gu.writeFile(__dirname + '/templates/service.js', [{
			from: 'NAME',
			to: service
		}], part+'/client/services/'+service+'.js');
		console.log('Service was created successfully.');
		if(page) fetchService(partName, service, page, true);
		else process.exit(0);
	}
	var fetchService = function(part, service, page, ignoreMessage){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add service.');
		if(!service) return gu.close('Please select service name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/services.js', partInfo.services[i].id);
		gu.addCodeByTag(part + '/client/services/'+service+'.js', page + '/js/services.js', partInfo.services[i].id);
		if(!ignoreMessage) console.log('Service fetched successfully.');
		process.exit(0);
	}
	module.exports.fetchService = fetchService;
	var fetchServerService = function(part, service, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add service.');
		if(!service) return gu.close('Please select service name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var code = gu.getCodeByTag(page + '/js/services.js', partInfo.services[i].id);
		fs.writeFileSync(part + '/client/services/'+service+'.js', code, 'utf8');
		gu.close('Server service fetched successfully.');
	}
	module.exports.fetchServerService = fetchServerService;
	module.exports.removeServerService = function(part, service){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add service.');
		if(!service) return gu.close('Please select service name.');
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				partInfo.services.splice(i,1);
				break;
			}
		}
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.removeSync(part + '/client/services/'+service+'.js');
		gu.close('Service has been successfully removed from the server.');
	}
	module.exports.removeService = function(part, service, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add service.');
		if(!service) return gu.close('Please select service name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/services.js', partInfo.services[i].id);
		gu.close('Service has been successfully removed.');
	}
/*
*	Parts Manager - Filters
*/
	module.exports.addFilter = function(partName, filter, page){
		if(!partName) return gu.close('Please select part to add filter.');
		if(!filter) return gu.close('Please select filter name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+filter+'.js'))
			return gu.close("This filter already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.filters)) partInfo.filters = [];
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name == filter)
				return gu.close('This filter already exists.');
		}
		partInfo.filters.push({
			id: 'filter_'+Date.now(),
			name: filter,
		});
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirsSync(part+'/client/filters');
		gu.writeFile(__dirname + '/templates/filter.js', [{
			from: 'NAME',
			to: filter
		}], part+'/client/filters/'+filter+'.js');
		console.log('Filter was created successfully.');
		if(page) fetchFilter(partName, filter, page, true);
		else process.exit(0);
	}
	var fetchFilter = function(part, filter, page, ignoreMessage){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add filter.');
		if(!filter) return gu.close('Please select filter name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
		gu.addCodeByTag(part + '/client/filters/'+filter+'.js', page + '/js/filters.js', partInfo.filters[i].id);
		if(!ignoreMessage) console.log('Filter fetched successfully.');
		process.exit(0);
	}
	module.exports.fetchFilter = fetchFilter;
	var fetchServerFilter = function(part, filter, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add filter.');
		if(!filter) return gu.close('Please select filter name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var code = gu.getCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
		fs.writeFileSync(part + '/client/filters/'+filter+'.js', code, 'utf8');
		gu.close('Server service fetched successfully.');
	}
	module.exports.fetchServerFilter = fetchServerFilter;
	module.exports.removeServerFilter = function(part, filter){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add filter.');
		if(!filter) return gu.close('Please select filter name.');
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				partInfo.filters.splice(i,1);
				break;
			}
		}
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.removeSync(part + '/client/filters/'+filter+'.js');
		gu.close('Filter has been successfully removed from the server.');
	}
	module.exports.removeFilter = function(part, filter, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add filter.');
		if(!filter) return gu.close('Please select filter name.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
		gu.close('Filter has been successfully removed.');
	}
/*
*	Parts Manager - Directives
*/
	module.exports.addDirective = function(partName, directive, page){
		if(!partName) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+directive+'.js'))
			return gu.close("This directive already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.directives)) partInfo.directives = [];
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name == directive)
				return gu.close('This directive already exists.');
		}
		partInfo.directives.push({
			id: 'directive_'+Date.now(),
			name: directive,
			themes: [{
				id: 'theme_'+Date.now(),
				name: 'default'
			}]
		});
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirsSync(part+'/client/directives/'+directive+'/themes');
		gu.writeFile(__dirname + '/templates/directive.js', [{
			from: 'NAME',
			to: directive
		}], part+'/client/directives/'+directive+'/script.js');
		gu.writeFile(__dirname + '/templates/template.html', [{
			from: 'NAME',
			to: directive
		}], part+'/client/directives/'+directive+'/template.html');
		// Theme
		gu.writeFile(__dirname + '/templates/default.scss', [{
			from: 'DNAME',
			to: directive
		},{
			from: 'NAME',
			to: 'default'
		}], part+'/client/directives/'+directive+'/themes/default.scss');
		console.log('Directive successfully created.');
		if(page) fetchDirective(partName, directive, 'default', page, true);
		else process.exit(0);
	}
	var fetchDirective = function(part, directive, theme, page, ignoreMessage){
		var partLoc = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!page) return gu.close("You don't have selected the page.");
		var pageLoc = process.cwd() + '/client/' + page;
		if(!fs.existsSync(pageLoc)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var name = part.toLowerCase() + '_' + directive.toLowerCase() + '_' + theme.toLowerCase();
		var htmlName = pageLoc + '/html/' + name + '.html';
		var dir = partLoc + '/client/directives/' + directive;
		gu.writeFile(dir+'/template.html', [], htmlName);
		gu.removeCodeByTag(pageLoc + '/js/directives.js', partInfo.directives[i].id);
		gu.addPieceCodeByTag(gu.getFile(partLoc+'/client/directives/'+directive+'/script.js', [{
			from: 'DIRECTORY',
			to: part.toLowerCase() + directive.toLowerCase() + theme.toLowerCase()
		},{
			from: 'URL',
			to: '/' + page + '/html/' + name + '.html'
		}]), pageLoc + '/js/directives.js', partInfo.directives[i].id);
		// Themes management
		fse.mkdirsSync(pageLoc + '/css/directives');
		gu.writeFile(partLoc+'/client/directives/'+directive+'/themes/'+theme+'.scss',
		 [], pageLoc + '/css/directives/' + name + '.scss');
		var indexFile = process.cwd() + '/client/'+ page + '/css/index.scss';
		gu.removeCodeByTag(indexFile, partInfo.directives[i].id);
		gu.addPieceCodeByTag("@import 'directives/" + name + ".scss'",
		 indexFile, partInfo.directives[i].id);
		if(!ignoreMessage) console.log('Directive successfully fetched.');
		process.exit(0);
	}
	module.exports.fetchDirective = fetchDirective;
	var fetchServerDirective = function(part, directive, theme, page){
		var partLoc = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!page) return gu.close("You don't have selected the page.");
		var pageLoc = process.cwd() + '/client/' + page;
		if(!fs.existsSync(pageLoc)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var name = part.toLowerCase() + '_' + directive.toLowerCase() + '_' + theme.toLowerCase();
		var htmlName = pageLoc + '/html/' + name + '.html';
		var dir = partLoc + '/client/directives/' + directive;
		gu.writeFile(htmlName, [], dir+'/template.html');
		gu.writeFileFromData(gu.getCodeByTag(pageLoc + '/js/directives.js', partInfo.directives[i].id), [{
			from: part.toLowerCase() + directive.toLowerCase() + theme.toLowerCase(),
			to: 'DIRECTORY'
		},{
			from: '/' + page + '/html/' + name + '.html',
			to: 'URL'
		}], partLoc+'/client/directives/'+directive+'/script.js');
		// Themes management
		gu.writeFile(pageLoc + '/css/directives/' + name + '.scss',
		 [], partLoc+'/client/directives/'+directive+'/themes/'+theme+'.scss');
		gu.close('Server directive successfully fetched.');
	}
	module.exports.fetchServerDirective = fetchServerDirective;
	module.exports.removeServerDirective = function(part, directive){
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		var partLoc = process.cwd() + '/server/' + part;
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				partInfo.directives.splice(i);
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		fse.writeJsonSync(partLoc+'/part.json', partInfo, {throws: false});
		fse.removeSync(partLoc + '/client/directives/' + directive);
		gu.close('Directive has been successfully removed from the server.');
	}
	module.exports.removeDirective = function(part, directive, theme, page){
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!page) return gu.close("You don't have selected the page.");
		var partLoc = process.cwd() + '/server/' + part;
		var pageLoc = process.cwd() + '/client/' + page;
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var name = part.toLowerCase() + '_' + directive.toLowerCase() + '_' + theme.toLowerCase();
		var htmlName = pageLoc + '/html/' + name + '.html';
		gu.removeFile(htmlName);		
		gu.removeFile(pageLoc + '/css/directives/' + name + '.scss');
		gu.removeCodeByTag(pageLoc + '/js/directives.js', partInfo.directives[i].id);
		var indexFile = process.cwd() + '/client/' + page + '/css/index.scss';
		gu.removeCodeByTag(indexFile, partInfo.directives[i].id);
		gu.close('Directive has been successfully removed.');
	}
/*
*	Parts Manager - Themes
*/
	module.exports.addTheme = function(partName, directive, theme, page){
		if(!partName) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+directive+'.js'))
			return gu.close("This directive already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.directives)) partInfo.directives = [];
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name == directive){
				for (var j = 0; j < partInfo.directives[i].themes.length; j++) {
					if(partInfo.directives[i].themes[j].name == theme)
						return gu.close('This theme already exists.');
				}
				partInfo.directives[i].themes.push({
					id: 'theme_'+Date.now(),
					name: theme,
				});				
				found = true;
				break;
			}
		}
		if(!found){
			return gu.close('This directive do not exists.');
		}
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirsSync(part+'/client/directives/'+directive+'/themes');
		gu.writeFile(__dirname + '/templates/default.scss', [{
			from: 'DNAME',
			to: directive
		},{
			from: 'NAME',
			to: theme
		}], part+'/client/directives/'+directive+'/themes/'+theme+'.scss');
		console.log('Theme successfully created.');
		if(page) fetchDirective(partName, directive, theme, page);
		else process.exit(0);		
	}
	var fetchTheme = function(part, directive, theme, page){
		var partLoc = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!page) return gu.close("You don't have selected the page.");
		var pageLoc = process.cwd() + '/client/' + page;
		if(!fs.existsSync(pageLoc)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var name = part.toLowerCase() + '_' + directive.toLowerCase() + '_' + theme.toLowerCase();
		fse.mkdirsSync(pageLoc + '/css/directives');
		gu.writeFile(partLoc+'/client/directives/'+directive+'/themes/'+theme+'.scss',
		 [], pageLoc + '/css/directives/' + name + '.scss', function() {});
		var indexFile = process.cwd() + '/client/'+ page + '/css/index.scss';
		gu.removeCodeByTag(indexFile, partInfo.directives[i].id);
		gu.addPieceCodeByTag("@import 'directives/" + name + ".scss'",
		 indexFile, partInfo.directives[i].id);
		gu.close('Theme successfully fetched.');
	}
	module.exports.fetchTheme = fetchTheme;
	var fetchServerTheme = function(part, directive, theme, page){
		var partLoc = process.cwd() + '/server/' + part;
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!page) return gu.close("You don't have selected the page.");
		var pageLoc = process.cwd() + '/client/' + page;
		if(!fs.existsSync(pageLoc)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				found = true;
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		var name = part.toLowerCase()+'_'+directive.toLowerCase()+'_'+theme.toLowerCase();
		gu.writeFile(pageLoc + '/css/directives/' + name + '.scss',
		 [], partLoc+'/client/directives/'+directive+'/themes/'+theme+'.scss');
		gu.close('Server theme successfully fetched.');
	}
	module.exports.fetchServerTheme = fetchServerTheme;
	module.exports.removeServerTheme = function(part, directive, theme){
		if(!part) return gu.close('Please select part to add directive.');
		if(!directive) return gu.close('Please select directive name.');
		if(!theme) return gu.close('Please select theme name.');
		var partLoc = process.cwd() + '/server/' + part;
		var partInfo = fse.readJsonSync(partLoc+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.directives.length; i++) {
			if(partInfo.directives[i].name==directive){
				for (var j = 0; j < partInfo.directives[i].themes.length; j++) {
					if(partInfo.directives[i].themes[j].name==theme){
						found = true;
						partInfo.directives[i].themes.splice(j,1);
						break;
					}
				}
				break;
			}
		}
		if(!found) return gu.close("Part you have selected doesn't exists.");
		fse.writeJsonSync(partLoc+'/part.json', partInfo, {throws: false});
		fse.removeSync(partLoc + '/client/directives/' + directive + '/themes/' + theme + '.scss');
		gu.close('Theme has been successfully removed from the server.');
	}
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
// end of file
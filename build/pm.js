var gu = require(__dirname+'/gu.js');
var fs = require('fs');
var fse = require('fs-extra');
/*
*	Parts Manager
*/
	module.exports.create = function(name){
		name = name.replace(/\s+/g, '');
		var dest = process.cwd() + '/server/' + name;
		if(fs.existsSync(dest)) return console.log('Part Exists');
		fse.mkdirs(dest);
		fse.copy(__dirname+'/part', dest, function() {
			var counter = 3, renames = [{
				from: 'NAME',
				to: name.capitalize()
			}];
			writeFile(dest + '/router.js', [{
				from: 'NAME',
				to: name
			}], dest + '/router.js', function() {
				if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
			});
			writeFile(dest + '/schema.js', renames, dest + '/schema.js', function() {
				if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
			});
			writeFile(dest + '/part.json', renames, dest + '/part.json', function() {
				if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
			});
		})
	}
/*
*	Parts Manager - Services
*/
	module.exports.addService = function(partName, service, page){
		if(!partName) return console.log('Please select part to add service.');
		if(!service) return console.log('Please select service name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+service+'.js'))
			return console.log("This service already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.services)) partInfo.services = [];
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name == service)
				return console.log('This service already exists.');
		}
		partInfo.services.push({
			id: 'service_'+Date.now(),
			name: service,
		});
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirs(part+'/client');
		writeFile(__dirname + '/templates/service.js', [{
			from: 'NAME',
			to: service
		}], part+'/client/'+service+'.js', function() {
			if(page) fetchService(partName, service, page);
		});
	}
	var fetchService = function(part, service, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add service.');
		if(!service) return console.log('Please select service name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return console.log("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/services.js', partInfo.services[i].id);
		gu.addCodeByTag(part + '/client/'+service+'.js', page + '/js/services.js', partInfo.services[i].id);
	}
	module.exports.fetchService = fetchService;
	var fetchServerService = function(part, service, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add service.');
		if(!service) return console.log('Please select service name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return console.log("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		var code = gu.getCodeByTag(page + '/js/services.js', partInfo.services[i].id);
		fs.writeFileSync(part + '/client/'+service+'.js', code, 'utf8');
	}
	module.exports.fetchServerService = fetchServerService;
	module.exports.removeServerService = function(part, service){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add service.');
		if(!service) return console.log('Please select service name.');
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				partInfo.services.splice(i,1);
				break;
			}
		}
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.removeSync(part + '/client/'+service+'.js');
	}
	module.exports.removeService = function(part, service, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add service.');
		if(!service) return console.log('Please select service name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.services.length; i++) {
			if(partInfo.services[i].name==service){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/services.js', partInfo.services[i].id);
	}
/*
*	Parts Manager - Filters
*/
	module.exports.addFilter = function(partName, filter, page){
		if(!partName) return console.log('Please select part to add filter.');
		if(!filter) return console.log('Please select filter name.');
		part = process.cwd() + '/server/' + partName;
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		if(fs.existsSync(part+'/'+filter+'.js'))
			return console.log("This filter already exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		if(!Array.isArray(partInfo.filters)) partInfo.filters = [];
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name == filter)
				return console.log('This filter already exists.');
		}
		partInfo.filters.push({
			id: 'filter_'+Date.now(),
			name: filter,
		});
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.mkdirs(part+'/client');
		writeFile(__dirname + '/templates/filter.js', [{
			from: 'NAME',
			to: filter
		}], part+'/client/'+filter+'.js', function() {
			if(page) fetchFilter(partName, filter, page);
		});
	}
	var fetchFilter = function(part, filter, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add filter.');
		if(!filter) return console.log('Please select filter name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return console.log("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
		gu.addCodeByTag(part + '/client/'+filter+'.js', page + '/js/filters.js', partInfo.filters[i].id);
	}
	module.exports.fetchFilter = fetchFilter;
	var fetchServerFilter = function(part, filter, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add filter.');
		if(!filter) return console.log('Please select filter name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return console.log("Page you have selected doesn't exists.");
		if(!fs.existsSync(part)||!fs.existsSync(part+'/part.json'))
			return console.log("Part you have selected doesn't exists.");
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		var code = gu.getCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
		fs.writeFileSync(part + '/client/'+filter+'.js', code, 'utf8');
	}
	module.exports.fetchServerFilter = fetchServerFilter;
	module.exports.removeServerFilter = function(part, filter){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add filter.');
		if(!filter) return console.log('Please select filter name.');
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				partInfo.filters.splice(i,1);
				break;
			}
		}
		fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
		fse.removeSync(part + '/client/'+filter+'.js');
	}
	module.exports.removeFilter = function(part, filter, page){
		part = process.cwd() + '/server/' + part;
		if(!part) return console.log('Please select part to add filter.');
		if(!filter) return console.log('Please select filter name.');
		if(!page) return console.log("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		var partInfo = fse.readJsonSync(part+'/part.json', {throws: false});
		var found = false;
		for (var i = 0; i < partInfo.filters.length; i++) {
			if(partInfo.filters[i].name==filter){
				found = true;
				break;
			}
		}
		if(!found) return console.log("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/filters.js', partInfo.filters[i].id);
	}
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
	var writeFile = function(src, renames, dest, callback){
		fs.readFile(src, 'utf8', function(err, data) {
			for (var i = 0; i < renames.length; i++) {
				data=data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
			}
			fs.writeFile(dest, data, function(err) {
				if (typeof callback == 'function') callback(err);
			});
		});
	}
// end of file
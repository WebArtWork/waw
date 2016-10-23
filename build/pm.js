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
		id: 'Service_'+Date.now(),
		name: service,
	});
	fse.writeJsonSync(part+'/part.json', partInfo, {throws: false});
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
	fs.readFile(page + '/js/services.js', 'utf8', function(err, data) {
		if(data.indexOf(partInfo.services[i].id)>-1)
			gu.removeByTag(page + '/js/services.js', partInfo.services[i].id);
		gu.addTag(part + '/client/'+service+'.js', page + '/js/services.js', partInfo.services[i].id);
	});
}
module.exports.fetchService = fetchService;
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
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
// end of file
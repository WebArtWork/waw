var gu = require(__dirname+'/gu.js');
var fs = require('fs');
var fse = require('fs-extra');
var recursive = require('recursive-readdir');
/*
*	Parts Manager
*/
	module.exports.create = function(name){
		name = name.replace(/\s+/g, '');
		var dest = process.cwd() + '/server/' + name;
		if(fs.existsSync(dest)) return gu.close('Part Exists');
		fse.copy(__dirname+'/part', dest, function() {
			var renames = [{
				from: 'CNAME',
				to: name.toLowerCase().capitalize()
			},{
				from: 'NAME',
				to: name.toLowerCase()
			}];
			recursive(dest, function(err, files) {
				if(files){
					for (var i = 0; i < files.length; i++) {
						gu.writeFile(files[i], renames, files[i]);
					}
				};
				gu.close('Your Part "'+name+'" is successfully created');
			});
		});
	}
/*
*	Page Management
*/
	module.exports.addPageLocal = function(page){
		var pages = gu.getDirectories(process.cwd() + '/client');
		for (var i = 0; i < pages.length; i++) {
			if (page.toLowerCase() == pages[i]) {
				return gu.close('This page already exists');
			}
		}
		var dest = process.cwd() + '/client/' + page;
		fse.copySync(__dirname+'/PageLocal', dest);
		var renames = [{
			from: 'PAGENAME',
			to: page
		}];
		recursive(dest, function(err, files) {
			if(files){
				for (var i = 0; i < files.length; i++) {
					gu.writeFile(files[i], renames, files[i]);
				}
			};
			gu.close("Local Page has been successfully created.");
		});
	}
	module.exports.addPagePublic = function(page){
		var pages = gu.getDirectories(process.cwd() + '/client');
		for (var i = 0; i < pages.length; i++) {
			if (page.toLowerCase() == pages[i]) {
				return gu.close('This page already exists');
			}
		}
		var dest = process.cwd() + '/client/' + page;
		fse.copySync(__dirname+'/PagePublic', dest);
		var renames = [{
			from: 'PAGENAME',
			to: page
		}];
		recursive(dest, function(err, files) {
			if(files){
				for (var i = 0; i < files.length; i++) {
					gu.writeFile(files[i], renames, files[i]);
				}
			};
			gu.close("Public Page has been successfully created.");
		});
	}
/*
*	Parts Manager - Crud
*/
	var crudClient = function(part, page){
		partLoc = process.cwd() + '/server/' + part;
		if(!partLoc) return gu.close('Please select part fetch crud.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		gu.removeCodeByTag(page + '/js/crud.js', part);
		gu.addCodeByTag(partLoc + '/client/crud.js', page + '/js/crud.js', part);
		gu.close('Crud fetched successfully.');
	}
	var crudServer = function(part, page){
		partLoc = process.cwd() + '/server/' + part;
		if(!partLoc) return gu.close('Please select part fetch crud.');
		if(!page) return gu.close("You don't have selected the page.");
		page = process.cwd() + '/client/' + page;
		if(!fs.existsSync(page)) return gu.close("Page you have selected doesn't exists.");
		if(!fs.existsSync(partLoc)||!fs.existsSync(partLoc+'/part.json'))
			return gu.close("Part you have selected doesn't exists.");
		var code = gu.getCodeByTag(page + '/js/crud.js', part);
		if(!code) gu.close('Server failed to fetch crud.');
		fs.writeFileSync(partLoc + '/client/crud.js', code, 'utf8');
		gu.close('Server crud fetched successfully.');
	}
	module.exports.crudServer = crudServer;
	module.exports.crudClient = crudClient;
// General prototypes
	String.prototype.capitalize = function(all) {
		if (all) {
			return this.split(' ').map(e => e.capitalize()).join(' ');
		} else {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}
	}
// end of file
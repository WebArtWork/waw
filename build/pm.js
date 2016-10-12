var fs = require('fs');
var fse = require('fs-extra');
/*
	Parts Manager
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
		doRenames(dest + '/router.js', [{
			from: 'NAME',
			to: name
		}], function() {
			if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
		});
		doRenames(dest + '/schema.js', renames, function() {
			if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
		});
		doRenames(dest + '/part.json', renames, function() {
			if (--counter === 0) console.log('Your Part "'+name+'" is successfully created');
		});
	})
}
var doRenames = function(src, renames, callback){
	fs.readFile(src, 'utf8', function(err, data) {
		for (var i = 0; i < renames.length; i++) {
			data=data.replace(new RegExp(renames[i].from, 'g'), renames[i].to);
		}
		fs.writeFile(src, data, function(err) {
			if (typeof callback == 'function') callback(err);
		});
	});
}
String.prototype.capitalize=function(all){
    if(all){
       return this.split(' ').map(e=>e.capitalize()).join(' ');
    }else{
         return this.charAt(0).toUpperCase() + this.slice(1);
    }
}
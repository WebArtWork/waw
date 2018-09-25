var fs = require('fs');
var fse = require('fs-extra');
var sd = require(__dirname+'/../../../sd')();
if (fs.existsSync(__dirname+'/config.json')) {
	var config = fse.readJsonSync(__dirname+'/../../../../config.json', {
		throws: false
	});
}else var config = {};
var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
/*
*	What
*/
	var what;
	var what_opts = {
		p: 'page',
		1: 'page',
		d: 'directive',
		2: 'directive',
		s: 'service',
		3: 'service',
		f: 'filter',
		4: 'filter',
	};
	var what_list = ['1) Page', '2) Directive', '3) Service', '4) Filter']
	var what_get = function(){
		var text = 'What you want to generate?';
		for (var i = 0; i < what_list.length; i++) {
			text += '\n'+what_list[i];
		}
		text += '\nChoose: ';
		rl.question(text, function(answer){
			if(!answer||!what_opts[answer.toLowerCase().slice(0, 1)]) return what_get();
			what = what_opts[answer.toLowerCase().slice(0, 1)];
			if(!name){
				return name_get();
			}
			description_get();
		});
	};
/*
*	Name
*/
	var name;
	var name_get = function(){
		rl.question('Please select name for your '+what+': ', function(answer){
			if(!answer) return name_get();
			name = answer;
			description_get();
		});
	};
/*
*	Description
*/
	var description;
	var description_get = function(){
		rl.question('Describe what this '+what+' will do and where it will be used: ', function(answer){
			if(!answer) return description_get();
			description = answer;
			generate();
		});
	};
/*
*	Generate
*/
	var generate = function(){
		switch(what){
			case 'page':
				fse.mkdirs(process.cwd()+'/client/pages');
				fse.copySync(__dirname+'/template/page', process.cwd()+'/client/pages/'+name);
				sd._writeFile(process.cwd()+'/client/pages/'+name+'/'+name+'.ctrl.js', [{
					from: 'NAME',
					to: name
				},{
					from: 'DESCRIPTION',
					to: description
				},{
					from: 'AUTHOR',
					to: config.name&&('\n*\tAuthor: '+config.name)||''
				}]);
				return sd._close('Page was generated successfully.');
			case 'directive':
				fse.mkdirs(process.cwd()+'/client/directives');
				fse.copySync(__dirname+'/template/directive', process.cwd()+'/client/directives/'+name);
				sd._writeFile(process.cwd()+'/client/directives/'+name+'/'+name+'.config.js', [{
					from: 'NAME',
					to: name
				},{
					from: 'DESCRIPTION',
					to: description
				},{
					from: 'AUTHOR',
					to: config.name&&('\n*\tAuthor: '+config.name)||''
				}]);
				return sd._close('Directive was generated successfully.');
			case 'service':
				fse.mkdirs(process.cwd()+'/client/services');
				fse.copySync(__dirname+'/template/service.js', process.cwd()+'/client/services/'+name+'.js');
				sd._writeFile(process.cwd()+'/client/services/'+name+'.js', [{
					from: 'NAME',
					to: name
				},{
					from: 'DESCRIPTION',
					to: description
				},{
					from: 'AUTHOR',
					to: config.name&&('\n*\tAuthor: '+config.name)||''
				}]);
				return sd._close('Service was generated successfully.');
			case 'filter':
				fse.mkdirs(process.cwd()+'/client/filters');
				fse.copySync(__dirname+'/template/filter.js', process.cwd()+'/client/filters/'+name+'.js');
				sd._writeFile(process.cwd()+'/client/filters/'+name+'.js', [{
					from: 'NAME',
					to: name
				},{
					from: 'DESCRIPTION',
					to: description
				},{
					from: 'AUTHOR',
					to: config.name&&('\n*\tAuthor: '+config.name)||''
				}]);
				return sd._close('Filter was generated successfully.');
		}
	};
// Pick Options
module.exports = function(){
	if(process.argv[3] && what_opts[process.argv[3].toLowerCase().slice(0, 1)]){
		what = what_opts[process.argv[3].toLowerCase().slice(0, 1)];
	}
	if(process.argv[4]){
		name = process.argv[4];
	}
	if(!what){
		return what_get();
	}
	if(!name){
		return name_get();
	}
	description_get();
}
/*
*	Add service
*/

/*
*	Add filter
*/

/*
*	Add directive
*/

/*
*	Add modal
*/

/*
*	Add popup
*/

/*
*	Add spinner
*/



/*
*	fetch fonts
*/

/*
*	fetch icons
*/

/*
*	fetch images
*/

/*
*	fetch plugins
*/

/*
*	fetch stickers
*/

/*
*	fetch translations
*/

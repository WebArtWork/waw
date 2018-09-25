var readline = require('readline');
var sd = require(__dirname+'/../sd')();
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
/*
*	Part Management
*/
	var part = function(){
		rl.question('Provide name for the part you want to create: ', function(answer){
			if(!answer) return part();
			require(__dirname+'/part')(answer);
		});
	};
	module.exports.part = part;
/*
*	Initialize Management
*/
	var _project_name;
	var project_name = function(){
		rl.question('Provide name for the project you want to create: ', function(answer){
			if(!answer) return project_name();
			_project_name = answer;
			install();
		});
	};
	/*
	*	To Add List
	*	Angular 6 waw.app
	*	Vue.js Project
	*	React.js Project
	*	Angular.js waw.app
	*	Vue.js waw.app
	*	React.js waw.app
	*/
	var list = {
		'1) Angular.js Project': 'git@github.com:WebArtWork/wawAngular.git',
		'2) Angular 6 Project': 'git@github.com:WebArtWork/wawNg.git'
	};
	var install = function(name){
		if(name) _project_name = name;
		if (sd._fs.existsSync(process.cwd() + '/' + _project_name)) {
			console.log('This project already exists, please choose other name.');
			_project_name = null;
			return project_name();
		}
		var text = 'Which project you want to use?', counter=0, repos={};
		for(var key in list){
			repos[++counter] = list[key];
			text += '\n'+key;
		}
		text += '\nChoose number: ';
		rl.question(text, function(answer){
			if(!answer||!repos[parseInt(answer)]) return install();
			require(__dirname+'/update').install(_project_name, repos[parseInt(answer)]);
		});
	};
	module.exports.project_name = project_name;
	module.exports.install = install;
/*
*	Domain Management
*/
	var _is_secure;
	var add_domain = function(sd){
		rl.question('Pick domain type\n1) Secured with SSL\n2) Not secured\nChoose: ', function(answer){
			if(!answer) return add_domain(sd);
			if(answer=='1'){
				_is_secure = true;
			}else{
				_is_secure = false;
			}
			get_domain(sd);
		});
	};
	var _domain_url;
	var get_domain = function(sd){
		rl.question('Provide domain url: ', function(answer){
			if(!answer) return get_domain(sd);
			_domain_url = answer.toLowerCase();
			get_port(sd);
		});
	}
	var get_port = function(sd){
		rl.question('Provide app port: ', function(answer){
			if(!answer) return get_port(sd);
			require(__dirname+'/domain').set(sd, {
				secure: _is_secure,
				domain: _domain_url,
				port: parseInt(answer)
			}, function(){
				sd._close('Domain '+_domain_url+' has been successfully added.');
			});
		});
	}
	var remove_domain = function(sd){
		var q = 'Select domain to remove';
		var domains = require(__dirname+'/domain').get_domains(sd);
		for (var i = 0; i < domains.length; i++) {
			q+='\n'+(i+1)+') '+domains[i].name;
		}
		q += '\nChoose: ';
		rl.question(q, function(answer){
			if(!answer) return remove_domain(sd);
			answer = parseInt(answer);
			require(__dirname+'/domain').remove(sd, domains[answer-1].name);
			sd._close('Domain '+domains[answer-1].name+' has been successfully removed.');
		});
	};
	var domain = function(sd){
		rl.question('What do you want to do with domains?\n1) Add new Domain\n2) Remove an Domain\n3) List All Domains\nChoose: ', function(answer) {
			if (!answer) return add_domain(sd);
			if (answer == '1') {
				add_domain(sd);
			} else if (answer == '2') {
				remove_domain(sd);
			} else {
				require(__dirname+'/domain').list(sd);
				sd._close();
			}
		});
	}
	module.exports.domain = domain;
	module.exports.add_domain = add_domain;
	module.exports.remove_domain = remove_domain;
/*
*	Translate Management
*/
/*
*	End Of exe Management
*/
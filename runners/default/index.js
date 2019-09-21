let text = '# With Base of Mongodb, Node.js on Express and front-end on:',
	counter=0,
	repos={};
let list = {
	') Angular 1': 'git@github.com:WebArtWork/wawAngular.git',
	') Angular 8': 'git@github.com:WebArtWork/wawNgx.git',
	') Vue': 'git@github.com:WebArtWork/wawVue.git',
	') React': 'git@github.com:WebArtWork/wawReact.git'
};
for(let key in list){
	repos[++counter] = list[key];
	text += '\n'+counter+key;
}
/*
*	Add other Back-end type
*/

text += '\nChoose number or add custom repo link: ';
module.exports = function(sd, argv, root){
	const create_project = (name, repo)=>{
		if(!name){
			return sd.readline.question('Provide name for the project you want to create: ', function(answer){
				create_project(answer, repo);
			});
		}
		if (sd.fs.existsSync(process.cwd() + '/' + name)) {
			sd.exit('This project already exists, please choose other name.');
		}
		if(!repo){
			return sd.readline.question(text, function(answer){
				if(!answer||!repos[parseInt(answer)]) return install();
				create_project(name, repos[parseInt(answer)] || answer);
			});
		}
		sd.fetch(process.cwd()+'/'+name, repo, err=>{
			if(err) sd.exit("Couldn't pull the repo, please verify that repo LINK is correct and you have access to it.");
			sd.exit('Successfully Created.', 1);
		});
	}
	const set_package = (name, link)=>{
		if(!name){
			return sd.readline.question('Provide name for the repo you want to set: ', function(answer){
				set_package(answer, link);
			});
		}
		if(!link){
			return sd.readline.question('Provide link for the repo you want to set: ', function(answer){
				set_package(name, answer);
			});
		}
		sd.wawConfig.packages[name] = link;
		sd.fs.writeFileSync(root+'/config.json', JSON.stringify(sd.wawConfig) , 'utf-8');
		sd.exit('Successfully Added.', 1);
	}
	switch(argv.shift().toLowerCase()){
		case 'new':
		case 'n':
			return create_project(argv.shift(), argv.shift());
		case 'l':
		case 'list':
			let list = argv.shift() || '';
			switch(list.toLowerCase()){
				case 'p':
				case 'package':
				default:
			}
			sd.exit(sd.wawConfig.packages, 1);
		case 's':
		case 'set':
			switch(argv.shift().toLowerCase()){
				case 'p':
				case 'package':
					return set_package(argv.shift(), argv.shift());
				default:
					sd.exit("Command set don't have such option, please check docs LINK.");
			}
		default:
	}
	sd.exit('Command is not correct, please check docs LINK.');
}
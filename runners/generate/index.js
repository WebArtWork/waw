module.exports = function(sd, argv, root){
	const copy_folder = (from, to, name, replaces)=>{
		name = name.toLowerCase();
		var to_name;
		var to_Name;
		if (sd.fs.existsSync(process.cwd() + '/server/' + name)) {
			sd.exit('This part already exists, please choose other name.');
		}
		if(replaces) {		
			for(let each in replaces){
				if(each == 'NAME') {
					to_name = replaces[each];
				} else if(each == 'CNAME') {
					to_Name = sd.capitalize(replaces[each]);
				}
			}
		}
		const files = sd.getFiles(from, true);
		sd.fs.mkdirSync(to+name+'/', { recursive: true });
		for (var i = 0; i < files.length; i++) {
			let content = sd.fs.readFileSync(from+'/'+files[i], 'utf8');
			content = content.split('CNAME').join(to_Name);
			content = content.split('NAME').join(to_name);
			sd.fs.writeFileSync(to+to_name+'/'+files[i], content, 'utf8', { recursive: true });
		}
		sd.exit('Part: '+to_name+' is successfully created.', 1);
	}; 
	switch(argv.shift().toLowerCase()){
		case 'generate':
		case 'g':
			switch(argv.shift().toLowerCase()){
				case 'p':
				case 'part':
					return copy_folder(__dirname + '/part/default', process.cwd()+'/server/', argv.shift().toLowerCase(), { NAME: argv.shift().toLowerCase(), CNAME: argv.shift()});
				default:
			}
			break;
		case 'gp':
			return copy_folder(__dirname + '/part/default', process.cwd()+'/server/', argv.shift().toLowerCase(), { NAME: argv.shift().toLowerCase(), CNAME: argv.shift()});
		default:
	}
	sd.exit('Command is not correct');
}
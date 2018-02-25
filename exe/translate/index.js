var getConfig = function(sd){
	var config = JSON.parse(sd._fs.readFileSync(process.cwd()+'/config.json','utf8'));
	if (sd._fs.existsSync(process.cwd()+'/server.json')) {
		var extra = JSON.parse(sd._fs.readFileSync(process.cwd()+'/server.json','utf8'));
		for(var key in extra){
			config[key] = extra[key];
		}
	}
	return config;
}
var request = require('request');
module.exports.fetch = function(sd){
	var config = getConfig(sd);
	if(!config.idea) sd._close('Please provide idea config into config.json.');
	request.post({
		uri: 'http://pagefly.webart.work/api/idea/getTranslates',
		form: config.idea
	}, function(err, resp){
		var clientRoot = process.cwd() + '/client';
		var translateFolder = clientRoot + '/lang';
		var translates = JSON.parse(resp.body);
		if(!translates) sd._close("Translates didn't fetched, check your enviroment.");
		var folder = translateFolder;
		var files = sd._getFiles(folder);
		for (var i = 0; i < files.length; i++) {
			var previousFileName = files[i];
			files[i] = files[i].replace('.js','');
			if(files[i].indexOf('.')>=0){
				files[i] = sd._rpl(files[i], '.', '');
				sd._fs.writeFileSync(folder+'/'+files[i]+'.js', sd._fs.readFileSync(folder+'/'+previousFileName, 'utf8'), 'utf8');
				sd._fs.unlinkSync(folder+'/'+previousFileName);
			}
		}
		for (var i = 0; i < files.length; i++) {
			var words = require(folder+'/'+files[i]+'.js');
			for (var j = 0; j < translates.length; j++) {
				for(var word in words){
					if(word==translates[j].word){
						words[word] = translates[j].translate[files[i]];
					}
				}			
			}
			sd._fs.writeFileSync(folder+'/'+files[i]+'.js', 'module.exports = '+JSON.stringify(words), 'utf-8');
		}
		if(sd._fse.readJsonSync(clientRoot+'/config.json', {throws: false}).translate){
			var df = {};
			for (var i = 0; i < files.length; i++) {
				var words = require(translateFolder+'/'+files[i]+'.js');
				if(!df[files[i]]) df[files[i]]={};
				for(key in words){
					df[files[i]][key] = words[key];
				}
			}
			var data = sd._fs.readFileSync(__dirname+'/translate.js', 'utf8');
			data=data.replace('LANG_ARR', JSON.stringify(files)).replace('INNER_DF', JSON.stringify(df));
			sd._fs.writeFileSync(clientRoot + '/gen/translate.js', data, 'utf8');
		}
		sd._close('Translations succesfully fetched from waw idea.');
	});
}
module.exports.update = function(sd){
	var config = getConfig(sd);
	if(!config.idea) sd._close('Please provide idea config into config.json.');
	var folder = process.cwd()+'/client/lang';
	var files = sd._getFiles(folder);
	if(files.length==0) sd._close("You don't have any files translated.");
	for (var i = 0; i < files.length; i++) {
		var previousFileName = files[i];
		files[i] = files[i].replace('.js','');
		if(files[i].indexOf('.')>=0){
			files[i] = sd._rpl(files[i], '.', '');
			sd._fs.writeFileSync(folder+'/'+files[i]+'.js', sd._fs.readFileSync(folder+'/'+previousFileName, 'utf8'), 'utf8');
			sd._fs.unlinkSync(folder+'/'+previousFileName);
		}
	}
	config.idea.languages = files;
	var langs = {};
	config.idea.translates = [];
	for (var i = 0; i < files.length; i++) {
		langs[files[i]] = require(folder+'/'+files[i]+'.js');
		for(var word in langs[files[i]]){
			var needToAdd = true;
			for (var j = 0; j < config.idea.translates.length; j++) {
				if(config.idea.translates[j].word == word){
					config.idea.translates[j].translate[files[i]]=langs[files[i]][word];
					needToAdd = false;
					break;
				}
			}
			if(needToAdd){
				var newWord = {
					word: word,
					translate: {}
				}				
				newWord.translate[files[i]]=langs[files[i]][word];
				config.idea.translates.push(newWord);
			}
		}
	}
	request.post({
		uri: 'http://pagefly.webart.work/api/idea/fillTranslates',
		form: config.idea
	}, function(){
		sd._close('Translations succesfully updated.');
	});
}

/*
case 'tf':
	require(__dirname+'/build/tr.js').fetch(process.argv[3]);
	return;
case 'tu':
	require(__dirname+'/build/tr.js').update(process.argv[3]);
	return;
*/
var gu = require(__dirname+'/gu.js');
var fs = require('fs');
var fse = require('fs-extra');
var request = require('request');
var askPage = function(){
	gu.close('Please provide page.');
}
var devConfig = function(){
	if (fs.existsSync(__dirname + '/../config.json')) {
		return fse.readJsonSync(__dirname + '/../config.json', {
			throws: false
		}).user;
	}else gu.close('Please fill developer user Token from any waw tool/profile_securty.');
}
var config = JSON.parse(fs.readFileSync(process.cwd()+'/config.json','utf8'));
if (fs.existsSync(process.cwd()+'/server.json')) {
	var extra = JSON.parse(fs.readFileSync(process.cwd()+'/server.json','utf8'));
	for(var key in extra){
		config[key] = extra[key];
	}
}
module.exports.fetch = function(page){
	if(!config.waw_idea) gu.close('Please provide idea ._id, from idea settings into waw project config file.');
	request.post({
		uri: 'http://localhost:4587/api/idea/getTranslates',
		//uri: 'http://pagefly.webart.work/api/idea/getTranslates',
		form: {
			_id: config.waw_idea,
			token: devConfig()
		}
	}, function(err, resp){
		var clientRoot = process.cwd() + '/client';
		var translateFolder = clientRoot + '/lang';
		var translates = JSON.parse(resp.body);
		if(!translates) gu.close("Translates didn't fetched, check your enviroment.");
		var folder = translateFolder;
		var files = gu.getFiles(folder);
		for (var i = 0; i < files.length; i++) {
			var previousFileName = files[i];
			files[i] = files[i].replace('.js','');
			if(files[i].indexOf('.')>=0){
				files[i] = gu._rpl(files[i], '.', '');
				fs.writeFileSync(folder+'/'+files[i]+'.js', fs.readFileSync(folder+'/'+previousFileName, 'utf8'), 'utf8');
				fs.unlinkSync(folder+'/'+previousFileName);
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
			fs.writeFileSync(folder+'/'+files[i]+'.js', 'module.exports = '+JSON.stringify(words), 'utf-8');
		}
		if(fse.readJsonSync(clientRoot+'/config.json', {throws: false}).translate){
			var df = {};
			for (var i = 0; i < files.length; i++) {
				var words = require(translateFolder+'/'+files[i]+'.js');
				if(!df[files[i]]) df[files[i]]={};
				for(key in words){
					df[files[i]][key] = words[key];
				}
			}
			var data = fs.readFileSync(__dirname+'/../run/js/translate.js', 'utf8');
			data=data.replace('LANG_ARR', JSON.stringify(files)).replace('INNER_DF', JSON.stringify(df));
			fs.writeFileSync(clientRoot + '/gen/translate.js', data, 'utf8');
		}
		gu.close('Translations succesfully fetched from waw idea.');
	});
}
module.exports.update = function(){
	if(!config.waw_idea) gu.close('Please provide idea ._id, from idea settings into waw project config file.');
	var form = {		
		_id: config.waw_idea,
		token: devConfig()
	}
	var folder = process.cwd()+'/client/lang';
	var files = gu.getFiles(folder);
	if(files.length==0) gu.close("You don't have any files translated.");
	for (var i = 0; i < files.length; i++) {
		var previousFileName = files[i];
		files[i] = files[i].replace('.js','');
		if(files[i].indexOf('.')>=0){
			files[i] = gu._rpl(files[i], '.', '');
			fs.writeFileSync(folder+'/'+files[i]+'.js', fs.readFileSync(folder+'/'+previousFileName, 'utf8'), 'utf8');
			fs.unlinkSync(folder+'/'+previousFileName);
		}
	}
	form.languages = files;
	var langs = {};
	form.translates = [];
	for (var i = 0; i < files.length; i++) {
		langs[files[i]] = require(folder+'/'+files[i]+'.js');
		for(var word in langs[files[i]]){
			var needToAdd = true;
			for (var j = 0; j < form.translates.length; j++) {
				if(form.translates[j].word == word){
					form.translates[j].translate[files[i]]=langs[files[i]][word];
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
				form.translates.push(newWord);
			}
		}
	}
	request.post({
		uri: 'http://pagefly.webart.work/api/idea/fillTranslates',
		form: form
	}, function(){
		gu.close('Translations succesfully updates.');
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
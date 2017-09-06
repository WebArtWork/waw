var gu = require(__dirname+'/gu.js');
var fs = require('fs');
var fse = require('fs-extra');
var request = require('request');
var askPage = function(){
	gu.close('Please provide page.');
}
var getPage = function(page){
	if(page&&fs.existsSync(process.cwd()+'/client/'+page+'/config.json')){
		return process.cwd()+'/client/'+page+'/lang';
	}else if(fs.existsSync(process.cwd()+'/client/config.json')){
		return process.cwd()+'/client/lang';
	}else askPage();
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
		uri: 'https://webart.work/api/idea/getTranslates',
		form: {
			_id: config.waw_idea,
			token: devConfig()
		}
	}, function(err, resp){
		var translates = JSON.parse(resp.body);
		if(!translates) gu.close("Translates didn't fetched, check your enviroment.");
		
		var folder = getPage(page);
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
		gu.close('Translations succesfully fetched from waw idea.');
	});
}
module.exports.update = function(page){
	if(!config.waw_idea) gu.close('Please provide idea ._id, from idea settings into waw project config file.');
	var form = {		
		_id: config.waw_idea,
		token: devConfig()
	}
	var folder = getPage(page);
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
	form.langs = {};
	for (var i = 0; i < files.length; i++) {
		var words = require(folder+'/'+files[i]+'.js');
		form.langs[files[i]] = words;
	}
	request.post({
		uri: 'https://webart.work/api/idea/fillTranslates',
		form: form
	}, function(){
		gu.close('Translations succesfully updates.');
	});
}
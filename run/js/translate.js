/*
*	This file has to be included after app is available.
*	'var df' and 'var langs' is generated
*/
var df = INNER_DF;
var langs = LANG_ARR;
app.config(function ($translateProvider) {
	for(var lang in df){
		$translateProvider.translations(lang, df[lang]);
	}
	$translateProvider.preferredLanguage(langs[0]);
	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
}).service('translate', function($translate, $http){
	var wordsToAdd = [];
	var lang = langs[0];
	$translate.failCallback(function(word){
		for (var i = 0; i < wordsToAdd.length; i++) {
			if(wordsToAdd[i]==word) return;
		}
		wordsToAdd.push(word);
		$http.post('/waw/translate', {
			word: word,
			lang: lang
		});
	});
	this.set = function(_lang){
		for (var i = 0; i < langs.length; i++) {
			if(langs[i]==_lang){
				$translate.use(_lang);
				lang = _lang;
				break;
			}
		}
	}
}).run(function(translate){});
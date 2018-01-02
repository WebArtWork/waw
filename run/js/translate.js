/*
*	This file has to be included after app is available.
*	'var df' and 'var langs' is generated
*/
var df = INNER_DF;
var langs = LANG_ARR;
var lang = langs[0];
app.config(function ($translateProvider) {
	for(var lang in df){
		$translateProvider.translations(lang, df[lang]);
	}
	$translateProvider.preferredLanguage(langs[0]);
	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
	$translateProvider.useMissingTranslationHandler('missingTranslate');
}).factory('missingTranslate', function($http) {
	var wordsToAdd = [];
	return function(word) {
		for (var i = 0; i < wordsToAdd.length; i++) {
			if(wordsToAdd[i]==word) return;
		}
		wordsToAdd.push(word);
		$http.post('/waw/translate', {
			word: word,
			lang: lang
		});
	};
}).service('translate', function($translate){
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
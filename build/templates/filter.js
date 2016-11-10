/*
*	NAME filter.
*/
filters.NAME=function(){
	"ngInject";
	return function(text){
		return text.toLowerCase();
	};
};
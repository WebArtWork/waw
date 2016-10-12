directives.helloworld = function() {
	"ngInject";
    return {
        restrict: 'E',
        scope: {},
        controller: function(){},
        template: '<div>Hello World</div>'
    };
};
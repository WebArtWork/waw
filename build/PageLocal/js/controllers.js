var controllers = {};
app.controller(controllers);
controllers.Landing=function($scope, MyUser){
	"ngInject";
	$scope.MyUser = MyUser;
};
controllers.AboutUs=function($scope){
	"ngInject";
};
controllers.Structure=function($scope){
	"ngInject";
};
controllers.User=function($scope, $state, MyUser){
	"ngInject";
	MyUser.selectUser($state.params.code);
};
controllers.AboutFramework=function($scope){
	"ngInject";
	/*
		Quick Start.
	*/
		$scope.QuickStart = [{
			command: 'npm i -g waw',
			description: 'Installing the framework globally, so you can run every project via it.'
		},{
			command: 'waw create PROJECTNAME',
			description: 'In the folder you are located, create default waw Auth project with the name you specify.'
		},{
			command: 'cd PROJECTNAME',
			description: 'Get inside the project you have created.'		
		},{
			command: 'waw run',
			description: "Start the project, if it's waw project that you are located at."
		}];
	/*
		waw commands.
	*/
		$scope.QuickStartWithCommands = [{
			command: 'waw create',
			description: "More options about creation of your project."
		},{
			command: 'waw add',
			description: "Anything you want to add into your waw project."
		},{
			command: 'waw remove',
			description: "Anything you want to remove from your waw project."
		},{
			command: 'waw fetch',
			description: "Anything you want to fetch inside your waw project."
		},{
			command: 'waw git',
			description: "Anything you have to do with git inside your waw project."
		}];
	/*
		Server Side Functionalities.
	*/
		$scope.ServerSide = [{
			command: 'waw add part PARTNAME',
			description: 'Create new default part with name of given.'
		},{
			command: 'waw git init PARTNAME repo',
			description: 'Clone part from repo and give given name.'
		},{
			command: 'waw git update PARTNAME "Message"',
			description: 'Update repo of the part with given message.'
		},{
			command: 'waw fetch part PARTNAME',
			description: 'Fetching part with repo.'
		}];
	/*
		Client Side Functionalities.
	*/
		$scope.AngularClientSide = [{
			// Services
			command: 'waw add service PARTNAME SERVICENAME PAGENAME',
			description: 'Create new default service with name of given to part of given.'
		},{
			command: 'waw fetch service PARTNAME SERVICENAME PAGENAME',
			description: 'Create new default service with name of given to part of given.'
		},{
			command: 'waw fetch server service PARTNAME SERVICENAME PAGENAME',
			description: 'Create new default service with name of given to part of given.'
		},{
			command: 'waw remove service PARTNAME SERVICENAME PAGENAME',
			description: 'Create new default service with name of given to part of given.'
		},{
			command: 'waw remove server service PARTNAME SERVICENAME',
			description: 'Create new default service with name of given to part of given.'
		},{
			// Filters
			command: 'waw add filter PARTNAME FILTERNAME PAGENAME',
			description: 'Create new default filter with name of given to part of given.'
		},{
			command: 'waw fetch filter PARTNAME FILTERNAME PAGENAME',
			description: 'Create new default filter with name of given to part of given.'
		},{
			command: 'waw fetch server filter PARTNAME FILTERNAME PAGENAME',
			description: 'Create new default filter with name of given to part of given.'
		},{
			command: 'waw remove filter PARTNAME FILTERNAME PAGENAME',
			description: 'Create new default filter with name of given to part of given.'
		},{
			command: 'waw remove server filter PARTNAME FILTERNAME',
			description: 'Create new default filter with name of given to part of given.'
		},{
			// Directives
			command: 'waw add directive PARTNAME DIRECTIVENAME PAGENAME',
			description: 'Create new default directive with name of given to part of given.'
		},{
			command: 'waw fetch directive PARTNAME DIRECTIVENAME PAGENAME',
			description: 'Create new default directive with name of given to part of given.'
		},{
			command: 'waw fetch server directive PARTNAME DIRECTIVENAME PAGENAME',
			description: 'Create new default directive with name of given to part of given.'
		},{
			command: 'waw remove directive PARTNAME DIRECTIVENAME PAGENAME',
			description: 'Create new default directive with name of given to part of given.'
		},{
			command: 'waw remove server directive PARTNAME DIRECTIVENAME',
			description: 'Create new default directive with name of given to part of given.'
		},{
			// Template
			command: 'waw add theme PARTNAME DIRECTIVENAME THEMENAME PAGENAME',
			description: 'Create new default theme with name of given to part of given.'
		},{
			command: 'waw fetch theme PARTNAME DIRECTIVENAME THEMENAME PAGENAME',
			description: 'Create new default theme with name of given to part of given.'
		},{
			command: 'waw fetch server theme PARTNAME DIRECTIVENAME THEMENAME PAGENAME',
			description: 'Create new default theme with name of given to part of given.'
		},{
			command: 'waw remove theme PARTNAME DIRECTIVENAME THEMENAME PAGENAME',
			description: 'Create new default theme with name of given to part of given.'
		},{
			command: 'waw remove server theme PARTNAME DIRECTIVENAME THEMENAME',
			description: 'Create new default theme with name of given to part of given.'
		}];
	// End of.
};
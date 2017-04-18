var controllers = {};
app.controller(controllers);
controllers.Landing=function($scope, MyUser){
	"ngInject";
	$scope.MyUser = MyUser;
};
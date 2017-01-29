var crudServices = {};
app.factory(crudServices);
var crudFilters = {};
app.filter(crudFilters);
var crudDirectives = {};
app.directive(crudDirectives);
crudServices.socket = function(){
	var loc = window.location.host;
	var socket = io.connect(loc);
	socket.on('disconnect', function(){
		socket = io.connect(loc);
	});
	return socket;
}
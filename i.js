module.exports = function(sd, cb, sudo){
	console.log('install');
	sd._cmd.get((sudo||'')+'npm i', function(err){
		console.log('err');
		console.log(err);
		cb();
	});
}
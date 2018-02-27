module.exports = function(sd, cb){
	sd._cmd.get('npm i', cb);
	sd._cmd.get('pwd', function(err, body){
		console.log('err123');
		console.log(err);
		console.log('body');
		console.log(body);
	});
}
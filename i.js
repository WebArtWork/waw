module.exports = function(sd, cb, sudo){
	sd._cmd.get((sudo||'')+'npm i', cb);
}
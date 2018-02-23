var path = '/etc/nginx/sites-enabled/default';
var set_domains = function(sd, domains){
	var data = '';
	for (var i = 0; i < domains.length; i++) {
		data += '\n' + domains[i].code + '\n';
	}
	sd._fs.writeFileSync(path, data, 'utf8');
}
var get_domains = function(sd){
	var nginxConfig = sd._fs.readFileSync(path, 'utf8');
	var servers = nginxConfig.split('}');
	for (var i = servers.length - 1; i >= 0; i--) {
		if (!servers[i] || servers[i].length < 10) {
			servers.splice(i, 1);
			continue;
		}
		if (servers[i].indexOf('https://$server_name$request_uri') > -1) {
			servers[i] += '}';
		} else {
			servers[i] += '}\n}';
		}
		servers[i] = servers[i].substring(servers[i].indexOf('server'), servers[i].length);
		servers[i] = {
			code: servers[i],
			name: servers[i].split('server_name ')[1].split(';')[0],
			secure: servers[i].indexOf('https://$server_name$request_uri') > -1
		}
	}
	return servers;
}
module.exports.get_domains = get_domains;
var remove = function(sd, domain){
	var domains = get_domains(sd);
	for (var i = domains.length - 1; i >= 0; i--) {
		if(domains[i].name == domain){
			domains.splice(i, 1);
		}
	}
	set_domains(sd, domains);
}
module.exports.remove = remove;
var list = function(sd){
	var domains = get_domains(sd);
	console.log('\nSecure Domains');
	console.log('========================================================');
	var removeDomains = [];
	var once = false;
	for (var i = domains.length - 1; i >= 0; i--) {
		if (domains[i].secure) {
			if (once) console.log('--------------------------------------------------------');
			once = true;
			var length = domains[i].name.length;
			var spaces = '';
			for (var j = length; j < 53; j++) {
				spaces += ' ';
			}
			console.log('| ' + domains[i].name + spaces + "|");
			removeDomains.push(domains[i].name);
			domains.splice(i, 1);
		}
	}
	for (var i = domains.length - 1; i >= 0; i--) {
		for (var j = 0; j < removeDomains.length; j++) {
			if (removeDomains[j] == domains[i].name) {
				domains.splice(i, 1);
				break;
			}
		}
	}
	console.log('========================================================');
	if (domains.length == 0) return sd._close();;
	console.log('\nSimple Domains');
	console.log('========================================================');
	once = false;
	for (var i = domains.length - 1; i >= 0; i--) {
		if (once) console.log('--------------------------------------------------------');
		once = true;
		var length = domains[i].name.length;
		var spaces = '';
		for (var j = length; j < 53; j++) {
			spaces += ' ';
		}
		console.log('| ' + domains[i].name + spaces + "|");
	}
	console.log('========================================================');
	sd._close('');
}
module.exports.list = list;
var add_simple = function(sd, config){
	var domains = get_domains(sd);
	var code = sd._fs.readFileSync(__dirname + '/simple', 'utf8');
	code = sd._rpl(code, 'NAME', config.domain);
	code = sd._rpl(code, 'PORT', config.port);
	domains.push({
		code: code,
		name: config.domain
	});
	set_domains(sd, domains);
}
var add_secure = function(sd, config){
	var domains = get_domains(sd);
	var code = sd._fs.readFileSync(__dirname + '/secure', 'utf8');
	code = sd._rpl(code, 'NAME', config.domain);
	code = sd._rpl(code, 'PORT', config.port);
	domains.push({
		code: code,
		name: config.domain
	});
	set_domains(sd, domains);
}
var set_secure = function(sd, config, cb){
	if (sd._fs.existsSync('/etc/letsencrypt/live/'+config.domain)) {
		add_secure(sd, config);
		cb();
	}else{
		add_simple(sd, config);
		sd._cmd.get('sudo certbot --nginx certonly -d '+config.domain, function(){
			remove(sd, config.domain);
			add_secure(sd, config);
			cb();
		});
	}
}
module.exports.set = function(sd, config, cb){
	if(!config.domain||!config.port) return;
	remove(sd, config.domain);
	if(config.secure){
		set_secure(sd, config, function(){
			sd._cmd.get('sudo service nginx restart', cb);
		});
	} else {
		add_simple(sd, config);
		sd._cmd.get('sudo service nginx restart', cb);
	}
}
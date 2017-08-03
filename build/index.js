var readline = require('readline');
var gu = require(__dirname+'/gu.js');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
var cmd = require('node-cmd');
var info = {};
var configPath = __dirname+'/../config.json';
if (gu.fs.existsSync(configPath)) {
	info = gu.fse.readJsonSync(configPath, {
		throws: false
	});
}
/*
	waw add
*/
	var getAddOption = function(callback){
		rl.question('What do you want to add into your waw project?\n1) Part\n2) Public Page\n3) Local Page\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||answer=='3'||answer=='public page'||
				answer=='p'||answer=='pp'||answer=='lp'||
				answer=='part'||answer=='local page') callback(answer);
			else{
				console.log('Please select one of the options');
				getAddOption(obj, callback);
			}
		});
	}
	var createPart = function(){
		rl.question('Give name for new part: ', function(name) {
			if(!name){
				console.log('Empty name is not allowed.');
				createPart();
			}
			if(name.indexOf('@')>-1)
				return require(__dirname+'/git')
				.createPart(name);
			else return require(__dirname+'/pm')
				.create(name);
		});
	}
	var getPart = function(callback){
		var parts = gu.getDirectories(process.cwd() + '/server');
		if(!parts||parts.length==0){
			console.log("You don't have any parts.");
			return process.exit(0);
		}
		if(parts&&parts.length==1){
			console.log("Part '" + parts[0] + "' will use it.");
			return callback(parts[0]);
		}
		var question = 'Which part?\n';
		for (var i = 1; i < parts.length+1; i++) {
			question += i + ') ' + parts[i-1] + '\n';
		}
		question += 'Choose: ';
		rl.question(question, function(name) {
			name = name.toLowerCase();
			if (!name){
				console.log('You have to give part name.');
				return getPart(callback);
			}
			for (var i = 0; i < parts.length; i++) {
				if(name == (i+1).toString() || name == parts[i])
					return callback(parts[i]);	
			}
			console.log('Pick correct part.');
			getPart(callback);
		});
	}
	var addPageLocal = function(){
		var pages = gu.getDirectories(process.cwd() + '/client');
		rl.question('Give page you want to create: ', function(name) {
			for (var i = 0; i < pages.length; i++) {
				if(name.toLowerCase() == pages[i]){
					console.log('This page already exists');
					return addPageLocal();
				}
			}
			require(__dirname + '/pm').addPageLocal(name);
		});
	}
	var addPagePublic = function(){
		var pages = gu.getDirectories(process.cwd() + '/client');
		rl.question('Give page you want to create: ', function(name) {
			for (var i = 0; i < pages.length; i++) {
				if(name.toLowerCase() == pages[i]){
					console.log('This page already exists');
					return addPagePublic();
				}
			}
			require(__dirname + '/pm').addPagePublic(name);
		});
	}
	module.exports.add = function(){
		if(process.argv[3]){
			switch(process.argv[3].toLowerCase()){
				case '1':
				case 'p':
				case 'part':
					if(process.argv[4].indexOf('@')>-1)
						return require(__dirname+'/git')
						.createPart(process.argv[4]);
					else return require(__dirname+'/pm')
						.create(process.argv[4]);
				case '2':
				case 'pp':
				case 'publicpage':
					return require(__dirname+'/pm')
					.addPagePublic(process.argv[4]);
				case '3':
				case 'lp':
				case 'localpage':
					return require(__dirname+'/pm')
					.addPageLocal(process.argv[4]);
				default: 
					return console.log('Wrong Command.');
			}
		}else{
			getAddOption(function(answer){
				switch (answer.toLowerCase()) {
					case '1':
					case 'p':
					case 'part':
						return createPart();
					case '2':
					case 'pp':
					case 'public page':
						return addPagePublic({});
					case '3':
					case 'lp':
					case 'local page':
						return addPageLocal({});
				}
			});
		}
	};
/*
	waw domain management
*/
	var getDomainOption = function(callback){
		rl.question('What would you like to do with domains?\n1) Add Domain\n2) Add Secure Domain\n3) Remove Domain\n4) List Domains\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||answer=='3'||answer=='4'||
				answer=='a'||answer=='as'||answer=='r'||answer=='l'||
				answer=='add domain'||answer=='add secure domain'||
				answer=='remove domain'||answer=='list domains') callback(answer);
			else{
				console.log('Please select one of the options');
				getDomainOption(callback);
			}
		});
	}
	var startNginx = function(){
		cmd.get('certbot renew --dry-run', function(err, data, stderr) {
			cmd.get('service nginx start', function(err, data, stderr) {
				gu.close('Domains Successfully updated.');
			});
		});
	}
	var makeCrts = function(servers){
		var path = info.nginx || '/etc/nginx/sites-enabled/default';
		var data = '';
		var addCert = 'certbot certonly --standalone'
		for (var i = 0; i < servers.length; i++) {
			data += '\n' + servers[i].code + '\n';
			if(servers[i].secure&&!gu.fs.existsSync('/etc/letsencrypt/live/'+servers[i].name)){
				addCert += ' -d ' + servers[i].name;
			}
		}
		gu.fs.writeFileSync(path, data, 'utf8');
		cmd.get('service nginx stop', function(err, data, stderr) {
			if(addCert != 'certbot certonly --standalone'){
				cmd.get(addCert, function(err, data, stderr) {
					startNginx();
				});
			}else startNginx();
		});
	}
	var addDomainPort = function(servers, secure, domain){
		rl.question('Please provide port you want to add: ', function(answer) {
			answer = parseInt(answer);
			if (!answer||answer<1000) {
				gu.log('Please give correct port, greater then 1000.');
				return addDomainPort(servers, secure, domain);
			}
			for (var i = 0; i < servers.length; i++) {
				if (servers[i].name.toLowerCase() == domain) {
					servers.splice(i, 1);
				}
			}
			var code;
			if (secure) code = gu.fs.readFileSync(__dirname + '/domain/secure', 'utf8');
			else code = gu.fs.readFileSync(__dirname + '/domain/simple', 'utf8');
			code = gu.replace(code, 'NAME', domain);
			code = gu.replace(code, 'PORT', answer);
			servers.push({
				code: code,
				name: domain,
				secure: secure
			});
			makeCrts(servers);
		});
	}
	var addDomain = function(servers, secure){
		rl.question('Please provide domain you want to add: ', function(answer){
			answer = answer.toLowerCase();
			if (!answer || answer.indexOf('.') == -1) {
				gu.log('Please give correct domain.');
				return addDomain(servers, secure);
			}
			addDomainPort(servers, secure, answer);
		});
	}
	var removeDomain = function(servers, secure){
		rl.question('Please provide domain you want to add: ', function(answer){
			answer = answer.toLowerCase();
			if (!answer || answer.indexOf('.') == -1) {
				gu.log('Please give correct domain.');
				return removeDomain(servers, secure);
			}
			for (var i = servers.length - 1; i >= 0; i--) {
				if(servers[i].name.toLowerCase() == answer){
					servers.splice(i, 1);
				}
			}
			makeCrts(servers);
		});
	}
	// list support
	var getServerName = function(code){
		var name = code.split('server_name ')[1].split(';')[0];
		return name;
	}
	var cleanStarts = function(code){
		return code.substring(code.indexOf('server'), code.length);
	}
	var listDomains = function(servers){
		console.log('\nSecure Domains');
		console.log('========================================================');
		var removeDomains = [];
		var once = false;
		for (var i = servers.length - 1; i >= 0; i--) {
			if(servers[i].secure){
				if(once) console.log('--------------------------------------------------------');
				once = true;
				var length = servers[i].name.length;
				var spaces = '';
				for (var j = length; j < 53; j++) {
					spaces+=' ';
				}
				console.log('| '+servers[i].name+spaces+"|");
				removeDomains.push(servers[i].name);
				servers.splice(i, 1);
			}
		}
		for (var i = servers.length - 1; i >= 0; i--) {
			for (var j = 0; j < removeDomains.length; j++) {
				if(removeDomains[j] == servers[i].name){
					servers.splice(i, 1);
					break;
				}
			}
		}
		console.log('========================================================');
		if(servers.length==0) return gu.close();;
		console.log('\nSimple Domains');
		console.log('========================================================');
		once = false;
		for (var i = servers.length - 1; i >= 0; i--) {
			if(once) console.log('--------------------------------------------------------');
			once = true;
			var length = servers[i].name.length;
			var spaces = '';
			for (var j = length; j < 53; j++) {
				spaces+=' ';
			}
			console.log('| '+servers[i].name+spaces+"|");
		}
		console.log('========================================================');
		gu.close('');
	}
	module.exports.config = function(field, value){
		info[field] = value;
		gu.fse.writeJsonSync(configPath, info, {
			throws: false
		});
		gu.close('Config Successfully saved.');
	}
	module.exports.domain = function(){
		var path = info.nginx || '/etc/nginx/sites-enabled/default';
		if (gu.fs.existsSync(path)) {
			var nginxConfig = gu.fs.readFileSync(path, 'utf8');
			var servers = nginxConfig.split('}');
			for (var i = servers.length - 1; i >= 0; i--) {
				if(!servers[i]||servers[i].length<10){
					servers.splice(i, 1);
					continue;
				}
				if(servers[i].indexOf('https://$server_name$request_uri')>-1){
					servers[i]+='}';
				}else{
					servers[i]+='}\n}';
				}
				servers[i] = cleanStarts(servers[i]);
				servers[i] = {
					code: servers[i],
					name: getServerName(servers[i]),
					secure: servers[i].indexOf('https://$server_name$request_uri')>-1
				}
			}
		}
		getDomainOption(function(answer){
			switch (answer.toLowerCase()) {
				case '1':
				case 'a':
				case 'add domain':
					return addDomain(servers);
				case '2':
				case 'as':
				case 'add secure domain':
					return addDomain(servers, true);
				case '3':
				case 'r':
				case 'remove domain':
					return removeDomain(servers);
				case '4':
				case 'l':
				case 'list domains':
					return listDomains(servers);
			}
		});
	};
/*
	waw crud
*/
	var getCrudOption = function(callback){
		rl.question('Which crud do you like to fetch?\n1) Server\n2) Client\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||
				answer=='server'||answer=='client') callback(answer);
			else{
				console.log('Please select one of the options');
				getCrudOption(callback);
			}
		});
	}
	var crudClient = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				crudClient(obj);
			});
		}else{
			var clientRoot = process.cwd() + '/client';
			if(gu.fs.existsSync(clientRoot+'/config.json')){
				return require(__dirname + '/pm').crudClient(obj.part, clientRoot);
			}else{
				var pages = gu.getDirectories(clientRoot);
				if(pages.length == 0) return console.log("You don't have any page.");
				else if(pages.length == 1) return require(__dirname + '/pm').crudClient(obj.part, pages[0]);
				var question = 'Give page you want to use:\n';
				for (var i = 1; i < pages.length+1; i++) {
					question += i + ') ' + pages[i-1] + '\n';
				}
				question += 'Choose: ';
				rl.question(question, function(name) {
					name = name.toLowerCase();
					for (var i = 0; i < pages.length; i++) {
						if(name == pages[i] || name == (i+1).toString()){
							return require(__dirname + '/pm').crudClient(obj.part, clientRoot+'/'+pages[i]);
						}
					}
					crudClient(obj);
				});
			}
		}
	}
	var crudServer = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				crudServer(obj);
			});
		}else{
			var clientRoot = process.cwd() + '/client';
			if(gu.fs.existsSync(clientRoot+'/config.json')){
				return require(__dirname + '/pm').crudServer(obj.part, clientRoot);
			}else{
				var pages = gu.getDirectories(clientRoot);
				if(pages.length == 0) return console.log("You don't have any page.");
				else if(pages.length == 1) return require(__dirname + '/pm').crudServer(obj.part, pages[0]);
				var question = 'Give page you want to use:\n';
				for (var i = 1; i < pages.length+1; i++) {
					question += i + ') ' + pages[i-1] + '\n';
				}
				question += 'Choose: ';
				rl.question(question, function(name) {
					name = name.toLowerCase();
					for (var i = 0; i < pages.length; i++) {
						if(name == pages[i] || name == (i+1).toString()){
							return require(__dirname + '/pm').crudServer(obj.part, clientRoot+'/'+pages[i]);
						}
					}
					crudServer(obj);
				});
			}
		}
	}
	module.exports.crud = function(){
		if(process.argv[3]){
			switch(process.argv[3].toLowerCase()){
				case '1':
				case 's':
				case 'server':
					return require(__dirname+'/pm')
					.crudServer(process.argv[4], process.argv[5]);
				case '2':
				case 'c':
				case 'client':
					return require(__dirname+'/pm')
					.crudClient(process.argv[4], process.argv[5]);
				default: 
					return console.log('Wrong Command.');
			}
		}else{
			getCrudOption(function(answer){
				switch (answer.toLowerCase()) {
					case '1':
					case 'server':
						return crudServer({});
					case '2':
					case 'client':
						return crudClient({});
				}
			});
		}
	};
/*
	waw new
*/
	module.exports.new = function(){
		if(process.argv[4]){
			
		}else require(__dirname+'/git').create(process.argv[3], function(){
			console.log('Successfully updated');
		});
	};
/*
	waw end of
*/
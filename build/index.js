var readline = require('readline');
var gu = require(__dirname+'/gu.js');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
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
			var pages = gu.getDirectories(process.cwd() + '/client');
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
						return require(__dirname + '/pm').crudClient(obj.part, pages[i]);
					}
				}
				crudClient(obj);
			});
		}
	}
	var crudServer = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				crudServer(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
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
						return require(__dirname + '/pm').crudServer(obj.part, pages[i]);
					}
				}
				crudServer(obj);
			});
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
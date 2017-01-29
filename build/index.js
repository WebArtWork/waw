var readline = require('readline');
var gu = require(__dirname+'/gu.js');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
/*
	waw add
*/
	var getAddFetchOption = function(obj, callback){
		var firstParam = 'Part';
		if(obj['1']) firstParam = obj['1'];
		rl.question(obj.msg+'\n1) ' + firstParam + '\n2) Service\n3) Filter\n4) Directive\n5) Theme' + (!obj['1']&&'\n6) Page') + '\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||answer=='3'||
				answer=='4'||answer=='5'||answer=='6'||
				answer=='part'||answer=='service'||
				answer=='theme'||answer=='page'||
				answer=='filter'||answer=='directive') callback(answer);
			else{
				console.log('Please select one of the options');
				getAddFetchOption(obj, callback);
			}
		});
	}
	var createPart = function(){
		rl.question('Give name for new part: ', function(name) {
			if(!name){
				console.log('Empty name is not allowed.');
				createPart();
			}
			return require(__dirname + '/pm').create(name);
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
		var question = 'Which part will host it?\n';
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
	var getNewService = function(part, callback){
		var services = gu.getPartInfo(part).services||[];
		rl.question('Give name for new service: ', function(name) {
			if(!name){
				console.log('You have to give to service a name.');
				return getNewService(part, callback);
			}
			for (var i = 0; i < services.length; i++) {
				if(name.toLowerCase() == services[i].name.toLowerCase()){
					console.log('This service already exists.');
					return getNewService(part, callback);
				}
			}
			callback(name);
		});
	}
	var createService = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				createService(obj);
			});
		}else if(!obj.service){
			getNewService(obj.part, function(name){
				obj.service = name;
				createService(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			var question = 'Give page you want to add service(optional).\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				var erase = true;
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						erase = false;
						break;
					}
				}
				if(erase) name='';
				require(__dirname + '/pm').addService(obj.part, obj.service, name);
			});
		}
	}
	var getNewFilter = function(part, callback){
		var filters = gu.getPartInfo(part).filters||[];
		rl.question('Give name for new filter: ', function(name) {
			if(!name){
				console.log('You have to give to filter a name.');
				return getNewFilter(part, callback);
			}
			for (var i = 0; i < filters.length; i++) {
				if(name.toLowerCase() == filters[i].name.toLowerCase()){
					console.log('This filter already exists.');
					return getNewFilter(part, callback);
				}
			}
			callback(name);
		});
	}
	var createFilter = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				createFilter(obj);
			});
		}else if(!obj.filter){
			getNewFilter(obj.part, function(name){
				obj.filter = name;
				createFilter(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			var question = 'Give page you want to add filter(optional).\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				var erase = true;
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						erase = false;
						break;
					}
				}
				if(erase) name='';
				require(__dirname + '/pm').addFilter(obj.part, obj.filter, name);
			});
		}
	}
	var getNewDirective = function(part, callback){
		var directives = gu.getPartInfo(part).directives||[];
		rl.question('Give name for new directive: ', function(name) {
			if(!name){
				console.log('You have to give to filter a name.');
				return getNewDirective(part, callback);
			}
			for (var i = 0; i < directives.length; i++) {
				if(name.toLowerCase() == directives[i].name.toLowerCase()){
					console.log('This filter already exists.');
					return getNewDirective(part, callback);
				}
			}
			callback(name);
		});
	}
	var createDirective = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				createDirective(obj);
			});
		}else if(!obj.directive){
			getNewDirective(obj.part, function(name){
				obj.directive = name;
				createDirective(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			var question = 'Give page you want to add directive(optional).\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				var erase = true;
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						erase = false;
						break;
					}
				}
				if(erase) name='';
				require(__dirname + '/pm').addDirective(obj.part, obj.directive, name);
			});
		}
	}
	var getNewTheme = function(part, directive, callback){
		var directives = gu.getPartInfo(part).directives||[];
		rl.question('Give name for new theme: ', function(name) {
			if(!name){
				console.log('You have to give to filter a name.');
				return getNewTheme(part, callback);
			}
			for (var i = 0; i < directives.length; i++) {
				if(name.toLowerCase() == directives[i].name.toLowerCase()){
					console.log('This filter already exists.');
					return getNewTheme(part, callback);
				}
			}
			callback(name);
		});
	}
	var createTheme = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				createTheme(obj);
			});
		}else if(!obj.directive){
			getDirective(obj.part, function(name){
				obj.directive = name;
				createTheme(obj);
			});
		}else if(!obj.theme){
			getNewTheme(obj.part, obj.directive, function(name){
				obj.theme = name;
				createTheme(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			var question = 'Give page you want to add theme(optional).\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				var erase = true;
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						erase = false;
						break;
					}
				}
				if(erase) name='';
				require(__dirname + '/pm').addTheme(obj.part, obj.directive, obj.theme, name);
			});
		}
	}
	var createPage = function(){
		var pages = gu.getDirectories(process.cwd() + '/client');
		rl.question('Give page you want to create: ', function(name) {
			for (var i = 0; i < pages.length; i++) {
				if(name.toLowerCase() == pages[i]){
					console.log('This page already exists');
					return createPage();
				}
			}
			require(__dirname + '/pm').addPage(name);
		});
	}
	module.exports.add = function(){
		if(process.argv[3]){
			switch(process.argv[3].toLowerCase()){
				case 'part':
					if(process.argv[4].indexOf('@')>-1)
						return require(__dirname+'/git')
						.createFromPublic(process.argv[4], process.argv[5]);
					else return require(__dirname+'/pm')
						.create(process.argv[4]);
				case 'service':
					return require(__dirname+'/pm')
					.addService(process.argv[4], process.argv[5], process.argv[6]);
				case 'filter':
					return require(__dirname+'/pm')
					.addFilter(process.argv[4], process.argv[5], process.argv[6]);
				case 'directive':
					return require(__dirname+'/pm')
					.addDirective(process.argv[4], process.argv[5], process.argv[6]);
				case 'theme':
					return require(__dirname+'/pm')
					.addTheme(process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
				case 'page':
					return require(__dirname+'/pm')
					.addPage(process.argv[4]);
				default: 
					return console.log('Wrong Command.');
			}
		}else{
			getAddFetchOption({
				msg: 'What do you want to add into your waw project?'
			}, function(answer){
				switch (answer.toLowerCase()) {
					case '1':
					case 'part':
						return createPart();
					case '2':
					case 'service':
						return createService({});
					case '3':
					case 'filter':
						return createFilter({});
					case '4':
					case 'directive':
						return createDirective({});
					case '5':
					case 'theme':
						return createTheme({});
					case '6':
					case 'page':
						return createPage({});
				}
			});
		}
	};
/*
	waw fetch
*/
	var getFetchServerOption = function(obj, callback){
		rl.question(obj.msg+'\n1) Service\n2) Filter\n3) Directive\n4) Theme\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||answer=='3'||answer=='4'||
				answer=='service'||answer=='theme'||
				answer=='filter'||answer=='directive') callback(answer);
			else{
				console.log('Please select one of the options');
				getFetchServerOption(obj, callback);
			}
		});
	}	
	var getFetchOption = function(callback){
		rl.question('What do you like to fetch?\n1) Server\n2) Service\n3) Filter\n4) Directive\n5) Theme\n6) Crud\nChoose: ', function(answer){
			answer = answer.toLowerCase();
			if(answer=='1'||answer=='2'||answer=='3'||
				answer=='4'||answer=='5'||answer=='6'||
				answer=='6'||answer=='crud'||
				answer=='part'||answer=='service'||
				answer=='theme'||answer=='page'||
				answer=='filter'||answer=='directive') callback(answer);
			else{
				console.log('Please select one of the options');
				getFetchOption(callback);
			}
		});
	}
	var fetchCrud = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchCrud(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchCrud(obj.part, obj.service, pages[0]);
			var question = 'Give page you want to fetch service:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm').fetchCrud(obj.part, pages[i]);
					}
				}
				fetchCrud(obj);
			});
		}
	}
	var getService = function(part, callback){
		var services = gu.getPartInfo(part).services||[];
		if(services.length==0){
			console.log("You don't have any services");
			return process.exit(0);
		}
		var question = 'Pick service:\n';
		for (var i = 1; i < services.length+1; i++) {
			question += i + ') ' + services[i-1].name + '\n';
		}
		question += 'Choose: ';
		rl.question(question, function(name) {
			name = name.toLowerCase();
			if (!name){
				console.log('You have to give service name.');
				return getPart(callback);
			}
			for (var i = 0; i < services.length; i++) {
				if(name == (i+1).toString() || name == services[i].name)
					return callback(services[i].name);	
			}
			console.log('Pick correct service.');
			getService(part, callback);
		});
	}
	var fetchService = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchService(obj);
			});
		}else if(!obj.service){
			getService(obj.part, function(name){
				obj.service = name;
				fetchService(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchService(obj.part, obj.service, pages[0]);
			var question = 'Give page you want to fetch service:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm').fetchService(obj.part, obj.service, pages[i]);
					}
				}
				fetchService(obj);
			});
		}
	}
	var getFilter = function(part, callback){
		var filters = gu.getPartInfo(part).filters||[];
		if(filters.length==0){
			console.log("You don't have any filters");
			return process.exit(0);
		}
		var question = 'Pick filter:\n';
		for (var i = 1; i < filters.length+1; i++) {
			question += i + ') ' + filters[i-1].name + '\n';
		}
		question += 'Choose: ';
		rl.question(question, function(name) {
			name = name.toLowerCase();
			if (!name){
				console.log('You have to give filter name.');
				return getPart(callback);
			}
			for (var i = 0; i < filters.length; i++) {
				if(name == (i+1).toString() || name == filters[i].name)
					return callback(filters[i].name);	
			}
			console.log('Pick correct filter.');
			getFilter(part, callback);
		});
	}
	var fetchFilter = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchFilter(obj);
			});
		}else if(!obj.filter){
			getFilter(obj.part, function(name){
				obj.filter = name;
				fetchFilter(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchFilter(obj.part, obj.filter, pages[0]);
			var question = 'Give page you want to fetch filter:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm').fetchFilter(obj.part, obj.filter, pages[i]);
					}
				}
				console.log('Pick correct page.');
				fetchFilter(obj);
			});
		}
	}
	var getDirective = function(part, callback){
		var directives = gu.getPartInfo(part).directives||[];
		if(directives.length==0){
			console.log("You don't have any directives");
			return process.exit(0);
		}else if(directives.length==1){
			console.log("Directive '"+directives[0].name+"' selected.");
			return callback(directives[0].name);
		}
		var question = 'Pick directive:\n';
		for (var i = 1; i < directives.length+1; i++) {
			question += i + ') ' + directives[i-1].name + '\n';
		}
		question += 'Choose: ';
		rl.question(question, function(name) {
			name = name.toLowerCase();
			if (!name){
				console.log('You have to give directive name.');
				return getPart(callback);
			}
			for (var i = 0; i < directives.length; i++) {
				if(name == (i+1).toString() || name == directives[i].name)
					return callback(directives[i].name);	
			}
			console.log('Pick correct directive.');
			getFilter(part, callback);
		});
	}
	var getTheme = function(part, directive, callback){
		var directives = gu.getPartInfo(part).directives||[];
		if(directives.length==0){
			console.log("You don't have any directives");
			return process.exit(0);
		}
		var found = false;
		for (var i = 0; i < directives.length; i++) {
			if(directives[i].name == directive){
				found = true;
				break;
			}
		}
		if(!found){
			console.log("You don't have that directive");
			return process.exit(0);
		}
		var themes = directives[i].themes;

		var question = 'Pick theme:\n';
		for (var i = 1; i < themes.length+1; i++) {
			question += i + ') ' + themes[i-1].name + '\n';
		}
		question += 'Choose: ';
		rl.question(question, function(name) {
			name = name.toLowerCase();
			if (!name){
				console.log('You have to give theme name.');
				return getPart(callback);
			}
			for (var i = 0; i < themes.length; i++) {
				if(name == (i+1).toString() || name == themes[i].name)
					return callback(themes[i].name);	
			}
			console.log('Pick correct theme.');
			getFilter(part, callback);
		});
	}
	var fetchDirective = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				fetchDirective(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				fetchDirective(obj);
			});
		} else if (!obj.theme) {
			getTheme(obj.part, obj.directive, function(name) {
				obj.theme = name;
				fetchDirective(obj);
			});
		} else {
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchDirective(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to fetch directive:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm')
						.fetchDirective(obj.part, obj.directive, obj.theme, pages[i]);
					}
				}
				fetchDirective(obj);
			});
		}
	}
	var fetchTheme = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchTheme(obj);
			});
		}else if(!obj.directive){
			getDirective(obj.part, function(name){
				obj.directive = name;
				fetchTheme(obj);
			});
		}else if(!obj.theme){
			getTheme(obj.part, obj.directive, function(name){
				obj.theme = name;
				fetchTheme(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchTheme(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to fetch theme:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						return require(__dirname + '/pm')
						.fetchTheme(obj.part, obj.directive, obj.theme, name);
					}
				}
				fetchTheme(obj);
			});
		}
	}
	var fetchServerService = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchServerService(obj);
			});
		}else if(!obj.service){
			getService(obj.part, function(name){
				obj.service = name;
				fetchServerService(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchServerService(obj.part, obj.service, pages[0]);
			var question = 'Give page you want to fetch service:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm')
						.fetchServerService(obj.part, obj.service, pages[i]);
					}
				}
				fetchServerService(obj);
			});
		}
	}
	var fetchServerFilter = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				fetchServerFilter(obj);
			});
		}else if(!obj.filter){
			getFilter(obj.part, function(name){
				obj.filter = name;
				fetchServerFilter(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchServerFilter(obj.part, obj.filter, pages[0]);
			var question = 'Give page you want to fetch filter:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm').fetchServerFilter(obj.part, obj.filter, pages[i]);
					}
				}
				console.log('Pick correct page.');
				fetchServerFilter(obj);
			});
		}
	}
	var fetchServerDirective = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				fetchServerDirective(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				fetchServerDirective(obj);
			});
		} else if (!obj.theme) {
			getTheme(obj.part, obj.directive, function(name) {
				obj.theme = name;
				fetchServerDirective(obj);
			});
		} else {
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchServerDirective(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to fetch directive:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						return require(__dirname + '/pm')
						.fetchServerDirective(obj.part, obj.directive, obj.theme, name);
					}
				}
				fetchServerDirective(obj);
			});
		}
	}
	var fetchServerTheme = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				fetchServerTheme(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				fetchServerTheme(obj);
			});
		} else if (!obj.theme) {
			getTheme(obj.part, obj.directive, function(name) {
				obj.theme = name;
				fetchServerTheme(obj);
			});
		} else {
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.fetchServerTheme(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to fetch theme:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						if(name == (i+1).toString()) name = pages[i];
						return require(__dirname + '/pm')
						.fetchServerTheme(obj.part, obj.directive, obj.theme, name);
					}
				}
				fetchServerTheme(obj);
			});
		}
	}
	var fetchServer = function(){
		getFetchServerOption({
			msg: 'What do you like to fetch in server?',
		}, function(answer) {
			switch (answer.toLowerCase()) {
				case '1':
				case 'service':
					return fetchServerService({});
				case '2':
				case 'filter':
					return fetchServerFilter({});
				case '3':
				case 'directive':
					return fetchServerDirective({});
				case '4':
				case 'theme':
					return fetchServerTheme({});
			}
		});
	}
	module.exports.fetch = function(){
		if(process.argv[3]){
			switch(process.argv[3].toLowerCase()){
				case 'server':
					switch(process.argv[4].toLowerCase()){
						case 'service':
							return require(__dirname+'/pm')
							.fetchServerService(process.argv[5], process.argv[6], process.argv[7]);
						case 'filter':
							return require(__dirname+'/pm')
							.fetchServerFilter(process.argv[5], process.argv[6], process.argv[7]);
						case 'directive':
							return require(__dirname+'/pm')
							.fetchServerDirective(process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
						case 'theme':
							return require(__dirname+'/pm')
							.fetchServerTheme(process.argv[4], process.argv[5], process.argv[6], process.argv[7], process.argv[8]);
					};
					return console.log('Please select something to fetch in server side.');
				case 'service':
					return require(__dirname+'/pm')
					.fetchService(process.argv[4], process.argv[5], process.argv[6]);
				case 'filter':
					return require(__dirname+'/pm')
					.fetchFilter(process.argv[4], process.argv[5], process.argv[6]);
				case 'directive':
					return require(__dirname+'/pm')
					.fetchDirective(process.argv[4], process.argv[5], process.argv[6]);
				case 'theme':
					return require(__dirname+'/pm')
					.fetchTheme(process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
				case 'crud':
					return require(__dirname+'/pm')
					.fetchCrud(process.argv[4], process.argv[5]);
				default: 
					return console.log('Wrong Command.');
			}
		}else{
			getFetchOption(function(answer){
				switch (answer.toLowerCase()) {
					case '1':
					case 'server':
						return fetchServer();
					case '2':
					case 'service':
						return fetchService({});
					case '3':
					case 'filter':
						return fetchFilter({});
					case '4':
					case 'directive':
						return fetchDirective({});
					case '5':
					case 'theme':
						return fetchTheme({});
					case '6':
					case 'crud':
						return fetchCrud({});
				}
			});
		}
	};
/*
	waw remove
*/
	var removeService = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				removeService(obj);
			});
		}else if(!obj.service){
			getService(obj.part, function(name){
				obj.service = name;
				removeService(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			console.log('pages');
			console.log(pages);
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.removeService(obj.part, obj.service, pages[0]);
			var question = 'Give page you want to fetch service:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm').removeService(obj.part, obj.service, pages[i]);
					}
				}
				removeService(obj);
			});
		}
	}
	var removeFilter = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				removeFilter(obj);
			});
		}else if(!obj.filter){
			getFilter(obj.part, function(name){
				obj.filter = name;
				removeFilter(obj);
			});
		}else{
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.removeFilter(obj.part, obj.filter, pages[0]);
			var question = 'Give page you want to remove filter:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm')
						.removeFilter(obj.part, obj.filter, pages[i]);
					}
				}
				console.log('Pick correct page.');
				removeFilter(obj);
			});
		}
	}
	var removeDirective = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				removeDirective(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				removeDirective(obj);
			});
		} else if (!obj.theme){
			getTheme(obj.part, obj.directive, function(name){
				obj.theme = name;
				removeDirective(obj);
			});
		} else {
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.removeDirective(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to remove directive:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm')
						.removeDirective(obj.part, obj.directive, obj.theme, pages[i]);
					}
				}
				removeDirective(obj);
			});
		}
	}
	var removeTheme = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				removeDirective(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				removeDirective(obj);
			});
		} else if (!obj.theme) {
			getTheme(obj.part, obj.directive, function(name) {
				obj.theme = name;
				removeDirective(obj);
			});
		} else {
			var pages = gu.getDirectories(process.cwd() + '/client');
			if(pages.length == 0) return console.log("You don't have any page.");
			else if(pages.length == 1) return require(__dirname + '/pm')
				.removeDirective(obj.part, obj.directive, obj.theme, pages[0]);
			var question = 'Give page you want to remove directive:\n';
			for (var i = 1; i < pages.length+1; i++) {
				question += i + ') ' + pages[i-1] + '\n';
			}
			question += 'Choose: ';
			rl.question(question, function(name) {
				name = name.toLowerCase();
				for (var i = 0; i < pages.length; i++) {
					if(name == pages[i] || name == (i+1).toString()){
						return require(__dirname + '/pm')
						.removeDirective(obj.part, obj.directive, obj.theme, pages[i]);
					}
				}
				removeDirective(obj);
			});
		}
	}
	var removeServer = function(){
		getFetchServerOption({
			msg: 'What do you like to remove from server?',
		}, function(answer) {
			switch (answer.toLowerCase()) {
				case '1':
				case 'service':
					return removeServerService({});
				case '2':
				case 'filter':
					return removeServerFilter({});
				case '3':
				case 'directive':
					return removeServerDirective({});
				case '4':
				case 'theme':
					return removeServerTheme({});
			}
		});
	}
	var removeServerService = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				removeServerService(obj);
			});
		} else {
			getService(obj.part, function(name) {
				return require(__dirname + '/pm')
				.removeServerService(obj.part, name);
			});
		}
	}
	var removeServerFilter = function(obj){
		if(!obj.part){
			getPart(function(name){
				obj.part = name;
				removeServerFilter(obj);
			});
		}else{
			getFilter(obj.part, function(name){
				return require(__dirname + '/pm')
						.removeServerFilter(obj.part, name);
			});
		}
	}
	var removeServerDirective = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				removeServerDirective(obj);
			});
		} else {
			getDirective(obj.part, function(name) {
				return require(__dirname + '/pm')
				.removeServerDirective(obj.part, name);
			});
		}
	}
	var removeServerTheme = function(obj){
		if (!obj.part) {
			getPart(function(name) {
				obj.part = name;
				removeServerTheme(obj);
			});
		} else if (!obj.directive) {
			getDirective(obj.part, function(name) {
				obj.directive = name;
				removeServerTheme(obj);
			});
		} else {
			getTheme(obj.part, obj.directive, function(name) {
				return require(__dirname + '/pm')
				.removeServerTheme(obj.part, obj.directive, name);
			});
		}
	}
	module.exports.remove = function(){
		if(process.argv[3]){
			switch(process.argv[3].toLowerCase()){
				case 'server':
					switch(process.argv[4].toLowerCase()){
						case 'service':
							return require(__dirname+'/pm')
							.removeServerService(process.argv[5], process.argv[6]);
						case 'filter':
							return require(__dirname+'/pm')
							.removeServerFilter(process.argv[5], process.argv[6]);
						case 'directive':
							return require(__dirname+'/pm')
							.removeServerDirective(process.argv[5], process.argv[6]);
						case 'theme':
							return require(__dirname+'/pm')
							.removeServerTheme(process.argv[5], process.argv[6], process.argv[7]);
					};
					return console.log('Please select something to fetch in server side.');
				case 'service':
					return require(__dirname+'/pm')
					.removeService(process.argv[4], process.argv[5], process.argv[6]);
				case 'filter':
					return require(__dirname+'/pm')
					.removeFilter(process.argv[4], process.argv[5], process.argv[6]);
				case 'directive':
					return require(__dirname+'/pm')
					.removeDirective(process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
				case 'theme':
					return require(__dirname+'/pm')
					.removeTheme(process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
				default: 
					return console.log('Wrong Command.');
			}
		}else{
			getAddFetchOption({
				msg: 'What do you like to remove?',
				"1": 'Server'
			}, function(answer){
				switch (answer.toLowerCase()) {
					case '1':
					case 'server':
						return removeServer();
					case '2':
					case 'service':
						return removeService({});
					case '3':
					case 'filter':
						return removeFilter({});
					case '4':
					case 'directive':
					case '5':
					case 'theme':
						return removeDirective({});
				}
			});
		}
	};
/*
	waw create
*/
	module.exports.create = function(){
		console.log('called');
		if(process.argv[4]){
			
		}else require(__dirname+'/git').create(process.argv[3], function(){
			console.log('Successfully updated');
		});
	};
/*
	waw end of
*/
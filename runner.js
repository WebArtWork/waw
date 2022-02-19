const fs = require('fs');
module.exports = function(waw){
	waw.ensure = (folder, exists, is_component = true) => {
		if (waw.argv.length < 2) {
			console.log('Provide name');
			process.exit(0);
		}
		if (waw.argv[waw.argv.length - 1].endsWith('.git')) {
			waw.repo = waw.argv.pop();
		} else if (waw.argv[waw.argv.length - 1].split('-').length === 2) {
			waw.repo = waw.argv.pop();
			if (waw.argv.length === 1) {
				waw.argv.push(waw.repo.split('-')[1]);
			}
			waw.repo = 'https://github.com/WebArtWork/' + waw.repo + '.git';
		}
		waw.name = waw.argv[waw.argv.length - 1].toLowerCase();
		waw.Name = waw.name.slice(0, 1).toUpperCase() + waw.name.slice(1);
		if (waw.argv.length > 2) {
			waw.argv[1] = folder + '/' + waw.argv[1];
		}
		while (waw.argv.length > 2) {
			waw.argv[1] += '/' + waw.argv.splice(2, 1);
		}
		if (!fs.existsSync(process.cwd() + '/src/app/' + folder)) {
			fs.mkdirSync(process.cwd() + '/src/app/' + folder);
		}
		if (waw.argv[1].indexOf('/') >= 0) {
			waw.path = waw.argv[1];
			waw.name = waw.name.split('/').pop();
		} else {
			waw.path = folder + '/' + waw.argv[1];
		}
		waw.base = process.cwd() + '/src/app/' + waw.path;
		if (fs.existsSync(waw.base)) {
			console.log(exists);
			process.exit(0);
		}
		if (is_component) {
			waw.base += '/' + waw.name;
		}
		if (waw.repo) {
			fs.mkdirSync(waw.base);
			waw.fetch(waw.base, waw.repo, (err) => {
				if (err) console.log('Repository was not found');
				else console.log('Code is successfully installed');
				process.exit(1);
			});
		}
		return waw.repo;
	}
};

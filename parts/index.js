console.log('SERVER STARTS, is nice');
/*
*	Initialize
*/
	var git = require('gitty');
	var npmi = require('npmi');
	var sd = {
		fetch: function(){

		},
		npmi: function(path, dependency, version, cb){
			npmi({
				name: dependency,
				version: version,
				path: path,
				forceInstall: true,
				npmLoad: {
					loglevel: 'silent'
				}
			}, cb);
		},
		verify: {
			part: {}
		}
	};
/*
*	Create
*/
/*
*	Read
*/
/*
*	End of parts read
*/
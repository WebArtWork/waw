# wcom waw AngularJS common
Module which support waw project on basic level, elements and scripts which is needed on all projects.

[Mongo service](https://www.npmjs.com/package/wcom#mongo-service) provide connection between waw crud and everything that will be needed for mongo documents management.

[SD service](https://www.npmjs.com/package/wcom#sd-service) provide collection of functions for general use.

[Modal service](https://www.npmjs.com/package/wcom#modal-service) handling everything that has to be added into modal or alert.

[Popup service](https://www.npmjs.com/package/wcom#popup-service) handling everything that has to be managed as popup on something else.

[Spinner service](https://www.npmjs.com/package/wcom#spinner-service) take care of all loading pieces.

[File service](https://www.npmjs.com/package/wcom#file-service) managing file process, from load any type from user to sent it to server.

[Socket service](https://www.npmjs.com/package/wcom#socket-service) handling the sockets management with server and other clients.

[Image service](https://www.npmjs.com/package/wcom#image-service) take care of everything around pictures on the client side.

[Hash service](https://www.npmjs.com/package/wcom#hash-service) with use of href hash, provide memo sharable points for modals or popups.

Installation:
```bash
$ npm i --save wcom
```

## Mongo Service
Mongo Service is an suportive service for combinating AngularJS client with waw CRUD back-end. Example of injecting mongo service:
```javasript
services.user = function(mongo){}
angular.service('user', function(mongo){});

```
### create `function`
connecting with waw CRUD create. As parameters accepting name of mongo collection, object with values for document and optionally callback function which will return the document. Document will be filled inside read callbacks. Example:
```javascript
mongo.create('colName', {
	    name: doc.name
}, function(created) {
	    console.log('document has been created');
});
``` 
### read `function`
connecting with waw CRUD read. As parameters accepting name of mongo collection, optionally options, optionally callback which will return all documents in array as first parameter and in object with doc._id placeholder for doc as second parameter. Function returning directing array which will host the documents. Example:
```javascript
mongo.get('colName',{
	replace: {
		name: function(val, cb, doc){
			cb(val+'_modified')
		}
	},
	name: 'me',
	next: {
		name: 'friends',
		next: {
			name: 'near',
			next: {
				name: 'city',
				next: {
					name: 'country'
				}
			}
		}
	},
	populate: [{
		field: 'author',
		part: 'user'
	}],
	groups: 'city name' || ['city', 'name'] || {
		first_name: {
			field: function(doc, cb){
				if(doc.name.split(' ').length>1) cb(doc.name.split(' ')[1]);
				retun doc.name.split(' ')[0];
			},
			allow: function(doc){
				return !!doc.name;
			},
			ignore: function(){
				return false;
			},
			sort: function(){

			}
		}
	},
	query: {
		male: function(doc){
			return doc.gender;
		},
		female: {
			allow: function(doc){
				return !doc.gender;
			},
			ignore: function(){
				return typeof doc.gender != 'boolean';
			},
			sort: function(a, b){
				if(a.order > b.order) return -1;
				return 1;
			}
		}
	}
}, (arr, obj, name, resp) => {
/*
*	arr will be array with total docs from that part
*	obj will be object with total docs from that part binded by _id
*	groups will be saved into obj in the way: obj.name['Denys'] or obj.city['Kiev']
*	name is the name of current pull from server
*	resp is the array of responsinse with documents queried
*/
})
```
#### replace `options`
work as filler of each doc for cases when we can calculate things to use in website. Good example can be currencies which change each moment, we have product in one currency and we want to show it in different currrencies. Other good example can be date fields, which is saved as string and we need them in `new Date()` format.
#### populate `options`
works in the same way as populate of mongodb but in the client side. This works great when you need documents inside other documents and put on them sorting or other things.
#### groups `options`
makings arrays which show different documents inside specific placeholders. As example we can have list of users in specific town or country, so we don't have to create pipes for that.
#### next `options`
works as level of pulling different documents from the server. This is mostly made for performance, so user can have the info he needs directly.
### updateAll `function`
connecting with waw CRUD updateAll. As parameters accepting name of mongo collection, document object, optionally options and optionally callback function which will return the document. Example:
```javascript
mongo.updateAll('colName', {
		name: doc.name,
		_id: doc._id
}, {
		fields: 'name'
}, function() {
		console.log('document is updated');
});
``` 
### updateUnique `function`
connecting with waw CRUD updateUnique. As parameters accepting name of mongo collection, object with document _id and field value, optionally options and optionally callback function which will return if field has been updated. Example:
```javasript
mongo.updateUnique('colName', {
	name: doc.name,
	_id: doc._id
}, {
	name: 'name'
}, function(resp) {
	    if(resp){
	   		console.log('field updated');
		} else {
	   		console.log("field not updated");
		}
});
```
### delete `function`
connecting with waw CRUD delete. As parameters accepting name of mongo collection, document object, optionally options and optionally callback function which will return the document. Example:
```javascript
mongo.delete('colName', {
		_id: doc._id
}, {
		name: 'admin'
}, function() {
		console.log('document is updated');
});
``` 
### _id `function`
provide new mongo _id. As parameters accepting callback function which will return the _id. Example:
```javascript
mongo._id(function(_id){
    	console.log(_id);
});
```
### to_id `function`
convert array of documents, object with documents, mixed documents or _id and converting it to array of _id. Example:
```javasript
mongo.to_id([{
		_id: '1'
}, '2'
//['1','2']
mongo.to_id({
	'1': true
	'2': false
});
// ['1']
```
### afterWhile `function`
provide delay on any action, usefull with input and model change. As parameters accepting document, callback and optionally time. Example:
```javascript
mongo.afterWhile(doc, function() {
    	console.log('text was writen');
}, 2000)
```
### populate `function`
making population on specific field with specific collection. Example with doc which will have field as document of part provided:
```javasript
mongo.populate(doc, 'field', 'colName');
```
### on `function`
accepting array or string of parts and callback which will be called when all parts will be loaded.

```javasript
mongo.on('user post', function(){
	console.log('user and post part has been loaded');
});
```
### beArr `function`
checking value if it's array then we keep it and in other case, we replace it with new array. Example where each doc will have data as array:
```javasript
mongo.get('colName', {
	replace: {
	   	'data': mongo.beArr
    }
});
```
### beObj `function`
checking value if it's object then we keep it and in other case, we replace it with new object. Example where each doc will have data as array:
```javasript
mongo.get('colName', {
	replace: {
	   'data': mongo.beObj
    }
});

```
### forceArr `function`
convert any value to array within replace options. Example where each doc will have data as empty array:
```javasript
mongo.get('colName', {
	replace: {
	   'data': mongo.forceArr
    }
});
```
### forceObj `function`
convert any value to object within replace options. Example where each doc will have data as empty object:
```javasript
mongo.get('colName', {
	replace: {
	   	'data': mongo.forceObj
    }
});
```
## SD Service
## Modal Service
The basic service for adding and closing modals. Example where we opening modal from file:
```javascript
modal.open({
	templateUrl: '/html/modal/file.html',
	name: 'John'
});
```
Example where we opening modal from HTML code:
```javasript
modal.open({
	template: '<div>{{name}}</div>',
	name: 'John'
});
```
Example how to use the object we are passing:
```html
<div>{{name}}</div>
```
Example where we closing modal inside modal html cope:
```html
<button ng-click="close();">Cancel</button>
```

## Popup Service
## Spinner Service
service for adding and closing spinners. Example where we creating spinner:
```javasript
spinner.open({
	name: 'John'
});

```
Example where we closing spinner:
```javascript
spinner.close();
```
## File Service
service can do three functions. Such as, take files from User, load dataUrl of images, and upload file to server. 
Example where we taking image, loading its dataUrl and uploading to server:
```javascript
file.add({
	id:'idForLabel',
	width: 500,
	height: 500
}, function(dataUrl) {
	console.log('DataUrl length:', dataUrl.length);
});
```
Example where we taking any file:
```javascript
file.add({
	id:'idForLabel'
}, function(file) {
	console.log(file);
});
```
## Socket Service
## Image Service
## Hash Service
## License

 [MIT](LICENSE)
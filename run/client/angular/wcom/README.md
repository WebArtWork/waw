# WCOM plugin
## File Management
```
fm.add({
	_id: 'addImageID',
	width: 1920,
	height: 1080,
	multiple: true
}, function(dataUrl, file) {
	// manage dataUrl or file, if multiple callback will be called as much times as files given.
});
```


## Filters
### toArr
Make an array from string, usefull in case of tags when you divide them with coma.
```
<div for="tag in tags|toArr">
// when tags have value like 'life, do it, awesomeness'
```
If you have different divider then coma, you can use
```
<div for="tag in tags|toArr:'|'">
// when tags have value like 'life|do it|awesomeness'
```
### mongodate
Make date from mongo doc id.
```
<div>{{doc._id|mongodate}}</div>
// return Date object, in fact usefull with other filters
```
### fixlink
When users provide url for some source in internet, you probably want to make that link, this filter make that happen.
```
<a ng-href="{{link|fixlink}}"></a>
// check if it has http, if not, add it.
```
### wdate
It provide an beatiful date, for messages, comments and other things. An awesome example is to use it with mongodate.
```
<div>{{doc._id|mongodate|wdate}}</div>
// return beautiful date
```

## Directives
### elsize
Provide size of element, require an object.
```
<div elsize='size'>An container</div>
<span>{{size}}</span>
//inner span = {width: 50, height: 150}
```


## Socket management
An service which create an socket connection if project has included sockets.io. Returning that connection, as factory.
## Ctrl management
this.on will get which action should be listened, and will save the callback for listening.
```
ctrl.on(['right','enter','space'], function(){
	// an action when that button will be called.
});
```
## Image management
this.fileToDataUrl provide you dataUrl from an image handler.
```
img.fileToDataUrl(file, function(dataUrl) {
	// use dataurl as you need.
});
```
this.resizeUpTo making image smaller, to the limit you set up.
```
img.resizeUpTo({
	file: file,
	width: opts.width||1920,
	height: opts.height||1080
}, function(dataUrl) {
	// new dataUrl, resized image.
});
```
## Mongo management

this.push
this.unshift
this.get
this.use
this.run
this.fill
this.populate
this.create
this.update
this.updateAll
this.updateAfterWhile
this.delete
// doc fill
this.beArray

```
this.posts = mongo.get('post');
this.create = function(obj, callback){
	mongo.create('post', obj, callback);
}
this.update = function(obj, callback){
	mongo.update('post', obj, callback);
}
this.updateAfterWhile = function(obj, callback){
	mongo.updateAfterWhile('post', obj, callback);
}
this.delete = function(obj, callback){
	mongo.delete('post', obj, callback);
}
```
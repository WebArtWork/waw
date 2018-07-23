app.service('CAPITALNAME', ['mongo', function(mongo){
	this.ARRAYNAME = mongo.get('PARTNAME');
	this.create =OBJECTNAME => {
		mongo.create('PARTNAME', OBJECTNAME);
	}
	this.get =OBJECTNAME => {
		mongo.getOne('PARTNAME', OBJECTNAME);
	}
	this.update =OBJECTNAME => {
		mongo.afterWhile(OBJECTNAME, ()=>{
			mongo.updateAll('PARTNAME', OBJECTNAME);
		});
	}
	this.delete =OBJECTNAME => {
		mongo.delete('PARTNAME', OBJECTNAME);
	}
}]);
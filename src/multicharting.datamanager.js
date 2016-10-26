
var	dataStore = {},
	idCount = 0,
	dataManager = function (JSONData, id) {
    	var manager = this;
    	manager.addData(JSONData, id);
	},
	proto = dataManager.prototype;

proto.addData = function (JSONData, id) {
	var manager = this,
		oldId = manager.id;

	id = oldId ? oldId : (id || 'dataStore' + idCount ++);
	dataStore[id] = JSONData;
	manager.id = id;
};

proto.getData = function (filters) {
	var data,
		result = [];

	for (data in dataStore) {
		result.push(filters(dataStore[data]));
	}
	return result;
};

proto.deleteData = function () {
	delete dataStore[this.id];
};



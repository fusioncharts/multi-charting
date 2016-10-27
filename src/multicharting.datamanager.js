
var	dataStore = {},
	idCount = 0,
	// Constructor class for dataManager.
	dataManager = function (JSONData, id) {
    	var manager = this;
    	manager.addData(JSONData, id);
	},
	proto = dataManager.prototype;

// Function to add data in the data store
proto.addData = function (JSONData, id) {
	var manager = this,
		oldId = manager.id;

	id = oldId ? oldId : (id || 'dataStore' + idCount ++);
	dataStore[id] = JSONData;
	manager.id = id;
};

// Function to get data from the data store after applying filters
proto.getData = function (filters) {
	var data,
		result = [];

	for (data in dataStore) {
		result.push(filters(dataStore[data]));
	}
	return result;
};

// Function to delete the current data from the datastore
proto.deleteData = function () {
	delete dataStore[this.id];
};

// Function to get the id of the current data
proto.getID = function () {
	return this.id;
};



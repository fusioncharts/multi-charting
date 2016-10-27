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
		oldId = manager.id,
		oldJSONData = dataStore[oldId] || [];

	if (oldId && id) {
		dataStore[id] = oldJSONData.concat(JSONData || []);
		manager.deleteData();
		manager.id = id;
	}
	else {
		id = oldId ? oldId : (id || 'dataStore' + idCount ++);
		dataStore[id] = oldJSONData.concat(JSONData || []);
		manager.id = id;
	}
};

// Function to get data from the data store after applying filters
proto.getData = function (filters) {
	return (filters && filters(dataStore[this.id]));
};

// Function to delete the current data from the datastore
proto.deleteData = function () {
	return (delete dataStore[this.id]);
};

// Function to get the id of the current data
proto.getID = function () {
	return this.id;
};

// Function to modify data
proto.modifyData = function (JSONData, id) {
	var manager = this;
	manager.deleteData();
	manager.addData(JSONData, id);
};
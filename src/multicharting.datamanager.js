var	dataStore = {},
	linkStore = {},
	idCount = 0,
	// Constructor class for dataManager.
	dataManager = function (JSONData, id) {
    	var manager = this;
    	manager.addData(JSONData, id);
	},
	proto = dataManager.prototype,
	updataData = function (id) {
		var i,
			linkData = linkStore[id],
			parentData = datastore[id],
			len = linkData.length,
			info;

		for (i = 0; i < len; i++) {
			info = linkData[i];

			linkId = info.link;
			filter = info.filter;

			datastore[linkId] = filter(parentData);

			if (linkStore[linkId]) {
				updataData(linkId);
			}
		}
	};

// Function to add data in the data store
proto.addData = function (JSONData, id) {
	var data = this,
		oldId = data.id,
		oldJSONData = dataStore[oldId] || [];

	if (oldId && id) {
		dataStore[id] = oldJSONData.concat(JSONData || []);
		delete dataStore[oldId];

		if (linkStore[oldId]) {
			linkStore[id] = linkStore[oldId];
			delete linkStore[oldId];
		}
	}
	else {
		id = oldId ? oldId : (id || 'dataStore' + idCount ++);
		dataStore[id] = oldJSONData.concat(JSONData || []);
	}
	data.id = id;

	if (linkStore[id]) {
		updataData(id)
	}
};

// Function to get data from the data store after applying filters
proto.getData = function (filters) {
	var data = this,
		id = data.id;
	// If no parameter is present then return the unfiltered data.
	if (!filters) {
		return dataStore[id];
	}
	// If parameter is an array of filter then return the filtered data after applying the filter over the data.
	else if (filters instanceof Array) {
		let result = [],
			i,
			newData,
			linkData,
			newId,
			len = filters.length;

		for (i = 0; i < len; i++) {
			newData = new dataManager(filters[i](dataStore[id]));
			newId = newData.id;

			dataStore[newId] = newData;
			result.push(newData);

			//Pushing the id of child class in the parent classes.
			linkData = linkStore[id] || (linkStore[id] = {
				link : [],
				filter : []
			});
			linkData.link.push(newId);
			linkData.filter.push(filters[i]);

			// setting the current id as the newID so that the next filter is applied on the child data;
			id = newId;
		}
		return result;
	}
};

// Function to delete the current data from the datastore and also all its childs recursively
proto.deleteData = function () {
	var data = this;
		id = data.id;
		linkData = linkStore[id];

	if (linkData) {
		let i,
			len = linkData.length;
		for (i = 0; i < len; i ++) {
			data.deleteData(linkData[i]);
		}
		delete linkStore[id];
	}
	return (delete dataStore[id]);
};

// Function to get the id of the current data
proto.getID = function () {
	return this.id;
};

// Function to modify data
proto.modifyData = function (JSONData, id) {
	var data = this,
		id = data.id;

	dataStore[id] = [];
	data.addData(JSONData, id);
};
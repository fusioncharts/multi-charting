var filterStore = {},
	filterLink = {},
	filterIdCount = 0,
	// Constructor class for dataProcessor.
	dataProcessor = function (filter, id, type) {
    	var manager = this;
    	manager.addCustomFilter(filter, id, type);
	},
	filterProto = dataProcessor.prototype,

	// Function to update data on change of filter.
	updataFilterData = function (id, copyParentToChild) {
		var i,
			data = filterLink[id],
			JSONData,
			datum,
			dataId,
			len = data.length;

		for (i = 0; i < len; i ++) {
			datum = data[i];
			dataId = datum.id;
			if (!tempDataUpdated[dataId]) {
				if (parentStore[dataId] && dataStore[dataId]) {
					JSONData = parentStore[dataId].getData();
					datum.modifyData(copyParentToChild ? JSONData : filterStore[id](JSONData));
				}
				else {
					delete parentStore[dataId];
				}
			}
		}
		tempDataUpdated = {};
	};

// Function to add filter in the filter store
filterProto.addCustomFilter = function (filterFn, id, type) {
	var filter = this,
		oldId = filter.id;

	id = oldId || id || 'filterStore' + filterIdCount ++;
	filterStore[id] = filterFn;

	filter.id = id;
	filter.type = type;

	// Update the data on which the filter is applied and also on the child data.
	if (filterLink[id]) {
		updataFilterData(id);
	}

	dispatchEvent(new CustomEvent('filterAdded', {'detail' : {
		'id': id,
		'filter' : filterFn
	}}));
};

// Funtion to get the filter method.
filterProto.getFilter = function () {
	return filterStore[this.id];
};

// Function to get the ID of the filter.
filterProto.getID = function () {
	return this.id;
};


filterProto.deleteFilter = function () {
	var filter = this,
		id = filter.id;

	filterLink[id] && updataFilterData(id, true);

	delete filterStore[id];
	delete filterLink[id];
};

filterProto.filter = function (filterFn, id) {
	this.addCustomFilter(filterFn, id, 'filter');
};

filterProto.sort = function (filterFn, id) {
	this.addCustomFilter(filterFn, id, 'sort');
};

filterProto.addInfo = function (filterFn, id) {
	this.addCustomFilter(filterFn, id, 'addInfo');
};

filterProto.reExpress = function (filterFn, id) {
	this.addCustomFilter(filterFn, id, 'reExpress');
};


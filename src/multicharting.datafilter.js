var filterStore = {},
	filterLink = {},
	filterIdCount = 0,
	// Constructor class for dataFilter.
	dataFilter = function (filter, id) {
    	var manager = this;
    	manager.addFilter(filter, id);
	},
	filterProto = dataFilter.prototype,

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
filterProto.addFilter = function (filterFn, id) {
	var filter = this,
		oldId = filter.id;

	id = oldId || id || 'filterStore' + filterIdCount ++;
	filterStore[id] = filterFn;

	filter.id = id;

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
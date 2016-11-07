var filterStore = {},
	filterLink = {},
	filterIdCount = 0,
	// Constructor class for dataProcessor.
	dataProcessor = function () {
    	var manager = this;
    	manager.addRule(arguments);
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
filterProto.addRule = function () {
	var filter = this,
		oldId = filter.id,
		argument = arguments[0],
		filterFn = argument.rule,
		id = argument.type,
		type = argument.type;

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

filterProto.filter = function () {
	this.addRule(
		{	rule : arguments[0],
			type : 'filter'
		}
	);
};

filterProto.sort = function () {
	this.addRule(
		{	rule : arguments[0],
			type : 'sort'
		}
	);
};

filterProto.addInfo = function () {
	this.addRule(
		{	rule : arguments[0],
			type : 'addInfo'
		}
	);
};

filterProto.reExpress = function () {
	this.addRule(
		{	rule : arguments[0],
			type : 'reExpress'
		}
	);
};


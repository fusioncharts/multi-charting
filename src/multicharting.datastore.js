
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	MultiCharting.prototype.createDataStore = function () {
		return new DataStore(arguments);
	};

	var	lib = MultiCharting.prototype.lib,
		dataStorage = lib.dataStorage = {},
		// For storing the child of a parent
		linkStore = {},
		//For storing the parent of a child
		parentStore = lib.parentStore = {},
		idCount = 0,
		// Constructor class for DataStore.
		DataStore = function () {
	    	var manager = this;
	    	manager.uniqueValues = {};
	    	manager.setData(arguments);
		},
		dataStoreProto = DataStore.prototype,

		//Function to update all the linked child data
		updataData = function (id) {
			var i,
				linkData = linkStore[id],
				parentData = dataStorage[id],
				filterStore = lib.filterStore,
				len,
				linkIds,
				filters,
				linkId,
				filter,
				filterFn,
				type,
				info,
				// Store all the dataObjs that are updated.
				tempDataUpdated = lib.tempDataUpdated = {};

			linkIds = linkData.link;
			filters = linkData.filter;
			len = linkIds.length;

			for (i = 0; i < len; i++) {
				linkId = linkIds[i];

				tempDataUpdated[linkId] = true;
				filter = filters[i];
				filterFn = filter.getFilter();
				type = filter.type;

				if (typeof filterFn === 'function') {
					if (filterStore[filter.id]) {
						dataStorage[linkId] = executeProcessor(type, filterFn, parentData);
					}
					else {
						dataStorage[linkId] = parentData;
						filter.splice(i, 1);
						i -= 1;
					}
				}
				
				if (linkStore[linkId]) {
					updataData(linkId);
				}
			}
		},

		// Function to execute the dataProcessor over the data
		executeProcessor = function (type, filterFn, JSONData) {
			switch (type) {
				case  'sort' : return Array.prototype.sort.call(JSONData, filterFn);
					break;
				case  'filter' : return Array.prototype.filter.call(JSONData, filterFn);
					break;
				case 'addInfo' :
				case 'reExpress' : return Array.prototype.map.call(JSONData, filterFn);
					break;
				default : return filterFn(JSONData);
			}
		},

		//Function to convert/get raw data into JSON data
		parseData = function (dataSpecs) {
			var	dataSource = dataSpecs.dataSource,
				dataType = dataSpecs.dataType,
				JSONData;

			switch(dataType) {
				case 'csv' : 
					break;
				case 'json' : 
				default : JSONData = dataSource;
			};

			return JSONData;
		};

	// Function to add data in the data store
	dataStoreProto.setData = function () {
		var data = this,
			oldId = data.id,
			argument = arguments[0],
			id = argument.id,
			oldJSONData = dataStorage[oldId] || [],
			JSONData = parseData(argument);

		id = oldId || id || 'dataStorage' + idCount ++;
		dataStorage[id] = oldJSONData.concat(JSONData || []);

		data.id = id;

		if (linkStore[id]) {
			updataData(id)
		}
		dispatchEvent(new CustomEvent('dataAdded', {'detail' : {
			'id': id,
			'data' : JSONData
		}}));
	};

	// Function to get the jsondata of the data object
	dataStoreProto.getJSON = function () {
		return dataStorage[this.id];
	};

	// Function to get child data object after applying filter on the parent data.
	// @params {filters} - This can be a filter function or an array of filter functions.
	dataStoreProto.getData = function (filters) {
		var data = this,
			id = data.id,
			filterLink = lib.filterLink;
		// If no parameter is present then return the unfiltered data.
		if (!filters) {
			return dataStorage[id];
		}
		// If parameter is an array of filter then return the filtered data after applying the filter over the data.
		else {
			let result = [],
				i,
				newData,
				linkData,
				newId,
				filter,
				filterFn,
				datalinks,
				filterID,
				type,
				isFilterArray = filters instanceof Array,
				len = isFilterArray ? filters.length : 1;

			for (i = 0; i < len; i++) {
				filter = filters[i] || filters;
				filterFn = filter.getFilter();
				type = filter.type;

				if (typeof filterFn === 'function') {
					newData = executeProcessor(type, filterFn, dataStorage[id]);

					newDataObj = new DataStore(newData);
					newId = newDataObj.id;
					parentStore[newId] = data;

					dataStorage[newId] = newData;
					result.push(newDataObj);

					//Pushing the id and filter of child class under the parent classes id.
					linkData = linkStore[id] || (linkStore[id] = {
						link : [],
						filter : []
					});
					linkData.link.push(newId);
					linkData.filter.push(filter);

					// Storing the data on which the filter is applied under the filter id.
					filterID = filter.getID();
					datalinks = filterLink[filterID] || (filterLink[filterID] = []);
					datalinks.push(newDataObj)

					// setting the current id as the newID so that the next filter is applied on the child data;
					id = newId;
					data = newDataObj;
				}
			}
			return (isFilterArray ? result : result[0]);
		}
	};

	// Function to delete the current data from the dataStorage and also all its childs recursively
	dataStoreProto.deleteData = function (optionalId) {
		var data = this,
			id = optionalId || data.id,
			linkData = linkStore[id],
			flag;

		if (linkData) {
			let i,
				link = linkData.link,
				len = link.length;
			for (i = 0; i < len; i ++) {
				data.deleteData(link[i]);
			}
			delete linkStore[id];
		}

		flag = delete dataStorage[id];
		dispatchEvent(new CustomEvent('dataDeleted', {'detail' : {
			'id': id,
		}}));
		return flag;
	};

	// Function to get the id of the current data
	dataStoreProto.getID = function () {
		return this.id;
	};

	// Function to modify data
	dataStoreProto.modifyData = function () {
		var data = this;

		dataStorage[id] = [];
		data.setData(arguments);
		dispatchEvent(new CustomEvent('dataModified', {'detail' : {
			'id': data.id
		}}));
	};

	// Function to add data to the dataStorage asynchronously via ajax
	dataStoreProto.setDataUrl = function () {
		var data = this,
			argument = arguments[0],
			dataSource = argument.dataSource,
			dataType = argument.dataType,
			callback = argument.callback,
			callbackArgs = argument.callbackArgs,
			JSONData;

		ajax = MultiCharting.prototype.ajax({
			url : dataSource,
			success : function(JSONString){
				JSONData = JSON.parse(JSONString);
				data.setData({
					dataSource : JSONData
				});

				if (typeof callback === 'function') {
					callback(callbackArgs);
				}
			},

			error : function(){
				if (typeof callback === 'function') {
					callback(callbackArgs);
				}
			}
		});
	};

	// Funtion to get all the keys of the JSON data
	dataStoreProto.getKey = function () {
		var dataStore = this,
			data = dataStorage[dataStore.id],
			internalData = data[0],
			dataType = typeof internalData,
			keys = dataStore.keys;

		if (keys) {
			return keys;
		}
		if (dataType === 'array') {
			return (dataStore.keys = internalData);
		}
		else if (dataType === 'object') {
			return (dataStore.keys = Object.keys(internalData));
		}
	};

	// Funtion to get all the unique values corresponding to a key
	dataStoreProto.getUniqueValues = function (key) {
		var dataStore = this,
			data = dataStorage[dataStore.id],
			internalData = data[0],
			isArray = typeof internalData === 'array',
			uniqueValues = dataStore.uniqueValues[key],
			tempUniqueValues = {},
			len = data.length,
			i;

		if (uniqueValues) {
			return uniqueValues;
		}

		for (i = isArray ? 1 : 0; i < len; i++) {
			internalData = isArray === 'array' ? data[key][i] : data[i][key];
			!tempUniqueValues[internalData] && (tempUniqueValues[internalData] = true);
		}

		return (dataStore.uniqueValues[key] = Object.keys(tempUniqueValues));
	};
});
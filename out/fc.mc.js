/**
 * MultiCharting Extension for FusionCharts
 * This module contains the basic routines required by subsequent modules to
 * extend/scale or add functionality to the MultiCharting object.
 *
 */

(function (env, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = env.document ?
            factory(env) : function(win) {
                if (!win.document) {
                    throw new Error("Window with document not present");
                }
                return factory(win, true);
            };
    } else {
        env.MultiCharting = factory(env, true);
    }
})(typeof window !== 'undefined' ? window : this, function (_window, windowExists) {
    // In case MultiCharting already exists.
    if (_window.MultiCharting) {
        return;
    }

	var MultiCharting = function () {
	};


	return MultiCharting;
});


(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	var extend2 = function (obj1, obj2, skipUndef) {
            var OBJECTSTRING = 'object';
            //if none of the arguments are object then return back
            if (typeof obj1 !== OBJECTSTRING && typeof obj2 !== OBJECTSTRING) {
                return null;
            }

            if (typeof obj2 !== OBJECTSTRING || obj2 === null) {
                return obj1;
            }

            if (typeof obj1 !== OBJECTSTRING) {
                obj1 = obj2 instanceof Array ? [] : {};
            }
            merge(obj1, obj2, skipUndef);
            return obj1;
        },
        merge = function (obj1, obj2, skipUndef, tgtArr, srcArr) {
            var item,
                srcVal,
                tgtVal,
                str,
                cRef,
                objectToStrFn = Object.prototype.toString,
                arrayToStr = '[object Array]',
                objectToStr = '[object Object]',
                checkCyclicRef = function(obj, parentArr) {
                    var i = parentArr.length,
                        bIndex = -1;

                    while (i--) {
                        if (obj === parentArr[i]) {
                            bIndex = i;
                            return bIndex;
                        }
                    }

                    return bIndex;
                },
                OBJECTSTRING = 'object';

            //check whether obj2 is an array
            //if array then iterate through it's index
            //**** MOOTOOLS precution

            if (!srcArr) {
                tgtArr = [obj1];
                srcArr = [obj2];
            }
            else {
                tgtArr.push(obj1);
                srcArr.push(obj2);
            }

            if (obj2 instanceof Array) {
                for (item = 0; item < obj2.length; item += 1) {
                    try {
                        srcVal = obj1[item];
                        tgtVal = obj2[item];
                    }
                    catch (e) {
                        continue;
                    }

                    if (typeof tgtVal !== OBJECTSTRING) {
                        if (!(skipUndef && tgtVal === undefined)) {
                            obj1[item] = tgtVal;
                        }
                    }
                    else {
                        if (srcVal === null || typeof srcVal !== OBJECTSTRING) {
                            srcVal = obj1[item] = tgtVal instanceof Array ? [] : {};
                        }
                        cRef = checkCyclicRef(tgtVal, srcArr);
                        if (cRef !== -1) {
                            srcVal = obj1[item] = tgtArr[cRef];
                        }
                        else {
                            merge(srcVal, tgtVal, skipUndef, tgtArr, srcArr);
                        }
                    }
                }
            }
            else {
                for (item in obj2) {
                    try {
                        srcVal = obj1[item];
                        tgtVal = obj2[item];
                    }
                    catch (e) {
                        continue;
                    }

                    if (tgtVal !== null && typeof tgtVal === OBJECTSTRING) {
                        // Fix for issue BUG: FWXT-602
                        // IE < 9 Object.prototype.toString.call(null) gives
                        // '[object Object]' instead of '[object Null]'
                        // that's why null value becomes Object in IE < 9
                        str = objectToStrFn.call(tgtVal);
                        if (str === objectToStr) {
                            if (srcVal === null || typeof srcVal !== OBJECTSTRING) {
                                srcVal = obj1[item] = {};
                            }
                            cRef = checkCyclicRef(tgtVal, srcArr);
                            if (cRef !== -1) {
                                srcVal = obj1[item] = tgtArr[cRef];
                            }
                            else {
                                merge(srcVal, tgtVal, skipUndef, tgtArr, srcArr);
                            }
                        }
                        else if (str === arrayToStr) {
                            if (srcVal === null || !(srcVal instanceof Array)) {
                                srcVal = obj1[item] = [];
                            }
                            cRef = checkCyclicRef(tgtVal, srcArr);
                            if (cRef !== -1) {
                                srcVal = obj1[item] = tgtArr[cRef];
                            }
                            else {
                                merge(srcVal, tgtVal, skipUndef, tgtArr, srcArr);
                            }
                        }
                        else {
                            obj1[item] = tgtVal;
                        }
                    }
                    else {
                        obj1[item] = tgtVal;
                    }
                }
            }
            return obj1;
        },
        lib = {
            extend2: extend2,
            merge: merge
        };

	MultiCharting.prototype.lib = (MultiCharting.prototype.lib || lib);

});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	MultiCharting.prototype.createDataStore = function () {
		return new dataStorage(arguments);
	};

	var	lib = MultiCharting.prototype.lib,
		dataStore = lib.dataStore = {},
		// For storing the child of a parent
		linkStore = {},
		//For storing the parent of a child
		parentStore = lib.parentStore = {},
		idCount = 0,
		// Constructor class for dataStorage.
		dataStorage = function () {
	    	var manager = this;
	    	manager.addData(arguments);
		},
		dataStoreProto = dataStorage.prototype,

		//Function to update all the linked child data
		updataData = function (id) {
			var i,
				linkData = linkStore[id],
				parentData = dataStore[id],
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
						dataStore[linkId] = executeProcessor(type, filterFn, parentData);
					}
					else {
						dataStore[linkId] = parentData;
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
				case 'jsonurl' : 
					break;
				case 'csv' : 
					break;
				case 'csvurl' : 
					break;
				case 'json' : 
				default : JSONData = dataSource;
			};

			return JSONData;
		};

	// Function to add data in the data store
	dataStoreProto.addData = function () {
		var data = this,
			oldId = data.id,
			argument = arguments[0],
			id = argument.id,
			oldJSONData = dataStore[oldId] || [],
			JSONData = parseData(argument);

		id = oldId || id || 'dataStore' + idCount ++;
		dataStore[id] = oldJSONData.concat(JSONData || []);

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
		return dataStore[this.id];
	};

	// Function to get child data object after applying filter on the parent data.
	// @params {filters} - This can be a filter function or an array of filter functions.
	dataStoreProto.getData = function (filters) {
		var data = this,
			id = data.id,
			filterLink = lib.filterLink;
		// If no parameter is present then return the unfiltered data.
		if (!filters) {
			return dataStore[id];
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
					newData = executeProcessor(type, filterFn, dataStore[id]);

					newDataObj = new dataStorage(newData);
					newId = newDataObj.id;
					parentStore[newId] = data;

					dataStore[newId] = newData;
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

	// Function to delete the current data from the datastore and also all its childs recursively
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

		flag = delete dataStore[id];
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

		dataStore[id] = [];
		data.addData(arguments);
		dispatchEvent(new CustomEvent('dataModified', {'detail' : {
			'id': data.id
		}}));
	};
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	MultiCharting.prototype.createDataProcessor = function () {
		return new dataProcessor(arguments);
	};

	var lib = MultiCharting.prototype.lib,
		filterStore = lib.filterStore = {},
		filterLink = lib.filterLink = {},
		filterIdCount = 0,
		dataStore = lib.dataStore,
		parentStore = lib.parentStore,
		
		// Constructor class for dataProcessor.
		dataProcessor = function () {
	    	var manager = this;
	    	manager.addRule(arguments);
		},
		
		dataProcessorProto = dataProcessor.prototype,

		// Function to update data on change of filter.
		updataFilterProcessor = function (id, copyParentToChild) {
			var i,
				data = filterLink[id],
				JSONData,
				datum,
				dataId,
				len = data.length;

			for (i = 0; i < len; i ++) {
				datum = data[i];
				dataId = datum.id;
				if (!lib.tempDataUpdated[dataId]) {
					if (parentStore[dataId] && dataStore[dataId]) {
						JSONData = parentStore[dataId].getData();
						datum.modifyData(copyParentToChild ? JSONData : filterStore[id](JSONData));
					}
					else {
						delete parentStore[dataId];
					}
				}
			}
			lib.tempDataUpdated = {};
		};

	// Function to add filter in the filter store
	dataProcessorProto.addRule = function () {
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
			updataFilterProcessor(id);
		}

		dispatchEvent(new CustomEvent('filterAdded', {'detail' : {
			'id': id,
			'filter' : filterFn
		}}));
	};

	// Funtion to get the filter method.
	dataProcessorProto.getFilter = function () {
		return filterStore[this.id];
	};

	// Function to get the ID of the filter.
	dataProcessorProto.getID = function () {
		return this.id;
	};


	dataProcessorProto.deleteFilter = function () {
		var filter = this,
			id = filter.id;

		filterLink[id] && updataFilterProcessor(id, true);

		delete filterStore[id];
		delete filterLink[id];
	};

	dataProcessorProto.filter = function () {
		this.addRule(
			{	rule : arguments[0],
				type : 'filter'
			}
		);
	};

	dataProcessorProto.sort = function () {
		this.addRule(
			{	rule : arguments[0],
				type : 'sort'
			}
		);
	};

	dataProcessorProto.addInfo = function () {
		this.addRule(
			{	rule : arguments[0],
				type : 'addInfo'
			}
		);
	};

	dataProcessorProto.reExpress = function () {
		this.addRule(
			{	rule : arguments[0],
				type : 'reExpress'
			}
		);
	};
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.dataadapter = function () {
        return convertData(arguments[0]);
    };
    var extend2 = MultiCharting.prototype.lib.extend2;
    //function to convert data, it returns fc supported JSON
    function convertData() {
        var argument = arguments[0] || {},
            jsonData = argument.jsonData,
            configuration = argument.config,
            callbackFN = argument.callbackFN,
            jsonCreator = function(jsonData, configuration) {
                var conf = configuration,
                    seriesType = conf && conf.seriesType,
                    series = {
                        'ms' : function(jsonData, configuration) {
                            var json = {},
                                indexMatch,
                                lenDimension,
                                lenMeasure,
                                lenData,
                                i,
                                j;
                            json.categories = [
                                {
                                    "category": [                        
                                    ]
                                }
                            ];
                            json.dataset = [];
                            for (i = 0, lenDimension =  configuration.dimension.length; i < lenDimension; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.dimension[i]);
                                if (indexMatch != -1) {
                                    for (j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.categories[0].category.push({
                                            'label' : jsonData[j][indexMatch]
                                        });
                                    }
                                }
                            }
                            json.dataset = [];
                            for (i = 0, lenMeasure = configuration.measure.length; i < lenMeasure; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.measure[i]);
                                if (indexMatch != -1) {
                                    json.dataset[i] = {
                                        'seriesname' : configuration.measure[i],
                                        'data': []
                                    };
                                    for(j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.dataset[i].data.push({
                                            'value' : jsonData[j][indexMatch]
                                        });
                                    }
                                }
                            }
                            return json;
                        },
                        'ss' : function(jsonData, configuration) {
                            var json = {},
                                indexMatchLabel,
                                indexMatchValue,
                                lenDimension,
                                lenMeasure,
                                lenData,
                                i,
                                j,
                                label,
                                value;
                            json.data = [];
                            indexMatchLabel = jsonData[0].indexOf(configuration.dimension[0]);
                            indexMatchValue = jsonData[0].indexOf(configuration.measure[0]);
                            for (j = 1, lenData = jsonData.length; j < lenData; j++) {                  
                                label = jsonData[j][indexMatchLabel];                           
                                value = jsonData[j][indexMatchValue]; 
                                json.data.push({
                                    'label' : label || '',
                                    'value' : value || ''
                                });
                            }                   
                            return json;
                        },
                        'ts' : function(jsonData, configuration) {
                            var json = {},
                                indexMatch,
                                lenDimension,
                                lenMeasure,
                                lenData,
                                i,
                                j;
                            json.datasets = [];
                            json.datasets[0] = {};
                            json.datasets[0].category = {};
                            json.datasets[0].category.data = [];
                            for (i = 0, lenDimension =  configuration.dimension.length; i < lenDimension; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.dimension[i]);
                                if (indexMatch != -1) {
                                    for (j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.datasets[0].category.data.push(jsonData[j][indexMatch]);
                                    }
                                }
                            }
                            json.datasets[0].dataset = [];
                            json.datasets[0].dataset[0] = {};
                            json.datasets[0].dataset[0].series = [];
                            for (i = 0, lenMeasure = configuration.measure.length; i < lenMeasure; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.measure[i]);
                                if (indexMatch != -1) {
                                    json.datasets[0].dataset[0].series[i] = {  
                                        'name' : configuration.measure[i],                              
                                        'data': []
                                    };
                                    for(j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.datasets[0].dataset[0].series[i].data.push(jsonData[j][indexMatch]);
                                    }
                                }
                            }
                            return json;
                        }
                    };
                seriesType = seriesType && seriesType.toLowerCase();
                seriesType = (series[seriesType] && seriesType) || 'ms';
                return series[seriesType](jsonData, conf);
            },
            generalDataFormat = function(jsonData, configuration) {
                var isArray = Array.isArray(jsonData[0]),
                    generalDataArray = [],
                    i,
                    j,
                    len,
                    lenGeneralDataArray,
                    value;
                if (!isArray){
                    generalDataArray[0] = [];
                    generalDataArray[0].push(configuration.dimension);
                    generalDataArray[0] = generalDataArray[0][0].concat(configuration.measure);
                    for (i = 0, len = jsonData.length; i < len; i++) {
                        generalDataArray[i+1] = [];
                        for (j = 0, lenGeneralDataArray = generalDataArray[0].length; j < lenGeneralDataArray; j++) {
                            value = jsonData[i][generalDataArray[0][j]];                    
                            generalDataArray[i+1][j] = value || '';             
                        }
                    }
                } else {
                    return jsonData;
                }
                return generalDataArray;
            },
            dataArray,
            json,
            predefinedJson = configuration && configuration.config;

        if (jsonData && configuration) {
            dataArray = generalDataFormat(jsonData, configuration);
            json = jsonCreator(dataArray, configuration);
            json = (predefinedJson && extend2(json,predefinedJson)) || json;    
            return (callbackFN && callbackFN(json)) || json;    
        }
    }
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.createChart = function () {
        return new Chart(arguments[0]);
    };

    var Chart = function () {
            var chart = this;           
            chart.render(arguments[0]);
        },
        chartProto = Chart.prototype,
        extend2 = MultiCharting.prototype.lib.extend2,
        dataadapter = MultiCharting.prototype.dataadapter;

    chartProto.render = function () {
        var chart = this,
            argument =arguments[0] || {},
            configuration,
            callbackFN,
            jsonData,
            chartConfig = {},
            dataSource = {},
            configData = {};
        //parse argument into chartConfig 
        extend2(chartConfig,argument);
        
        //data configuration 
        configuration = chartConfig.configuration || {};
        configData.jsonData = chartConfig.jsonData;
        configData.callbackFN = configuration.callback;
        configData.config = configuration.data;

        //store fc supported json to render charts
        dataSource = dataadapter(configData);
        
        //delete data configuration parts for FC json converter
        delete chartConfig.jsonData;
        delete chartConfig.configuration;
        
        //set data source into chart configuration
        chartConfig.dataSource = dataSource;
        chart.chartObj = chartConfig;
        
        //render FC 
        var chart = new FusionCharts(chartConfig);
        chart.render();
    };
});
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.createMatrix = function () {
        return new Matrix(arguments[0],arguments[1]);
    };

    var Matrix = function (selector, configuration) {
        var matrix = this;
        matrix.configuration = configuration;
        matrix.selector = selector;
    }

    var protoMatrix = Matrix.prototype;

    protoMatrix.draw = function(){
        var matrix = this,
            configuration = matrix && matrix.configuration || {},
            config = configuration.config,
            className = '',
            configManager = matrix && matrix.matrixManager(),
            len = configManager && configManager.length,
            placeHolder = [];
        matrix.setAttrContainer();
        for(i = 0; i < len; i++) {
            placeHolder[i] = matrix.drawDiv({
                    'height' : configManager[i].height,
                    'width' : configManager[i].width,
                    'top' : configManager[i].top,
                    'left' : configManager[i].left,
                    'id' : configManager[i].id
                });
        }
    };

    protoMatrix.setAttrContainer = function (){
        var matrix = this,
        selector = matrix && matrix.selector;
        matrix.matrixContainer = document.getElementById(selector);
        matrix.matrixContainer.style.height = configuration.height + 'px';
        matrix.matrixContainer.style.width = configuration.width + 'px';  
        matrix.matrixContainer.style.display = 'block';
        matrix.matrixContainer.style.position = 'relative';
    };

    protoMatrix.drawDiv = function(configuration, id, className) {
        var matrix = this,
            cell = document.createElement('div'),
            matrixContainer = matrix && matrix.matrixContainer;
        cell.id = configuration.id || '';
        cell.className = (configuration && configuration.purpose) || '' + ' cell ' + (className || '');
        cell.style.height = configuration &&  configuration.height + 'px';
        cell.style.width = configuration &&  configuration.width + 'px';
        cell.style.top = configuration && configuration.top + 'px';
        cell.style.left = configuration &&  configuration.left + 'px';
        cell.style.position = 'absolute';
        matrixContainer.appendChild(cell);

        return {
            config : {
                id : cell.id,
                height : cell.style.height,
                width : cell.style.width,
                top : cell.style.top,
                left : cell.style.left
            },
            graphics : cell
        };

    };

    protoMatrix.calcRowHeight = function() {
        var matrix = this,
            configuration = matrix && matrix.configuration,
            config = configuration && configuration.config,
            lenConf = config && config.length,
            height = configuration && configuration.height,
            dimension = configuration && configuration.dimension,
            defaultH = height / dimension[0],
            i,
            j,
            row,
            rowNo,
            heightArr = [],
            maxHeight,
            endRow,
            startRow,
            currHeight,
            isRowArray,
            matrixCurrH = 0;

        for(k = 0; k < dimension[0]; k++) {

            maxHeight = 0;

            for(i = 0; i < lenConf; i++) {
                row = config[i].row;
                currHeight = config[i].height;
                isRowArray = Array.isArray(row);
                if(currHeight) {
                    rowNo = isRowArray && row.length || 1;
                    startRow = ((isRowArray && row[0]) || row) - 1;
                    if(startRow == k && rowNo === 1) {
                        maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
                    }
                    endRow = ((isRowArray && row[rowNo - 1]) || row) - 1;
                    if(endRow == k && heightArr[endRow - 1]) {
                        currHeight = matrix.getDiff(heightArr, (k - 1), currHeight);
                        maxHeight = maxHeight < currHeight ? currHeight : maxHeight;    
                    }

                }
            }

            heightArr[k] = maxHeight ? maxHeight : ((height - matrixCurrH) / (dimension[0] - k));
            matrixCurrH += heightArr[k]
        }

        heightArr = ratioEquilizer(heightArr, height);
        
        return heightArr;   
    };

    protoMatrix.calcColWidth = function() {
        var matrix = this,
            configuration = matrix && matrix.configuration,
            config = configuration && configuration.config,
            lenConf = config && config.length,
            width = configuration && configuration.width,
            dimension = configuration && configuration.dimension,
            defaultW = width / dimension[1],
            i,
            j,
            col,
            colNo,
            widthArr = [],
            maxWidth,
            endCol,
            startCol,
            currWidth,
            isColArray,
            matrixCurrW = 0;

        for(k = 0; k < dimension[1]; k++) {
            maxWidth = 0;

            for(i = 0; i < lenConf; i++) {
                col = config[i].col;
                currWidth = config[i].width;
                isColArray = Array.isArray(col);
                if (currWidth){
                    colNo = (isColArray && col.length) || 1;                
                    startCol = (isColArray && col[0] || col) - 1;
                    if (startCol === k && colNo === 1){
                        maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
                    }
                    endCol = (isColArray && col[col.length - 1] || col) - 1;
                    if(endCol == k && widthArr[endCol - 1]) {
                        currWidth = matrix.getDiff(widthArr, k - 1, currWidth);
                        maxWidth = maxWidth < currWidth ? currWidth : maxWidth;             
                    }

                }
            }

            widthArr[k] = maxWidth ? maxWidth : ((width - matrixCurrW) / (dimension[1] - k));
           
            matrixCurrW += widthArr[k];
        }
       
        widthArr = ratioEquilizer(widthArr, width);
       
        return widthArr;    
    };

    protoMatrix.getDiff = function(arr, index, value){
        var i = 0,
            total = 0;

        for(; i < index; i++) {
            total += arr[i];
        }

        return (value - total);
    };

    protoMatrix.getPos =  function(src){
        var arr = [],
            i = 0,
            len = src && src.length;

        for(; i <= len; i++){
            arr.push(i ? (src[i-1]+arr[i-1]) : 0);
        }

        return arr;
    };

    protoMatrix.matrixManager = function(){
        var matrix = this,
            configuration = matrix && matrix.configuration,
            config = configuration && configuration.config,
            lenConf = config && config.length,
            dimensionX = configuration.dimension[1],
            dimensionY = configuration.dimension[0],
            cellH = configuration.height / dimensionY,
            cellW = configuration.width / dimensionX,
            matrixHeightArr = configuration.rowHeight || (matrix && matrix.calcRowHeight()),
            matrixWidhtArr = configuration.colWidth || (matrix && matrix.calcColWidth()),
            configManager = [],
            matrixPosX = matrix.matrixPosX = matrix.getPos(matrixWidhtArr),
            matrixPosY = matrix.matrixPosY = matrix.getPos(matrixHeightArr),
            i = 0,
            j,
            isRowArr,
            isColArr,
            col,
            row,
            top,
            left,
            height,
            width;

        if(!config || !lenConf){//if config isn't defined or empty
            for(i = 0; i < dimensionY; i++){
                for(j = 0; j < dimensionX; j++){                
                    top = i * cellH;
                    left = j * cellW;
                    height = cellH;
                    width = cellW;
                    
                    configManager.push({
                        top : top,
                        left : left,
                        height : height,
                        width : width
                    });
                }
            }
        } else {
            for(i; i < lenConf; i++){
                row = config[i].row;
                col = config[i].col;
                
                isColArr = Array.isArray(col);
                isRowArr = Array.isArray(row);
                //generating div position
                top = matrixPosY[(isRowArr ? Math.min.apply(null,row) : row)-1];
                left = matrixPosX[(isColArr ? Math.min.apply(null,col) : col)-1];
                height = matrixPosY[(isRowArr ? Math.max.apply(null,row) : row)] - top;
                width = matrixPosX[(isColArr ? Math.max.apply(null,col) : col)] - left;
                
                configManager.push({
                    top : top,
                    left : left,
                    height : height,
                    width : width,
                    id : config[i].id
                });
            }
        }   

        return configManager;
    };

    function getArrSum(arr) {
        var i = 0,
            len = arr && arr.length,
            sum = 0;

        for(; i < len; i++){
            sum += arr[i];
        }

        return sum;
    };

    function ratioEquilizer(arr, value) {
        var i = 0,
            lenArr = arr && arr.length,
            sum = 0,
            diff;

        for(;i < lenArr; i++) {
            sum += arr[i];
        }

        for(i = 0; i < lenArr; i++){        
            arr[i] = (arr[i] / sum) * value;
        }

        return arr;
    };

    Array.prototype.max = function() {
      return Math.max.apply(null, this);
    };

    Array.prototype.min = function() {
      return Math.min.apply(null, this);
    };    
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmRhdGFzdG9yZS5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXByb2Nlc3Nvci5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YWFkYXB0ZXIuanMiLCJtdWx0aWNoYXJ0aW5nLmNyZWF0ZWNoYXJ0LmpzIiwibXVsdGljaGFydGluZy5tYXRyaXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmMubWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE11bHRpQ2hhcnRpbmcgRXh0ZW5zaW9uIGZvciBGdXNpb25DaGFydHNcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBiYXNpYyByb3V0aW5lcyByZXF1aXJlZCBieSBzdWJzZXF1ZW50IG1vZHVsZXMgdG9cbiAqIGV4dGVuZC9zY2FsZSBvciBhZGQgZnVuY3Rpb25hbGl0eSB0byB0aGUgTXVsdGlDaGFydGluZyBvYmplY3QuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZW52LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZW52LmRvY3VtZW50ID9cbiAgICAgICAgICAgIGZhY3RvcnkoZW52KSA6IGZ1bmN0aW9uKHdpbikge1xuICAgICAgICAgICAgICAgIGlmICghd2luLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIldpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFjdG9yeSh3aW4sIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbnYuTXVsdGlDaGFydGluZyA9IGZhY3RvcnkoZW52LCB0cnVlKTtcbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uIChfd2luZG93LCB3aW5kb3dFeGlzdHMpIHtcbiAgICAvLyBJbiBjYXNlIE11bHRpQ2hhcnRpbmcgYWxyZWFkeSBleGlzdHMuXG4gICAgaWYgKF93aW5kb3cuTXVsdGlDaGFydGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG5cdHZhciBNdWx0aUNoYXJ0aW5nID0gZnVuY3Rpb24gKCkge1xuXHR9O1xuXG5cblx0cmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBleHRlbmQyID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZikge1xuICAgICAgICAgICAgdmFyIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuICAgICAgICAgICAgLy9pZiBub25lIG9mIHRoZSBhcmd1bWVudHMgYXJlIG9iamVjdCB0aGVuIHJldHVybiBiYWNrXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORyAmJiB0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HIHx8IG9iajIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICBvYmoxID0gb2JqMiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lcmdlKG9iajEsIG9iajIsIHNraXBVbmRlZik7XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgbGliID0ge1xuICAgICAgICAgICAgZXh0ZW5kMjogZXh0ZW5kMixcbiAgICAgICAgICAgIG1lcmdlOiBtZXJnZVxuICAgICAgICB9O1xuXG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiA9IChNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgfHwgbGliKTtcblxufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0TXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlRGF0YVN0b3JlID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgZGF0YVN0b3JhZ2UoYXJndW1lbnRzKTtcblx0fTtcblxuXHR2YXJcdGxpYiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYixcblx0XHRkYXRhU3RvcmUgPSBsaWIuZGF0YVN0b3JlID0ge30sXG5cdFx0Ly8gRm9yIHN0b3JpbmcgdGhlIGNoaWxkIG9mIGEgcGFyZW50XG5cdFx0bGlua1N0b3JlID0ge30sXG5cdFx0Ly9Gb3Igc3RvcmluZyB0aGUgcGFyZW50IG9mIGEgY2hpbGRcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSA9IHt9LFxuXHRcdGlkQ291bnQgPSAwLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBkYXRhU3RvcmFnZS5cblx0XHRkYXRhU3RvcmFnZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLmFkZERhdGEoYXJndW1lbnRzKTtcblx0XHR9LFxuXHRcdGRhdGFTdG9yZVByb3RvID0gZGF0YVN0b3JhZ2UucHJvdG90eXBlLFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgYWxsIHRoZSBsaW5rZWQgY2hpbGQgZGF0YVxuXHRcdHVwZGF0YURhdGEgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRcdHBhcmVudERhdGEgPSBkYXRhU3RvcmVbaWRdLFxuXHRcdFx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSxcblx0XHRcdFx0bGVuLFxuXHRcdFx0XHRsaW5rSWRzLFxuXHRcdFx0XHRmaWx0ZXJzLFxuXHRcdFx0XHRsaW5rSWQsXG5cdFx0XHRcdGZpbHRlcixcblx0XHRcdFx0ZmlsdGVyRm4sXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdGluZm8sXG5cdFx0XHRcdC8vIFN0b3JlIGFsbCB0aGUgZGF0YU9ianMgdGhhdCBhcmUgdXBkYXRlZC5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkID0gbGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXG5cdFx0XHRsaW5rSWRzID0gbGlua0RhdGEubGluaztcblx0XHRcdGZpbHRlcnMgPSBsaW5rRGF0YS5maWx0ZXI7XG5cdFx0XHRsZW4gPSBsaW5rSWRzLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGxpbmtJZCA9IGxpbmtJZHNbaV07XG5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkW2xpbmtJZF0gPSB0cnVlO1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldO1xuXHRcdFx0XHRmaWx0ZXJGbiA9IGZpbHRlci5nZXRGaWx0ZXIoKTtcblx0XHRcdFx0dHlwZSA9IGZpbHRlci50eXBlO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyRm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRpZiAoZmlsdGVyU3RvcmVbZmlsdGVyLmlkXSkge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JlW2xpbmtJZF0gPSBleGVjdXRlUHJvY2Vzc29yKHR5cGUsIGZpbHRlckZuLCBwYXJlbnREYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRhU3RvcmVbbGlua0lkXSA9IHBhcmVudERhdGE7XG5cdFx0XHRcdFx0XHRmaWx0ZXIuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aSAtPSAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShsaW5rSWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdGhlIGRhdGFQcm9jZXNzb3Igb3ZlciB0aGUgZGF0YVxuXHRcdGV4ZWN1dGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAodHlwZSwgZmlsdGVyRm4sIEpTT05EYXRhKSB7XG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAgJ2ZpbHRlcicgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2FkZEluZm8nIDpcblx0XHRcdFx0Y2FzZSAncmVFeHByZXNzJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdCA6IHJldHVybiBmaWx0ZXJGbihKU09ORGF0YSk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRnVuY3Rpb24gdG8gY29udmVydC9nZXQgcmF3IGRhdGEgaW50byBKU09OIGRhdGFcblx0XHRwYXJzZURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzKSB7XG5cdFx0XHR2YXJcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdFx0ZGF0YVR5cGUgPSBkYXRhU3BlY3MuZGF0YVR5cGUsXG5cdFx0XHRcdEpTT05EYXRhO1xuXG5cdFx0XHRzd2l0Y2goZGF0YVR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnanNvbnVybCcgOiBcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnY3N2JyA6IFxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdjc3Z1cmwnIDogXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2pzb24nIDogXG5cdFx0XHRcdGRlZmF1bHQgOiBKU09ORGF0YSA9IGRhdGFTb3VyY2U7XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gSlNPTkRhdGE7XG5cdFx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSBpbiB0aGUgZGF0YSBzdG9yZVxuXHRkYXRhU3RvcmVQcm90by5hZGREYXRhID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdG9sZElkID0gZGF0YS5pZCxcblx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdLFxuXHRcdFx0aWQgPSBhcmd1bWVudC5pZCxcblx0XHRcdG9sZEpTT05EYXRhID0gZGF0YVN0b3JlW29sZElkXSB8fCBbXSxcblx0XHRcdEpTT05EYXRhID0gcGFyc2VEYXRhKGFyZ3VtZW50KTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2RhdGFTdG9yZScgKyBpZENvdW50ICsrO1xuXHRcdGRhdGFTdG9yZVtpZF0gPSBvbGRKU09ORGF0YS5jb25jYXQoSlNPTkRhdGEgfHwgW10pO1xuXG5cdFx0ZGF0YS5pZCA9IGlkO1xuXG5cdFx0aWYgKGxpbmtTdG9yZVtpZF0pIHtcblx0XHRcdHVwZGF0YURhdGEoaWQpXG5cdFx0fVxuXHRcdGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdkYXRhQWRkZWQnLCB7J2RldGFpbCcgOiB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IEpTT05EYXRhXG5cdFx0fX0pKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHRkYXRhU3RvcmVQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBkYXRhU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IGNoaWxkIGRhdGEgb2JqZWN0IGFmdGVyIGFwcGx5aW5nIGZpbHRlciBvbiB0aGUgcGFyZW50IGRhdGEuXG5cdC8vIEBwYXJhbXMge2ZpbHRlcnN9IC0gVGhpcyBjYW4gYmUgYSBmaWx0ZXIgZnVuY3Rpb24gb3IgYW4gYXJyYXkgb2YgZmlsdGVyIGZ1bmN0aW9ucy5cblx0ZGF0YVN0b3JlUHJvdG8uZ2V0RGF0YSA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG5cdFx0dmFyIGRhdGEgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhLmlkLFxuXHRcdFx0ZmlsdGVyTGluayA9IGxpYi5maWx0ZXJMaW5rO1xuXHRcdC8vIElmIG5vIHBhcmFtZXRlciBpcyBwcmVzZW50IHRoZW4gcmV0dXJuIHRoZSB1bmZpbHRlcmVkIGRhdGEuXG5cdFx0aWYgKCFmaWx0ZXJzKSB7XG5cdFx0XHRyZXR1cm4gZGF0YVN0b3JlW2lkXTtcblx0XHR9XG5cdFx0Ly8gSWYgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIGZpbHRlciB0aGVuIHJldHVybiB0aGUgZmlsdGVyZWQgZGF0YSBhZnRlciBhcHBseWluZyB0aGUgZmlsdGVyIG92ZXIgdGhlIGRhdGEuXG5cdFx0ZWxzZSB7XG5cdFx0XHRsZXQgcmVzdWx0ID0gW10sXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld0RhdGEsXG5cdFx0XHRcdGxpbmtEYXRhLFxuXHRcdFx0XHRuZXdJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0ZGF0YWxpbmtzLFxuXHRcdFx0XHRmaWx0ZXJJRCxcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0aXNGaWx0ZXJBcnJheSA9IGZpbHRlcnMgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdFx0bGVuID0gaXNGaWx0ZXJBcnJheSA/IGZpbHRlcnMubGVuZ3RoIDogMTtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV0gfHwgZmlsdGVycztcblx0XHRcdFx0ZmlsdGVyRm4gPSBmaWx0ZXIuZ2V0RmlsdGVyKCk7XG5cdFx0XHRcdHR5cGUgPSBmaWx0ZXIudHlwZTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0bmV3RGF0YSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIGRhdGFTdG9yZVtpZF0pO1xuXG5cdFx0XHRcdFx0bmV3RGF0YU9iaiA9IG5ldyBkYXRhU3RvcmFnZShuZXdEYXRhKTtcblx0XHRcdFx0XHRuZXdJZCA9IG5ld0RhdGFPYmouaWQ7XG5cdFx0XHRcdFx0cGFyZW50U3RvcmVbbmV3SWRdID0gZGF0YTtcblxuXHRcdFx0XHRcdGRhdGFTdG9yZVtuZXdJZF0gPSBuZXdEYXRhO1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKG5ld0RhdGFPYmopO1xuXG5cdFx0XHRcdFx0Ly9QdXNoaW5nIHRoZSBpZCBhbmQgZmlsdGVyIG9mIGNoaWxkIGNsYXNzIHVuZGVyIHRoZSBwYXJlbnQgY2xhc3NlcyBpZC5cblx0XHRcdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0gfHwgKGxpbmtTdG9yZVtpZF0gPSB7XG5cdFx0XHRcdFx0XHRsaW5rIDogW10sXG5cdFx0XHRcdFx0XHRmaWx0ZXIgOiBbXVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmxpbmsucHVzaChuZXdJZCk7XG5cdFx0XHRcdFx0bGlua0RhdGEuZmlsdGVyLnB1c2goZmlsdGVyKTtcblxuXHRcdFx0XHRcdC8vIFN0b3JpbmcgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIHVuZGVyIHRoZSBmaWx0ZXIgaWQuXG5cdFx0XHRcdFx0ZmlsdGVySUQgPSBmaWx0ZXIuZ2V0SUQoKTtcblx0XHRcdFx0XHRkYXRhbGlua3MgPSBmaWx0ZXJMaW5rW2ZpbHRlcklEXSB8fCAoZmlsdGVyTGlua1tmaWx0ZXJJRF0gPSBbXSk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzLnB1c2gobmV3RGF0YU9iailcblxuXHRcdFx0XHRcdC8vIHNldHRpbmcgdGhlIGN1cnJlbnQgaWQgYXMgdGhlIG5ld0lEIHNvIHRoYXQgdGhlIG5leHQgZmlsdGVyIGlzIGFwcGxpZWQgb24gdGhlIGNoaWxkIGRhdGE7XG5cdFx0XHRcdFx0aWQgPSBuZXdJZDtcblx0XHRcdFx0XHRkYXRhID0gbmV3RGF0YU9iajtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIChpc0ZpbHRlckFycmF5ID8gcmVzdWx0IDogcmVzdWx0WzBdKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZGVsZXRlIHRoZSBjdXJyZW50IGRhdGEgZnJvbSB0aGUgZGF0YXN0b3JlIGFuZCBhbHNvIGFsbCBpdHMgY2hpbGRzIHJlY3Vyc2l2ZWx5XG5cdGRhdGFTdG9yZVByb3RvLmRlbGV0ZURhdGEgPSBmdW5jdGlvbiAob3B0aW9uYWxJZCkge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhLmlkLFxuXHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdLFxuXHRcdFx0ZmxhZztcblxuXHRcdGlmIChsaW5rRGF0YSkge1xuXHRcdFx0bGV0IGksXG5cdFx0XHRcdGxpbmsgPSBsaW5rRGF0YS5saW5rLFxuXHRcdFx0XHRsZW4gPSBsaW5rLmxlbmd0aDtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKyspIHtcblx0XHRcdFx0ZGF0YS5kZWxldGVEYXRhKGxpbmtbaV0pO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGxpbmtTdG9yZVtpZF07XG5cdFx0fVxuXG5cdFx0ZmxhZyA9IGRlbGV0ZSBkYXRhU3RvcmVbaWRdO1xuXHRcdGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdkYXRhRGVsZXRlZCcsIHsnZGV0YWlsJyA6IHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH19KSk7XG5cdFx0cmV0dXJuIGZsYWc7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBpZCBvZiB0aGUgY3VycmVudCBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIG1vZGlmeSBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLm1vZGlmeURhdGEgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRhdGEgPSB0aGlzO1xuXG5cdFx0ZGF0YVN0b3JlW2lkXSA9IFtdO1xuXHRcdGRhdGEuYWRkRGF0YShhcmd1bWVudHMpO1xuXHRcdGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdkYXRhTW9kaWZpZWQnLCB7J2RldGFpbCcgOiB7XG5cdFx0XHQnaWQnOiBkYXRhLmlkXG5cdFx0fX0pKTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBkYXRhUHJvY2Vzc29yKGFyZ3VtZW50cyk7XG5cdH07XG5cblx0dmFyIGxpYiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYixcblx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSA9IHt9LFxuXHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluayA9IHt9LFxuXHRcdGZpbHRlcklkQ291bnQgPSAwLFxuXHRcdGRhdGFTdG9yZSA9IGxpYi5kYXRhU3RvcmUsXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUsXG5cdFx0XG5cdFx0Ly8gQ29uc3RydWN0b3IgY2xhc3MgZm9yIGRhdGFQcm9jZXNzb3IuXG5cdFx0ZGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLmFkZFJ1bGUoYXJndW1lbnRzKTtcblx0XHR9LFxuXHRcdFxuXHRcdGRhdGFQcm9jZXNzb3JQcm90byA9IGRhdGFQcm9jZXNzb3IucHJvdG90eXBlLFxuXG5cdFx0Ly8gRnVuY3Rpb24gdG8gdXBkYXRlIGRhdGEgb24gY2hhbmdlIG9mIGZpbHRlci5cblx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IgPSBmdW5jdGlvbiAoaWQsIGNvcHlQYXJlbnRUb0NoaWxkKSB7XG5cdFx0XHR2YXIgaSxcblx0XHRcdFx0ZGF0YSA9IGZpbHRlckxpbmtbaWRdLFxuXHRcdFx0XHRKU09ORGF0YSxcblx0XHRcdFx0ZGF0dW0sXG5cdFx0XHRcdGRhdGFJZCxcblx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKyspIHtcblx0XHRcdFx0ZGF0dW0gPSBkYXRhW2ldO1xuXHRcdFx0XHRkYXRhSWQgPSBkYXR1bS5pZDtcblx0XHRcdFx0aWYgKCFsaWIudGVtcERhdGFVcGRhdGVkW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRpZiAocGFyZW50U3RvcmVbZGF0YUlkXSAmJiBkYXRhU3RvcmVbZGF0YUlkXSkge1xuXHRcdFx0XHRcdFx0SlNPTkRhdGEgPSBwYXJlbnRTdG9yZVtkYXRhSWRdLmdldERhdGEoKTtcblx0XHRcdFx0XHRcdGRhdHVtLm1vZGlmeURhdGEoY29weVBhcmVudFRvQ2hpbGQgPyBKU09ORGF0YSA6IGZpbHRlclN0b3JlW2lkXShKU09ORGF0YSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRlbGV0ZSBwYXJlbnRTdG9yZVtkYXRhSWRdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXHRcdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGZpbHRlciBpbiB0aGUgZmlsdGVyIHN0b3JlXG5cdGRhdGFQcm9jZXNzb3JQcm90by5hZGRSdWxlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0b2xkSWQgPSBmaWx0ZXIuaWQsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGZpbHRlckZuID0gYXJndW1lbnQucnVsZSxcblx0XHRcdGlkID0gYXJndW1lbnQudHlwZSxcblx0XHRcdHR5cGUgPSBhcmd1bWVudC50eXBlO1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZmlsdGVyU3RvcmUnICsgZmlsdGVySWRDb3VudCArKztcblx0XHRmaWx0ZXJTdG9yZVtpZF0gPSBmaWx0ZXJGbjtcblxuXHRcdGZpbHRlci5pZCA9IGlkO1xuXHRcdGZpbHRlci50eXBlID0gdHlwZTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgZGF0YSBvbiB3aGljaCB0aGUgZmlsdGVyIGlzIGFwcGxpZWQgYW5kIGFsc28gb24gdGhlIGNoaWxkIGRhdGEuXG5cdFx0aWYgKGZpbHRlckxpbmtbaWRdKSB7XG5cdFx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQpO1xuXHRcdH1cblxuXHRcdGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdmaWx0ZXJBZGRlZCcsIHsnZGV0YWlsJyA6IHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdFx0J2ZpbHRlcicgOiBmaWx0ZXJGblxuXHRcdH19KSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgdGhlIGZpbHRlciBtZXRob2QuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRGaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGZpbHRlclN0b3JlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgSUQgb2YgdGhlIGZpbHRlci5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmRlbGV0ZUZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5maWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdmaWx0ZXInXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uc29ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ3NvcnQnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkSW5mbyA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2FkZEluZm8nXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8ucmVFeHByZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAncmVFeHByZXNzJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFhZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29udmVydERhdGEoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuICAgIHZhciBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDI7XG4gICAgLy9mdW5jdGlvbiB0byBjb252ZXJ0IGRhdGEsIGl0IHJldHVybnMgZmMgc3VwcG9ydGVkIEpTT05cbiAgICBmdW5jdGlvbiBjb252ZXJ0RGF0YSgpIHtcbiAgICAgICAgdmFyIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAganNvbkRhdGEgPSBhcmd1bWVudC5qc29uRGF0YSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWcsXG4gICAgICAgICAgICBjYWxsYmFja0ZOID0gYXJndW1lbnQuY2FsbGJhY2tGTixcbiAgICAgICAgICAgIGpzb25DcmVhdG9yID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29uZiA9IGNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21zJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjYXRlZ29yeVwiOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzZXJpZXNuYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hMYWJlbF07ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBsYWJlbCB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICd0cycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0c1swXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldHNbMF0uY2F0ZWdvcnkgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldHNbMF0uY2F0ZWdvcnkuZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0gPSB7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0uZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgc2VyaWVzVHlwZSA9IChzZXJpZXNbc2VyaWVzVHlwZV0gJiYgc2VyaWVzVHlwZSkgfHwgJ21zJztcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWVzW3Nlcmllc1R5cGVdKGpzb25EYXRhLCBjb25mKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5lcmFsRGF0YUZvcm1hdCA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGpzb25EYXRhWzBdKSxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgICAgIGxlbkdlbmVyYWxEYXRhQXJyYXksXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICghaXNBcnJheSl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXS5wdXNoKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uKTtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IGdlbmVyYWxEYXRhQXJyYXlbMF1bMF0uY29uY2F0KGNvbmZpZ3VyYXRpb24ubWVhc3VyZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGpzb25EYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkdlbmVyYWxEYXRhQXJyYXkgPSBnZW5lcmFsRGF0YUFycmF5WzBdLmxlbmd0aDsgaiA8IGxlbkdlbmVyYWxEYXRhQXJyYXk7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbaV1bZ2VuZXJhbERhdGFBcnJheVswXVtqXV07ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV1bal0gPSB2YWx1ZSB8fCAnJzsgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBnZW5lcmFsRGF0YUFycmF5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGFBcnJheSxcbiAgICAgICAgICAgIGpzb24sXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IGNvbmZpZ3VyYXRpb24gJiYgY29uZmlndXJhdGlvbi5jb25maWc7XG5cbiAgICAgICAgaWYgKGpzb25EYXRhICYmIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGFBcnJheSA9IGdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGpzb24gPSBqc29uQ3JlYXRvcihkYXRhQXJyYXksIGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICAgICAganNvbiA9IChwcmVkZWZpbmVkSnNvbiAmJiBleHRlbmQyKGpzb24scHJlZGVmaW5lZEpzb24pKSB8fCBqc29uOyAgICBcbiAgICAgICAgICAgIHJldHVybiAoY2FsbGJhY2tGTiAmJiBjYWxsYmFja0ZOKGpzb24pKSB8fCBqc29uOyAgICBcbiAgICAgICAgfVxuICAgIH1cbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhcnQoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgdmFyIENoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNoYXJ0ID0gdGhpczsgICAgICAgICAgIFxuICAgICAgICAgICAgY2hhcnQucmVuZGVyKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNoYXJ0UHJvdG8gPSBDaGFydC5wcm90b3R5cGUsXG4gICAgICAgIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMixcbiAgICAgICAgZGF0YWFkYXB0ZXIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5kYXRhYWRhcHRlcjtcblxuICAgIGNoYXJ0UHJvdG8ucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjYWxsYmFja0ZOLFxuICAgICAgICAgICAganNvbkRhdGEsXG4gICAgICAgICAgICBjaGFydENvbmZpZyA9IHt9LFxuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IHt9LFxuICAgICAgICAgICAgY29uZmlnRGF0YSA9IHt9O1xuICAgICAgICAvL3BhcnNlIGFyZ3VtZW50IGludG8gY2hhcnRDb25maWcgXG4gICAgICAgIGV4dGVuZDIoY2hhcnRDb25maWcsYXJndW1lbnQpO1xuICAgICAgICBcbiAgICAgICAgLy9kYXRhIGNvbmZpZ3VyYXRpb24gXG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uIHx8IHt9O1xuICAgICAgICBjb25maWdEYXRhLmpzb25EYXRhID0gY2hhcnRDb25maWcuanNvbkRhdGE7XG4gICAgICAgIGNvbmZpZ0RhdGEuY2FsbGJhY2tGTiA9IGNvbmZpZ3VyYXRpb24uY2FsbGJhY2s7XG4gICAgICAgIGNvbmZpZ0RhdGEuY29uZmlnID0gY29uZmlndXJhdGlvbi5kYXRhO1xuXG4gICAgICAgIC8vc3RvcmUgZmMgc3VwcG9ydGVkIGpzb24gdG8gcmVuZGVyIGNoYXJ0c1xuICAgICAgICBkYXRhU291cmNlID0gZGF0YWFkYXB0ZXIoY29uZmlnRGF0YSk7XG4gICAgICAgIFxuICAgICAgICAvL2RlbGV0ZSBkYXRhIGNvbmZpZ3VyYXRpb24gcGFydHMgZm9yIEZDIGpzb24gY29udmVydGVyXG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5qc29uRGF0YTtcbiAgICAgICAgZGVsZXRlIGNoYXJ0Q29uZmlnLmNvbmZpZ3VyYXRpb247XG4gICAgICAgIFxuICAgICAgICAvL3NldCBkYXRhIHNvdXJjZSBpbnRvIGNoYXJ0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgY2hhcnRDb25maWcuZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqID0gY2hhcnRDb25maWc7XG4gICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgdmFyIGNoYXJ0ID0gbmV3IEZ1c2lvbkNoYXJ0cyhjaGFydENvbmZpZyk7XG4gICAgICAgIGNoYXJ0LnJlbmRlcigpO1xuICAgIH07XG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVNYXRyaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pO1xuICAgIH07XG5cbiAgICB2YXIgTWF0cml4ID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzO1xuICAgICAgICBtYXRyaXguY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgIG1hdHJpeC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgIH1cblxuICAgIHZhciBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGU7XG5cbiAgICBwcm90b01hdHJpeC5kcmF3ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4ICYmIG1hdHJpeC5jb25maWd1cmF0aW9uIHx8IHt9LFxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlndXJhdGlvbi5jb25maWcsXG4gICAgICAgICAgICBjbGFzc05hbWUgPSAnJyxcbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeE1hbmFnZXIoKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXguc2V0QXR0ckNvbnRhaW5lcigpO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBtYXRyaXguZHJhd0Rpdih7XG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQnIDogY29uZmlnTWFuYWdlcltpXS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCcgOiBjb25maWdNYW5hZ2VyW2ldLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAndG9wJyA6IGNvbmZpZ01hbmFnZXJbaV0udG9wLFxuICAgICAgICAgICAgICAgICAgICAnbGVmdCcgOiBjb25maWdNYW5hZ2VyW2ldLmxlZnQsXG4gICAgICAgICAgICAgICAgICAgICdpZCcgOiBjb25maWdNYW5hZ2VyW2ldLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguc2V0QXR0ckNvbnRhaW5lciA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgc2VsZWN0b3IgPSBtYXRyaXggJiYgbWF0cml4LnNlbGVjdG9yO1xuICAgICAgICBtYXRyaXgubWF0cml4Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3IpO1xuICAgICAgICBtYXRyaXgubWF0cml4Q29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGNvbmZpZ3VyYXRpb24uaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgbWF0cml4Lm1hdHJpeENvbnRhaW5lci5zdHlsZS53aWR0aCA9IGNvbmZpZ3VyYXRpb24ud2lkdGggKyAncHgnOyAgXG4gICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5kcmF3RGl2ID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbiwgaWQsIGNsYXNzTmFtZSkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgIG1hdHJpeENvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyO1xuICAgICAgICBjZWxsLmlkID0gY29uZmlndXJhdGlvbi5pZCB8fCAnJztcbiAgICAgICAgY2VsbC5jbGFzc05hbWUgPSAoY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLnB1cnBvc2UpIHx8ICcnICsgJyBjZWxsICcgKyAoY2xhc3NOYW1lIHx8ICcnKTtcbiAgICAgICAgY2VsbC5zdHlsZS5oZWlnaHQgPSBjb25maWd1cmF0aW9uICYmICBjb25maWd1cmF0aW9uLmhlaWdodCArICdweCc7XG4gICAgICAgIGNlbGwuc3R5bGUud2lkdGggPSBjb25maWd1cmF0aW9uICYmICBjb25maWd1cmF0aW9uLndpZHRoICsgJ3B4JztcbiAgICAgICAgY2VsbC5zdHlsZS50b3AgPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24udG9wICsgJ3B4JztcbiAgICAgICAgY2VsbC5zdHlsZS5sZWZ0ID0gY29uZmlndXJhdGlvbiAmJiAgY29uZmlndXJhdGlvbi5sZWZ0ICsgJ3B4JztcbiAgICAgICAgY2VsbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIG1hdHJpeENvbnRhaW5lci5hcHBlbmRDaGlsZChjZWxsKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29uZmlnIDoge1xuICAgICAgICAgICAgICAgIGlkIDogY2VsbC5pZCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgOiBjZWxsLnN0eWxlLmhlaWdodCxcbiAgICAgICAgICAgICAgICB3aWR0aCA6IGNlbGwuc3R5bGUud2lkdGgsXG4gICAgICAgICAgICAgICAgdG9wIDogY2VsbC5zdHlsZS50b3AsXG4gICAgICAgICAgICAgICAgbGVmdCA6IGNlbGwuc3R5bGUubGVmdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdyYXBoaWNzIDogY2VsbFxuICAgICAgICB9O1xuXG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmNhbGNSb3dIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4ICYmIG1hdHJpeC5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmNvbmZpZyxcbiAgICAgICAgICAgIGxlbkNvbmYgPSBjb25maWcgJiYgY29uZmlnLmxlbmd0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbmZpZ3VyYXRpb24gJiYgY29uZmlndXJhdGlvbi5oZWlnaHQsXG4gICAgICAgICAgICBkaW1lbnNpb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLFxuICAgICAgICAgICAgZGVmYXVsdEggPSBoZWlnaHQgLyBkaW1lbnNpb25bMF0sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIHJvd05vLFxuICAgICAgICAgICAgaGVpZ2h0QXJyID0gW10sXG4gICAgICAgICAgICBtYXhIZWlnaHQsXG4gICAgICAgICAgICBlbmRSb3csXG4gICAgICAgICAgICBzdGFydFJvdyxcbiAgICAgICAgICAgIGN1cnJIZWlnaHQsXG4gICAgICAgICAgICBpc1Jvd0FycmF5LFxuICAgICAgICAgICAgbWF0cml4Q3VyckggPSAwO1xuXG4gICAgICAgIGZvcihrID0gMDsgayA8IGRpbWVuc2lvblswXTsgaysrKSB7XG5cbiAgICAgICAgICAgIG1heEhlaWdodCA9IDA7XG5cbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGxlbkNvbmY7IGkrKykge1xuICAgICAgICAgICAgICAgIHJvdyA9IGNvbmZpZ1tpXS5yb3c7XG4gICAgICAgICAgICAgICAgY3VyckhlaWdodCA9IGNvbmZpZ1tpXS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgaXNSb3dBcnJheSA9IEFycmF5LmlzQXJyYXkocm93KTtcbiAgICAgICAgICAgICAgICBpZihjdXJySGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJvd05vID0gaXNSb3dBcnJheSAmJiByb3cubGVuZ3RoIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0Um93ID0gKChpc1Jvd0FycmF5ICYmIHJvd1swXSkgfHwgcm93KSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmKHN0YXJ0Um93ID09IGsgJiYgcm93Tm8gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCA8IGN1cnJIZWlnaHQgPyBjdXJySGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuZFJvdyA9ICgoaXNSb3dBcnJheSAmJiByb3dbcm93Tm8gLSAxXSkgfHwgcm93KSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmKGVuZFJvdyA9PSBrICYmIGhlaWdodEFycltlbmRSb3cgLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyckhlaWdodCA9IG1hdHJpeC5nZXREaWZmKGhlaWdodEFyciwgKGsgLSAxKSwgY3VyckhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgPCBjdXJySGVpZ2h0ID8gY3VyckhlaWdodCA6IG1heEhlaWdodDsgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGVpZ2h0QXJyW2tdID0gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogKChoZWlnaHQgLSBtYXRyaXhDdXJySCkgLyAoZGltZW5zaW9uWzBdIC0gaykpO1xuICAgICAgICAgICAgbWF0cml4Q3VyckggKz0gaGVpZ2h0QXJyW2tdXG4gICAgICAgIH1cblxuICAgICAgICBoZWlnaHRBcnIgPSByYXRpb0VxdWlsaXplcihoZWlnaHRBcnIsIGhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaGVpZ2h0QXJyOyAgIFxuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5jYWxjQ29sV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4ICYmIG1hdHJpeC5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmNvbmZpZyxcbiAgICAgICAgICAgIGxlbkNvbmYgPSBjb25maWcgJiYgY29uZmlnLmxlbmd0aCxcbiAgICAgICAgICAgIHdpZHRoID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLndpZHRoLFxuICAgICAgICAgICAgZGltZW5zaW9uID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmRpbWVuc2lvbixcbiAgICAgICAgICAgIGRlZmF1bHRXID0gd2lkdGggLyBkaW1lbnNpb25bMV0sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgIGNvbE5vLFxuICAgICAgICAgICAgd2lkdGhBcnIgPSBbXSxcbiAgICAgICAgICAgIG1heFdpZHRoLFxuICAgICAgICAgICAgZW5kQ29sLFxuICAgICAgICAgICAgc3RhcnRDb2wsXG4gICAgICAgICAgICBjdXJyV2lkdGgsXG4gICAgICAgICAgICBpc0NvbEFycmF5LFxuICAgICAgICAgICAgbWF0cml4Q3VyclcgPSAwO1xuXG4gICAgICAgIGZvcihrID0gMDsgayA8IGRpbWVuc2lvblsxXTsgaysrKSB7XG4gICAgICAgICAgICBtYXhXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGxlbkNvbmY7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbCA9IGNvbmZpZ1tpXS5jb2w7XG4gICAgICAgICAgICAgICAgY3VycldpZHRoID0gY29uZmlnW2ldLndpZHRoO1xuICAgICAgICAgICAgICAgIGlzQ29sQXJyYXkgPSBBcnJheS5pc0FycmF5KGNvbCk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJXaWR0aCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbE5vID0gKGlzQ29sQXJyYXkgJiYgY29sLmxlbmd0aCkgfHwgMTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0Q29sID0gKGlzQ29sQXJyYXkgJiYgY29sWzBdIHx8IGNvbCkgLSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRDb2wgPT09IGsgJiYgY29sTm8gPT09IDEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSBtYXhXaWR0aCA8IGN1cnJXaWR0aCA/IGN1cnJXaWR0aCA6IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuZENvbCA9IChpc0NvbEFycmF5ICYmIGNvbFtjb2wubGVuZ3RoIC0gMV0gfHwgY29sKSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmKGVuZENvbCA9PSBrICYmIHdpZHRoQXJyW2VuZENvbCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBtYXRyaXguZ2V0RGlmZih3aWR0aEFyciwgayAtIDEsIGN1cnJXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IG1heFdpZHRoIDwgY3VycldpZHRoID8gY3VycldpZHRoIDogbWF4V2lkdGg7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpZHRoQXJyW2tdID0gbWF4V2lkdGggPyBtYXhXaWR0aCA6ICgod2lkdGggLSBtYXRyaXhDdXJyVykgLyAoZGltZW5zaW9uWzFdIC0gaykpO1xuICAgICAgICAgICBcbiAgICAgICAgICAgIG1hdHJpeEN1cnJXICs9IHdpZHRoQXJyW2tdO1xuICAgICAgICB9XG4gICAgICAgXG4gICAgICAgIHdpZHRoQXJyID0gcmF0aW9FcXVpbGl6ZXIod2lkdGhBcnIsIHdpZHRoKTtcbiAgICAgICBcbiAgICAgICAgcmV0dXJuIHdpZHRoQXJyOyAgICBcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0RGlmZiA9IGZ1bmN0aW9uKGFyciwgaW5kZXgsIHZhbHVlKXtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgdG90YWwgPSAwO1xuXG4gICAgICAgIGZvcig7IGkgPCBpbmRleDsgaSsrKSB7XG4gICAgICAgICAgICB0b3RhbCArPSBhcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHZhbHVlIC0gdG90YWwpO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRQb3MgPSAgZnVuY3Rpb24oc3JjKXtcbiAgICAgICAgdmFyIGFyciA9IFtdLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBzcmMgJiYgc3JjLmxlbmd0aDtcblxuICAgICAgICBmb3IoOyBpIDw9IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGFyci5wdXNoKGkgPyAoc3JjW2ktMV0rYXJyW2ktMV0pIDogMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5tYXRyaXhNYW5hZ2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4ICYmIG1hdHJpeC5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmNvbmZpZyxcbiAgICAgICAgICAgIGxlbkNvbmYgPSBjb25maWcgJiYgY29uZmlnLmxlbmd0aCxcbiAgICAgICAgICAgIGRpbWVuc2lvblggPSBjb25maWd1cmF0aW9uLmRpbWVuc2lvblsxXSxcbiAgICAgICAgICAgIGRpbWVuc2lvblkgPSBjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSxcbiAgICAgICAgICAgIGNlbGxIID0gY29uZmlndXJhdGlvbi5oZWlnaHQgLyBkaW1lbnNpb25ZLFxuICAgICAgICAgICAgY2VsbFcgPSBjb25maWd1cmF0aW9uLndpZHRoIC8gZGltZW5zaW9uWCxcbiAgICAgICAgICAgIG1hdHJpeEhlaWdodEFyciA9IGNvbmZpZ3VyYXRpb24ucm93SGVpZ2h0IHx8IChtYXRyaXggJiYgbWF0cml4LmNhbGNSb3dIZWlnaHQoKSksXG4gICAgICAgICAgICBtYXRyaXhXaWRodEFyciA9IGNvbmZpZ3VyYXRpb24uY29sV2lkdGggfHwgKG1hdHJpeCAmJiBtYXRyaXguY2FsY0NvbFdpZHRoKCkpLFxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IFtdLFxuICAgICAgICAgICAgbWF0cml4UG9zWCA9IG1hdHJpeC5tYXRyaXhQb3NYID0gbWF0cml4LmdldFBvcyhtYXRyaXhXaWRodEFyciksXG4gICAgICAgICAgICBtYXRyaXhQb3NZID0gbWF0cml4Lm1hdHJpeFBvc1kgPSBtYXRyaXguZ2V0UG9zKG1hdHJpeEhlaWdodEFyciksXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBpc1Jvd0FycixcbiAgICAgICAgICAgIGlzQ29sQXJyLFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIHdpZHRoO1xuXG4gICAgICAgIGlmKCFjb25maWcgfHwgIWxlbkNvbmYpey8vaWYgY29uZmlnIGlzbid0IGRlZmluZWQgb3IgZW1wdHlcbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGRpbWVuc2lvblk7IGkrKyl7XG4gICAgICAgICAgICAgICAgZm9yKGogPSAwOyBqIDwgZGltZW5zaW9uWDsgaisrKXsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IGkgKiBjZWxsSDtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGogKiBjZWxsVztcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gY2VsbEg7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gY2VsbFc7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjb25maWdNYW5hZ2VyLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wIDogdG9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA6IGxlZnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcihpOyBpIDwgbGVuQ29uZjsgaSsrKXtcbiAgICAgICAgICAgICAgICByb3cgPSBjb25maWdbaV0ucm93O1xuICAgICAgICAgICAgICAgIGNvbCA9IGNvbmZpZ1tpXS5jb2w7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaXNDb2xBcnIgPSBBcnJheS5pc0FycmF5KGNvbCk7XG4gICAgICAgICAgICAgICAgaXNSb3dBcnIgPSBBcnJheS5pc0FycmF5KHJvdyk7XG4gICAgICAgICAgICAgICAgLy9nZW5lcmF0aW5nIGRpdiBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHRvcCA9IG1hdHJpeFBvc1lbKGlzUm93QXJyID8gTWF0aC5taW4uYXBwbHkobnVsbCxyb3cpIDogcm93KS0xXTtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbWF0cml4UG9zWFsoaXNDb2xBcnIgPyBNYXRoLm1pbi5hcHBseShudWxsLGNvbCkgOiBjb2wpLTFdO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IG1hdHJpeFBvc1lbKGlzUm93QXJyID8gTWF0aC5tYXguYXBwbHkobnVsbCxyb3cpIDogcm93KV0gLSB0b3A7XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYWyhpc0NvbEFyciA/IE1hdGgubWF4LmFwcGx5KG51bGwsY29sKSA6IGNvbCldIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25maWdNYW5hZ2VyLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0b3AgOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgOiBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGlkIDogY29uZmlnW2ldLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICBcblxuICAgICAgICByZXR1cm4gY29uZmlnTWFuYWdlcjtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0QXJyU3VtKGFycikge1xuICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBhcnIgJiYgYXJyLmxlbmd0aCxcbiAgICAgICAgICAgIHN1bSA9IDA7XG5cbiAgICAgICAgZm9yKDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIHN1bSArPSBhcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiByYXRpb0VxdWlsaXplcihhcnIsIHZhbHVlKSB7XG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgIGxlbkFyciA9IGFyciAmJiBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgc3VtID0gMCxcbiAgICAgICAgICAgIGRpZmY7XG5cbiAgICAgICAgZm9yKDtpIDwgbGVuQXJyOyBpKyspIHtcbiAgICAgICAgICAgIHN1bSArPSBhcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW5BcnI7IGkrKyl7ICAgICAgICBcbiAgICAgICAgICAgIGFycltpXSA9IChhcnJbaV0gLyBzdW0pICogdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBBcnJheS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgdGhpcyk7XG4gICAgfTtcblxuICAgIEFycmF5LnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShudWxsLCB0aGlzKTtcbiAgICB9OyAgICBcbn0pOyJdfQ==

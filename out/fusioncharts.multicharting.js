/**
 * MultiCharting Extension for FusionCharts
 * This module contains the basic routines required by subsequent modules to
 * extend/scale or add functionality to the MultiCharting object.
 *
 */

 /* global window: true */

(function (env, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = env.document ?
            factory(env) : function(win) {
                if (!win.document) {
                    throw new Error('Window with document not present');
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

    MultiCharting.prototype.win = _window;

    if (windowExists) {
        _window.MultiCharting = MultiCharting;
    }
    return MultiCharting;
});


(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	var merge = function (obj1, obj2, skipUndef, tgtArr, srcArr) {
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
        extend2 = function (obj1, obj2, skipUndef) {
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
        lib = {
            extend2: extend2,
            merge: merge
        };

	MultiCharting.prototype.lib = (MultiCharting.prototype.lib || lib);

});
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	var Ajax = function () {
			var ajax = this,
				argument = arguments[0];

		    ajax.onSuccess = argument.success;
		    ajax.onError = argument.error;
		    ajax.open = false;
		    return ajax.get(argument.url);
		},

        ajaxProto = Ajax.prototype,

        FUNCTION = 'function',
        MSXMLHTTP = 'Microsoft.XMLHTTP',
        MSXMLHTTP2 = 'Msxml2.XMLHTTP',
        GET = 'GET',
        XHREQERROR = 'XmlHttprequest Error',
        win = MultiCharting.prototype.win, // keep a local reference of window scope

        // Probe IE version
        version = parseFloat(win.navigator.appVersion.split('MSIE')[1]),
        ielt8 = (version >= 5.5 && version <= 7) ? true : false,
        firefox = /mozilla/i.test(win.navigator.userAgent),
        //
        // Calculate flags.
        // Check whether the page is on file protocol.
        fileProtocol = win.location.protocol === 'file:',
        AXObject = win.ActiveXObject,

        // Check if native xhr is present
        XHRNative = (!AXObject || !fileProtocol) && win.XMLHttpRequest,

        // Prepare function to retrieve compatible xmlhttprequest.
        newXmlHttpRequest = function () {
            var xmlhttp;

            // if xmlhttprequest is present as native, use it.
            if (XHRNative) {
                newXmlHttpRequest = function () {
                    return new XHRNative();
                };
                return newXmlHttpRequest();
            }

            // Use activeX for IE
            try {
                xmlhttp = new AXObject(MSXMLHTTP2);
                newXmlHttpRequest = function () {
                    return new AXObject(MSXMLHTTP2);
                };
            }
            catch (e) {
                try {
                    xmlhttp = new AXObject(MSXMLHTTP);
                    newXmlHttpRequest = function () {
                        return new AXObject(MSXMLHTTP);
                    };
                }
                catch (e) {
                    xmlhttp = false;
                }
            }
            return xmlhttp;
        },

        headers = {
            /**
             * Prevents cacheing of AJAX requests.
             * @type {string}
             */
            'If-Modified-Since': 'Sat, 29 Oct 1994 19:43:31 GMT',
            /**
             * Lets the server know that this is an AJAX request.
             * @type {string}
             */
            'X-Requested-With': 'XMLHttpRequest',
            /**
             * Lets server know which web application is sending requests.
             * @type {string}
             */
            'X-Requested-By': 'FusionCharts',
            /**
             * Mentions content-types that are acceptable for the response. Some servers require this for Ajax
             * communication.
             * @type {string}
             */
            'Accept': 'text/plain, */*',
            /**
             * The MIME type of the body of the request along with its charset.
             * @type {string}
             */
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };

    MultiCharting.prototype.ajax = function () {
        return new Ajax(arguments[0]);
    };

    ajaxProto.get = function (url) {
        var wrapper = this,
            xmlhttp = wrapper.xmlhttp,
            errorCallback = wrapper.onError,
            successCallback = wrapper.onSuccess,
            xRequestedBy = 'X-Requested-By',
            hasOwn = Object.prototype.hasOwnProperty,
            i;

        // X-Requested-By is removed from header during cross domain ajax call
        if (url.search(/^(http:\/\/|https:\/\/)/) !== -1 &&
                win.location.hostname !== /(http:\/\/|https:\/\/)([^\/\:]*)/.exec(url)[2]) {
            // If the url does not contain http or https, then its a same domain call. No need to use regex to get
            // domain. If it contains then checks domain.
            delete headers[xRequestedBy];
        }
        else {
            !hasOwn.call(headers, xRequestedBy) && (headers[xRequestedBy] = 'FusionCharts');
        }

        if (!xmlhttp || ielt8 || firefox) {
            xmlhttp = newXmlHttpRequest();
            wrapper.xmlhttp = xmlhttp;
        }

        xmlhttp.onreadystatechange = function () {
            
            if (xmlhttp.readyState === 4) {
                if ((!xmlhttp.status && fileProtocol) || (xmlhttp.status >= 200 &&
                        xmlhttp.status < 300) || xmlhttp.status === 304 ||
                        xmlhttp.status === 1223 || xmlhttp.status === 0) {
                    successCallback &&
                        successCallback(xmlhttp.responseText, wrapper, url);
                }
                else if (errorCallback) {
                    errorCallback(new Error(XHREQERROR), wrapper, url);
                }
                wrapper.open = false;
            }
        };

        try {
            xmlhttp.open(GET, url, true);

            if (xmlhttp.overrideMimeType) {
                xmlhttp.overrideMimeType('text/plain');
            }

            for (i in headers) {
                xmlhttp.setRequestHeader(i, headers[i]);
            }

            xmlhttp.send();
            wrapper.open = true;
        }
        catch (error) {
            if (errorCallback) {
                errorCallback(error, wrapper, url);
            }
        }

        return xmlhttp;
    };

    ajaxProto.abort = function () {
        var instance = this,
            xmlhttp = instance.xmlhttp;

        instance.open = false;
        return xmlhttp && typeof xmlhttp.abort === FUNCTION && xmlhttp.readyState &&
                xmlhttp.readyState !== 0 && xmlhttp.abort();
    };

    ajaxProto.dispose = function () {
        var instance = this;
        instance.open && instance.abort();

        delete instance.onError;
        delete instance.onSuccess;
        delete instance.xmlhttp;
        delete instance.open;

        return (instance = null);
    };
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    /* jshint ignore:start */
    // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.


    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    function CSVToArray (strData, strDelimiter) {
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");
        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );
        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];
        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;
        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){
            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];
            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
                ){
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );
            }
            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){
                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                var strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );
            } else {
                // We found a non-quoted value.
                var strMatchedValue = arrMatches[ 3 ];
            }
            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }
        // Return the parsed data.
        return( arrData );
    }
    /* jshint ignore:end */

    MultiCharting.prototype.convertToArray = function (data, delimiter, outputFormat, callback) {
        if (typeof data === 'object') {
            delimiter = data.delimiter;
            outputFormat = data.outputFormat;
            callback = data.callback;
            data = data.string;
        }

        if (typeof data !== 'string') {
            throw new Error('CSV string not provided');
        }
        var splitedData = data.split(/\r\n|\r|\n/),
            //total number of rows
            len = splitedData.length,
            //first row is header and spliting it into arrays
            header = CSVToArray(splitedData[0], delimiter), // jshint ignore:line
            i = 1,
            j = 0,
            k = 0,
            klen = 0,
            cell = [],
            min = Math.min,
            finalOb,
            updateManager = function () {
                var lim = 0,
                    jlen = 0,
                    obj = {};
                    lim = i + 3000;
                
                if (lim > len) {
                    lim = len;
                }
                
                for (; i < lim; ++i) {

                    //create cell array that cointain csv data
                    cell = CSVToArray(splitedData[i], delimiter); // jshint ignore:line
                    cell = cell && cell[0];
                    //take min of header length and total columns
                    jlen = min(header.length, cell.length);

                    if (outputFormat === 1) {
                        finalOb.push(cell);
                    }
                    else if (outputFormat === 2) {
                        for (j = 0; j < jlen; ++j) {                    
                            //creating the final object
                            obj[header[j]] = cell[j];
                        }
                        finalOb.push(obj);
                        obj = {};
                    }
                    else{
                        for (j = 0; j < jlen; ++j) {                    
                            //creating the final object
                            finalOb[header[j]].push(cell[j]);
                        }   
                    }
                }

                if (i < len - 1) {
                    //call update manager
                    // setTimeout(updateManager, 0);
                    updateManager();
                } else {
                    callback && callback(finalOb);
                }
            };

        outputFormat = outputFormat || 1;
        header = header && header[0];

        //if the value is empty
        if (splitedData[splitedData.length - 1] === '') {
            splitedData.splice((splitedData.length - 1), 1);
            len--;
        }
        if (outputFormat === 1) {
            finalOb = [];
            finalOb.push(header);
        } else if (outputFormat === 2) {
            finalOb = [];
        } else if (outputFormat === 3) {
            finalOb = {};
            for (k = 0, klen = header.length; k < klen; ++k) {
                finalOb[header[k]] = [];
            }   
        }

        updateManager();

    };

});

/*jshint esversion: 6 */
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	var	multiChartingProto = MultiCharting.prototype,
		lib = multiChartingProto.lib,
		dataStorage = lib.dataStorage = {},
		outputDataStorage = lib.outputDataStorage = {},
		// For storing the child of a parent
		linkStore = {},
		//For storing the parent of a child
		parentStore = lib.parentStore = {},
		idCount = 0,
		// Constructor class for DataStore.
		DataStore = function () {
	    	var manager = this;
	    	manager.uniqueValues = {};
	    	manager.setData(arguments[0]);
		},
		dataStoreProto = DataStore.prototype,

		// Function to execute the dataProcessor over the data
		executeProcessor = function (type, filterFn, JSONData) {
			switch (type) {
				case  'sort' : return Array.prototype.sort.call(JSONData, filterFn);
				case  'filter' : return Array.prototype.filter.call(JSONData, filterFn);
				case 'map' : return Array.prototype.map.call(JSONData, filterFn);
				default : return filterFn(JSONData);
			}
		},

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
				// Store all the dataObjs that are updated.
				tempDataUpdated = lib.tempDataUpdated = {};

			linkIds = linkData.link;
			filters = linkData.filter;
			len = linkIds.length;

			for (i = 0; i < len; i++) {
				linkId = linkIds[i];

				tempDataUpdated[linkId] = true;
				filter = filters[i];
				filterFn = filter.getProcessor();
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
		};

	multiChartingProto.createDataStore = function () {
		return new DataStore(arguments);
	};

	// Function to add data in the data store
	dataStoreProto.setData = function (dataSpecs, callback) {
		var dataStore = this,
			oldId = dataStore.id,
			id = dataSpecs.id,
			dataType = dataSpecs.dataType,
			dataSource = dataSpecs.dataSource,
			oldJSONData = dataStorage[oldId] || [],
			callbackHelperFn = function (JSONData) {
				dataStorage[id] = oldJSONData.concat(JSONData || []);
				JSONData && multiChartingProto.raiseEvent('dataAdded', {
					'id': id,
					'data' : JSONData
				}, dataStore);
				if (linkStore[id]) {
					updataData(id);
				}
				if (typeof callback === 'function') {
					callback(JSONData);
				}	
			};

		id = oldId || id || 'dataStorage' + idCount ++;
		dataStore.id = id;
		delete dataStore.keys;
		dataStore.uniqueValues = {};

		if (dataType === 'csv') {
			multiChartingProto.convertToArray({
				string : dataSpecs.dataSource,
				delimiter : dataSpecs.delimiter,
				outputFormat : dataSpecs.outputFormat,
				callback : function (data) {
					callbackHelperFn(data);
				}
			});
		}
		else {
			callbackHelperFn(dataSource);
		}
	};

	// Function to get the jsondata of the data object
	dataStoreProto.getJSON = function () {
		var id = this.id;
		return (outputDataStorage[id] || dataStorage[id]);
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
				newDataObj,
				isFilterArray = filters instanceof Array,
				len = isFilterArray ? filters.length : 1;

			for (i = 0; i < len; i++) {
				filter = filters[i] || filters;
				filterFn = filter.getProcessor();
				type = filter.type;

				if (typeof filterFn === 'function') {
					newData = executeProcessor(type, filterFn, dataStorage[id]);

					newDataObj = new DataStore({dataSource : newData});
					newId = newDataObj.id;
					parentStore[newId] = data;

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
					datalinks.push(newDataObj);

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
		var dataStore = this,
			id = optionalId || dataStore.id,
			linkData = linkStore[id],
			flag;

		if (linkData) {
			let i,
				link = linkData.link,
				len = link.length;
			for (i = 0; i < len; i ++) {
				dataStore.deleteData(link[i]);
			}
			delete linkStore[id];
		}

		flag = delete dataStorage[id];
		multiChartingProto.raiseEvent('dataDeleted', {
			'id': id,
		}, dataStore);
		return flag;
	};

	// Function to get the id of the current data
	dataStoreProto.getID = function () {
		return this.id;
	};

	// Function to modify data
	dataStoreProto.modifyData = function (dataSpecs, callback) {
		var dataStore = this,
			id = dataStore.id;

		dataStorage[id] = [];
		dataStore.setData(dataSpecs, callback);
		
		multiChartingProto.raiseEvent('dataModified', {
			'id': id
		}, dataStore);
	};

	// Function to add data to the dataStorage asynchronously via ajax
	dataStoreProto.setDataUrl = function () {
		var dataStore = this,
			argument = arguments[0],
			dataSource = argument.dataSource,
			dataType = argument.dataType,
			delimiter = argument.delimiter,
			outputFormat = argument.outputFormat,
			callback = argument.callback,
			callbackArgs = argument.callbackArgs,
			data;

		multiChartingProto.ajax({
			url : dataSource,
			success : function(string) {
				data = dataType === 'json' ? JSON.parse(string) : string;
				dataStore.setData({
					dataSource : data,
					dataType : dataType,
					delimiter : delimiter,
					outputFormat : outputFormat,
				}, callback);
			},

			error : function(){
				if (typeof callback === 'function') {
					callback(callbackArgs);
				}
			}
		});
	};

	// Funtion to get all the keys of the JSON data
	dataStoreProto.getKeys = function () {
		var dataStore = this,
			data = dataStorage[dataStore.id],
			internalData = data[0],
			keys = dataStore.keys;

		if (keys) {
			return keys;
		}
		if (internalData instanceof Array) {
			return (dataStore.keys = internalData);
		}
		else if (internalData instanceof Object) {
			return (dataStore.keys = Object.keys(internalData));
		}
	};

	// Funtion to get all the unique values corresponding to a key
	dataStoreProto.getUniqueValues = function (key) {
		var dataStore = this,
			data = dataStorage[dataStore.id],
			internalData = data[0],
			isArray = internalData instanceof Array,
			uniqueValues = dataStore.uniqueValues[key],
			tempUniqueValues = {},
			len = data.length,
			i;

		if (uniqueValues) {
			return uniqueValues;
		}

		if (isArray) {
			i = 1;
			key = dataStore.getKeys().findIndex(function (element) {
				return element.toUpperCase() === key.toUpperCase();
			});
		}
		else {
			i = 0;
		}

		for (i = isArray ? 1 : 0; i < len; i++) {
			internalData = isArray ? data[i][key] : data[i][key];
			!tempUniqueValues[internalData] && (tempUniqueValues[internalData] = true);
		}

		return (dataStore.uniqueValues[key] = Object.keys(tempUniqueValues));
	};

	//Function to modify the current JSON with the data obtained after applying dataProcessor
	dataStoreProto.applyDataProcessor = function (dataProcessor) {
		var dataStore = this,
			processorFn = dataProcessor.getProcessor(),
			type = dataProcessor.type,
			JSONData = dataStore.getJSON();

		if (typeof processorFn === 'function') {
			return (outputDataStorage[dataStore.id] = executeProcessor(type, processorFn, JSONData));
		}
	};
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

	var multiChartingProto = MultiCharting.prototype,
		lib = multiChartingProto.lib,
		filterStore = lib.filterStore = {},
		filterLink = lib.filterLink = {},
		filterIdCount = 0,
		dataStorage = lib.dataStorage,
		parentStore = lib.parentStore,
		// Constructor class for DataProcessor.
		DataProcessor = function () {
	    	var manager = this;
	    	manager.addRule(arguments[0]);
		},
		
		dataProcessorProto = DataProcessor.prototype,

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
					if (parentStore[dataId] && dataStorage[dataId]) {
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

	multiChartingProto.createDataProcessor = function () {
		return new DataProcessor(arguments[0]);
	};

	// Function to add filter in the filter store
	dataProcessorProto.addRule = function () {
		var filter = this,
			oldId = filter.id,
			argument = arguments[0],
			filterFn = (argument && argument.rule) || argument,
			id = argument && argument.type,
			type = argument && argument.type;

		id = oldId || id || 'filterStore' + filterIdCount ++;
		filterStore[id] = filterFn;

		filter.id = id;
		filter.type = type;

		// Update the data on which the filter is applied and also on the child data.
		if (filterLink[id]) {
			updataFilterProcessor(id);
		}

		multiChartingProto.raiseEvent('filterAdded', {
			'id': id,
			'data' : filterFn
		}, filter);
	};

	// Funtion to get the filter method.
	dataProcessorProto.getProcessor = function () {
		return filterStore[this.id];
	};

	// Function to get the ID of the filter.
	dataProcessorProto.getID = function () {
		return this.id;
	};


	dataProcessorProto.deleteProcessor = function () {
		var filter = this,
			id = filter.id;

		filterLink[id] && updataFilterProcessor(id, true);

		delete filterStore[id];
		delete filterLink[id];

		multiChartingProto.raiseEvent('filterDeleted', {
			'id': id,
		}, filter);
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

	dataProcessorProto.map = function () {
		this.addRule(
			{	rule : arguments[0],
				type : 'map'
			}
		);
	};
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    var extend2 = MultiCharting.prototype.lib.extend2;
    //function to convert data, it returns fc supported JSON
    var DataAdapter = function () {
        var argument = arguments[0] || {},
            dataadapter = this;

        dataadapter.dataStore = argument.datastore;       
        dataadapter.dataJSON = dataadapter.dataStore && dataadapter.dataStore.getJSON();
        dataadapter.configuration = argument.config;
        dataadapter.callback = argument.callback;
        dataadapter.FCjson = dataadapter.convertData();
    },
    protoDataadapter = DataAdapter.prototype;

    protoDataadapter.convertData = function() {
        var dataadapter = this,
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
                                    'category': [                        
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
                                lenData,
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
                            json.chart = {};
                            json.chart.datasets = [];
                            json.chart.datasets[0] = {};
                            json.chart.datasets[0].category = {};
                            json.chart.datasets[0].category.data = [];
                            for (i = 0, lenDimension =  configuration.dimension.length; i < lenDimension; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.dimension[i]);
                                if (indexMatch != -1) {
                                    for (j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.chart.datasets[0].category.data.push(jsonData[j][indexMatch]);
                                    }
                                }
                            }
                            json.chart.datasets[0].dataset = [];
                            json.chart.datasets[0].dataset[0] = {};
                            json.chart.datasets[0].dataset[0].series = [];
                            for (i = 0, lenMeasure = configuration.measure.length; i < lenMeasure; i++) {
                                indexMatch = jsonData[0].indexOf(configuration.measure[i]);
                                if (indexMatch != -1) {
                                    json.chart.datasets[0].dataset[0].series[i] = {  
                                        'name' : configuration.measure[i],                              
                                        'data': []
                                    };
                                    for(j = 1, lenData = jsonData.length; j < lenData; j++) {
                                        json.chart.datasets[0].dataset[0].series[i].data.push(jsonData[j][indexMatch]);
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
            setDefaultAttr = function (json) {
                json.chart || (json.chart = {});
                //json.chart.animation = 0;
                return json;
            },
            getAggregateData = function (data, key, aggregateMode) {
                var aggregateMethod = {
                    'sum' : function(){
                        var i,
                            j,
                            lenR,
                            lenC,
                            aggregatedData = data[0];
                        for(i = 1, lenR = data.length; i < lenR; i++) {
                            for(j = 0, lenC = data[i].length; j < lenC; j++) {
                                (data[i][j] != key) && (aggregatedData[j] = +aggregatedData[j] + +data[i][j]);
                            }
                        }
                        return aggregatedData;
                    },
                    'average' : function() {
                        var iAggregateMthd = this,
                            lenR = data.length,
                            aggregatedSumArr = iAggregateMthd.sum(),
                            i,
                            len,
                            aggregatedData = [];
                        for(i = 0, len = aggregatedSumArr.length; i < len; i++){
                            ((aggregatedSumArr[i] != key) && (aggregatedData[i] = (+aggregatedSumArr[i]) / lenR)) || (aggregatedData[i] = aggregatedSumArr[i]);
                        }
                        return aggregatedData;
                    }
                };

                aggregateMode = aggregateMode && aggregateMode.toLowerCase();
                aggregateMode = (aggregateMethod[aggregateMode] && aggregateMode) || 'sum';

                return aggregateMethod[aggregateMode]();
            },
            getSortedData = function (data, categoryArr, dimension, aggregateMode) {
                var indeoxOfKey,
                    newData = [],
                    subSetData = [],
                    key = [],
                    categories = [],
                    lenKey,
                    lenData,
                    lenCat,
                    j,
                    k,
                    i,
                    arr = [];
                (!Array.isArray(dimension) && (key = [dimension])) || (key = dimension);
                (!Array.isArray(categoryArr[0]) && (categories = [categoryArr])) || (categories = categoryArr);

                newData.push(data[0]);
                for(k = 0, lenKey = key.length; k < lenKey; k++) {
                    indeoxOfKey = data[0].indexOf(key[k]);                    
                    for(i = 0,lenCat = categories[k].length; i < lenCat  && indeoxOfKey !== -1; i++) {
                        subSetData = [];
                        for(j = 1, lenData = data.length; j < lenData; j++) {                        
                            (data[j][indeoxOfKey] == categories[k][i]) && (subSetData.push(data[j]));
                        }     
                        arr[indeoxOfKey] = categories[k][i];
                        (subSetData.length === 0) && (subSetData.push(arr));
                        newData.push(getAggregateData(subSetData, categories[k][i], aggregateMode));
                    }
                }
                return newData;
            },
            dataArray,
            json = {},
            predefinedJson = {};

            jsonData = dataadapter.dataJSON;
            configuration = dataadapter.configuration;
            callback = dataadapter.callback;

            predefinedJson = configuration && configuration.config;

        if (jsonData && configuration) {
            dataArray = generalDataFormat(jsonData, configuration);
            configuration.categories && (dataArray = getSortedData(dataArray, configuration.categories, configuration.dimension, configuration.aggregateMode));
            dataadapter.dataArray = dataArray;
            json = jsonCreator(dataArray, configuration);            
        }
        json = (predefinedJson && extend2(json,predefinedJson)) || json;
        return (callback && callback(json)) || setDefaultAttr(json); 
    };

    protoDataadapter.getFCjson = function() {
        return this.FCjson;
    };

    protoDataadapter.getDataJson = function() {
        return this.dataJSON;
    };

    protoDataadapter.getDataArray = function() {
        return this.dataArray;
    };

    protoDataadapter.getDimension = function () {
        return this.configuration.dimension;
    };

    MultiCharting.prototype.dataadapter = function () {
        return new DataAdapter(arguments[0]);
    };
});
 /* global FusionCharts: true */

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

   // var FusionCharts = MultiCharting.prototype.win.FusionCharts;

    var Chart = function () {
            var chart = this,
                argument = arguments[0] || {};

            chart.dataStoreJson = argument.configuration.getDataJson();
            chart.dimension = argument.configuration.getDimension();
            chart.render(arguments[0]);
        },
        chartProto = Chart.prototype,
        extend2 = MultiCharting.prototype.lib.extend2;

    chartProto.render = function () {
        var chart = this,
            argument = arguments[0] || {};

        //get fc supported json            
        chart.getJSON(argument);        
        //render FC 
        chart.chartObj = new FusionCharts(chart.chartConfig);
        chart.chartObj.render();

        chart.chartObj.addEventListener('dataplotrollover', function (e, d) {
            var dataRow = getRowData(chart.dataStoreJson, chart.dimension, d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataRow
            }, chart);
        });
    };

    chartProto.getJSON = function () {
        var chart = this,
            argument =arguments[0] || {},
            configuration,
            chartConfig = {},
            dataSource = {},
            configData = {};
        //parse argument into chartConfig 
        extend2(chartConfig,argument);
        
        //data configuration 
        configuration = argument.configuration || {};

        //store fc supported json to render charts
        dataSource = configuration.getFCjson();

        //delete data configuration parts for FC json converter
        delete chartConfig.configuration;
        
        //set data source into chart configuration
        chartConfig.dataSource = dataSource;
        chart.chartConfig = chartConfig;        
    };

    chartProto.update = function () {
        var chart = this,
            argument =arguments[0] || {};

        chart.getJSON(argument);
        chart.chartObj.chartType(chart.chartConfig.type);
        chart.chartObj.setJSONData(chart.chartConfig.dataSource);
    };

    function getRowData (data, dimension, key) {
        var i = 0,
            j = 0,
            lenR,
            len,
            isArray = Array.isArray(data[0]),
            index = -1,
            keys,
            row = [];
    
        for(lenR = data.length; i < lenR; i++) {
            isArray && (index = data[i].indexOf(key));
            if(index !== -1 && isArray) {
                return data[i];
            }
            if(!isArray && data[i][dimension] == key) {
                keys = Object.keys(data[i]);                
                for (j = 0, len = keys.length; j < len; j++) {
                    row[j] = data[i][keys[j]];
                }
                return row;
            }
        }
    
    }

    MultiCharting.prototype.createChart = function () {
        return new Chart(arguments[0]);
    };
});


(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    var createChart = MultiCharting.prototype.createChart,
        document = MultiCharting.prototype.win.document,
        PX = 'px',
        DIV = 'div',
        EMPTY_STRING = '',
        ABSOLUTE = 'absolute',
        MAX_PERCENT = '100%',
        BLOCK = 'block',
        RELATIVE = 'relative',
        ID = 'id',
        BORDER_BOX = 'border-box';

    var Cell = function () {
            var cell = this;
            cell.container = arguments[1];
            cell.config = arguments[0];
            cell.draw();
            cell.config.chart && cell.renderChart();
        },
        protoCell = Cell.prototype;

    protoCell.draw = function (){
        var cell = this;
        cell.graphics = document.createElement(DIV);
        cell.graphics.id = cell.config.id || EMPTY_STRING;        
        cell.graphics.style.height = cell.config.height + PX;
        cell.graphics.style.width = cell.config.width + PX;
        cell.graphics.style.top = cell.config.top + PX;
        cell.graphics.style.left = cell.config.left + PX;
        cell.graphics.style.position = ABSOLUTE;
        cell.graphics.style.boxSizing = BORDER_BOX;
        cell.graphics.className = cell.config.className;
        cell.graphics.innerHTML = cell.config.html || EMPTY_STRING;
        cell.container.appendChild(cell.graphics);
    };

    protoCell.renderChart = function () {
        var cell = this; 

        cell.config.chart.renderAt = cell.config.id;
        cell.config.chart.width = MAX_PERCENT;
        cell.config.chart.height = MAX_PERCENT;
      
        if(cell.chart) {
            cell.chart.update(cell.config.chart);
        } else {
            cell.chart = createChart(cell.config.chart);            
        }
        return cell.chart;
    };

    protoCell.update = function (newConfig) {
        var cell = this,
            id = cell.config.id;

        if(newConfig){
            cell.config = newConfig;
            cell.config.id = id;
            cell.graphics.id = cell.config.id || EMPTY_STRING;        
            cell.graphics.className = cell.config.className;
            cell.graphics.style.height = cell.config.height + PX;
            cell.graphics.style.width = cell.config.width + PX;
            cell.graphics.style.top = cell.config.top + PX;
            cell.graphics.style.left = cell.config.left + PX;
            cell.graphics.style.position = ABSOLUTE;
            !cell.config.chart && (cell.graphics.innerHTML = cell.config.html || EMPTY_STRING);
            if(cell.config.chart) {
                cell.chart = cell.renderChart();             
            } else {
                delete cell.chart;
            } 
        }  
        return cell;      
    };

    var Matrix = function (selector, configuration) {
            var matrix = this;
            matrix.selector = selector;
            //matrix container
            matrix.matrixContainer = document.getElementById(selector);
            matrix.configuration = configuration;
            matrix.defaultH = 100;
            matrix.defaultW = 100;

            //dispose matrix context
            matrix.dispose();
            //set style, attr on matrix container 
            matrix.setAttrContainer();
        },
        protoMatrix = Matrix.prototype,
        chartId = 0;

    //function to set style, attr on matrix container
    protoMatrix.setAttrContainer = function() {
        var matrix = this,
            container = matrix && matrix.matrixContainer;        
        container.style.position = RELATIVE;
    };

    //function to set height, width on matrix container
    protoMatrix.setContainerResolution = function (heightArr, widthArr) {
        var matrix = this,
            container = matrix && matrix.matrixContainer,
            height = 0,
            width = 0,
            i,
            len;
        for(i = 0, len = heightArr.length; i < len; i++) {
            height += heightArr[i];
        }

        for(i = 0, len = widthArr.length; i < len; i++) {
            width += widthArr[i];
        }

        container.style.height = height + PX;
        container.style.width = width + PX;
    };

    //function to draw matrix
    protoMatrix.draw = function(){
        var matrix = this,
            configuration = matrix && matrix.configuration || {},
            //store virtual matrix for user given configuration
            configManager = configuration && matrix && matrix.drawManager(configuration),
            len = configManager && configManager.length,
            placeHolder = [],
            parentContainer = matrix && matrix.matrixContainer,
            lenC,
            i,
            j,
            callBack = arguments[0];
        
        for(i = 0; i < len; i++) {
            placeHolder[i] = [];
            for(j = 0, lenC = configManager[i].length; j < lenC; j++){
                //store cell object in logical matrix structure
                placeHolder[i][j] = new Cell(configManager[i][j],parentContainer);
            }
        }

        matrix.placeHolder = [];
        matrix.placeHolder = placeHolder;
        callBack && callBack();
    };

    //function to manage matrix draw
    protoMatrix.drawManager = function (configuration) {
        var matrix = this,
            i,
            j,
            lenRow = configuration.length,
            //store mapping matrix based on the user configuration
            shadowMatrix = matrix.matrixManager(configuration),            
            heightArr = matrix.getRowHeight(shadowMatrix),
            widthArr = matrix.getColWidth(shadowMatrix),
            drawManagerObjArr = [],
            lenCell,
            matrixPosX = matrix.getPos(widthArr),
            matrixPosY = matrix.getPos(heightArr),
            rowspan,
            colspan,
            id,
            className,
            top,
            left,
            height,
            width,
            chart,
            html,
            row,
            col;
        //calculate and set placeholder in shadow matrix
        configuration = matrix.setPlcHldr(shadowMatrix, configuration);
        //function to set height, width on matrix container
        matrix.setContainerResolution(heightArr, widthArr);
        //calculate cell position and heiht and 
        for (i = 0; i < lenRow; i++) {  
            drawManagerObjArr[i] = [];          
            for (j = 0, lenCell = configuration[i].length; j < lenCell; j++) {
                rowspan = parseInt(configuration[i][j] && configuration[i][j].rowspan || 1);
                colspan = parseInt(configuration[i][j] && configuration[i][j].colspan || 1);                
                chart = configuration[i][j] && configuration[i][j].chart;
                html = configuration[i][j] && configuration[i][j].html;
                row = parseInt(configuration[i][j].row);
                col = parseInt(configuration[i][j].col);
                left = matrixPosX[col];
                top = matrixPosY[row];
                width = matrixPosX[col + colspan] - left;
                height = matrixPosY[row + rowspan] - top;
                id = (configuration[i][j] && configuration[i][j].id) || matrix.idCreator(row,col);
                className = configuration[i][j] && configuration[i][j].className || '';
                drawManagerObjArr[i].push({
                    top       : top,
                    left      : left,
                    height    : height,
                    width     : width,
                    className : className,
                    id        : id,
                    rowspan   : rowspan,
                    colspan   : colspan,
                    html      : html,
                    chart     : chart
                });
            }
        }

        return drawManagerObjArr;
    };

    protoMatrix.idCreator = function(){
        chartId++;       
        return ID + chartId;
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

    protoMatrix.setPlcHldr = function(shadowMatrix, configuration){
        var row,
            col,
            i,
            j,
            lenR,
            lenC;

        for(i = 0, lenR = shadowMatrix.length; i < lenR; i++){ 
            for(j = 0, lenC = shadowMatrix[i].length; j < lenC; j++){
                row = shadowMatrix[i][j].id.split('-')[0];
                col = shadowMatrix[i][j].id.split('-')[1];

                configuration[row][col].row = configuration[row][col].row === undefined ? i 
                                                                    : configuration[row][col].row;
                configuration[row][col].col = configuration[row][col].col === undefined ? j 
                                                                    : configuration[row][col].col;
            }
        }
        return configuration;
    };

    protoMatrix.getRowHeight = function(shadowMatrix) {
        var i,
            j,
            lenRow = shadowMatrix && shadowMatrix.length,
            lenCol,
            height = [],
            currHeight,
            maxHeight;
            
        for (i = 0; i < lenRow; i++) {
            for(j = 0, maxHeight = 0, lenCol = shadowMatrix[i].length; j < lenCol; j++) {
                if(shadowMatrix[i][j]) {
                    currHeight = shadowMatrix[i][j].height;
                    maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
                }
            }
            height[i] = maxHeight;
        }

        return height;
    };

    protoMatrix.getColWidth = function(shadowMatrix) {
        var i = 0,
            j = 0,
            lenRow = shadowMatrix && shadowMatrix.length,
            lenCol,
            width = [],
            currWidth,
            maxWidth;
        for (i = 0, lenCol = shadowMatrix[j].length; i < lenCol; i++){
            for(j = 0, maxWidth = 0; j < lenRow; j++) {
                if (shadowMatrix[j][i]) {
                    currWidth = shadowMatrix[j][i].width;        
                    maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
                }
            }
            width[i] = maxWidth;
        }

        return width;
    };

    protoMatrix.matrixManager = function (configuration) {
        var matrix = this,
            shadowMatrix = [],
            i,
            j,
            k,
            l,
            lenRow = configuration.length,
            lenCell,
            rowSpan,
            colSpan,
            width,
            height,
            defaultH = matrix.defaultH,
            defaultW = matrix.defaultW,
            offset;
            
        for (i = 0; i < lenRow; i++) {            
            for (j = 0, lenCell = configuration[i].length; j < lenCell; j++) {
            
                rowSpan = (configuration[i][j] && configuration[i][j].rowspan) || 1;
                colSpan = (configuration[i][j] && configuration[i][j].colspan) || 1;   
                
                width = (configuration[i][j] && configuration[i][j].width);
                width = (width && (width / colSpan)) || defaultW;
                width = +width.toFixed(2);

                height = (configuration[i][j] && configuration[i][j].height);
                height = (height && (height / rowSpan)) || defaultH;                      
                height = +height.toFixed(2);

                for (k = 0, offset = 0; k < rowSpan; k++) {
                    for (l = 0; l < colSpan; l++) {

                        shadowMatrix[i + k] = shadowMatrix[i + k] ? shadowMatrix[i + k] : [];
                        offset = j + l;

                        while(shadowMatrix[i + k][offset]) {
                            offset++;
                        }

                        shadowMatrix[i + k][offset] = {
                            id : (i + '-' + j),
                            width : width,
                            height : height
                        };
                    }
                }
            }
        }

        return shadowMatrix;
    };

    protoMatrix.getBlock  = function() {
        var id = arguments[0],
            matrix = this,
            placeHolder = matrix && matrix.placeHolder,
            i,
            j,
            lenR = placeHolder.length,
            lenC;
        for(i = 0; i < lenR; i++) {
            for(j = 0, lenC = placeHolder[i].length; j < lenC; j++) {
                if (placeHolder[i][j].config.id == id) {
                    return placeHolder[i][j];
                }
            }
        }
    };

    protoMatrix.update = function (configuration) {
        var matrix = this,
            configManager = configuration && matrix && matrix.drawManager(configuration),
            len = configManager && configManager.length,
            lenC,
            lenPlcHldr,
            i,
            j,
            k,
            placeHolder = matrix && matrix.placeHolder,
            parentContainer  = matrix && matrix.matrixContainer,
            disposalBox = [],
            recycledCell;

        lenPlcHldr = placeHolder.length;
        for (k = len; k < lenPlcHldr; k++) {
            disposalBox = disposalBox.concat(placeHolder.pop());            
        }        
        for(i = 0; i < len; i++) {    
            if(!placeHolder[i]) {
                placeHolder[i] = [];
            }
            for(j = 0, lenC = configManager[i].length; j < lenC; j++){
                if(placeHolder[i][j]) {
                    placeHolder[i][j].update(configManager[i][j]);
                } else {                   
                    recycledCell = disposalBox.pop();
                    if(recycledCell) {
                        placeHolder[i][j] = recycledCell.update(configManager[i][j]);
                        
                    } else {
                        placeHolder[i][j] = new Cell(configManager[i][j],parentContainer);
                    }
                }
            }

            lenPlcHldr = placeHolder[i].length;
            lenC = configManager[i].length;

            for (k = lenC; k < lenPlcHldr; k++) {
                disposalBox = disposalBox.concat(placeHolder[i].pop());    
            }
        }
        for(i = 0, len = disposalBox.length; i < len; i++) {
            if(disposalBox[i] !== undefined) {
                disposalBox[i].chart && disposalBox[i].chart.chartObj.dispose();
                parentContainer.removeChild(disposalBox[i] && disposalBox[i].graphics);
                delete disposalBox[i];
            }
            delete disposalBox[i];
        }   
    };

    protoMatrix.dispose = function () {
        var matrix = this,
            node  = matrix && matrix.matrixContainer,
            placeHolder = matrix && matrix.placeHolder,
            i,
            j;
        for(i = 0, lenR = placeHolder && placeHolder.length; i < lenR; i++) {
            for (j = 0, lenC = placeHolder[i] && placeHolder[i].length; j < lenC; j++) {
                placeHolder[i][j].chart && placeHolder[i][j].chart.chartObj && 
                    placeHolder[i][j].chart.chartObj.dispose();
            }
        }
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
        node.style.height = '0px';
        node.style.width = '0px';
    };

    MultiCharting.prototype.createMatrix = function () {
        return new Matrix(arguments[0],arguments[1]);
    };
});
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {
    
    /* global FusionCharts: true */
    var global = MultiCharting.prototype,
        win = global.win,

        objectProtoToString = Object.prototype.toString,
        arrayToStringIdentifier = objectProtoToString.call([]),
        isArray = function (obj) {
            return objectProtoToString.call(obj) === arrayToStringIdentifier;
        },

        // A function to create an abstraction layer so that the try-catch /
        // error suppression of flash can be avoided while raising events.
        managedFnCall = function (item, scope, event, args) {
            // We change the scope of the function with respect to the
            // object that raised the event.
            try {
                item[0].call(scope, event, args || {});
                // console.log(args);
            }
            catch (e) {
                // Call error in a separate thread to avoid stopping
                // of chart load.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        },

        // Function that executes all functions that are to be invoked upon trigger
        // of an event.
        slotLoader = function (slot, event, args) {
            // If slot does not have a queue, we assume that the listener
            // was never added and halt method.
            if (!(slot instanceof Array)) {
                // Statutory W3C NOT preventDefault flag
                return;
            }

            // Initialize variables.
            var i = 0, scope;

            // Iterate through the slot and look for match with respect to
            // type and binding.
            for (; i < slot.length; i += 1) {

                // If there is a match found w.r.t. type and bind, we fire it.
                if (slot[i][1] === event.sender || slot[i][1] === undefined) {

                    // Determine the sender of the event for global events.
                    // The choice of scope differes depending on whether a
                    // global or a local event is being raised.
                    scope = slot[i][1] === event.sender ?
                        event.sender : global;

                    managedFnCall(slot[i], scope, event, args);

                    // Check if the user wanted to detach the event
                    if (event.detached === true) {
                        slot.splice(i, 1);
                        i -= 1;
                        event.detached = false;
                    }
                }

                // Check whether propagation flag is set to false and discontnue
                // iteration if needed.
                if (event.cancelled === true) {
                    break;
                }
            }
        },

        eventMap = {
            hoverin : 'dataplotrollover',
            hoverout : 'dataplotrollout',
            clik : 'dataplotclick'
        },
        raiseEvent,

        EventTarget = {

            unpropagator: function () {
                return (this.cancelled = true) === false;
            },
            detacher: function () {
                return (this.detached = true) === false;
            },
            undefaulter: function () {
                return (this.prevented = true) === false;
            },

            // Entire collection of listeners.
            listeners: {},

            // The last raised event id. Allows to calculate the next event id.
            lastEventId: 0,

            addListener: function (type, listener, bind) {
            
                var recurseReturn,
                    FCEventType,
                    i;
                // In case type is sent as array, we recurse this function.
                if (isArray(type)) {
                    recurseReturn = [];
                    // We look into each item of the 'type' parameter and send it,
                    // along with other parameters to a recursed addListener
                    // method.
                    for (i = 0; i < type.length; i += 1) {
                        recurseReturn.push(EventTarget.addListener(type[i], listener, bind));
                    }
                    return recurseReturn;
                }

                // Validate the type parameter. Listener cannot be added without
                // valid type.
                if (typeof type !== 'string') {
                    /**
                     * The event name has not been provided while adding an event listener. Ensure that you pass a
                     * `string` to the first parameter of {@link FusionCharts.addEventListener}.
                     *
                     * @typedef {ParameterException} Error-03091549
                     * @memberOf FusionCharts.debugger
                     * @group debugger-error
                     */
                    global.raiseError(bind || global, '03091549', 'param', '::EventTarget.addListener',
                        new Error('Unspecified Event Type'));
                    return;
                }

                // Listener must be a function. It will not eval a string.
                if (typeof listener !== 'function') {
                    /**
                     * The event listener passed to {@link FusionCharts.addEventListener} needs to be a function.
                     *
                     * @typedef {ParameterException} Error-03091550
                     * @memberOf FusionCharts.debugger
                     * @group debugger-error
                     */
                    global.raiseError(bind || global, '03091550', 'param', '::EventTarget.addListener',
                        new Error('Invalid Event Listener'));
                    return;
                }

                // Desensitize the type case for user accessability.
                type = type.toLowerCase();

                // If the insertion position does not have a queue, then create one.
                if (!(EventTarget.listeners[type] instanceof Array)) {
                    EventTarget.listeners[type] = [];
                }

                // Add the listener to the queue.
                EventTarget.listeners[type].push([listener, bind]);

                if (FCEventType = eventMap[type]) {
                    FusionCharts.addEventListener(FCEventType, function (e, d) {
                        raiseEvent(type, {
                            FCEventObj : e,
                            FCDataObj : d
                        }, MultiCharting);
                    });
                }

                return listener;
            },

            removeListener: function (type, listener, bind) {

                var slot,
                    i;

                // Listener must be a function. Else we have nothing to remove!
                if (typeof listener !== 'function') {
                    /**
                     * The event listener passed to {@link FusionCharts.removeEventListener} needs to be a function.
                     * Otherwise, the event listener function has no way to know which function is to be removed.
                     *
                     * @typedef {ParameterException} Error-03091560
                     * @memberOf FusionCharts.debugger
                     * @group debugger-error
                     */
                    global.raiseError(bind || global, '03091560', 'param', '::EventTarget.removeListener',
                        new Error('Invalid Event Listener'));
                    return;
                }

                // In case type is sent as array, we recurse this function.
                if (type instanceof Array) {
                    // We look into each item of the 'type' parameter and send it,
                    // along with other parameters to a recursed addListener
                    // method.
                    for (i = 0; i < type.length; i += 1) {
                        EventTarget.removeListener(type[i], listener, bind);
                    }
                    return;
                }

                // Validate the type parameter. Listener cannot be removed without
                // valid type.
                if (typeof type !== 'string') {
                    /**
                     * The event name passed to {@link FusionCharts.removeEventListener} needs to be a string.
                     *
                     * @typedef {ParameterException} Error-03091559
                     * @memberOf FusionCharts.debugger
                     * @group debugger-error
                     */
                    global.raiseError(bind || global, '03091559', 'param', '::EventTarget.removeListener',
                        new Error('Unspecified Event Type'));
                    return;
                }

                // Desensitize the type case for user accessability.
                type = type.toLowerCase();

                // Create a reference to the slot for easy lookup in this method.
                slot = EventTarget.listeners[type];

                // If slot does not have a queue, we assume that the listener
                // was never added and halt method.
                if (!(slot instanceof Array)) {
                    return;
                }

                // Iterate through the slot and remove every instance of the
                // event handler.
                for (i = 0; i < slot.length; i += 1) {
                    // Remove all instances of the listener found in the queue.
                    if (slot[i][0] === listener && slot[i][1] === bind) {
                        slot.splice(i, 1);
                        i -= 1;
                    }
                }
            },

            // opts can have { async:true, omni:true }
            triggerEvent: function (type, sender, args, eventScope, defaultFn, cancelFn) {

                // In case, event type is missing, dispatch cannot proceed.
                if (typeof type !== 'string') {
                    /**
                     * The event name passed to {@link FusionCharts.removeEventListener} needs to be a string.
                     * @private
                     *
                     * @typedef {ParameterException} Error-03091602
                     * @memberOf FusionCharts.debugger
                     * @group debugger-error
                     */
                    global.raiseError(sender, '03091602', 'param', '::EventTarget.dispatchEvent',
                        new Error('Invalid Event Type'));
                    return undefined;
                }

                // Desensitize the type case for user accessability.
                type = type.toLowerCase();

                // Model the event as per W3C standards. Add the function to cancel
                // event propagation by user handlers. Also append an incremental
                // event id.
                var eventObject = {
                    eventType: type,
                    eventId: (EventTarget.lastEventId += 1),
                    sender: sender || new Error('Orphan Event'),
                    cancelled: false,
                    stopPropagation: this.unpropagator,
                    prevented: false,
                    preventDefault: this.undefaulter,
                    detached: false,
                    detachHandler: this.detacher
                };

                /**
                 * Event listeners are used to tap into different stages of creating, updating, rendering or removing
                 * charts. A FusionCharts instance fires specific events based on what stage it is in. For example, the
                 * `renderComplete` event is fired each time a chart has finished rendering. You can listen to any such
                 * event using {@link FusionCharts.addEventListener} or {@link FusionCharts#addEventListener} and bind
                 * your own functions to that event.
                 *
                 * These functions are known as "listeners" and are passed on to the second argument (`listener`) of the
                 * {@link FusionCharts.addEventListener} and {@link FusionCharts#addEventListener} functions.
                 *
                 * @callback FusionCharts~eventListener
                 * @see FusionCharts.addEventListener
                 * @see FusionCharts.removeEventListener
                 *
                 * @param {object} eventObject - The first parameter passed to the listener function is an event object
                 * that contains all information pertaining to a particular event.
                 *
                 * @param {string} eventObject.type - The name of the event.
                 *
                 * @param {number} eventObject.eventId - A unique ID associated with the event. Internally it is an
                 * incrementing counter and as such can be indirectly used to verify the order in which  the event was
                 * fired.
                 *
                 * @param {FusionCharts} eventObject.sender - The instance of FusionCharts object that fired this event.
                 * Occassionally, for events that are not fired by individual charts, but are fired by the framework,
                 * will have the framework as this property.
                 *
                 * @param {boolean} eventObject.cancelled - Shows whether an  event's propagation was cancelled or not.
                 * It is set to `true` when `.stopPropagation()` is called.
                 *
                 * @param {function} eventObject.stopPropagation - Call this function from within a listener to prevent
                 * subsequent listeners from being executed.
                 *
                 * @param {boolean} eventObject.prevented - Shows whether the default action of this event has been
                 * prevented. It is set to `true` when `.preventDefault()` is called.
                 *
                 * @param {function} eventObject.preventDefault - Call this function to prevent the default action of an
                 * event. For example, for the event {@link FusionCharts#event:beforeResize}, if you do
                 * `.preventDefault()`, the resize will never take place and instead
                 * {@link FusionCharts#event:resizeCancelled} will be fired.
                 *
                 * @param {boolean} eventObject.detached - Denotes whether a listener has been detached and no longer
                 * gets executed for any subsequent event of this particular `type`.
                 *
                 * @param {function} eventObject.detachHandler - Allows the listener to remove itself rather than being
                 * called externally by {@link FusionCharts.removeEventListener}. This is very useful for one-time event
                 * listening or for special situations when the event is no longer required to be listened when the
                 * event has been fired with a specific condition.
                 *
                 * @param {object} eventArgs - Every event has an argument object as second parameter that contains
                 * information relevant to that particular event.
                 */
                slotLoader(EventTarget.listeners[type], eventObject, args);

                // Facilitate the call of a global event listener.
                slotLoader(EventTarget.listeners['*'], eventObject, args);

                // Execute default action
                switch (eventObject.prevented) {
                    case true:
                        if (typeof cancelFn === 'function') {
                            try {
                                cancelFn.call(eventScope || sender || win, eventObject,
                                    args || {});
                            }
                            catch (err) {
                                // Call error in a separate thread to avoid stopping
                                // of chart load.
                                setTimeout(function () {
                                    throw err;
                                }, 0);
                            }
                        }
                        break;
                    default:
                        if (typeof defaultFn === 'function') {
                            try {
                                defaultFn.call(eventScope || sender || win, eventObject,
                                    args || {});
                            }
                            catch (err) {
                                // Call error in a separate thread to avoid stopping
                                // of chart load.
                                setTimeout(function () {
                                    throw err;
                                }, 0);
                            }
                        }
                }

                // Statutory W3C NOT preventDefault flag
                return true;
            }
        },

        /**
         * List of events that has an equivalent legacy event. Used by the
         * raiseEvent method to check whether a particular event raised
         * has any corresponding legacy event.
         *
         * @type object
         */
        legacyEventList = global.legacyEventList = {},

        /**
         * Maintains a list of recently raised conditional events
         * @type object
         */
        conditionChecks = {};

    // Facilitate for raising events internally.
    raiseEvent = global.raiseEvent = function (type, args, obj, eventScope,
            defaultFn, cancelledFn) {
        return EventTarget.triggerEvent(type, obj, args, eventScope,
            defaultFn, cancelledFn);
    };

    global.disposeEvents = function (target) {
        var type, i;
        // Iterate through all events in the collection of listeners
        for (type in EventTarget.listeners) {
            for (i = 0; i < EventTarget.listeners[type].length; i += 1) {
                // When a match is found, delete the listener from the
                // collection.
                if (EventTarget.listeners[type][i][1] === target) {
                    EventTarget.listeners[type].splice(i, 1);
                }
            }
        }
    };
    /**
     * This method allows to uniformly raise events of FusionCharts
     * Framework.
     *
     * @param {string} name specifies the name of the event to be raised.
     * @param {object} args allows to provide an arguments object to be
     * passed on to the event listeners.
     * @param } obj is the FusionCharts instance object on
     * behalf of which the event would be raised.
     * @param {array} legacyArgs is an array of arguments to be passed on
     * to the equivalent legacy event.
     * @param {Event} source
     * @param {function} defaultFn
     * @param {function} cancelFn
     *
     * @type undefined
     */
    global.raiseEventWithLegacy = function (name, args, obj, legacyArgs,
            eventScope, defaultFn, cancelledFn) {
        var legacy = legacyEventList[name];
        raiseEvent(name, args, obj, eventScope, defaultFn, cancelledFn);
        if (legacy && typeof win[legacy] === 'function') {
            setTimeout(function () {
                win[legacy].apply(eventScope || win, legacyArgs);
            }, 0);
        }
    };

    /**
     * This allows one to raise related events that are grouped together and
     * raised by multiple sources. Usually this is used where a congregation
     * of successive events need to cancel out each other and behave like a
     * unified entity.
     *
     * @param {string} check is used to identify event groups. Provide same value
     * for all events that you want to group together from multiple sources.
     * @param {string} name specifies the name of the event to be raised.
     * @param {object} args allows to provide an arguments object to be
     * passed on to the event listeners.
     * @param } obj is the FusionCharts instance object on
     * behalf of which the event would be raised.
     * @param {object} eventScope
     * @param {function} defaultFn
     * @param {function} cancelledFn
     *
     * @returns {undefined}
     */
    global.raiseEventGroup = function (check, name, args, obj, eventScope,
            defaultFn, cancelledFn) {
        var id = obj.id,
            hash = check + id;

        if (conditionChecks[hash]) {
            clearTimeout(conditionChecks[hash]);
            delete conditionChecks[hash];
        }
        else {
            if (id && hash) {
                conditionChecks[hash] = setTimeout(function () {
                    raiseEvent(name, args, obj, eventScope, defaultFn, cancelledFn);
                    delete conditionChecks[hash];
                }, 0);
            }
            else {
                raiseEvent(name, args, obj, eventScope, defaultFn, cancelledFn);
            }
        }
    };

    // Extend the eventlisteners to internal global.
    global.addEventListener = function (type, listener) {
        return EventTarget.addListener(type, listener);
    };
    global.removeEventListener = function (type, listener) {
        return EventTarget.removeListener(type, listener);
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaGNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNdWx0aUNoYXJ0aW5nIEV4dGVuc2lvbiBmb3IgRnVzaW9uQ2hhcnRzXG4gKiBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgYmFzaWMgcm91dGluZXMgcmVxdWlyZWQgYnkgc3Vic2VxdWVudCBtb2R1bGVzIHRvXG4gKiBleHRlbmQvc2NhbGUgb3IgYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIE11bHRpQ2hhcnRpbmcgb2JqZWN0LlxuICpcbiAqL1xuXG4gLyogZ2xvYmFsIHdpbmRvdzogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGVudiwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGVudi5kb2N1bWVudCA/XG4gICAgICAgICAgICBmYWN0b3J5KGVudikgOiBmdW5jdGlvbih3aW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpbi5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KHdpbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5NdWx0aUNoYXJ0aW5nID0gZmFjdG9yeShlbnYsIHRydWUpO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKF93aW5kb3csIHdpbmRvd0V4aXN0cykge1xuICAgIC8vIEluIGNhc2UgTXVsdGlDaGFydGluZyBhbHJlYWR5IGV4aXN0cy5cbiAgICBpZiAoX3dpbmRvdy5NdWx0aUNoYXJ0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgTXVsdGlDaGFydGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luID0gX3dpbmRvdztcblxuICAgIGlmICh3aW5kb3dFeGlzdHMpIHtcbiAgICAgICAgX3dpbmRvdy5NdWx0aUNoYXJ0aW5nID0gTXVsdGlDaGFydGluZztcbiAgICB9XG4gICAgcmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZW5kMiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYpIHtcbiAgICAgICAgICAgIHZhciBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcbiAgICAgICAgICAgIC8vaWYgbm9uZSBvZiB0aGUgYXJndW1lbnRzIGFyZSBvYmplY3QgdGhlbiByZXR1cm4gYmFja1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcgJiYgdHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORyB8fCBvYmoyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgb2JqMSA9IG9iajIgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZShvYmoxLCBvYmoyLCBza2lwVW5kZWYpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGxpYiA9IHtcbiAgICAgICAgICAgIGV4dGVuZDI6IGV4dGVuZDIsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2VcbiAgICAgICAgfTtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgPSAoTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliIHx8IGxpYik7XG5cbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIEFqYXggPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgYWpheCA9IHRoaXMsXG5cdFx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdO1xuXG5cdFx0ICAgIGFqYXgub25TdWNjZXNzID0gYXJndW1lbnQuc3VjY2Vzcztcblx0XHQgICAgYWpheC5vbkVycm9yID0gYXJndW1lbnQuZXJyb3I7XG5cdFx0ICAgIGFqYXgub3BlbiA9IGZhbHNlO1xuXHRcdCAgICByZXR1cm4gYWpheC5nZXQoYXJndW1lbnQudXJsKTtcblx0XHR9LFxuXG4gICAgICAgIGFqYXhQcm90byA9IEFqYXgucHJvdG90eXBlLFxuXG4gICAgICAgIEZVTkNUSU9OID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgTVNYTUxIVFRQID0gJ01pY3Jvc29mdC5YTUxIVFRQJyxcbiAgICAgICAgTVNYTUxIVFRQMiA9ICdNc3htbDIuWE1MSFRUUCcsXG4gICAgICAgIEdFVCA9ICdHRVQnLFxuICAgICAgICBYSFJFUUVSUk9SID0gJ1htbEh0dHByZXF1ZXN0IEVycm9yJyxcbiAgICAgICAgd2luID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luLCAvLyBrZWVwIGEgbG9jYWwgcmVmZXJlbmNlIG9mIHdpbmRvdyBzY29wZVxuXG4gICAgICAgIC8vIFByb2JlIElFIHZlcnNpb25cbiAgICAgICAgdmVyc2lvbiA9IHBhcnNlRmxvYXQod2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLnNwbGl0KCdNU0lFJylbMV0pLFxuICAgICAgICBpZWx0OCA9ICh2ZXJzaW9uID49IDUuNSAmJiB2ZXJzaW9uIDw9IDcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBmaXJlZm94ID0gL21vemlsbGEvaS50ZXN0KHdpbi5uYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZsYWdzLlxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBwYWdlIGlzIG9uIGZpbGUgcHJvdG9jb2wuXG4gICAgICAgIGZpbGVQcm90b2NvbCA9IHdpbi5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyxcbiAgICAgICAgQVhPYmplY3QgPSB3aW4uQWN0aXZlWE9iamVjdCxcblxuICAgICAgICAvLyBDaGVjayBpZiBuYXRpdmUgeGhyIGlzIHByZXNlbnRcbiAgICAgICAgWEhSTmF0aXZlID0gKCFBWE9iamVjdCB8fCAhZmlsZVByb3RvY29sKSAmJiB3aW4uWE1MSHR0cFJlcXVlc3QsXG5cbiAgICAgICAgLy8gUHJlcGFyZSBmdW5jdGlvbiB0byByZXRyaWV2ZSBjb21wYXRpYmxlIHhtbGh0dHByZXF1ZXN0LlxuICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4bWxodHRwO1xuXG4gICAgICAgICAgICAvLyBpZiB4bWxodHRwcmVxdWVzdCBpcyBwcmVzZW50IGFzIG5hdGl2ZSwgdXNlIGl0LlxuICAgICAgICAgICAgaWYgKFhIUk5hdGl2ZSkge1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhIUk5hdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBhY3RpdmVYIGZvciBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICAgICAgfSxcblxuICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBQcmV2ZW50cyBjYWNoZWluZyBvZiBBSkFYIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0lmLU1vZGlmaWVkLVNpbmNlJzogJ1NhdCwgMjkgT2N0IDE5OTQgMTk6NDM6MzEgR01UJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyB0aGUgc2VydmVyIGtub3cgdGhhdCB0aGlzIGlzIGFuIEFKQVggcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyBzZXJ2ZXIga25vdyB3aGljaCB3ZWIgYXBwbGljYXRpb24gaXMgc2VuZGluZyByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1CeSc6ICdGdXNpb25DaGFydHMnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZW50aW9ucyBjb250ZW50LXR5cGVzIHRoYXQgYXJlIGFjY2VwdGFibGUgZm9yIHRoZSByZXNwb25zZS4gU29tZSBzZXJ2ZXJzIHJlcXVpcmUgdGhpcyBmb3IgQWpheFxuICAgICAgICAgICAgICogY29tbXVuaWNhdGlvbi5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9wbGFpbiwgKi8qJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIE1JTUUgdHlwZSBvZiB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdCBhbG9uZyB3aXRoIGl0cyBjaGFyc2V0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnXG4gICAgICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5hamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFqYXgoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmdldCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IHdyYXBwZXIueG1saHR0cCxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sgPSB3cmFwcGVyLm9uRXJyb3IsXG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgPSB3cmFwcGVyLm9uU3VjY2VzcyxcbiAgICAgICAgICAgIHhSZXF1ZXN0ZWRCeSA9ICdYLVJlcXVlc3RlZC1CeScsXG4gICAgICAgICAgICBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICAgICAgaTtcblxuICAgICAgICAvLyBYLVJlcXVlc3RlZC1CeSBpcyByZW1vdmVkIGZyb20gaGVhZGVyIGR1cmluZyBjcm9zcyBkb21haW4gYWpheCBjYWxsXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9eKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykvKSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaG9zdG5hbWUgIT09IC8oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKShbXlxcL1xcOl0qKS8uZXhlYyh1cmwpWzJdKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gaHR0cCBvciBodHRwcywgdGhlbiBpdHMgYSBzYW1lIGRvbWFpbiBjYWxsLiBObyBuZWVkIHRvIHVzZSByZWdleCB0byBnZXRcbiAgICAgICAgICAgIC8vIGRvbWFpbi4gSWYgaXQgY29udGFpbnMgdGhlbiBjaGVja3MgZG9tYWluLlxuICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbeFJlcXVlc3RlZEJ5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICFoYXNPd24uY2FsbChoZWFkZXJzLCB4UmVxdWVzdGVkQnkpICYmIChoZWFkZXJzW3hSZXF1ZXN0ZWRCeV0gPSAnRnVzaW9uQ2hhcnRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXhtbGh0dHAgfHwgaWVsdDggfHwgZmlyZWZveCkge1xuICAgICAgICAgICAgeG1saHR0cCA9IG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB3cmFwcGVyLnhtbGh0dHAgPSB4bWxodHRwO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzIDwgMzAwKSB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMzA0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA9PT0gMTIyMyB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh4bWxodHRwLnJlc3BvbnNlVGV4dCwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKG5ldyBFcnJvcihYSFJFUUVSUk9SKSwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhtbGh0dHAub3BlbihHRVQsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICh4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoaSwgaGVhZGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHhtbGh0dHAuc2VuZCgpO1xuICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gaW5zdGFuY2UueG1saHR0cDtcblxuICAgICAgICBpbnN0YW5jZS5vcGVuID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB4bWxodHRwICYmIHR5cGVvZiB4bWxodHRwLmFib3J0ID09PSBGVU5DVElPTiAmJiB4bWxodHRwLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgICAgICB4bWxodHRwLnJlYWR5U3RhdGUgIT09IDAgJiYgeG1saHR0cC5hYm9ydCgpO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2Uub3BlbiAmJiBpbnN0YW5jZS5hYm9ydCgpO1xuXG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vbkVycm9yO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25TdWNjZXNzO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2UueG1saHR0cDtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9wZW47XG5cbiAgICAgICAgcmV0dXJuIChpbnN0YW5jZSA9IG51bGwpO1xuICAgIH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgLy8gU291cmNlOiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzE1MDQtQXNrLUJlbi1QYXJzaW5nLUNTVi1TdHJpbmdzLVdpdGgtSmF2YXNjcmlwdC1FeGVjLVJlZ3VsYXItRXhwcmVzc2lvbi1Db21tYW5kLmh0bVxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cblxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgZnVuY3Rpb24gQ1NWVG9BcnJheSAoc3RyRGF0YSwgc3RyRGVsaW1pdGVyKSB7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZGVsaW1pdGVyIGlzIGRlZmluZWQuIElmIG5vdCxcbiAgICAgICAgLy8gdGhlbiBkZWZhdWx0IHRvIGNvbW1hLlxuICAgICAgICBzdHJEZWxpbWl0ZXIgPSAoc3RyRGVsaW1pdGVyIHx8IFwiLFwiKTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcmVndWxhciBleHByZXNzaW9uIHRvIHBhcnNlIHRoZSBDU1YgdmFsdWVzLlxuICAgICAgICB2YXIgb2JqUGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgLy8gRGVsaW1pdGVycy5cbiAgICAgICAgICAgICAgICBcIihcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcInxcXFxccj9cXFxcbnxcXFxccnxeKVwiICtcbiAgICAgICAgICAgICAgICAvLyBRdW90ZWQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKD86XFxcIihbXlxcXCJdKig/OlxcXCJcXFwiW15cXFwiXSopKilcXFwifFwiICtcbiAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoW15cXFwiXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJcXFxcclxcXFxuXSopKVwiXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJnaVwiXG4gICAgICAgICAgICApO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgZGF0YS4gR2l2ZSB0aGUgYXJyYXlcbiAgICAgICAgLy8gYSBkZWZhdWx0IGVtcHR5IGZpcnN0IHJvdy5cbiAgICAgICAgdmFyIGFyckRhdGEgPSBbW11dO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgaW5kaXZpZHVhbCBwYXR0ZXJuXG4gICAgICAgIC8vIG1hdGNoaW5nIGdyb3Vwcy5cbiAgICAgICAgdmFyIGFyck1hdGNoZXMgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGxvb3Bpbmcgb3ZlciB0aGUgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXNcbiAgICAgICAgLy8gdW50aWwgd2UgY2FuIG5vIGxvbmdlciBmaW5kIGEgbWF0Y2guXG4gICAgICAgIHdoaWxlIChhcnJNYXRjaGVzID0gb2JqUGF0dGVybi5leGVjKCBzdHJEYXRhICkpe1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBkZWxpbWl0ZXIgdGhhdCB3YXMgZm91bmQuXG4gICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZERlbGltaXRlciA9IGFyck1hdGNoZXNbIDEgXTtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZ2l2ZW4gZGVsaW1pdGVyIGhhcyBhIGxlbmd0aFxuICAgICAgICAgICAgLy8gKGlzIG5vdCB0aGUgc3RhcnQgb2Ygc3RyaW5nKSBhbmQgaWYgaXQgbWF0Y2hlc1xuICAgICAgICAgICAgLy8gZmllbGQgZGVsaW1pdGVyLiBJZiBpZCBkb2VzIG5vdCwgdGhlbiB3ZSBrbm93XG4gICAgICAgICAgICAvLyB0aGF0IHRoaXMgZGVsaW1pdGVyIGlzIGEgcm93IGRlbGltaXRlci5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBzdHJNYXRjaGVkRGVsaW1pdGVyLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIChzdHJNYXRjaGVkRGVsaW1pdGVyICE9IHN0ckRlbGltaXRlcilcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIGhhdmUgcmVhY2hlZCBhIG5ldyByb3cgb2YgZGF0YSxcbiAgICAgICAgICAgICAgICAvLyBhZGQgYW4gZW1wdHkgcm93IHRvIG91ciBkYXRhIGFycmF5LlxuICAgICAgICAgICAgICAgIGFyckRhdGEucHVzaCggW10gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIGRlbGltaXRlciBvdXQgb2YgdGhlIHdheSxcbiAgICAgICAgICAgIC8vIGxldCdzIGNoZWNrIHRvIHNlZSB3aGljaCBraW5kIG9mIHZhbHVlIHdlXG4gICAgICAgICAgICAvLyBjYXB0dXJlZCAocXVvdGVkIG9yIHVucXVvdGVkKS5cbiAgICAgICAgICAgIGlmIChhcnJNYXRjaGVzWyAyIF0pe1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgcXVvdGVkIHZhbHVlLiBXaGVuIHdlIGNhcHR1cmVcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHZhbHVlLCB1bmVzY2FwZSBhbnkgZG91YmxlIHF1b3Rlcy5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMiBdLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoIFwiXFxcIlxcXCJcIiwgXCJnXCIgKSxcbiAgICAgICAgICAgICAgICAgICAgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBub24tcXVvdGVkIHZhbHVlLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAzIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciB2YWx1ZSBzdHJpbmcsIGxldCdzIGFkZFxuICAgICAgICAgICAgLy8gaXQgdG8gdGhlIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICBhcnJEYXRhWyBhcnJEYXRhLmxlbmd0aCAtIDEgXS5wdXNoKCBzdHJNYXRjaGVkVmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdGhlIHBhcnNlZCBkYXRhLlxuICAgICAgICByZXR1cm4oIGFyckRhdGEgKTtcbiAgICB9XG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTtcbiIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXJcdG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZGF0YVN0b3JhZ2UgPSBsaWIuZGF0YVN0b3JhZ2UgPSB7fSxcblx0XHRvdXRwdXREYXRhU3RvcmFnZSA9IGxpYi5vdXRwdXREYXRhU3RvcmFnZSA9IHt9LFxuXHRcdC8vIEZvciBzdG9yaW5nIHRoZSBjaGlsZCBvZiBhIHBhcmVudFxuXHRcdGxpbmtTdG9yZSA9IHt9LFxuXHRcdC8vRm9yIHN0b3JpbmcgdGhlIHBhcmVudCBvZiBhIGNoaWxkXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUgPSB7fSxcblx0XHRpZENvdW50ID0gMCxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVN0b3JlLlxuXHRcdERhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXHQgICAgXHRtYW5hZ2VyLnNldERhdGEoYXJndW1lbnRzWzBdKTtcblx0XHR9LFxuXHRcdGRhdGFTdG9yZVByb3RvID0gRGF0YVN0b3JlLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdGhlIGRhdGFQcm9jZXNzb3Igb3ZlciB0aGUgZGF0YVxuXHRcdGV4ZWN1dGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAodHlwZSwgZmlsdGVyRm4sIEpTT05EYXRhKSB7XG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0Y2FzZSAgJ2ZpbHRlcicgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGNhc2UgJ21hcCcgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvL0Z1bmN0aW9uIHRvIHVwZGF0ZSBhbGwgdGhlIGxpbmtlZCBjaGlsZCBkYXRhXG5cdFx0dXBkYXRhRGF0YSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSxcblx0XHRcdFx0cGFyZW50RGF0YSA9IGRhdGFTdG9yYWdlW2lkXSxcblx0XHRcdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUsXG5cdFx0XHRcdGxlbixcblx0XHRcdFx0bGlua0lkcyxcblx0XHRcdFx0ZmlsdGVycyxcblx0XHRcdFx0bGlua0lkLFxuXHRcdFx0XHRmaWx0ZXIsXG5cdFx0XHRcdGZpbHRlckZuLFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHQvLyBTdG9yZSBhbGwgdGhlIGRhdGFPYmpzIHRoYXQgYXJlIHVwZGF0ZWQuXG5cdFx0XHRcdHRlbXBEYXRhVXBkYXRlZCA9IGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblxuXHRcdFx0bGlua0lkcyA9IGxpbmtEYXRhLmxpbms7XG5cdFx0XHRmaWx0ZXJzID0gbGlua0RhdGEuZmlsdGVyO1xuXHRcdFx0bGVuID0gbGlua0lkcy5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRsaW5rSWQgPSBsaW5rSWRzW2ldO1xuXG5cdFx0XHRcdHRlbXBEYXRhVXBkYXRlZFtsaW5rSWRdID0gdHJ1ZTtcblx0XHRcdFx0ZmlsdGVyID0gZmlsdGVyc1tpXTtcblx0XHRcdFx0ZmlsdGVyRm4gPSBmaWx0ZXIuZ2V0UHJvY2Vzc29yKCk7XG5cdFx0XHRcdHR5cGUgPSBmaWx0ZXIudHlwZTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0aWYgKGZpbHRlclN0b3JlW2ZpbHRlci5pZF0pIHtcblx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0gPSBleGVjdXRlUHJvY2Vzc29yKHR5cGUsIGZpbHRlckZuLCBwYXJlbnREYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdID0gcGFyZW50RGF0YTtcblx0XHRcdFx0XHRcdGZpbHRlci5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpIC09IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAobGlua1N0b3JlW2xpbmtJZF0pIHtcblx0XHRcdFx0XHR1cGRhdGFEYXRhKGxpbmtJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhU3RvcmUoYXJndW1lbnRzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSBpbiB0aGUgZGF0YSBzdG9yZVxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhID0gZnVuY3Rpb24gKGRhdGFTcGVjcywgY2FsbGJhY2spIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdG9sZElkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0aWQgPSBkYXRhU3BlY3MuaWQsXG5cdFx0XHRkYXRhVHlwZSA9IGRhdGFTcGVjcy5kYXRhVHlwZSxcblx0XHRcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdG9sZEpTT05EYXRhID0gZGF0YVN0b3JhZ2Vbb2xkSWRdIHx8IFtdLFxuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbiA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdFx0XHRkYXRhU3RvcmFnZVtpZF0gPSBvbGRKU09ORGF0YS5jb25jYXQoSlNPTkRhdGEgfHwgW10pO1xuXHRcdFx0XHRKU09ORGF0YSAmJiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YUFkZGVkJywge1xuXHRcdFx0XHRcdCdpZCc6IGlkLFxuXHRcdFx0XHRcdCdkYXRhJyA6IEpTT05EYXRhXG5cdFx0XHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShpZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKEpTT05EYXRhKTtcblx0XHRcdFx0fVx0XG5cdFx0XHR9O1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZGF0YVN0b3JhZ2UnICsgaWRDb3VudCArKztcblx0XHRkYXRhU3RvcmUuaWQgPSBpZDtcblx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXG5cdFx0aWYgKGRhdGFUeXBlID09PSAnY3N2Jykge1xuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5KHtcblx0XHRcdFx0c3RyaW5nIDogZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRcdGRlbGltaXRlciA6IGRhdGFTcGVjcy5kZWxpbWl0ZXIsXG5cdFx0XHRcdG91dHB1dEZvcm1hdCA6IGRhdGFTcGVjcy5vdXRwdXRGb3JtYXQsXG5cdFx0XHRcdGNhbGxiYWNrIDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGFTb3VyY2UpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHRkYXRhU3RvcmVQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpZCA9IHRoaXMuaWQ7XG5cdFx0cmV0dXJuIChvdXRwdXREYXRhU3RvcmFnZVtpZF0gfHwgZGF0YVN0b3JhZ2VbaWRdKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgY2hpbGQgZGF0YSBvYmplY3QgYWZ0ZXIgYXBwbHlpbmcgZmlsdGVyIG9uIHRoZSBwYXJlbnQgZGF0YS5cblx0Ly8gQHBhcmFtcyB7ZmlsdGVyc30gLSBUaGlzIGNhbiBiZSBhIGZpbHRlciBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBmaWx0ZXIgZnVuY3Rpb25zLlxuXHRkYXRhU3RvcmVQcm90by5nZXREYXRhID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGEuaWQsXG5cdFx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbms7XG5cdFx0Ly8gSWYgbm8gcGFyYW1ldGVyIGlzIHByZXNlbnQgdGhlbiByZXR1cm4gdGhlIHVuZmlsdGVyZWQgZGF0YS5cblx0XHRpZiAoIWZpbHRlcnMpIHtcblx0XHRcdHJldHVybiBkYXRhU3RvcmFnZVtpZF07XG5cdFx0fVxuXHRcdC8vIElmIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvZiBmaWx0ZXIgdGhlbiByZXR1cm4gdGhlIGZpbHRlcmVkIGRhdGEgYWZ0ZXIgYXBwbHlpbmcgdGhlIGZpbHRlciBvdmVyIHRoZSBkYXRhLlxuXHRcdGVsc2Uge1xuXHRcdFx0bGV0IHJlc3VsdCA9IFtdLFxuXHRcdFx0XHRpLFxuXHRcdFx0XHRuZXdEYXRhLFxuXHRcdFx0XHRsaW5rRGF0YSxcblx0XHRcdFx0bmV3SWQsXG5cdFx0XHRcdGZpbHRlcixcblx0XHRcdFx0ZmlsdGVyRm4sXG5cdFx0XHRcdGRhdGFsaW5rcyxcblx0XHRcdFx0ZmlsdGVySUQsXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdG5ld0RhdGFPYmosXG5cdFx0XHRcdGlzRmlsdGVyQXJyYXkgPSBmaWx0ZXJzIGluc3RhbmNlb2YgQXJyYXksXG5cdFx0XHRcdGxlbiA9IGlzRmlsdGVyQXJyYXkgPyBmaWx0ZXJzLmxlbmd0aCA6IDE7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldIHx8IGZpbHRlcnM7XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldFByb2Nlc3NvcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdG5ld0RhdGEgPSBleGVjdXRlUHJvY2Vzc29yKHR5cGUsIGZpbHRlckZuLCBkYXRhU3RvcmFnZVtpZF0pO1xuXG5cdFx0XHRcdFx0bmV3RGF0YU9iaiA9IG5ldyBEYXRhU3RvcmUoe2RhdGFTb3VyY2UgOiBuZXdEYXRhfSk7XG5cdFx0XHRcdFx0bmV3SWQgPSBuZXdEYXRhT2JqLmlkO1xuXHRcdFx0XHRcdHBhcmVudFN0b3JlW25ld0lkXSA9IGRhdGE7XG5cblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXdEYXRhT2JqKTtcblxuXHRcdFx0XHRcdC8vUHVzaGluZyB0aGUgaWQgYW5kIGZpbHRlciBvZiBjaGlsZCBjbGFzcyB1bmRlciB0aGUgcGFyZW50IGNsYXNzZXMgaWQuXG5cdFx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdIHx8IChsaW5rU3RvcmVbaWRdID0ge1xuXHRcdFx0XHRcdFx0bGluayA6IFtdLFxuXHRcdFx0XHRcdFx0ZmlsdGVyIDogW11cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRsaW5rRGF0YS5saW5rLnB1c2gobmV3SWQpO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmZpbHRlci5wdXNoKGZpbHRlcik7XG5cblx0XHRcdFx0XHQvLyBTdG9yaW5nIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCB1bmRlciB0aGUgZmlsdGVyIGlkLlxuXHRcdFx0XHRcdGZpbHRlcklEID0gZmlsdGVyLmdldElEKCk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzID0gZmlsdGVyTGlua1tmaWx0ZXJJRF0gfHwgKGZpbHRlckxpbmtbZmlsdGVySURdID0gW10pO1xuXHRcdFx0XHRcdGRhdGFsaW5rcy5wdXNoKG5ld0RhdGFPYmopO1xuXG5cdFx0XHRcdFx0Ly8gc2V0dGluZyB0aGUgY3VycmVudCBpZCBhcyB0aGUgbmV3SUQgc28gdGhhdCB0aGUgbmV4dCBmaWx0ZXIgaXMgYXBwbGllZCBvbiB0aGUgY2hpbGQgZGF0YTtcblx0XHRcdFx0XHRpZCA9IG5ld0lkO1xuXHRcdFx0XHRcdGRhdGEgPSBuZXdEYXRhT2JqO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gKGlzRmlsdGVyQXJyYXkgPyByZXN1bHQgOiByZXN1bHRbMF0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBkZWxldGUgdGhlIGN1cnJlbnQgZGF0YSBmcm9tIHRoZSBkYXRhU3RvcmFnZSBhbmQgYWxzbyBhbGwgaXRzIGNoaWxkcyByZWN1cnNpdmVseVxuXHRkYXRhU3RvcmVQcm90by5kZWxldGVEYXRhID0gZnVuY3Rpb24gKG9wdGlvbmFsSWQpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhU3RvcmUuaWQsXG5cdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRmbGFnO1xuXG5cdFx0aWYgKGxpbmtEYXRhKSB7XG5cdFx0XHRsZXQgaSxcblx0XHRcdFx0bGluayA9IGxpbmtEYXRhLmxpbmssXG5cdFx0XHRcdGxlbiA9IGxpbmsubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXRhU3RvcmUuZGVsZXRlRGF0YShsaW5rW2ldKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBsaW5rU3RvcmVbaWRdO1xuXHRcdH1cblxuXHRcdGZsYWcgPSBkZWxldGUgZGF0YVN0b3JhZ2VbaWRdO1xuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0cmV0dXJuIGZsYWc7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBpZCBvZiB0aGUgY3VycmVudCBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIG1vZGlmeSBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLm1vZGlmeURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRkYXRhU3RvcmFnZVtpZF0gPSBbXTtcblx0XHRkYXRhU3RvcmUuc2V0RGF0YShkYXRhU3BlY3MsIGNhbGxiYWNrKTtcblx0XHRcblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YU1vZGlmaWVkJywge1xuXHRcdFx0J2lkJzogaWRcblx0XHR9LCBkYXRhU3RvcmUpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIHRvIHRoZSBkYXRhU3RvcmFnZSBhc3luY2hyb25vdXNseSB2aWEgYWpheFxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcblx0XHRcdGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG5cdFx0XHRkZWxpbWl0ZXIgPSBhcmd1bWVudC5kZWxpbWl0ZXIsXG5cdFx0XHRvdXRwdXRGb3JtYXQgPSBhcmd1bWVudC5vdXRwdXRGb3JtYXQsXG5cdFx0XHRjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuXHRcdFx0Y2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuXHRcdFx0ZGF0YTtcblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5hamF4KHtcblx0XHRcdHVybCA6IGRhdGFTb3VyY2UsXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuXHRcdFx0XHRkYXRhU3RvcmUuc2V0RGF0YSh7XG5cdFx0XHRcdFx0ZGF0YVNvdXJjZSA6IGRhdGEsXG5cdFx0XHRcdFx0ZGF0YVR5cGUgOiBkYXRhVHlwZSxcblx0XHRcdFx0XHRkZWxpbWl0ZXIgOiBkZWxpbWl0ZXIsXG5cdFx0XHRcdFx0b3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHR9LCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXG5cdFx0XHRlcnJvciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSBrZXlzIG9mIHRoZSBKU09OIGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0S2V5cyA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGtleXMgPSBkYXRhU3RvcmUua2V5cztcblxuXHRcdGlmIChrZXlzKSB7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cdFx0aWYgKGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gaW50ZXJuYWxEYXRhKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gT2JqZWN0LmtleXMoaW50ZXJuYWxEYXRhKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IGFsbCB0aGUgdW5pcXVlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEga2V5XG5cdGRhdGFTdG9yZVByb3RvLmdldFVuaXF1ZVZhbHVlcyA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGlzQXJyYXkgPSBpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdHVuaXF1ZVZhbHVlcyA9IGRhdGFTdG9yZS51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHRcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZGF0YVN0b3JlLmdldEtleXMoKS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQudG9VcHBlckNhc2UoKSA9PT0ga2V5LnRvVXBwZXJDYXNlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpID0gMDtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSBpc0FycmF5ID8gMSA6IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aW50ZXJuYWxEYXRhID0gaXNBcnJheSA/IGRhdGFbaV1ba2V5XSA6IGRhdGFbaV1ba2V5XTtcblx0XHRcdCF0ZW1wVW5pcXVlVmFsdWVzW2ludGVybmFsRGF0YV0gJiYgKHRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSA9IHRydWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldID0gT2JqZWN0LmtleXModGVtcFVuaXF1ZVZhbHVlcykpO1xuXHR9O1xuXG5cdC8vRnVuY3Rpb24gdG8gbW9kaWZ5IHRoZSBjdXJyZW50IEpTT04gd2l0aCB0aGUgZGF0YSBvYnRhaW5lZCBhZnRlciBhcHBseWluZyBkYXRhUHJvY2Vzc29yXG5cdGRhdGFTdG9yZVByb3RvLmFwcGx5RGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uIChkYXRhUHJvY2Vzc29yKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRwcm9jZXNzb3JGbiA9IGRhdGFQcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCksXG5cdFx0XHR0eXBlID0gZGF0YVByb2Nlc3Nvci50eXBlLFxuXHRcdFx0SlNPTkRhdGEgPSBkYXRhU3RvcmUuZ2V0SlNPTigpO1xuXG5cdFx0aWYgKHR5cGVvZiBwcm9jZXNzb3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIChvdXRwdXREYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdID0gZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBwcm9jZXNzb3JGbiwgSlNPTkRhdGEpKTtcblx0XHR9XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUgPSB7fSxcblx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbmsgPSB7fSxcblx0XHRmaWx0ZXJJZENvdW50ID0gMCxcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSxcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVByb2Nlc3Nvci5cblx0XHREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuYWRkUnVsZShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0XG5cdFx0ZGF0YVByb2Nlc3NvclByb3RvID0gRGF0YVByb2Nlc3Nvci5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byB1cGRhdGUgZGF0YSBvbiBjaGFuZ2Ugb2YgZmlsdGVyLlxuXHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvciA9IGZ1bmN0aW9uIChpZCwgY29weVBhcmVudFRvQ2hpbGQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRkYXRhID0gZmlsdGVyTGlua1tpZF0sXG5cdFx0XHRcdEpTT05EYXRhLFxuXHRcdFx0XHRkYXR1bSxcblx0XHRcdFx0ZGF0YUlkLFxuXHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXR1bSA9IGRhdGFbaV07XG5cdFx0XHRcdGRhdGFJZCA9IGRhdHVtLmlkO1xuXHRcdFx0XHRpZiAoIWxpYi50ZW1wRGF0YVVwZGF0ZWRbZGF0YUlkXSkge1xuXHRcdFx0XHRcdGlmIChwYXJlbnRTdG9yZVtkYXRhSWRdICYmIGRhdGFTdG9yYWdlW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRcdEpTT05EYXRhID0gcGFyZW50U3RvcmVbZGF0YUlkXS5nZXREYXRhKCk7XG5cdFx0XHRcdFx0XHRkYXR1bS5tb2RpZnlEYXRhKGNvcHlQYXJlbnRUb0NoaWxkID8gSlNPTkRhdGEgOiBmaWx0ZXJTdG9yZVtpZF0oSlNPTkRhdGEpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgcGFyZW50U3RvcmVbZGF0YUlkXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVByb2Nlc3Nvcihhcmd1bWVudHNbMF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBmaWx0ZXIgaW4gdGhlIGZpbHRlciBzdG9yZVxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdG9sZElkID0gZmlsdGVyLmlkLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRmaWx0ZXJGbiA9IChhcmd1bWVudCAmJiBhcmd1bWVudC5ydWxlKSB8fCBhcmd1bWVudCxcblx0XHRcdGlkID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZSxcblx0XHRcdHR5cGUgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlO1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZmlsdGVyU3RvcmUnICsgZmlsdGVySWRDb3VudCArKztcblx0XHRmaWx0ZXJTdG9yZVtpZF0gPSBmaWx0ZXJGbjtcblxuXHRcdGZpbHRlci5pZCA9IGlkO1xuXHRcdGZpbHRlci50eXBlID0gdHlwZTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgZGF0YSBvbiB3aGljaCB0aGUgZmlsdGVyIGlzIGFwcGxpZWQgYW5kIGFsc28gb24gdGhlIGNoaWxkIGRhdGEuXG5cdFx0aWYgKGZpbHRlckxpbmtbaWRdKSB7XG5cdFx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQpO1xuXHRcdH1cblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdmaWx0ZXJBZGRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdFx0J2RhdGEnIDogZmlsdGVyRm5cblx0XHR9LCBmaWx0ZXIpO1xuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IHRoZSBmaWx0ZXIgbWV0aG9kLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0UHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBmaWx0ZXJTdG9yZVt0aGlzLmlkXTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIElEIG9mIHRoZSBmaWx0ZXIuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRJRCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5pZDtcblx0fTtcblxuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5kZWxldGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGZpbHRlciA9IHRoaXMsXG5cdFx0XHRpZCA9IGZpbHRlci5pZDtcblxuXHRcdGZpbHRlckxpbmtbaWRdICYmIHVwZGF0YUZpbHRlclByb2Nlc3NvcihpZCwgdHJ1ZSk7XG5cblx0XHRkZWxldGUgZmlsdGVyU3RvcmVbaWRdO1xuXHRcdGRlbGV0ZSBmaWx0ZXJMaW5rW2lkXTtcblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdmaWx0ZXJEZWxldGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZmlsdGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnZmlsdGVyJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLnNvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdzb3J0J1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLm1hcCA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ21hcCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMjtcbiAgICAvL2Z1bmN0aW9uIHRvIGNvbnZlcnQgZGF0YSwgaXQgcmV0dXJucyBmYyBzdXBwb3J0ZWQgSlNPTlxuICAgIHZhciBEYXRhQWRhcHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YWFkYXB0ZXIgPSB0aGlzO1xuXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZSA9IGFyZ3VtZW50LmRhdGFzdG9yZTsgICAgICAgXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFKU09OID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlICYmIGRhdGFhZGFwdGVyLmRhdGFTdG9yZS5nZXRKU09OKCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWc7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2s7XG4gICAgICAgIGRhdGFhZGFwdGVyLkZDanNvbiA9IGRhdGFhZGFwdGVyLmNvbnZlcnREYXRhKCk7XG4gICAgfSxcbiAgICBwcm90b0RhdGFhZGFwdGVyID0gRGF0YUFkYXB0ZXIucHJvdG90eXBlO1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5jb252ZXJ0RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAganNvbkNyZWF0b3IgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBjb25mID0gY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgc2VyaWVzVHlwZSA9IGNvbmYgJiYgY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbXMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzZXJpZXNuYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hMYWJlbF07ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBsYWJlbCB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICd0cycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldID0geyAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlcmllc1tzZXJpZXNUeXBlXShqc29uRGF0YSwgY29uZik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuZXJhbERhdGFGb3JtYXQgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShqc29uRGF0YVswXSksXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXkgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgICAgICBsZW5HZW5lcmFsRGF0YUFycmF5LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzQXJyYXkpe1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0ucHVzaChjb25maWd1cmF0aW9uLmRpbWVuc2lvbik7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChjb25maWd1cmF0aW9uLm1lYXN1cmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBqc29uRGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5HZW5lcmFsRGF0YUFycmF5ID0gZ2VuZXJhbERhdGFBcnJheVswXS5sZW5ndGg7IGogPCBsZW5HZW5lcmFsRGF0YUFycmF5OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2ldW2dlbmVyYWxEYXRhQXJyYXlbMF1bal1dOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdW2pdID0gdmFsdWUgfHwgJyc7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhbERhdGFBcnJheTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXREZWZhdWx0QXR0ciA9IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgICAgICAgICAganNvbi5jaGFydCB8fCAoanNvbi5jaGFydCA9IHt9KTtcbiAgICAgICAgICAgICAgICAvL2pzb24uY2hhcnQuYW5pbWF0aW9uID0gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBZ2dyZWdhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEsIGtleSwgYWdncmVnYXRlTW9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVNZXRob2QgPSB7XG4gICAgICAgICAgICAgICAgICAgICdzdW0nIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gZGF0YVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihpID0gMSwgbGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRhdGFbaV1bal0gIT0ga2V5KSAmJiAoYWdncmVnYXRlZERhdGFbal0gPSArYWdncmVnYXRlZERhdGFbal0gKyArZGF0YVtpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnYXZlcmFnZScgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpQWdncmVnYXRlTXRoZCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuUiA9IGRhdGEubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWRTdW1BcnIgPSBpQWdncmVnYXRlTXRoZC5zdW0oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBhZ2dyZWdhdGVkU3VtQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0gIT0ga2V5KSAmJiAoYWdncmVnYXRlZERhdGFbaV0gPSAoK2FnZ3JlZ2F0ZWRTdW1BcnJbaV0pIC8gbGVuUikpIHx8IChhZ2dyZWdhdGVkRGF0YVtpXSA9IGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSBhZ2dyZWdhdGVNb2RlICYmIGFnZ3JlZ2F0ZU1vZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBhZ2dyZWdhdGVNb2RlID0gKGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSAmJiBhZ2dyZWdhdGVNb2RlKSB8fCAnc3VtJztcblxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0oKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTb3J0ZWREYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNhdGVnb3J5QXJyLCBkaW1lbnNpb24sIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZW94T2ZLZXksXG4gICAgICAgICAgICAgICAgICAgIG5ld0RhdGEgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBrZXkgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcmllcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBsZW5LZXksXG4gICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGxlbkNhdCxcbiAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgayxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgYXJyID0gW107XG4gICAgICAgICAgICAgICAgKCFBcnJheS5pc0FycmF5KGRpbWVuc2lvbikgJiYgKGtleSA9IFtkaW1lbnNpb25dKSkgfHwgKGtleSA9IGRpbWVuc2lvbik7XG4gICAgICAgICAgICAgICAgKCFBcnJheS5pc0FycmF5KGNhdGVnb3J5QXJyWzBdKSAmJiAoY2F0ZWdvcmllcyA9IFtjYXRlZ29yeUFycl0pKSB8fCAoY2F0ZWdvcmllcyA9IGNhdGVnb3J5QXJyKTtcblxuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhWzBdKTtcbiAgICAgICAgICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBpbmRlb3hPZktleSA9IGRhdGFbMF0uaW5kZXhPZihrZXlba10pOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvcihpID0gMCxsZW5DYXQgPSBjYXRlZ29yaWVzW2tdLmxlbmd0aDsgaSA8IGxlbkNhdCAgJiYgaW5kZW94T2ZLZXkgIT09IC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7ICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRhdGFbal1baW5kZW94T2ZLZXldID09IGNhdGVnb3JpZXNba11baV0pICYmIChzdWJTZXREYXRhLnB1c2goZGF0YVtqXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJbaW5kZW94T2ZLZXldID0gY2F0ZWdvcmllc1trXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdWJTZXREYXRhLmxlbmd0aCA9PT0gMCkgJiYgKHN1YlNldERhdGEucHVzaChhcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChnZXRBZ2dyZWdhdGVEYXRhKHN1YlNldERhdGEsIGNhdGVnb3JpZXNba11baV0sIGFnZ3JlZ2F0ZU1vZGUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhQXJyYXksXG4gICAgICAgICAgICBqc29uID0ge30sXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IHt9O1xuXG4gICAgICAgICAgICBqc29uRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFKU09OO1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICBjYWxsYmFjayA9IGRhdGFhZGFwdGVyLmNhbGxiYWNrO1xuXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IGNvbmZpZ3VyYXRpb24gJiYgY29uZmlndXJhdGlvbi5jb25maWc7XG5cbiAgICAgICAgaWYgKGpzb25EYXRhICYmIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGFBcnJheSA9IGdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoZGF0YUFycmF5ID0gZ2V0U29ydGVkRGF0YShkYXRhQXJyYXksIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcywgY29uZmlndXJhdGlvbi5kaW1lbnNpb24sIGNvbmZpZ3VyYXRpb24uYWdncmVnYXRlTW9kZSkpO1xuICAgICAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUFycmF5ID0gZGF0YUFycmF5O1xuICAgICAgICAgICAganNvbiA9IGpzb25DcmVhdG9yKGRhdGFBcnJheSwgY29uZmlndXJhdGlvbik7ICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAganNvbiA9IChwcmVkZWZpbmVkSnNvbiAmJiBleHRlbmQyKGpzb24scHJlZGVmaW5lZEpzb24pKSB8fCBqc29uO1xuICAgICAgICByZXR1cm4gKGNhbGxiYWNrICYmIGNhbGxiYWNrKGpzb24pKSB8fCBzZXREZWZhdWx0QXR0cihqc29uKTsgXG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RkNqc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLkZDanNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhSnNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhSlNPTjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhQXJyYXkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YUFycmF5O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERpbWVuc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbi5kaW1lbnNpb247XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFhZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFBZGFwdGVyKGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbn0pOyIsIiAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgIC8vIHZhciBGdXNpb25DaGFydHMgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4uRnVzaW9uQ2hhcnRzO1xuXG4gICAgdmFyIENoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fTtcblxuICAgICAgICAgICAgY2hhcnQuZGF0YVN0b3JlSnNvbiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0RGF0YUpzb24oKTtcbiAgICAgICAgICAgIGNoYXJ0LmRpbWVuc2lvbiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0RGltZW5zaW9uKCk7XG4gICAgICAgICAgICBjaGFydC5yZW5kZXIoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnRQcm90byA9IENoYXJ0LnByb3RvdHlwZSxcbiAgICAgICAgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyO1xuXG4gICAgY2hhcnRQcm90by5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fTtcblxuICAgICAgICAvL2dldCBmYyBzdXBwb3J0ZWQganNvbiAgICAgICAgICAgIFxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTsgICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnQuY2hhcnRPYmogPSBuZXcgRnVzaW9uQ2hhcnRzKGNoYXJ0LmNoYXJ0Q29uZmlnKTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG5cbiAgICAgICAgY2hhcnQuY2hhcnRPYmouYWRkRXZlbnRMaXN0ZW5lcignZGF0YXBsb3Ryb2xsb3ZlcicsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICB2YXIgZGF0YVJvdyA9IGdldFJvd0RhdGEoY2hhcnQuZGF0YVN0b3JlSnNvbiwgY2hhcnQuZGltZW5zaW9uLCBkLmNhdGVnb3J5TGFiZWwpO1xuICAgICAgICAgICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUucmFpc2VFdmVudCgnaG92ZXJpbicsIHtcbiAgICAgICAgICAgICAgICBkYXRhIDogZGF0YVJvd1xuICAgICAgICAgICAgfSwgY2hhcnQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY2hhcnRQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjaGFydENvbmZpZyA9IHt9LFxuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IHt9LFxuICAgICAgICAgICAgY29uZmlnRGF0YSA9IHt9O1xuICAgICAgICAvL3BhcnNlIGFyZ3VtZW50IGludG8gY2hhcnRDb25maWcgXG4gICAgICAgIGV4dGVuZDIoY2hhcnRDb25maWcsYXJndW1lbnQpO1xuICAgICAgICBcbiAgICAgICAgLy9kYXRhIGNvbmZpZ3VyYXRpb24gXG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uIHx8IHt9O1xuXG4gICAgICAgIC8vc3RvcmUgZmMgc3VwcG9ydGVkIGpzb24gdG8gcmVuZGVyIGNoYXJ0c1xuICAgICAgICBkYXRhU291cmNlID0gY29uZmlndXJhdGlvbi5nZXRGQ2pzb24oKTtcblxuICAgICAgICAvL2RlbGV0ZSBkYXRhIGNvbmZpZ3VyYXRpb24gcGFydHMgZm9yIEZDIGpzb24gY29udmVydGVyXG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy9zZXQgZGF0YSBzb3VyY2UgaW50byBjaGFydCBjb25maWd1cmF0aW9uXG4gICAgICAgIGNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICBjaGFydC5jaGFydENvbmZpZyA9IGNoYXJ0Q29uZmlnOyAgICAgICAgXG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8udXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fTtcblxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmouY2hhcnRUeXBlKGNoYXJ0LmNoYXJ0Q29uZmlnLnR5cGUpO1xuICAgICAgICBjaGFydC5jaGFydE9iai5zZXRKU09ORGF0YShjaGFydC5jaGFydENvbmZpZy5kYXRhU291cmNlKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0Um93RGF0YSAoZGF0YSwgZGltZW5zaW9uLCBrZXkpIHtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSksXG4gICAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgIHJvdyA9IFtdO1xuICAgIFxuICAgICAgICBmb3IobGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBpc0FycmF5ICYmIChpbmRleCA9IGRhdGFbaV0uaW5kZXhPZihrZXkpKTtcbiAgICAgICAgICAgIGlmKGluZGV4ICE9PSAtMSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZighaXNBcnJheSAmJiBkYXRhW2ldW2RpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbaV0pOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvd1tqXSA9IGRhdGFbaV1ba2V5c1tqXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByb3c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBcbiAgICB9XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFydChhcmd1bWVudHNbMF0pO1xuICAgIH07XG59KTsiLCJcblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBjcmVhdGVDaGFydCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0LFxuICAgICAgICBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICAgICAgUFggPSAncHgnLFxuICAgICAgICBESVYgPSAnZGl2JyxcbiAgICAgICAgRU1QVFlfU1RSSU5HID0gJycsXG4gICAgICAgIEFCU09MVVRFID0gJ2Fic29sdXRlJyxcbiAgICAgICAgTUFYX1BFUkNFTlQgPSAnMTAwJScsXG4gICAgICAgIEJMT0NLID0gJ2Jsb2NrJyxcbiAgICAgICAgUkVMQVRJVkUgPSAncmVsYXRpdmUnLFxuICAgICAgICBJRCA9ICdpZCcsXG4gICAgICAgIEJPUkRFUl9CT1ggPSAnYm9yZGVyLWJveCc7XG5cbiAgICB2YXIgQ2VsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBjZWxsLmRyYXcoKTtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0ICYmIGNlbGwucmVuZGVyQ2hhcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvdG9DZWxsID0gQ2VsbC5wcm90b3R5cGU7XG5cbiAgICBwcm90b0NlbGwuZHJhdyA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KERJVik7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaWQgPSBjZWxsLmNvbmZpZy5pZCB8fCBFTVBUWV9TVFJJTkc7ICAgICAgICBcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5oZWlnaHQgPSBjZWxsLmNvbmZpZy5oZWlnaHQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUudG9wID0gY2VsbC5jb25maWcudG9wICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUubGVmdCA9IGNlbGwuY29uZmlnLmxlZnQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmJveFNpemluZyA9IEJPUkRFUl9CT1g7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuY2xhc3NOYW1lID0gY2VsbC5jb25maWcuY2xhc3NOYW1lO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HO1xuICAgICAgICBjZWxsLmNvbnRhaW5lci5hcHBlbmRDaGlsZChjZWxsLmdyYXBoaWNzKTtcbiAgICB9O1xuXG4gICAgcHJvdG9DZWxsLnJlbmRlckNoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXM7IFxuXG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LnJlbmRlckF0ID0gY2VsbC5jb25maWcuaWQ7XG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LndpZHRoID0gTUFYX1BFUkNFTlQ7XG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LmhlaWdodCA9IE1BWF9QRVJDRU5UO1xuICAgICAgXG4gICAgICAgIGlmKGNlbGwuY2hhcnQpIHtcbiAgICAgICAgICAgIGNlbGwuY2hhcnQudXBkYXRlKGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwuY2hhcnQgPSBjcmVhdGVDaGFydChjZWxsLmNvbmZpZy5jaGFydCk7ICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNlbGwuY2hhcnQ7XG4gICAgfTtcblxuICAgIHByb3RvQ2VsbC51cGRhdGUgPSBmdW5jdGlvbiAobmV3Q29uZmlnKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcyxcbiAgICAgICAgICAgIGlkID0gY2VsbC5jb25maWcuaWQ7XG5cbiAgICAgICAgaWYobmV3Q29uZmlnKXtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnID0gbmV3Q29uZmlnO1xuICAgICAgICAgICAgY2VsbC5jb25maWcuaWQgPSBpZDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3MuaWQgPSBjZWxsLmNvbmZpZy5pZCB8fCBFTVBUWV9TVFJJTkc7ICAgICAgICBcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3MuY2xhc3NOYW1lID0gY2VsbC5jb25maWcuY2xhc3NOYW1lO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5oZWlnaHQgPSBjZWxsLmNvbmZpZy5oZWlnaHQgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUud2lkdGggPSBjZWxsLmNvbmZpZy53aWR0aCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUubGVmdCA9IGNlbGwuY29uZmlnLmxlZnQgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUucG9zaXRpb24gPSBBQlNPTFVURTtcbiAgICAgICAgICAgICFjZWxsLmNvbmZpZy5jaGFydCAmJiAoY2VsbC5ncmFwaGljcy5pbm5lckhUTUwgPSBjZWxsLmNvbmZpZy5odG1sIHx8IEVNUFRZX1NUUklORyk7XG4gICAgICAgICAgICBpZihjZWxsLmNvbmZpZy5jaGFydCkge1xuICAgICAgICAgICAgICAgIGNlbGwuY2hhcnQgPSBjZWxsLnJlbmRlckNoYXJ0KCk7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY2VsbC5jaGFydDtcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0gIFxuICAgICAgICByZXR1cm4gY2VsbDsgICAgICBcbiAgICB9O1xuXG4gICAgdmFyIE1hdHJpeCA9IGZ1bmN0aW9uIChzZWxlY3RvciwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXM7XG4gICAgICAgICAgICBtYXRyaXguc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgICAgICAgIC8vbWF0cml4IGNvbnRhaW5lclxuICAgICAgICAgICAgbWF0cml4Lm1hdHJpeENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIG1hdHJpeC5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0SCA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0VyA9IDEwMDtcblxuICAgICAgICAgICAgLy9kaXNwb3NlIG1hdHJpeCBjb250ZXh0XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zZSgpO1xuICAgICAgICAgICAgLy9zZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lciBcbiAgICAgICAgICAgIG1hdHJpeC5zZXRBdHRyQ29udGFpbmVyKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvTWF0cml4ID0gTWF0cml4LnByb3RvdHlwZSxcbiAgICAgICAgY2hhcnRJZCA9IDA7XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBzdHlsZSwgYXR0ciBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0QXR0ckNvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyOyAgICAgICAgXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFJFTEFUSVZFO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uID0gZnVuY3Rpb24gKGhlaWdodEFyciwgd2lkdGhBcnIpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgICAgICB3aWR0aCA9IDAsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGhlaWdodEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IGhlaWdodEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gd2lkdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHdpZHRoICs9IHdpZHRoQXJyW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFBYO1xuICAgICAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArIFBYO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIGRyYXcgbWF0cml4XG4gICAgcHJvdG9NYXRyaXguZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IG1hdHJpeCAmJiBtYXRyaXguY29uZmlndXJhdGlvbiB8fCB7fSxcbiAgICAgICAgICAgIC8vc3RvcmUgdmlydHVhbCBtYXRyaXggZm9yIHVzZXIgZ2l2ZW4gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IFtdLFxuICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBjYWxsQmFjayA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIC8vc3RvcmUgY2VsbCBvYmplY3QgaW4gbG9naWNhbCBtYXRyaXggc3RydWN0dXJlXG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSBuZXcgQ2VsbChjb25maWdNYW5hZ2VyW2ldW2pdLHBhcmVudENvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBbXTtcbiAgICAgICAgbWF0cml4LnBsYWNlSG9sZGVyID0gcGxhY2VIb2xkZXI7XG4gICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKCk7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gbWFuYWdlIG1hdHJpeCBkcmF3XG4gICAgcHJvdG9NYXRyaXguZHJhd01hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICAvL3N0b3JlIG1hcHBpbmcgbWF0cml4IGJhc2VkIG9uIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IG1hdHJpeC5tYXRyaXhNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLCAgICAgICAgICAgIFxuICAgICAgICAgICAgaGVpZ2h0QXJyID0gbWF0cml4LmdldFJvd0hlaWdodChzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgd2lkdGhBcnIgPSBtYXRyaXguZ2V0Q29sV2lkdGgoc2hhZG93TWF0cml4KSxcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyID0gW10sXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgbWF0cml4UG9zWCA9IG1hdHJpeC5nZXRQb3Mod2lkdGhBcnIpLFxuICAgICAgICAgICAgbWF0cml4UG9zWSA9IG1hdHJpeC5nZXRQb3MoaGVpZ2h0QXJyKSxcbiAgICAgICAgICAgIHJvd3NwYW4sXG4gICAgICAgICAgICBjb2xzcGFuLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBjaGFydCxcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICByb3csXG4gICAgICAgICAgICBjb2w7XG4gICAgICAgIC8vY2FsY3VsYXRlIGFuZCBzZXQgcGxhY2Vob2xkZXIgaW4gc2hhZG93IG1hdHJpeFxuICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4LnNldFBsY0hsZHIoc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgICAgIG1hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uKGhlaWdodEFyciwgd2lkdGhBcnIpO1xuICAgICAgICAvL2NhbGN1bGF0ZSBjZWxsIHBvc2l0aW9uIGFuZCBoZWlodCBhbmQgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgXG4gICAgICAgICAgICBkcmF3TWFuYWdlck9iakFycltpXSA9IFtdOyAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgICAgIHJvd3NwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbiB8fCAxKTtcbiAgICAgICAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNvbHNwYW4gfHwgMSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNoYXJ0ID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNoYXJ0O1xuICAgICAgICAgICAgICAgIGh0bWwgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaHRtbDtcbiAgICAgICAgICAgICAgICByb3cgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLnJvdyk7XG4gICAgICAgICAgICAgICAgY29sID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXS5jb2wpO1xuICAgICAgICAgICAgICAgIGxlZnQgPSBtYXRyaXhQb3NYW2NvbF07XG4gICAgICAgICAgICAgICAgdG9wID0gbWF0cml4UG9zWVtyb3ddO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gbWF0cml4UG9zWFtjb2wgKyBjb2xzcGFuXSAtIGxlZnQ7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF0cml4UG9zWVtyb3cgKyByb3dzcGFuXSAtIHRvcDtcbiAgICAgICAgICAgICAgICBpZCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaWQpIHx8IG1hdHJpeC5pZENyZWF0b3Iocm93LGNvbCk7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBkcmF3TWFuYWdlck9iakFycltpXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wICAgICAgIDogdG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgOiBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgICAgOiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICAgICA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICAgICA6IGlkLFxuICAgICAgICAgICAgICAgICAgICByb3dzcGFuICAgOiByb3dzcGFuLFxuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuICAgOiBjb2xzcGFuLFxuICAgICAgICAgICAgICAgICAgICBodG1sICAgICAgOiBodG1sLFxuICAgICAgICAgICAgICAgICAgICBjaGFydCAgICAgOiBjaGFydFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyYXdNYW5hZ2VyT2JqQXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5pZENyZWF0b3IgPSBmdW5jdGlvbigpe1xuICAgICAgICBjaGFydElkKys7ICAgICAgIFxuICAgICAgICByZXR1cm4gSUQgKyBjaGFydElkO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRQb3MgPSAgZnVuY3Rpb24oc3JjKXtcbiAgICAgICAgdmFyIGFyciA9IFtdLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBzcmMgJiYgc3JjLmxlbmd0aDtcblxuICAgICAgICBmb3IoOyBpIDw9IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGFyci5wdXNoKGkgPyAoc3JjW2ktMV0rYXJyW2ktMV0pIDogMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5zZXRQbGNIbGRyID0gZnVuY3Rpb24oc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKXtcbiAgICAgICAgdmFyIHJvdyxcbiAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkM7XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gc2hhZG93TWF0cml4Lmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7IFxuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgcm93ID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgY29sID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMV07XG5cbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPT09IHVuZGVmaW5lZCA/IGkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93O1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9PT0gdW5kZWZpbmVkID8gaiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFJvd0hlaWdodCA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5Sb3cgPSBzaGFkb3dNYXRyaXggJiYgc2hhZG93TWF0cml4Lmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNvbCxcbiAgICAgICAgICAgIGhlaWdodCA9IFtdLFxuICAgICAgICAgICAgY3VyckhlaWdodCxcbiAgICAgICAgICAgIG1heEhlaWdodDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4SGVpZ2h0ID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkNvbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYoc2hhZG93TWF0cml4W2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJIZWlnaHQgPSBzaGFkb3dNYXRyaXhbaV1bal0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgPCBjdXJySGVpZ2h0ID8gY3VyckhlaWdodCA6IG1heEhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoZWlnaHRbaV0gPSBtYXhIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRDb2xXaWR0aCA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCkge1xuICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgd2lkdGggPSBbXSxcbiAgICAgICAgICAgIGN1cnJXaWR0aCxcbiAgICAgICAgICAgIG1heFdpZHRoO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW5Db2wgPSBzaGFkb3dNYXRyaXhbal0ubGVuZ3RoOyBpIDwgbGVuQ29sOyBpKyspe1xuICAgICAgICAgICAgZm9yKGogPSAwLCBtYXhXaWR0aCA9IDA7IGogPCBsZW5Sb3c7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChzaGFkb3dNYXRyaXhbal1baV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycldpZHRoID0gc2hhZG93TWF0cml4W2pdW2ldLndpZHRoOyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gbWF4V2lkdGggPCBjdXJyV2lkdGggPyBjdXJyV2lkdGggOiBtYXhXaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aWR0aFtpXSA9IG1heFdpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5tYXRyaXhNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBzaGFkb3dNYXRyaXggPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGwsXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICByb3dTcGFuLFxuICAgICAgICAgICAgY29sU3BhbixcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgZGVmYXVsdEggPSBtYXRyaXguZGVmYXVsdEgsXG4gICAgICAgICAgICBkZWZhdWx0VyA9IG1hdHJpeC5kZWZhdWx0VyxcbiAgICAgICAgICAgIG9mZnNldDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcm93U3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbikgfHwgMTtcbiAgICAgICAgICAgICAgICBjb2xTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuKSB8fCAxOyAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS53aWR0aCk7XG4gICAgICAgICAgICAgICAgd2lkdGggPSAod2lkdGggJiYgKHdpZHRoIC8gY29sU3BhbikpIHx8IGRlZmF1bHRXO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gK3dpZHRoLnRvRml4ZWQoMik7XG5cbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGhlaWdodCAmJiAoaGVpZ2h0IC8gcm93U3BhbikpIHx8IGRlZmF1bHRIOyAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAraGVpZ2h0LnRvRml4ZWQoMik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBvZmZzZXQgPSAwOyBrIDwgcm93U3BhbjsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobCA9IDA7IGwgPCBjb2xTcGFuOyBsKyspIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXSA9IHNoYWRvd01hdHJpeFtpICsga10gPyBzaGFkb3dNYXRyaXhbaSArIGtdIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBqICsgbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA6IChpICsgJy0nICsgaiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hhZG93TWF0cml4O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRCbG9jayAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUiA9IHBsYWNlSG9sZGVyLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkM7XG4gICAgICAgIGZvcihpID0gMDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsYWNlSG9sZGVyW2ldW2pdLmNvbmZpZy5pZCA9PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGxhY2VIb2xkZXJbaV1bal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnVwZGF0ZSA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgbGVuUGxjSGxkcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lciAgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGRpc3Bvc2FsQm94ID0gW10sXG4gICAgICAgICAgICByZWN5Y2xlZENlbGw7XG5cbiAgICAgICAgbGVuUGxjSGxkciA9IHBsYWNlSG9sZGVyLmxlbmd0aDtcbiAgICAgICAgZm9yIChrID0gbGVuOyBrIDwgbGVuUGxjSGxkcjsgaysrKSB7XG4gICAgICAgICAgICBkaXNwb3NhbEJveCA9IGRpc3Bvc2FsQm94LmNvbmNhdChwbGFjZUhvbGRlci5wb3AoKSk7ICAgICAgICAgICAgXG4gICAgICAgIH0gICAgICAgIFxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW47IGkrKykgeyAgICBcbiAgICAgICAgICAgIGlmKCFwbGFjZUhvbGRlcltpXSkge1xuICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgaWYocGxhY2VIb2xkZXJbaV1bal0pIHtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0udXBkYXRlKGNvbmZpZ01hbmFnZXJbaV1bal0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZWN5Y2xlZENlbGwgPSBkaXNwb3NhbEJveC5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVjeWNsZWRDZWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSxwYXJlbnRDb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZW5QbGNIbGRyID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgbGVuQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IgKGsgPSBsZW5DOyBrIDwgbGVuUGxjSGxkcjsgaysrKSB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWxCb3ggPSBkaXNwb3NhbEJveC5jb25jYXQocGxhY2VIb2xkZXJbaV0ucG9wKCkpOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGRpc3Bvc2FsQm94Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZihkaXNwb3NhbEJveFtpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWxCb3hbaV0uY2hhcnQgJiYgZGlzcG9zYWxCb3hbaV0uY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIHBhcmVudENvbnRhaW5lci5yZW1vdmVDaGlsZChkaXNwb3NhbEJveFtpXSAmJiBkaXNwb3NhbEJveFtpXS5ncmFwaGljcyk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGRpc3Bvc2FsQm94W2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGRpc3Bvc2FsQm94W2ldO1xuICAgICAgICB9ICAgXG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgbm9kZSAgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBwbGFjZUhvbGRlciAmJiBwbGFjZUhvbGRlci5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXSAmJiBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jaGFydCAmJiBwbGFjZUhvbGRlcltpXVtqXS5jaGFydC5jaGFydE9iaiAmJiBcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChub2RlLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSAnMHB4JztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9ICcwcHgnO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVNYXRyaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pO1xuICAgIH07XG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuICAgIFxuICAgIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cbiAgICB2YXIgZ2xvYmFsID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG4gICAgICAgIHdpbiA9IGdsb2JhbC53aW4sXG5cbiAgICAgICAgb2JqZWN0UHJvdG9Ub1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgIGFycmF5VG9TdHJpbmdJZGVudGlmaWVyID0gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKFtdKSxcbiAgICAgICAgaXNBcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RQcm90b1RvU3RyaW5nLmNhbGwob2JqKSA9PT0gYXJyYXlUb1N0cmluZ0lkZW50aWZpZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQSBmdW5jdGlvbiB0byBjcmVhdGUgYW4gYWJzdHJhY3Rpb24gbGF5ZXIgc28gdGhhdCB0aGUgdHJ5LWNhdGNoIC9cbiAgICAgICAgLy8gZXJyb3Igc3VwcHJlc3Npb24gb2YgZmxhc2ggY2FuIGJlIGF2b2lkZWQgd2hpbGUgcmFpc2luZyBldmVudHMuXG4gICAgICAgIG1hbmFnZWRGbkNhbGwgPSBmdW5jdGlvbiAoaXRlbSwgc2NvcGUsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBXZSBjaGFuZ2UgdGhlIHNjb3BlIG9mIHRoZSBmdW5jdGlvbiB3aXRoIHJlc3BlY3QgdG8gdGhlXG4gICAgICAgICAgICAvLyBvYmplY3QgdGhhdCByYWlzZWQgdGhlIGV2ZW50LlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpdGVtWzBdLmNhbGwoc2NvcGUsIGV2ZW50LCBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRnVuY3Rpb24gdGhhdCBleGVjdXRlcyBhbGwgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGludm9rZWQgdXBvbiB0cmlnZ2VyXG4gICAgICAgIC8vIG9mIGFuIGV2ZW50LlxuICAgICAgICBzbG90TG9hZGVyID0gZnVuY3Rpb24gKHNsb3QsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBJZiBzbG90IGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgd2UgYXNzdW1lIHRoYXQgdGhlIGxpc3RlbmVyXG4gICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgaWYgKCEoc2xvdCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIC8vIFN0YXR1dG9yeSBXM0MgTk9UIHByZXZlbnREZWZhdWx0IGZsYWdcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmFyaWFibGVzLlxuICAgICAgICAgICAgdmFyIGkgPSAwLCBzY29wZTtcblxuICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBzbG90IGFuZCBsb29rIGZvciBtYXRjaCB3aXRoIHJlc3BlY3QgdG9cbiAgICAgICAgICAgIC8vIHR5cGUgYW5kIGJpbmRpbmcuXG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbWF0Y2ggZm91bmQgdy5yLnQuIHR5cGUgYW5kIGJpbmQsIHdlIGZpcmUgaXQuXG4gICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciB8fCBzbG90W2ldWzFdID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHNlbmRlciBvZiB0aGUgZXZlbnQgZm9yIGdsb2JhbCBldmVudHMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjaG9pY2Ugb2Ygc2NvcGUgZGlmZmVyZXMgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYVxuICAgICAgICAgICAgICAgICAgICAvLyBnbG9iYWwgb3IgYSBsb2NhbCBldmVudCBpcyBiZWluZyByYWlzZWQuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlID0gc2xvdFtpXVsxXSA9PT0gZXZlbnQuc2VuZGVyID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnNlbmRlciA6IGdsb2JhbDtcblxuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkRm5DYWxsKHNsb3RbaV0sIHNjb3BlLCBldmVudCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgd2FudGVkIHRvIGRldGFjaCB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRldGFjaGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmRldGFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHByb3BhZ2F0aW9uIGZsYWcgaXMgc2V0IHRvIGZhbHNlIGFuZCBkaXNjb250bnVlXG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlmIG5lZWRlZC5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY2FuY2VsbGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBldmVudE1hcCA9IHtcbiAgICAgICAgICAgIGhvdmVyaW4gOiAnZGF0YXBsb3Ryb2xsb3ZlcicsXG4gICAgICAgICAgICBob3Zlcm91dCA6ICdkYXRhcGxvdHJvbGxvdXQnLFxuICAgICAgICAgICAgY2xpayA6ICdkYXRhcGxvdGNsaWNrJ1xuICAgICAgICB9LFxuICAgICAgICByYWlzZUV2ZW50LFxuXG4gICAgICAgIEV2ZW50VGFyZ2V0ID0ge1xuXG4gICAgICAgICAgICB1bnByb3BhZ2F0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuY2FuY2VsbGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldGFjaGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmRldGFjaGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZGVmYXVsdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLnByZXZlbnRlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEVudGlyZSBjb2xsZWN0aW9uIG9mIGxpc3RlbmVycy5cbiAgICAgICAgICAgIGxpc3RlbmVyczoge30sXG5cbiAgICAgICAgICAgIC8vIFRoZSBsYXN0IHJhaXNlZCBldmVudCBpZC4gQWxsb3dzIHRvIGNhbGN1bGF0ZSB0aGUgbmV4dCBldmVudCBpZC5cbiAgICAgICAgICAgIGxhc3RFdmVudElkOiAwLFxuXG4gICAgICAgICAgICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcmVjdXJzZVJldHVybixcbiAgICAgICAgICAgICAgICAgICAgRkNFdmVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGk7XG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2VSZXR1cm4ucHVzaChFdmVudFRhcmdldC5hZGRMaXN0ZW5lcih0eXBlW2ldLCBsaXN0ZW5lciwgYmluZCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWN1cnNlUmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRoZSB0eXBlIHBhcmFtZXRlci4gTGlzdGVuZXIgY2Fubm90IGJlIGFkZGVkIHdpdGhvdXRcbiAgICAgICAgICAgICAgICAvLyB2YWxpZCB0eXBlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIGhhcyBub3QgYmVlbiBwcm92aWRlZCB3aGlsZSBhZGRpbmcgYW4gZXZlbnQgbGlzdGVuZXIuIEVuc3VyZSB0aGF0IHlvdSBwYXNzIGFcbiAgICAgICAgICAgICAgICAgICAgICogYHN0cmluZ2AgdG8gdGhlIGZpcnN0IHBhcmFtZXRlciBvZiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9LlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU0OVxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU0OScsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5zcGVjaWZpZWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIExpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4gSXQgd2lsbCBub3QgZXZhbCBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTBcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTAnLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgTGlzdGVuZXInKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnNlcnRpb24gcG9zaXRpb24gZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB0aGVuIGNyZWF0ZSBvbmUuXG4gICAgICAgICAgICAgICAgaWYgKCEoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5wdXNoKFtsaXN0ZW5lciwgYmluZF0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9O1xufSk7Il19

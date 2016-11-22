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
		metaStorage = lib.metaStorage = {},
		extend2 = lib.extend2,
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
		},

		//Function to update metaData of the child data recurssively
		updateMetaData = function (id, metaData) {
			var links = linkStore[id].link,
				length = links.length,
				i,
				newMetaData,
				link;

			for (i = 0; i < length; i++) {
				link = links[i];
				newMetaData = metaStorage[link] = extend2({}, metaData);
				if (linkStore[link]) {
					updateMetaData(link, newMetaData);
				}
			}
		};

	multiChartingProto.createDataStore = function () {
		return new DataStore(arguments);
	};

	// Function to add data in the data store
	dataStoreProto.setData = function (dataSpecs, callback, noRaiseEventFlag) {
		var dataStore = this,
			oldId = dataStore.id,
			id = dataSpecs.id,
			dataType = dataSpecs.dataType,
			dataSource = dataSpecs.dataSource,
			oldJSONData = dataStorage[oldId] || [],
			callbackHelperFn = function (JSONData) {
				dataStorage[id] = oldJSONData.concat(JSONData || []);
				!noRaiseEventFlag && JSONData && multiChartingProto.raiseEvent('dataAdded', {
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

					multiChartingProto.raiseEvent('dataProcessorApplied', {
						'dataStore': data,
						'dataProcessor' : filter
					}, data);

					newDataObj = new DataStore({dataSource : newData});
					newId = newDataObj.id;

					//Passing the metaData to the child.
					newDataObj.addMetaData(metaStorage[id]);
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

		delete metaStorage[id];
		delete outputDataStorage[id];

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
		dataStore.setData(dataSpecs, callback, true);
		
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

	//Function to change the output of getJSON() based on the dataProcessor applied
	dataStoreProto.applyDataProcessor = function (dataProcessor) {
		var dataStore = this,
			processorFn = dataProcessor.getProcessor(),
			type = dataProcessor.type,
			id = dataStore.id,
			output,
			JSONData = dataStorage[id];

		if (typeof processorFn === 'function') {
			output = outputDataStorage[dataStore.id] = executeProcessor(type, processorFn, JSONData);

			multiChartingProto.raiseEvent('dataProcessorApplied', {
				'dataStore': dataStore,
				'dataProcessor' : dataProcessor
			}, dataStore);

			return output;
		}
	};

	// Function to add metadata
	dataStoreProto.addMetaData = function (metaData, merge) {
		var dataStore = this,
			id = dataStore.id,
			newMetaData;
		if (merge) {
			newMetaData = metaStorage[id] = extend2(metaStorage[id] || {}, metaData);
		}
		else {
			newMetaData = metaStorage[id] = metaData;
		}
		linkStore[id] && updateMetaData(id, newMetaData);
	};

	// Function to get the added metaData
	dataStoreProto.getMetaData = function () {
		return metaStorage[this.id];
	};

	// Function to add event listener at dataStore level.
	dataStoreProto.addEventListener = function (type, listener) {
		return multiChartingProto.addEventListener(type, listener, this);
	};

	// Function to remove event listener at dataStore level.
	dataStoreProto.removeEventListener = function (type, listener) {
		return multiChartingProto.removeEventListener(type, listener, this);
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
            aggregatedData,
            generalData,
            json = {},
            predefinedJson = {},
            jsonData = dataadapter.dataJSON,
            configuration = dataadapter.configuration,
            callback = dataadapter.callback;

            predefinedJson = configuration && configuration.config;

        if (jsonData && configuration) {
            generalData = dataadapter.generalDataFormat(jsonData, configuration);
            configuration.categories && (aggregatedData = dataadapter.getSortedData(generalData, 
                                configuration.categories, configuration.dimension, configuration.aggregateMode));
            dataadapter.aggregatedData = aggregatedData;
            json = dataadapter.jsonCreator(aggregatedData, configuration);            
        }
        json = (predefinedJson && extend2(json,predefinedJson)) || json;
        return (callback && callback(json)) || dataadapter.setDefaultAttr(json); 
    };

    protoDataadapter.getSortedData = function (data, categoryArr, dimension, aggregateMode) {
        var dataadapter = this,
            indeoxOfKey,
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
                newData.push(dataadapter.getAggregateData(subSetData, categories[k][i], aggregateMode));
            }
        }        
        return newData;
    };

    protoDataadapter.setDefaultAttr = function (json) {
        json.chart || (json.chart = {});
        //json.chart.animation = 0;
        return json;
    };

    protoDataadapter.getAggregateData = function (data, key, aggregateMode) {
        var aggregateMethod = {
            'sum' : function(){
                var i,
                    j,
                    lenR,
                    lenC,
                    aggregatedData = data[0];
                for(i = 1, lenR = data.length; i < lenR; i++) {
                    for(j = 0, lenC = data[i].length; j < lenC; j++) {
                        (data[i][j] != key) && (aggregatedData[j] = Number(aggregatedData[j]) + Number(data[i][j]));
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
                    ((aggregatedSumArr[i] != key) && 
                        (aggregatedData[i] = (Number(aggregatedSumArr[i])) / lenR)) || 
                                                (aggregatedData[i] = aggregatedSumArr[i]);
                }
                return aggregatedData;
            }
        };

        aggregateMode = aggregateMode && aggregateMode.toLowerCase();
        aggregateMode = (aggregateMethod[aggregateMode] && aggregateMode) || 'sum';

        return aggregateMethod[aggregateMode]();
    };

    protoDataadapter.generalDataFormat = function(jsonData, configuration) {
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
    };

    protoDataadapter.jsonCreator = function(jsonData, configuration) {
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
    };

    protoDataadapter.getFCjson = function() {
        return this.FCjson;
    };

    protoDataadapter.getDataJson = function() {
        return this.dataJSON;
    };

    protoDataadapter.getAggregatedData = function() {
        return this.aggregatedData;
    };

    protoDataadapter.getDimension = function() {
        return this.configuration.dimension;
    };

    protoDataadapter.getMeasure = function() {
        return this.configuration.measure;
    };

    protoDataadapter.getLimit = function() {
        var dataadapter = this,
            max = -Infinity,
            min = +Infinity,
            i,
            j,
            lenR,
            lenC,
            value,
            data = dataadapter.aggregatedData;
        for(i = 0, lenR = data.length; i < lenR; i++){
            for(j = 0, lenC = data[i].length; j < lenC; j++){
                value = +data[i][j];
                value && (max = max < value ? value : max);
                value && (min = min > value ? value : min);
            }
        }
        return {
            'min' : min,
            'max' : max
        };
    };

    protoDataadapter.highlight = function() {
        var dataadapter = this,
            categoryLabel = arguments[0] && arguments[0].toString(),
            categoryArr = dataadapter.configuration.categories,
            index = categoryLabel && categoryArr.indexOf(categoryLabel);
        dataadapter.chart.drawTrendRegion(index);
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

    var Chart = function () {
            var chart = this,
                argument = arguments[0] || {};

            chart.dataStoreJson = argument.configuration.getDataJson();
            chart.dimension = argument.configuration.getDimension();
            chart.measure = argument.configuration.getMeasure();
            chart.aggregatedData = argument.configuration.getAggregatedData();
            chart.render(arguments[0]);
        },
        chartProto = Chart.prototype,
        extend2 = MultiCharting.prototype.lib.extend2,
        getRowData = function(data, aggregatedData, dimension, measure, key) {
            var i = 0,
                j = 0,
                k,
                kk,
                l,
                lenR,
                len,
                lenC,
                isArray = Array.isArray(data[0]),
                index = -1,
                matchObj = {},
                indexOfDimension = aggregatedData[0].indexOf(dimension[0]);
        
            for(lenR = data.length; i < lenR; i++) {
                isArray && (index = data[i].indexOf(key));
                if(index !== -1 && isArray) {
                    for(l = 0, lenC = data[i].length; l < lenC; l++){
                        matchObj[data[0][l]] = data[i][l];
                    }
                    for(j = 0, len = measure.length; j < len; j++) {
                        index = aggregatedData[0].indexOf(measure[j]);
                        for (k = 0, kk = aggregatedData.length; k < kk; k++) {
                            if(aggregatedData[k][indexOfDimension] == key) {
                                matchObj[measure[j]] = aggregatedData[k][index];
                            }
                        }
                    }
                    return matchObj;
                }

                if(!isArray && data[i][dimension[0]] == key) {
                    matchObj = data[i];

                    for(j = 0, len = measure.length; j < len; j++) {
                        index = aggregatedData[0].indexOf(measure[j]);
                        for (k = 0, kk = aggregatedData.length; k < kk; k++) {
                            if(aggregatedData[k][indexOfDimension] == key) {
                                matchObj[measure[j]] = aggregatedData[k][index];
                            }
                        }
                    }
                    return matchObj;
                }
            }
        };

    chartProto.render = function () {
        var chart = this,
            argument = arguments[0] || {},
            dataAdapterObj = argument.configuration || {};

        //get fc supported json            
        chart.getJSON(argument);        
        //render FC 
        chart.chartObj = new FusionCharts(chart.chartConfig);
        chart.chartObj.render();

        dataAdapterObj.chart = chart.chartObj;
        
        chart.chartObj.addEventListener('dataplotrollover', function (e, d) {
            var dataObj = getRowData(chart.dataStoreJson, chart.aggregatedData, 
                                        chart.dimension, chart.measure, d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataObj,
                categoryLabel : d.categoryLabel
            }, chart);
        });
    };

    chartProto.getJSON = function () {
        var chart = this,
            argument =arguments[0] || {},
            dataAdapterObj,
            chartConfig = {},
            dataSource = {};
        //parse argument into chartConfig 
        extend2(chartConfig,argument);
        
        //dataAdapterObj 
        dataAdapterObj = argument.configuration || {};

        //store fc supported json to render charts
        dataSource = dataAdapterObj.getFCjson();

        //delete data configuration parts for FC json converter
        delete chartConfig.configuration;
        
        //set data source into chart configuration
        chartConfig.dataSource = dataSource;
        chart.chartConfig = chartConfig;        
    };

    chartProto.update = function () {
        var chart = this,
            argument =arguments[0] || {},
            dataAdapterObj = argument.configuration || {};
        chart.getJSON(argument);
        chart.chartObj.chartType(chart.chartConfig.type);
        chart.chartObj.setJSONData(chart.chartConfig.dataSource);
        dataAdapterObj.chart = chart.chartObj;
    };

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
            cell.container.appendChild(cell.graphics);
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
            matrix.disposalBox = [];
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
        this.dispose();
        this.disposalBox = [];
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
            lenConfigR,
            lenConfigC,
            lenPlaceHldrR,
            lenPlaceHldrC,
            i,
            j,
            placeHolder = matrix && matrix.placeHolder,
            container = matrix && matrix.matrixContainer,            
            recycledCell;

        while(container.hasChildNodes()) {
            container.removeChild(container.lastChild);
        }

        for(i = 0, lenPlaceHldrR = placeHolder.length; i < lenPlaceHldrR; i++) {
            lenPlaceHldrC = placeHolder[i].length;
            for(j = lenPlaceHldrC - 1; j >= 0; j--) {
                if(placeHolder[i][j].chart) {
                    matrix.disposalBox = matrix.disposalBox.concat(placeHolder[i].pop());
                } else {
                    delete placeHolder[i][j];
                    placeHolder[i].pop();
                }
            }
        }

        for(i = 0, lenConfigR = configManager.length; i < lenConfigR; i++) {
            placeHolder[i] = [];
            for(j = 0, lenConfigC = configManager[i].length; j < lenConfigC; j++) {
                if(configManager[i][j].chart) {
                    recycledCell = matrix.disposalBox.pop();
                    if(recycledCell) {
                        placeHolder[i][j] = recycledCell.update(configManager[i][j]);
                    } else {
                        placeHolder[i][j] = new Cell(configManager[i][j], container);
                    }
                }
            }
        }
    };

//     protoMatrix.update = function (configuration) {
//         var matrix = this,
//             configManager = configuration && matrix && matrix.drawManager(configuration),
//             len = configManager && configManager.length,
//             lenC,
//             lenPlcHldr,
//             i,
//             j,
//             k,
//             placeHolder = matrix && matrix.placeHolder,
//             parentContainer  = matrix && matrix.matrixContainer,
//             disposalBoxChart = matrix.disposalBoxChart = [],
//             disposalBoxGen = matrix.disposalBoxGen = [],
//             recycledCell,
//             node = parentContainer;

//         while (node.hasChildNodes()) {
//             node.removeChild(node.lastChild);
//         }

//         lenPlcHldr = placeHolder.length;
//         for (k = 0; k < lenPlcHldr; k++) {
//             lenC = placeHolder[k].length;
//             for(j = lenC - 1; j >= 0 ; j--) {
//                 placeHolder[k][j].chart && (disposalBoxChart = disposalBoxChart.concat(placeHolder[k].pop()));
//                 placeHolder[k][j] && (placeHolder[k][j].chart || (disposalBoxGen = 
//                                                                 disposalBoxGen.concat(placeHolder[k].pop())));
//             }
//         }        
//         for(i = 0; i < len; i++) {    
// /*            if(!placeHolder[i]) {
//                 placeHolder[i] = [];
//             }*/
//             placeHolder[i] = [];
//             for(j = 0, lenC = configManager[i].length; j < lenC; j++){
//                 if(placeHolder[i][j]) {
//                     placeHolder[i][j].update(configManager[i][j]);
//                     parentContainer.appendChild(placeHolder[i][j].graphics);
//                 } else {                    
//                     configManager[i][j].chart && (recycledCell = disposalBoxChart.pop());
//                     configManager[i][j].chart || (recycledCell = disposalBoxGen.pop())
//                     if(recycledCell) {
//                     console.log(11,'update',configManager[i][j]);
//                         placeHolder[i][j] = recycledCell.update(configManager[i][j]);
//                         parentContainer.appendChild(placeHolder[i][j].graphics);
//                     } else {
//                         console.log(22,'new',configManager[i][j]);
//                         placeHolder[i][j] = new Cell(configManager[i][j],parentContainer);
//                     }
//                 /*}*/
//             }

// /*            lenPlcHldr = placeHolder[i].length;
//             lenC = configManager[i].length;

//             for (k = lenPlcHldr - 1; k >= lenC; k--) {
//                 placeHolder[i][k].chart && (disposalBoxChart = disposalBoxChart.concat(placeHolder[i].pop()));
//                 placeHolder[i][k] && (placeHolder[i][k].chart || (disposalBoxGen = 
//                                                                 disposalBoxGen.concat(placeHolder[i].pop())));
//             }*/
//         }
// /*        for(i = 0, len = disposalBox.length; i < len; i++) {
//             if(disposalBox[i] !== undefined) {
//                 disposalBox[i].chart && disposalBox[i].chart.chartObj.dispose();
//                 parentContainer.removeChild(disposalBox[i] && disposalBox[i].graphics);
//                 delete disposalBox[i];
//             }
//             delete disposalBox[i];
//         }*/   
//     };



    protoMatrix.dispose = function () {
        var matrix = this,
            node  = matrix && matrix.matrixContainer,
            placeHolder = matrix && matrix.placeHolder,
            i,
            j,
            lenC,
            lenR;
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

                // Events of fusionChart raised via MultiCharting.
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
    global.addEventListener = function (type, listener, bind) {
        return EventTarget.addListener(type, listener, bind);
    };
    global.removeEventListener = function (type, listener, bind) {
        return EventTarget.removeListener(type, listener, bind);
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZnVzaW9uY2hhcnRzLm11bHRpY2hhcnRpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE11bHRpQ2hhcnRpbmcgRXh0ZW5zaW9uIGZvciBGdXNpb25DaGFydHNcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBiYXNpYyByb3V0aW5lcyByZXF1aXJlZCBieSBzdWJzZXF1ZW50IG1vZHVsZXMgdG9cbiAqIGV4dGVuZC9zY2FsZSBvciBhZGQgZnVuY3Rpb25hbGl0eSB0byB0aGUgTXVsdGlDaGFydGluZyBvYmplY3QuXG4gKlxuICovXG5cbiAvKiBnbG9iYWwgd2luZG93OiB0cnVlICovXG5cbihmdW5jdGlvbiAoZW52LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZW52LmRvY3VtZW50ID9cbiAgICAgICAgICAgIGZhY3RvcnkoZW52KSA6IGZ1bmN0aW9uKHdpbikge1xuICAgICAgICAgICAgICAgIGlmICghd2luLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2luZG93IHdpdGggZG9jdW1lbnQgbm90IHByZXNlbnQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhY3Rvcnkod2luLCB0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW52Lk11bHRpQ2hhcnRpbmcgPSBmYWN0b3J5KGVudiwgdHJ1ZSk7XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0aGlzLCBmdW5jdGlvbiAoX3dpbmRvdywgd2luZG93RXhpc3RzKSB7XG4gICAgLy8gSW4gY2FzZSBNdWx0aUNoYXJ0aW5nIGFscmVhZHkgZXhpc3RzLlxuICAgIGlmIChfd2luZG93Lk11bHRpQ2hhcnRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBNdWx0aUNoYXJ0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4gPSBfd2luZG93O1xuXG4gICAgaWYgKHdpbmRvd0V4aXN0cykge1xuICAgICAgICBfd2luZG93Lk11bHRpQ2hhcnRpbmcgPSBNdWx0aUNoYXJ0aW5nO1xuICAgIH1cbiAgICByZXR1cm4gTXVsdGlDaGFydGluZztcbn0pO1xuIiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBtZXJnZSA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSxcbiAgICAgICAgICAgICAgICBzcmNWYWwsXG4gICAgICAgICAgICAgICAgdGd0VmFsLFxuICAgICAgICAgICAgICAgIHN0cixcbiAgICAgICAgICAgICAgICBjUmVmLFxuICAgICAgICAgICAgICAgIG9iamVjdFRvU3RyRm4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICAgICAgICAgIGFycmF5VG9TdHIgPSAnW29iamVjdCBBcnJheV0nLFxuICAgICAgICAgICAgICAgIG9iamVjdFRvU3RyID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgICAgICAgICAgICAgY2hlY2tDeWNsaWNSZWYgPSBmdW5jdGlvbihvYmosIHBhcmVudEFycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IHBhcmVudEFyci5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBiSW5kZXggPSAtMTtcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqID09PSBwYXJlbnRBcnJbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgT0JKRUNUU1RSSU5HID0gJ29iamVjdCc7XG5cbiAgICAgICAgICAgIC8vY2hlY2sgd2hldGhlciBvYmoyIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAvL2lmIGFycmF5IHRoZW4gaXRlcmF0ZSB0aHJvdWdoIGl0J3MgaW5kZXhcbiAgICAgICAgICAgIC8vKioqKiBNT09UT09MUyBwcmVjdXRpb25cblxuICAgICAgICAgICAgaWYgKCFzcmNBcnIpIHtcbiAgICAgICAgICAgICAgICB0Z3RBcnIgPSBbb2JqMV07XG4gICAgICAgICAgICAgICAgc3JjQXJyID0gW29iajJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyLnB1c2gob2JqMSk7XG4gICAgICAgICAgICAgICAgc3JjQXJyLnB1c2gob2JqMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvYmoyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gPSAwOyBpdGVtIDwgb2JqMi5sZW5ndGg7IGl0ZW0gKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0Z3RWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoc2tpcFVuZGVmICYmIHRndFZhbCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RWYWwgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoaXRlbSBpbiBvYmoyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VmFsID0gb2JqMltpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGd0VmFsICE9PSBudWxsICYmIHR5cGVvZiB0Z3RWYWwgPT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4IGZvciBpc3N1ZSBCVUc6IEZXWFQtNjAyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJRSA8IDkgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG51bGwpIGdpdmVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAnW29iamVjdCBPYmplY3RdJyBpbnN0ZWFkIG9mICdbb2JqZWN0IE51bGxdJ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCdzIHdoeSBudWxsIHZhbHVlIGJlY29tZXMgT2JqZWN0IGluIElFIDwgOVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gb2JqZWN0VG9TdHJGbi5jYWxsKHRndFZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBvYmplY3RUb1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgdHlwZW9mIHNyY1ZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHIgPT09IGFycmF5VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8ICEoc3JjVmFsIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICB9LFxuICAgICAgICBleHRlbmQyID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZikge1xuICAgICAgICAgICAgdmFyIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuICAgICAgICAgICAgLy9pZiBub25lIG9mIHRoZSBhcmd1bWVudHMgYXJlIG9iamVjdCB0aGVuIHJldHVybiBiYWNrXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORyAmJiB0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HIHx8IG9iajIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICBvYmoxID0gb2JqMiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lcmdlKG9iajEsIG9iajIsIHNraXBVbmRlZik7XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgbGliID0ge1xuICAgICAgICAgICAgZXh0ZW5kMjogZXh0ZW5kMixcbiAgICAgICAgICAgIG1lcmdlOiBtZXJnZVxuICAgICAgICB9O1xuXG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiA9IChNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgfHwgbGliKTtcblxufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgQWpheCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBhamF4ID0gdGhpcyxcblx0XHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF07XG5cblx0XHQgICAgYWpheC5vblN1Y2Nlc3MgPSBhcmd1bWVudC5zdWNjZXNzO1xuXHRcdCAgICBhamF4Lm9uRXJyb3IgPSBhcmd1bWVudC5lcnJvcjtcblx0XHQgICAgYWpheC5vcGVuID0gZmFsc2U7XG5cdFx0ICAgIHJldHVybiBhamF4LmdldChhcmd1bWVudC51cmwpO1xuXHRcdH0sXG5cbiAgICAgICAgYWpheFByb3RvID0gQWpheC5wcm90b3R5cGUsXG5cbiAgICAgICAgRlVOQ1RJT04gPSAnZnVuY3Rpb24nLFxuICAgICAgICBNU1hNTEhUVFAgPSAnTWljcm9zb2Z0LlhNTEhUVFAnLFxuICAgICAgICBNU1hNTEhUVFAyID0gJ01zeG1sMi5YTUxIVFRQJyxcbiAgICAgICAgR0VUID0gJ0dFVCcsXG4gICAgICAgIFhIUkVRRVJST1IgPSAnWG1sSHR0cHJlcXVlc3QgRXJyb3InLFxuICAgICAgICB3aW4gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4sIC8vIGtlZXAgYSBsb2NhbCByZWZlcmVuY2Ugb2Ygd2luZG93IHNjb3BlXG5cbiAgICAgICAgLy8gUHJvYmUgSUUgdmVyc2lvblxuICAgICAgICB2ZXJzaW9uID0gcGFyc2VGbG9hdCh3aW4ubmF2aWdhdG9yLmFwcFZlcnNpb24uc3BsaXQoJ01TSUUnKVsxXSksXG4gICAgICAgIGllbHQ4ID0gKHZlcnNpb24gPj0gNS41ICYmIHZlcnNpb24gPD0gNykgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgIGZpcmVmb3ggPSAvbW96aWxsYS9pLnRlc3Qod2luLm5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAvL1xuICAgICAgICAvLyBDYWxjdWxhdGUgZmxhZ3MuXG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHBhZ2UgaXMgb24gZmlsZSBwcm90b2NvbC5cbiAgICAgICAgZmlsZVByb3RvY29sID0gd2luLmxvY2F0aW9uLnByb3RvY29sID09PSAnZmlsZTonLFxuICAgICAgICBBWE9iamVjdCA9IHdpbi5BY3RpdmVYT2JqZWN0LFxuXG4gICAgICAgIC8vIENoZWNrIGlmIG5hdGl2ZSB4aHIgaXMgcHJlc2VudFxuICAgICAgICBYSFJOYXRpdmUgPSAoIUFYT2JqZWN0IHx8ICFmaWxlUHJvdG9jb2wpICYmIHdpbi5YTUxIdHRwUmVxdWVzdCxcblxuICAgICAgICAvLyBQcmVwYXJlIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGNvbXBhdGlibGUgeG1saHR0cHJlcXVlc3QuXG4gICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHhtbGh0dHA7XG5cbiAgICAgICAgICAgIC8vIGlmIHhtbGh0dHByZXF1ZXN0IGlzIHByZXNlbnQgYXMgbmF0aXZlLCB1c2UgaXQuXG4gICAgICAgICAgICBpZiAoWEhSTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgWEhSTmF0aXZlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIGFjdGl2ZVggZm9yIElFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBBWE9iamVjdChNU1hNTEhUVFApO1xuICAgICAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFByZXZlbnRzIGNhY2hlaW5nIG9mIEFKQVggcmVxdWVzdHMuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnSWYtTW9kaWZpZWQtU2luY2UnOiAnU2F0LCAyOSBPY3QgMTk5NCAxOTo0MzozMSBHTVQnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHRoZSBzZXJ2ZXIga25vdyB0aGF0IHRoaXMgaXMgYW4gQUpBWCByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHNlcnZlciBrbm93IHdoaWNoIHdlYiBhcHBsaWNhdGlvbiBpcyBzZW5kaW5nIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLUJ5JzogJ0Z1c2lvbkNoYXJ0cycsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1lbnRpb25zIGNvbnRlbnQtdHlwZXMgdGhhdCBhcmUgYWNjZXB0YWJsZSBmb3IgdGhlIHJlc3BvbnNlLiBTb21lIHNlcnZlcnMgcmVxdWlyZSB0aGlzIGZvciBBamF4XG4gICAgICAgICAgICAgKiBjb21tdW5pY2F0aW9uLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICd0ZXh0L3BsYWluLCAqLyonLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgTUlNRSB0eXBlIG9mIHRoZSBib2R5IG9mIHRoZSByZXF1ZXN0IGFsb25nIHdpdGggaXRzIGNoYXJzZXQuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCdcbiAgICAgICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmFqYXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQWpheChhcmd1bWVudHNbMF0pO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZ2V0ID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB2YXIgd3JhcHBlciA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gd3JhcHBlci54bWxodHRwLFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjayA9IHdyYXBwZXIub25FcnJvcixcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayA9IHdyYXBwZXIub25TdWNjZXNzLFxuICAgICAgICAgICAgeFJlcXVlc3RlZEJ5ID0gJ1gtUmVxdWVzdGVkLUJ5JyxcbiAgICAgICAgICAgIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIC8vIFgtUmVxdWVzdGVkLUJ5IGlzIHJlbW92ZWQgZnJvbSBoZWFkZXIgZHVyaW5nIGNyb3NzIGRvbWFpbiBhamF4IGNhbGxcbiAgICAgICAgaWYgKHVybC5zZWFyY2goL14oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKS8pICE9PSAtMSAmJlxuICAgICAgICAgICAgICAgIHdpbi5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gLyhodHRwOlxcL1xcL3xodHRwczpcXC9cXC8pKFteXFwvXFw6XSopLy5leGVjKHVybClbMl0pIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBodHRwIG9yIGh0dHBzLCB0aGVuIGl0cyBhIHNhbWUgZG9tYWluIGNhbGwuIE5vIG5lZWQgdG8gdXNlIHJlZ2V4IHRvIGdldFxuICAgICAgICAgICAgLy8gZG9tYWluLiBJZiBpdCBjb250YWlucyB0aGVuIGNoZWNrcyBkb21haW4uXG4gICAgICAgICAgICBkZWxldGUgaGVhZGVyc1t4UmVxdWVzdGVkQnldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIWhhc093bi5jYWxsKGhlYWRlcnMsIHhSZXF1ZXN0ZWRCeSkgJiYgKGhlYWRlcnNbeFJlcXVlc3RlZEJ5XSA9ICdGdXNpb25DaGFydHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgheG1saHR0cCB8fCBpZWx0OCB8fCBmaXJlZm94KSB7XG4gICAgICAgICAgICB4bWxodHRwID0gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHdyYXBwZXIueG1saHR0cCA9IHhtbGh0dHA7XG4gICAgICAgIH1cblxuICAgICAgICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHhtbGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICgoIXhtbGh0dHAuc3RhdHVzICYmIGZpbGVQcm90b2NvbCkgfHwgKHhtbGh0dHAuc3RhdHVzID49IDIwMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgeG1saHR0cC5zdGF0dXMgPCAzMDApIHx8IHhtbGh0dHAuc3RhdHVzID09PSAzMDQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzID09PSAxMjIzIHx8IHhtbGh0dHAuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHhtbGh0dHAucmVzcG9uc2VUZXh0LCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sobmV3IEVycm9yKFhIUkVRRVJST1IpLCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3cmFwcGVyLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgeG1saHR0cC5vcGVuKEdFVCwgdXJsLCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKHhtbGh0dHAub3ZlcnJpZGVNaW1lVHlwZSkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAub3ZlcnJpZGVNaW1lVHlwZSgndGV4dC9wbGFpbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgaW4gaGVhZGVycykge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcihpLCBoZWFkZXJzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeG1saHR0cC5zZW5kKCk7XG4gICAgICAgICAgICB3cmFwcGVyLm9wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yLCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHhtbGh0dHA7XG4gICAgfTtcblxuICAgIGFqYXhQcm90by5hYm9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcyxcbiAgICAgICAgICAgIHhtbGh0dHAgPSBpbnN0YW5jZS54bWxodHRwO1xuXG4gICAgICAgIGluc3RhbmNlLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHhtbGh0dHAgJiYgdHlwZW9mIHhtbGh0dHAuYWJvcnQgPT09IEZVTkNUSU9OICYmIHhtbGh0dHAucmVhZHlTdGF0ZSAmJlxuICAgICAgICAgICAgICAgIHhtbGh0dHAucmVhZHlTdGF0ZSAhPT0gMCAmJiB4bWxodHRwLmFib3J0KCk7XG4gICAgfTtcblxuICAgIGFqYXhQcm90by5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICBpbnN0YW5jZS5vcGVuICYmIGluc3RhbmNlLmFib3J0KCk7XG5cbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9uRXJyb3I7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vblN1Y2Nlc3M7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS54bWxodHRwO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub3BlbjtcblxuICAgICAgICByZXR1cm4gKGluc3RhbmNlID0gbnVsbCk7XG4gICAgfTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICAvLyBTb3VyY2U6IGh0dHA6Ly93d3cuYmVubmFkZWwuY29tL2Jsb2cvMTUwNC1Bc2stQmVuLVBhcnNpbmctQ1NWLVN0cmluZ3MtV2l0aC1KYXZhc2NyaXB0LUV4ZWMtUmVndWxhci1FeHByZXNzaW9uLUNvbW1hbmQuaHRtXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cblxuXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cbiAgICBmdW5jdGlvbiBDU1ZUb0FycmF5IChzdHJEYXRhLCBzdHJEZWxpbWl0ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBkZWxpbWl0ZXIgaXMgZGVmaW5lZC4gSWYgbm90LFxuICAgICAgICAvLyB0aGVuIGRlZmF1bHQgdG8gY29tbWEuXG4gICAgICAgIHN0ckRlbGltaXRlciA9IChzdHJEZWxpbWl0ZXIgfHwgXCIsXCIpO1xuICAgICAgICAvLyBDcmVhdGUgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcGFyc2UgdGhlIENTViB2YWx1ZXMuXG4gICAgICAgIHZhciBvYmpQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAvLyBEZWxpbWl0ZXJzLlxuICAgICAgICAgICAgICAgIFwiKFxcXFxcIiArIHN0ckRlbGltaXRlciArIFwifFxcXFxyP1xcXFxufFxcXFxyfF4pXCIgK1xuICAgICAgICAgICAgICAgIC8vIFF1b3RlZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoPzpcXFwiKFteXFxcIl0qKD86XFxcIlxcXCJbXlxcXCJdKikqKVxcXCJ8XCIgK1xuICAgICAgICAgICAgICAgIC8vIFN0YW5kYXJkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIihbXlxcXCJcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcIlxcXFxyXFxcXG5dKikpXCJcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcImdpXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBkYXRhLiBHaXZlIHRoZSBhcnJheVxuICAgICAgICAvLyBhIGRlZmF1bHQgZW1wdHkgZmlyc3Qgcm93LlxuICAgICAgICB2YXIgYXJyRGF0YSA9IFtbXV07XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBpbmRpdmlkdWFsIHBhdHRlcm5cbiAgICAgICAgLy8gbWF0Y2hpbmcgZ3JvdXBzLlxuICAgICAgICB2YXIgYXJyTWF0Y2hlcyA9IG51bGw7XG4gICAgICAgIC8vIEtlZXAgbG9vcGluZyBvdmVyIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlc1xuICAgICAgICAvLyB1bnRpbCB3ZSBjYW4gbm8gbG9uZ2VyIGZpbmQgYSBtYXRjaC5cbiAgICAgICAgd2hpbGUgKGFyck1hdGNoZXMgPSBvYmpQYXR0ZXJuLmV4ZWMoIHN0ckRhdGEgKSl7XG4gICAgICAgICAgICAvLyBHZXQgdGhlIGRlbGltaXRlciB0aGF0IHdhcyBmb3VuZC5cbiAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkRGVsaW1pdGVyID0gYXJyTWF0Y2hlc1sgMSBdO1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBnaXZlbiBkZWxpbWl0ZXIgaGFzIGEgbGVuZ3RoXG4gICAgICAgICAgICAvLyAoaXMgbm90IHRoZSBzdGFydCBvZiBzdHJpbmcpIGFuZCBpZiBpdCBtYXRjaGVzXG4gICAgICAgICAgICAvLyBmaWVsZCBkZWxpbWl0ZXIuIElmIGlkIGRvZXMgbm90LCB0aGVuIHdlIGtub3dcbiAgICAgICAgICAgIC8vIHRoYXQgdGhpcyBkZWxpbWl0ZXIgaXMgYSByb3cgZGVsaW1pdGVyLlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHN0ck1hdGNoZWREZWxpbWl0ZXIubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgKHN0ck1hdGNoZWREZWxpbWl0ZXIgIT0gc3RyRGVsaW1pdGVyKVxuICAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgLy8gU2luY2Ugd2UgaGF2ZSByZWFjaGVkIGEgbmV3IHJvdyBvZiBkYXRhLFxuICAgICAgICAgICAgICAgIC8vIGFkZCBhbiBlbXB0eSByb3cgdG8gb3VyIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICAgICAgYXJyRGF0YS5wdXNoKCBbXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgZGVsaW1pdGVyIG91dCBvZiB0aGUgd2F5LFxuICAgICAgICAgICAgLy8gbGV0J3MgY2hlY2sgdG8gc2VlIHdoaWNoIGtpbmQgb2YgdmFsdWUgd2VcbiAgICAgICAgICAgIC8vIGNhcHR1cmVkIChxdW90ZWQgb3IgdW5xdW90ZWQpLlxuICAgICAgICAgICAgaWYgKGFyck1hdGNoZXNbIDIgXSl7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBxdW90ZWQgdmFsdWUuIFdoZW4gd2UgY2FwdHVyZVxuICAgICAgICAgICAgICAgIC8vIHRoaXMgdmFsdWUsIHVuZXNjYXBlIGFueSBkb3VibGUgcXVvdGVzLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAyIF0ucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFJlZ0V4cCggXCJcXFwiXFxcIlwiLCBcImdcIiApLFxuICAgICAgICAgICAgICAgICAgICBcIlxcXCJcIlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIG5vbi1xdW90ZWQgdmFsdWUuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDMgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIHZhbHVlIHN0cmluZywgbGV0J3MgYWRkXG4gICAgICAgICAgICAvLyBpdCB0byB0aGUgZGF0YSBhcnJheS5cbiAgICAgICAgICAgIGFyckRhdGFbIGFyckRhdGEubGVuZ3RoIC0gMSBdLnB1c2goIHN0ck1hdGNoZWRWYWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJldHVybiB0aGUgcGFyc2VkIGRhdGEuXG4gICAgICAgIHJldHVybiggYXJyRGF0YSApO1xuICAgIH1cbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY29udmVydFRvQXJyYXkgPSBmdW5jdGlvbiAoZGF0YSwgZGVsaW1pdGVyLCBvdXRwdXRGb3JtYXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGRlbGltaXRlciA9IGRhdGEuZGVsaW1pdGVyO1xuICAgICAgICAgICAgb3V0cHV0Rm9ybWF0ID0gZGF0YS5vdXRwdXRGb3JtYXQ7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGRhdGEuY2FsbGJhY2s7XG4gICAgICAgICAgICBkYXRhID0gZGF0YS5zdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NTViBzdHJpbmcgbm90IHByb3ZpZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwbGl0ZWREYXRhID0gZGF0YS5zcGxpdCgvXFxyXFxufFxccnxcXG4vKSxcbiAgICAgICAgICAgIC8vdG90YWwgbnVtYmVyIG9mIHJvd3NcbiAgICAgICAgICAgIGxlbiA9IHNwbGl0ZWREYXRhLmxlbmd0aCxcbiAgICAgICAgICAgIC8vZmlyc3Qgcm93IGlzIGhlYWRlciBhbmQgc3BsaXRpbmcgaXQgaW50byBhcnJheXNcbiAgICAgICAgICAgIGhlYWRlciA9IENTVlRvQXJyYXkoc3BsaXRlZERhdGFbMF0sIGRlbGltaXRlciksIC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgICAgaSA9IDEsXG4gICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgIGsgPSAwLFxuICAgICAgICAgICAga2xlbiA9IDAsXG4gICAgICAgICAgICBjZWxsID0gW10sXG4gICAgICAgICAgICBtaW4gPSBNYXRoLm1pbixcbiAgICAgICAgICAgIGZpbmFsT2IsXG4gICAgICAgICAgICB1cGRhdGVNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW0gPSAwLFxuICAgICAgICAgICAgICAgICAgICBqbGVuID0gMCxcbiAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGkgKyAzMDAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChsaW0gPiBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgbGltID0gbGVuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxpbTsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgY2VsbCBhcnJheSB0aGF0IGNvaW50YWluIGNzdiBkYXRhXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhW2ldLCBkZWxpbWl0ZXIpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgICAgICAgICAgY2VsbCA9IGNlbGwgJiYgY2VsbFswXTtcbiAgICAgICAgICAgICAgICAgICAgLy90YWtlIG1pbiBvZiBoZWFkZXIgbGVuZ3RoIGFuZCB0b3RhbCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgICAgIGpsZW4gPSBtaW4oaGVhZGVyLmxlbmd0aCwgY2VsbC5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRGb3JtYXQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2IucHVzaChjZWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJbal1dID0gY2VsbFtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2IucHVzaChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2JbaGVhZGVyW2pdXS5wdXNoKGNlbGxbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY2FsbCB1cGRhdGUgbWFuYWdlclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXRUaW1lb3V0KHVwZGF0ZU1hbmFnZXIsIDApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZmluYWxPYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBvdXRwdXRGb3JtYXQgPSBvdXRwdXRGb3JtYXQgfHwgMTtcbiAgICAgICAgaGVhZGVyID0gaGVhZGVyICYmIGhlYWRlclswXTtcblxuICAgICAgICAvL2lmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAoc3BsaXRlZERhdGFbc3BsaXRlZERhdGEubGVuZ3RoIC0gMV0gPT09ICcnKSB7XG4gICAgICAgICAgICBzcGxpdGVkRGF0YS5zcGxpY2UoKHNwbGl0ZWREYXRhLmxlbmd0aCAtIDEpLCAxKTtcbiAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXQgPT09IDEpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgICAgIGZpbmFsT2IucHVzaChoZWFkZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdCA9PT0gMikge1xuICAgICAgICAgICAgZmluYWxPYiA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdCA9PT0gMykge1xuICAgICAgICAgICAgZmluYWxPYiA9IHt9O1xuICAgICAgICAgICAgZm9yIChrID0gMCwga2xlbiA9IGhlYWRlci5sZW5ndGg7IGsgPCBrbGVuOyArK2spIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltrXV0gPSBbXTtcbiAgICAgICAgICAgIH0gICBcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZU1hbmFnZXIoKTtcblxuICAgIH07XG5cbn0pO1xuIiwiLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhclx0bXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG5cdFx0bGliID0gbXVsdGlDaGFydGluZ1Byb3RvLmxpYixcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSA9IHt9LFxuXHRcdG91dHB1dERhdGFTdG9yYWdlID0gbGliLm91dHB1dERhdGFTdG9yYWdlID0ge30sXG5cdFx0bWV0YVN0b3JhZ2UgPSBsaWIubWV0YVN0b3JhZ2UgPSB7fSxcblx0XHRleHRlbmQyID0gbGliLmV4dGVuZDIsXG5cdFx0Ly8gRm9yIHN0b3JpbmcgdGhlIGNoaWxkIG9mIGEgcGFyZW50XG5cdFx0bGlua1N0b3JlID0ge30sXG5cdFx0Ly9Gb3Igc3RvcmluZyB0aGUgcGFyZW50IG9mIGEgY2hpbGRcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSA9IHt9LFxuXHRcdGlkQ291bnQgPSAwLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhU3RvcmUuXG5cdFx0RGF0YVN0b3JlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIudW5pcXVlVmFsdWVzID0ge307XG5cdCAgICBcdG1hbmFnZXIuc2V0RGF0YShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0ZGF0YVN0b3JlUHJvdG8gPSBEYXRhU3RvcmUucHJvdG90eXBlLFxuXG5cdFx0Ly8gRnVuY3Rpb24gdG8gZXhlY3V0ZSB0aGUgZGF0YVByb2Nlc3NvciBvdmVyIHRoZSBkYXRhXG5cdFx0ZXhlY3V0ZVByb2Nlc3NvciA9IGZ1bmN0aW9uICh0eXBlLCBmaWx0ZXJGbiwgSlNPTkRhdGEpIHtcblx0XHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0XHRjYXNlICAnc29ydCcgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNvcnQuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuXHRcdFx0XHRjYXNlICAnZmlsdGVyJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0Y2FzZSAnbWFwJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0ZGVmYXVsdCA6IHJldHVybiBmaWx0ZXJGbihKU09ORGF0YSk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRnVuY3Rpb24gdG8gdXBkYXRlIGFsbCB0aGUgbGlua2VkIGNoaWxkIGRhdGFcblx0XHR1cGRhdGFEYXRhID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgaSxcblx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdLFxuXHRcdFx0XHRwYXJlbnREYXRhID0gZGF0YVN0b3JhZ2VbaWRdLFxuXHRcdFx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSxcblx0XHRcdFx0bGVuLFxuXHRcdFx0XHRsaW5rSWRzLFxuXHRcdFx0XHRmaWx0ZXJzLFxuXHRcdFx0XHRsaW5rSWQsXG5cdFx0XHRcdGZpbHRlcixcblx0XHRcdFx0ZmlsdGVyRm4sXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdC8vIFN0b3JlIGFsbCB0aGUgZGF0YU9ianMgdGhhdCBhcmUgdXBkYXRlZC5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkID0gbGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXG5cdFx0XHRsaW5rSWRzID0gbGlua0RhdGEubGluaztcblx0XHRcdGZpbHRlcnMgPSBsaW5rRGF0YS5maWx0ZXI7XG5cdFx0XHRsZW4gPSBsaW5rSWRzLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGxpbmtJZCA9IGxpbmtJZHNbaV07XG5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkW2xpbmtJZF0gPSB0cnVlO1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldO1xuXHRcdFx0XHRmaWx0ZXJGbiA9IGZpbHRlci5nZXRQcm9jZXNzb3IoKTtcblx0XHRcdFx0dHlwZSA9IGZpbHRlci50eXBlO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyRm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRpZiAoZmlsdGVyU3RvcmVbZmlsdGVyLmlkXSkge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIHBhcmVudERhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0gPSBwYXJlbnREYXRhO1xuXHRcdFx0XHRcdFx0ZmlsdGVyLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGkgLT0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbbGlua0lkXSkge1xuXHRcdFx0XHRcdHVwZGF0YURhdGEobGlua0lkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvL0Z1bmN0aW9uIHRvIHVwZGF0ZSBtZXRhRGF0YSBvZiB0aGUgY2hpbGQgZGF0YSByZWN1cnNzaXZlbHlcblx0XHR1cGRhdGVNZXRhRGF0YSA9IGZ1bmN0aW9uIChpZCwgbWV0YURhdGEpIHtcblx0XHRcdHZhciBsaW5rcyA9IGxpbmtTdG9yZVtpZF0ubGluayxcblx0XHRcdFx0bGVuZ3RoID0gbGlua3MubGVuZ3RoLFxuXHRcdFx0XHRpLFxuXHRcdFx0XHRuZXdNZXRhRGF0YSxcblx0XHRcdFx0bGluaztcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpbmsgPSBsaW5rc1tpXTtcblx0XHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtsaW5rXSA9IGV4dGVuZDIoe30sIG1ldGFEYXRhKTtcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtsaW5rXSkge1xuXHRcdFx0XHRcdHVwZGF0ZU1ldGFEYXRhKGxpbmssIG5ld01ldGFEYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0bXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGFTdG9yZShhcmd1bWVudHMpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIGluIHRoZSBkYXRhIHN0b3JlXG5cdGRhdGFTdG9yZVByb3RvLnNldERhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaywgbm9SYWlzZUV2ZW50RmxhZykge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0b2xkSWQgPSBkYXRhU3RvcmUuaWQsXG5cdFx0XHRpZCA9IGRhdGFTcGVjcy5pZCxcblx0XHRcdGRhdGFUeXBlID0gZGF0YVNwZWNzLmRhdGFUeXBlLFxuXHRcdFx0ZGF0YVNvdXJjZSA9IGRhdGFTcGVjcy5kYXRhU291cmNlLFxuXHRcdFx0b2xkSlNPTkRhdGEgPSBkYXRhU3RvcmFnZVtvbGRJZF0gfHwgW10sXG5cdFx0XHRjYWxsYmFja0hlbHBlckZuID0gZnVuY3Rpb24gKEpTT05EYXRhKSB7XG5cdFx0XHRcdGRhdGFTdG9yYWdlW2lkXSA9IG9sZEpTT05EYXRhLmNvbmNhdChKU09ORGF0YSB8fCBbXSk7XG5cdFx0XHRcdCFub1JhaXNlRXZlbnRGbGFnICYmIEpTT05EYXRhICYmIG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhQWRkZWQnLCB7XG5cdFx0XHRcdFx0J2lkJzogaWQsXG5cdFx0XHRcdFx0J2RhdGEnIDogSlNPTkRhdGFcblx0XHRcdFx0fSwgZGF0YVN0b3JlKTtcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtpZF0pIHtcblx0XHRcdFx0XHR1cGRhdGFEYXRhKGlkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soSlNPTkRhdGEpO1xuXHRcdFx0XHR9XHRcblx0XHRcdH07XG5cblx0XHRpZCA9IG9sZElkIHx8IGlkIHx8ICdkYXRhU3RvcmFnZScgKyBpZENvdW50ICsrO1xuXHRcdGRhdGFTdG9yZS5pZCA9IGlkO1xuXHRcdGRlbGV0ZSBkYXRhU3RvcmUua2V5cztcblx0XHRkYXRhU3RvcmUudW5pcXVlVmFsdWVzID0ge307XG5cblx0XHRpZiAoZGF0YVR5cGUgPT09ICdjc3YnKSB7XG5cdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8uY29udmVydFRvQXJyYXkoe1xuXHRcdFx0XHRzdHJpbmcgOiBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdFx0ZGVsaW1pdGVyIDogZGF0YVNwZWNzLmRlbGltaXRlcixcblx0XHRcdFx0b3V0cHV0Rm9ybWF0IDogZGF0YVNwZWNzLm91dHB1dEZvcm1hdCxcblx0XHRcdFx0Y2FsbGJhY2sgOiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0XHRcdGNhbGxiYWNrSGVscGVyRm4oZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNhbGxiYWNrSGVscGVyRm4oZGF0YVNvdXJjZSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUganNvbmRhdGEgb2YgdGhlIGRhdGEgb2JqZWN0XG5cdGRhdGFTdG9yZVByb3RvLmdldEpTT04gPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGlkID0gdGhpcy5pZDtcblx0XHRyZXR1cm4gKG91dHB1dERhdGFTdG9yYWdlW2lkXSB8fCBkYXRhU3RvcmFnZVtpZF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCBjaGlsZCBkYXRhIG9iamVjdCBhZnRlciBhcHBseWluZyBmaWx0ZXIgb24gdGhlIHBhcmVudCBkYXRhLlxuXHQvLyBAcGFyYW1zIHtmaWx0ZXJzfSAtIFRoaXMgY2FuIGJlIGEgZmlsdGVyIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIGZpbHRlciBmdW5jdGlvbnMuXG5cdGRhdGFTdG9yZVByb3RvLmdldERhdGEgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdGlkID0gZGF0YS5pZCxcblx0XHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluaztcblx0XHQvLyBJZiBubyBwYXJhbWV0ZXIgaXMgcHJlc2VudCB0aGVuIHJldHVybiB0aGUgdW5maWx0ZXJlZCBkYXRhLlxuXHRcdGlmICghZmlsdGVycykge1xuXHRcdFx0cmV0dXJuIGRhdGFTdG9yYWdlW2lkXTtcblx0XHR9XG5cdFx0Ly8gSWYgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIGZpbHRlciB0aGVuIHJldHVybiB0aGUgZmlsdGVyZWQgZGF0YSBhZnRlciBhcHBseWluZyB0aGUgZmlsdGVyIG92ZXIgdGhlIGRhdGEuXG5cdFx0ZWxzZSB7XG5cdFx0XHRsZXQgcmVzdWx0ID0gW10sXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld0RhdGEsXG5cdFx0XHRcdGxpbmtEYXRhLFxuXHRcdFx0XHRuZXdJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0ZGF0YWxpbmtzLFxuXHRcdFx0XHRmaWx0ZXJJRCxcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0bmV3RGF0YU9iaixcblx0XHRcdFx0aXNGaWx0ZXJBcnJheSA9IGZpbHRlcnMgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdFx0bGVuID0gaXNGaWx0ZXJBcnJheSA/IGZpbHRlcnMubGVuZ3RoIDogMTtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV0gfHwgZmlsdGVycztcblx0XHRcdFx0ZmlsdGVyRm4gPSBmaWx0ZXIuZ2V0UHJvY2Vzc29yKCk7XG5cdFx0XHRcdHR5cGUgPSBmaWx0ZXIudHlwZTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0bmV3RGF0YSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIGRhdGFTdG9yYWdlW2lkXSk7XG5cblx0XHRcdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YVByb2Nlc3NvckFwcGxpZWQnLCB7XG5cdFx0XHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YSxcblx0XHRcdFx0XHRcdCdkYXRhUHJvY2Vzc29yJyA6IGZpbHRlclxuXHRcdFx0XHRcdH0sIGRhdGEpO1xuXG5cdFx0XHRcdFx0bmV3RGF0YU9iaiA9IG5ldyBEYXRhU3RvcmUoe2RhdGFTb3VyY2UgOiBuZXdEYXRhfSk7XG5cdFx0XHRcdFx0bmV3SWQgPSBuZXdEYXRhT2JqLmlkO1xuXG5cdFx0XHRcdFx0Ly9QYXNzaW5nIHRoZSBtZXRhRGF0YSB0byB0aGUgY2hpbGQuXG5cdFx0XHRcdFx0bmV3RGF0YU9iai5hZGRNZXRhRGF0YShtZXRhU3RvcmFnZVtpZF0pO1xuXHRcdFx0XHRcdHBhcmVudFN0b3JlW25ld0lkXSA9IGRhdGE7XG5cblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXdEYXRhT2JqKTtcblxuXHRcdFx0XHRcdC8vUHVzaGluZyB0aGUgaWQgYW5kIGZpbHRlciBvZiBjaGlsZCBjbGFzcyB1bmRlciB0aGUgcGFyZW50IGNsYXNzZXMgaWQuXG5cdFx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdIHx8IChsaW5rU3RvcmVbaWRdID0ge1xuXHRcdFx0XHRcdFx0bGluayA6IFtdLFxuXHRcdFx0XHRcdFx0ZmlsdGVyIDogW11cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRsaW5rRGF0YS5saW5rLnB1c2gobmV3SWQpO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmZpbHRlci5wdXNoKGZpbHRlcik7XG5cblx0XHRcdFx0XHQvLyBTdG9yaW5nIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCB1bmRlciB0aGUgZmlsdGVyIGlkLlxuXHRcdFx0XHRcdGZpbHRlcklEID0gZmlsdGVyLmdldElEKCk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzID0gZmlsdGVyTGlua1tmaWx0ZXJJRF0gfHwgKGZpbHRlckxpbmtbZmlsdGVySURdID0gW10pO1xuXHRcdFx0XHRcdGRhdGFsaW5rcy5wdXNoKG5ld0RhdGFPYmopO1xuXG5cdFx0XHRcdFx0Ly8gc2V0dGluZyB0aGUgY3VycmVudCBpZCBhcyB0aGUgbmV3SUQgc28gdGhhdCB0aGUgbmV4dCBmaWx0ZXIgaXMgYXBwbGllZCBvbiB0aGUgY2hpbGQgZGF0YTtcblx0XHRcdFx0XHRpZCA9IG5ld0lkO1xuXHRcdFx0XHRcdGRhdGEgPSBuZXdEYXRhT2JqO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gKGlzRmlsdGVyQXJyYXkgPyByZXN1bHQgOiByZXN1bHRbMF0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBkZWxldGUgdGhlIGN1cnJlbnQgZGF0YSBmcm9tIHRoZSBkYXRhU3RvcmFnZSBhbmQgYWxzbyBhbGwgaXRzIGNoaWxkcyByZWN1cnNpdmVseVxuXHRkYXRhU3RvcmVQcm90by5kZWxldGVEYXRhID0gZnVuY3Rpb24gKG9wdGlvbmFsSWQpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhU3RvcmUuaWQsXG5cdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRmbGFnO1xuXG5cdFx0aWYgKGxpbmtEYXRhKSB7XG5cdFx0XHRsZXQgaSxcblx0XHRcdFx0bGluayA9IGxpbmtEYXRhLmxpbmssXG5cdFx0XHRcdGxlbiA9IGxpbmsubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXRhU3RvcmUuZGVsZXRlRGF0YShsaW5rW2ldKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBsaW5rU3RvcmVbaWRdO1xuXHRcdH1cblxuXHRcdGRlbGV0ZSBtZXRhU3RvcmFnZVtpZF07XG5cdFx0ZGVsZXRlIG91dHB1dERhdGFTdG9yYWdlW2lkXTtcblxuXHRcdGZsYWcgPSBkZWxldGUgZGF0YVN0b3JhZ2VbaWRdO1xuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0cmV0dXJuIGZsYWc7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBpZCBvZiB0aGUgY3VycmVudCBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIG1vZGlmeSBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLm1vZGlmeURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRkYXRhU3RvcmFnZVtpZF0gPSBbXTtcblx0XHRkYXRhU3RvcmUuc2V0RGF0YShkYXRhU3BlY3MsIGNhbGxiYWNrLCB0cnVlKTtcblx0XHRcblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YU1vZGlmaWVkJywge1xuXHRcdFx0J2lkJzogaWRcblx0XHR9LCBkYXRhU3RvcmUpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIHRvIHRoZSBkYXRhU3RvcmFnZSBhc3luY2hyb25vdXNseSB2aWEgYWpheFxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcblx0XHRcdGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG5cdFx0XHRkZWxpbWl0ZXIgPSBhcmd1bWVudC5kZWxpbWl0ZXIsXG5cdFx0XHRvdXRwdXRGb3JtYXQgPSBhcmd1bWVudC5vdXRwdXRGb3JtYXQsXG5cdFx0XHRjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuXHRcdFx0Y2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuXHRcdFx0ZGF0YTtcblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5hamF4KHtcblx0XHRcdHVybCA6IGRhdGFTb3VyY2UsXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuXHRcdFx0XHRkYXRhU3RvcmUuc2V0RGF0YSh7XG5cdFx0XHRcdFx0ZGF0YVNvdXJjZSA6IGRhdGEsXG5cdFx0XHRcdFx0ZGF0YVR5cGUgOiBkYXRhVHlwZSxcblx0XHRcdFx0XHRkZWxpbWl0ZXIgOiBkZWxpbWl0ZXIsXG5cdFx0XHRcdFx0b3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHR9LCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXG5cdFx0XHRlcnJvciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSBrZXlzIG9mIHRoZSBKU09OIGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0S2V5cyA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGtleXMgPSBkYXRhU3RvcmUua2V5cztcblxuXHRcdGlmIChrZXlzKSB7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cdFx0aWYgKGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gaW50ZXJuYWxEYXRhKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gT2JqZWN0LmtleXMoaW50ZXJuYWxEYXRhKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IGFsbCB0aGUgdW5pcXVlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEga2V5XG5cdGRhdGFTdG9yZVByb3RvLmdldFVuaXF1ZVZhbHVlcyA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGlzQXJyYXkgPSBpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdHVuaXF1ZVZhbHVlcyA9IGRhdGFTdG9yZS51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHRcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZGF0YVN0b3JlLmdldEtleXMoKS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQudG9VcHBlckNhc2UoKSA9PT0ga2V5LnRvVXBwZXJDYXNlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpID0gMDtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSBpc0FycmF5ID8gMSA6IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aW50ZXJuYWxEYXRhID0gaXNBcnJheSA/IGRhdGFbaV1ba2V5XSA6IGRhdGFbaV1ba2V5XTtcblx0XHRcdCF0ZW1wVW5pcXVlVmFsdWVzW2ludGVybmFsRGF0YV0gJiYgKHRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSA9IHRydWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldID0gT2JqZWN0LmtleXModGVtcFVuaXF1ZVZhbHVlcykpO1xuXHR9O1xuXG5cdC8vRnVuY3Rpb24gdG8gY2hhbmdlIHRoZSBvdXRwdXQgb2YgZ2V0SlNPTigpIGJhc2VkIG9uIHRoZSBkYXRhUHJvY2Vzc29yIGFwcGxpZWRcblx0ZGF0YVN0b3JlUHJvdG8uYXBwbHlEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKGRhdGFQcm9jZXNzb3IpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdHByb2Nlc3NvckZuID0gZGF0YVByb2Nlc3Nvci5nZXRQcm9jZXNzb3IoKSxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG91dHB1dCxcblx0XHRcdEpTT05EYXRhID0gZGF0YVN0b3JhZ2VbaWRdO1xuXG5cdFx0aWYgKHR5cGVvZiBwcm9jZXNzb3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0b3V0cHV0ID0gb3V0cHV0RGF0YVN0b3JhZ2VbZGF0YVN0b3JlLmlkXSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgcHJvY2Vzc29yRm4sIEpTT05EYXRhKTtcblxuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFQcm9jZXNzb3JBcHBsaWVkJywge1xuXHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YVN0b3JlLFxuXHRcdFx0XHQnZGF0YVByb2Nlc3NvcicgOiBkYXRhUHJvY2Vzc29yXG5cdFx0XHR9LCBkYXRhU3RvcmUpO1xuXG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgbWV0YWRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uYWRkTWV0YURhdGEgPSBmdW5jdGlvbiAobWV0YURhdGEsIG1lcmdlKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG5ld01ldGFEYXRhO1xuXHRcdGlmIChtZXJnZSkge1xuXHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtpZF0gPSBleHRlbmQyKG1ldGFTdG9yYWdlW2lkXSB8fCB7fSwgbWV0YURhdGEpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdG5ld01ldGFEYXRhID0gbWV0YVN0b3JhZ2VbaWRdID0gbWV0YURhdGE7XG5cdFx0fVxuXHRcdGxpbmtTdG9yZVtpZF0gJiYgdXBkYXRlTWV0YURhdGEoaWQsIG5ld01ldGFEYXRhKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGFkZGVkIG1ldGFEYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldE1ldGFEYXRhID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBtZXRhU3RvcmFnZVt0aGlzLmlkXTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byByZW1vdmUgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG5cdFx0bGliID0gbXVsdGlDaGFydGluZ1Byb3RvLmxpYixcblx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSA9IHt9LFxuXHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluayA9IHt9LFxuXHRcdGZpbHRlcklkQ291bnQgPSAwLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlLFxuXHRcdHBhcmVudFN0b3JlID0gbGliLnBhcmVudFN0b3JlLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhUHJvY2Vzc29yLlxuXHRcdERhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBcdHZhciBtYW5hZ2VyID0gdGhpcztcblx0ICAgIFx0bWFuYWdlci5hZGRSdWxlKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHRcblx0XHRkYXRhUHJvY2Vzc29yUHJvdG8gPSBEYXRhUHJvY2Vzc29yLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSBkYXRhIG9uIGNoYW5nZSBvZiBmaWx0ZXIuXG5cdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yID0gZnVuY3Rpb24gKGlkLCBjb3B5UGFyZW50VG9DaGlsZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGRhdGEgPSBmaWx0ZXJMaW5rW2lkXSxcblx0XHRcdFx0SlNPTkRhdGEsXG5cdFx0XHRcdGRhdHVtLFxuXHRcdFx0XHRkYXRhSWQsXG5cdFx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICsrKSB7XG5cdFx0XHRcdGRhdHVtID0gZGF0YVtpXTtcblx0XHRcdFx0ZGF0YUlkID0gZGF0dW0uaWQ7XG5cdFx0XHRcdGlmICghbGliLnRlbXBEYXRhVXBkYXRlZFtkYXRhSWRdKSB7XG5cdFx0XHRcdFx0aWYgKHBhcmVudFN0b3JlW2RhdGFJZF0gJiYgZGF0YVN0b3JhZ2VbZGF0YUlkXSkge1xuXHRcdFx0XHRcdFx0SlNPTkRhdGEgPSBwYXJlbnRTdG9yZVtkYXRhSWRdLmdldERhdGEoKTtcblx0XHRcdFx0XHRcdGRhdHVtLm1vZGlmeURhdGEoY29weVBhcmVudFRvQ2hpbGQgPyBKU09ORGF0YSA6IGZpbHRlclN0b3JlW2lkXShKU09ORGF0YSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRlbGV0ZSBwYXJlbnRTdG9yZVtkYXRhSWRdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXHRcdH07XG5cblx0bXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhUHJvY2Vzc29yKGFyZ3VtZW50c1swXSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGZpbHRlciBpbiB0aGUgZmlsdGVyIHN0b3JlXG5cdGRhdGFQcm9jZXNzb3JQcm90by5hZGRSdWxlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0b2xkSWQgPSBmaWx0ZXIuaWQsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGZpbHRlckZuID0gKGFyZ3VtZW50ICYmIGFyZ3VtZW50LnJ1bGUpIHx8IGFyZ3VtZW50LFxuXHRcdFx0aWQgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlLFxuXHRcdFx0dHlwZSA9IGFyZ3VtZW50ICYmIGFyZ3VtZW50LnR5cGU7XG5cblx0XHRpZCA9IG9sZElkIHx8IGlkIHx8ICdmaWx0ZXJTdG9yZScgKyBmaWx0ZXJJZENvdW50ICsrO1xuXHRcdGZpbHRlclN0b3JlW2lkXSA9IGZpbHRlckZuO1xuXG5cdFx0ZmlsdGVyLmlkID0gaWQ7XG5cdFx0ZmlsdGVyLnR5cGUgPSB0eXBlO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCBhbmQgYWxzbyBvbiB0aGUgY2hpbGQgZGF0YS5cblx0XHRpZiAoZmlsdGVyTGlua1tpZF0pIHtcblx0XHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvcihpZCk7XG5cdFx0fVxuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckFkZGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0XHQnZGF0YScgOiBmaWx0ZXJGblxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgdGhlIGZpbHRlciBtZXRob2QuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGZpbHRlclN0b3JlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgSUQgb2YgdGhlIGZpbHRlci5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmRlbGV0ZVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckRlbGV0ZWQnLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHR9LCBmaWx0ZXIpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5maWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdmaWx0ZXInXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uc29ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ3NvcnQnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8ubWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnbWFwJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyO1xuICAgIC8vZnVuY3Rpb24gdG8gY29udmVydCBkYXRhLCBpdCByZXR1cm5zIGZjIHN1cHBvcnRlZCBKU09OXG4gICAgdmFyIERhdGFBZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhYWRhcHRlciA9IHRoaXM7XG5cbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlID0gYXJndW1lbnQuZGF0YXN0b3JlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldEpTT04oKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbiA9IGFyZ3VtZW50LmNvbmZpZztcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2FsbGJhY2sgPSBhcmd1bWVudC5jYWxsYmFjaztcbiAgICAgICAgZGF0YWFkYXB0ZXIuRkNqc29uID0gZGF0YWFkYXB0ZXIuY29udmVydERhdGEoKTtcbiAgICB9LFxuICAgIHByb3RvRGF0YWFkYXB0ZXIgPSBEYXRhQWRhcHRlci5wcm90b3R5cGU7XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmNvbnZlcnREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSxcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhLFxuICAgICAgICAgICAganNvbiA9IHt9LFxuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSB7fSxcbiAgICAgICAgICAgIGpzb25EYXRhID0gZGF0YWFkYXB0ZXIuZGF0YUpTT04sXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGF0YWFkYXB0ZXIuY2FsbGJhY2s7XG5cbiAgICAgICAgICAgIHByZWRlZmluZWRKc29uID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmNvbmZpZztcblxuICAgICAgICBpZiAoanNvbkRhdGEgJiYgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgZ2VuZXJhbERhdGEgPSBkYXRhYWRhcHRlci5nZW5lcmFsRGF0YUZvcm1hdChqc29uRGF0YSwgY29uZmlndXJhdGlvbik7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uLmNhdGVnb3JpZXMgJiYgKGFnZ3JlZ2F0ZWREYXRhID0gZGF0YWFkYXB0ZXIuZ2V0U29ydGVkRGF0YShnZW5lcmFsRGF0YSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcywgY29uZmlndXJhdGlvbi5kaW1lbnNpb24sIGNvbmZpZ3VyYXRpb24uYWdncmVnYXRlTW9kZSkpO1xuICAgICAgICAgICAgZGF0YWFkYXB0ZXIuYWdncmVnYXRlZERhdGEgPSBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIGpzb24gPSBkYXRhYWRhcHRlci5qc29uQ3JlYXRvcihhZ2dyZWdhdGVkRGF0YSwgY29uZmlndXJhdGlvbik7ICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAganNvbiA9IChwcmVkZWZpbmVkSnNvbiAmJiBleHRlbmQyKGpzb24scHJlZGVmaW5lZEpzb24pKSB8fCBqc29uO1xuICAgICAgICByZXR1cm4gKGNhbGxiYWNrICYmIGNhbGxiYWNrKGpzb24pKSB8fCBkYXRhYWRhcHRlci5zZXREZWZhdWx0QXR0cihqc29uKTsgXG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0U29ydGVkRGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYXRlZ29yeUFyciwgZGltZW5zaW9uLCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBpbmRlb3hPZktleSxcbiAgICAgICAgICAgIG5ld0RhdGEgPSBbXSxcbiAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXSxcbiAgICAgICAgICAgIGtleSA9IFtdLFxuICAgICAgICAgICAgY2F0ZWdvcmllcyA9IFtdLFxuICAgICAgICAgICAgbGVuS2V5LFxuICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgIGxlbkNhdCxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGFyciA9IFtdO1xuICAgICAgICAoIUFycmF5LmlzQXJyYXkoZGltZW5zaW9uKSAmJiAoa2V5ID0gW2RpbWVuc2lvbl0pKSB8fCAoa2V5ID0gZGltZW5zaW9uKTtcbiAgICAgICAgKCFBcnJheS5pc0FycmF5KGNhdGVnb3J5QXJyWzBdKSAmJiAoY2F0ZWdvcmllcyA9IFtjYXRlZ29yeUFycl0pKSB8fCAoY2F0ZWdvcmllcyA9IGNhdGVnb3J5QXJyKTtcblxuICAgICAgICBuZXdEYXRhLnB1c2goZGF0YVswXSk7XG4gICAgICAgIGZvcihrID0gMCwgbGVuS2V5ID0ga2V5Lmxlbmd0aDsgayA8IGxlbktleTsgaysrKSB7XG4gICAgICAgICAgICBpbmRlb3hPZktleSA9IGRhdGFbMF0uaW5kZXhPZihrZXlba10pOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IoaSA9IDAsbGVuQ2F0ID0gY2F0ZWdvcmllc1trXS5sZW5ndGg7IGkgPCBsZW5DYXQgICYmIGluZGVveE9mS2V5ICE9PSAtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7ICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIChkYXRhW2pdW2luZGVveE9mS2V5XSA9PSBjYXRlZ29yaWVzW2tdW2ldKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGRhdGFbal0pKTtcbiAgICAgICAgICAgICAgICB9ICAgICBcbiAgICAgICAgICAgICAgICBhcnJbaW5kZW94T2ZLZXldID0gY2F0ZWdvcmllc1trXVtpXTtcbiAgICAgICAgICAgICAgICAoc3ViU2V0RGF0YS5sZW5ndGggPT09IDApICYmIChzdWJTZXREYXRhLnB1c2goYXJyKSk7XG4gICAgICAgICAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZURhdGEoc3ViU2V0RGF0YSwgY2F0ZWdvcmllc1trXVtpXSwgYWdncmVnYXRlTW9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ld0RhdGE7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuc2V0RGVmYXVsdEF0dHIgPSBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICBqc29uLmNoYXJ0IHx8IChqc29uLmNoYXJ0ID0ge30pO1xuICAgICAgICAvL2pzb24uY2hhcnQuYW5pbWF0aW9uID0gMDtcbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0QWdncmVnYXRlRGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBrZXksIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGFnZ3JlZ2F0ZU1ldGhvZCA9IHtcbiAgICAgICAgICAgICdzdW0nIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBkYXRhWzBdO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMSwgbGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoZGF0YVtpXVtqXSAhPSBrZXkpICYmIChhZ2dyZWdhdGVkRGF0YVtqXSA9IE51bWJlcihhZ2dyZWdhdGVkRGF0YVtqXSkgKyBOdW1iZXIoZGF0YVtpXVtqXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnYXZlcmFnZScgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaUFnZ3JlZ2F0ZU10aGQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBsZW5SID0gZGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWRTdW1BcnIgPSBpQWdncmVnYXRlTXRoZC5zdW0oKSxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMCwgbGVuID0gYWdncmVnYXRlZFN1bUFyci5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICgoYWdncmVnYXRlZFN1bUFycltpXSAhPSBrZXkpICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgKGFnZ3JlZ2F0ZWREYXRhW2ldID0gKE51bWJlcihhZ2dyZWdhdGVkU3VtQXJyW2ldKSkgLyBsZW5SKSkgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYWdncmVnYXRlZERhdGFbaV0gPSBhZ2dyZWdhdGVkU3VtQXJyW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSBhZ2dyZWdhdGVNb2RlICYmIGFnZ3JlZ2F0ZU1vZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgYWdncmVnYXRlTW9kZSA9IChhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0gJiYgYWdncmVnYXRlTW9kZSkgfHwgJ3N1bSc7XG5cbiAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSgpO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0ID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGpzb25EYXRhWzBdKSxcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXkgPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgbGVuR2VuZXJhbERhdGFBcnJheSxcbiAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICBpZiAoIWlzQXJyYXkpe1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IFtdO1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXS5wdXNoKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uKTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChjb25maWd1cmF0aW9uLm1lYXN1cmUpO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0ganNvbkRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV0gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5HZW5lcmFsRGF0YUFycmF5ID0gZ2VuZXJhbERhdGFBcnJheVswXS5sZW5ndGg7IGogPCBsZW5HZW5lcmFsRGF0YUFycmF5OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uRGF0YVtpXVtnZW5lcmFsRGF0YUFycmF5WzBdW2pdXTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV1bal0gPSB2YWx1ZSB8fCAnJzsgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGpzb25EYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZW5lcmFsRGF0YUFycmF5O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmpzb25DcmVhdG9yID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGNvbmYgPSBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgc2VyaWVzVHlwZSA9IGNvbmYgJiYgY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Nlcmllc25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3NzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0ganNvbkRhdGFbal1baW5kZXhNYXRjaExhYmVsXTsgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGxhYmVsIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3RzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0gPSB7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgIHJldHVybiBzZXJpZXNbc2VyaWVzVHlwZV0oanNvbkRhdGEsIGNvbmYpO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEZDanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5GQ2pzb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RGF0YUpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YUpTT047XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0QWdncmVnYXRlZERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWdncmVnYXRlZERhdGE7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RGltZW5zaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24uZGltZW5zaW9uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldE1lYXN1cmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbi5tZWFzdXJlO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldExpbWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBtYXggPSAtSW5maW5pdHksXG4gICAgICAgICAgICBtaW4gPSArSW5maW5pdHksXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBkYXRhID0gZGF0YWFkYXB0ZXIuYWdncmVnYXRlZERhdGE7XG4gICAgICAgIGZvcihpID0gMCwgbGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICtkYXRhW2ldW2pdO1xuICAgICAgICAgICAgICAgIHZhbHVlICYmIChtYXggPSBtYXggPCB2YWx1ZSA/IHZhbHVlIDogbWF4KTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWluID0gbWluID4gdmFsdWUgPyB2YWx1ZSA6IG1pbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdtaW4nIDogbWluLFxuICAgICAgICAgICAgJ21heCcgOiBtYXhcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5oaWdobGlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgPSBhcmd1bWVudHNbMF0gJiYgYXJndW1lbnRzWzBdLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjYXRlZ29yeUFyciA9IGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyxcbiAgICAgICAgICAgIGluZGV4ID0gY2F0ZWdvcnlMYWJlbCAmJiBjYXRlZ29yeUFyci5pbmRleE9mKGNhdGVnb3J5TGFiZWwpO1xuICAgICAgICBkYXRhYWRhcHRlci5jaGFydC5kcmF3VHJlbmRSZWdpb24oaW5kZXgpO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5kYXRhYWRhcHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRhQWRhcHRlcihhcmd1bWVudHNbMF0pO1xuICAgIH07XG59KTsiLCIgLyogZ2xvYmFsIEZ1c2lvbkNoYXJ0czogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIENoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fTtcblxuICAgICAgICAgICAgY2hhcnQuZGF0YVN0b3JlSnNvbiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0RGF0YUpzb24oKTtcbiAgICAgICAgICAgIGNoYXJ0LmRpbWVuc2lvbiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0RGltZW5zaW9uKCk7XG4gICAgICAgICAgICBjaGFydC5tZWFzdXJlID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXRNZWFzdXJlKCk7XG4gICAgICAgICAgICBjaGFydC5hZ2dyZWdhdGVkRGF0YSA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0QWdncmVnYXRlZERhdGEoKTtcbiAgICAgICAgICAgIGNoYXJ0LnJlbmRlcihhcmd1bWVudHNbMF0pO1xuICAgICAgICB9LFxuICAgICAgICBjaGFydFByb3RvID0gQ2hhcnQucHJvdG90eXBlLFxuICAgICAgICBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDIsXG4gICAgICAgIGdldFJvd0RhdGEgPSBmdW5jdGlvbihkYXRhLCBhZ2dyZWdhdGVkRGF0YSwgZGltZW5zaW9uLCBtZWFzdXJlLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgICAgICBrLFxuICAgICAgICAgICAgICAgIGtrLFxuICAgICAgICAgICAgICAgIGwsXG4gICAgICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgICAgICBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShkYXRhWzBdKSxcbiAgICAgICAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgICAgICAgIG1hdGNoT2JqID0ge30sXG4gICAgICAgICAgICAgICAgaW5kZXhPZkRpbWVuc2lvbiA9IGFnZ3JlZ2F0ZWREYXRhWzBdLmluZGV4T2YoZGltZW5zaW9uWzBdKTtcbiAgICAgICAgXG4gICAgICAgICAgICBmb3IobGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaXNBcnJheSAmJiAoaW5kZXggPSBkYXRhW2ldLmluZGV4T2Yoa2V5KSk7XG4gICAgICAgICAgICAgICAgaWYoaW5kZXggIT09IC0xICYmIGlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGwgPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGwgPCBsZW5DOyBsKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmpbZGF0YVswXVtsXV0gPSBkYXRhW2ldW2xdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKG1lYXN1cmVbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWdncmVnYXRlZERhdGFba11baW5kZXhPZkRpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW21lYXN1cmVbal1dID0gYWdncmVnYXRlZERhdGFba11baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYoIWlzQXJyYXkgJiYgZGF0YVtpXVtkaW1lbnNpb25bMF1dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaE9iaiA9IGRhdGFbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW4gPSBtZWFzdXJlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFnZ3JlZ2F0ZWREYXRhWzBdLmluZGV4T2YobWVhc3VyZVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBrayA9IGFnZ3JlZ2F0ZWREYXRhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleE9mRGltZW5zaW9uXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmpbbWVhc3VyZVtqXV0gPSBhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaE9iajtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICBjaGFydFByb3RvLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJPYmogPSBhcmd1bWVudC5jb25maWd1cmF0aW9uIHx8IHt9O1xuXG4gICAgICAgIC8vZ2V0IGZjIHN1cHBvcnRlZCBqc29uICAgICAgICAgICAgXG4gICAgICAgIGNoYXJ0LmdldEpTT04oYXJndW1lbnQpOyAgICAgICAgXG4gICAgICAgIC8vcmVuZGVyIEZDIFxuICAgICAgICBjaGFydC5jaGFydE9iaiA9IG5ldyBGdXNpb25DaGFydHMoY2hhcnQuY2hhcnRDb25maWcpO1xuICAgICAgICBjaGFydC5jaGFydE9iai5yZW5kZXIoKTtcblxuICAgICAgICBkYXRhQWRhcHRlck9iai5jaGFydCA9IGNoYXJ0LmNoYXJ0T2JqO1xuICAgICAgICBcbiAgICAgICAgY2hhcnQuY2hhcnRPYmouYWRkRXZlbnRMaXN0ZW5lcignZGF0YXBsb3Ryb2xsb3ZlcicsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICB2YXIgZGF0YU9iaiA9IGdldFJvd0RhdGEoY2hhcnQuZGF0YVN0b3JlSnNvbiwgY2hhcnQuYWdncmVnYXRlZERhdGEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LmRpbWVuc2lvbiwgY2hhcnQubWVhc3VyZSwgZC5jYXRlZ29yeUxhYmVsKTtcbiAgICAgICAgICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLnJhaXNlRXZlbnQoJ2hvdmVyaW4nLCB7XG4gICAgICAgICAgICAgICAgZGF0YSA6IGRhdGFPYmosXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA6IGQuY2F0ZWdvcnlMYWJlbFxuICAgICAgICAgICAgfSwgY2hhcnQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY2hhcnRQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqLFxuICAgICAgICAgICAgY2hhcnRDb25maWcgPSB7fSxcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgPSB7fTtcbiAgICAgICAgLy9wYXJzZSBhcmd1bWVudCBpbnRvIGNoYXJ0Q29uZmlnIFxuICAgICAgICBleHRlbmQyKGNoYXJ0Q29uZmlnLGFyZ3VtZW50KTtcbiAgICAgICAgXG4gICAgICAgIC8vZGF0YUFkYXB0ZXJPYmogXG4gICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgICAgICAvL3N0b3JlIGZjIHN1cHBvcnRlZCBqc29uIHRvIHJlbmRlciBjaGFydHNcbiAgICAgICAgZGF0YVNvdXJjZSA9IGRhdGFBZGFwdGVyT2JqLmdldEZDanNvbigpO1xuXG4gICAgICAgIC8vZGVsZXRlIGRhdGEgY29uZmlndXJhdGlvbiBwYXJ0cyBmb3IgRkMganNvbiBjb252ZXJ0ZXJcbiAgICAgICAgZGVsZXRlIGNoYXJ0Q29uZmlnLmNvbmZpZ3VyYXRpb247XG4gICAgICAgIFxuICAgICAgICAvL3NldCBkYXRhIHNvdXJjZSBpbnRvIGNoYXJ0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgY2hhcnRDb25maWcuZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgICAgIGNoYXJ0LmNoYXJ0Q29uZmlnID0gY2hhcnRDb25maWc7ICAgICAgICBcbiAgICB9O1xuXG4gICAgY2hhcnRQcm90by51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9YXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJPYmogPSBhcmd1bWVudC5jb25maWd1cmF0aW9uIHx8IHt9O1xuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmouY2hhcnRUeXBlKGNoYXJ0LmNoYXJ0Q29uZmlnLnR5cGUpO1xuICAgICAgICBjaGFydC5jaGFydE9iai5zZXRKU09ORGF0YShjaGFydC5jaGFydENvbmZpZy5kYXRhU291cmNlKTtcbiAgICAgICAgZGF0YUFkYXB0ZXJPYmouY2hhcnQgPSBjaGFydC5jaGFydE9iajtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhcnQoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xufSk7IiwiXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgY3JlYXRlQ2hhcnQgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCxcbiAgICAgICAgZG9jdW1lbnQgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4uZG9jdW1lbnQsXG4gICAgICAgIFBYID0gJ3B4JyxcbiAgICAgICAgRElWID0gJ2RpdicsXG4gICAgICAgIEVNUFRZX1NUUklORyA9ICcnLFxuICAgICAgICBBQlNPTFVURSA9ICdhYnNvbHV0ZScsXG4gICAgICAgIE1BWF9QRVJDRU5UID0gJzEwMCUnLFxuICAgICAgICBSRUxBVElWRSA9ICdyZWxhdGl2ZScsXG4gICAgICAgIElEID0gJ2lkJyxcbiAgICAgICAgQk9SREVSX0JPWCA9ICdib3JkZXItYm94JztcblxuICAgIHZhciBDZWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzO1xuICAgICAgICAgICAgY2VsbC5jb250YWluZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGNlbGwuZHJhdygpO1xuICAgICAgICAgICAgY2VsbC5jb25maWcuY2hhcnQgJiYgY2VsbC5yZW5kZXJDaGFydCgpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b0NlbGwgPSBDZWxsLnByb3RvdHlwZTtcblxuICAgIHByb3RvQ2VsbC5kcmF3ID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgY2VsbC5ncmFwaGljcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoRElWKTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuYm94U2l6aW5nID0gQk9SREVSX0JPWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaW5uZXJIVE1MID0gY2VsbC5jb25maWcuaHRtbCB8fCBFTVBUWV9TVFJJTkc7XG4gICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwucmVuZGVyQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpczsgXG5cbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQucmVuZGVyQXQgPSBjZWxsLmNvbmZpZy5pZDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQud2lkdGggPSBNQVhfUEVSQ0VOVDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQuaGVpZ2h0ID0gTUFYX1BFUkNFTlQ7XG4gICAgICBcbiAgICAgICAgaWYoY2VsbC5jaGFydCkge1xuICAgICAgICAgICAgY2VsbC5jaGFydC51cGRhdGUoY2VsbC5jb25maWcuY2hhcnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbC5jaGFydCA9IGNyZWF0ZUNoYXJ0KGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2VsbC5jaGFydDtcbiAgICB9O1xuXG4gICAgcHJvdG9DZWxsLnVwZGF0ZSA9IGZ1bmN0aW9uIChuZXdDb25maWcpIHtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzLFxuICAgICAgICAgICAgaWQgPSBjZWxsLmNvbmZpZy5pZDtcblxuICAgICAgICBpZihuZXdDb25maWcpe1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBuZXdDb25maWc7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5pZCA9IGlkO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnRvcCA9IGNlbGwuY29uZmlnLnRvcCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICAgICAgIWNlbGwuY29uZmlnLmNoYXJ0ICYmIChjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgICAgICAgICAgaWYoY2VsbC5jb25maWcuY2hhcnQpIHtcbiAgICAgICAgICAgICAgICBjZWxsLmNoYXJ0ID0gY2VsbC5yZW5kZXJDaGFydCgpOyAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGwuY2hhcnQ7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9ICBcbiAgICAgICAgcmV0dXJuIGNlbGw7ICAgICAgXG4gICAgfTtcblxuICAgIHZhciBNYXRyaXggPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBtYXRyaXggPSB0aGlzO1xuICAgICAgICAgICAgbWF0cml4LnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAvL21hdHJpeCBjb250YWluZXJcbiAgICAgICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3Rvcik7XG4gICAgICAgICAgICBtYXRyaXguY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdEggPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdFcgPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBbXTtcbiAgICAgICAgICAgIC8vZGlzcG9zZSBtYXRyaXggY29udGV4dFxuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIC8vc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXIgXG4gICAgICAgICAgICBtYXRyaXguc2V0QXR0ckNvbnRhaW5lcigpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGUsXG4gICAgICAgIGNoYXJ0SWQgPSAwO1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4LnNldEF0dHJDb250YWluZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcjsgICAgICAgIFxuICAgICAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBSRUxBVElWRTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0Q29udGFpbmVyUmVzb2x1dGlvbiA9IGZ1bmN0aW9uIChoZWlnaHRBcnIsIHdpZHRoQXJyKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBoZWlnaHQgPSAwLFxuICAgICAgICAgICAgd2lkdGggPSAwLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBoZWlnaHRBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBoZWlnaHRBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHdpZHRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB3aWR0aCArPSB3aWR0aEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBQWDtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyBQWDtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBkcmF3IG1hdHJpeFxuICAgIHByb3RvTWF0cml4LmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhbEJveCA9IFtdO1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXggJiYgbWF0cml4LmNvbmZpZ3VyYXRpb24gfHwge30sXG4gICAgICAgICAgICAvL3N0b3JlIHZpcnR1YWwgbWF0cml4IGZvciB1c2VyIGdpdmVuIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBsZW4gPSBjb25maWdNYW5hZ2VyICYmIGNvbmZpZ01hbmFnZXIubGVuZ3RoLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBbXSxcbiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgY2FsbEJhY2sgPSBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgLy9zdG9yZSBjZWxsIG9iamVjdCBpbiBsb2dpY2FsIG1hdHJpeCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBwbGFjZUhvbGRlcjtcbiAgICAgICAgY2FsbEJhY2sgJiYgY2FsbEJhY2soKTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBtYW5hZ2UgbWF0cml4IGRyYXdcbiAgICBwcm90b01hdHJpeC5kcmF3TWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIC8vc3RvcmUgbWFwcGluZyBtYXRyaXggYmFzZWQgb24gdGhlIHVzZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgc2hhZG93TWF0cml4ID0gbWF0cml4Lm1hdHJpeE1hbmFnZXIoY29uZmlndXJhdGlvbiksICAgICAgICAgICAgXG4gICAgICAgICAgICBoZWlnaHRBcnIgPSBtYXRyaXguZ2V0Um93SGVpZ2h0KHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICB3aWR0aEFyciA9IG1hdHJpeC5nZXRDb2xXaWR0aChzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnIgPSBbXSxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICBtYXRyaXhQb3NYID0gbWF0cml4LmdldFBvcyh3aWR0aEFyciksXG4gICAgICAgICAgICBtYXRyaXhQb3NZID0gbWF0cml4LmdldFBvcyhoZWlnaHRBcnIpLFxuICAgICAgICAgICAgcm93c3BhbixcbiAgICAgICAgICAgIGNvbHNwYW4sXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGNoYXJ0LFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIGNvbDtcbiAgICAgICAgLy9jYWxjdWxhdGUgYW5kIHNldCBwbGFjZWhvbGRlciBpbiBzaGFkb3cgbWF0cml4XG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXguc2V0UGxjSGxkcihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICAgICAgbWF0cml4LnNldENvbnRhaW5lclJlc29sdXRpb24oaGVpZ2h0QXJyLCB3aWR0aEFycik7XG4gICAgICAgIC8vY2FsY3VsYXRlIGNlbGwgcG9zaXRpb24gYW5kIGhlaWh0IGFuZCBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICBcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldID0gW107ICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuIHx8IDEpO1xuICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbiB8fCAxKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2hhcnQ7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5odG1sO1xuICAgICAgICAgICAgICAgIHJvdyA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0ucm93KTtcbiAgICAgICAgICAgICAgICBjb2wgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLmNvbCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG1hdHJpeFBvc1hbY29sXTtcbiAgICAgICAgICAgICAgICB0b3AgPSBtYXRyaXhQb3NZW3Jvd107XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYW2NvbCArIGNvbHNwYW5dIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXRyaXhQb3NZW3JvdyArIHJvd3NwYW5dIC0gdG9wO1xuICAgICAgICAgICAgICAgIGlkID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5pZCkgfHwgbWF0cml4LmlkQ3JlYXRvcihyb3csY29sKTtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICA6IGxlZnQsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgICA6IGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICAgIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgICAgIDogaWQsXG4gICAgICAgICAgICAgICAgICAgIHJvd3NwYW4gICA6IHJvd3NwYW4sXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gICA6IGNvbHNwYW4sXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgICAgICA6IGh0bWwsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0ICAgICA6IGNoYXJ0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhd01hbmFnZXJPYmpBcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmlkQ3JlYXRvciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNoYXJ0SWQrKzsgICAgICAgXG4gICAgICAgIHJldHVybiBJRCArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFBvcyA9ICBmdW5jdGlvbihzcmMpe1xuICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHNyYyAmJiBzcmMubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPD0gbGVuOyBpKyspe1xuICAgICAgICAgICAgYXJyLnB1c2goaSA/IChzcmNbaS0xXSthcnJbaS0xXSkgOiAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnNldFBsY0hsZHIgPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pe1xuICAgICAgICB2YXIgcm93LFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQztcblxuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBzaGFkb3dNYXRyaXgubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXsgXG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICByb3cgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgICAgICBjb2wgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVsxXTtcblxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9PT0gdW5kZWZpbmVkID8gaSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3c7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID09PSB1bmRlZmluZWQgPyBqIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Um93SGVpZ2h0ID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgaGVpZ2h0ID0gW10sXG4gICAgICAgICAgICBjdXJySGVpZ2h0LFxuICAgICAgICAgICAgbWF4SGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykge1xuICAgICAgICAgICAgZm9yKGogPSAwLCBtYXhIZWlnaHQgPSAwLCBsZW5Db2wgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQ29sOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihzaGFkb3dNYXRyaXhbaV1bal0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyckhlaWdodCA9IHNoYWRvd01hdHJpeFtpXVtqXS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCA8IGN1cnJIZWlnaHQgPyBjdXJySGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhlaWdodFtpXSA9IG1heEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldENvbFdpZHRoID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICB3aWR0aCA9IFtdLFxuICAgICAgICAgICAgY3VycldpZHRoLFxuICAgICAgICAgICAgbWF4V2lkdGg7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtqXS5sZW5ndGg7IGkgPCBsZW5Db2w7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heFdpZHRoID0gMDsgaiA8IGxlblJvdzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYWRvd01hdHJpeFtqXVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBzaGFkb3dNYXRyaXhbal1baV0ud2lkdGg7ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSBtYXhXaWR0aCA8IGN1cnJXaWR0aCA/IGN1cnJXaWR0aCA6IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpZHRoW2ldID0gbWF4V2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Lm1hdHJpeE1hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIHJvd1NwYW4sXG4gICAgICAgICAgICBjb2xTcGFuLFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBkZWZhdWx0SCA9IG1hdHJpeC5kZWZhdWx0SCxcbiAgICAgICAgICAgIGRlZmF1bHRXID0gbWF0cml4LmRlZmF1bHRXLFxuICAgICAgICAgICAgb2Zmc2V0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByb3dTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuKSB8fCAxO1xuICAgICAgICAgICAgICAgIGNvbFNwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNvbHNwYW4pIHx8IDE7ICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2lkdGggPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLndpZHRoKTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICh3aWR0aCAmJiAod2lkdGggLyBjb2xTcGFuKSkgfHwgZGVmYXVsdFc7XG4gICAgICAgICAgICAgICAgd2lkdGggPSArd2lkdGgudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGhlaWdodCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoaGVpZ2h0ICYmIChoZWlnaHQgLyByb3dTcGFuKSkgfHwgZGVmYXVsdEg7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICtoZWlnaHQudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIG9mZnNldCA9IDA7IGsgPCByb3dTcGFuOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsID0gMDsgbCA8IGNvbFNwYW47IGwrKykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdID0gc2hhZG93TWF0cml4W2kgKyBrXSA/IHNoYWRvd01hdHJpeFtpICsga10gOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IGogKyBsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZShzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkIDogKGkgKyAnLScgKyBqKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaGFkb3dNYXRyaXg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldEJsb2NrICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SID0gcGxhY2VIb2xkZXIubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQztcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwbGFjZUhvbGRlcltpXVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuICAgICAgICAgICAgbGVuQ29uZmlnUixcbiAgICAgICAgICAgIGxlbkNvbmZpZ0MsXG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJSLFxuICAgICAgICAgICAgbGVuUGxhY2VIbGRyQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsICAgICAgICAgICAgXG4gICAgICAgICAgICByZWN5Y2xlZENlbGw7XG5cbiAgICAgICAgd2hpbGUoY29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNvbnRhaW5lci5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5QbGFjZUhsZHJSID0gcGxhY2VIb2xkZXIubGVuZ3RoOyBpIDwgbGVuUGxhY2VIbGRyUjsgaSsrKSB7XG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJDID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGogPSBsZW5QbGFjZUhsZHJDIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpZihwbGFjZUhvbGRlcltpXVtqXS5jaGFydCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBtYXRyaXguZGlzcG9zYWxCb3guY29uY2F0KHBsYWNlSG9sZGVyW2ldLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGxhY2VIb2xkZXJbaV1bal07XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuQ29uZmlnUiA9IGNvbmZpZ01hbmFnZXIubGVuZ3RoOyBpIDwgbGVuQ29uZmlnUjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5Db25maWdDID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5Db25maWdDOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihjb25maWdNYW5hZ2VyW2ldW2pdLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY3ljbGVkQ2VsbCA9IG1hdHJpeC5kaXNwb3NhbEJveC5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVjeWNsZWRDZWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAgICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbi8vICAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4vLyAgICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuLy8gICAgICAgICAgICAgbGVuID0gY29uZmlnTWFuYWdlciAmJiBjb25maWdNYW5hZ2VyLmxlbmd0aCxcbi8vICAgICAgICAgICAgIGxlbkMsXG4vLyAgICAgICAgICAgICBsZW5QbGNIbGRyLFxuLy8gICAgICAgICAgICAgaSxcbi8vICAgICAgICAgICAgIGosXG4vLyAgICAgICAgICAgICBrLFxuLy8gICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuLy8gICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuLy8gICAgICAgICAgICAgZGlzcG9zYWxCb3hDaGFydCA9IG1hdHJpeC5kaXNwb3NhbEJveENoYXJ0ID0gW10sXG4vLyAgICAgICAgICAgICBkaXNwb3NhbEJveEdlbiA9IG1hdHJpeC5kaXNwb3NhbEJveEdlbiA9IFtdLFxuLy8gICAgICAgICAgICAgcmVjeWNsZWRDZWxsLFxuLy8gICAgICAgICAgICAgbm9kZSA9IHBhcmVudENvbnRhaW5lcjtcblxuLy8gICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbi8vICAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgbGVuUGxjSGxkciA9IHBsYWNlSG9sZGVyLmxlbmd0aDtcbi8vICAgICAgICAgZm9yIChrID0gMDsgayA8IGxlblBsY0hsZHI7IGsrKykge1xuLy8gICAgICAgICAgICAgbGVuQyA9IHBsYWNlSG9sZGVyW2tdLmxlbmd0aDtcbi8vICAgICAgICAgICAgIGZvcihqID0gbGVuQyAtIDE7IGogPj0gMCA7IGotLSkge1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2tdW2pdLmNoYXJ0ICYmIChkaXNwb3NhbEJveENoYXJ0ID0gZGlzcG9zYWxCb3hDaGFydC5jb25jYXQocGxhY2VIb2xkZXJba10ucG9wKCkpKTtcbi8vICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltrXVtqXSAmJiAocGxhY2VIb2xkZXJba11bal0uY2hhcnQgfHwgKGRpc3Bvc2FsQm94R2VuID0gXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWxCb3hHZW4uY29uY2F0KHBsYWNlSG9sZGVyW2tdLnBvcCgpKSkpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9ICAgICAgICBcbi8vICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHsgICAgXG4vLyAvKiAgICAgICAgICAgIGlmKCFwbGFjZUhvbGRlcltpXSkge1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4vLyAgICAgICAgICAgICB9Ki9cbi8vICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4vLyAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4vLyAgICAgICAgICAgICAgICAgaWYocGxhY2VIb2xkZXJbaV1bal0pIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0udXBkYXRlKGNvbmZpZ01hbmFnZXJbaV1bal0pO1xuLy8gICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQocGxhY2VIb2xkZXJbaV1bal0uZ3JhcGhpY3MpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAgICBcbi8vICAgICAgICAgICAgICAgICAgICAgY29uZmlnTWFuYWdlcltpXVtqXS5jaGFydCAmJiAocmVjeWNsZWRDZWxsID0gZGlzcG9zYWxCb3hDaGFydC5wb3AoKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ01hbmFnZXJbaV1bal0uY2hhcnQgfHwgKHJlY3ljbGVkQ2VsbCA9IGRpc3Bvc2FsQm94R2VuLnBvcCgpKVxuLy8gICAgICAgICAgICAgICAgICAgICBpZihyZWN5Y2xlZENlbGwpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coMTEsJ3VwZGF0ZScsY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQocGxhY2VIb2xkZXJbaV1bal0uZ3JhcGhpY3MpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coMjIsJ25ldycsY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbi8vICAgICAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIC8qfSovXG4vLyAgICAgICAgICAgICB9XG5cbi8vIC8qICAgICAgICAgICAgbGVuUGxjSGxkciA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDtcbi8vICAgICAgICAgICAgIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDtcblxuLy8gICAgICAgICAgICAgZm9yIChrID0gbGVuUGxjSGxkciAtIDE7IGsgPj0gbGVuQzsgay0tKSB7XG4vLyAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1ba10uY2hhcnQgJiYgKGRpc3Bvc2FsQm94Q2hhcnQgPSBkaXNwb3NhbEJveENoYXJ0LmNvbmNhdChwbGFjZUhvbGRlcltpXS5wb3AoKSkpO1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2tdICYmIChwbGFjZUhvbGRlcltpXVtrXS5jaGFydCB8fCAoZGlzcG9zYWxCb3hHZW4gPSBcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhbEJveEdlbi5jb25jYXQocGxhY2VIb2xkZXJbaV0ucG9wKCkpKSk7XG4vLyAgICAgICAgICAgICB9Ki9cbi8vICAgICAgICAgfVxuLy8gLyogICAgICAgIGZvcihpID0gMCwgbGVuID0gZGlzcG9zYWxCb3gubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbi8vICAgICAgICAgICAgIGlmKGRpc3Bvc2FsQm94W2ldICE9PSB1bmRlZmluZWQpIHtcbi8vICAgICAgICAgICAgICAgICBkaXNwb3NhbEJveFtpXS5jaGFydCAmJiBkaXNwb3NhbEJveFtpXS5jaGFydC5jaGFydE9iai5kaXNwb3NlKCk7XG4vLyAgICAgICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyLnJlbW92ZUNoaWxkKGRpc3Bvc2FsQm94W2ldICYmIGRpc3Bvc2FsQm94W2ldLmdyYXBoaWNzKTtcbi8vICAgICAgICAgICAgICAgICBkZWxldGUgZGlzcG9zYWxCb3hbaV07XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBkZWxldGUgZGlzcG9zYWxCb3hbaV07XG4vLyAgICAgICAgIH0qLyAgIFxuLy8gICAgIH07XG5cblxuXG4gICAgcHJvdG9NYXRyaXguZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBub2RlICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgbGVuUjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gcGxhY2VIb2xkZXIgJiYgcGxhY2VIb2xkZXIubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0gJiYgcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQgJiYgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmogJiYgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSAnMHB4JztcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhcmd1bWVudHNbMF0sYXJndW1lbnRzWzFdKTtcbiAgICB9O1xufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcbiAgICBcbiAgICAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG4gICAgdmFyIGdsb2JhbCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBnbG9iYWwud2luLFxuXG4gICAgICAgIG9iamVjdFByb3RvVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBhcnJheVRvU3RyaW5nSWRlbnRpZmllciA9IG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChbXSksXG4gICAgICAgIGlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKG9iaikgPT09IGFycmF5VG9TdHJpbmdJZGVudGlmaWVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEEgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGFic3RyYWN0aW9uIGxheWVyIHNvIHRoYXQgdGhlIHRyeS1jYXRjaCAvXG4gICAgICAgIC8vIGVycm9yIHN1cHByZXNzaW9uIG9mIGZsYXNoIGNhbiBiZSBhdm9pZGVkIHdoaWxlIHJhaXNpbmcgZXZlbnRzLlxuICAgICAgICBtYW5hZ2VkRm5DYWxsID0gZnVuY3Rpb24gKGl0ZW0sIHNjb3BlLCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gV2UgY2hhbmdlIHRoZSBzY29wZSBvZiB0aGUgZnVuY3Rpb24gd2l0aCByZXNwZWN0IHRvIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IHRoYXQgcmFpc2VkIHRoZSBldmVudC5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXRlbVswXS5jYWxsKHNjb3BlLCBldmVudCwgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgYWxsIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBpbnZva2VkIHVwb24gdHJpZ2dlclxuICAgICAgICAvLyBvZiBhbiBldmVudC5cbiAgICAgICAgc2xvdExvYWRlciA9IGZ1bmN0aW9uIChzbG90LCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlcy5cbiAgICAgICAgICAgIHZhciBpID0gMCwgc2NvcGU7XG5cbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgbG9vayBmb3IgbWF0Y2ggd2l0aCByZXNwZWN0IHRvXG4gICAgICAgICAgICAvLyB0eXBlIGFuZCBiaW5kaW5nLlxuICAgICAgICAgICAgZm9yICg7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoIGZvdW5kIHcuci50LiB0eXBlIGFuZCBiaW5kLCB3ZSBmaXJlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgfHwgc2xvdFtpXVsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBzZW5kZXIgb2YgdGhlIGV2ZW50IGZvciBnbG9iYWwgZXZlbnRzLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlIG9mIHNjb3BlIGRpZmZlcmVzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xvYmFsIG9yIGEgbG9jYWwgZXZlbnQgaXMgYmVpbmcgcmFpc2VkLlxuICAgICAgICAgICAgICAgICAgICBzY29wZSA9IHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciA/XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zZW5kZXIgOiBnbG9iYWw7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEZuQ2FsbChzbG90W2ldLCBzY29wZSwgZXZlbnQsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIHdhbnRlZCB0byBkZXRhY2ggdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kZXRhY2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kZXRhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBwcm9wYWdhdGlvbiBmbGFnIGlzIHNldCB0byBmYWxzZSBhbmQgZGlzY29udG51ZVxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpZiBuZWVkZWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNhbmNlbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXZlbnRNYXAgPSB7XG4gICAgICAgICAgICBob3ZlcmluIDogJ2RhdGFwbG90cm9sbG92ZXInLFxuICAgICAgICAgICAgaG92ZXJvdXQgOiAnZGF0YXBsb3Ryb2xsb3V0JyxcbiAgICAgICAgICAgIGNsaWsgOiAnZGF0YXBsb3RjbGljaydcbiAgICAgICAgfSxcbiAgICAgICAgcmFpc2VFdmVudCxcblxuICAgICAgICBFdmVudFRhcmdldCA9IHtcblxuICAgICAgICAgICAgdW5wcm9wYWdhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmNhbmNlbGxlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXRhY2hlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kZXRhY2hlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRlZmF1bHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5wcmV2ZW50ZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpcmUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMuXG4gICAgICAgICAgICBsaXN0ZW5lcnM6IHt9LFxuXG4gICAgICAgICAgICAvLyBUaGUgbGFzdCByYWlzZWQgZXZlbnQgaWQuIEFsbG93cyB0byBjYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgaWQuXG4gICAgICAgICAgICBsYXN0RXZlbnRJZDogMCxcblxuICAgICAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlY3Vyc2VSZXR1cm4sXG4gICAgICAgICAgICAgICAgICAgIEZDRXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpO1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuLnB1c2goRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZVJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSBhZGRlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBoYXMgbm90IGJlZW4gcHJvdmlkZWQgd2hpbGUgYWRkaW5nIGFuIGV2ZW50IGxpc3RlbmVyLiBFbnN1cmUgdGhhdCB5b3UgcGFzcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIGBzdHJpbmdgIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgb2Yge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NDlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NDknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEl0IHdpbGwgbm90IGV2YWwgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTUwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTUwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zZXJ0aW9uIHBvc2l0aW9uIGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgdGhlbiBjcmVhdGUgb25lLlxuICAgICAgICAgICAgICAgIGlmICghKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ucHVzaChbbGlzdGVuZXIsIGJpbmRdKTtcblxuICAgICAgICAgICAgICAgIC8vIEV2ZW50cyBvZiBmdXNpb25DaGFydCByYWlzZWQgdmlhIE11bHRpQ2hhcnRpbmcuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xufSk7Il19

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
				parentData = (outputDataStorage[id] && outputDataStorage[id].data) || dataStorage[id],
				filterStore = lib.filterStore,
				len,
				linkIds,
				filters,
				linkId,
				filter,
				filterFn,
				type,
				outSpecs,
				dataStore,
				processor,
				// Store all the dataObjs that are updated.
				tempDataUpdated = lib.tempDataUpdated = {};

			linkIds = linkData.link;
			filters = linkData.filter;
			len = linkIds.length;

			for (i = 0; i < len; i++) {
				dataStore = linkIds[i];
				linkId = dataStore.id;

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

					// Modifying data of self applied processor.
					if (outSpecs =  outputDataStorage[linkId]) {
						processor = outSpecs.processor;
						outputDataStorage[linkId] = executeProcessor(processor.type, processor.getProcessor(),
							dataStorage[linkId]);
					}
					delete dataStore.keys;
					dataStore.uniqueValues = {};
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
				link = links[i].id;
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
		return ((outputDataStorage[id] && outputDataStorage[id].data) || dataStorage[id]);
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
					linkData.link.push(newDataObj);
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
				link[i].deleteData();
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
			data = dataStore.getJSON(),
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
			data = dataStore.getJSON(),
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
			output = outputDataStorage[dataStore.id] = {
				data : executeProcessor(type, processorFn, JSONData),
				processor : dataProcessor
			};

			delete dataStore.keys;
			dataStore.uniqueValues = {};

			if (linkStore[id]) {
				updataData(id);
			}

			multiChartingProto.raiseEvent('tempEvent', {
				'dataStore': dataStore,
				'dataProcessor' : dataProcessor
			}, dataStore);

			return output.data;
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

    var extend2 = MultiCharting.prototype.lib.extend2,
        NULL = null,
        UNDEFINED = undefined;
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
        json = (callback && callback(json)) || json;
        return dataadapter.setDefaultAttr(json);
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
        var dataadapter = this,
            keyExcludedJsonStr = '',
            paletteColors = [],
            i,
            dataStore = dataadapter.dataStore,
            len,
            measure = dataadapter.configuration && dataadapter.configuration.measure,
            metaData = dataStore && dataStore.getMetaData(),
            metaDataMeasure;

        json.chart || (json.chart = {});
        
        keyExcludedJsonStr = (metaData && JSON.stringify(json, function(k,v){
            if(k == 'color') {
                return NULL;
            }
            return v;
        })) || UNDEFINED;

        json = (keyExcludedJsonStr && JSON.parse(keyExcludedJsonStr)) || json;

        for(i = 0, len = measure.length; i < len && metaData; i++) {
            metaDataMeasure = metaData[measure[i]] && metaData[measure[i]];
            paletteColors[i] = (metaDataMeasure['color'] instanceof Function) ? metaDataMeasure['color']() 
                                                            : metaDataMeasure['color'];
        }

        json.chart['paletteColors'] = paletteColors;
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
            value,
            dimension = configuration.dimension || [],
            measure = configuration.measure || [];
        if (!isArray){
            generalDataArray[0] = [];
            generalDataArray[0].push(dimension);
            generalDataArray[0] = generalDataArray[0][0].concat(measure);
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

        lenPlaceHldrR = placeHolder.length;

        for(i = lenPlaceHldrR - 1; i >= 0; i--) {
            lenPlaceHldrC = placeHolder[i].length;
            for(j = lenPlaceHldrC - 1; j >= 0; j--) {
                if(placeHolder[i][j].chart) {
                    matrix.disposalBox = matrix.disposalBox.concat(placeHolder[i].pop());
                } else {
                    delete placeHolder[i][j];
                    placeHolder[i].pop();
                }
            }
            placeHolder.pop();
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
                } else {
                    placeHolder[i][j] = new Cell(configManager[i][j], container);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDemdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNdWx0aUNoYXJ0aW5nIEV4dGVuc2lvbiBmb3IgRnVzaW9uQ2hhcnRzXG4gKiBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgYmFzaWMgcm91dGluZXMgcmVxdWlyZWQgYnkgc3Vic2VxdWVudCBtb2R1bGVzIHRvXG4gKiBleHRlbmQvc2NhbGUgb3IgYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIE11bHRpQ2hhcnRpbmcgb2JqZWN0LlxuICpcbiAqL1xuXG4gLyogZ2xvYmFsIHdpbmRvdzogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGVudiwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGVudi5kb2N1bWVudCA/XG4gICAgICAgICAgICBmYWN0b3J5KGVudikgOiBmdW5jdGlvbih3aW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpbi5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KHdpbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5NdWx0aUNoYXJ0aW5nID0gZmFjdG9yeShlbnYsIHRydWUpO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKF93aW5kb3csIHdpbmRvd0V4aXN0cykge1xuICAgIC8vIEluIGNhc2UgTXVsdGlDaGFydGluZyBhbHJlYWR5IGV4aXN0cy5cbiAgICBpZiAoX3dpbmRvdy5NdWx0aUNoYXJ0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgTXVsdGlDaGFydGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luID0gX3dpbmRvdztcblxuICAgIGlmICh3aW5kb3dFeGlzdHMpIHtcbiAgICAgICAgX3dpbmRvdy5NdWx0aUNoYXJ0aW5nID0gTXVsdGlDaGFydGluZztcbiAgICB9XG4gICAgcmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZW5kMiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYpIHtcbiAgICAgICAgICAgIHZhciBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcbiAgICAgICAgICAgIC8vaWYgbm9uZSBvZiB0aGUgYXJndW1lbnRzIGFyZSBvYmplY3QgdGhlbiByZXR1cm4gYmFja1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcgJiYgdHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORyB8fCBvYmoyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgb2JqMSA9IG9iajIgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZShvYmoxLCBvYmoyLCBza2lwVW5kZWYpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGxpYiA9IHtcbiAgICAgICAgICAgIGV4dGVuZDI6IGV4dGVuZDIsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2VcbiAgICAgICAgfTtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgPSAoTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliIHx8IGxpYik7XG5cbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIEFqYXggPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgYWpheCA9IHRoaXMsXG5cdFx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdO1xuXG5cdFx0ICAgIGFqYXgub25TdWNjZXNzID0gYXJndW1lbnQuc3VjY2Vzcztcblx0XHQgICAgYWpheC5vbkVycm9yID0gYXJndW1lbnQuZXJyb3I7XG5cdFx0ICAgIGFqYXgub3BlbiA9IGZhbHNlO1xuXHRcdCAgICByZXR1cm4gYWpheC5nZXQoYXJndW1lbnQudXJsKTtcblx0XHR9LFxuXG4gICAgICAgIGFqYXhQcm90byA9IEFqYXgucHJvdG90eXBlLFxuXG4gICAgICAgIEZVTkNUSU9OID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgTVNYTUxIVFRQID0gJ01pY3Jvc29mdC5YTUxIVFRQJyxcbiAgICAgICAgTVNYTUxIVFRQMiA9ICdNc3htbDIuWE1MSFRUUCcsXG4gICAgICAgIEdFVCA9ICdHRVQnLFxuICAgICAgICBYSFJFUUVSUk9SID0gJ1htbEh0dHByZXF1ZXN0IEVycm9yJyxcbiAgICAgICAgd2luID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luLCAvLyBrZWVwIGEgbG9jYWwgcmVmZXJlbmNlIG9mIHdpbmRvdyBzY29wZVxuXG4gICAgICAgIC8vIFByb2JlIElFIHZlcnNpb25cbiAgICAgICAgdmVyc2lvbiA9IHBhcnNlRmxvYXQod2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLnNwbGl0KCdNU0lFJylbMV0pLFxuICAgICAgICBpZWx0OCA9ICh2ZXJzaW9uID49IDUuNSAmJiB2ZXJzaW9uIDw9IDcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBmaXJlZm94ID0gL21vemlsbGEvaS50ZXN0KHdpbi5uYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZsYWdzLlxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBwYWdlIGlzIG9uIGZpbGUgcHJvdG9jb2wuXG4gICAgICAgIGZpbGVQcm90b2NvbCA9IHdpbi5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyxcbiAgICAgICAgQVhPYmplY3QgPSB3aW4uQWN0aXZlWE9iamVjdCxcblxuICAgICAgICAvLyBDaGVjayBpZiBuYXRpdmUgeGhyIGlzIHByZXNlbnRcbiAgICAgICAgWEhSTmF0aXZlID0gKCFBWE9iamVjdCB8fCAhZmlsZVByb3RvY29sKSAmJiB3aW4uWE1MSHR0cFJlcXVlc3QsXG5cbiAgICAgICAgLy8gUHJlcGFyZSBmdW5jdGlvbiB0byByZXRyaWV2ZSBjb21wYXRpYmxlIHhtbGh0dHByZXF1ZXN0LlxuICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4bWxodHRwO1xuXG4gICAgICAgICAgICAvLyBpZiB4bWxodHRwcmVxdWVzdCBpcyBwcmVzZW50IGFzIG5hdGl2ZSwgdXNlIGl0LlxuICAgICAgICAgICAgaWYgKFhIUk5hdGl2ZSkge1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhIUk5hdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBhY3RpdmVYIGZvciBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICAgICAgfSxcblxuICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBQcmV2ZW50cyBjYWNoZWluZyBvZiBBSkFYIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0lmLU1vZGlmaWVkLVNpbmNlJzogJ1NhdCwgMjkgT2N0IDE5OTQgMTk6NDM6MzEgR01UJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyB0aGUgc2VydmVyIGtub3cgdGhhdCB0aGlzIGlzIGFuIEFKQVggcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyBzZXJ2ZXIga25vdyB3aGljaCB3ZWIgYXBwbGljYXRpb24gaXMgc2VuZGluZyByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1CeSc6ICdGdXNpb25DaGFydHMnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZW50aW9ucyBjb250ZW50LXR5cGVzIHRoYXQgYXJlIGFjY2VwdGFibGUgZm9yIHRoZSByZXNwb25zZS4gU29tZSBzZXJ2ZXJzIHJlcXVpcmUgdGhpcyBmb3IgQWpheFxuICAgICAgICAgICAgICogY29tbXVuaWNhdGlvbi5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9wbGFpbiwgKi8qJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIE1JTUUgdHlwZSBvZiB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdCBhbG9uZyB3aXRoIGl0cyBjaGFyc2V0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnXG4gICAgICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5hamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFqYXgoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmdldCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IHdyYXBwZXIueG1saHR0cCxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sgPSB3cmFwcGVyLm9uRXJyb3IsXG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgPSB3cmFwcGVyLm9uU3VjY2VzcyxcbiAgICAgICAgICAgIHhSZXF1ZXN0ZWRCeSA9ICdYLVJlcXVlc3RlZC1CeScsXG4gICAgICAgICAgICBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICAgICAgaTtcblxuICAgICAgICAvLyBYLVJlcXVlc3RlZC1CeSBpcyByZW1vdmVkIGZyb20gaGVhZGVyIGR1cmluZyBjcm9zcyBkb21haW4gYWpheCBjYWxsXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9eKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykvKSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaG9zdG5hbWUgIT09IC8oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKShbXlxcL1xcOl0qKS8uZXhlYyh1cmwpWzJdKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gaHR0cCBvciBodHRwcywgdGhlbiBpdHMgYSBzYW1lIGRvbWFpbiBjYWxsLiBObyBuZWVkIHRvIHVzZSByZWdleCB0byBnZXRcbiAgICAgICAgICAgIC8vIGRvbWFpbi4gSWYgaXQgY29udGFpbnMgdGhlbiBjaGVja3MgZG9tYWluLlxuICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbeFJlcXVlc3RlZEJ5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICFoYXNPd24uY2FsbChoZWFkZXJzLCB4UmVxdWVzdGVkQnkpICYmIChoZWFkZXJzW3hSZXF1ZXN0ZWRCeV0gPSAnRnVzaW9uQ2hhcnRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXhtbGh0dHAgfHwgaWVsdDggfHwgZmlyZWZveCkge1xuICAgICAgICAgICAgeG1saHR0cCA9IG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB3cmFwcGVyLnhtbGh0dHAgPSB4bWxodHRwO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzIDwgMzAwKSB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMzA0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA9PT0gMTIyMyB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh4bWxodHRwLnJlc3BvbnNlVGV4dCwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKG5ldyBFcnJvcihYSFJFUUVSUk9SKSwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhtbGh0dHAub3BlbihHRVQsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICh4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoaSwgaGVhZGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHhtbGh0dHAuc2VuZCgpO1xuICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gaW5zdGFuY2UueG1saHR0cDtcblxuICAgICAgICBpbnN0YW5jZS5vcGVuID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB4bWxodHRwICYmIHR5cGVvZiB4bWxodHRwLmFib3J0ID09PSBGVU5DVElPTiAmJiB4bWxodHRwLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgICAgICB4bWxodHRwLnJlYWR5U3RhdGUgIT09IDAgJiYgeG1saHR0cC5hYm9ydCgpO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2Uub3BlbiAmJiBpbnN0YW5jZS5hYm9ydCgpO1xuXG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vbkVycm9yO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25TdWNjZXNzO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2UueG1saHR0cDtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9wZW47XG5cbiAgICAgICAgcmV0dXJuIChpbnN0YW5jZSA9IG51bGwpO1xuICAgIH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgLy8gU291cmNlOiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzE1MDQtQXNrLUJlbi1QYXJzaW5nLUNTVi1TdHJpbmdzLVdpdGgtSmF2YXNjcmlwdC1FeGVjLVJlZ3VsYXItRXhwcmVzc2lvbi1Db21tYW5kLmh0bVxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cblxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgZnVuY3Rpb24gQ1NWVG9BcnJheSAoc3RyRGF0YSwgc3RyRGVsaW1pdGVyKSB7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZGVsaW1pdGVyIGlzIGRlZmluZWQuIElmIG5vdCxcbiAgICAgICAgLy8gdGhlbiBkZWZhdWx0IHRvIGNvbW1hLlxuICAgICAgICBzdHJEZWxpbWl0ZXIgPSAoc3RyRGVsaW1pdGVyIHx8IFwiLFwiKTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcmVndWxhciBleHByZXNzaW9uIHRvIHBhcnNlIHRoZSBDU1YgdmFsdWVzLlxuICAgICAgICB2YXIgb2JqUGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgLy8gRGVsaW1pdGVycy5cbiAgICAgICAgICAgICAgICBcIihcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcInxcXFxccj9cXFxcbnxcXFxccnxeKVwiICtcbiAgICAgICAgICAgICAgICAvLyBRdW90ZWQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKD86XFxcIihbXlxcXCJdKig/OlxcXCJcXFwiW15cXFwiXSopKilcXFwifFwiICtcbiAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoW15cXFwiXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJcXFxcclxcXFxuXSopKVwiXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJnaVwiXG4gICAgICAgICAgICApO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgZGF0YS4gR2l2ZSB0aGUgYXJyYXlcbiAgICAgICAgLy8gYSBkZWZhdWx0IGVtcHR5IGZpcnN0IHJvdy5cbiAgICAgICAgdmFyIGFyckRhdGEgPSBbW11dO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgaW5kaXZpZHVhbCBwYXR0ZXJuXG4gICAgICAgIC8vIG1hdGNoaW5nIGdyb3Vwcy5cbiAgICAgICAgdmFyIGFyck1hdGNoZXMgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGxvb3Bpbmcgb3ZlciB0aGUgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXNcbiAgICAgICAgLy8gdW50aWwgd2UgY2FuIG5vIGxvbmdlciBmaW5kIGEgbWF0Y2guXG4gICAgICAgIHdoaWxlIChhcnJNYXRjaGVzID0gb2JqUGF0dGVybi5leGVjKCBzdHJEYXRhICkpe1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBkZWxpbWl0ZXIgdGhhdCB3YXMgZm91bmQuXG4gICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZERlbGltaXRlciA9IGFyck1hdGNoZXNbIDEgXTtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZ2l2ZW4gZGVsaW1pdGVyIGhhcyBhIGxlbmd0aFxuICAgICAgICAgICAgLy8gKGlzIG5vdCB0aGUgc3RhcnQgb2Ygc3RyaW5nKSBhbmQgaWYgaXQgbWF0Y2hlc1xuICAgICAgICAgICAgLy8gZmllbGQgZGVsaW1pdGVyLiBJZiBpZCBkb2VzIG5vdCwgdGhlbiB3ZSBrbm93XG4gICAgICAgICAgICAvLyB0aGF0IHRoaXMgZGVsaW1pdGVyIGlzIGEgcm93IGRlbGltaXRlci5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBzdHJNYXRjaGVkRGVsaW1pdGVyLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIChzdHJNYXRjaGVkRGVsaW1pdGVyICE9IHN0ckRlbGltaXRlcilcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIGhhdmUgcmVhY2hlZCBhIG5ldyByb3cgb2YgZGF0YSxcbiAgICAgICAgICAgICAgICAvLyBhZGQgYW4gZW1wdHkgcm93IHRvIG91ciBkYXRhIGFycmF5LlxuICAgICAgICAgICAgICAgIGFyckRhdGEucHVzaCggW10gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIGRlbGltaXRlciBvdXQgb2YgdGhlIHdheSxcbiAgICAgICAgICAgIC8vIGxldCdzIGNoZWNrIHRvIHNlZSB3aGljaCBraW5kIG9mIHZhbHVlIHdlXG4gICAgICAgICAgICAvLyBjYXB0dXJlZCAocXVvdGVkIG9yIHVucXVvdGVkKS5cbiAgICAgICAgICAgIGlmIChhcnJNYXRjaGVzWyAyIF0pe1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgcXVvdGVkIHZhbHVlLiBXaGVuIHdlIGNhcHR1cmVcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHZhbHVlLCB1bmVzY2FwZSBhbnkgZG91YmxlIHF1b3Rlcy5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMiBdLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoIFwiXFxcIlxcXCJcIiwgXCJnXCIgKSxcbiAgICAgICAgICAgICAgICAgICAgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBub24tcXVvdGVkIHZhbHVlLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAzIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciB2YWx1ZSBzdHJpbmcsIGxldCdzIGFkZFxuICAgICAgICAgICAgLy8gaXQgdG8gdGhlIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICBhcnJEYXRhWyBhcnJEYXRhLmxlbmd0aCAtIDEgXS5wdXNoKCBzdHJNYXRjaGVkVmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdGhlIHBhcnNlZCBkYXRhLlxuICAgICAgICByZXR1cm4oIGFyckRhdGEgKTtcbiAgICB9XG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTtcbiIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXJcdG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZGF0YVN0b3JhZ2UgPSBsaWIuZGF0YVN0b3JhZ2UgPSB7fSxcblx0XHRvdXRwdXREYXRhU3RvcmFnZSA9IGxpYi5vdXRwdXREYXRhU3RvcmFnZSA9IHt9LFxuXHRcdG1ldGFTdG9yYWdlID0gbGliLm1ldGFTdG9yYWdlID0ge30sXG5cdFx0ZXh0ZW5kMiA9IGxpYi5leHRlbmQyLFxuXHRcdC8vIEZvciBzdG9yaW5nIHRoZSBjaGlsZCBvZiBhIHBhcmVudFxuXHRcdGxpbmtTdG9yZSA9IHt9LFxuXHRcdC8vRm9yIHN0b3JpbmcgdGhlIHBhcmVudCBvZiBhIGNoaWxkXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUgPSB7fSxcblx0XHRpZENvdW50ID0gMCxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVN0b3JlLlxuXHRcdERhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXHQgICAgXHRtYW5hZ2VyLnNldERhdGEoYXJndW1lbnRzWzBdKTtcblx0XHR9LFxuXHRcdGRhdGFTdG9yZVByb3RvID0gRGF0YVN0b3JlLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdGhlIGRhdGFQcm9jZXNzb3Igb3ZlciB0aGUgZGF0YVxuXHRcdGV4ZWN1dGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAodHlwZSwgZmlsdGVyRm4sIEpTT05EYXRhKSB7XG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0Y2FzZSAgJ2ZpbHRlcicgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGNhc2UgJ21hcCcgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvL0Z1bmN0aW9uIHRvIHVwZGF0ZSBhbGwgdGhlIGxpbmtlZCBjaGlsZCBkYXRhXG5cdFx0dXBkYXRhRGF0YSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSxcblx0XHRcdFx0cGFyZW50RGF0YSA9IChvdXRwdXREYXRhU3RvcmFnZVtpZF0gJiYgb3V0cHV0RGF0YVN0b3JhZ2VbaWRdLmRhdGEpIHx8IGRhdGFTdG9yYWdlW2lkXSxcblx0XHRcdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUsXG5cdFx0XHRcdGxlbixcblx0XHRcdFx0bGlua0lkcyxcblx0XHRcdFx0ZmlsdGVycyxcblx0XHRcdFx0bGlua0lkLFxuXHRcdFx0XHRmaWx0ZXIsXG5cdFx0XHRcdGZpbHRlckZuLFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRvdXRTcGVjcyxcblx0XHRcdFx0ZGF0YVN0b3JlLFxuXHRcdFx0XHRwcm9jZXNzb3IsXG5cdFx0XHRcdC8vIFN0b3JlIGFsbCB0aGUgZGF0YU9ianMgdGhhdCBhcmUgdXBkYXRlZC5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkID0gbGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXG5cdFx0XHRsaW5rSWRzID0gbGlua0RhdGEubGluaztcblx0XHRcdGZpbHRlcnMgPSBsaW5rRGF0YS5maWx0ZXI7XG5cdFx0XHRsZW4gPSBsaW5rSWRzLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGRhdGFTdG9yZSA9IGxpbmtJZHNbaV07XG5cdFx0XHRcdGxpbmtJZCA9IGRhdGFTdG9yZS5pZDtcblxuXHRcdFx0XHR0ZW1wRGF0YVVwZGF0ZWRbbGlua0lkXSA9IHRydWU7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV07XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldFByb2Nlc3NvcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmIChmaWx0ZXJTdG9yZVtmaWx0ZXIuaWRdKSB7XG5cdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdID0gZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBmaWx0ZXJGbiwgcGFyZW50RGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IHBhcmVudERhdGE7XG5cdFx0XHRcdFx0XHRmaWx0ZXIuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aSAtPSAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIE1vZGlmeWluZyBkYXRhIG9mIHNlbGYgYXBwbGllZCBwcm9jZXNzb3IuXG5cdFx0XHRcdFx0aWYgKG91dFNwZWNzID0gIG91dHB1dERhdGFTdG9yYWdlW2xpbmtJZF0pIHtcblx0XHRcdFx0XHRcdHByb2Nlc3NvciA9IG91dFNwZWNzLnByb2Nlc3Nvcjtcblx0XHRcdFx0XHRcdG91dHB1dERhdGFTdG9yYWdlW2xpbmtJZF0gPSBleGVjdXRlUHJvY2Vzc29yKHByb2Nlc3Nvci50eXBlLCBwcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCksXG5cdFx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0XHRcdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAobGlua1N0b3JlW2xpbmtJZF0pIHtcblx0XHRcdFx0XHR1cGRhdGFEYXRhKGxpbmtJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgbWV0YURhdGEgb2YgdGhlIGNoaWxkIGRhdGEgcmVjdXJzc2l2ZWx5XG5cdFx0dXBkYXRlTWV0YURhdGEgPSBmdW5jdGlvbiAoaWQsIG1ldGFEYXRhKSB7XG5cdFx0XHR2YXIgbGlua3MgPSBsaW5rU3RvcmVbaWRdLmxpbmssXG5cdFx0XHRcdGxlbmd0aCA9IGxpbmtzLmxlbmd0aCxcblx0XHRcdFx0aSxcblx0XHRcdFx0bmV3TWV0YURhdGEsXG5cdFx0XHRcdGxpbms7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsaW5rID0gbGlua3NbaV0uaWQ7XG5cdFx0XHRcdG5ld01ldGFEYXRhID0gbWV0YVN0b3JhZ2VbbGlua10gPSBleHRlbmQyKHt9LCBtZXRhRGF0YSk7XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbbGlua10pIHtcblx0XHRcdFx0XHR1cGRhdGVNZXRhRGF0YShsaW5rLCBuZXdNZXRhRGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhU3RvcmUoYXJndW1lbnRzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSBpbiB0aGUgZGF0YSBzdG9yZVxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhID0gZnVuY3Rpb24gKGRhdGFTcGVjcywgY2FsbGJhY2ssIG5vUmFpc2VFdmVudEZsYWcpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdG9sZElkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0aWQgPSBkYXRhU3BlY3MuaWQsXG5cdFx0XHRkYXRhVHlwZSA9IGRhdGFTcGVjcy5kYXRhVHlwZSxcblx0XHRcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdG9sZEpTT05EYXRhID0gZGF0YVN0b3JhZ2Vbb2xkSWRdIHx8IFtdLFxuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbiA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdFx0XHRkYXRhU3RvcmFnZVtpZF0gPSBvbGRKU09ORGF0YS5jb25jYXQoSlNPTkRhdGEgfHwgW10pO1xuXHRcdFx0XHQhbm9SYWlzZUV2ZW50RmxhZyAmJiBKU09ORGF0YSAmJiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YUFkZGVkJywge1xuXHRcdFx0XHRcdCdpZCc6IGlkLFxuXHRcdFx0XHRcdCdkYXRhJyA6IEpTT05EYXRhXG5cdFx0XHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShpZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKEpTT05EYXRhKTtcblx0XHRcdFx0fVx0XG5cdFx0XHR9O1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZGF0YVN0b3JhZ2UnICsgaWRDb3VudCArKztcblx0XHRkYXRhU3RvcmUuaWQgPSBpZDtcblx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXG5cdFx0aWYgKGRhdGFUeXBlID09PSAnY3N2Jykge1xuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5KHtcblx0XHRcdFx0c3RyaW5nIDogZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRcdGRlbGltaXRlciA6IGRhdGFTcGVjcy5kZWxpbWl0ZXIsXG5cdFx0XHRcdG91dHB1dEZvcm1hdCA6IGRhdGFTcGVjcy5vdXRwdXRGb3JtYXQsXG5cdFx0XHRcdGNhbGxiYWNrIDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGFTb3VyY2UpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHRkYXRhU3RvcmVQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpZCA9IHRoaXMuaWQ7XG5cdFx0cmV0dXJuICgob3V0cHV0RGF0YVN0b3JhZ2VbaWRdICYmIG91dHB1dERhdGFTdG9yYWdlW2lkXS5kYXRhKSB8fCBkYXRhU3RvcmFnZVtpZF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCBjaGlsZCBkYXRhIG9iamVjdCBhZnRlciBhcHBseWluZyBmaWx0ZXIgb24gdGhlIHBhcmVudCBkYXRhLlxuXHQvLyBAcGFyYW1zIHtmaWx0ZXJzfSAtIFRoaXMgY2FuIGJlIGEgZmlsdGVyIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIGZpbHRlciBmdW5jdGlvbnMuXG5cdGRhdGFTdG9yZVByb3RvLmdldERhdGEgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdGlkID0gZGF0YS5pZCxcblx0XHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluaztcblx0XHQvLyBJZiBubyBwYXJhbWV0ZXIgaXMgcHJlc2VudCB0aGVuIHJldHVybiB0aGUgdW5maWx0ZXJlZCBkYXRhLlxuXHRcdGlmICghZmlsdGVycykge1xuXHRcdFx0cmV0dXJuIGRhdGFTdG9yYWdlW2lkXTtcblx0XHR9XG5cdFx0Ly8gSWYgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIGZpbHRlciB0aGVuIHJldHVybiB0aGUgZmlsdGVyZWQgZGF0YSBhZnRlciBhcHBseWluZyB0aGUgZmlsdGVyIG92ZXIgdGhlIGRhdGEuXG5cdFx0ZWxzZSB7XG5cdFx0XHRsZXQgcmVzdWx0ID0gW10sXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld0RhdGEsXG5cdFx0XHRcdGxpbmtEYXRhLFxuXHRcdFx0XHRuZXdJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0ZGF0YWxpbmtzLFxuXHRcdFx0XHRmaWx0ZXJJRCxcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0bmV3RGF0YU9iaixcblx0XHRcdFx0aXNGaWx0ZXJBcnJheSA9IGZpbHRlcnMgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdFx0bGVuID0gaXNGaWx0ZXJBcnJheSA/IGZpbHRlcnMubGVuZ3RoIDogMTtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV0gfHwgZmlsdGVycztcblx0XHRcdFx0ZmlsdGVyRm4gPSBmaWx0ZXIuZ2V0UHJvY2Vzc29yKCk7XG5cdFx0XHRcdHR5cGUgPSBmaWx0ZXIudHlwZTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0bmV3RGF0YSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIGRhdGFTdG9yYWdlW2lkXSk7XG5cblx0XHRcdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YVByb2Nlc3NvckFwcGxpZWQnLCB7XG5cdFx0XHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YSxcblx0XHRcdFx0XHRcdCdkYXRhUHJvY2Vzc29yJyA6IGZpbHRlclxuXHRcdFx0XHRcdH0sIGRhdGEpO1xuXG5cdFx0XHRcdFx0bmV3RGF0YU9iaiA9IG5ldyBEYXRhU3RvcmUoe2RhdGFTb3VyY2UgOiBuZXdEYXRhfSk7XG5cdFx0XHRcdFx0bmV3SWQgPSBuZXdEYXRhT2JqLmlkO1xuXG5cdFx0XHRcdFx0Ly9QYXNzaW5nIHRoZSBtZXRhRGF0YSB0byB0aGUgY2hpbGQuXG5cdFx0XHRcdFx0bmV3RGF0YU9iai5hZGRNZXRhRGF0YShtZXRhU3RvcmFnZVtpZF0pO1xuXHRcdFx0XHRcdHBhcmVudFN0b3JlW25ld0lkXSA9IGRhdGE7XG5cblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXdEYXRhT2JqKTtcblxuXHRcdFx0XHRcdC8vUHVzaGluZyB0aGUgaWQgYW5kIGZpbHRlciBvZiBjaGlsZCBjbGFzcyB1bmRlciB0aGUgcGFyZW50IGNsYXNzZXMgaWQuXG5cdFx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdIHx8IChsaW5rU3RvcmVbaWRdID0ge1xuXHRcdFx0XHRcdFx0bGluayA6IFtdLFxuXHRcdFx0XHRcdFx0ZmlsdGVyIDogW11cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRsaW5rRGF0YS5saW5rLnB1c2gobmV3RGF0YU9iaik7XG5cdFx0XHRcdFx0bGlua0RhdGEuZmlsdGVyLnB1c2goZmlsdGVyKTtcblxuXHRcdFx0XHRcdC8vIFN0b3JpbmcgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIHVuZGVyIHRoZSBmaWx0ZXIgaWQuXG5cdFx0XHRcdFx0ZmlsdGVySUQgPSBmaWx0ZXIuZ2V0SUQoKTtcblx0XHRcdFx0XHRkYXRhbGlua3MgPSBmaWx0ZXJMaW5rW2ZpbHRlcklEXSB8fCAoZmlsdGVyTGlua1tmaWx0ZXJJRF0gPSBbXSk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzLnB1c2gobmV3RGF0YU9iaik7XG5cblx0XHRcdFx0XHQvLyBzZXR0aW5nIHRoZSBjdXJyZW50IGlkIGFzIHRoZSBuZXdJRCBzbyB0aGF0IHRoZSBuZXh0IGZpbHRlciBpcyBhcHBsaWVkIG9uIHRoZSBjaGlsZCBkYXRhO1xuXHRcdFx0XHRcdGlkID0gbmV3SWQ7XG5cdFx0XHRcdFx0ZGF0YSA9IG5ld0RhdGFPYmo7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiAoaXNGaWx0ZXJBcnJheSA/IHJlc3VsdCA6IHJlc3VsdFswXSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGRlbGV0ZSB0aGUgY3VycmVudCBkYXRhIGZyb20gdGhlIGRhdGFTdG9yYWdlIGFuZCBhbHNvIGFsbCBpdHMgY2hpbGRzIHJlY3Vyc2l2ZWx5XG5cdGRhdGFTdG9yZVByb3RvLmRlbGV0ZURhdGEgPSBmdW5jdGlvbiAob3B0aW9uYWxJZCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBvcHRpb25hbElkIHx8IGRhdGFTdG9yZS5pZCxcblx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSxcblx0XHRcdGZsYWc7XG5cblx0XHRpZiAobGlua0RhdGEpIHtcblx0XHRcdGxldCBpLFxuXHRcdFx0XHRsaW5rID0gbGlua0RhdGEubGluayxcblx0XHRcdFx0bGVuID0gbGluay5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICsrKSB7XG5cdFx0XHRcdGxpbmtbaV0uZGVsZXRlRGF0YSgpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGxpbmtTdG9yZVtpZF07XG5cdFx0fVxuXG5cdFx0ZGVsZXRlIG1ldGFTdG9yYWdlW2lkXTtcblx0XHRkZWxldGUgb3V0cHV0RGF0YVN0b3JhZ2VbaWRdO1xuXG5cdFx0ZmxhZyA9IGRlbGV0ZSBkYXRhU3RvcmFnZVtpZF07XG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFEZWxldGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0fSwgZGF0YVN0b3JlKTtcblx0XHRyZXR1cm4gZmxhZztcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGlkIG9mIHRoZSBjdXJyZW50IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gbW9kaWZ5IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8ubW9kaWZ5RGF0YSA9IGZ1bmN0aW9uIChkYXRhU3BlY3MsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZDtcblxuXHRcdGRhdGFTdG9yYWdlW2lkXSA9IFtdO1xuXHRcdGRhdGFTdG9yZS5zZXREYXRhKGRhdGFTcGVjcywgY2FsbGJhY2ssIHRydWUpO1xuXHRcdFxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhTW9kaWZpZWQnLCB7XG5cdFx0XHQnaWQnOiBpZFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgdG8gdGhlIGRhdGFTdG9yYWdlIGFzeW5jaHJvbm91c2x5IHZpYSBhamF4XG5cdGRhdGFTdG9yZVByb3RvLnNldERhdGFVcmwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGRhdGFTb3VyY2UgPSBhcmd1bWVudC5kYXRhU291cmNlLFxuXHRcdFx0ZGF0YVR5cGUgPSBhcmd1bWVudC5kYXRhVHlwZSxcblx0XHRcdGRlbGltaXRlciA9IGFyZ3VtZW50LmRlbGltaXRlcixcblx0XHRcdG91dHB1dEZvcm1hdCA9IGFyZ3VtZW50Lm91dHB1dEZvcm1hdCxcblx0XHRcdGNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2ssXG5cdFx0XHRjYWxsYmFja0FyZ3MgPSBhcmd1bWVudC5jYWxsYmFja0FyZ3MsXG5cdFx0XHRkYXRhO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLmFqYXgoe1xuXHRcdFx0dXJsIDogZGF0YVNvdXJjZSxcblx0XHRcdHN1Y2Nlc3MgOiBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdFx0ZGF0YSA9IGRhdGFUeXBlID09PSAnanNvbicgPyBKU09OLnBhcnNlKHN0cmluZykgOiBzdHJpbmc7XG5cdFx0XHRcdGRhdGFTdG9yZS5zZXREYXRhKHtcblx0XHRcdFx0XHRkYXRhU291cmNlIDogZGF0YSxcblx0XHRcdFx0XHRkYXRhVHlwZSA6IGRhdGFUeXBlLFxuXHRcdFx0XHRcdGRlbGltaXRlciA6IGRlbGltaXRlcixcblx0XHRcdFx0XHRvdXRwdXRGb3JtYXQgOiBvdXRwdXRGb3JtYXQsXG5cdFx0XHRcdH0sIGNhbGxiYWNrKTtcblx0XHRcdH0sXG5cblx0XHRcdGVycm9yIDogZnVuY3Rpb24oKXtcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKGNhbGxiYWNrQXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCBhbGwgdGhlIGtleXMgb2YgdGhlIEpTT04gZGF0YVxuXHRkYXRhU3RvcmVQcm90by5nZXRLZXlzID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRhdGFTdG9yZS5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0a2V5cyA9IGRhdGFTdG9yZS5rZXlzO1xuXG5cdFx0aWYgKGtleXMpIHtcblx0XHRcdHJldHVybiBrZXlzO1xuXHRcdH1cblx0XHRpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJldHVybiAoZGF0YVN0b3JlLmtleXMgPSBpbnRlcm5hbERhdGEpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBPYmplY3QpIHtcblx0XHRcdHJldHVybiAoZGF0YVN0b3JlLmtleXMgPSBPYmplY3Qua2V5cyhpbnRlcm5hbERhdGEpKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSB1bmlxdWUgdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXlcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0VW5pcXVlVmFsdWVzID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRhdGFTdG9yZS5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0aXNBcnJheSA9IGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5LFxuXHRcdFx0dW5pcXVlVmFsdWVzID0gZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldLFxuXHRcdFx0dGVtcFVuaXF1ZVZhbHVlcyA9IHt9LFxuXHRcdFx0bGVuID0gZGF0YS5sZW5ndGgsXG5cdFx0XHRpO1xuXG5cdFx0aWYgKHVuaXF1ZVZhbHVlcykge1xuXHRcdFx0cmV0dXJuIHVuaXF1ZVZhbHVlcztcblx0XHR9XG5cblx0XHRpZiAoaXNBcnJheSkge1xuXHRcdFx0aSA9IDE7XG5cdFx0XHRrZXkgPSBkYXRhU3RvcmUuZ2V0S2V5cygpLmZpbmRJbmRleChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC50b1VwcGVyQ2FzZSgpID09PSBrZXkudG9VcHBlckNhc2UoKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGkgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IGlzQXJyYXkgPyAxIDogMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpbnRlcm5hbERhdGEgPSBpc0FycmF5ID8gZGF0YVtpXVtrZXldIDogZGF0YVtpXVtrZXldO1xuXHRcdFx0IXRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSAmJiAodGVtcFVuaXF1ZVZhbHVlc1tpbnRlcm5hbERhdGFdID0gdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChkYXRhU3RvcmUudW5pcXVlVmFsdWVzW2tleV0gPSBPYmplY3Qua2V5cyh0ZW1wVW5pcXVlVmFsdWVzKSk7XG5cdH07XG5cblx0Ly9GdW5jdGlvbiB0byBjaGFuZ2UgdGhlIG91dHB1dCBvZiBnZXRKU09OKCkgYmFzZWQgb24gdGhlIGRhdGFQcm9jZXNzb3IgYXBwbGllZFxuXHRkYXRhU3RvcmVQcm90by5hcHBseURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoZGF0YVByb2Nlc3Nvcikge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0cHJvY2Vzc29yRm4gPSBkYXRhUHJvY2Vzc29yLmdldFByb2Nlc3NvcigpLFxuXHRcdFx0dHlwZSA9IGRhdGFQcm9jZXNzb3IudHlwZSxcblx0XHRcdGlkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0b3V0cHV0LFxuXHRcdFx0SlNPTkRhdGEgPSBkYXRhU3RvcmFnZVtpZF07XG5cblx0XHRpZiAodHlwZW9mIHByb2Nlc3NvckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRvdXRwdXQgPSBvdXRwdXREYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdID0ge1xuXHRcdFx0XHRkYXRhIDogZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBwcm9jZXNzb3JGbiwgSlNPTkRhdGEpLFxuXHRcdFx0XHRwcm9jZXNzb3IgOiBkYXRhUHJvY2Vzc29yXG5cdFx0XHR9O1xuXG5cdFx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0XHRkYXRhU3RvcmUudW5pcXVlVmFsdWVzID0ge307XG5cblx0XHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHRcdHVwZGF0YURhdGEoaWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgndGVtcEV2ZW50Jywge1xuXHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YVN0b3JlLFxuXHRcdFx0XHQnZGF0YVByb2Nlc3NvcicgOiBkYXRhUHJvY2Vzc29yXG5cdFx0XHR9LCBkYXRhU3RvcmUpO1xuXG5cdFx0XHRyZXR1cm4gb3V0cHV0LmRhdGE7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBtZXRhZGF0YVxuXHRkYXRhU3RvcmVQcm90by5hZGRNZXRhRGF0YSA9IGZ1bmN0aW9uIChtZXRhRGF0YSwgbWVyZ2UpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0bmV3TWV0YURhdGE7XG5cdFx0aWYgKG1lcmdlKSB7XG5cdFx0XHRuZXdNZXRhRGF0YSA9IG1ldGFTdG9yYWdlW2lkXSA9IGV4dGVuZDIobWV0YVN0b3JhZ2VbaWRdIHx8IHt9LCBtZXRhRGF0YSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtpZF0gPSBtZXRhRGF0YTtcblx0XHR9XG5cdFx0bGlua1N0b3JlW2lkXSAmJiB1cGRhdGVNZXRhRGF0YShpZCwgbmV3TWV0YURhdGEpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgYWRkZWQgbWV0YURhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0TWV0YURhdGEgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG1ldGFTdG9yYWdlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG5cdGRhdGFTdG9yZVByb3RvLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG5cdGRhdGFTdG9yZVByb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcblx0XHRsaWIgPSBtdWx0aUNoYXJ0aW5nUHJvdG8ubGliLFxuXHRcdGZpbHRlclN0b3JlID0gbGliLmZpbHRlclN0b3JlID0ge30sXG5cdFx0ZmlsdGVyTGluayA9IGxpYi5maWx0ZXJMaW5rID0ge30sXG5cdFx0ZmlsdGVySWRDb3VudCA9IDAsXG5cdFx0ZGF0YVN0b3JhZ2UgPSBsaWIuZGF0YVN0b3JhZ2UsXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUsXG5cdFx0Ly8gQ29uc3RydWN0b3IgY2xhc3MgZm9yIERhdGFQcm9jZXNzb3IuXG5cdFx0RGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLmFkZFJ1bGUoYXJndW1lbnRzWzBdKTtcblx0XHR9LFxuXHRcdFxuXHRcdGRhdGFQcm9jZXNzb3JQcm90byA9IERhdGFQcm9jZXNzb3IucHJvdG90eXBlLFxuXG5cdFx0Ly8gRnVuY3Rpb24gdG8gdXBkYXRlIGRhdGEgb24gY2hhbmdlIG9mIGZpbHRlci5cblx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IgPSBmdW5jdGlvbiAoaWQsIGNvcHlQYXJlbnRUb0NoaWxkKSB7XG5cdFx0XHR2YXIgaSxcblx0XHRcdFx0ZGF0YSA9IGZpbHRlckxpbmtbaWRdLFxuXHRcdFx0XHRKU09ORGF0YSxcblx0XHRcdFx0ZGF0dW0sXG5cdFx0XHRcdGRhdGFJZCxcblx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKyspIHtcblx0XHRcdFx0ZGF0dW0gPSBkYXRhW2ldO1xuXHRcdFx0XHRkYXRhSWQgPSBkYXR1bS5pZDtcblx0XHRcdFx0aWYgKCFsaWIudGVtcERhdGFVcGRhdGVkW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRpZiAocGFyZW50U3RvcmVbZGF0YUlkXSAmJiBkYXRhU3RvcmFnZVtkYXRhSWRdKSB7XG5cdFx0XHRcdFx0XHRKU09ORGF0YSA9IHBhcmVudFN0b3JlW2RhdGFJZF0uZ2V0RGF0YSgpO1xuXHRcdFx0XHRcdFx0ZGF0dW0ubW9kaWZ5RGF0YShjb3B5UGFyZW50VG9DaGlsZCA/IEpTT05EYXRhIDogZmlsdGVyU3RvcmVbaWRdKEpTT05EYXRhKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHBhcmVudFN0b3JlW2RhdGFJZF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRsaWIudGVtcERhdGFVcGRhdGVkID0ge307XG5cdFx0fTtcblxuXHRtdWx0aUNoYXJ0aW5nUHJvdG8uY3JlYXRlRGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGFQcm9jZXNzb3IoYXJndW1lbnRzWzBdKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZmlsdGVyIGluIHRoZSBmaWx0ZXIgc3RvcmVcblx0ZGF0YVByb2Nlc3NvclByb3RvLmFkZFJ1bGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGZpbHRlciA9IHRoaXMsXG5cdFx0XHRvbGRJZCA9IGZpbHRlci5pZCxcblx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdLFxuXHRcdFx0ZmlsdGVyRm4gPSAoYXJndW1lbnQgJiYgYXJndW1lbnQucnVsZSkgfHwgYXJndW1lbnQsXG5cdFx0XHRpZCA9IGFyZ3VtZW50ICYmIGFyZ3VtZW50LnR5cGUsXG5cdFx0XHR0eXBlID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2ZpbHRlclN0b3JlJyArIGZpbHRlcklkQ291bnQgKys7XG5cdFx0ZmlsdGVyU3RvcmVbaWRdID0gZmlsdGVyRm47XG5cblx0XHRmaWx0ZXIuaWQgPSBpZDtcblx0XHRmaWx0ZXIudHlwZSA9IHR5cGU7XG5cblx0XHQvLyBVcGRhdGUgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIGFuZCBhbHNvIG9uIHRoZSBjaGlsZCBkYXRhLlxuXHRcdGlmIChmaWx0ZXJMaW5rW2lkXSkge1xuXHRcdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkKTtcblx0XHR9XG5cblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZmlsdGVyQWRkZWQnLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IGZpbHRlckZuXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCB0aGUgZmlsdGVyIG1ldGhvZC5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldFByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZmlsdGVyU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBJRCBvZiB0aGUgZmlsdGVyLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZGVsZXRlUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0aWQgPSBmaWx0ZXIuaWQ7XG5cblx0XHRmaWx0ZXJMaW5rW2lkXSAmJiB1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQsIHRydWUpO1xuXG5cdFx0ZGVsZXRlIGZpbHRlclN0b3JlW2lkXTtcblx0XHRkZWxldGUgZmlsdGVyTGlua1tpZF07XG5cblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZmlsdGVyRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2ZpbHRlcidcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5zb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnc29ydCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5tYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdtYXAnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDIsXG4gICAgICAgIE5VTEwgPSBudWxsLFxuICAgICAgICBVTkRFRklORUQgPSB1bmRlZmluZWQ7XG4gICAgLy9mdW5jdGlvbiB0byBjb252ZXJ0IGRhdGEsIGl0IHJldHVybnMgZmMgc3VwcG9ydGVkIEpTT05cbiAgICB2YXIgRGF0YUFkYXB0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFhZGFwdGVyID0gdGhpcztcblxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhU3RvcmUgPSBhcmd1bWVudC5kYXRhc3RvcmU7ICAgICAgIFxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhSlNPTiA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiBkYXRhYWRhcHRlci5kYXRhU3RvcmUuZ2V0SlNPTigpO1xuICAgICAgICBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uID0gYXJndW1lbnQuY29uZmlnO1xuICAgICAgICBkYXRhYWRhcHRlci5jYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrO1xuICAgICAgICBkYXRhYWRhcHRlci5GQ2pzb24gPSBkYXRhYWRhcHRlci5jb252ZXJ0RGF0YSgpO1xuICAgIH0sXG4gICAgcHJvdG9EYXRhYWRhcHRlciA9IERhdGFBZGFwdGVyLnByb3RvdHlwZTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuY29udmVydERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcywgICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGEsXG4gICAgICAgICAgICBqc29uID0ge30sXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IHt9LFxuICAgICAgICAgICAganNvbkRhdGEgPSBkYXRhYWRhcHRlci5kYXRhSlNPTixcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhYWRhcHRlci5jYWxsYmFjaztcblxuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YSA9IGRhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAganNvbiA9IGRhdGFhZGFwdGVyLmpzb25DcmVhdG9yKGFnZ3JlZ2F0ZWREYXRhLCBjb25maWd1cmF0aW9uKTsgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBqc29uID0gKHByZWRlZmluZWRKc29uICYmIGV4dGVuZDIoanNvbixwcmVkZWZpbmVkSnNvbikpIHx8IGpzb247XG4gICAgICAgIGpzb24gPSAoY2FsbGJhY2sgJiYgY2FsbGJhY2soanNvbikpIHx8IGpzb247XG4gICAgICAgIHJldHVybiBkYXRhYWRhcHRlci5zZXREZWZhdWx0QXR0cihqc29uKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNhdGVnb3J5QXJyLCBkaW1lbnNpb24sIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGluZGVveE9mS2V5LFxuICAgICAgICAgICAgbmV3RGF0YSA9IFtdLFxuICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdLFxuICAgICAgICAgICAga2V5ID0gW10sXG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgICAgICBsZW5LZXksXG4gICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgbGVuQ2F0LFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgYXJyID0gW107XG4gICAgICAgICghQXJyYXkuaXNBcnJheShkaW1lbnNpb24pICYmIChrZXkgPSBbZGltZW5zaW9uXSkpIHx8IChrZXkgPSBkaW1lbnNpb24pO1xuICAgICAgICAoIUFycmF5LmlzQXJyYXkoY2F0ZWdvcnlBcnJbMF0pICYmIChjYXRlZ29yaWVzID0gW2NhdGVnb3J5QXJyXSkpIHx8IChjYXRlZ29yaWVzID0gY2F0ZWdvcnlBcnIpO1xuXG4gICAgICAgIG5ld0RhdGEucHVzaChkYXRhWzBdKTtcbiAgICAgICAgZm9yKGsgPSAwLCBsZW5LZXkgPSBrZXkubGVuZ3RoOyBrIDwgbGVuS2V5OyBrKyspIHtcbiAgICAgICAgICAgIGluZGVveE9mS2V5ID0gZGF0YVswXS5pbmRleE9mKGtleVtrXSk7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvcihpID0gMCxsZW5DYXQgPSBjYXRlZ29yaWVzW2tdLmxlbmd0aDsgaSA8IGxlbkNhdCAgJiYgaW5kZW94T2ZLZXkgIT09IC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzdWJTZXREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0gZGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHsgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgKGRhdGFbal1baW5kZW94T2ZLZXldID09IGNhdGVnb3JpZXNba11baV0pICYmIChzdWJTZXREYXRhLnB1c2goZGF0YVtqXSkpO1xuICAgICAgICAgICAgICAgIH0gICAgIFxuICAgICAgICAgICAgICAgIGFycltpbmRlb3hPZktleV0gPSBjYXRlZ29yaWVzW2tdW2ldO1xuICAgICAgICAgICAgICAgIChzdWJTZXREYXRhLmxlbmd0aCA9PT0gMCkgJiYgKHN1YlNldERhdGEucHVzaChhcnIpKTtcbiAgICAgICAgICAgICAgICBuZXdEYXRhLnB1c2goZGF0YWFkYXB0ZXIuZ2V0QWdncmVnYXRlRGF0YShzdWJTZXREYXRhLCBjYXRlZ29yaWVzW2tdW2ldLCBhZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5zZXREZWZhdWx0QXR0ciA9IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBrZXlFeGNsdWRlZEpzb25TdHIgPSAnJyxcbiAgICAgICAgICAgIHBhbGV0dGVDb2xvcnMgPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBkYXRhU3RvcmUgPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUsXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBtZWFzdXJlID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbiAmJiBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLm1lYXN1cmUsXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZTtcblxuICAgICAgICBqc29uLmNoYXJ0IHx8IChqc29uLmNoYXJ0ID0ge30pO1xuICAgICAgICBcbiAgICAgICAga2V5RXhjbHVkZWRKc29uU3RyID0gKG1ldGFEYXRhICYmIEpTT04uc3RyaW5naWZ5KGpzb24sIGZ1bmN0aW9uKGssdil7XG4gICAgICAgICAgICBpZihrID09ICdjb2xvcicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTlVMTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9KSkgfHwgVU5ERUZJTkVEO1xuXG4gICAgICAgIGpzb24gPSAoa2V5RXhjbHVkZWRKc29uU3RyICYmIEpTT04ucGFyc2Uoa2V5RXhjbHVkZWRKc29uU3RyKSkgfHwganNvbjtcblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuICYmIG1ldGFEYXRhOyBpKyspIHtcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgcGFsZXR0ZUNvbG9yc1tpXSA9IChtZXRhRGF0YU1lYXN1cmVbJ2NvbG9yJ10gaW5zdGFuY2VvZiBGdW5jdGlvbikgPyBtZXRhRGF0YU1lYXN1cmVbJ2NvbG9yJ10oKSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbWV0YURhdGFNZWFzdXJlWydjb2xvciddO1xuICAgICAgICB9XG5cbiAgICAgICAganNvbi5jaGFydFsncGFsZXR0ZUNvbG9ycyddID0gcGFsZXR0ZUNvbG9ycztcbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0QWdncmVnYXRlRGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBrZXksIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGFnZ3JlZ2F0ZU1ldGhvZCA9IHtcbiAgICAgICAgICAgICdzdW0nIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBkYXRhWzBdO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMSwgbGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoZGF0YVtpXVtqXSAhPSBrZXkpICYmIChhZ2dyZWdhdGVkRGF0YVtqXSA9IE51bWJlcihhZ2dyZWdhdGVkRGF0YVtqXSkgKyBOdW1iZXIoZGF0YVtpXVtqXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnYXZlcmFnZScgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaUFnZ3JlZ2F0ZU10aGQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBsZW5SID0gZGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWRTdW1BcnIgPSBpQWdncmVnYXRlTXRoZC5zdW0oKSxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMCwgbGVuID0gYWdncmVnYXRlZFN1bUFyci5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICgoYWdncmVnYXRlZFN1bUFycltpXSAhPSBrZXkpICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgKGFnZ3JlZ2F0ZWREYXRhW2ldID0gKE51bWJlcihhZ2dyZWdhdGVkU3VtQXJyW2ldKSkgLyBsZW5SKSkgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYWdncmVnYXRlZERhdGFbaV0gPSBhZ2dyZWdhdGVkU3VtQXJyW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSBhZ2dyZWdhdGVNb2RlICYmIGFnZ3JlZ2F0ZU1vZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgYWdncmVnYXRlTW9kZSA9IChhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0gJiYgYWdncmVnYXRlTW9kZSkgfHwgJ3N1bSc7XG5cbiAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSgpO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0ID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGpzb25EYXRhWzBdKSxcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXkgPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgbGVuR2VuZXJhbERhdGFBcnJheSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGltZW5zaW9uID0gY29uZmlndXJhdGlvbi5kaW1lbnNpb24gfHwgW10sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlIHx8IFtdO1xuICAgICAgICBpZiAoIWlzQXJyYXkpe1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IFtdO1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXS5wdXNoKGRpbWVuc2lvbik7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gZ2VuZXJhbERhdGFBcnJheVswXVswXS5jb25jYXQobWVhc3VyZSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBqc29uRGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbaSsxXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkdlbmVyYWxEYXRhQXJyYXkgPSBnZW5lcmFsRGF0YUFycmF5WzBdLmxlbmd0aDsgaiA8IGxlbkdlbmVyYWxEYXRhQXJyYXk7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2ldW2dlbmVyYWxEYXRhQXJyYXlbMF1bal1dOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbaSsxXVtqXSA9IHZhbHVlIHx8ICcnOyAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ganNvbkRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlbmVyYWxEYXRhQXJyYXk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuanNvbkNyZWF0b3IgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgY29uZiA9IGNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBzZXJpZXNUeXBlID0gY29uZiAmJiBjb25mLnNlcmllc1R5cGUsXG4gICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgJ21zJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjYXRlZ29yeSc6IFsgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNhdGVnb3JpZXNbMF0uY2F0ZWdvcnkucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2VyaWVzbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRbaV0uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbMF0pO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBqc29uRGF0YVtqXVtpbmRleE1hdGNoTGFiZWxdOyAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uRGF0YVtqXVtpbmRleE1hdGNoVmFsdWVdOyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDogbGFiZWwgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJyA6IHZhbHVlIHx8ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkuZGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXSA9IHsgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIHNlcmllc1R5cGUgPSBzZXJpZXNUeXBlICYmIHNlcmllc1R5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgc2VyaWVzVHlwZSA9IChzZXJpZXNbc2VyaWVzVHlwZV0gJiYgc2VyaWVzVHlwZSkgfHwgJ21zJztcbiAgICAgICAgcmV0dXJuIHNlcmllc1tzZXJpZXNUeXBlXShqc29uRGF0YSwgY29uZik7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RkNqc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLkZDanNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhSnNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhSlNPTjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVkRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGVkRGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREaW1lbnNpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbi5kaW1lbnNpb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLm1lYXN1cmU7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TGltaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIG1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgICAgIG1pbiA9ICtJbmZpbml0eSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspe1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIHZhbHVlID0gK2RhdGFbaV1bal07XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1heCA9IG1heCA8IHZhbHVlID8gdmFsdWUgOiBtYXgpO1xuICAgICAgICAgICAgICAgIHZhbHVlICYmIChtaW4gPSBtaW4gPiB2YWx1ZSA/IHZhbHVlIDogbWluKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ21pbicgOiBtaW4sXG4gICAgICAgICAgICAnbWF4JyA6IG1heFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmhpZ2hsaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA9IGFyZ3VtZW50c1swXSAmJiBhcmd1bWVudHNbMF0udG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNhdGVnb3J5QXJyID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLFxuICAgICAgICAgICAgaW5kZXggPSBjYXRlZ29yeUxhYmVsICYmIGNhdGVnb3J5QXJyLmluZGV4T2YoY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNoYXJ0LmRyYXdUcmVuZFJlZ2lvbihpbmRleCk7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFhZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFBZGFwdGVyKGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbn0pOyIsIiAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9O1xuXG4gICAgICAgICAgICBjaGFydC5kYXRhU3RvcmVKc29uID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXREYXRhSnNvbigpO1xuICAgICAgICAgICAgY2hhcnQuZGltZW5zaW9uID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXREaW1lbnNpb24oKTtcbiAgICAgICAgICAgIGNoYXJ0Lm1lYXN1cmUgPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldE1lYXN1cmUoKTtcbiAgICAgICAgICAgIGNoYXJ0LmFnZ3JlZ2F0ZWREYXRhID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXRBZ2dyZWdhdGVkRGF0YSgpO1xuICAgICAgICAgICAgY2hhcnQucmVuZGVyKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNoYXJ0UHJvdG8gPSBDaGFydC5wcm90b3R5cGUsXG4gICAgICAgIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMixcbiAgICAgICAgZ2V0Um93RGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGFnZ3JlZ2F0ZWREYXRhLCBkaW1lbnNpb24sIG1lYXN1cmUsIGtleSkge1xuICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgICAgIGssXG4gICAgICAgICAgICAgICAga2ssXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0pLFxuICAgICAgICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgICAgICAgbWF0Y2hPYmogPSB7fSxcbiAgICAgICAgICAgICAgICBpbmRleE9mRGltZW5zaW9uID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihkaW1lbnNpb25bMF0pO1xuICAgICAgICBcbiAgICAgICAgICAgIGZvcihsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpc0FycmF5ICYmIChpbmRleCA9IGRhdGFbaV0uaW5kZXhPZihrZXkpKTtcbiAgICAgICAgICAgICAgICBpZihpbmRleCAhPT0gLTEgJiYgaXNBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IobCA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgbCA8IGxlbkM7IGwrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialtkYXRhWzBdW2xdXSA9IGRhdGFbaV1bbF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW4gPSBtZWFzdXJlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFnZ3JlZ2F0ZWREYXRhWzBdLmluZGV4T2YobWVhc3VyZVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBrayA9IGFnZ3JlZ2F0ZWREYXRhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleE9mRGltZW5zaW9uXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmpbbWVhc3VyZVtqXV0gPSBhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaE9iajtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZighaXNBcnJheSAmJiBkYXRhW2ldW2RpbWVuc2lvblswXV0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqID0gZGF0YVtpXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGNoYXJ0UHJvdG8ucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge307XG5cbiAgICAgICAgLy9nZXQgZmMgc3VwcG9ydGVkIGpzb24gICAgICAgICAgICBcbiAgICAgICAgY2hhcnQuZ2V0SlNPTihhcmd1bWVudCk7ICAgICAgICBcbiAgICAgICAgLy9yZW5kZXIgRkMgXG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqID0gbmV3IEZ1c2lvbkNoYXJ0cyhjaGFydC5jaGFydENvbmZpZyk7XG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLnJlbmRlcigpO1xuXG4gICAgICAgIGRhdGFBZGFwdGVyT2JqLmNoYXJ0ID0gY2hhcnQuY2hhcnRPYmo7XG4gICAgICAgIFxuICAgICAgICBjaGFydC5jaGFydE9iai5hZGRFdmVudExpc3RlbmVyKCdkYXRhcGxvdHJvbGxvdmVyJywgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgICAgIHZhciBkYXRhT2JqID0gZ2V0Um93RGF0YShjaGFydC5kYXRhU3RvcmVKc29uLCBjaGFydC5hZ2dyZWdhdGVkRGF0YSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnQuZGltZW5zaW9uLCBjaGFydC5tZWFzdXJlLCBkLmNhdGVnb3J5TGFiZWwpO1xuICAgICAgICAgICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUucmFpc2VFdmVudCgnaG92ZXJpbicsIHtcbiAgICAgICAgICAgICAgICBkYXRhIDogZGF0YU9iaixcbiAgICAgICAgICAgICAgICBjYXRlZ29yeUxhYmVsIDogZC5jYXRlZ29yeUxhYmVsXG4gICAgICAgICAgICB9LCBjaGFydCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjaGFydFByb3RvLmdldEpTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9YXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJPYmosXG4gICAgICAgICAgICBjaGFydENvbmZpZyA9IHt9LFxuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IHt9O1xuICAgICAgICAvL3BhcnNlIGFyZ3VtZW50IGludG8gY2hhcnRDb25maWcgXG4gICAgICAgIGV4dGVuZDIoY2hhcnRDb25maWcsYXJndW1lbnQpO1xuICAgICAgICBcbiAgICAgICAgLy9kYXRhQWRhcHRlck9iaiBcbiAgICAgICAgZGF0YUFkYXB0ZXJPYmogPSBhcmd1bWVudC5jb25maWd1cmF0aW9uIHx8IHt9O1xuXG4gICAgICAgIC8vc3RvcmUgZmMgc3VwcG9ydGVkIGpzb24gdG8gcmVuZGVyIGNoYXJ0c1xuICAgICAgICBkYXRhU291cmNlID0gZGF0YUFkYXB0ZXJPYmouZ2V0RkNqc29uKCk7XG5cbiAgICAgICAgLy9kZWxldGUgZGF0YSBjb25maWd1cmF0aW9uIHBhcnRzIGZvciBGQyBqc29uIGNvbnZlcnRlclxuICAgICAgICBkZWxldGUgY2hhcnRDb25maWcuY29uZmlndXJhdGlvbjtcbiAgICAgICAgXG4gICAgICAgIC8vc2V0IGRhdGEgc291cmNlIGludG8gY2hhcnQgY29uZmlndXJhdGlvblxuICAgICAgICBjaGFydENvbmZpZy5kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgICAgICAgY2hhcnQuY2hhcnRDb25maWcgPSBjaGFydENvbmZpZzsgICAgICAgIFxuICAgIH07XG5cbiAgICBjaGFydFByb3RvLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID1hcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge307XG4gICAgICAgIGNoYXJ0LmdldEpTT04oYXJndW1lbnQpO1xuICAgICAgICBjaGFydC5jaGFydE9iai5jaGFydFR5cGUoY2hhcnQuY2hhcnRDb25maWcudHlwZSk7XG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLnNldEpTT05EYXRhKGNoYXJ0LmNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UpO1xuICAgICAgICBkYXRhQWRhcHRlck9iai5jaGFydCA9IGNoYXJ0LmNoYXJ0T2JqO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFydChhcmd1bWVudHNbMF0pO1xuICAgIH07XG59KTsiLCJcblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBjcmVhdGVDaGFydCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0LFxuICAgICAgICBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICAgICAgUFggPSAncHgnLFxuICAgICAgICBESVYgPSAnZGl2JyxcbiAgICAgICAgRU1QVFlfU1RSSU5HID0gJycsXG4gICAgICAgIEFCU09MVVRFID0gJ2Fic29sdXRlJyxcbiAgICAgICAgTUFYX1BFUkNFTlQgPSAnMTAwJScsXG4gICAgICAgIFJFTEFUSVZFID0gJ3JlbGF0aXZlJyxcbiAgICAgICAgSUQgPSAnaWQnLFxuICAgICAgICBCT1JERVJfQk9YID0gJ2JvcmRlci1ib3gnO1xuXG4gICAgdmFyIENlbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG4gICAgICAgICAgICBjZWxsLmNvbnRhaW5lciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgY2VsbC5kcmF3KCk7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCAmJiBjZWxsLnJlbmRlckNoYXJ0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvQ2VsbCA9IENlbGwucHJvdG90eXBlO1xuXG4gICAgcHJvdG9DZWxsLmRyYXcgPSBmdW5jdGlvbiAoKXtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzO1xuICAgICAgICBjZWxsLmdyYXBoaWNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChESVYpO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmlkID0gY2VsbC5jb25maWcuaWQgfHwgRU1QVFlfU1RSSU5HOyAgICAgICAgXG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuaGVpZ2h0ID0gY2VsbC5jb25maWcuaGVpZ2h0ICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUud2lkdGggPSBjZWxsLmNvbmZpZy53aWR0aCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnRvcCA9IGNlbGwuY29uZmlnLnRvcCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmxlZnQgPSBjZWxsLmNvbmZpZy5sZWZ0ICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUucG9zaXRpb24gPSBBQlNPTFVURTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5ib3hTaXppbmcgPSBCT1JERVJfQk9YO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmNsYXNzTmFtZSA9IGNlbGwuY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pbm5lckhUTUwgPSBjZWxsLmNvbmZpZy5odG1sIHx8IEVNUFRZX1NUUklORztcbiAgICAgICAgY2VsbC5jb250YWluZXIuYXBwZW5kQ2hpbGQoY2VsbC5ncmFwaGljcyk7XG4gICAgfTtcblxuICAgIHByb3RvQ2VsbC5yZW5kZXJDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzOyBcblxuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC5yZW5kZXJBdCA9IGNlbGwuY29uZmlnLmlkO1xuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC53aWR0aCA9IE1BWF9QRVJDRU5UO1xuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC5oZWlnaHQgPSBNQVhfUEVSQ0VOVDtcbiAgICAgIFxuICAgICAgICBpZihjZWxsLmNoYXJ0KSB7XG4gICAgICAgICAgICBjZWxsLmNoYXJ0LnVwZGF0ZShjZWxsLmNvbmZpZy5jaGFydCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsLmNoYXJ0ID0gY3JlYXRlQ2hhcnQoY2VsbC5jb25maWcuY2hhcnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjZWxsLmNoYXJ0O1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwudXBkYXRlID0gZnVuY3Rpb24gKG5ld0NvbmZpZykge1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXMsXG4gICAgICAgICAgICBpZCA9IGNlbGwuY29uZmlnLmlkO1xuXG4gICAgICAgIGlmKG5ld0NvbmZpZyl7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IG5ld0NvbmZpZztcbiAgICAgICAgICAgIGNlbGwuY29uZmlnLmlkID0gaWQ7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLmlkID0gY2VsbC5jb25maWcuaWQgfHwgRU1QVFlfU1RSSU5HOyAgICAgICAgXG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLmNsYXNzTmFtZSA9IGNlbGwuY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuaGVpZ2h0ID0gY2VsbC5jb25maWcuaGVpZ2h0ICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUudG9wID0gY2VsbC5jb25maWcudG9wICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmxlZnQgPSBjZWxsLmNvbmZpZy5sZWZ0ICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgICAgICAhY2VsbC5jb25maWcuY2hhcnQgJiYgKGNlbGwuZ3JhcGhpY3MuaW5uZXJIVE1MID0gY2VsbC5jb25maWcuaHRtbCB8fCBFTVBUWV9TVFJJTkcpO1xuICAgICAgICAgICAgY2VsbC5jb250YWluZXIuYXBwZW5kQ2hpbGQoY2VsbC5ncmFwaGljcyk7XG4gICAgICAgICAgICBpZihjZWxsLmNvbmZpZy5jaGFydCkge1xuICAgICAgICAgICAgICAgIGNlbGwuY2hhcnQgPSBjZWxsLnJlbmRlckNoYXJ0KCk7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY2VsbC5jaGFydDtcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0gIFxuICAgICAgICByZXR1cm4gY2VsbDsgICAgICBcbiAgICB9O1xuXG4gICAgdmFyIE1hdHJpeCA9IGZ1bmN0aW9uIChzZWxlY3RvciwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXM7XG4gICAgICAgICAgICBtYXRyaXguc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgICAgICAgIC8vbWF0cml4IGNvbnRhaW5lclxuICAgICAgICAgICAgbWF0cml4Lm1hdHJpeENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIG1hdHJpeC5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0SCA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0VyA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kaXNwb3NhbEJveCA9IFtdO1xuICAgICAgICAgICAgLy9kaXNwb3NlIG1hdHJpeCBjb250ZXh0XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zZSgpO1xuICAgICAgICAgICAgLy9zZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lciBcbiAgICAgICAgICAgIG1hdHJpeC5zZXRBdHRyQ29udGFpbmVyKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvTWF0cml4ID0gTWF0cml4LnByb3RvdHlwZSxcbiAgICAgICAgY2hhcnRJZCA9IDA7XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBzdHlsZSwgYXR0ciBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0QXR0ckNvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyOyAgICAgICAgXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFJFTEFUSVZFO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uID0gZnVuY3Rpb24gKGhlaWdodEFyciwgd2lkdGhBcnIpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgICAgICB3aWR0aCA9IDAsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGhlaWdodEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IGhlaWdodEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gd2lkdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHdpZHRoICs9IHdpZHRoQXJyW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFBYO1xuICAgICAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArIFBYO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIGRyYXcgbWF0cml4XG4gICAgcHJvdG9NYXRyaXguZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FsQm94ID0gW107XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IG1hdHJpeCAmJiBtYXRyaXguY29uZmlndXJhdGlvbiB8fCB7fSxcbiAgICAgICAgICAgIC8vc3RvcmUgdmlydHVhbCBtYXRyaXggZm9yIHVzZXIgZ2l2ZW4gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IFtdLFxuICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBjYWxsQmFjayA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBbXTtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICAvL3N0b3JlIGNlbGwgb2JqZWN0IGluIGxvZ2ljYWwgbWF0cml4IHN0cnVjdHVyZVxuICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSxwYXJlbnRDb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbWF0cml4LnBsYWNlSG9sZGVyID0gW107XG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IHBsYWNlSG9sZGVyO1xuICAgICAgICBjYWxsQmFjayAmJiBjYWxsQmFjaygpO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIG1hbmFnZSBtYXRyaXggZHJhd1xuICAgIHByb3RvTWF0cml4LmRyYXdNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgLy9zdG9yZSBtYXBwaW5nIG1hdHJpeCBiYXNlZCBvbiB0aGUgdXNlciBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBzaGFkb3dNYXRyaXggPSBtYXRyaXgubWF0cml4TWFuYWdlcihjb25maWd1cmF0aW9uKSwgICAgICAgICAgICBcbiAgICAgICAgICAgIGhlaWdodEFyciA9IG1hdHJpeC5nZXRSb3dIZWlnaHQoc2hhZG93TWF0cml4KSxcbiAgICAgICAgICAgIHdpZHRoQXJyID0gbWF0cml4LmdldENvbFdpZHRoKHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICBkcmF3TWFuYWdlck9iakFyciA9IFtdLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIG1hdHJpeFBvc1ggPSBtYXRyaXguZ2V0UG9zKHdpZHRoQXJyKSxcbiAgICAgICAgICAgIG1hdHJpeFBvc1kgPSBtYXRyaXguZ2V0UG9zKGhlaWdodEFyciksXG4gICAgICAgICAgICByb3dzcGFuLFxuICAgICAgICAgICAgY29sc3BhbixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgY2hhcnQsXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgY29sO1xuICAgICAgICAvL2NhbGN1bGF0ZSBhbmQgc2V0IHBsYWNlaG9sZGVyIGluIHNoYWRvdyBtYXRyaXhcbiAgICAgICAgY29uZmlndXJhdGlvbiA9IG1hdHJpeC5zZXRQbGNIbGRyKHNoYWRvd01hdHJpeCwgY29uZmlndXJhdGlvbik7XG4gICAgICAgIC8vZnVuY3Rpb24gdG8gc2V0IGhlaWdodCwgd2lkdGggb24gbWF0cml4IGNvbnRhaW5lclxuICAgICAgICBtYXRyaXguc2V0Q29udGFpbmVyUmVzb2x1dGlvbihoZWlnaHRBcnIsIHdpZHRoQXJyKTtcbiAgICAgICAgLy9jYWxjdWxhdGUgY2VsbCBwb3NpdGlvbiBhbmQgaGVpaHQgYW5kIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgIFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnJbaV0gPSBbXTsgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4gfHwgMSk7XG4gICAgICAgICAgICAgICAgY29sc3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuIHx8IDEpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGFydCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jaGFydDtcbiAgICAgICAgICAgICAgICBodG1sID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmh0bWw7XG4gICAgICAgICAgICAgICAgcm93ID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXS5yb3cpO1xuICAgICAgICAgICAgICAgIGNvbCA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0uY29sKTtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbWF0cml4UG9zWFtjb2xdO1xuICAgICAgICAgICAgICAgIHRvcCA9IG1hdHJpeFBvc1lbcm93XTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IG1hdHJpeFBvc1hbY29sICsgY29sc3Bhbl0gLSBsZWZ0O1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IG1hdHJpeFBvc1lbcm93ICsgcm93c3Bhbl0gLSB0b3A7XG4gICAgICAgICAgICAgICAgaWQgPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmlkKSB8fCBtYXRyaXguaWRDcmVhdG9yKHJvdyxjb2wpO1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jbGFzc05hbWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnJbaV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRvcCAgICAgICA6IHRvcCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdCAgICAgIDogbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICAgIDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgICAgOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lIDogY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICBpZCAgICAgICAgOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbiAgIDogcm93c3BhbixcbiAgICAgICAgICAgICAgICAgICAgY29sc3BhbiAgIDogY29sc3BhbixcbiAgICAgICAgICAgICAgICAgICAgaHRtbCAgICAgIDogaHRtbCxcbiAgICAgICAgICAgICAgICAgICAgY2hhcnQgICAgIDogY2hhcnRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcmF3TWFuYWdlck9iakFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguaWRDcmVhdG9yID0gZnVuY3Rpb24oKXtcbiAgICAgICAgY2hhcnRJZCsrOyAgICAgICBcbiAgICAgICAgcmV0dXJuIElEICsgY2hhcnRJZDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0UG9zID0gIGZ1bmN0aW9uKHNyYyl7XG4gICAgICAgIHZhciBhcnIgPSBbXSxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuID0gc3JjICYmIHNyYy5sZW5ndGg7XG5cbiAgICAgICAgZm9yKDsgaSA8PSBsZW47IGkrKyl7XG4gICAgICAgICAgICBhcnIucHVzaChpID8gKHNyY1tpLTFdK2FycltpLTFdKSA6IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguc2V0UGxjSGxkciA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCwgY29uZmlndXJhdGlvbil7XG4gICAgICAgIHZhciByb3csXG4gICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICBsZW5DO1xuXG4gICAgICAgIGZvcihpID0gMCwgbGVuUiA9IHNoYWRvd01hdHJpeC5sZW5ndGg7IGkgPCBsZW5SOyBpKyspeyBcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IHNoYWRvd01hdHJpeFtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIHJvdyA9IHNoYWRvd01hdHJpeFtpXVtqXS5pZC5zcGxpdCgnLScpWzBdO1xuICAgICAgICAgICAgICAgIGNvbCA9IHNoYWRvd01hdHJpeFtpXVtqXS5pZC5zcGxpdCgnLScpWzFdO1xuXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93ID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93ID09PSB1bmRlZmluZWQgPyBpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdztcbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2wgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2wgPT09IHVuZGVmaW5lZCA/IGogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRSb3dIZWlnaHQgPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICBoZWlnaHQgPSBbXSxcbiAgICAgICAgICAgIGN1cnJIZWlnaHQsXG4gICAgICAgICAgICBtYXhIZWlnaHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heEhlaWdodCA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtpXS5sZW5ndGg7IGogPCBsZW5Db2w7IGorKykge1xuICAgICAgICAgICAgICAgIGlmKHNoYWRvd01hdHJpeFtpXVtqXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJySGVpZ2h0ID0gc2hhZG93TWF0cml4W2ldW2pdLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gbWF4SGVpZ2h0IDwgY3VyckhlaWdodCA/IGN1cnJIZWlnaHQgOiBtYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGVpZ2h0W2ldID0gbWF4SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Q29sV2lkdGggPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBsZW5Sb3cgPSBzaGFkb3dNYXRyaXggJiYgc2hhZG93TWF0cml4Lmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNvbCxcbiAgICAgICAgICAgIHdpZHRoID0gW10sXG4gICAgICAgICAgICBjdXJyV2lkdGgsXG4gICAgICAgICAgICBtYXhXaWR0aDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2pdLmxlbmd0aDsgaSA8IGxlbkNvbDsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4V2lkdGggPSAwOyBqIDwgbGVuUm93OyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hhZG93TWF0cml4W2pdW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJXaWR0aCA9IHNoYWRvd01hdHJpeFtqXVtpXS53aWR0aDsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IG1heFdpZHRoIDwgY3VycldpZHRoID8gY3VycldpZHRoIDogbWF4V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2lkdGhbaV0gPSBtYXhXaWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgubWF0cml4TWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgc2hhZG93TWF0cml4ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgcm93U3BhbixcbiAgICAgICAgICAgIGNvbFNwYW4sXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIGRlZmF1bHRIID0gbWF0cml4LmRlZmF1bHRILFxuICAgICAgICAgICAgZGVmYXVsdFcgPSBtYXRyaXguZGVmYXVsdFcsXG4gICAgICAgICAgICBvZmZzZXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJvd1NwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4pIHx8IDE7XG4gICAgICAgICAgICAgICAgY29sU3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbikgfHwgMTsgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aWR0aCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ud2lkdGgpO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gKHdpZHRoICYmICh3aWR0aCAvIGNvbFNwYW4pKSB8fCBkZWZhdWx0VztcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICt3aWR0aC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IChoZWlnaHQgJiYgKGhlaWdodCAvIHJvd1NwYW4pKSB8fCBkZWZhdWx0SDsgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gK2hlaWdodC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMCwgb2Zmc2V0ID0gMDsgayA8IHJvd1NwYW47IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGwgPSAwOyBsIDwgY29sU3BhbjsgbCsrKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga10gPSBzaGFkb3dNYXRyaXhbaSArIGtdID8gc2hhZG93TWF0cml4W2kgKyBrXSA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gaiArIGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgOiAoaSArICctJyArIGopLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNoYWRvd01hdHJpeDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0QmxvY2sgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIgPSBwbGFjZUhvbGRlci5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChwbGFjZUhvbGRlcltpXVtqXS5jb25maWcuaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBsYWNlSG9sZGVyW2ldW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC51cGRhdGUgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBsZW5Db25maWdSLFxuICAgICAgICAgICAgbGVuQ29uZmlnQyxcbiAgICAgICAgICAgIGxlblBsYWNlSGxkclIsXG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJDLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lciwgICAgICAgICAgICBcbiAgICAgICAgICAgIHJlY3ljbGVkQ2VsbDtcblxuICAgICAgICB3aGlsZShjb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoY29udGFpbmVyLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZW5QbGFjZUhsZHJSID0gcGxhY2VIb2xkZXIubGVuZ3RoO1xuXG4gICAgICAgIGZvcihpID0gbGVuUGxhY2VIbGRyUiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJDID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGogPSBsZW5QbGFjZUhsZHJDIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpZihwbGFjZUhvbGRlcltpXVtqXS5jaGFydCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBtYXRyaXguZGlzcG9zYWxCb3guY29uY2F0KHBsYWNlSG9sZGVyW2ldLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGxhY2VIb2xkZXJbaV1bal07XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYWNlSG9sZGVyLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5Db25maWdSID0gY29uZmlnTWFuYWdlci5sZW5ndGg7IGkgPCBsZW5Db25maWdSOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkNvbmZpZ0MgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkNvbmZpZ0M7IGorKykge1xuICAgICAgICAgICAgICAgIGlmKGNvbmZpZ01hbmFnZXJbaV1bal0uY2hhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjeWNsZWRDZWxsID0gbWF0cml4LmRpc3Bvc2FsQm94LnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZWN5Y2xlZENlbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gcmVjeWNsZWRDZWxsLnVwZGF0ZShjb25maWdNYW5hZ2VyW2ldW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAgICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbi8vICAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4vLyAgICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuLy8gICAgICAgICAgICAgbGVuID0gY29uZmlnTWFuYWdlciAmJiBjb25maWdNYW5hZ2VyLmxlbmd0aCxcbi8vICAgICAgICAgICAgIGxlbkMsXG4vLyAgICAgICAgICAgICBsZW5QbGNIbGRyLFxuLy8gICAgICAgICAgICAgaSxcbi8vICAgICAgICAgICAgIGosXG4vLyAgICAgICAgICAgICBrLFxuLy8gICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuLy8gICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuLy8gICAgICAgICAgICAgZGlzcG9zYWxCb3hDaGFydCA9IG1hdHJpeC5kaXNwb3NhbEJveENoYXJ0ID0gW10sXG4vLyAgICAgICAgICAgICBkaXNwb3NhbEJveEdlbiA9IG1hdHJpeC5kaXNwb3NhbEJveEdlbiA9IFtdLFxuLy8gICAgICAgICAgICAgcmVjeWNsZWRDZWxsLFxuLy8gICAgICAgICAgICAgbm9kZSA9IHBhcmVudENvbnRhaW5lcjtcblxuLy8gICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbi8vICAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgbGVuUGxjSGxkciA9IHBsYWNlSG9sZGVyLmxlbmd0aDtcbi8vICAgICAgICAgZm9yIChrID0gMDsgayA8IGxlblBsY0hsZHI7IGsrKykge1xuLy8gICAgICAgICAgICAgbGVuQyA9IHBsYWNlSG9sZGVyW2tdLmxlbmd0aDtcbi8vICAgICAgICAgICAgIGZvcihqID0gbGVuQyAtIDE7IGogPj0gMCA7IGotLSkge1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2tdW2pdLmNoYXJ0ICYmIChkaXNwb3NhbEJveENoYXJ0ID0gZGlzcG9zYWxCb3hDaGFydC5jb25jYXQocGxhY2VIb2xkZXJba10ucG9wKCkpKTtcbi8vICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltrXVtqXSAmJiAocGxhY2VIb2xkZXJba11bal0uY2hhcnQgfHwgKGRpc3Bvc2FsQm94R2VuID0gXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWxCb3hHZW4uY29uY2F0KHBsYWNlSG9sZGVyW2tdLnBvcCgpKSkpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9ICAgICAgICBcbi8vICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHsgICAgXG4vLyAvKiAgICAgICAgICAgIGlmKCFwbGFjZUhvbGRlcltpXSkge1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4vLyAgICAgICAgICAgICB9Ki9cbi8vICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4vLyAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4vLyAgICAgICAgICAgICAgICAgaWYocGxhY2VIb2xkZXJbaV1bal0pIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0udXBkYXRlKGNvbmZpZ01hbmFnZXJbaV1bal0pO1xuLy8gICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQocGxhY2VIb2xkZXJbaV1bal0uZ3JhcGhpY3MpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAgICAgICAgICAgICAgICAgICBcbi8vICAgICAgICAgICAgICAgICAgICAgY29uZmlnTWFuYWdlcltpXVtqXS5jaGFydCAmJiAocmVjeWNsZWRDZWxsID0gZGlzcG9zYWxCb3hDaGFydC5wb3AoKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ01hbmFnZXJbaV1bal0uY2hhcnQgfHwgKHJlY3ljbGVkQ2VsbCA9IGRpc3Bvc2FsQm94R2VuLnBvcCgpKVxuLy8gICAgICAgICAgICAgICAgICAgICBpZihyZWN5Y2xlZENlbGwpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coMTEsJ3VwZGF0ZScsY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQocGxhY2VIb2xkZXJbaV1bal0uZ3JhcGhpY3MpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coMjIsJ25ldycsY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbi8vICAgICAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIC8qfSovXG4vLyAgICAgICAgICAgICB9XG5cbi8vIC8qICAgICAgICAgICAgbGVuUGxjSGxkciA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDtcbi8vICAgICAgICAgICAgIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDtcblxuLy8gICAgICAgICAgICAgZm9yIChrID0gbGVuUGxjSGxkciAtIDE7IGsgPj0gbGVuQzsgay0tKSB7XG4vLyAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1ba10uY2hhcnQgJiYgKGRpc3Bvc2FsQm94Q2hhcnQgPSBkaXNwb3NhbEJveENoYXJ0LmNvbmNhdChwbGFjZUhvbGRlcltpXS5wb3AoKSkpO1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2tdICYmIChwbGFjZUhvbGRlcltpXVtrXS5jaGFydCB8fCAoZGlzcG9zYWxCb3hHZW4gPSBcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhbEJveEdlbi5jb25jYXQocGxhY2VIb2xkZXJbaV0ucG9wKCkpKSk7XG4vLyAgICAgICAgICAgICB9Ki9cbi8vICAgICAgICAgfVxuLy8gLyogICAgICAgIGZvcihpID0gMCwgbGVuID0gZGlzcG9zYWxCb3gubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbi8vICAgICAgICAgICAgIGlmKGRpc3Bvc2FsQm94W2ldICE9PSB1bmRlZmluZWQpIHtcbi8vICAgICAgICAgICAgICAgICBkaXNwb3NhbEJveFtpXS5jaGFydCAmJiBkaXNwb3NhbEJveFtpXS5jaGFydC5jaGFydE9iai5kaXNwb3NlKCk7XG4vLyAgICAgICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyLnJlbW92ZUNoaWxkKGRpc3Bvc2FsQm94W2ldICYmIGRpc3Bvc2FsQm94W2ldLmdyYXBoaWNzKTtcbi8vICAgICAgICAgICAgICAgICBkZWxldGUgZGlzcG9zYWxCb3hbaV07XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBkZWxldGUgZGlzcG9zYWxCb3hbaV07XG4vLyAgICAgICAgIH0qLyAgIFxuLy8gICAgIH07XG5cblxuXG4gICAgcHJvdG9NYXRyaXguZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBub2RlICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgbGVuUjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gcGxhY2VIb2xkZXIgJiYgcGxhY2VIb2xkZXIubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0gJiYgcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQgJiYgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmogJiYgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSAnMHB4JztcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhcmd1bWVudHNbMF0sYXJndW1lbnRzWzFdKTtcbiAgICB9O1xufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcbiAgICBcbiAgICAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG4gICAgdmFyIGdsb2JhbCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBnbG9iYWwud2luLFxuXG4gICAgICAgIG9iamVjdFByb3RvVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBhcnJheVRvU3RyaW5nSWRlbnRpZmllciA9IG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChbXSksXG4gICAgICAgIGlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKG9iaikgPT09IGFycmF5VG9TdHJpbmdJZGVudGlmaWVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEEgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGFic3RyYWN0aW9uIGxheWVyIHNvIHRoYXQgdGhlIHRyeS1jYXRjaCAvXG4gICAgICAgIC8vIGVycm9yIHN1cHByZXNzaW9uIG9mIGZsYXNoIGNhbiBiZSBhdm9pZGVkIHdoaWxlIHJhaXNpbmcgZXZlbnRzLlxuICAgICAgICBtYW5hZ2VkRm5DYWxsID0gZnVuY3Rpb24gKGl0ZW0sIHNjb3BlLCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gV2UgY2hhbmdlIHRoZSBzY29wZSBvZiB0aGUgZnVuY3Rpb24gd2l0aCByZXNwZWN0IHRvIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IHRoYXQgcmFpc2VkIHRoZSBldmVudC5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXRlbVswXS5jYWxsKHNjb3BlLCBldmVudCwgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgYWxsIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBpbnZva2VkIHVwb24gdHJpZ2dlclxuICAgICAgICAvLyBvZiBhbiBldmVudC5cbiAgICAgICAgc2xvdExvYWRlciA9IGZ1bmN0aW9uIChzbG90LCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlcy5cbiAgICAgICAgICAgIHZhciBpID0gMCwgc2NvcGU7XG5cbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgbG9vayBmb3IgbWF0Y2ggd2l0aCByZXNwZWN0IHRvXG4gICAgICAgICAgICAvLyB0eXBlIGFuZCBiaW5kaW5nLlxuICAgICAgICAgICAgZm9yICg7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoIGZvdW5kIHcuci50LiB0eXBlIGFuZCBiaW5kLCB3ZSBmaXJlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgfHwgc2xvdFtpXVsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBzZW5kZXIgb2YgdGhlIGV2ZW50IGZvciBnbG9iYWwgZXZlbnRzLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlIG9mIHNjb3BlIGRpZmZlcmVzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xvYmFsIG9yIGEgbG9jYWwgZXZlbnQgaXMgYmVpbmcgcmFpc2VkLlxuICAgICAgICAgICAgICAgICAgICBzY29wZSA9IHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciA/XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zZW5kZXIgOiBnbG9iYWw7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEZuQ2FsbChzbG90W2ldLCBzY29wZSwgZXZlbnQsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIHdhbnRlZCB0byBkZXRhY2ggdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kZXRhY2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kZXRhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBwcm9wYWdhdGlvbiBmbGFnIGlzIHNldCB0byBmYWxzZSBhbmQgZGlzY29udG51ZVxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpZiBuZWVkZWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNhbmNlbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXZlbnRNYXAgPSB7XG4gICAgICAgICAgICBob3ZlcmluIDogJ2RhdGFwbG90cm9sbG92ZXInLFxuICAgICAgICAgICAgaG92ZXJvdXQgOiAnZGF0YXBsb3Ryb2xsb3V0JyxcbiAgICAgICAgICAgIGNsaWsgOiAnZGF0YXBsb3RjbGljaydcbiAgICAgICAgfSxcbiAgICAgICAgcmFpc2VFdmVudCxcblxuICAgICAgICBFdmVudFRhcmdldCA9IHtcblxuICAgICAgICAgICAgdW5wcm9wYWdhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmNhbmNlbGxlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXRhY2hlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kZXRhY2hlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRlZmF1bHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5wcmV2ZW50ZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpcmUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMuXG4gICAgICAgICAgICBsaXN0ZW5lcnM6IHt9LFxuXG4gICAgICAgICAgICAvLyBUaGUgbGFzdCByYWlzZWQgZXZlbnQgaWQuIEFsbG93cyB0byBjYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgaWQuXG4gICAgICAgICAgICBsYXN0RXZlbnRJZDogMCxcblxuICAgICAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlY3Vyc2VSZXR1cm4sXG4gICAgICAgICAgICAgICAgICAgIEZDRXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpO1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuLnB1c2goRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZVJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSBhZGRlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBoYXMgbm90IGJlZW4gcHJvdmlkZWQgd2hpbGUgYWRkaW5nIGFuIGV2ZW50IGxpc3RlbmVyLiBFbnN1cmUgdGhhdCB5b3UgcGFzcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIGBzdHJpbmdgIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgb2Yge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NDlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NDknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEl0IHdpbGwgbm90IGV2YWwgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTUwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTUwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zZXJ0aW9uIHBvc2l0aW9uIGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgdGhlbiBjcmVhdGUgb25lLlxuICAgICAgICAgICAgICAgIGlmICghKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ucHVzaChbbGlzdGVuZXIsIGJpbmRdKTtcblxuICAgICAgICAgICAgICAgIC8vIEV2ZW50cyBvZiBmdXNpb25DaGFydCByYWlzZWQgdmlhIE11bHRpQ2hhcnRpbmcuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xufSk7Il19

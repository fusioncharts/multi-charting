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
        multiChartingProto = MultiCharting.prototype,
        win = multiChartingProto.win, // keep a local reference of window scope

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
            i,
            eventList = ['onloadstart', 'ondurationchange', 'onloadedmetadata', 'onloadeddata', 'onprogress',
                'oncanplay', 'oncanplaythrough', 'onabort', 'onerror', 'ontimeout', 'onloadend'];

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

        eventList.forEach(function (eventName) {
            xmlhttp[eventName] = function (event) {
                multiChartingProto.raiseEvent(eventName, {
                    Event : event
                }, wrapper);
            };
        });

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
        COLOR = 'color',
        PALETTECOLORS = 'paletteColors';
    //function to convert data, it returns fc supported JSON
    var DataAdapter = function () {
        var argument = arguments[0] || {},
            dataadapter = this;

        dataadapter.dataStore = argument.datastore;       
        dataadapter.dataJSON = dataadapter.dataStore && dataadapter.dataStore.datagetJSON();
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
            callback = dataadapter.callback,
            isMetaData = dataadapter.dataStore && (dataadapter.dataStore.getMetaData() ? true : false);
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
        return isMetaData ? dataadapter.setDefaultAttr(json) : json;
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
            paletteColors = '',
            dataStore = dataadapter.dataStore,
            conf = dataadapter && dataadapter.configuration,
            measure = conf && conf.measure || [],
            metaData = dataStore && dataStore.getMetaData(),
            metaDataMeasure,
            seriesType = conf && conf.seriesType,
            series = {
                'ss' : function() {
                    metaDataMeasure = metaData[measure[0]] && metaData[measure[0]];
                    metaDataMeasure[COLOR] && (paletteColors = paletteColors + 
                                                        ((metaDataMeasure[COLOR] instanceof Function) ?
                                                                            metaDataMeasure[COLOR]() :
                                                                            metaDataMeasure[COLOR]));
                    json.chart[PALETTECOLORS] = paletteColors;
                },
                'ms' : function () {
                    var i,
                    len = json.dataset.length;
                    for (i = 0; i < len; i++){
                        metaDataMeasure = metaData[measure[i]] && metaData[measure[i]];

                        metaDataMeasure[COLOR] && (json.dataset[i][COLOR] = 
                                                        ((metaDataMeasure[COLOR] instanceof Function) ?
                                                                                metaDataMeasure[COLOR]() :
                                                                                metaDataMeasure[COLOR]));
                    }
                },
                'ts' : function () {
                    var i,
                        len = json.chart.datasets[0].dataset[0].series.length,
                        color;

                    for(i = 0; i < len; i++) {
                        metaDataMeasure = metaData[measure[i]] && metaData[measure[i]];
                        color = metaDataMeasure[COLOR] && (json.dataset[i][COLOR] = 
                                                            ((metaDataMeasure[COLOR] instanceof Function) ?
                                                                                metaDataMeasure[COLOR]() :
                                                                                metaDataMeasure[COLOR]));
                        color && (json.chart.datasets[0].dataset[0].series[i].plot[COLOR] = color);
                    }
                }
            };

        seriesType = seriesType && seriesType.toLowerCase();
        seriesType = (series[seriesType] && seriesType) || 'ms';

        json.chart || (json.chart = {});
        
        keyExcludedJsonStr = (metaData && JSON.stringify(json, function(k,v){
            if(k == 'color') {
                return NULL;
            }
            return v;
        })) || undefined;

        json = (keyExcludedJsonStr && JSON.parse(keyExcludedJsonStr)) || json;

        series[seriesType]();

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
        return conf.measure && conf.dimension && series[seriesType](jsonData, conf);
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

    MultiCharting.prototype.dataAdapter = function () {
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
        if(chart.chartObj.chartType() == 'axis') {
            chart.chartObj.dispose();
            //render FC 
            chart.chartObj = new FusionCharts(chart.chartConfig);
            chart.chartObj.render();
        } else {
            chart.chartObj.chartType(chart.chartConfig.type);
            chart.chartObj.setJSONData(chart.chartConfig.dataSource);
        }
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
        ID = 'id-fc-mc-',
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
FusionCharts.register('module', ['private', 'modules.renderer.js-extension-axis',
    function () {

        var global = this,
            lib = global.hcLib,
            chartAPI = lib.chartAPI,
            pluckNumber = lib.pluckNumber,
            pluck = lib.pluck,
            getAxisLimits = lib.getAxisLimits;

        chartAPI ('axis', {
            standaloneInit : true,
            friendlyName : 'axis'
        }, chartAPI.drawingpad);

        FusionCharts.register('component', ['extension', 'drawaxis', {
            type : 'drawingpad',

            init : function (chart) {
                var extension = this,
                    components = chart.components,
                    axisConfig = extension.axisConfig || (extension.axisConfig = {}),
                    chartInstance = chart.chartInstance;

                components.axis || (components.axis = new (FusionCharts.getComponent('main', 'axis'))());
                extension.chart = chart;

                chartInstance.setAxis = extension.setAxis = function (data, draw) {
                    if (axisConfig.axisType === 'y') {
                        axisConfig.min = data[0];
                        axisConfig.max = data[1];
                    }
                    else {
                        axisConfig.min = 0;
                        axisConfig.max = data.length - 1;
                        axisConfig.category = data;
                    }
                    

                    return draw &&  extension.draw();
                };

                chartInstance.getLimits = function () {
                    return [axisConfig.minLimit, axisConfig.maxLimit];
                }
            },

            configure : function () {
                var extension = this,
                    axisConfig = extension.axisConfig,
                    chart = extension.chart,
                    config = chart.config,
                    jsonData = chart.jsonData.chart,
                    axisType,
                    isAxisOpp,
                    canvasBorderThickness,
                    borderThickness,
                    args = chart.chartInstance.args,
                    isYaxis,
                    canvasPaddingLeft = pluckNumber(jsonData.canvaspaddingleft, jsonData.canvaspadding),
                    canvasPaddingRight = pluckNumber(jsonData.canvaspaddingright, jsonData.canvaspadding);

                chart._manageSpace();
                canvasBorderThickness = pluckNumber(config.canvasborderthickness, 0);
                borderThickness = pluckNumber(config.borderthickness, 0);

                axisType = axisConfig.axisType = pluck(args.axisType, 'y');
                isYaxis = axisType === 'y';

                extension.setAxis(isYaxis ? [jsonData.dataMin, jsonData.dataMax] : chart.jsonData.categories, false);

                isAxisOpp = axisConfig.isAxisOpp = pluckNumber(jsonData.isaxisopposite, 0);

                axisConfig.top = isYaxis ? config.marginTop + canvasBorderThickness + borderThickness :
                    (isAxisOpp ? config.height - pluckNumber(jsonData.chartbottommargin, 0) :
                        pluckNumber(jsonData.charttopmargin, 0));
                
                axisConfig.left = isYaxis ? (isAxisOpp ? pluckNumber(jsonData.chartrightmargin, 0) :
                    config.width - pluckNumber(jsonData.chartrightmargin, 0)) :
                        (config.marginLeft + canvasBorderThickness + borderThickness + canvasPaddingLeft);

                axisConfig.height = config.height - config.marginTop - config.marginBottom -
                    2 * canvasBorderThickness - 2 * borderThickness;

                axisConfig.divline = pluckNumber(jsonData.numdivlines, 4);

                axisConfig.axisLen = config.width - config.marginRight - config.marginLeft -
                    2 * canvasBorderThickness - 2 * borderThickness - canvasPaddingLeft - canvasPaddingRight;
            },

            draw : function(){
                var extension = this,
                    chart = extension.chart,
                    components = chart.components,
                    paper = components.paper,
                    axis = components.axis,
                    axisConfig = extension.axisConfig,
                    incrementor,
                    maxLimit,
                    limits,
                    divGap,
                    labels = [],
                    categoryValues = [],
                    top,
                    left,
                    min,
                    max,
                    numberFormatter = components.numberFormatter,
                    axisIntervals = axis.getScaleObj().getIntervalObj().getConfig('intervals'),
                    minLimit;

                max = axisConfig.max || 1;
                min = axisConfig.min || 0;
                left = axisConfig.left;
                top = axisConfig.top;

                axis.getScaleObj().setConfig('graphics', {
                    paper: paper
                });
                axis.setRange(max,min);
                axis.setAxisPosition(left,top);

                if (axisConfig.axisType == 'x') {

                    minLimit = min;
                    maxLimit = max;
                    axis.setAxisLength(axisConfig.axisLen);

                    for (i = 0; i <= max; i++) {
                        labels.push(i);
                    }
                    categoryValues = axisConfig.category || ['start', 'end'];

                    axisIntervals.major.formatter = function (value) {
                        return categoryValues[value];
                    };
                }
                else {
                    axis.setAxisLength(axisConfig.height);
                    axis.getScaleObj().setConfig('vertical', true);

                    limits = getAxisLimits(max, min, null, null, true, true, axisConfig.divline, true);
                    divGap = limits.divGap;
                    maxLimit = limits.Max;
                    minLimit = incrementor = limits.Min;

                    while (incrementor <= maxLimit) {
                        labels.push(incrementor);
                        incrementor += divGap;
                    }

                    axisIntervals.major.formatter = function (value) {
                        return numberFormatter.yAxis(value);
                    };
                }

                axisConfig.isAxisOpp && axis.getScaleObj().setConfig('opposite', true);
                axisIntervals.major.drawTicks= true;
                axisConfig.maxLimit = maxLimit;
                axisConfig.minLimit = minLimit;

                axis.getScaleObj().getIntervalObj().manageIntervals = function () {
                    var intervals = this.getConfig('intervals'),
                        scale = this.getConfig('scale'),
                        intervalPoints = intervals.major.intervalPoints = [],
                        i,
                        len;

                    scale.setRange(maxLimit, minLimit);

                    for (i = 0, len = labels.length; i < len; i += 1) {
                        intervalPoints.push(labels[i]);
                    }

                    return this;
                };
                axis.draw();

                return [minLimit, maxLimit];
            }
        }]);
    }
]);

FusionCharts.register('module', ['private', 'modules.renderer.js-extension-caption',
    function() {

        var global = this,
            lib = global.hcLib,
            chartAPI = lib.chartAPI;

        chartAPI('caption', {
            standaloneInit: true,
            friendlyName: 'caption'
        }, chartAPI.drawingpad);

        FusionCharts.register('component', ['extension', 'caption', {
            type: 'drawingpad',

            inhereitBaseExtension: true,

            init: function(chart) {
                var extension = this,
                    iapi = extension.chart;
                extension.chart = chart;
            },
            draw: function() {
                var extension = this,
                    iapi = extension.chart,
                    config = iapi.config,
                    Caption = FusionCharts.register('component', ['caption', 'caption']),
                    components = iapi.components || (iapi.components = {}),
                    caption = components.caption,
                    captionConfig = caption.config;

                iapi._manageSpace();
                iapi._postSpaceManagement();
                config.canvasLeft = config.origMarginLeft;
                caption || (caption = new Caption());
                caption.init();
                caption.chart = iapi;
                caption.configure();
                caption.manageSpace(config.height,config.width);
                captionConfig.drawCaption = true;
                caption.managePosition();
                caption && caption.draw();
            }
        }]);
    }
]);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsImNvbW1vbi1heGlzLmpzIiwiY29tbW9uLWNhcHRpb24uanMiLCJtdWx0aWNoYXJ0aW5nLmV2ZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNdWx0aUNoYXJ0aW5nIEV4dGVuc2lvbiBmb3IgRnVzaW9uQ2hhcnRzXG4gKiBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgYmFzaWMgcm91dGluZXMgcmVxdWlyZWQgYnkgc3Vic2VxdWVudCBtb2R1bGVzIHRvXG4gKiBleHRlbmQvc2NhbGUgb3IgYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIE11bHRpQ2hhcnRpbmcgb2JqZWN0LlxuICpcbiAqL1xuXG4gLyogZ2xvYmFsIHdpbmRvdzogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGVudiwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGVudi5kb2N1bWVudCA/XG4gICAgICAgICAgICBmYWN0b3J5KGVudikgOiBmdW5jdGlvbih3aW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpbi5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KHdpbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5NdWx0aUNoYXJ0aW5nID0gZmFjdG9yeShlbnYsIHRydWUpO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKF93aW5kb3csIHdpbmRvd0V4aXN0cykge1xuICAgIC8vIEluIGNhc2UgTXVsdGlDaGFydGluZyBhbHJlYWR5IGV4aXN0cy5cbiAgICBpZiAoX3dpbmRvdy5NdWx0aUNoYXJ0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgTXVsdGlDaGFydGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luID0gX3dpbmRvdztcblxuICAgIGlmICh3aW5kb3dFeGlzdHMpIHtcbiAgICAgICAgX3dpbmRvdy5NdWx0aUNoYXJ0aW5nID0gTXVsdGlDaGFydGluZztcbiAgICB9XG4gICAgcmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZW5kMiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYpIHtcbiAgICAgICAgICAgIHZhciBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcbiAgICAgICAgICAgIC8vaWYgbm9uZSBvZiB0aGUgYXJndW1lbnRzIGFyZSBvYmplY3QgdGhlbiByZXR1cm4gYmFja1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcgJiYgdHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORyB8fCBvYmoyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgb2JqMSA9IG9iajIgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZShvYmoxLCBvYmoyLCBza2lwVW5kZWYpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGxpYiA9IHtcbiAgICAgICAgICAgIGV4dGVuZDI6IGV4dGVuZDIsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2VcbiAgICAgICAgfTtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgPSAoTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliIHx8IGxpYik7XG5cbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgQWpheCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhamF4ID0gdGhpcyxcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICAgICAgYWpheC5vblN1Y2Nlc3MgPSBhcmd1bWVudC5zdWNjZXNzO1xuICAgICAgICAgICAgYWpheC5vbkVycm9yID0gYXJndW1lbnQuZXJyb3I7XG4gICAgICAgICAgICBhamF4Lm9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBhamF4LmdldChhcmd1bWVudC51cmwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFqYXhQcm90byA9IEFqYXgucHJvdG90eXBlLFxuXG4gICAgICAgIEZVTkNUSU9OID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgTVNYTUxIVFRQID0gJ01pY3Jvc29mdC5YTUxIVFRQJyxcbiAgICAgICAgTVNYTUxIVFRQMiA9ICdNc3htbDIuWE1MSFRUUCcsXG4gICAgICAgIEdFVCA9ICdHRVQnLFxuICAgICAgICBYSFJFUUVSUk9SID0gJ1htbEh0dHByZXF1ZXN0IEVycm9yJyxcbiAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG4gICAgICAgIHdpbiA9IG11bHRpQ2hhcnRpbmdQcm90by53aW4sIC8vIGtlZXAgYSBsb2NhbCByZWZlcmVuY2Ugb2Ygd2luZG93IHNjb3BlXG5cbiAgICAgICAgLy8gUHJvYmUgSUUgdmVyc2lvblxuICAgICAgICB2ZXJzaW9uID0gcGFyc2VGbG9hdCh3aW4ubmF2aWdhdG9yLmFwcFZlcnNpb24uc3BsaXQoJ01TSUUnKVsxXSksXG4gICAgICAgIGllbHQ4ID0gKHZlcnNpb24gPj0gNS41ICYmIHZlcnNpb24gPD0gNykgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgIGZpcmVmb3ggPSAvbW96aWxsYS9pLnRlc3Qod2luLm5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAvL1xuICAgICAgICAvLyBDYWxjdWxhdGUgZmxhZ3MuXG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHBhZ2UgaXMgb24gZmlsZSBwcm90b2NvbC5cbiAgICAgICAgZmlsZVByb3RvY29sID0gd2luLmxvY2F0aW9uLnByb3RvY29sID09PSAnZmlsZTonLFxuICAgICAgICBBWE9iamVjdCA9IHdpbi5BY3RpdmVYT2JqZWN0LFxuXG4gICAgICAgIC8vIENoZWNrIGlmIG5hdGl2ZSB4aHIgaXMgcHJlc2VudFxuICAgICAgICBYSFJOYXRpdmUgPSAoIUFYT2JqZWN0IHx8ICFmaWxlUHJvdG9jb2wpICYmIHdpbi5YTUxIdHRwUmVxdWVzdCxcblxuICAgICAgICAvLyBQcmVwYXJlIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGNvbXBhdGlibGUgeG1saHR0cHJlcXVlc3QuXG4gICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHhtbGh0dHA7XG5cbiAgICAgICAgICAgIC8vIGlmIHhtbGh0dHByZXF1ZXN0IGlzIHByZXNlbnQgYXMgbmF0aXZlLCB1c2UgaXQuXG4gICAgICAgICAgICBpZiAoWEhSTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgWEhSTmF0aXZlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIGFjdGl2ZVggZm9yIElFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBBWE9iamVjdChNU1hNTEhUVFApO1xuICAgICAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFByZXZlbnRzIGNhY2hlaW5nIG9mIEFKQVggcmVxdWVzdHMuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnSWYtTW9kaWZpZWQtU2luY2UnOiAnU2F0LCAyOSBPY3QgMTk5NCAxOTo0MzozMSBHTVQnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHRoZSBzZXJ2ZXIga25vdyB0aGF0IHRoaXMgaXMgYW4gQUpBWCByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHNlcnZlciBrbm93IHdoaWNoIHdlYiBhcHBsaWNhdGlvbiBpcyBzZW5kaW5nIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLUJ5JzogJ0Z1c2lvbkNoYXJ0cycsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1lbnRpb25zIGNvbnRlbnQtdHlwZXMgdGhhdCBhcmUgYWNjZXB0YWJsZSBmb3IgdGhlIHJlc3BvbnNlLiBTb21lIHNlcnZlcnMgcmVxdWlyZSB0aGlzIGZvciBBamF4XG4gICAgICAgICAgICAgKiBjb21tdW5pY2F0aW9uLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICd0ZXh0L3BsYWluLCAqLyonLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgTUlNRSB0eXBlIG9mIHRoZSBib2R5IG9mIHRoZSByZXF1ZXN0IGFsb25nIHdpdGggaXRzIGNoYXJzZXQuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCdcbiAgICAgICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmFqYXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQWpheChhcmd1bWVudHNbMF0pO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZ2V0ID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB2YXIgd3JhcHBlciA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gd3JhcHBlci54bWxodHRwLFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjayA9IHdyYXBwZXIub25FcnJvcixcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayA9IHdyYXBwZXIub25TdWNjZXNzLFxuICAgICAgICAgICAgeFJlcXVlc3RlZEJ5ID0gJ1gtUmVxdWVzdGVkLUJ5JyxcbiAgICAgICAgICAgIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgZXZlbnRMaXN0ID0gWydvbmxvYWRzdGFydCcsICdvbmR1cmF0aW9uY2hhbmdlJywgJ29ubG9hZGVkbWV0YWRhdGEnLCAnb25sb2FkZWRkYXRhJywgJ29ucHJvZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICdvbmNhbnBsYXknLCAnb25jYW5wbGF5dGhyb3VnaCcsICdvbmFib3J0JywgJ29uZXJyb3InLCAnb250aW1lb3V0JywgJ29ubG9hZGVuZCddO1xuXG4gICAgICAgIC8vIFgtUmVxdWVzdGVkLUJ5IGlzIHJlbW92ZWQgZnJvbSBoZWFkZXIgZHVyaW5nIGNyb3NzIGRvbWFpbiBhamF4IGNhbGxcbiAgICAgICAgaWYgKHVybC5zZWFyY2goL14oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKS8pICE9PSAtMSAmJlxuICAgICAgICAgICAgICAgIHdpbi5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gLyhodHRwOlxcL1xcL3xodHRwczpcXC9cXC8pKFteXFwvXFw6XSopLy5leGVjKHVybClbMl0pIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBodHRwIG9yIGh0dHBzLCB0aGVuIGl0cyBhIHNhbWUgZG9tYWluIGNhbGwuIE5vIG5lZWQgdG8gdXNlIHJlZ2V4IHRvIGdldFxuICAgICAgICAgICAgLy8gZG9tYWluLiBJZiBpdCBjb250YWlucyB0aGVuIGNoZWNrcyBkb21haW4uXG4gICAgICAgICAgICBkZWxldGUgaGVhZGVyc1t4UmVxdWVzdGVkQnldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIWhhc093bi5jYWxsKGhlYWRlcnMsIHhSZXF1ZXN0ZWRCeSkgJiYgKGhlYWRlcnNbeFJlcXVlc3RlZEJ5XSA9ICdGdXNpb25DaGFydHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgheG1saHR0cCB8fCBpZWx0OCB8fCBmaXJlZm94KSB7XG4gICAgICAgICAgICB4bWxodHRwID0gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHdyYXBwZXIueG1saHR0cCA9IHhtbGh0dHA7XG4gICAgICAgIH1cblxuICAgICAgICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHhtbGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICgoIXhtbGh0dHAuc3RhdHVzICYmIGZpbGVQcm90b2NvbCkgfHwgKHhtbGh0dHAuc3RhdHVzID49IDIwMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgeG1saHR0cC5zdGF0dXMgPCAzMDApIHx8IHhtbGh0dHAuc3RhdHVzID09PSAzMDQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzID09PSAxMjIzIHx8IHhtbGh0dHAuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHhtbGh0dHAucmVzcG9uc2VUZXh0LCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sobmV3IEVycm9yKFhIUkVRRVJST1IpLCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3cmFwcGVyLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBldmVudExpc3QuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgICAgICB4bWxodHRwW2V2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudChldmVudE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnQgOiBldmVudFxuICAgICAgICAgICAgICAgIH0sIHdyYXBwZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhtbGh0dHAub3BlbihHRVQsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICh4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoaSwgaGVhZGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHhtbGh0dHAuc2VuZCgpO1xuICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gaW5zdGFuY2UueG1saHR0cDtcblxuICAgICAgICBpbnN0YW5jZS5vcGVuID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB4bWxodHRwICYmIHR5cGVvZiB4bWxodHRwLmFib3J0ID09PSBGVU5DVElPTiAmJiB4bWxodHRwLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgICAgICB4bWxodHRwLnJlYWR5U3RhdGUgIT09IDAgJiYgeG1saHR0cC5hYm9ydCgpO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2Uub3BlbiAmJiBpbnN0YW5jZS5hYm9ydCgpO1xuXG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vbkVycm9yO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25TdWNjZXNzO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2UueG1saHR0cDtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9wZW47XG5cbiAgICAgICAgcmV0dXJuIChpbnN0YW5jZSA9IG51bGwpO1xuICAgIH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgLy8gU291cmNlOiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzE1MDQtQXNrLUJlbi1QYXJzaW5nLUNTVi1TdHJpbmdzLVdpdGgtSmF2YXNjcmlwdC1FeGVjLVJlZ3VsYXItRXhwcmVzc2lvbi1Db21tYW5kLmh0bVxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cblxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgZnVuY3Rpb24gQ1NWVG9BcnJheSAoc3RyRGF0YSwgc3RyRGVsaW1pdGVyKSB7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZGVsaW1pdGVyIGlzIGRlZmluZWQuIElmIG5vdCxcbiAgICAgICAgLy8gdGhlbiBkZWZhdWx0IHRvIGNvbW1hLlxuICAgICAgICBzdHJEZWxpbWl0ZXIgPSAoc3RyRGVsaW1pdGVyIHx8IFwiLFwiKTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcmVndWxhciBleHByZXNzaW9uIHRvIHBhcnNlIHRoZSBDU1YgdmFsdWVzLlxuICAgICAgICB2YXIgb2JqUGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgLy8gRGVsaW1pdGVycy5cbiAgICAgICAgICAgICAgICBcIihcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcInxcXFxccj9cXFxcbnxcXFxccnxeKVwiICtcbiAgICAgICAgICAgICAgICAvLyBRdW90ZWQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKD86XFxcIihbXlxcXCJdKig/OlxcXCJcXFwiW15cXFwiXSopKilcXFwifFwiICtcbiAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoW15cXFwiXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJcXFxcclxcXFxuXSopKVwiXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJnaVwiXG4gICAgICAgICAgICApO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgZGF0YS4gR2l2ZSB0aGUgYXJyYXlcbiAgICAgICAgLy8gYSBkZWZhdWx0IGVtcHR5IGZpcnN0IHJvdy5cbiAgICAgICAgdmFyIGFyckRhdGEgPSBbW11dO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgaW5kaXZpZHVhbCBwYXR0ZXJuXG4gICAgICAgIC8vIG1hdGNoaW5nIGdyb3Vwcy5cbiAgICAgICAgdmFyIGFyck1hdGNoZXMgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGxvb3Bpbmcgb3ZlciB0aGUgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXNcbiAgICAgICAgLy8gdW50aWwgd2UgY2FuIG5vIGxvbmdlciBmaW5kIGEgbWF0Y2guXG4gICAgICAgIHdoaWxlIChhcnJNYXRjaGVzID0gb2JqUGF0dGVybi5leGVjKCBzdHJEYXRhICkpe1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBkZWxpbWl0ZXIgdGhhdCB3YXMgZm91bmQuXG4gICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZERlbGltaXRlciA9IGFyck1hdGNoZXNbIDEgXTtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZ2l2ZW4gZGVsaW1pdGVyIGhhcyBhIGxlbmd0aFxuICAgICAgICAgICAgLy8gKGlzIG5vdCB0aGUgc3RhcnQgb2Ygc3RyaW5nKSBhbmQgaWYgaXQgbWF0Y2hlc1xuICAgICAgICAgICAgLy8gZmllbGQgZGVsaW1pdGVyLiBJZiBpZCBkb2VzIG5vdCwgdGhlbiB3ZSBrbm93XG4gICAgICAgICAgICAvLyB0aGF0IHRoaXMgZGVsaW1pdGVyIGlzIGEgcm93IGRlbGltaXRlci5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBzdHJNYXRjaGVkRGVsaW1pdGVyLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIChzdHJNYXRjaGVkRGVsaW1pdGVyICE9IHN0ckRlbGltaXRlcilcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIGhhdmUgcmVhY2hlZCBhIG5ldyByb3cgb2YgZGF0YSxcbiAgICAgICAgICAgICAgICAvLyBhZGQgYW4gZW1wdHkgcm93IHRvIG91ciBkYXRhIGFycmF5LlxuICAgICAgICAgICAgICAgIGFyckRhdGEucHVzaCggW10gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIGRlbGltaXRlciBvdXQgb2YgdGhlIHdheSxcbiAgICAgICAgICAgIC8vIGxldCdzIGNoZWNrIHRvIHNlZSB3aGljaCBraW5kIG9mIHZhbHVlIHdlXG4gICAgICAgICAgICAvLyBjYXB0dXJlZCAocXVvdGVkIG9yIHVucXVvdGVkKS5cbiAgICAgICAgICAgIGlmIChhcnJNYXRjaGVzWyAyIF0pe1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgcXVvdGVkIHZhbHVlLiBXaGVuIHdlIGNhcHR1cmVcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHZhbHVlLCB1bmVzY2FwZSBhbnkgZG91YmxlIHF1b3Rlcy5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMiBdLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoIFwiXFxcIlxcXCJcIiwgXCJnXCIgKSxcbiAgICAgICAgICAgICAgICAgICAgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBub24tcXVvdGVkIHZhbHVlLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAzIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciB2YWx1ZSBzdHJpbmcsIGxldCdzIGFkZFxuICAgICAgICAgICAgLy8gaXQgdG8gdGhlIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICBhcnJEYXRhWyBhcnJEYXRhLmxlbmd0aCAtIDEgXS5wdXNoKCBzdHJNYXRjaGVkVmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdGhlIHBhcnNlZCBkYXRhLlxuICAgICAgICByZXR1cm4oIGFyckRhdGEgKTtcbiAgICB9XG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTsiLCIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyXHRtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcblx0XHRsaWIgPSBtdWx0aUNoYXJ0aW5nUHJvdG8ubGliLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlID0ge30sXG5cdFx0b3V0cHV0RGF0YVN0b3JhZ2UgPSBsaWIub3V0cHV0RGF0YVN0b3JhZ2UgPSB7fSxcblx0XHRtZXRhU3RvcmFnZSA9IGxpYi5tZXRhU3RvcmFnZSA9IHt9LFxuXHRcdGV4dGVuZDIgPSBsaWIuZXh0ZW5kMixcblx0XHQvLyBGb3Igc3RvcmluZyB0aGUgY2hpbGQgb2YgYSBwYXJlbnRcblx0XHRsaW5rU3RvcmUgPSB7fSxcblx0XHQvL0ZvciBzdG9yaW5nIHRoZSBwYXJlbnQgb2YgYSBjaGlsZFxuXHRcdHBhcmVudFN0b3JlID0gbGliLnBhcmVudFN0b3JlID0ge30sXG5cdFx0aWRDb3VudCA9IDAsXG5cdFx0Ly8gQ29uc3RydWN0b3IgY2xhc3MgZm9yIERhdGFTdG9yZS5cblx0XHREYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBcdHZhciBtYW5hZ2VyID0gdGhpcztcblx0ICAgIFx0bWFuYWdlci51bmlxdWVWYWx1ZXMgPSB7fTtcblx0ICAgIFx0bWFuYWdlci5zZXREYXRhKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHRkYXRhU3RvcmVQcm90byA9IERhdGFTdG9yZS5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byBleGVjdXRlIHRoZSBkYXRhUHJvY2Vzc29yIG92ZXIgdGhlIGRhdGFcblx0XHRleGVjdXRlUHJvY2Vzc29yID0gZnVuY3Rpb24gKHR5cGUsIGZpbHRlckZuLCBKU09ORGF0YSkge1xuXHRcdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRcdGNhc2UgICdzb3J0JyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUuc29ydC5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGNhc2UgICdmaWx0ZXInIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuXHRcdFx0XHRjYXNlICdtYXAnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuXHRcdFx0XHRkZWZhdWx0IDogcmV0dXJuIGZpbHRlckZuKEpTT05EYXRhKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgYWxsIHRoZSBsaW5rZWQgY2hpbGQgZGF0YVxuXHRcdHVwZGF0YURhdGEgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRcdHBhcmVudERhdGEgPSAob3V0cHV0RGF0YVN0b3JhZ2VbaWRdICYmIG91dHB1dERhdGFTdG9yYWdlW2lkXS5kYXRhKSB8fCBkYXRhU3RvcmFnZVtpZF0sXG5cdFx0XHRcdGZpbHRlclN0b3JlID0gbGliLmZpbHRlclN0b3JlLFxuXHRcdFx0XHRsZW4sXG5cdFx0XHRcdGxpbmtJZHMsXG5cdFx0XHRcdGZpbHRlcnMsXG5cdFx0XHRcdGxpbmtJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0b3V0U3BlY3MsXG5cdFx0XHRcdGRhdGFTdG9yZSxcblx0XHRcdFx0cHJvY2Vzc29yLFxuXHRcdFx0XHQvLyBTdG9yZSBhbGwgdGhlIGRhdGFPYmpzIHRoYXQgYXJlIHVwZGF0ZWQuXG5cdFx0XHRcdHRlbXBEYXRhVXBkYXRlZCA9IGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblxuXHRcdFx0bGlua0lkcyA9IGxpbmtEYXRhLmxpbms7XG5cdFx0XHRmaWx0ZXJzID0gbGlua0RhdGEuZmlsdGVyO1xuXHRcdFx0bGVuID0gbGlua0lkcy5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRkYXRhU3RvcmUgPSBsaW5rSWRzW2ldO1xuXHRcdFx0XHRsaW5rSWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkW2xpbmtJZF0gPSB0cnVlO1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldO1xuXHRcdFx0XHRmaWx0ZXJGbiA9IGZpbHRlci5nZXRQcm9jZXNzb3IoKTtcblx0XHRcdFx0dHlwZSA9IGZpbHRlci50eXBlO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyRm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRpZiAoZmlsdGVyU3RvcmVbZmlsdGVyLmlkXSkge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIHBhcmVudERhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0gPSBwYXJlbnREYXRhO1xuXHRcdFx0XHRcdFx0ZmlsdGVyLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGkgLT0gMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBNb2RpZnlpbmcgZGF0YSBvZiBzZWxmIGFwcGxpZWQgcHJvY2Vzc29yLlxuXHRcdFx0XHRcdGlmIChvdXRTcGVjcyA9ICBvdXRwdXREYXRhU3RvcmFnZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0XHRwcm9jZXNzb3IgPSBvdXRTcGVjcy5wcm9jZXNzb3I7XG5cdFx0XHRcdFx0XHRvdXRwdXREYXRhU3RvcmFnZVtsaW5rSWRdID0gZXhlY3V0ZVByb2Nlc3Nvcihwcm9jZXNzb3IudHlwZSwgcHJvY2Vzc29yLmdldFByb2Nlc3NvcigpLFxuXHRcdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdFx0XHRcdGRhdGFTdG9yZS51bmlxdWVWYWx1ZXMgPSB7fTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShsaW5rSWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRnVuY3Rpb24gdG8gdXBkYXRlIG1ldGFEYXRhIG9mIHRoZSBjaGlsZCBkYXRhIHJlY3Vyc3NpdmVseVxuXHRcdHVwZGF0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGlkLCBtZXRhRGF0YSkge1xuXHRcdFx0dmFyIGxpbmtzID0gbGlua1N0b3JlW2lkXS5saW5rLFxuXHRcdFx0XHRsZW5ndGggPSBsaW5rcy5sZW5ndGgsXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld01ldGFEYXRhLFxuXHRcdFx0XHRsaW5rO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0bGluayA9IGxpbmtzW2ldLmlkO1xuXHRcdFx0XHRuZXdNZXRhRGF0YSA9IG1ldGFTdG9yYWdlW2xpbmtdID0gZXh0ZW5kMih7fSwgbWV0YURhdGEpO1xuXHRcdFx0XHRpZiAobGlua1N0b3JlW2xpbmtdKSB7XG5cdFx0XHRcdFx0dXBkYXRlTWV0YURhdGEobGluaywgbmV3TWV0YURhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRtdWx0aUNoYXJ0aW5nUHJvdG8uY3JlYXRlRGF0YVN0b3JlID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVN0b3JlKGFyZ3VtZW50cyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgaW4gdGhlIGRhdGEgc3RvcmVcblx0ZGF0YVN0b3JlUHJvdG8uc2V0RGF0YSA9IGZ1bmN0aW9uIChkYXRhU3BlY3MsIGNhbGxiYWNrLCBub1JhaXNlRXZlbnRGbGFnKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRvbGRJZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdGlkID0gZGF0YVNwZWNzLmlkLFxuXHRcdFx0ZGF0YVR5cGUgPSBkYXRhU3BlY3MuZGF0YVR5cGUsXG5cdFx0XHRkYXRhU291cmNlID0gZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRvbGRKU09ORGF0YSA9IGRhdGFTdG9yYWdlW29sZElkXSB8fCBbXSxcblx0XHRcdGNhbGxiYWNrSGVscGVyRm4gPSBmdW5jdGlvbiAoSlNPTkRhdGEpIHtcblx0XHRcdFx0ZGF0YVN0b3JhZ2VbaWRdID0gb2xkSlNPTkRhdGEuY29uY2F0KEpTT05EYXRhIHx8IFtdKTtcblx0XHRcdFx0IW5vUmFpc2VFdmVudEZsYWcgJiYgSlNPTkRhdGEgJiYgbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFBZGRlZCcsIHtcblx0XHRcdFx0XHQnaWQnOiBpZCxcblx0XHRcdFx0XHQnZGF0YScgOiBKU09ORGF0YVxuXHRcdFx0XHR9LCBkYXRhU3RvcmUpO1xuXHRcdFx0XHRpZiAobGlua1N0b3JlW2lkXSkge1xuXHRcdFx0XHRcdHVwZGF0YURhdGEoaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhKU09ORGF0YSk7XG5cdFx0XHRcdH1cdFxuXHRcdFx0fTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2RhdGFTdG9yYWdlJyArIGlkQ291bnQgKys7XG5cdFx0ZGF0YVN0b3JlLmlkID0gaWQ7XG5cdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdGRhdGFTdG9yZS51bmlxdWVWYWx1ZXMgPSB7fTtcblxuXHRcdGlmIChkYXRhVHlwZSA9PT0gJ2NzdicpIHtcblx0XHRcdG11bHRpQ2hhcnRpbmdQcm90by5jb252ZXJ0VG9BcnJheSh7XG5cdFx0XHRcdHN0cmluZyA6IGRhdGFTcGVjcy5kYXRhU291cmNlLFxuXHRcdFx0XHRkZWxpbWl0ZXIgOiBkYXRhU3BlY3MuZGVsaW1pdGVyLFxuXHRcdFx0XHRvdXRwdXRGb3JtYXQgOiBkYXRhU3BlY3Mub3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHRjYWxsYmFjayA6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhU291cmNlKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBqc29uZGF0YSBvZiB0aGUgZGF0YSBvYmplY3Rcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaWQgPSB0aGlzLmlkO1xuXHRcdHJldHVybiAoKG91dHB1dERhdGFTdG9yYWdlW2lkXSAmJiBvdXRwdXREYXRhU3RvcmFnZVtpZF0uZGF0YSkgfHwgZGF0YVN0b3JhZ2VbaWRdKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgY2hpbGQgZGF0YSBvYmplY3QgYWZ0ZXIgYXBwbHlpbmcgZmlsdGVyIG9uIHRoZSBwYXJlbnQgZGF0YS5cblx0Ly8gQHBhcmFtcyB7ZmlsdGVyc30gLSBUaGlzIGNhbiBiZSBhIGZpbHRlciBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBmaWx0ZXIgZnVuY3Rpb25zLlxuXHRkYXRhU3RvcmVQcm90by5nZXREYXRhID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGEuaWQsXG5cdFx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbms7XG5cdFx0Ly8gSWYgbm8gcGFyYW1ldGVyIGlzIHByZXNlbnQgdGhlbiByZXR1cm4gdGhlIHVuZmlsdGVyZWQgZGF0YS5cblx0XHRpZiAoIWZpbHRlcnMpIHtcblx0XHRcdHJldHVybiBkYXRhU3RvcmFnZVtpZF07XG5cdFx0fVxuXHRcdC8vIElmIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvZiBmaWx0ZXIgdGhlbiByZXR1cm4gdGhlIGZpbHRlcmVkIGRhdGEgYWZ0ZXIgYXBwbHlpbmcgdGhlIGZpbHRlciBvdmVyIHRoZSBkYXRhLlxuXHRcdGVsc2Uge1xuXHRcdFx0bGV0IHJlc3VsdCA9IFtdLFxuXHRcdFx0XHRpLFxuXHRcdFx0XHRuZXdEYXRhLFxuXHRcdFx0XHRsaW5rRGF0YSxcblx0XHRcdFx0bmV3SWQsXG5cdFx0XHRcdGZpbHRlcixcblx0XHRcdFx0ZmlsdGVyRm4sXG5cdFx0XHRcdGRhdGFsaW5rcyxcblx0XHRcdFx0ZmlsdGVySUQsXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdG5ld0RhdGFPYmosXG5cdFx0XHRcdGlzRmlsdGVyQXJyYXkgPSBmaWx0ZXJzIGluc3RhbmNlb2YgQXJyYXksXG5cdFx0XHRcdGxlbiA9IGlzRmlsdGVyQXJyYXkgPyBmaWx0ZXJzLmxlbmd0aCA6IDE7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldIHx8IGZpbHRlcnM7XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldFByb2Nlc3NvcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdG5ld0RhdGEgPSBleGVjdXRlUHJvY2Vzc29yKHR5cGUsIGZpbHRlckZuLCBkYXRhU3RvcmFnZVtpZF0pO1xuXG5cdFx0XHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFQcm9jZXNzb3JBcHBsaWVkJywge1xuXHRcdFx0XHRcdFx0J2RhdGFTdG9yZSc6IGRhdGEsXG5cdFx0XHRcdFx0XHQnZGF0YVByb2Nlc3NvcicgOiBmaWx0ZXJcblx0XHRcdFx0XHR9LCBkYXRhKTtcblxuXHRcdFx0XHRcdG5ld0RhdGFPYmogPSBuZXcgRGF0YVN0b3JlKHtkYXRhU291cmNlIDogbmV3RGF0YX0pO1xuXHRcdFx0XHRcdG5ld0lkID0gbmV3RGF0YU9iai5pZDtcblxuXHRcdFx0XHRcdC8vUGFzc2luZyB0aGUgbWV0YURhdGEgdG8gdGhlIGNoaWxkLlxuXHRcdFx0XHRcdG5ld0RhdGFPYmouYWRkTWV0YURhdGEobWV0YVN0b3JhZ2VbaWRdKTtcblx0XHRcdFx0XHRwYXJlbnRTdG9yZVtuZXdJZF0gPSBkYXRhO1xuXG5cdFx0XHRcdFx0cmVzdWx0LnB1c2gobmV3RGF0YU9iaik7XG5cblx0XHRcdFx0XHQvL1B1c2hpbmcgdGhlIGlkIGFuZCBmaWx0ZXIgb2YgY2hpbGQgY2xhc3MgdW5kZXIgdGhlIHBhcmVudCBjbGFzc2VzIGlkLlxuXHRcdFx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSB8fCAobGlua1N0b3JlW2lkXSA9IHtcblx0XHRcdFx0XHRcdGxpbmsgOiBbXSxcblx0XHRcdFx0XHRcdGZpbHRlciA6IFtdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0bGlua0RhdGEubGluay5wdXNoKG5ld0RhdGFPYmopO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmZpbHRlci5wdXNoKGZpbHRlcik7XG5cblx0XHRcdFx0XHQvLyBTdG9yaW5nIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCB1bmRlciB0aGUgZmlsdGVyIGlkLlxuXHRcdFx0XHRcdGZpbHRlcklEID0gZmlsdGVyLmdldElEKCk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzID0gZmlsdGVyTGlua1tmaWx0ZXJJRF0gfHwgKGZpbHRlckxpbmtbZmlsdGVySURdID0gW10pO1xuXHRcdFx0XHRcdGRhdGFsaW5rcy5wdXNoKG5ld0RhdGFPYmopO1xuXG5cdFx0XHRcdFx0Ly8gc2V0dGluZyB0aGUgY3VycmVudCBpZCBhcyB0aGUgbmV3SUQgc28gdGhhdCB0aGUgbmV4dCBmaWx0ZXIgaXMgYXBwbGllZCBvbiB0aGUgY2hpbGQgZGF0YTtcblx0XHRcdFx0XHRpZCA9IG5ld0lkO1xuXHRcdFx0XHRcdGRhdGEgPSBuZXdEYXRhT2JqO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gKGlzRmlsdGVyQXJyYXkgPyByZXN1bHQgOiByZXN1bHRbMF0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBkZWxldGUgdGhlIGN1cnJlbnQgZGF0YSBmcm9tIHRoZSBkYXRhU3RvcmFnZSBhbmQgYWxzbyBhbGwgaXRzIGNoaWxkcyByZWN1cnNpdmVseVxuXHRkYXRhU3RvcmVQcm90by5kZWxldGVEYXRhID0gZnVuY3Rpb24gKG9wdGlvbmFsSWQpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhU3RvcmUuaWQsXG5cdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRmbGFnO1xuXG5cdFx0aWYgKGxpbmtEYXRhKSB7XG5cdFx0XHRsZXQgaSxcblx0XHRcdFx0bGluayA9IGxpbmtEYXRhLmxpbmssXG5cdFx0XHRcdGxlbiA9IGxpbmsubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRsaW5rW2ldLmRlbGV0ZURhdGEoKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBsaW5rU3RvcmVbaWRdO1xuXHRcdH1cblxuXHRcdGRlbGV0ZSBtZXRhU3RvcmFnZVtpZF07XG5cdFx0ZGVsZXRlIG91dHB1dERhdGFTdG9yYWdlW2lkXTtcblxuXHRcdGZsYWcgPSBkZWxldGUgZGF0YVN0b3JhZ2VbaWRdO1xuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0cmV0dXJuIGZsYWc7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBpZCBvZiB0aGUgY3VycmVudCBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIG1vZGlmeSBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLm1vZGlmeURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRkYXRhU3RvcmFnZVtpZF0gPSBbXTtcblx0XHRkYXRhU3RvcmUuc2V0RGF0YShkYXRhU3BlY3MsIGNhbGxiYWNrLCB0cnVlKTtcblx0XHRcblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YU1vZGlmaWVkJywge1xuXHRcdFx0J2lkJzogaWRcblx0XHR9LCBkYXRhU3RvcmUpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIHRvIHRoZSBkYXRhU3RvcmFnZSBhc3luY2hyb25vdXNseSB2aWEgYWpheFxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcblx0XHRcdGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG5cdFx0XHRkZWxpbWl0ZXIgPSBhcmd1bWVudC5kZWxpbWl0ZXIsXG5cdFx0XHRvdXRwdXRGb3JtYXQgPSBhcmd1bWVudC5vdXRwdXRGb3JtYXQsXG5cdFx0XHRjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuXHRcdFx0Y2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuXHRcdFx0ZGF0YTtcblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5hamF4KHtcblx0XHRcdHVybCA6IGRhdGFTb3VyY2UsXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuXHRcdFx0XHRkYXRhU3RvcmUuc2V0RGF0YSh7XG5cdFx0XHRcdFx0ZGF0YVNvdXJjZSA6IGRhdGEsXG5cdFx0XHRcdFx0ZGF0YVR5cGUgOiBkYXRhVHlwZSxcblx0XHRcdFx0XHRkZWxpbWl0ZXIgOiBkZWxpbWl0ZXIsXG5cdFx0XHRcdFx0b3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHR9LCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXG5cdFx0XHRlcnJvciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSBrZXlzIG9mIHRoZSBKU09OIGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0S2V5cyA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmUuZ2V0SlNPTigpLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGtleXMgPSBkYXRhU3RvcmUua2V5cztcblxuXHRcdGlmIChrZXlzKSB7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cdFx0aWYgKGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gaW50ZXJuYWxEYXRhKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gT2JqZWN0LmtleXMoaW50ZXJuYWxEYXRhKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IGFsbCB0aGUgdW5pcXVlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEga2V5XG5cdGRhdGFTdG9yZVByb3RvLmdldFVuaXF1ZVZhbHVlcyA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmUuZ2V0SlNPTigpLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGlzQXJyYXkgPSBpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdHVuaXF1ZVZhbHVlcyA9IGRhdGFTdG9yZS51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHRcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZGF0YVN0b3JlLmdldEtleXMoKS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQudG9VcHBlckNhc2UoKSA9PT0ga2V5LnRvVXBwZXJDYXNlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpID0gMDtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSBpc0FycmF5ID8gMSA6IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aW50ZXJuYWxEYXRhID0gaXNBcnJheSA/IGRhdGFbaV1ba2V5XSA6IGRhdGFbaV1ba2V5XTtcblx0XHRcdCF0ZW1wVW5pcXVlVmFsdWVzW2ludGVybmFsRGF0YV0gJiYgKHRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSA9IHRydWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldID0gT2JqZWN0LmtleXModGVtcFVuaXF1ZVZhbHVlcykpO1xuXHR9O1xuXG5cdC8vRnVuY3Rpb24gdG8gY2hhbmdlIHRoZSBvdXRwdXQgb2YgZ2V0SlNPTigpIGJhc2VkIG9uIHRoZSBkYXRhUHJvY2Vzc29yIGFwcGxpZWRcblx0ZGF0YVN0b3JlUHJvdG8uYXBwbHlEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKGRhdGFQcm9jZXNzb3IpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdHByb2Nlc3NvckZuID0gZGF0YVByb2Nlc3Nvci5nZXRQcm9jZXNzb3IoKSxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG91dHB1dCxcblx0XHRcdEpTT05EYXRhID0gZGF0YVN0b3JhZ2VbaWRdO1xuXG5cdFx0aWYgKHR5cGVvZiBwcm9jZXNzb3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0b3V0cHV0ID0gb3V0cHV0RGF0YVN0b3JhZ2VbZGF0YVN0b3JlLmlkXSA9IHtcblx0XHRcdFx0ZGF0YSA6IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgcHJvY2Vzc29yRm4sIEpTT05EYXRhKSxcblx0XHRcdFx0cHJvY2Vzc29yIDogZGF0YVByb2Nlc3NvclxuXHRcdFx0fTtcblxuXHRcdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXG5cdFx0XHRpZiAobGlua1N0b3JlW2lkXSkge1xuXHRcdFx0XHR1cGRhdGFEYXRhKGlkKTtcblx0XHRcdH1cblxuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ3RlbXBFdmVudCcsIHtcblx0XHRcdFx0J2RhdGFTdG9yZSc6IGRhdGFTdG9yZSxcblx0XHRcdFx0J2RhdGFQcm9jZXNzb3InIDogZGF0YVByb2Nlc3NvclxuXHRcdFx0fSwgZGF0YVN0b3JlKTtcblxuXHRcdFx0cmV0dXJuIG91dHB1dC5kYXRhO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgbWV0YWRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uYWRkTWV0YURhdGEgPSBmdW5jdGlvbiAobWV0YURhdGEsIG1lcmdlKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG5ld01ldGFEYXRhO1xuXHRcdGlmIChtZXJnZSkge1xuXHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtpZF0gPSBleHRlbmQyKG1ldGFTdG9yYWdlW2lkXSB8fCB7fSwgbWV0YURhdGEpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdG5ld01ldGFEYXRhID0gbWV0YVN0b3JhZ2VbaWRdID0gbWV0YURhdGE7XG5cdFx0fVxuXHRcdGxpbmtTdG9yZVtpZF0gJiYgdXBkYXRlTWV0YURhdGEoaWQsIG5ld01ldGFEYXRhKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGFkZGVkIG1ldGFEYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldE1ldGFEYXRhID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBtZXRhU3RvcmFnZVt0aGlzLmlkXTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byByZW1vdmUgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG5cdFx0bGliID0gbXVsdGlDaGFydGluZ1Byb3RvLmxpYixcblx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSA9IHt9LFxuXHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluayA9IHt9LFxuXHRcdGZpbHRlcklkQ291bnQgPSAwLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlLFxuXHRcdHBhcmVudFN0b3JlID0gbGliLnBhcmVudFN0b3JlLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhUHJvY2Vzc29yLlxuXHRcdERhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBcdHZhciBtYW5hZ2VyID0gdGhpcztcblx0ICAgIFx0bWFuYWdlci5hZGRSdWxlKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHRcblx0XHRkYXRhUHJvY2Vzc29yUHJvdG8gPSBEYXRhUHJvY2Vzc29yLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSBkYXRhIG9uIGNoYW5nZSBvZiBmaWx0ZXIuXG5cdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yID0gZnVuY3Rpb24gKGlkLCBjb3B5UGFyZW50VG9DaGlsZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGRhdGEgPSBmaWx0ZXJMaW5rW2lkXSxcblx0XHRcdFx0SlNPTkRhdGEsXG5cdFx0XHRcdGRhdHVtLFxuXHRcdFx0XHRkYXRhSWQsXG5cdFx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICsrKSB7XG5cdFx0XHRcdGRhdHVtID0gZGF0YVtpXTtcblx0XHRcdFx0ZGF0YUlkID0gZGF0dW0uaWQ7XG5cdFx0XHRcdGlmICghbGliLnRlbXBEYXRhVXBkYXRlZFtkYXRhSWRdKSB7XG5cdFx0XHRcdFx0aWYgKHBhcmVudFN0b3JlW2RhdGFJZF0gJiYgZGF0YVN0b3JhZ2VbZGF0YUlkXSkge1xuXHRcdFx0XHRcdFx0SlNPTkRhdGEgPSBwYXJlbnRTdG9yZVtkYXRhSWRdLmdldERhdGEoKTtcblx0XHRcdFx0XHRcdGRhdHVtLm1vZGlmeURhdGEoY29weVBhcmVudFRvQ2hpbGQgPyBKU09ORGF0YSA6IGZpbHRlclN0b3JlW2lkXShKU09ORGF0YSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRlbGV0ZSBwYXJlbnRTdG9yZVtkYXRhSWRdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXHRcdH07XG5cblx0bXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhUHJvY2Vzc29yKGFyZ3VtZW50c1swXSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGZpbHRlciBpbiB0aGUgZmlsdGVyIHN0b3JlXG5cdGRhdGFQcm9jZXNzb3JQcm90by5hZGRSdWxlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0b2xkSWQgPSBmaWx0ZXIuaWQsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGZpbHRlckZuID0gKGFyZ3VtZW50ICYmIGFyZ3VtZW50LnJ1bGUpIHx8IGFyZ3VtZW50LFxuXHRcdFx0aWQgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlLFxuXHRcdFx0dHlwZSA9IGFyZ3VtZW50ICYmIGFyZ3VtZW50LnR5cGU7XG5cblx0XHRpZCA9IG9sZElkIHx8IGlkIHx8ICdmaWx0ZXJTdG9yZScgKyBmaWx0ZXJJZENvdW50ICsrO1xuXHRcdGZpbHRlclN0b3JlW2lkXSA9IGZpbHRlckZuO1xuXG5cdFx0ZmlsdGVyLmlkID0gaWQ7XG5cdFx0ZmlsdGVyLnR5cGUgPSB0eXBlO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCBhbmQgYWxzbyBvbiB0aGUgY2hpbGQgZGF0YS5cblx0XHRpZiAoZmlsdGVyTGlua1tpZF0pIHtcblx0XHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvcihpZCk7XG5cdFx0fVxuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckFkZGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0XHQnZGF0YScgOiBmaWx0ZXJGblxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgdGhlIGZpbHRlciBtZXRob2QuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGZpbHRlclN0b3JlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgSUQgb2YgdGhlIGZpbHRlci5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmRlbGV0ZVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckRlbGV0ZWQnLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHR9LCBmaWx0ZXIpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5maWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdmaWx0ZXInXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uc29ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ3NvcnQnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8ubWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnbWFwJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyLFxuICAgICAgICBOVUxMID0gbnVsbCxcbiAgICAgICAgQ09MT1IgPSAnY29sb3InLFxuICAgICAgICBQQUxFVFRFQ09MT1JTID0gJ3BhbGV0dGVDb2xvcnMnO1xuICAgIC8vZnVuY3Rpb24gdG8gY29udmVydCBkYXRhLCBpdCByZXR1cm5zIGZjIHN1cHBvcnRlZCBKU09OXG4gICAgdmFyIERhdGFBZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhYWRhcHRlciA9IHRoaXM7XG5cbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlID0gYXJndW1lbnQuZGF0YXN0b3JlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmRhdGFnZXRKU09OKCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWc7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2s7XG4gICAgICAgIGRhdGFhZGFwdGVyLkZDanNvbiA9IGRhdGFhZGFwdGVyLmNvbnZlcnREYXRhKCk7XG4gICAgfSxcbiAgICBwcm90b0RhdGFhZGFwdGVyID0gRGF0YUFkYXB0ZXIucHJvdG90eXBlO1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5jb252ZXJ0RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLCAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdncmVnYXRlZERhdGEsXG4gICAgICAgICAgICBnZW5lcmFsRGF0YSxcbiAgICAgICAgICAgIGpzb24gPSB7fSxcbiAgICAgICAgICAgIHByZWRlZmluZWRKc29uID0ge30sXG4gICAgICAgICAgICBqc29uRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFKU09OLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjYWxsYmFjayA9IGRhdGFhZGFwdGVyLmNhbGxiYWNrLFxuICAgICAgICAgICAgaXNNZXRhRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiAoZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldE1ldGFEYXRhKCkgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YSA9IGRhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAganNvbiA9IGRhdGFhZGFwdGVyLmpzb25DcmVhdG9yKGFnZ3JlZ2F0ZWREYXRhLCBjb25maWd1cmF0aW9uKTsgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBqc29uID0gKHByZWRlZmluZWRKc29uICYmIGV4dGVuZDIoanNvbixwcmVkZWZpbmVkSnNvbikpIHx8IGpzb247XG4gICAgICAgIGpzb24gPSAoY2FsbGJhY2sgJiYgY2FsbGJhY2soanNvbikpIHx8IGpzb247XG4gICAgICAgIHJldHVybiBpc01ldGFEYXRhID8gZGF0YWFkYXB0ZXIuc2V0RGVmYXVsdEF0dHIoanNvbikgOiBqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldFNvcnRlZERhdGEgPSBmdW5jdGlvbiAoZGF0YSwgY2F0ZWdvcnlBcnIsIGRpbWVuc2lvbiwgYWdncmVnYXRlTW9kZSkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgaW5kZW94T2ZLZXksXG4gICAgICAgICAgICBuZXdEYXRhID0gW10sXG4gICAgICAgICAgICBzdWJTZXREYXRhID0gW10sXG4gICAgICAgICAgICBrZXkgPSBbXSxcbiAgICAgICAgICAgIGNhdGVnb3JpZXMgPSBbXSxcbiAgICAgICAgICAgIGxlbktleSxcbiAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICBsZW5DYXQsXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBhcnIgPSBbXTtcbiAgICAgICAgKCFBcnJheS5pc0FycmF5KGRpbWVuc2lvbikgJiYgKGtleSA9IFtkaW1lbnNpb25dKSkgfHwgKGtleSA9IGRpbWVuc2lvbik7XG4gICAgICAgICghQXJyYXkuaXNBcnJheShjYXRlZ29yeUFyclswXSkgJiYgKGNhdGVnb3JpZXMgPSBbY2F0ZWdvcnlBcnJdKSkgfHwgKGNhdGVnb3JpZXMgPSBjYXRlZ29yeUFycik7XG5cbiAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbMF0pO1xuICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgaW5kZW94T2ZLZXkgPSBkYXRhWzBdLmluZGV4T2Yoa2V5W2tdKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yKGkgPSAwLGxlbkNhdCA9IGNhdGVnb3JpZXNba10ubGVuZ3RoOyBpIDwgbGVuQ2F0ICAmJiBpbmRlb3hPZktleSAhPT0gLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBkYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAoZGF0YVtqXVtpbmRlb3hPZktleV0gPT0gY2F0ZWdvcmllc1trXVtpXSkgJiYgKHN1YlNldERhdGEucHVzaChkYXRhW2pdKSk7XG4gICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgYXJyW2luZGVveE9mS2V5XSA9IGNhdGVnb3JpZXNba11baV07XG4gICAgICAgICAgICAgICAgKHN1YlNldERhdGEubGVuZ3RoID09PSAwKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGFycikpO1xuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVEYXRhKHN1YlNldERhdGEsIGNhdGVnb3JpZXNba11baV0sIGFnZ3JlZ2F0ZU1vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLnNldERlZmF1bHRBdHRyID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9ICcnLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLFxuICAgICAgICAgICAgY29uZiA9IGRhdGFhZGFwdGVyICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZiAmJiBjb25mLm1lYXN1cmUgfHwgW10sXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSxcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbMF1dICYmIG1ldGFEYXRhW21lYXN1cmVbMF1dO1xuICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIChwYWxldHRlQ29sb3JzID0gcGFsZXR0ZUNvbG9ycyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0W1BBTEVUVEVDT0xPUlNdID0gcGFsZXR0ZUNvbG9ycztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSBqc29uLmRhdGFzZXQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlID0gbWV0YURhdGFbbWVhc3VyZVtpXV0gJiYgbWV0YURhdGFbbWVhc3VyZVtpXV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKGpzb24uZGF0YXNldFtpXVtDT0xPUl0gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChtZXRhRGF0YU1lYXN1cmVbQ09MT1JdIGluc3RhbmNlb2YgRnVuY3Rpb24pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIChqc29uLmRhdGFzZXRbaV1bQ09MT1JdID0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciAmJiAoanNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5wbG90W0NPTE9SXSA9IGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzZXJpZXNUeXBlID0gKHNlcmllc1tzZXJpZXNUeXBlXSAmJiBzZXJpZXNUeXBlKSB8fCAnbXMnO1xuXG4gICAgICAgIGpzb24uY2hhcnQgfHwgKGpzb24uY2hhcnQgPSB7fSk7XG4gICAgICAgIFxuICAgICAgICBrZXlFeGNsdWRlZEpzb25TdHIgPSAobWV0YURhdGEgJiYgSlNPTi5zdHJpbmdpZnkoanNvbiwgZnVuY3Rpb24oayx2KXtcbiAgICAgICAgICAgIGlmKGsgPT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBOVUxMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0pKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAganNvbiA9IChrZXlFeGNsdWRlZEpzb25TdHIgJiYgSlNPTi5wYXJzZShrZXlFeGNsdWRlZEpzb25TdHIpKSB8fCBqc29uO1xuXG4gICAgICAgIHNlcmllc1tzZXJpZXNUeXBlXSgpO1xuXG4gICAgICAgIHJldHVybiBqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZURhdGEgPSBmdW5jdGlvbiAoZGF0YSwga2V5LCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBhZ2dyZWdhdGVNZXRob2QgPSB7XG4gICAgICAgICAgICAnc3VtJyA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gZGF0YVswXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDEsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKGRhdGFbaV1bal0gIT0ga2V5KSAmJiAoYWdncmVnYXRlZERhdGFbal0gPSBOdW1iZXIoYWdncmVnYXRlZERhdGFbal0pICsgTnVtYmVyKGRhdGFbaV1bal0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2F2ZXJhZ2UnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlBZ2dyZWdhdGVNdGhkID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgbGVuUiA9IGRhdGEubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkU3VtQXJyID0gaUFnZ3JlZ2F0ZU10aGQuc3VtKCksXG4gICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGFnZ3JlZ2F0ZWRTdW1BcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAoKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0gIT0ga2V5KSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IChOdW1iZXIoYWdncmVnYXRlZFN1bUFycltpXSkpIC8gbGVuUikpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGFnZ3JlZ2F0ZWREYXRhW2ldID0gYWdncmVnYXRlZFN1bUFycltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gYWdncmVnYXRlTW9kZSAmJiBhZ2dyZWdhdGVNb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSAoYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdICYmIGFnZ3JlZ2F0ZU1vZGUpIHx8ICdzdW0nO1xuXG4gICAgICAgIHJldHVybiBhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0oKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZW5lcmFsRGF0YUZvcm1hdCA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShqc29uRGF0YVswXSksXG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIGxlbkdlbmVyYWxEYXRhQXJyYXksXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uIHx8IFtdLFxuICAgICAgICAgICAgbWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZSB8fCBbXTtcbiAgICAgICAgaWYgKCFpc0FycmF5KXtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBbXTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0ucHVzaChkaW1lbnNpb24pO1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IGdlbmVyYWxEYXRhQXJyYXlbMF1bMF0uY29uY2F0KG1lYXN1cmUpO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0ganNvbkRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV0gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5HZW5lcmFsRGF0YUFycmF5ID0gZ2VuZXJhbERhdGFBcnJheVswXS5sZW5ndGg7IGogPCBsZW5HZW5lcmFsRGF0YUFycmF5OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uRGF0YVtpXVtnZW5lcmFsRGF0YUFycmF5WzBdW2pdXTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV1bal0gPSB2YWx1ZSB8fCAnJzsgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGpzb25EYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZW5lcmFsRGF0YUFycmF5O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmpzb25DcmVhdG9yID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGNvbmYgPSBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgc2VyaWVzVHlwZSA9IGNvbmYgJiYgY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Nlcmllc25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3NzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0ganNvbkRhdGFbal1baW5kZXhNYXRjaExhYmVsXTsgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGxhYmVsIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3RzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0gPSB7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgIHJldHVybiBjb25mLm1lYXN1cmUgJiYgY29uZi5kaW1lbnNpb24gJiYgc2VyaWVzW3Nlcmllc1R5cGVdKGpzb25EYXRhLCBjb25mKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRGQ2pzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRkNqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERhdGFKc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFKU09OO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFnZ3JlZ2F0ZWREYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERpbWVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmRpbWVuc2lvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRNZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24ubWVhc3VyZTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRMaW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgbWF4ID0gLUluZmluaXR5LFxuICAgICAgICAgICAgbWluID0gK0luZmluaXR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGF0YSA9IGRhdGFhZGFwdGVyLmFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSArZGF0YVtpXVtqXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWF4ID0gbWF4IDwgdmFsdWUgPyB2YWx1ZSA6IG1heCk7XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1pbiA9IG1pbiA+IHZhbHVlID8gdmFsdWUgOiBtaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbWluJyA6IG1pbixcbiAgICAgICAgICAgICdtYXgnIDogbWF4XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBjYXRlZ29yeUxhYmVsID0gYXJndW1lbnRzWzBdICYmIGFyZ3VtZW50c1swXS50b1N0cmluZygpLFxuICAgICAgICAgICAgY2F0ZWdvcnlBcnIgPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLmNhdGVnb3JpZXMsXG4gICAgICAgICAgICBpbmRleCA9IGNhdGVnb3J5TGFiZWwgJiYgY2F0ZWdvcnlBcnIuaW5kZXhPZihjYXRlZ29yeUxhYmVsKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2hhcnQuZHJhd1RyZW5kUmVnaW9uKGluZGV4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuZGF0YUFkYXB0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YUFkYXB0ZXIoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xufSk7IiwiIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge307XG5cbiAgICAgICAgICAgIGNoYXJ0LmRhdGFTdG9yZUpzb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERhdGFKc29uKCk7XG4gICAgICAgICAgICBjaGFydC5kaW1lbnNpb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERpbWVuc2lvbigpO1xuICAgICAgICAgICAgY2hhcnQubWVhc3VyZSA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0TWVhc3VyZSgpO1xuICAgICAgICAgICAgY2hhcnQuYWdncmVnYXRlZERhdGEgPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldEFnZ3JlZ2F0ZWREYXRhKCk7XG4gICAgICAgICAgICBjaGFydC5yZW5kZXIoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnRQcm90byA9IENoYXJ0LnByb3RvdHlwZSxcbiAgICAgICAgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyLFxuICAgICAgICBnZXRSb3dEYXRhID0gZnVuY3Rpb24oZGF0YSwgYWdncmVnYXRlZERhdGEsIGRpbWVuc2lvbiwgbWVhc3VyZSwga2V5KSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICAgICAgayxcbiAgICAgICAgICAgICAgICBrayxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSksXG4gICAgICAgICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICAgICAgICBtYXRjaE9iaiA9IHt9LFxuICAgICAgICAgICAgICAgIGluZGV4T2ZEaW1lbnNpb24gPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKGRpbWVuc2lvblswXSk7XG4gICAgICAgIFxuICAgICAgICAgICAgZm9yKGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgIGlzQXJyYXkgJiYgKGluZGV4ID0gZGF0YVtpXS5pbmRleE9mKGtleSkpO1xuICAgICAgICAgICAgICAgIGlmKGluZGV4ICE9PSAtMSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBsIDwgbGVuQzsgbCsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW2RhdGFbMF1bbF1dID0gZGF0YVtpXVtsXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKCFpc0FycmF5ICYmIGRhdGFbaV1bZGltZW5zaW9uWzBdXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmogPSBkYXRhW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKG1lYXN1cmVbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWdncmVnYXRlZERhdGFba11baW5kZXhPZkRpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW21lYXN1cmVbal1dID0gYWdncmVnYXRlZERhdGFba11baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgY2hhcnRQcm90by5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgICAgICAvL2dldCBmYyBzdXBwb3J0ZWQganNvbiAgICAgICAgICAgIFxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTsgICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnQuY2hhcnRPYmogPSBuZXcgRnVzaW9uQ2hhcnRzKGNoYXJ0LmNoYXJ0Q29uZmlnKTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG5cbiAgICAgICAgZGF0YUFkYXB0ZXJPYmouY2hhcnQgPSBjaGFydC5jaGFydE9iajtcbiAgICAgICAgXG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLmFkZEV2ZW50TGlzdGVuZXIoJ2RhdGFwbG90cm9sbG92ZXInLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgdmFyIGRhdGFPYmogPSBnZXRSb3dEYXRhKGNoYXJ0LmRhdGFTdG9yZUpzb24sIGNoYXJ0LmFnZ3JlZ2F0ZWREYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFydC5kaW1lbnNpb24sIGNoYXJ0Lm1lYXN1cmUsIGQuY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgICAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5yYWlzZUV2ZW50KCdob3ZlcmluJywge1xuICAgICAgICAgICAgICAgIGRhdGEgOiBkYXRhT2JqLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgOiBkLmNhdGVnb3J5TGFiZWxcbiAgICAgICAgICAgIH0sIGNoYXJ0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID1hcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaixcbiAgICAgICAgICAgIGNoYXJ0Q29uZmlnID0ge30sXG4gICAgICAgICAgICBkYXRhU291cmNlID0ge307XG4gICAgICAgIC8vcGFyc2UgYXJndW1lbnQgaW50byBjaGFydENvbmZpZyBcbiAgICAgICAgZXh0ZW5kMihjaGFydENvbmZpZyxhcmd1bWVudCk7XG4gICAgICAgIFxuICAgICAgICAvL2RhdGFBZGFwdGVyT2JqIFxuICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge307XG5cbiAgICAgICAgLy9zdG9yZSBmYyBzdXBwb3J0ZWQganNvbiB0byByZW5kZXIgY2hhcnRzXG4gICAgICAgIGRhdGFTb3VyY2UgPSBkYXRhQWRhcHRlck9iai5nZXRGQ2pzb24oKTtcblxuICAgICAgICAvL2RlbGV0ZSBkYXRhIGNvbmZpZ3VyYXRpb24gcGFydHMgZm9yIEZDIGpzb24gY29udmVydGVyXG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy9zZXQgZGF0YSBzb3VyY2UgaW50byBjaGFydCBjb25maWd1cmF0aW9uXG4gICAgICAgIGNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICBjaGFydC5jaGFydENvbmZpZyA9IGNoYXJ0Q29uZmlnOyAgICAgICAgXG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8udXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICAgICAgY2hhcnQuZ2V0SlNPTihhcmd1bWVudCk7XG4gICAgICAgIGlmKGNoYXJ0LmNoYXJ0T2JqLmNoYXJ0VHlwZSgpID09ICdheGlzJykge1xuICAgICAgICAgICAgY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgLy9yZW5kZXIgRkMgXG4gICAgICAgICAgICBjaGFydC5jaGFydE9iaiA9IG5ldyBGdXNpb25DaGFydHMoY2hhcnQuY2hhcnRDb25maWcpO1xuICAgICAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5jaGFydFR5cGUoY2hhcnQuY2hhcnRDb25maWcudHlwZSk7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5zZXRKU09ORGF0YShjaGFydC5jaGFydENvbmZpZy5kYXRhU291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhQWRhcHRlck9iai5jaGFydCA9IGNoYXJ0LmNoYXJ0T2JqO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFydChhcmd1bWVudHNbMF0pO1xuICAgIH07XG59KTsiLCJcblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBjcmVhdGVDaGFydCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0LFxuICAgICAgICBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICAgICAgUFggPSAncHgnLFxuICAgICAgICBESVYgPSAnZGl2JyxcbiAgICAgICAgRU1QVFlfU1RSSU5HID0gJycsXG4gICAgICAgIEFCU09MVVRFID0gJ2Fic29sdXRlJyxcbiAgICAgICAgTUFYX1BFUkNFTlQgPSAnMTAwJScsXG4gICAgICAgIFJFTEFUSVZFID0gJ3JlbGF0aXZlJyxcbiAgICAgICAgSUQgPSAnaWQtZmMtbWMtJyxcbiAgICAgICAgQk9SREVSX0JPWCA9ICdib3JkZXItYm94JztcblxuICAgIHZhciBDZWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzO1xuICAgICAgICAgICAgY2VsbC5jb250YWluZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGNlbGwuZHJhdygpO1xuICAgICAgICAgICAgY2VsbC5jb25maWcuY2hhcnQgJiYgY2VsbC5yZW5kZXJDaGFydCgpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b0NlbGwgPSBDZWxsLnByb3RvdHlwZTtcblxuICAgIHByb3RvQ2VsbC5kcmF3ID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgY2VsbC5ncmFwaGljcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoRElWKTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuYm94U2l6aW5nID0gQk9SREVSX0JPWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaW5uZXJIVE1MID0gY2VsbC5jb25maWcuaHRtbCB8fCBFTVBUWV9TVFJJTkc7XG4gICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwucmVuZGVyQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpczsgXG5cbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQucmVuZGVyQXQgPSBjZWxsLmNvbmZpZy5pZDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQud2lkdGggPSBNQVhfUEVSQ0VOVDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQuaGVpZ2h0ID0gTUFYX1BFUkNFTlQ7XG4gICAgICBcbiAgICAgICAgaWYoY2VsbC5jaGFydCkge1xuICAgICAgICAgICAgY2VsbC5jaGFydC51cGRhdGUoY2VsbC5jb25maWcuY2hhcnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbC5jaGFydCA9IGNyZWF0ZUNoYXJ0KGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2VsbC5jaGFydDtcbiAgICB9O1xuXG4gICAgcHJvdG9DZWxsLnVwZGF0ZSA9IGZ1bmN0aW9uIChuZXdDb25maWcpIHtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzLFxuICAgICAgICAgICAgaWQgPSBjZWxsLmNvbmZpZy5pZDtcblxuICAgICAgICBpZihuZXdDb25maWcpe1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBuZXdDb25maWc7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5pZCA9IGlkO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnRvcCA9IGNlbGwuY29uZmlnLnRvcCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICAgICAgIWNlbGwuY29uZmlnLmNoYXJ0ICYmIChjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgICAgICAgICAgaWYoY2VsbC5jb25maWcuY2hhcnQpIHtcbiAgICAgICAgICAgICAgICBjZWxsLmNoYXJ0ID0gY2VsbC5yZW5kZXJDaGFydCgpOyAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGwuY2hhcnQ7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9ICBcbiAgICAgICAgcmV0dXJuIGNlbGw7ICAgICAgXG4gICAgfTtcblxuICAgIHZhciBNYXRyaXggPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBtYXRyaXggPSB0aGlzO1xuICAgICAgICAgICAgbWF0cml4LnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAvL21hdHJpeCBjb250YWluZXJcbiAgICAgICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3Rvcik7XG4gICAgICAgICAgICBtYXRyaXguY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdEggPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdFcgPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBbXTtcbiAgICAgICAgICAgIC8vZGlzcG9zZSBtYXRyaXggY29udGV4dFxuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIC8vc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXIgXG4gICAgICAgICAgICBtYXRyaXguc2V0QXR0ckNvbnRhaW5lcigpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGUsXG4gICAgICAgIGNoYXJ0SWQgPSAwO1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4LnNldEF0dHJDb250YWluZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcjsgICAgICAgIFxuICAgICAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBSRUxBVElWRTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0Q29udGFpbmVyUmVzb2x1dGlvbiA9IGZ1bmN0aW9uIChoZWlnaHRBcnIsIHdpZHRoQXJyKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBoZWlnaHQgPSAwLFxuICAgICAgICAgICAgd2lkdGggPSAwLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBoZWlnaHRBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBoZWlnaHRBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHdpZHRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB3aWR0aCArPSB3aWR0aEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBQWDtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyBQWDtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBkcmF3IG1hdHJpeFxuICAgIHByb3RvTWF0cml4LmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhbEJveCA9IFtdO1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXggJiYgbWF0cml4LmNvbmZpZ3VyYXRpb24gfHwge30sXG4gICAgICAgICAgICAvL3N0b3JlIHZpcnR1YWwgbWF0cml4IGZvciB1c2VyIGdpdmVuIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBsZW4gPSBjb25maWdNYW5hZ2VyICYmIGNvbmZpZ01hbmFnZXIubGVuZ3RoLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBbXSxcbiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgY2FsbEJhY2sgPSBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgLy9zdG9yZSBjZWxsIG9iamVjdCBpbiBsb2dpY2FsIG1hdHJpeCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBwbGFjZUhvbGRlcjtcbiAgICAgICAgY2FsbEJhY2sgJiYgY2FsbEJhY2soKTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBtYW5hZ2UgbWF0cml4IGRyYXdcbiAgICBwcm90b01hdHJpeC5kcmF3TWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIC8vc3RvcmUgbWFwcGluZyBtYXRyaXggYmFzZWQgb24gdGhlIHVzZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgc2hhZG93TWF0cml4ID0gbWF0cml4Lm1hdHJpeE1hbmFnZXIoY29uZmlndXJhdGlvbiksICAgICAgICAgICAgXG4gICAgICAgICAgICBoZWlnaHRBcnIgPSBtYXRyaXguZ2V0Um93SGVpZ2h0KHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICB3aWR0aEFyciA9IG1hdHJpeC5nZXRDb2xXaWR0aChzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnIgPSBbXSxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICBtYXRyaXhQb3NYID0gbWF0cml4LmdldFBvcyh3aWR0aEFyciksXG4gICAgICAgICAgICBtYXRyaXhQb3NZID0gbWF0cml4LmdldFBvcyhoZWlnaHRBcnIpLFxuICAgICAgICAgICAgcm93c3BhbixcbiAgICAgICAgICAgIGNvbHNwYW4sXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGNoYXJ0LFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIGNvbDtcbiAgICAgICAgLy9jYWxjdWxhdGUgYW5kIHNldCBwbGFjZWhvbGRlciBpbiBzaGFkb3cgbWF0cml4XG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXguc2V0UGxjSGxkcihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICAgICAgbWF0cml4LnNldENvbnRhaW5lclJlc29sdXRpb24oaGVpZ2h0QXJyLCB3aWR0aEFycik7XG4gICAgICAgIC8vY2FsY3VsYXRlIGNlbGwgcG9zaXRpb24gYW5kIGhlaWh0IGFuZCBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICBcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldID0gW107ICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuIHx8IDEpO1xuICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbiB8fCAxKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2hhcnQ7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5odG1sO1xuICAgICAgICAgICAgICAgIHJvdyA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0ucm93KTtcbiAgICAgICAgICAgICAgICBjb2wgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLmNvbCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG1hdHJpeFBvc1hbY29sXTtcbiAgICAgICAgICAgICAgICB0b3AgPSBtYXRyaXhQb3NZW3Jvd107XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYW2NvbCArIGNvbHNwYW5dIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXRyaXhQb3NZW3JvdyArIHJvd3NwYW5dIC0gdG9wO1xuICAgICAgICAgICAgICAgIGlkID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5pZCkgfHwgbWF0cml4LmlkQ3JlYXRvcihyb3csY29sKTtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICA6IGxlZnQsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgICA6IGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICAgIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgICAgIDogaWQsXG4gICAgICAgICAgICAgICAgICAgIHJvd3NwYW4gICA6IHJvd3NwYW4sXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gICA6IGNvbHNwYW4sXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgICAgICA6IGh0bWwsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0ICAgICA6IGNoYXJ0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhd01hbmFnZXJPYmpBcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmlkQ3JlYXRvciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNoYXJ0SWQrKzsgICAgICAgXG4gICAgICAgIHJldHVybiBJRCArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFBvcyA9ICBmdW5jdGlvbihzcmMpe1xuICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHNyYyAmJiBzcmMubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPD0gbGVuOyBpKyspe1xuICAgICAgICAgICAgYXJyLnB1c2goaSA/IChzcmNbaS0xXSthcnJbaS0xXSkgOiAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnNldFBsY0hsZHIgPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pe1xuICAgICAgICB2YXIgcm93LFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQztcblxuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBzaGFkb3dNYXRyaXgubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXsgXG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICByb3cgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgICAgICBjb2wgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVsxXTtcblxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9PT0gdW5kZWZpbmVkID8gaSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3c7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID09PSB1bmRlZmluZWQgPyBqIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Um93SGVpZ2h0ID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgaGVpZ2h0ID0gW10sXG4gICAgICAgICAgICBjdXJySGVpZ2h0LFxuICAgICAgICAgICAgbWF4SGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykge1xuICAgICAgICAgICAgZm9yKGogPSAwLCBtYXhIZWlnaHQgPSAwLCBsZW5Db2wgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQ29sOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihzaGFkb3dNYXRyaXhbaV1bal0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyckhlaWdodCA9IHNoYWRvd01hdHJpeFtpXVtqXS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCA8IGN1cnJIZWlnaHQgPyBjdXJySGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhlaWdodFtpXSA9IG1heEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldENvbFdpZHRoID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICB3aWR0aCA9IFtdLFxuICAgICAgICAgICAgY3VycldpZHRoLFxuICAgICAgICAgICAgbWF4V2lkdGg7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtqXS5sZW5ndGg7IGkgPCBsZW5Db2w7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heFdpZHRoID0gMDsgaiA8IGxlblJvdzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYWRvd01hdHJpeFtqXVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBzaGFkb3dNYXRyaXhbal1baV0ud2lkdGg7ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSBtYXhXaWR0aCA8IGN1cnJXaWR0aCA/IGN1cnJXaWR0aCA6IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpZHRoW2ldID0gbWF4V2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Lm1hdHJpeE1hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIHJvd1NwYW4sXG4gICAgICAgICAgICBjb2xTcGFuLFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBkZWZhdWx0SCA9IG1hdHJpeC5kZWZhdWx0SCxcbiAgICAgICAgICAgIGRlZmF1bHRXID0gbWF0cml4LmRlZmF1bHRXLFxuICAgICAgICAgICAgb2Zmc2V0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByb3dTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuKSB8fCAxO1xuICAgICAgICAgICAgICAgIGNvbFNwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNvbHNwYW4pIHx8IDE7ICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2lkdGggPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLndpZHRoKTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICh3aWR0aCAmJiAod2lkdGggLyBjb2xTcGFuKSkgfHwgZGVmYXVsdFc7XG4gICAgICAgICAgICAgICAgd2lkdGggPSArd2lkdGgudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGhlaWdodCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoaGVpZ2h0ICYmIChoZWlnaHQgLyByb3dTcGFuKSkgfHwgZGVmYXVsdEg7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICtoZWlnaHQudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIG9mZnNldCA9IDA7IGsgPCByb3dTcGFuOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsID0gMDsgbCA8IGNvbFNwYW47IGwrKykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdID0gc2hhZG93TWF0cml4W2kgKyBrXSA/IHNoYWRvd01hdHJpeFtpICsga10gOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IGogKyBsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZShzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkIDogKGkgKyAnLScgKyBqKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaGFkb3dNYXRyaXg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldEJsb2NrICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SID0gcGxhY2VIb2xkZXIubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQztcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwbGFjZUhvbGRlcltpXVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuICAgICAgICAgICAgbGVuQ29uZmlnUixcbiAgICAgICAgICAgIGxlbkNvbmZpZ0MsXG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJSLFxuICAgICAgICAgICAgbGVuUGxhY2VIbGRyQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsICAgICAgICAgICAgXG4gICAgICAgICAgICByZWN5Y2xlZENlbGw7XG5cbiAgICAgICAgd2hpbGUoY29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNvbnRhaW5lci5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGVuUGxhY2VIbGRyUiA9IHBsYWNlSG9sZGVyLmxlbmd0aDtcblxuICAgICAgICBmb3IoaSA9IGxlblBsYWNlSGxkclIgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgbGVuUGxhY2VIbGRyQyA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihqID0gbGVuUGxhY2VIbGRyQyAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgaWYocGxhY2VIb2xkZXJbaV1bal0uY2hhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2FsQm94ID0gbWF0cml4LmRpc3Bvc2FsQm94LmNvbmNhdChwbGFjZUhvbGRlcltpXS5wb3AoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHBsYWNlSG9sZGVyW2ldW2pdO1xuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXS5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwbGFjZUhvbGRlci5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuQ29uZmlnUiA9IGNvbmZpZ01hbmFnZXIubGVuZ3RoOyBpIDwgbGVuQ29uZmlnUjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5Db25maWdDID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5Db25maWdDOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihjb25maWdNYW5hZ2VyW2ldW2pdLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY3ljbGVkQ2VsbCA9IG1hdHJpeC5kaXNwb3NhbEJveC5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVjeWNsZWRDZWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgbm9kZSAgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGxlblI7XG4gICAgICAgIGZvcihpID0gMCwgbGVuUiA9IHBsYWNlSG9sZGVyICYmIHBsYWNlSG9sZGVyLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQyA9IHBsYWNlSG9sZGVyW2ldICYmIHBsYWNlSG9sZGVyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0ICYmIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqICYmIFxuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jaGFydC5jaGFydE9iai5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG5vZGUuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9ICcwcHgnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gJzBweCc7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZU1hdHJpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgoYXJndW1lbnRzWzBdLGFyZ3VtZW50c1sxXSk7XG4gICAgfTtcbn0pOyIsIkZ1c2lvbkNoYXJ0cy5yZWdpc3RlcignbW9kdWxlJywgWydwcml2YXRlJywgJ21vZHVsZXMucmVuZGVyZXIuanMtZXh0ZW5zaW9uLWF4aXMnLFxuICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgZ2xvYmFsID0gdGhpcyxcbiAgICAgICAgICAgIGxpYiA9IGdsb2JhbC5oY0xpYixcbiAgICAgICAgICAgIGNoYXJ0QVBJID0gbGliLmNoYXJ0QVBJLFxuICAgICAgICAgICAgcGx1Y2tOdW1iZXIgPSBsaWIucGx1Y2tOdW1iZXIsXG4gICAgICAgICAgICBwbHVjayA9IGxpYi5wbHVjayxcbiAgICAgICAgICAgIGdldEF4aXNMaW1pdHMgPSBsaWIuZ2V0QXhpc0xpbWl0cztcblxuICAgICAgICBjaGFydEFQSSAoJ2F4aXMnLCB7XG4gICAgICAgICAgICBzdGFuZGFsb25lSW5pdCA6IHRydWUsXG4gICAgICAgICAgICBmcmllbmRseU5hbWUgOiAnYXhpcydcbiAgICAgICAgfSwgY2hhcnRBUEkuZHJhd2luZ3BhZCk7XG5cbiAgICAgICAgRnVzaW9uQ2hhcnRzLnJlZ2lzdGVyKCdjb21wb25lbnQnLCBbJ2V4dGVuc2lvbicsICdkcmF3YXhpcycsIHtcbiAgICAgICAgICAgIHR5cGUgOiAnZHJhd2luZ3BhZCcsXG5cbiAgICAgICAgICAgIGluaXQgOiBmdW5jdGlvbiAoY2hhcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cyA9IGNoYXJ0LmNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcgPSBleHRlbnNpb24uYXhpc0NvbmZpZyB8fCAoZXh0ZW5zaW9uLmF4aXNDb25maWcgPSB7fSksXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0SW5zdGFuY2UgPSBjaGFydC5jaGFydEluc3RhbmNlO1xuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50cy5heGlzIHx8IChjb21wb25lbnRzLmF4aXMgPSBuZXcgKEZ1c2lvbkNoYXJ0cy5nZXRDb21wb25lbnQoJ21haW4nLCAnYXhpcycpKSgpKTtcbiAgICAgICAgICAgICAgICBleHRlbnNpb24uY2hhcnQgPSBjaGFydDtcblxuICAgICAgICAgICAgICAgIGNoYXJ0SW5zdGFuY2Uuc2V0QXhpcyA9IGV4dGVuc2lvbi5zZXRBeGlzID0gZnVuY3Rpb24gKGRhdGEsIGRyYXcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF4aXNDb25maWcuYXhpc1R5cGUgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5taW4gPSBkYXRhWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5tYXggPSBkYXRhWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5taW4gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5tYXggPSBkYXRhLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBheGlzQ29uZmlnLmNhdGVnb3J5ID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHJhdyAmJiAgZXh0ZW5zaW9uLmRyYXcoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhcnRJbnN0YW5jZS5nZXRMaW1pdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYXhpc0NvbmZpZy5taW5MaW1pdCwgYXhpc0NvbmZpZy5tYXhMaW1pdF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29uZmlndXJlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBheGlzQ29uZmlnID0gZXh0ZW5zaW9uLmF4aXNDb25maWcsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0ID0gZXh0ZW5zaW9uLmNoYXJ0LFxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjaGFydC5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIGpzb25EYXRhID0gY2hhcnQuanNvbkRhdGEuY2hhcnQsXG4gICAgICAgICAgICAgICAgICAgIGF4aXNUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpc0F4aXNPcHAsXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc0JvcmRlclRoaWNrbmVzcyxcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyVGhpY2tuZXNzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gY2hhcnQuY2hhcnRJbnN0YW5jZS5hcmdzLFxuICAgICAgICAgICAgICAgICAgICBpc1lheGlzLFxuICAgICAgICAgICAgICAgICAgICBjYW52YXNQYWRkaW5nTGVmdCA9IHBsdWNrTnVtYmVyKGpzb25EYXRhLmNhbnZhc3BhZGRpbmdsZWZ0LCBqc29uRGF0YS5jYW52YXNwYWRkaW5nKSxcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzUGFkZGluZ1JpZ2h0ID0gcGx1Y2tOdW1iZXIoanNvbkRhdGEuY2FudmFzcGFkZGluZ3JpZ2h0LCBqc29uRGF0YS5jYW52YXNwYWRkaW5nKTtcblxuICAgICAgICAgICAgICAgIGNoYXJ0Ll9tYW5hZ2VTcGFjZSgpO1xuICAgICAgICAgICAgICAgIGNhbnZhc0JvcmRlclRoaWNrbmVzcyA9IHBsdWNrTnVtYmVyKGNvbmZpZy5jYW52YXNib3JkZXJ0aGlja25lc3MsIDApO1xuICAgICAgICAgICAgICAgIGJvcmRlclRoaWNrbmVzcyA9IHBsdWNrTnVtYmVyKGNvbmZpZy5ib3JkZXJ0aGlja25lc3MsIDApO1xuXG4gICAgICAgICAgICAgICAgYXhpc1R5cGUgPSBheGlzQ29uZmlnLmF4aXNUeXBlID0gcGx1Y2soYXJncy5heGlzVHlwZSwgJ3knKTtcbiAgICAgICAgICAgICAgICBpc1lheGlzID0gYXhpc1R5cGUgPT09ICd5JztcblxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5zZXRBeGlzKGlzWWF4aXMgPyBbanNvbkRhdGEuZGF0YU1pbiwganNvbkRhdGEuZGF0YU1heF0gOiBjaGFydC5qc29uRGF0YS5jYXRlZ29yaWVzLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpc0F4aXNPcHAgPSBheGlzQ29uZmlnLmlzQXhpc09wcCA9IHBsdWNrTnVtYmVyKGpzb25EYXRhLmlzYXhpc29wcG9zaXRlLCAwKTtcblxuICAgICAgICAgICAgICAgIGF4aXNDb25maWcudG9wID0gaXNZYXhpcyA/IGNvbmZpZy5tYXJnaW5Ub3AgKyBjYW52YXNCb3JkZXJUaGlja25lc3MgKyBib3JkZXJUaGlja25lc3MgOlxuICAgICAgICAgICAgICAgICAgICAoaXNBeGlzT3BwID8gY29uZmlnLmhlaWdodCAtIHBsdWNrTnVtYmVyKGpzb25EYXRhLmNoYXJ0Ym90dG9tbWFyZ2luLCAwKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBwbHVja051bWJlcihqc29uRGF0YS5jaGFydHRvcG1hcmdpbiwgMCkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF4aXNDb25maWcubGVmdCA9IGlzWWF4aXMgPyAoaXNBeGlzT3BwID8gcGx1Y2tOdW1iZXIoanNvbkRhdGEuY2hhcnRyaWdodG1hcmdpbiwgMCkgOlxuICAgICAgICAgICAgICAgICAgICBjb25maWcud2lkdGggLSBwbHVja051bWJlcihqc29uRGF0YS5jaGFydHJpZ2h0bWFyZ2luLCAwKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbmZpZy5tYXJnaW5MZWZ0ICsgY2FudmFzQm9yZGVyVGhpY2tuZXNzICsgYm9yZGVyVGhpY2tuZXNzICsgY2FudmFzUGFkZGluZ0xlZnQpO1xuXG4gICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IC0gY29uZmlnLm1hcmdpblRvcCAtIGNvbmZpZy5tYXJnaW5Cb3R0b20gLVxuICAgICAgICAgICAgICAgICAgICAyICogY2FudmFzQm9yZGVyVGhpY2tuZXNzIC0gMiAqIGJvcmRlclRoaWNrbmVzcztcblxuICAgICAgICAgICAgICAgIGF4aXNDb25maWcuZGl2bGluZSA9IHBsdWNrTnVtYmVyKGpzb25EYXRhLm51bWRpdmxpbmVzLCA0KTtcblxuICAgICAgICAgICAgICAgIGF4aXNDb25maWcuYXhpc0xlbiA9IGNvbmZpZy53aWR0aCAtIGNvbmZpZy5tYXJnaW5SaWdodCAtIGNvbmZpZy5tYXJnaW5MZWZ0IC1cbiAgICAgICAgICAgICAgICAgICAgMiAqIGNhbnZhc0JvcmRlclRoaWNrbmVzcyAtIDIgKiBib3JkZXJUaGlja25lc3MgLSBjYW52YXNQYWRkaW5nTGVmdCAtIGNhbnZhc1BhZGRpbmdSaWdodDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRyYXcgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBjaGFydCA9IGV4dGVuc2lvbi5jaGFydCxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cyA9IGNoYXJ0LmNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgICAgIHBhcGVyID0gY29tcG9uZW50cy5wYXBlcixcbiAgICAgICAgICAgICAgICAgICAgYXhpcyA9IGNvbXBvbmVudHMuYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZyA9IGV4dGVuc2lvbi5heGlzQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBpbmNyZW1lbnRvcixcbiAgICAgICAgICAgICAgICAgICAgbWF4TGltaXQsXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0cyxcbiAgICAgICAgICAgICAgICAgICAgZGl2R2FwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlWYWx1ZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICAgICAgICAgIG1heCxcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyRm9ybWF0dGVyID0gY29tcG9uZW50cy5udW1iZXJGb3JtYXR0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGF4aXNJbnRlcnZhbHMgPSBheGlzLmdldFNjYWxlT2JqKCkuZ2V0SW50ZXJ2YWxPYmooKS5nZXRDb25maWcoJ2ludGVydmFscycpLFxuICAgICAgICAgICAgICAgICAgICBtaW5MaW1pdDtcblxuICAgICAgICAgICAgICAgIG1heCA9IGF4aXNDb25maWcubWF4IHx8IDE7XG4gICAgICAgICAgICAgICAgbWluID0gYXhpc0NvbmZpZy5taW4gfHwgMDtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gYXhpc0NvbmZpZy5sZWZ0O1xuICAgICAgICAgICAgICAgIHRvcCA9IGF4aXNDb25maWcudG9wO1xuXG4gICAgICAgICAgICAgICAgYXhpcy5nZXRTY2FsZU9iaigpLnNldENvbmZpZygnZ3JhcGhpY3MnLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhcGVyOiBwYXBlclxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF4aXMuc2V0UmFuZ2UobWF4LG1pbik7XG4gICAgICAgICAgICAgICAgYXhpcy5zZXRBeGlzUG9zaXRpb24obGVmdCx0b3ApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGF4aXNDb25maWcuYXhpc1R5cGUgPT0gJ3gnKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbWluTGltaXQgPSBtaW47XG4gICAgICAgICAgICAgICAgICAgIG1heExpbWl0ID0gbWF4O1xuICAgICAgICAgICAgICAgICAgICBheGlzLnNldEF4aXNMZW5ndGgoYXhpc0NvbmZpZy5heGlzTGVuKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDw9IG1heDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbHMucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVZhbHVlcyA9IGF4aXNDb25maWcuY2F0ZWdvcnkgfHwgWydzdGFydCcsICdlbmQnXTtcblxuICAgICAgICAgICAgICAgICAgICBheGlzSW50ZXJ2YWxzLm1ham9yLmZvcm1hdHRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5VmFsdWVzW3ZhbHVlXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF4aXMuc2V0QXhpc0xlbmd0aChheGlzQ29uZmlnLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGF4aXMuZ2V0U2NhbGVPYmooKS5zZXRDb25maWcoJ3ZlcnRpY2FsJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGltaXRzID0gZ2V0QXhpc0xpbWl0cyhtYXgsIG1pbiwgbnVsbCwgbnVsbCwgdHJ1ZSwgdHJ1ZSwgYXhpc0NvbmZpZy5kaXZsaW5lLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2R2FwID0gbGltaXRzLmRpdkdhcDtcbiAgICAgICAgICAgICAgICAgICAgbWF4TGltaXQgPSBsaW1pdHMuTWF4O1xuICAgICAgICAgICAgICAgICAgICBtaW5MaW1pdCA9IGluY3JlbWVudG9yID0gbGltaXRzLk1pbjtcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5jcmVtZW50b3IgPD0gbWF4TGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVscy5wdXNoKGluY3JlbWVudG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY3JlbWVudG9yICs9IGRpdkdhcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGF4aXNJbnRlcnZhbHMubWFqb3IuZm9ybWF0dGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVtYmVyRm9ybWF0dGVyLnlBeGlzKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLmlzQXhpc09wcCAmJiBheGlzLmdldFNjYWxlT2JqKCkuc2V0Q29uZmlnKCdvcHBvc2l0ZScsIHRydWUpO1xuICAgICAgICAgICAgICAgIGF4aXNJbnRlcnZhbHMubWFqb3IuZHJhd1RpY2tzPSB0cnVlO1xuICAgICAgICAgICAgICAgIGF4aXNDb25maWcubWF4TGltaXQgPSBtYXhMaW1pdDtcbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLm1pbkxpbWl0ID0gbWluTGltaXQ7XG5cbiAgICAgICAgICAgICAgICBheGlzLmdldFNjYWxlT2JqKCkuZ2V0SW50ZXJ2YWxPYmooKS5tYW5hZ2VJbnRlcnZhbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcnZhbHMgPSB0aGlzLmdldENvbmZpZygnaW50ZXJ2YWxzJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMuZ2V0Q29uZmlnKCdzY2FsZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJ2YWxQb2ludHMgPSBpbnRlcnZhbHMubWFqb3IuaW50ZXJ2YWxQb2ludHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW47XG5cbiAgICAgICAgICAgICAgICAgICAgc2NhbGUuc2V0UmFuZ2UobWF4TGltaXQsIG1pbkxpbWl0KTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsYWJlbHMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVydmFsUG9pbnRzLnB1c2gobGFiZWxzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYXhpcy5kcmF3KCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gW21pbkxpbWl0LCBtYXhMaW1pdF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1dKTtcbiAgICB9XG5dKTtcbiIsIkZ1c2lvbkNoYXJ0cy5yZWdpc3RlcignbW9kdWxlJywgWydwcml2YXRlJywgJ21vZHVsZXMucmVuZGVyZXIuanMtZXh0ZW5zaW9uLWNhcHRpb24nLFxuICAgIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBnbG9iYWwgPSB0aGlzLFxuICAgICAgICAgICAgbGliID0gZ2xvYmFsLmhjTGliLFxuICAgICAgICAgICAgY2hhcnRBUEkgPSBsaWIuY2hhcnRBUEk7XG5cbiAgICAgICAgY2hhcnRBUEkoJ2NhcHRpb24nLCB7XG4gICAgICAgICAgICBzdGFuZGFsb25lSW5pdDogdHJ1ZSxcbiAgICAgICAgICAgIGZyaWVuZGx5TmFtZTogJ2NhcHRpb24nXG4gICAgICAgIH0sIGNoYXJ0QVBJLmRyYXdpbmdwYWQpO1xuXG4gICAgICAgIEZ1c2lvbkNoYXJ0cy5yZWdpc3RlcignY29tcG9uZW50JywgWydleHRlbnNpb24nLCAnY2FwdGlvbicsIHtcbiAgICAgICAgICAgIHR5cGU6ICdkcmF3aW5ncGFkJyxcblxuICAgICAgICAgICAgaW5oZXJlaXRCYXNlRXh0ZW5zaW9uOiB0cnVlLFxuXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbihjaGFydCkge1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBpYXBpID0gZXh0ZW5zaW9uLmNoYXJ0O1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5jaGFydCA9IGNoYXJ0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBpYXBpID0gZXh0ZW5zaW9uLmNoYXJ0LFxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBpYXBpLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgQ2FwdGlvbiA9IEZ1c2lvbkNoYXJ0cy5yZWdpc3RlcignY29tcG9uZW50JywgWydjYXB0aW9uJywgJ2NhcHRpb24nXSksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHMgPSBpYXBpLmNvbXBvbmVudHMgfHwgKGlhcGkuY29tcG9uZW50cyA9IHt9KSxcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbiA9IGNvbXBvbmVudHMuY2FwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbkNvbmZpZyA9IGNhcHRpb24uY29uZmlnO1xuXG4gICAgICAgICAgICAgICAgaWFwaS5fbWFuYWdlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBpYXBpLl9wb3N0U3BhY2VNYW5hZ2VtZW50KCk7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNhbnZhc0xlZnQgPSBjb25maWcub3JpZ01hcmdpbkxlZnQ7XG4gICAgICAgICAgICAgICAgY2FwdGlvbiB8fCAoY2FwdGlvbiA9IG5ldyBDYXB0aW9uKCkpO1xuICAgICAgICAgICAgICAgIGNhcHRpb24uaW5pdCgpO1xuICAgICAgICAgICAgICAgIGNhcHRpb24uY2hhcnQgPSBpYXBpO1xuICAgICAgICAgICAgICAgIGNhcHRpb24uY29uZmlndXJlKCk7XG4gICAgICAgICAgICAgICAgY2FwdGlvbi5tYW5hZ2VTcGFjZShjb25maWcuaGVpZ2h0LGNvbmZpZy53aWR0aCk7XG4gICAgICAgICAgICAgICAgY2FwdGlvbkNvbmZpZy5kcmF3Q2FwdGlvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgY2FwdGlvbi5tYW5hZ2VQb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIGNhcHRpb24gJiYgY2FwdGlvbi5kcmF3KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1dKTtcbiAgICB9XG5dKTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuICAgIFxuICAgIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cbiAgICB2YXIgZ2xvYmFsID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG4gICAgICAgIHdpbiA9IGdsb2JhbC53aW4sXG5cbiAgICAgICAgb2JqZWN0UHJvdG9Ub1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgIGFycmF5VG9TdHJpbmdJZGVudGlmaWVyID0gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKFtdKSxcbiAgICAgICAgaXNBcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RQcm90b1RvU3RyaW5nLmNhbGwob2JqKSA9PT0gYXJyYXlUb1N0cmluZ0lkZW50aWZpZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQSBmdW5jdGlvbiB0byBjcmVhdGUgYW4gYWJzdHJhY3Rpb24gbGF5ZXIgc28gdGhhdCB0aGUgdHJ5LWNhdGNoIC9cbiAgICAgICAgLy8gZXJyb3Igc3VwcHJlc3Npb24gb2YgZmxhc2ggY2FuIGJlIGF2b2lkZWQgd2hpbGUgcmFpc2luZyBldmVudHMuXG4gICAgICAgIG1hbmFnZWRGbkNhbGwgPSBmdW5jdGlvbiAoaXRlbSwgc2NvcGUsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBXZSBjaGFuZ2UgdGhlIHNjb3BlIG9mIHRoZSBmdW5jdGlvbiB3aXRoIHJlc3BlY3QgdG8gdGhlXG4gICAgICAgICAgICAvLyBvYmplY3QgdGhhdCByYWlzZWQgdGhlIGV2ZW50LlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpdGVtWzBdLmNhbGwoc2NvcGUsIGV2ZW50LCBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRnVuY3Rpb24gdGhhdCBleGVjdXRlcyBhbGwgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGludm9rZWQgdXBvbiB0cmlnZ2VyXG4gICAgICAgIC8vIG9mIGFuIGV2ZW50LlxuICAgICAgICBzbG90TG9hZGVyID0gZnVuY3Rpb24gKHNsb3QsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBJZiBzbG90IGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgd2UgYXNzdW1lIHRoYXQgdGhlIGxpc3RlbmVyXG4gICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgaWYgKCEoc2xvdCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIC8vIFN0YXR1dG9yeSBXM0MgTk9UIHByZXZlbnREZWZhdWx0IGZsYWdcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmFyaWFibGVzLlxuICAgICAgICAgICAgdmFyIGkgPSAwLCBzY29wZTtcblxuICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBzbG90IGFuZCBsb29rIGZvciBtYXRjaCB3aXRoIHJlc3BlY3QgdG9cbiAgICAgICAgICAgIC8vIHR5cGUgYW5kIGJpbmRpbmcuXG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbWF0Y2ggZm91bmQgdy5yLnQuIHR5cGUgYW5kIGJpbmQsIHdlIGZpcmUgaXQuXG4gICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciB8fCBzbG90W2ldWzFdID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHNlbmRlciBvZiB0aGUgZXZlbnQgZm9yIGdsb2JhbCBldmVudHMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjaG9pY2Ugb2Ygc2NvcGUgZGlmZmVyZXMgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYVxuICAgICAgICAgICAgICAgICAgICAvLyBnbG9iYWwgb3IgYSBsb2NhbCBldmVudCBpcyBiZWluZyByYWlzZWQuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlID0gc2xvdFtpXVsxXSA9PT0gZXZlbnQuc2VuZGVyID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnNlbmRlciA6IGdsb2JhbDtcblxuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkRm5DYWxsKHNsb3RbaV0sIHNjb3BlLCBldmVudCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgd2FudGVkIHRvIGRldGFjaCB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRldGFjaGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmRldGFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHByb3BhZ2F0aW9uIGZsYWcgaXMgc2V0IHRvIGZhbHNlIGFuZCBkaXNjb250bnVlXG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlmIG5lZWRlZC5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY2FuY2VsbGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBldmVudE1hcCA9IHtcbiAgICAgICAgICAgIGhvdmVyaW4gOiAnZGF0YXBsb3Ryb2xsb3ZlcicsXG4gICAgICAgICAgICBob3Zlcm91dCA6ICdkYXRhcGxvdHJvbGxvdXQnLFxuICAgICAgICAgICAgY2xpayA6ICdkYXRhcGxvdGNsaWNrJ1xuICAgICAgICB9LFxuICAgICAgICByYWlzZUV2ZW50LFxuXG4gICAgICAgIEV2ZW50VGFyZ2V0ID0ge1xuXG4gICAgICAgICAgICB1bnByb3BhZ2F0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuY2FuY2VsbGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldGFjaGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmRldGFjaGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZGVmYXVsdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLnByZXZlbnRlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEVudGlyZSBjb2xsZWN0aW9uIG9mIGxpc3RlbmVycy5cbiAgICAgICAgICAgIGxpc3RlbmVyczoge30sXG5cbiAgICAgICAgICAgIC8vIFRoZSBsYXN0IHJhaXNlZCBldmVudCBpZC4gQWxsb3dzIHRvIGNhbGN1bGF0ZSB0aGUgbmV4dCBldmVudCBpZC5cbiAgICAgICAgICAgIGxhc3RFdmVudElkOiAwLFxuXG4gICAgICAgICAgICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcmVjdXJzZVJldHVybixcbiAgICAgICAgICAgICAgICAgICAgRkNFdmVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGk7XG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2VSZXR1cm4ucHVzaChFdmVudFRhcmdldC5hZGRMaXN0ZW5lcih0eXBlW2ldLCBsaXN0ZW5lciwgYmluZCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWN1cnNlUmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRoZSB0eXBlIHBhcmFtZXRlci4gTGlzdGVuZXIgY2Fubm90IGJlIGFkZGVkIHdpdGhvdXRcbiAgICAgICAgICAgICAgICAvLyB2YWxpZCB0eXBlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIGhhcyBub3QgYmVlbiBwcm92aWRlZCB3aGlsZSBhZGRpbmcgYW4gZXZlbnQgbGlzdGVuZXIuIEVuc3VyZSB0aGF0IHlvdSBwYXNzIGFcbiAgICAgICAgICAgICAgICAgICAgICogYHN0cmluZ2AgdG8gdGhlIGZpcnN0IHBhcmFtZXRlciBvZiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9LlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU0OVxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU0OScsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5zcGVjaWZpZWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIExpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4gSXQgd2lsbCBub3QgZXZhbCBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTBcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTAnLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgTGlzdGVuZXInKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnNlcnRpb24gcG9zaXRpb24gZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB0aGVuIGNyZWF0ZSBvbmUuXG4gICAgICAgICAgICAgICAgaWYgKCEoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5wdXNoKFtsaXN0ZW5lciwgYmluZF0pO1xuXG4gICAgICAgICAgICAgICAgLy8gRXZlbnRzIG9mIGZ1c2lvbkNoYXJ0IHJhaXNlZCB2aWEgTXVsdGlDaGFydGluZy5cbiAgICAgICAgICAgICAgICBpZiAoRkNFdmVudFR5cGUgPSBldmVudE1hcFt0eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcihGQ0V2ZW50VHlwZSwgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQodHlwZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZDRXZlbnRPYmogOiBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZDRGF0YU9iaiA6IGRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIE11bHRpQ2hhcnRpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZW1vdmVMaXN0ZW5lcjogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgc2xvdCxcbiAgICAgICAgICAgICAgICAgICAgaTtcblxuICAgICAgICAgICAgICAgIC8vIExpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4gRWxzZSB3ZSBoYXZlIG5vdGhpbmcgdG8gcmVtb3ZlIVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBsaXN0ZW5lciBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgKiBPdGhlcndpc2UsIHRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbiBoYXMgbm8gd2F5IHRvIGtub3cgd2hpY2ggZnVuY3Rpb24gaXMgdG8gYmUgcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NjBcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NjAnLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgTGlzdGVuZXInKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHR5cGUgaXMgc2VudCBhcyBhcnJheSwgd2UgcmVjdXJzZSB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgbG9vayBpbnRvIGVhY2ggaXRlbSBvZiB0aGUgJ3R5cGUnIHBhcmFtZXRlciBhbmQgc2VuZCBpdCxcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxvbmcgd2l0aCBvdGhlciBwYXJhbWV0ZXJzIHRvIGEgcmVjdXJzZWQgYWRkTGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSByZW1vdmVkIHdpdGhvdXRcbiAgICAgICAgICAgICAgICAvLyB2YWxpZCB0eXBlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU1OVxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU1OScsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5zcGVjaWZpZWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERlc2Vuc2l0aXplIHRoZSB0eXBlIGNhc2UgZm9yIHVzZXIgYWNjZXNzYWJpbGl0eS5cbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcmVmZXJlbmNlIHRvIHRoZSBzbG90IGZvciBlYXN5IGxvb2t1cCBpbiB0aGlzIG1ldGhvZC5cbiAgICAgICAgICAgICAgICBzbG90ID0gRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIHdhcyBuZXZlciBhZGRlZCBhbmQgaGFsdCBtZXRob2QuXG4gICAgICAgICAgICAgICAgaWYgKCEoc2xvdCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBzbG90IGFuZCByZW1vdmUgZXZlcnkgaW5zdGFuY2Ugb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgaGFuZGxlci5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2xvdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGluc3RhbmNlcyBvZiB0aGUgbGlzdGVuZXIgZm91bmQgaW4gdGhlIHF1ZXVlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvdFtpXVswXSA9PT0gbGlzdGVuZXIgJiYgc2xvdFtpXVsxXSA9PT0gYmluZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBvcHRzIGNhbiBoYXZlIHsgYXN5bmM6dHJ1ZSwgb21uaTp0cnVlIH1cbiAgICAgICAgICAgIHRyaWdnZXJFdmVudDogZnVuY3Rpb24gKHR5cGUsIHNlbmRlciwgYXJncywgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxGbikge1xuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSwgZXZlbnQgdHlwZSBpcyBtaXNzaW5nLCBkaXNwYXRjaCBjYW5ub3QgcHJvY2VlZC5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE2MDJcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKHNlbmRlciwgJzAzMDkxNjAyJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIE1vZGVsIHRoZSBldmVudCBhcyBwZXIgVzNDIHN0YW5kYXJkcy4gQWRkIHRoZSBmdW5jdGlvbiB0byBjYW5jZWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBwcm9wYWdhdGlvbiBieSB1c2VyIGhhbmRsZXJzLiBBbHNvIGFwcGVuZCBhbiBpbmNyZW1lbnRhbFxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGlkLlxuICAgICAgICAgICAgICAgIHZhciBldmVudE9iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBldmVudElkOiAoRXZlbnRUYXJnZXQubGFzdEV2ZW50SWQgKz0gMSksXG4gICAgICAgICAgICAgICAgICAgIHNlbmRlcjogc2VuZGVyIHx8IG5ldyBFcnJvcignT3JwaGFuIEV2ZW50JyksXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbGxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHN0b3BQcm9wYWdhdGlvbjogdGhpcy51bnByb3BhZ2F0b3IsXG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0aGlzLnVuZGVmYXVsdGVyLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRldGFjaEhhbmRsZXI6IHRoaXMuZGV0YWNoZXJcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXZlbnQgbGlzdGVuZXJzIGFyZSB1c2VkIHRvIHRhcCBpbnRvIGRpZmZlcmVudCBzdGFnZXMgb2YgY3JlYXRpbmcsIHVwZGF0aW5nLCByZW5kZXJpbmcgb3IgcmVtb3ZpbmdcbiAgICAgICAgICAgICAgICAgKiBjaGFydHMuIEEgRnVzaW9uQ2hhcnRzIGluc3RhbmNlIGZpcmVzIHNwZWNpZmljIGV2ZW50cyBiYXNlZCBvbiB3aGF0IHN0YWdlIGl0IGlzIGluLiBGb3IgZXhhbXBsZSwgdGhlXG4gICAgICAgICAgICAgICAgICogYHJlbmRlckNvbXBsZXRlYCBldmVudCBpcyBmaXJlZCBlYWNoIHRpbWUgYSBjaGFydCBoYXMgZmluaXNoZWQgcmVuZGVyaW5nLiBZb3UgY2FuIGxpc3RlbiB0byBhbnkgc3VjaFxuICAgICAgICAgICAgICAgICAqIGV2ZW50IHVzaW5nIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gb3Ige0BsaW5rIEZ1c2lvbkNoYXJ0cyNhZGRFdmVudExpc3RlbmVyfSBhbmQgYmluZFxuICAgICAgICAgICAgICAgICAqIHlvdXIgb3duIGZ1bmN0aW9ucyB0byB0aGF0IGV2ZW50LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogVGhlc2UgZnVuY3Rpb25zIGFyZSBrbm93biBhcyBcImxpc3RlbmVyc1wiIGFuZCBhcmUgcGFzc2VkIG9uIHRvIHRoZSBzZWNvbmQgYXJndW1lbnQgKGBsaXN0ZW5lcmApIG9mIHRoZVxuICAgICAgICAgICAgICAgICAqIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gZnVuY3Rpb25zLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQGNhbGxiYWNrIEZ1c2lvbkNoYXJ0c35ldmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICogQHNlZSBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudE9iamVjdCAtIFRoZSBmaXJzdCBwYXJhbWV0ZXIgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBpcyBhbiBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAgICAgKiB0aGF0IGNvbnRhaW5zIGFsbCBpbmZvcm1hdGlvbiBwZXJ0YWluaW5nIHRvIGEgcGFydGljdWxhciBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE9iamVjdC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGV2ZW50T2JqZWN0LmV2ZW50SWQgLSBBIHVuaXF1ZSBJRCBhc3NvY2lhdGVkIHdpdGggdGhlIGV2ZW50LiBJbnRlcm5hbGx5IGl0IGlzIGFuXG4gICAgICAgICAgICAgICAgICogaW5jcmVtZW50aW5nIGNvdW50ZXIgYW5kIGFzIHN1Y2ggY2FuIGJlIGluZGlyZWN0bHkgdXNlZCB0byB2ZXJpZnkgdGhlIG9yZGVyIGluIHdoaWNoICB0aGUgZXZlbnQgd2FzXG4gICAgICAgICAgICAgICAgICogZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge0Z1c2lvbkNoYXJ0c30gZXZlbnRPYmplY3Quc2VuZGVyIC0gVGhlIGluc3RhbmNlIG9mIEZ1c2lvbkNoYXJ0cyBvYmplY3QgdGhhdCBmaXJlZCB0aGlzIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqIE9jY2Fzc2lvbmFsbHksIGZvciBldmVudHMgdGhhdCBhcmUgbm90IGZpcmVkIGJ5IGluZGl2aWR1YWwgY2hhcnRzLCBidXQgYXJlIGZpcmVkIGJ5IHRoZSBmcmFtZXdvcmssXG4gICAgICAgICAgICAgICAgICogd2lsbCBoYXZlIHRoZSBmcmFtZXdvcmsgYXMgdGhpcyBwcm9wZXJ0eS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXZlbnRPYmplY3QuY2FuY2VsbGVkIC0gU2hvd3Mgd2hldGhlciBhbiAgZXZlbnQncyBwcm9wYWdhdGlvbiB3YXMgY2FuY2VsbGVkIG9yIG5vdC5cbiAgICAgICAgICAgICAgICAgKiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5zdG9wUHJvcGFnYXRpb24oKWAgaXMgY2FsbGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZXZlbnRPYmplY3Quc3RvcFByb3BhZ2F0aW9uIC0gQ2FsbCB0aGlzIGZ1bmN0aW9uIGZyb20gd2l0aGluIGEgbGlzdGVuZXIgdG8gcHJldmVudFxuICAgICAgICAgICAgICAgICAqIHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gYmVpbmcgZXhlY3V0ZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LnByZXZlbnRlZCAtIFNob3dzIHdoZXRoZXIgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIHRoaXMgZXZlbnQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICAgKiBwcmV2ZW50ZWQuIEl0IGlzIHNldCB0byBgdHJ1ZWAgd2hlbiBgLnByZXZlbnREZWZhdWx0KClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnByZXZlbnREZWZhdWx0IC0gQ2FsbCB0aGlzIGZ1bmN0aW9uIHRvIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIGFuXG4gICAgICAgICAgICAgICAgICogZXZlbnQuIEZvciBleGFtcGxlLCBmb3IgdGhlIGV2ZW50IHtAbGluayBGdXNpb25DaGFydHMjZXZlbnQ6YmVmb3JlUmVzaXplfSwgaWYgeW91IGRvXG4gICAgICAgICAgICAgICAgICogYC5wcmV2ZW50RGVmYXVsdCgpYCwgdGhlIHJlc2l6ZSB3aWxsIG5ldmVyIHRha2UgcGxhY2UgYW5kIGluc3RlYWRcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OnJlc2l6ZUNhbmNlbGxlZH0gd2lsbCBiZSBmaXJlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXZlbnRPYmplY3QuZGV0YWNoZWQgLSBEZW5vdGVzIHdoZXRoZXIgYSBsaXN0ZW5lciBoYXMgYmVlbiBkZXRhY2hlZCBhbmQgbm8gbG9uZ2VyXG4gICAgICAgICAgICAgICAgICogZ2V0cyBleGVjdXRlZCBmb3IgYW55IHN1YnNlcXVlbnQgZXZlbnQgb2YgdGhpcyBwYXJ0aWN1bGFyIGB0eXBlYC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LmRldGFjaEhhbmRsZXIgLSBBbGxvd3MgdGhlIGxpc3RlbmVyIHRvIHJlbW92ZSBpdHNlbGYgcmF0aGVyIHRoYW4gYmVpbmdcbiAgICAgICAgICAgICAgICAgKiBjYWxsZWQgZXh0ZXJuYWxseSBieSB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9LiBUaGlzIGlzIHZlcnkgdXNlZnVsIGZvciBvbmUtdGltZSBldmVudFxuICAgICAgICAgICAgICAgICAqIGxpc3RlbmluZyBvciBmb3Igc3BlY2lhbCBzaXR1YXRpb25zIHdoZW4gdGhlIGV2ZW50IGlzIG5vIGxvbmdlciByZXF1aXJlZCB0byBiZSBsaXN0ZW5lZCB3aGVuIHRoZVxuICAgICAgICAgICAgICAgICAqIGV2ZW50IGhhcyBiZWVuIGZpcmVkIHdpdGggYSBzcGVjaWZpYyBjb25kaXRpb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRBcmdzIC0gRXZlcnkgZXZlbnQgaGFzIGFuIGFyZ3VtZW50IG9iamVjdCBhcyBzZWNvbmQgcGFyYW1ldGVyIHRoYXQgY29udGFpbnNcbiAgICAgICAgICAgICAgICAgKiBpbmZvcm1hdGlvbiByZWxldmFudCB0byB0aGF0IHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2xvdExvYWRlcihFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEZhY2lsaXRhdGUgdGhlIGNhbGwgb2YgYSBnbG9iYWwgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgc2xvdExvYWRlcihFdmVudFRhcmdldC5saXN0ZW5lcnNbJyonXSwgZXZlbnRPYmplY3QsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSBkZWZhdWx0IGFjdGlvblxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnRPYmplY3QucHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FuY2VsRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdEZuLmNhbGwoZXZlbnRTY29wZSB8fCBzZW5kZXIgfHwgd2luLCBldmVudE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgY2hhcnQgbG9hZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3Qgb2YgZXZlbnRzIHRoYXQgaGFzIGFuIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LiBVc2VkIGJ5IHRoZVxuICAgICAgICAgKiByYWlzZUV2ZW50IG1ldGhvZCB0byBjaGVjayB3aGV0aGVyIGEgcGFydGljdWxhciBldmVudCByYWlzZWRcbiAgICAgICAgICogaGFzIGFueSBjb3JyZXNwb25kaW5nIGxlZ2FjeSBldmVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBsZWdhY3lFdmVudExpc3QgPSBnbG9iYWwubGVnYWN5RXZlbnRMaXN0ID0ge30sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1haW50YWlucyBhIGxpc3Qgb2YgcmVjZW50bHkgcmFpc2VkIGNvbmRpdGlvbmFsIGV2ZW50c1xuICAgICAgICAgKiBAdHlwZSBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIGNvbmRpdGlvbkNoZWNrcyA9IHt9O1xuXG4gICAgLy8gRmFjaWxpdGF0ZSBmb3IgcmFpc2luZyBldmVudHMgaW50ZXJuYWxseS5cbiAgICByYWlzZUV2ZW50ID0gZ2xvYmFsLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgYXJncywgb2JqLCBldmVudFNjb3BlLFxuICAgICAgICAgICAgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQudHJpZ2dlckV2ZW50KHR5cGUsIG9iaiwgYXJncywgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgIH07XG5cbiAgICBnbG9iYWwuZGlzcG9zZUV2ZW50cyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgdmFyIHR5cGUsIGk7XG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgZXZlbnRzIGluIHRoZSBjb2xsZWN0aW9uIG9mIGxpc3RlbmVyc1xuICAgICAgICBmb3IgKHR5cGUgaW4gRXZlbnRUYXJnZXQubGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBkZWxldGUgdGhlIGxpc3RlbmVyIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdW2ldWzFdID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGFsbG93cyB0byB1bmlmb3JtbHkgcmFpc2UgZXZlbnRzIG9mIEZ1c2lvbkNoYXJ0c1xuICAgICAqIEZyYW1ld29yay5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHNwZWNpZmllcyB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhcmdzIGFsbG93cyB0byBwcm92aWRlIGFuIGFyZ3VtZW50cyBvYmplY3QgdG8gYmVcbiAgICAgKiBwYXNzZWQgb24gdG8gdGhlIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgKiBAcGFyYW0gfSBvYmogaXMgdGhlIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBvYmplY3Qgb25cbiAgICAgKiBiZWhhbGYgb2Ygd2hpY2ggdGhlIGV2ZW50IHdvdWxkIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge2FycmF5fSBsZWdhY3lBcmdzIGlzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgb25cbiAgICAgKiB0byB0aGUgZXF1aXZhbGVudCBsZWdhY3kgZXZlbnQuXG4gICAgICogQHBhcmFtIHtFdmVudH0gc291cmNlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZGVmYXVsdEZuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FuY2VsRm5cbiAgICAgKlxuICAgICAqIEB0eXBlIHVuZGVmaW5lZFxuICAgICAqL1xuICAgIGdsb2JhbC5yYWlzZUV2ZW50V2l0aExlZ2FjeSA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzLCBvYmosIGxlZ2FjeUFyZ3MsXG4gICAgICAgICAgICBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBsZWdhY3kgPSBsZWdhY3lFdmVudExpc3RbbmFtZV07XG4gICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgaWYgKGxlZ2FjeSAmJiB0eXBlb2Ygd2luW2xlZ2FjeV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbltsZWdhY3ldLmFwcGx5KGV2ZW50U2NvcGUgfHwgd2luLCBsZWdhY3lBcmdzKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgYWxsb3dzIG9uZSB0byByYWlzZSByZWxhdGVkIGV2ZW50cyB0aGF0IGFyZSBncm91cGVkIHRvZ2V0aGVyIGFuZFxuICAgICAqIHJhaXNlZCBieSBtdWx0aXBsZSBzb3VyY2VzLiBVc3VhbGx5IHRoaXMgaXMgdXNlZCB3aGVyZSBhIGNvbmdyZWdhdGlvblxuICAgICAqIG9mIHN1Y2Nlc3NpdmUgZXZlbnRzIG5lZWQgdG8gY2FuY2VsIG91dCBlYWNoIG90aGVyIGFuZCBiZWhhdmUgbGlrZSBhXG4gICAgICogdW5pZmllZCBlbnRpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2hlY2sgaXMgdXNlZCB0byBpZGVudGlmeSBldmVudCBncm91cHMuIFByb3ZpZGUgc2FtZSB2YWx1ZVxuICAgICAqIGZvciBhbGwgZXZlbnRzIHRoYXQgeW91IHdhbnQgdG8gZ3JvdXAgdG9nZXRoZXIgZnJvbSBtdWx0aXBsZSBzb3VyY2VzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHNwZWNpZmllcyB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhcmdzIGFsbG93cyB0byBwcm92aWRlIGFuIGFyZ3VtZW50cyBvYmplY3QgdG8gYmVcbiAgICAgKiBwYXNzZWQgb24gdG8gdGhlIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgKiBAcGFyYW0gfSBvYmogaXMgdGhlIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBvYmplY3Qgb25cbiAgICAgKiBiZWhhbGYgb2Ygd2hpY2ggdGhlIGV2ZW50IHdvdWxkIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRTY29wZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbGxlZEZuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgICAqL1xuICAgIGdsb2JhbC5yYWlzZUV2ZW50R3JvdXAgPSBmdW5jdGlvbiAoY2hlY2ssIG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgdmFyIGlkID0gb2JqLmlkLFxuICAgICAgICAgICAgaGFzaCA9IGNoZWNrICsgaWQ7XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbkNoZWNrc1toYXNoXSkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbmRpdGlvbkNoZWNrc1toYXNoXSk7XG4gICAgICAgICAgICBkZWxldGUgY29uZGl0aW9uQ2hlY2tzW2hhc2hdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlkICYmIGhhc2gpIHtcbiAgICAgICAgICAgICAgICBjb25kaXRpb25DaGVja3NbaGFzaF0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmFpc2VFdmVudChuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29uZGl0aW9uQ2hlY2tzW2hhc2hdO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmFpc2VFdmVudChuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEV4dGVuZCB0aGUgZXZlbnRsaXN0ZW5lcnMgdG8gaW50ZXJuYWwgZ2xvYmFsLlxuICAgIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgIHJldHVybiBFdmVudFRhcmdldC5hZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgYmluZCk7XG4gICAgfTtcbiAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG59KTsiXX0=

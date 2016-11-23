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
/*        var dataadapter = this,
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
        })) || undefined;

        json = (keyExcludedJsonStr && JSON.parse(keyExcludedJsonStr)) || json;

        for(i = 0, len = measure.length; i < len && metaData; i++) {
            metaDataMeasure = metaData[measure[i]] && metaData[measure[i]];
            paletteColors[i] = (metaDataMeasure[COLOR] instanceof Function) ? metaDataMeasure[COLOR]() 
                                                            : metaDataMeasure[COLOR];
        }

        json.chart[PALETTECOLORS] = paletteColors;*/
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDemdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNdWx0aUNoYXJ0aW5nIEV4dGVuc2lvbiBmb3IgRnVzaW9uQ2hhcnRzXG4gKiBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgYmFzaWMgcm91dGluZXMgcmVxdWlyZWQgYnkgc3Vic2VxdWVudCBtb2R1bGVzIHRvXG4gKiBleHRlbmQvc2NhbGUgb3IgYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIE11bHRpQ2hhcnRpbmcgb2JqZWN0LlxuICpcbiAqL1xuXG4gLyogZ2xvYmFsIHdpbmRvdzogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGVudiwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGVudi5kb2N1bWVudCA/XG4gICAgICAgICAgICBmYWN0b3J5KGVudikgOiBmdW5jdGlvbih3aW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpbi5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KHdpbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5NdWx0aUNoYXJ0aW5nID0gZmFjdG9yeShlbnYsIHRydWUpO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKF93aW5kb3csIHdpbmRvd0V4aXN0cykge1xuICAgIC8vIEluIGNhc2UgTXVsdGlDaGFydGluZyBhbHJlYWR5IGV4aXN0cy5cbiAgICBpZiAoX3dpbmRvdy5NdWx0aUNoYXJ0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgTXVsdGlDaGFydGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luID0gX3dpbmRvdztcblxuICAgIGlmICh3aW5kb3dFeGlzdHMpIHtcbiAgICAgICAgX3dpbmRvdy5NdWx0aUNoYXJ0aW5nID0gTXVsdGlDaGFydGluZztcbiAgICB9XG4gICAgcmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZW5kMiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYpIHtcbiAgICAgICAgICAgIHZhciBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcbiAgICAgICAgICAgIC8vaWYgbm9uZSBvZiB0aGUgYXJndW1lbnRzIGFyZSBvYmplY3QgdGhlbiByZXR1cm4gYmFja1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcgJiYgdHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORyB8fCBvYmoyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgb2JqMSA9IG9iajIgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZShvYmoxLCBvYmoyLCBza2lwVW5kZWYpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGxpYiA9IHtcbiAgICAgICAgICAgIGV4dGVuZDI6IGV4dGVuZDIsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2VcbiAgICAgICAgfTtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgPSAoTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliIHx8IGxpYik7XG5cbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIEFqYXggPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgYWpheCA9IHRoaXMsXG5cdFx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdO1xuXG5cdFx0ICAgIGFqYXgub25TdWNjZXNzID0gYXJndW1lbnQuc3VjY2Vzcztcblx0XHQgICAgYWpheC5vbkVycm9yID0gYXJndW1lbnQuZXJyb3I7XG5cdFx0ICAgIGFqYXgub3BlbiA9IGZhbHNlO1xuXHRcdCAgICByZXR1cm4gYWpheC5nZXQoYXJndW1lbnQudXJsKTtcblx0XHR9LFxuXG4gICAgICAgIGFqYXhQcm90byA9IEFqYXgucHJvdG90eXBlLFxuXG4gICAgICAgIEZVTkNUSU9OID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgTVNYTUxIVFRQID0gJ01pY3Jvc29mdC5YTUxIVFRQJyxcbiAgICAgICAgTVNYTUxIVFRQMiA9ICdNc3htbDIuWE1MSFRUUCcsXG4gICAgICAgIEdFVCA9ICdHRVQnLFxuICAgICAgICBYSFJFUUVSUk9SID0gJ1htbEh0dHByZXF1ZXN0IEVycm9yJyxcbiAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG4gICAgICAgIHdpbiA9IG11bHRpQ2hhcnRpbmdQcm90by53aW4sIC8vIGtlZXAgYSBsb2NhbCByZWZlcmVuY2Ugb2Ygd2luZG93IHNjb3BlXG5cbiAgICAgICAgLy8gUHJvYmUgSUUgdmVyc2lvblxuICAgICAgICB2ZXJzaW9uID0gcGFyc2VGbG9hdCh3aW4ubmF2aWdhdG9yLmFwcFZlcnNpb24uc3BsaXQoJ01TSUUnKVsxXSksXG4gICAgICAgIGllbHQ4ID0gKHZlcnNpb24gPj0gNS41ICYmIHZlcnNpb24gPD0gNykgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgIGZpcmVmb3ggPSAvbW96aWxsYS9pLnRlc3Qod2luLm5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAvL1xuICAgICAgICAvLyBDYWxjdWxhdGUgZmxhZ3MuXG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHBhZ2UgaXMgb24gZmlsZSBwcm90b2NvbC5cbiAgICAgICAgZmlsZVByb3RvY29sID0gd2luLmxvY2F0aW9uLnByb3RvY29sID09PSAnZmlsZTonLFxuICAgICAgICBBWE9iamVjdCA9IHdpbi5BY3RpdmVYT2JqZWN0LFxuXG4gICAgICAgIC8vIENoZWNrIGlmIG5hdGl2ZSB4aHIgaXMgcHJlc2VudFxuICAgICAgICBYSFJOYXRpdmUgPSAoIUFYT2JqZWN0IHx8ICFmaWxlUHJvdG9jb2wpICYmIHdpbi5YTUxIdHRwUmVxdWVzdCxcblxuICAgICAgICAvLyBQcmVwYXJlIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGNvbXBhdGlibGUgeG1saHR0cHJlcXVlc3QuXG4gICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHhtbGh0dHA7XG5cbiAgICAgICAgICAgIC8vIGlmIHhtbGh0dHByZXF1ZXN0IGlzIHByZXNlbnQgYXMgbmF0aXZlLCB1c2UgaXQuXG4gICAgICAgICAgICBpZiAoWEhSTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgWEhSTmF0aXZlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIGFjdGl2ZVggZm9yIElFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBBWE9iamVjdChNU1hNTEhUVFApO1xuICAgICAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFByZXZlbnRzIGNhY2hlaW5nIG9mIEFKQVggcmVxdWVzdHMuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnSWYtTW9kaWZpZWQtU2luY2UnOiAnU2F0LCAyOSBPY3QgMTk5NCAxOTo0MzozMSBHTVQnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHRoZSBzZXJ2ZXIga25vdyB0aGF0IHRoaXMgaXMgYW4gQUpBWCByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHNlcnZlciBrbm93IHdoaWNoIHdlYiBhcHBsaWNhdGlvbiBpcyBzZW5kaW5nIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLUJ5JzogJ0Z1c2lvbkNoYXJ0cycsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1lbnRpb25zIGNvbnRlbnQtdHlwZXMgdGhhdCBhcmUgYWNjZXB0YWJsZSBmb3IgdGhlIHJlc3BvbnNlLiBTb21lIHNlcnZlcnMgcmVxdWlyZSB0aGlzIGZvciBBamF4XG4gICAgICAgICAgICAgKiBjb21tdW5pY2F0aW9uLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICd0ZXh0L3BsYWluLCAqLyonLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgTUlNRSB0eXBlIG9mIHRoZSBib2R5IG9mIHRoZSByZXF1ZXN0IGFsb25nIHdpdGggaXRzIGNoYXJzZXQuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCdcbiAgICAgICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmFqYXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQWpheChhcmd1bWVudHNbMF0pO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZ2V0ID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB2YXIgd3JhcHBlciA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gd3JhcHBlci54bWxodHRwLFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjayA9IHdyYXBwZXIub25FcnJvcixcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayA9IHdyYXBwZXIub25TdWNjZXNzLFxuICAgICAgICAgICAgeFJlcXVlc3RlZEJ5ID0gJ1gtUmVxdWVzdGVkLUJ5JyxcbiAgICAgICAgICAgIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgZXZlbnRMaXN0ID0gWydvbmxvYWRzdGFydCcsICdvbmR1cmF0aW9uY2hhbmdlJywgJ29ubG9hZGVkbWV0YWRhdGEnLCAnb25sb2FkZWRkYXRhJywgJ29ucHJvZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICdvbmNhbnBsYXknLCAnb25jYW5wbGF5dGhyb3VnaCcsICdvbmFib3J0JywgJ29uZXJyb3InLCAnb250aW1lb3V0JywgJ29ubG9hZGVuZCddO1xuXG4gICAgICAgIC8vIFgtUmVxdWVzdGVkLUJ5IGlzIHJlbW92ZWQgZnJvbSBoZWFkZXIgZHVyaW5nIGNyb3NzIGRvbWFpbiBhamF4IGNhbGxcbiAgICAgICAgaWYgKHVybC5zZWFyY2goL14oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKS8pICE9PSAtMSAmJlxuICAgICAgICAgICAgICAgIHdpbi5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gLyhodHRwOlxcL1xcL3xodHRwczpcXC9cXC8pKFteXFwvXFw6XSopLy5leGVjKHVybClbMl0pIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBodHRwIG9yIGh0dHBzLCB0aGVuIGl0cyBhIHNhbWUgZG9tYWluIGNhbGwuIE5vIG5lZWQgdG8gdXNlIHJlZ2V4IHRvIGdldFxuICAgICAgICAgICAgLy8gZG9tYWluLiBJZiBpdCBjb250YWlucyB0aGVuIGNoZWNrcyBkb21haW4uXG4gICAgICAgICAgICBkZWxldGUgaGVhZGVyc1t4UmVxdWVzdGVkQnldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIWhhc093bi5jYWxsKGhlYWRlcnMsIHhSZXF1ZXN0ZWRCeSkgJiYgKGhlYWRlcnNbeFJlcXVlc3RlZEJ5XSA9ICdGdXNpb25DaGFydHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgheG1saHR0cCB8fCBpZWx0OCB8fCBmaXJlZm94KSB7XG4gICAgICAgICAgICB4bWxodHRwID0gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHdyYXBwZXIueG1saHR0cCA9IHhtbGh0dHA7XG4gICAgICAgIH1cblxuICAgICAgICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHhtbGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICgoIXhtbGh0dHAuc3RhdHVzICYmIGZpbGVQcm90b2NvbCkgfHwgKHhtbGh0dHAuc3RhdHVzID49IDIwMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgeG1saHR0cC5zdGF0dXMgPCAzMDApIHx8IHhtbGh0dHAuc3RhdHVzID09PSAzMDQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzID09PSAxMjIzIHx8IHhtbGh0dHAuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHhtbGh0dHAucmVzcG9uc2VUZXh0LCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sobmV3IEVycm9yKFhIUkVRRVJST1IpLCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3cmFwcGVyLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBldmVudExpc3QuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgICAgICB4bWxodHRwW2V2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudChldmVudE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnQgOiBldmVudFxuICAgICAgICAgICAgICAgIH0sIHdyYXBwZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhtbGh0dHAub3BlbihHRVQsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICh4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoaSwgaGVhZGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHhtbGh0dHAuc2VuZCgpO1xuICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gaW5zdGFuY2UueG1saHR0cDtcblxuICAgICAgICBpbnN0YW5jZS5vcGVuID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB4bWxodHRwICYmIHR5cGVvZiB4bWxodHRwLmFib3J0ID09PSBGVU5DVElPTiAmJiB4bWxodHRwLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgICAgICB4bWxodHRwLnJlYWR5U3RhdGUgIT09IDAgJiYgeG1saHR0cC5hYm9ydCgpO1xuICAgIH07XG5cbiAgICBhamF4UHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2Uub3BlbiAmJiBpbnN0YW5jZS5hYm9ydCgpO1xuXG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vbkVycm9yO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25TdWNjZXNzO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2UueG1saHR0cDtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9wZW47XG5cbiAgICAgICAgcmV0dXJuIChpbnN0YW5jZSA9IG51bGwpO1xuICAgIH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgLy8gU291cmNlOiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzE1MDQtQXNrLUJlbi1QYXJzaW5nLUNTVi1TdHJpbmdzLVdpdGgtSmF2YXNjcmlwdC1FeGVjLVJlZ3VsYXItRXhwcmVzc2lvbi1Db21tYW5kLmh0bVxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cblxuICAgIC8vIFRoaXMgd2lsbCBwYXJzZSBhIGRlbGltaXRlZCBzdHJpbmcgaW50byBhbiBhcnJheSBvZlxuICAgIC8vIGFycmF5cy4gVGhlIGRlZmF1bHQgZGVsaW1pdGVyIGlzIHRoZSBjb21tYSwgYnV0IHRoaXNcbiAgICAvLyBjYW4gYmUgb3ZlcnJpZGVuIGluIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgZnVuY3Rpb24gQ1NWVG9BcnJheSAoc3RyRGF0YSwgc3RyRGVsaW1pdGVyKSB7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZGVsaW1pdGVyIGlzIGRlZmluZWQuIElmIG5vdCxcbiAgICAgICAgLy8gdGhlbiBkZWZhdWx0IHRvIGNvbW1hLlxuICAgICAgICBzdHJEZWxpbWl0ZXIgPSAoc3RyRGVsaW1pdGVyIHx8IFwiLFwiKTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcmVndWxhciBleHByZXNzaW9uIHRvIHBhcnNlIHRoZSBDU1YgdmFsdWVzLlxuICAgICAgICB2YXIgb2JqUGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgLy8gRGVsaW1pdGVycy5cbiAgICAgICAgICAgICAgICBcIihcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcInxcXFxccj9cXFxcbnxcXFxccnxeKVwiICtcbiAgICAgICAgICAgICAgICAvLyBRdW90ZWQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKD86XFxcIihbXlxcXCJdKig/OlxcXCJcXFwiW15cXFwiXSopKilcXFwifFwiICtcbiAgICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoW15cXFwiXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJcXFxcclxcXFxuXSopKVwiXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJnaVwiXG4gICAgICAgICAgICApO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgZGF0YS4gR2l2ZSB0aGUgYXJyYXlcbiAgICAgICAgLy8gYSBkZWZhdWx0IGVtcHR5IGZpcnN0IHJvdy5cbiAgICAgICAgdmFyIGFyckRhdGEgPSBbW11dO1xuICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgdG8gaG9sZCBvdXIgaW5kaXZpZHVhbCBwYXR0ZXJuXG4gICAgICAgIC8vIG1hdGNoaW5nIGdyb3Vwcy5cbiAgICAgICAgdmFyIGFyck1hdGNoZXMgPSBudWxsO1xuICAgICAgICAvLyBLZWVwIGxvb3Bpbmcgb3ZlciB0aGUgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXNcbiAgICAgICAgLy8gdW50aWwgd2UgY2FuIG5vIGxvbmdlciBmaW5kIGEgbWF0Y2guXG4gICAgICAgIHdoaWxlIChhcnJNYXRjaGVzID0gb2JqUGF0dGVybi5leGVjKCBzdHJEYXRhICkpe1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBkZWxpbWl0ZXIgdGhhdCB3YXMgZm91bmQuXG4gICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZERlbGltaXRlciA9IGFyck1hdGNoZXNbIDEgXTtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgZ2l2ZW4gZGVsaW1pdGVyIGhhcyBhIGxlbmd0aFxuICAgICAgICAgICAgLy8gKGlzIG5vdCB0aGUgc3RhcnQgb2Ygc3RyaW5nKSBhbmQgaWYgaXQgbWF0Y2hlc1xuICAgICAgICAgICAgLy8gZmllbGQgZGVsaW1pdGVyLiBJZiBpZCBkb2VzIG5vdCwgdGhlbiB3ZSBrbm93XG4gICAgICAgICAgICAvLyB0aGF0IHRoaXMgZGVsaW1pdGVyIGlzIGEgcm93IGRlbGltaXRlci5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBzdHJNYXRjaGVkRGVsaW1pdGVyLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIChzdHJNYXRjaGVkRGVsaW1pdGVyICE9IHN0ckRlbGltaXRlcilcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIGhhdmUgcmVhY2hlZCBhIG5ldyByb3cgb2YgZGF0YSxcbiAgICAgICAgICAgICAgICAvLyBhZGQgYW4gZW1wdHkgcm93IHRvIG91ciBkYXRhIGFycmF5LlxuICAgICAgICAgICAgICAgIGFyckRhdGEucHVzaCggW10gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIGRlbGltaXRlciBvdXQgb2YgdGhlIHdheSxcbiAgICAgICAgICAgIC8vIGxldCdzIGNoZWNrIHRvIHNlZSB3aGljaCBraW5kIG9mIHZhbHVlIHdlXG4gICAgICAgICAgICAvLyBjYXB0dXJlZCAocXVvdGVkIG9yIHVucXVvdGVkKS5cbiAgICAgICAgICAgIGlmIChhcnJNYXRjaGVzWyAyIF0pe1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgcXVvdGVkIHZhbHVlLiBXaGVuIHdlIGNhcHR1cmVcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHZhbHVlLCB1bmVzY2FwZSBhbnkgZG91YmxlIHF1b3Rlcy5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMiBdLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoIFwiXFxcIlxcXCJcIiwgXCJnXCIgKSxcbiAgICAgICAgICAgICAgICAgICAgXCJcXFwiXCJcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBub24tcXVvdGVkIHZhbHVlLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAzIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciB2YWx1ZSBzdHJpbmcsIGxldCdzIGFkZFxuICAgICAgICAgICAgLy8gaXQgdG8gdGhlIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICBhcnJEYXRhWyBhcnJEYXRhLmxlbmd0aCAtIDEgXS5wdXNoKCBzdHJNYXRjaGVkVmFsdWUgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdGhlIHBhcnNlZCBkYXRhLlxuICAgICAgICByZXR1cm4oIGFyckRhdGEgKTtcbiAgICB9XG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTtcbiIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXJcdG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZGF0YVN0b3JhZ2UgPSBsaWIuZGF0YVN0b3JhZ2UgPSB7fSxcblx0XHRvdXRwdXREYXRhU3RvcmFnZSA9IGxpYi5vdXRwdXREYXRhU3RvcmFnZSA9IHt9LFxuXHRcdG1ldGFTdG9yYWdlID0gbGliLm1ldGFTdG9yYWdlID0ge30sXG5cdFx0ZXh0ZW5kMiA9IGxpYi5leHRlbmQyLFxuXHRcdC8vIEZvciBzdG9yaW5nIHRoZSBjaGlsZCBvZiBhIHBhcmVudFxuXHRcdGxpbmtTdG9yZSA9IHt9LFxuXHRcdC8vRm9yIHN0b3JpbmcgdGhlIHBhcmVudCBvZiBhIGNoaWxkXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUgPSB7fSxcblx0XHRpZENvdW50ID0gMCxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVN0b3JlLlxuXHRcdERhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXHQgICAgXHRtYW5hZ2VyLnNldERhdGEoYXJndW1lbnRzWzBdKTtcblx0XHR9LFxuXHRcdGRhdGFTdG9yZVByb3RvID0gRGF0YVN0b3JlLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdGhlIGRhdGFQcm9jZXNzb3Igb3ZlciB0aGUgZGF0YVxuXHRcdGV4ZWN1dGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAodHlwZSwgZmlsdGVyRm4sIEpTT05EYXRhKSB7XG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0Y2FzZSAgJ2ZpbHRlcicgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGNhc2UgJ21hcCcgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvL0Z1bmN0aW9uIHRvIHVwZGF0ZSBhbGwgdGhlIGxpbmtlZCBjaGlsZCBkYXRhXG5cdFx0dXBkYXRhRGF0YSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSxcblx0XHRcdFx0cGFyZW50RGF0YSA9IChvdXRwdXREYXRhU3RvcmFnZVtpZF0gJiYgb3V0cHV0RGF0YVN0b3JhZ2VbaWRdLmRhdGEpIHx8IGRhdGFTdG9yYWdlW2lkXSxcblx0XHRcdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUsXG5cdFx0XHRcdGxlbixcblx0XHRcdFx0bGlua0lkcyxcblx0XHRcdFx0ZmlsdGVycyxcblx0XHRcdFx0bGlua0lkLFxuXHRcdFx0XHRmaWx0ZXIsXG5cdFx0XHRcdGZpbHRlckZuLFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRvdXRTcGVjcyxcblx0XHRcdFx0ZGF0YVN0b3JlLFxuXHRcdFx0XHRwcm9jZXNzb3IsXG5cdFx0XHRcdC8vIFN0b3JlIGFsbCB0aGUgZGF0YU9ianMgdGhhdCBhcmUgdXBkYXRlZC5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkID0gbGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXG5cdFx0XHRsaW5rSWRzID0gbGlua0RhdGEubGluaztcblx0XHRcdGZpbHRlcnMgPSBsaW5rRGF0YS5maWx0ZXI7XG5cdFx0XHRsZW4gPSBsaW5rSWRzLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGRhdGFTdG9yZSA9IGxpbmtJZHNbaV07XG5cdFx0XHRcdGxpbmtJZCA9IGRhdGFTdG9yZS5pZDtcblxuXHRcdFx0XHR0ZW1wRGF0YVVwZGF0ZWRbbGlua0lkXSA9IHRydWU7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV07XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldFByb2Nlc3NvcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmIChmaWx0ZXJTdG9yZVtmaWx0ZXIuaWRdKSB7XG5cdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdID0gZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBmaWx0ZXJGbiwgcGFyZW50RGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IHBhcmVudERhdGE7XG5cdFx0XHRcdFx0XHRmaWx0ZXIuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aSAtPSAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIE1vZGlmeWluZyBkYXRhIG9mIHNlbGYgYXBwbGllZCBwcm9jZXNzb3IuXG5cdFx0XHRcdFx0aWYgKG91dFNwZWNzID0gIG91dHB1dERhdGFTdG9yYWdlW2xpbmtJZF0pIHtcblx0XHRcdFx0XHRcdHByb2Nlc3NvciA9IG91dFNwZWNzLnByb2Nlc3Nvcjtcblx0XHRcdFx0XHRcdG91dHB1dERhdGFTdG9yYWdlW2xpbmtJZF0gPSBleGVjdXRlUHJvY2Vzc29yKHByb2Nlc3Nvci50eXBlLCBwcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCksXG5cdFx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0XHRcdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAobGlua1N0b3JlW2xpbmtJZF0pIHtcblx0XHRcdFx0XHR1cGRhdGFEYXRhKGxpbmtJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgbWV0YURhdGEgb2YgdGhlIGNoaWxkIGRhdGEgcmVjdXJzc2l2ZWx5XG5cdFx0dXBkYXRlTWV0YURhdGEgPSBmdW5jdGlvbiAoaWQsIG1ldGFEYXRhKSB7XG5cdFx0XHR2YXIgbGlua3MgPSBsaW5rU3RvcmVbaWRdLmxpbmssXG5cdFx0XHRcdGxlbmd0aCA9IGxpbmtzLmxlbmd0aCxcblx0XHRcdFx0aSxcblx0XHRcdFx0bmV3TWV0YURhdGEsXG5cdFx0XHRcdGxpbms7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsaW5rID0gbGlua3NbaV0uaWQ7XG5cdFx0XHRcdG5ld01ldGFEYXRhID0gbWV0YVN0b3JhZ2VbbGlua10gPSBleHRlbmQyKHt9LCBtZXRhRGF0YSk7XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbbGlua10pIHtcblx0XHRcdFx0XHR1cGRhdGVNZXRhRGF0YShsaW5rLCBuZXdNZXRhRGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhU3RvcmUoYXJndW1lbnRzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSBpbiB0aGUgZGF0YSBzdG9yZVxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhID0gZnVuY3Rpb24gKGRhdGFTcGVjcywgY2FsbGJhY2ssIG5vUmFpc2VFdmVudEZsYWcpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdG9sZElkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0aWQgPSBkYXRhU3BlY3MuaWQsXG5cdFx0XHRkYXRhVHlwZSA9IGRhdGFTcGVjcy5kYXRhVHlwZSxcblx0XHRcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdG9sZEpTT05EYXRhID0gZGF0YVN0b3JhZ2Vbb2xkSWRdIHx8IFtdLFxuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbiA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdFx0XHRkYXRhU3RvcmFnZVtpZF0gPSBvbGRKU09ORGF0YS5jb25jYXQoSlNPTkRhdGEgfHwgW10pO1xuXHRcdFx0XHQhbm9SYWlzZUV2ZW50RmxhZyAmJiBKU09ORGF0YSAmJiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YUFkZGVkJywge1xuXHRcdFx0XHRcdCdpZCc6IGlkLFxuXHRcdFx0XHRcdCdkYXRhJyA6IEpTT05EYXRhXG5cdFx0XHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0XHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShpZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKEpTT05EYXRhKTtcblx0XHRcdFx0fVx0XG5cdFx0XHR9O1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZGF0YVN0b3JhZ2UnICsgaWRDb3VudCArKztcblx0XHRkYXRhU3RvcmUuaWQgPSBpZDtcblx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXG5cdFx0aWYgKGRhdGFUeXBlID09PSAnY3N2Jykge1xuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5KHtcblx0XHRcdFx0c3RyaW5nIDogZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRcdGRlbGltaXRlciA6IGRhdGFTcGVjcy5kZWxpbWl0ZXIsXG5cdFx0XHRcdG91dHB1dEZvcm1hdCA6IGRhdGFTcGVjcy5vdXRwdXRGb3JtYXQsXG5cdFx0XHRcdGNhbGxiYWNrIDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGFTb3VyY2UpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHRkYXRhU3RvcmVQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpZCA9IHRoaXMuaWQ7XG5cdFx0cmV0dXJuICgob3V0cHV0RGF0YVN0b3JhZ2VbaWRdICYmIG91dHB1dERhdGFTdG9yYWdlW2lkXS5kYXRhKSB8fCBkYXRhU3RvcmFnZVtpZF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCBjaGlsZCBkYXRhIG9iamVjdCBhZnRlciBhcHBseWluZyBmaWx0ZXIgb24gdGhlIHBhcmVudCBkYXRhLlxuXHQvLyBAcGFyYW1zIHtmaWx0ZXJzfSAtIFRoaXMgY2FuIGJlIGEgZmlsdGVyIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIGZpbHRlciBmdW5jdGlvbnMuXG5cdGRhdGFTdG9yZVByb3RvLmdldERhdGEgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdGlkID0gZGF0YS5pZCxcblx0XHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluaztcblx0XHQvLyBJZiBubyBwYXJhbWV0ZXIgaXMgcHJlc2VudCB0aGVuIHJldHVybiB0aGUgdW5maWx0ZXJlZCBkYXRhLlxuXHRcdGlmICghZmlsdGVycykge1xuXHRcdFx0cmV0dXJuIGRhdGFTdG9yYWdlW2lkXTtcblx0XHR9XG5cdFx0Ly8gSWYgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIGZpbHRlciB0aGVuIHJldHVybiB0aGUgZmlsdGVyZWQgZGF0YSBhZnRlciBhcHBseWluZyB0aGUgZmlsdGVyIG92ZXIgdGhlIGRhdGEuXG5cdFx0ZWxzZSB7XG5cdFx0XHRsZXQgcmVzdWx0ID0gW10sXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld0RhdGEsXG5cdFx0XHRcdGxpbmtEYXRhLFxuXHRcdFx0XHRuZXdJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0ZGF0YWxpbmtzLFxuXHRcdFx0XHRmaWx0ZXJJRCxcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0bmV3RGF0YU9iaixcblx0XHRcdFx0aXNGaWx0ZXJBcnJheSA9IGZpbHRlcnMgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdFx0bGVuID0gaXNGaWx0ZXJBcnJheSA/IGZpbHRlcnMubGVuZ3RoIDogMTtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV0gfHwgZmlsdGVycztcblx0XHRcdFx0ZmlsdGVyRm4gPSBmaWx0ZXIuZ2V0UHJvY2Vzc29yKCk7XG5cdFx0XHRcdHR5cGUgPSBmaWx0ZXIudHlwZTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0bmV3RGF0YSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIGRhdGFTdG9yYWdlW2lkXSk7XG5cblx0XHRcdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YVByb2Nlc3NvckFwcGxpZWQnLCB7XG5cdFx0XHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YSxcblx0XHRcdFx0XHRcdCdkYXRhUHJvY2Vzc29yJyA6IGZpbHRlclxuXHRcdFx0XHRcdH0sIGRhdGEpO1xuXG5cdFx0XHRcdFx0bmV3RGF0YU9iaiA9IG5ldyBEYXRhU3RvcmUoe2RhdGFTb3VyY2UgOiBuZXdEYXRhfSk7XG5cdFx0XHRcdFx0bmV3SWQgPSBuZXdEYXRhT2JqLmlkO1xuXG5cdFx0XHRcdFx0Ly9QYXNzaW5nIHRoZSBtZXRhRGF0YSB0byB0aGUgY2hpbGQuXG5cdFx0XHRcdFx0bmV3RGF0YU9iai5hZGRNZXRhRGF0YShtZXRhU3RvcmFnZVtpZF0pO1xuXHRcdFx0XHRcdHBhcmVudFN0b3JlW25ld0lkXSA9IGRhdGE7XG5cblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXdEYXRhT2JqKTtcblxuXHRcdFx0XHRcdC8vUHVzaGluZyB0aGUgaWQgYW5kIGZpbHRlciBvZiBjaGlsZCBjbGFzcyB1bmRlciB0aGUgcGFyZW50IGNsYXNzZXMgaWQuXG5cdFx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdIHx8IChsaW5rU3RvcmVbaWRdID0ge1xuXHRcdFx0XHRcdFx0bGluayA6IFtdLFxuXHRcdFx0XHRcdFx0ZmlsdGVyIDogW11cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRsaW5rRGF0YS5saW5rLnB1c2gobmV3RGF0YU9iaik7XG5cdFx0XHRcdFx0bGlua0RhdGEuZmlsdGVyLnB1c2goZmlsdGVyKTtcblxuXHRcdFx0XHRcdC8vIFN0b3JpbmcgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIHVuZGVyIHRoZSBmaWx0ZXIgaWQuXG5cdFx0XHRcdFx0ZmlsdGVySUQgPSBmaWx0ZXIuZ2V0SUQoKTtcblx0XHRcdFx0XHRkYXRhbGlua3MgPSBmaWx0ZXJMaW5rW2ZpbHRlcklEXSB8fCAoZmlsdGVyTGlua1tmaWx0ZXJJRF0gPSBbXSk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzLnB1c2gobmV3RGF0YU9iaik7XG5cblx0XHRcdFx0XHQvLyBzZXR0aW5nIHRoZSBjdXJyZW50IGlkIGFzIHRoZSBuZXdJRCBzbyB0aGF0IHRoZSBuZXh0IGZpbHRlciBpcyBhcHBsaWVkIG9uIHRoZSBjaGlsZCBkYXRhO1xuXHRcdFx0XHRcdGlkID0gbmV3SWQ7XG5cdFx0XHRcdFx0ZGF0YSA9IG5ld0RhdGFPYmo7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiAoaXNGaWx0ZXJBcnJheSA/IHJlc3VsdCA6IHJlc3VsdFswXSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGRlbGV0ZSB0aGUgY3VycmVudCBkYXRhIGZyb20gdGhlIGRhdGFTdG9yYWdlIGFuZCBhbHNvIGFsbCBpdHMgY2hpbGRzIHJlY3Vyc2l2ZWx5XG5cdGRhdGFTdG9yZVByb3RvLmRlbGV0ZURhdGEgPSBmdW5jdGlvbiAob3B0aW9uYWxJZCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBvcHRpb25hbElkIHx8IGRhdGFTdG9yZS5pZCxcblx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSxcblx0XHRcdGZsYWc7XG5cblx0XHRpZiAobGlua0RhdGEpIHtcblx0XHRcdGxldCBpLFxuXHRcdFx0XHRsaW5rID0gbGlua0RhdGEubGluayxcblx0XHRcdFx0bGVuID0gbGluay5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICsrKSB7XG5cdFx0XHRcdGxpbmtbaV0uZGVsZXRlRGF0YSgpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGxpbmtTdG9yZVtpZF07XG5cdFx0fVxuXG5cdFx0ZGVsZXRlIG1ldGFTdG9yYWdlW2lkXTtcblx0XHRkZWxldGUgb3V0cHV0RGF0YVN0b3JhZ2VbaWRdO1xuXG5cdFx0ZmxhZyA9IGRlbGV0ZSBkYXRhU3RvcmFnZVtpZF07XG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFEZWxldGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0fSwgZGF0YVN0b3JlKTtcblx0XHRyZXR1cm4gZmxhZztcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGlkIG9mIHRoZSBjdXJyZW50IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gbW9kaWZ5IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8ubW9kaWZ5RGF0YSA9IGZ1bmN0aW9uIChkYXRhU3BlY3MsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZDtcblxuXHRcdGRhdGFTdG9yYWdlW2lkXSA9IFtdO1xuXHRcdGRhdGFTdG9yZS5zZXREYXRhKGRhdGFTcGVjcywgY2FsbGJhY2ssIHRydWUpO1xuXHRcdFxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhTW9kaWZpZWQnLCB7XG5cdFx0XHQnaWQnOiBpZFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgdG8gdGhlIGRhdGFTdG9yYWdlIGFzeW5jaHJvbm91c2x5IHZpYSBhamF4XG5cdGRhdGFTdG9yZVByb3RvLnNldERhdGFVcmwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGRhdGFTb3VyY2UgPSBhcmd1bWVudC5kYXRhU291cmNlLFxuXHRcdFx0ZGF0YVR5cGUgPSBhcmd1bWVudC5kYXRhVHlwZSxcblx0XHRcdGRlbGltaXRlciA9IGFyZ3VtZW50LmRlbGltaXRlcixcblx0XHRcdG91dHB1dEZvcm1hdCA9IGFyZ3VtZW50Lm91dHB1dEZvcm1hdCxcblx0XHRcdGNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2ssXG5cdFx0XHRjYWxsYmFja0FyZ3MgPSBhcmd1bWVudC5jYWxsYmFja0FyZ3MsXG5cdFx0XHRkYXRhO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLmFqYXgoe1xuXHRcdFx0dXJsIDogZGF0YVNvdXJjZSxcblx0XHRcdHN1Y2Nlc3MgOiBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdFx0ZGF0YSA9IGRhdGFUeXBlID09PSAnanNvbicgPyBKU09OLnBhcnNlKHN0cmluZykgOiBzdHJpbmc7XG5cdFx0XHRcdGRhdGFTdG9yZS5zZXREYXRhKHtcblx0XHRcdFx0XHRkYXRhU291cmNlIDogZGF0YSxcblx0XHRcdFx0XHRkYXRhVHlwZSA6IGRhdGFUeXBlLFxuXHRcdFx0XHRcdGRlbGltaXRlciA6IGRlbGltaXRlcixcblx0XHRcdFx0XHRvdXRwdXRGb3JtYXQgOiBvdXRwdXRGb3JtYXQsXG5cdFx0XHRcdH0sIGNhbGxiYWNrKTtcblx0XHRcdH0sXG5cblx0XHRcdGVycm9yIDogZnVuY3Rpb24oKXtcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKGNhbGxiYWNrQXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCBhbGwgdGhlIGtleXMgb2YgdGhlIEpTT04gZGF0YVxuXHRkYXRhU3RvcmVQcm90by5nZXRLZXlzID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRhdGFTdG9yZS5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0a2V5cyA9IGRhdGFTdG9yZS5rZXlzO1xuXG5cdFx0aWYgKGtleXMpIHtcblx0XHRcdHJldHVybiBrZXlzO1xuXHRcdH1cblx0XHRpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJldHVybiAoZGF0YVN0b3JlLmtleXMgPSBpbnRlcm5hbERhdGEpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBPYmplY3QpIHtcblx0XHRcdHJldHVybiAoZGF0YVN0b3JlLmtleXMgPSBPYmplY3Qua2V5cyhpbnRlcm5hbERhdGEpKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSB1bmlxdWUgdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXlcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0VW5pcXVlVmFsdWVzID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRhdGFTdG9yZS5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0aXNBcnJheSA9IGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5LFxuXHRcdFx0dW5pcXVlVmFsdWVzID0gZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldLFxuXHRcdFx0dGVtcFVuaXF1ZVZhbHVlcyA9IHt9LFxuXHRcdFx0bGVuID0gZGF0YS5sZW5ndGgsXG5cdFx0XHRpO1xuXG5cdFx0aWYgKHVuaXF1ZVZhbHVlcykge1xuXHRcdFx0cmV0dXJuIHVuaXF1ZVZhbHVlcztcblx0XHR9XG5cblx0XHRpZiAoaXNBcnJheSkge1xuXHRcdFx0aSA9IDE7XG5cdFx0XHRrZXkgPSBkYXRhU3RvcmUuZ2V0S2V5cygpLmZpbmRJbmRleChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC50b1VwcGVyQ2FzZSgpID09PSBrZXkudG9VcHBlckNhc2UoKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGkgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IGlzQXJyYXkgPyAxIDogMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpbnRlcm5hbERhdGEgPSBpc0FycmF5ID8gZGF0YVtpXVtrZXldIDogZGF0YVtpXVtrZXldO1xuXHRcdFx0IXRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSAmJiAodGVtcFVuaXF1ZVZhbHVlc1tpbnRlcm5hbERhdGFdID0gdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChkYXRhU3RvcmUudW5pcXVlVmFsdWVzW2tleV0gPSBPYmplY3Qua2V5cyh0ZW1wVW5pcXVlVmFsdWVzKSk7XG5cdH07XG5cblx0Ly9GdW5jdGlvbiB0byBjaGFuZ2UgdGhlIG91dHB1dCBvZiBnZXRKU09OKCkgYmFzZWQgb24gdGhlIGRhdGFQcm9jZXNzb3IgYXBwbGllZFxuXHRkYXRhU3RvcmVQcm90by5hcHBseURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoZGF0YVByb2Nlc3Nvcikge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0cHJvY2Vzc29yRm4gPSBkYXRhUHJvY2Vzc29yLmdldFByb2Nlc3NvcigpLFxuXHRcdFx0dHlwZSA9IGRhdGFQcm9jZXNzb3IudHlwZSxcblx0XHRcdGlkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0b3V0cHV0LFxuXHRcdFx0SlNPTkRhdGEgPSBkYXRhU3RvcmFnZVtpZF07XG5cblx0XHRpZiAodHlwZW9mIHByb2Nlc3NvckZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRvdXRwdXQgPSBvdXRwdXREYXRhU3RvcmFnZVtkYXRhU3RvcmUuaWRdID0ge1xuXHRcdFx0XHRkYXRhIDogZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBwcm9jZXNzb3JGbiwgSlNPTkRhdGEpLFxuXHRcdFx0XHRwcm9jZXNzb3IgOiBkYXRhUHJvY2Vzc29yXG5cdFx0XHR9O1xuXG5cdFx0XHRkZWxldGUgZGF0YVN0b3JlLmtleXM7XG5cdFx0XHRkYXRhU3RvcmUudW5pcXVlVmFsdWVzID0ge307XG5cblx0XHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHRcdHVwZGF0YURhdGEoaWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgndGVtcEV2ZW50Jywge1xuXHRcdFx0XHQnZGF0YVN0b3JlJzogZGF0YVN0b3JlLFxuXHRcdFx0XHQnZGF0YVByb2Nlc3NvcicgOiBkYXRhUHJvY2Vzc29yXG5cdFx0XHR9LCBkYXRhU3RvcmUpO1xuXG5cdFx0XHRyZXR1cm4gb3V0cHV0LmRhdGE7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBtZXRhZGF0YVxuXHRkYXRhU3RvcmVQcm90by5hZGRNZXRhRGF0YSA9IGZ1bmN0aW9uIChtZXRhRGF0YSwgbWVyZ2UpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gZGF0YVN0b3JlLmlkLFxuXHRcdFx0bmV3TWV0YURhdGE7XG5cdFx0aWYgKG1lcmdlKSB7XG5cdFx0XHRuZXdNZXRhRGF0YSA9IG1ldGFTdG9yYWdlW2lkXSA9IGV4dGVuZDIobWV0YVN0b3JhZ2VbaWRdIHx8IHt9LCBtZXRhRGF0YSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtpZF0gPSBtZXRhRGF0YTtcblx0XHR9XG5cdFx0bGlua1N0b3JlW2lkXSAmJiB1cGRhdGVNZXRhRGF0YShpZCwgbmV3TWV0YURhdGEpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgYWRkZWQgbWV0YURhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0TWV0YURhdGEgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG1ldGFTdG9yYWdlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG5cdGRhdGFTdG9yZVByb3RvLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG5cdGRhdGFTdG9yZVByb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcblx0XHRsaWIgPSBtdWx0aUNoYXJ0aW5nUHJvdG8ubGliLFxuXHRcdGZpbHRlclN0b3JlID0gbGliLmZpbHRlclN0b3JlID0ge30sXG5cdFx0ZmlsdGVyTGluayA9IGxpYi5maWx0ZXJMaW5rID0ge30sXG5cdFx0ZmlsdGVySWRDb3VudCA9IDAsXG5cdFx0ZGF0YVN0b3JhZ2UgPSBsaWIuZGF0YVN0b3JhZ2UsXG5cdFx0cGFyZW50U3RvcmUgPSBsaWIucGFyZW50U3RvcmUsXG5cdFx0Ly8gQ29uc3RydWN0b3IgY2xhc3MgZm9yIERhdGFQcm9jZXNzb3IuXG5cdFx0RGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIG1hbmFnZXIgPSB0aGlzO1xuXHQgICAgXHRtYW5hZ2VyLmFkZFJ1bGUoYXJndW1lbnRzWzBdKTtcblx0XHR9LFxuXHRcdFxuXHRcdGRhdGFQcm9jZXNzb3JQcm90byA9IERhdGFQcm9jZXNzb3IucHJvdG90eXBlLFxuXG5cdFx0Ly8gRnVuY3Rpb24gdG8gdXBkYXRlIGRhdGEgb24gY2hhbmdlIG9mIGZpbHRlci5cblx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IgPSBmdW5jdGlvbiAoaWQsIGNvcHlQYXJlbnRUb0NoaWxkKSB7XG5cdFx0XHR2YXIgaSxcblx0XHRcdFx0ZGF0YSA9IGZpbHRlckxpbmtbaWRdLFxuXHRcdFx0XHRKU09ORGF0YSxcblx0XHRcdFx0ZGF0dW0sXG5cdFx0XHRcdGRhdGFJZCxcblx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKyspIHtcblx0XHRcdFx0ZGF0dW0gPSBkYXRhW2ldO1xuXHRcdFx0XHRkYXRhSWQgPSBkYXR1bS5pZDtcblx0XHRcdFx0aWYgKCFsaWIudGVtcERhdGFVcGRhdGVkW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRpZiAocGFyZW50U3RvcmVbZGF0YUlkXSAmJiBkYXRhU3RvcmFnZVtkYXRhSWRdKSB7XG5cdFx0XHRcdFx0XHRKU09ORGF0YSA9IHBhcmVudFN0b3JlW2RhdGFJZF0uZ2V0RGF0YSgpO1xuXHRcdFx0XHRcdFx0ZGF0dW0ubW9kaWZ5RGF0YShjb3B5UGFyZW50VG9DaGlsZCA/IEpTT05EYXRhIDogZmlsdGVyU3RvcmVbaWRdKEpTT05EYXRhKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGVsZXRlIHBhcmVudFN0b3JlW2RhdGFJZF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRsaWIudGVtcERhdGFVcGRhdGVkID0ge307XG5cdFx0fTtcblxuXHRtdWx0aUNoYXJ0aW5nUHJvdG8uY3JlYXRlRGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGFQcm9jZXNzb3IoYXJndW1lbnRzWzBdKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZmlsdGVyIGluIHRoZSBmaWx0ZXIgc3RvcmVcblx0ZGF0YVByb2Nlc3NvclByb3RvLmFkZFJ1bGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGZpbHRlciA9IHRoaXMsXG5cdFx0XHRvbGRJZCA9IGZpbHRlci5pZCxcblx0XHRcdGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdLFxuXHRcdFx0ZmlsdGVyRm4gPSAoYXJndW1lbnQgJiYgYXJndW1lbnQucnVsZSkgfHwgYXJndW1lbnQsXG5cdFx0XHRpZCA9IGFyZ3VtZW50ICYmIGFyZ3VtZW50LnR5cGUsXG5cdFx0XHR0eXBlID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2ZpbHRlclN0b3JlJyArIGZpbHRlcklkQ291bnQgKys7XG5cdFx0ZmlsdGVyU3RvcmVbaWRdID0gZmlsdGVyRm47XG5cblx0XHRmaWx0ZXIuaWQgPSBpZDtcblx0XHRmaWx0ZXIudHlwZSA9IHR5cGU7XG5cblx0XHQvLyBVcGRhdGUgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIGFuZCBhbHNvIG9uIHRoZSBjaGlsZCBkYXRhLlxuXHRcdGlmIChmaWx0ZXJMaW5rW2lkXSkge1xuXHRcdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkKTtcblx0XHR9XG5cblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZmlsdGVyQWRkZWQnLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IGZpbHRlckZuXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCB0aGUgZmlsdGVyIG1ldGhvZC5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldFByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZmlsdGVyU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBJRCBvZiB0aGUgZmlsdGVyLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZGVsZXRlUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0aWQgPSBmaWx0ZXIuaWQ7XG5cblx0XHRmaWx0ZXJMaW5rW2lkXSAmJiB1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQsIHRydWUpO1xuXG5cdFx0ZGVsZXRlIGZpbHRlclN0b3JlW2lkXTtcblx0XHRkZWxldGUgZmlsdGVyTGlua1tpZF07XG5cblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZmlsdGVyRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2ZpbHRlcidcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5zb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnc29ydCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5tYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdtYXAnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDIsXG4gICAgICAgIE5VTEwgPSBudWxsLFxuICAgICAgICBDT0xPUiA9ICdjb2xvcicsXG4gICAgICAgIFBBTEVUVEVDT0xPUlMgPSAncGFsZXR0ZUNvbG9ycyc7XG4gICAgLy9mdW5jdGlvbiB0byBjb252ZXJ0IGRhdGEsIGl0IHJldHVybnMgZmMgc3VwcG9ydGVkIEpTT05cbiAgICB2YXIgRGF0YUFkYXB0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFhZGFwdGVyID0gdGhpcztcblxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhU3RvcmUgPSBhcmd1bWVudC5kYXRhc3RvcmU7ICAgICAgIFxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhSlNPTiA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiBkYXRhYWRhcHRlci5kYXRhU3RvcmUuZ2V0SlNPTigpO1xuICAgICAgICBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uID0gYXJndW1lbnQuY29uZmlnO1xuICAgICAgICBkYXRhYWRhcHRlci5jYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrO1xuICAgICAgICBkYXRhYWRhcHRlci5GQ2pzb24gPSBkYXRhYWRhcHRlci5jb252ZXJ0RGF0YSgpO1xuICAgIH0sXG4gICAgcHJvdG9EYXRhYWRhcHRlciA9IERhdGFBZGFwdGVyLnByb3RvdHlwZTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuY29udmVydERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcywgICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGEsXG4gICAgICAgICAgICBqc29uID0ge30sXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IHt9LFxuICAgICAgICAgICAganNvbkRhdGEgPSBkYXRhYWRhcHRlci5kYXRhSlNPTixcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhYWRhcHRlci5jYWxsYmFjaztcblxuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YSA9IGRhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAganNvbiA9IGRhdGFhZGFwdGVyLmpzb25DcmVhdG9yKGFnZ3JlZ2F0ZWREYXRhLCBjb25maWd1cmF0aW9uKTsgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBqc29uID0gKHByZWRlZmluZWRKc29uICYmIGV4dGVuZDIoanNvbixwcmVkZWZpbmVkSnNvbikpIHx8IGpzb247XG4gICAgICAgIGpzb24gPSAoY2FsbGJhY2sgJiYgY2FsbGJhY2soanNvbikpIHx8IGpzb247XG4gICAgICAgIHJldHVybiBkYXRhYWRhcHRlci5zZXREZWZhdWx0QXR0cihqc29uKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNhdGVnb3J5QXJyLCBkaW1lbnNpb24sIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGluZGVveE9mS2V5LFxuICAgICAgICAgICAgbmV3RGF0YSA9IFtdLFxuICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdLFxuICAgICAgICAgICAga2V5ID0gW10sXG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgICAgICBsZW5LZXksXG4gICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgbGVuQ2F0LFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgYXJyID0gW107XG4gICAgICAgICghQXJyYXkuaXNBcnJheShkaW1lbnNpb24pICYmIChrZXkgPSBbZGltZW5zaW9uXSkpIHx8IChrZXkgPSBkaW1lbnNpb24pO1xuICAgICAgICAoIUFycmF5LmlzQXJyYXkoY2F0ZWdvcnlBcnJbMF0pICYmIChjYXRlZ29yaWVzID0gW2NhdGVnb3J5QXJyXSkpIHx8IChjYXRlZ29yaWVzID0gY2F0ZWdvcnlBcnIpO1xuXG4gICAgICAgIG5ld0RhdGEucHVzaChkYXRhWzBdKTtcbiAgICAgICAgZm9yKGsgPSAwLCBsZW5LZXkgPSBrZXkubGVuZ3RoOyBrIDwgbGVuS2V5OyBrKyspIHtcbiAgICAgICAgICAgIGluZGVveE9mS2V5ID0gZGF0YVswXS5pbmRleE9mKGtleVtrXSk7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvcihpID0gMCxsZW5DYXQgPSBjYXRlZ29yaWVzW2tdLmxlbmd0aDsgaSA8IGxlbkNhdCAgJiYgaW5kZW94T2ZLZXkgIT09IC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzdWJTZXREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0gZGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHsgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgKGRhdGFbal1baW5kZW94T2ZLZXldID09IGNhdGVnb3JpZXNba11baV0pICYmIChzdWJTZXREYXRhLnB1c2goZGF0YVtqXSkpO1xuICAgICAgICAgICAgICAgIH0gICAgIFxuICAgICAgICAgICAgICAgIGFycltpbmRlb3hPZktleV0gPSBjYXRlZ29yaWVzW2tdW2ldO1xuICAgICAgICAgICAgICAgIChzdWJTZXREYXRhLmxlbmd0aCA9PT0gMCkgJiYgKHN1YlNldERhdGEucHVzaChhcnIpKTtcbiAgICAgICAgICAgICAgICBuZXdEYXRhLnB1c2goZGF0YWFkYXB0ZXIuZ2V0QWdncmVnYXRlRGF0YShzdWJTZXREYXRhLCBjYXRlZ29yaWVzW2tdW2ldLCBhZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5zZXREZWZhdWx0QXR0ciA9IGZ1bmN0aW9uIChqc29uKSB7XG4vKiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGRhdGFTdG9yZSA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSxcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIG1lYXN1cmUgPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24ubWVhc3VyZSxcbiAgICAgICAgICAgIG1ldGFEYXRhID0gZGF0YVN0b3JlICYmIGRhdGFTdG9yZS5nZXRNZXRhRGF0YSgpLFxuICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlO1xuXG4gICAgICAgIGpzb24uY2hhcnQgfHwgKGpzb24uY2hhcnQgPSB7fSk7XG4gICAgICAgIFxuICAgICAgICBrZXlFeGNsdWRlZEpzb25TdHIgPSAobWV0YURhdGEgJiYgSlNPTi5zdHJpbmdpZnkoanNvbiwgZnVuY3Rpb24oayx2KXtcbiAgICAgICAgICAgIGlmKGsgPT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBOVUxMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0pKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAganNvbiA9IChrZXlFeGNsdWRlZEpzb25TdHIgJiYgSlNPTi5wYXJzZShrZXlFeGNsdWRlZEpzb25TdHIpKSB8fCBqc29uO1xuXG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGkgPCBsZW4gJiYgbWV0YURhdGE7IGkrKykge1xuICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlID0gbWV0YURhdGFbbWVhc3VyZVtpXV0gJiYgbWV0YURhdGFbbWVhc3VyZVtpXV07XG4gICAgICAgICAgICBwYWxldHRlQ29sb3JzW2ldID0gKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgPyBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKCkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG1ldGFEYXRhTWVhc3VyZVtDT0xPUl07XG4gICAgICAgIH1cblxuICAgICAgICBqc29uLmNoYXJ0W1BBTEVUVEVDT0xPUlNdID0gcGFsZXR0ZUNvbG9yczsqL1xuICAgICAgICByZXR1cm4ganNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEsIGtleSwgYWdncmVnYXRlTW9kZSkge1xuICAgICAgICB2YXIgYWdncmVnYXRlTWV0aG9kID0ge1xuICAgICAgICAgICAgJ3N1bScgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IGRhdGFbMF07XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAxLCBsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChkYXRhW2ldW2pdICE9IGtleSkgJiYgKGFnZ3JlZ2F0ZWREYXRhW2pdID0gTnVtYmVyKGFnZ3JlZ2F0ZWREYXRhW2pdKSArIE51bWJlcihkYXRhW2ldW2pdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdhdmVyYWdlJyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBpQWdncmVnYXRlTXRoZCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGxlblIgPSBkYXRhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFN1bUFyciA9IGlBZ2dyZWdhdGVNdGhkLnN1bSgpLFxuICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBhZ2dyZWdhdGVkU3VtQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgKChhZ2dyZWdhdGVkU3VtQXJyW2ldICE9IGtleSkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAoYWdncmVnYXRlZERhdGFbaV0gPSAoTnVtYmVyKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pKSAvIGxlblIpKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYWdncmVnYXRlTW9kZSA9IGFnZ3JlZ2F0ZU1vZGUgJiYgYWdncmVnYXRlTW9kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gKGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSAmJiBhZ2dyZWdhdGVNb2RlKSB8fCAnc3VtJztcblxuICAgICAgICByZXR1cm4gYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdKCk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2VuZXJhbERhdGFGb3JtYXQgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoanNvbkRhdGFbMF0pLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheSA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBsZW5HZW5lcmFsRGF0YUFycmF5LFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBkaW1lbnNpb24gPSBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiB8fCBbXSxcbiAgICAgICAgICAgIG1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUgfHwgW107XG4gICAgICAgIGlmICghaXNBcnJheSl7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gW107XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdLnB1c2goZGltZW5zaW9uKTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChtZWFzdXJlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGpzb25EYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuR2VuZXJhbERhdGFBcnJheSA9IGdlbmVyYWxEYXRhQXJyYXlbMF0ubGVuZ3RoOyBqIDwgbGVuR2VuZXJhbERhdGFBcnJheTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbaV1bZ2VuZXJhbERhdGFBcnJheVswXVtqXV07ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdW2pdID0gdmFsdWUgfHwgJyc7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBqc29uRGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VuZXJhbERhdGFBcnJheTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5qc29uQ3JlYXRvciA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBjb25mID0gY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnbXMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNhdGVnb3JpZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NhdGVnb3J5JzogWyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllc1swXS5jYXRlZ29yeS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRbaV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzZXJpZXNuYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXS5kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdzcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVswXSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hMYWJlbF07ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hWYWx1ZV07IFxuICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBsYWJlbCB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDogdmFsdWUgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICd0cycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkuZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldID0geyAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0uZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzZXJpZXNUeXBlID0gKHNlcmllc1tzZXJpZXNUeXBlXSAmJiBzZXJpZXNUeXBlKSB8fCAnbXMnO1xuICAgICAgICByZXR1cm4gc2VyaWVzW3Nlcmllc1R5cGVdKGpzb25EYXRhLCBjb25mKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRGQ2pzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRkNqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERhdGFKc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFKU09OO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFnZ3JlZ2F0ZWREYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERpbWVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmRpbWVuc2lvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRNZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24ubWVhc3VyZTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRMaW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgbWF4ID0gLUluZmluaXR5LFxuICAgICAgICAgICAgbWluID0gK0luZmluaXR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGF0YSA9IGRhdGFhZGFwdGVyLmFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSArZGF0YVtpXVtqXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWF4ID0gbWF4IDwgdmFsdWUgPyB2YWx1ZSA6IG1heCk7XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1pbiA9IG1pbiA+IHZhbHVlID8gdmFsdWUgOiBtaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbWluJyA6IG1pbixcbiAgICAgICAgICAgICdtYXgnIDogbWF4XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBjYXRlZ29yeUxhYmVsID0gYXJndW1lbnRzWzBdICYmIGFyZ3VtZW50c1swXS50b1N0cmluZygpLFxuICAgICAgICAgICAgY2F0ZWdvcnlBcnIgPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLmNhdGVnb3JpZXMsXG4gICAgICAgICAgICBpbmRleCA9IGNhdGVnb3J5TGFiZWwgJiYgY2F0ZWdvcnlBcnIuaW5kZXhPZihjYXRlZ29yeUxhYmVsKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2hhcnQuZHJhd1RyZW5kUmVnaW9uKGluZGV4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuZGF0YWFkYXB0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YUFkYXB0ZXIoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xufSk7IiwiIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge307XG5cbiAgICAgICAgICAgIGNoYXJ0LmRhdGFTdG9yZUpzb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERhdGFKc29uKCk7XG4gICAgICAgICAgICBjaGFydC5kaW1lbnNpb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERpbWVuc2lvbigpO1xuICAgICAgICAgICAgY2hhcnQubWVhc3VyZSA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0TWVhc3VyZSgpO1xuICAgICAgICAgICAgY2hhcnQuYWdncmVnYXRlZERhdGEgPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldEFnZ3JlZ2F0ZWREYXRhKCk7XG4gICAgICAgICAgICBjaGFydC5yZW5kZXIoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnRQcm90byA9IENoYXJ0LnByb3RvdHlwZSxcbiAgICAgICAgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyLFxuICAgICAgICBnZXRSb3dEYXRhID0gZnVuY3Rpb24oZGF0YSwgYWdncmVnYXRlZERhdGEsIGRpbWVuc2lvbiwgbWVhc3VyZSwga2V5KSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICAgICAgayxcbiAgICAgICAgICAgICAgICBrayxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSksXG4gICAgICAgICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICAgICAgICBtYXRjaE9iaiA9IHt9LFxuICAgICAgICAgICAgICAgIGluZGV4T2ZEaW1lbnNpb24gPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKGRpbWVuc2lvblswXSk7XG4gICAgICAgIFxuICAgICAgICAgICAgZm9yKGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgIGlzQXJyYXkgJiYgKGluZGV4ID0gZGF0YVtpXS5pbmRleE9mKGtleSkpO1xuICAgICAgICAgICAgICAgIGlmKGluZGV4ICE9PSAtMSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBsIDwgbGVuQzsgbCsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW2RhdGFbMF1bbF1dID0gZGF0YVtpXVtsXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKCFpc0FycmF5ICYmIGRhdGFbaV1bZGltZW5zaW9uWzBdXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmogPSBkYXRhW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKG1lYXN1cmVbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWdncmVnYXRlZERhdGFba11baW5kZXhPZkRpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW21lYXN1cmVbal1dID0gYWdncmVnYXRlZERhdGFba11baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgY2hhcnRQcm90by5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgICAgICAvL2dldCBmYyBzdXBwb3J0ZWQganNvbiAgICAgICAgICAgIFxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTsgICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnQuY2hhcnRPYmogPSBuZXcgRnVzaW9uQ2hhcnRzKGNoYXJ0LmNoYXJ0Q29uZmlnKTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG5cbiAgICAgICAgZGF0YUFkYXB0ZXJPYmouY2hhcnQgPSBjaGFydC5jaGFydE9iajtcbiAgICAgICAgXG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLmFkZEV2ZW50TGlzdGVuZXIoJ2RhdGFwbG90cm9sbG92ZXInLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgdmFyIGRhdGFPYmogPSBnZXRSb3dEYXRhKGNoYXJ0LmRhdGFTdG9yZUpzb24sIGNoYXJ0LmFnZ3JlZ2F0ZWREYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFydC5kaW1lbnNpb24sIGNoYXJ0Lm1lYXN1cmUsIGQuY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgICAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5yYWlzZUV2ZW50KCdob3ZlcmluJywge1xuICAgICAgICAgICAgICAgIGRhdGEgOiBkYXRhT2JqLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgOiBkLmNhdGVnb3J5TGFiZWxcbiAgICAgICAgICAgIH0sIGNoYXJ0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID1hcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaixcbiAgICAgICAgICAgIGNoYXJ0Q29uZmlnID0ge30sXG4gICAgICAgICAgICBkYXRhU291cmNlID0ge307XG4gICAgICAgIC8vcGFyc2UgYXJndW1lbnQgaW50byBjaGFydENvbmZpZyBcbiAgICAgICAgZXh0ZW5kMihjaGFydENvbmZpZyxhcmd1bWVudCk7XG4gICAgICAgIFxuICAgICAgICAvL2RhdGFBZGFwdGVyT2JqIFxuICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge307XG5cbiAgICAgICAgLy9zdG9yZSBmYyBzdXBwb3J0ZWQganNvbiB0byByZW5kZXIgY2hhcnRzXG4gICAgICAgIGRhdGFTb3VyY2UgPSBkYXRhQWRhcHRlck9iai5nZXRGQ2pzb24oKTtcblxuICAgICAgICAvL2RlbGV0ZSBkYXRhIGNvbmZpZ3VyYXRpb24gcGFydHMgZm9yIEZDIGpzb24gY29udmVydGVyXG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy9zZXQgZGF0YSBzb3VyY2UgaW50byBjaGFydCBjb25maWd1cmF0aW9uXG4gICAgICAgIGNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICBjaGFydC5jaGFydENvbmZpZyA9IGNoYXJ0Q29uZmlnOyAgICAgICAgXG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8udXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICAgICAgY2hhcnQuZ2V0SlNPTihhcmd1bWVudCk7XG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLmNoYXJ0VHlwZShjaGFydC5jaGFydENvbmZpZy50eXBlKTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmouc2V0SlNPTkRhdGEoY2hhcnQuY2hhcnRDb25maWcuZGF0YVNvdXJjZSk7XG4gICAgICAgIGRhdGFBZGFwdGVyT2JqLmNoYXJ0ID0gY2hhcnQuY2hhcnRPYmo7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENoYXJ0KGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbn0pOyIsIlxuXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGNyZWF0ZUNoYXJ0ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlQ2hhcnQsXG4gICAgICAgIGRvY3VtZW50ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luLmRvY3VtZW50LFxuICAgICAgICBQWCA9ICdweCcsXG4gICAgICAgIERJViA9ICdkaXYnLFxuICAgICAgICBFTVBUWV9TVFJJTkcgPSAnJyxcbiAgICAgICAgQUJTT0xVVEUgPSAnYWJzb2x1dGUnLFxuICAgICAgICBNQVhfUEVSQ0VOVCA9ICcxMDAlJyxcbiAgICAgICAgUkVMQVRJVkUgPSAncmVsYXRpdmUnLFxuICAgICAgICBJRCA9ICdpZCcsXG4gICAgICAgIEJPUkRFUl9CT1ggPSAnYm9yZGVyLWJveCc7XG5cbiAgICB2YXIgQ2VsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBjZWxsLmRyYXcoKTtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0ICYmIGNlbGwucmVuZGVyQ2hhcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvdG9DZWxsID0gQ2VsbC5wcm90b3R5cGU7XG5cbiAgICBwcm90b0NlbGwuZHJhdyA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KERJVik7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaWQgPSBjZWxsLmNvbmZpZy5pZCB8fCBFTVBUWV9TVFJJTkc7ICAgICAgICBcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5oZWlnaHQgPSBjZWxsLmNvbmZpZy5oZWlnaHQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUudG9wID0gY2VsbC5jb25maWcudG9wICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUubGVmdCA9IGNlbGwuY29uZmlnLmxlZnQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmJveFNpemluZyA9IEJPUkRFUl9CT1g7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuY2xhc3NOYW1lID0gY2VsbC5jb25maWcuY2xhc3NOYW1lO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HO1xuICAgICAgICBjZWxsLmNvbnRhaW5lci5hcHBlbmRDaGlsZChjZWxsLmdyYXBoaWNzKTtcbiAgICB9O1xuXG4gICAgcHJvdG9DZWxsLnJlbmRlckNoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXM7IFxuXG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LnJlbmRlckF0ID0gY2VsbC5jb25maWcuaWQ7XG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LndpZHRoID0gTUFYX1BFUkNFTlQ7XG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0LmhlaWdodCA9IE1BWF9QRVJDRU5UO1xuICAgICAgXG4gICAgICAgIGlmKGNlbGwuY2hhcnQpIHtcbiAgICAgICAgICAgIGNlbGwuY2hhcnQudXBkYXRlKGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNlbGwuY2hhcnQgPSBjcmVhdGVDaGFydChjZWxsLmNvbmZpZy5jaGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNlbGwuY2hhcnQ7XG4gICAgfTtcblxuICAgIHByb3RvQ2VsbC51cGRhdGUgPSBmdW5jdGlvbiAobmV3Q29uZmlnKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcyxcbiAgICAgICAgICAgIGlkID0gY2VsbC5jb25maWcuaWQ7XG5cbiAgICAgICAgaWYobmV3Q29uZmlnKXtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnID0gbmV3Q29uZmlnO1xuICAgICAgICAgICAgY2VsbC5jb25maWcuaWQgPSBpZDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3MuaWQgPSBjZWxsLmNvbmZpZy5pZCB8fCBFTVBUWV9TVFJJTkc7ICAgICAgICBcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3MuY2xhc3NOYW1lID0gY2VsbC5jb25maWcuY2xhc3NOYW1lO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5oZWlnaHQgPSBjZWxsLmNvbmZpZy5oZWlnaHQgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUud2lkdGggPSBjZWxsLmNvbmZpZy53aWR0aCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUubGVmdCA9IGNlbGwuY29uZmlnLmxlZnQgKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUucG9zaXRpb24gPSBBQlNPTFVURTtcbiAgICAgICAgICAgICFjZWxsLmNvbmZpZy5jaGFydCAmJiAoY2VsbC5ncmFwaGljcy5pbm5lckhUTUwgPSBjZWxsLmNvbmZpZy5odG1sIHx8IEVNUFRZX1NUUklORyk7XG4gICAgICAgICAgICBjZWxsLmNvbnRhaW5lci5hcHBlbmRDaGlsZChjZWxsLmdyYXBoaWNzKTtcbiAgICAgICAgICAgIGlmKGNlbGwuY29uZmlnLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgY2VsbC5jaGFydCA9IGNlbGwucmVuZGVyQ2hhcnQoKTsgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjZWxsLmNoYXJ0O1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfSAgXG4gICAgICAgIHJldHVybiBjZWxsOyAgICAgIFxuICAgIH07XG5cbiAgICB2YXIgTWF0cml4ID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbWF0cml4ID0gdGhpcztcbiAgICAgICAgICAgIG1hdHJpeC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgLy9tYXRyaXggY29udGFpbmVyXG4gICAgICAgICAgICBtYXRyaXgubWF0cml4Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgbWF0cml4LmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgbWF0cml4LmRlZmF1bHRIID0gMTAwO1xuICAgICAgICAgICAgbWF0cml4LmRlZmF1bHRXID0gMTAwO1xuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2FsQm94ID0gW107XG4gICAgICAgICAgICAvL2Rpc3Bvc2UgbWF0cml4IGNvbnRleHRcbiAgICAgICAgICAgIG1hdHJpeC5kaXNwb3NlKCk7XG4gICAgICAgICAgICAvL3NldCBzdHlsZSwgYXR0ciBvbiBtYXRyaXggY29udGFpbmVyIFxuICAgICAgICAgICAgbWF0cml4LnNldEF0dHJDb250YWluZXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvdG9NYXRyaXggPSBNYXRyaXgucHJvdG90eXBlLFxuICAgICAgICBjaGFydElkID0gMDtcblxuICAgIC8vZnVuY3Rpb24gdG8gc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5zZXRBdHRyQ29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXI7ICAgICAgICBcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gUkVMQVRJVkU7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gc2V0IGhlaWdodCwgd2lkdGggb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4LnNldENvbnRhaW5lclJlc29sdXRpb24gPSBmdW5jdGlvbiAoaGVpZ2h0QXJyLCB3aWR0aEFycikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgaGVpZ2h0ID0gMCxcbiAgICAgICAgICAgIHdpZHRoID0gMCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBsZW47XG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gaGVpZ2h0QXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBoZWlnaHQgKz0gaGVpZ2h0QXJyW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSB3aWR0aEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgd2lkdGggKz0gd2lkdGhBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgUFg7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgUFg7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gZHJhdyBtYXRyaXhcbiAgICBwcm90b01hdHJpeC5kcmF3ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWxCb3ggPSBbXTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4ICYmIG1hdHJpeC5jb25maWd1cmF0aW9uIHx8IHt9LFxuICAgICAgICAgICAgLy9zdG9yZSB2aXJ0dWFsIG1hdHJpeCBmb3IgdXNlciBnaXZlbiBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuICAgICAgICAgICAgbGVuID0gY29uZmlnTWFuYWdlciAmJiBjb25maWdNYW5hZ2VyLmxlbmd0aCxcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gW10sXG4gICAgICAgICAgICBwYXJlbnRDb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGNhbGxCYWNrID0gYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIC8vc3RvcmUgY2VsbCBvYmplY3QgaW4gbG9naWNhbCBtYXRyaXggc3RydWN0dXJlXG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSBuZXcgQ2VsbChjb25maWdNYW5hZ2VyW2ldW2pdLHBhcmVudENvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBbXTtcbiAgICAgICAgbWF0cml4LnBsYWNlSG9sZGVyID0gcGxhY2VIb2xkZXI7XG4gICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKCk7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gbWFuYWdlIG1hdHJpeCBkcmF3XG4gICAgcHJvdG9NYXRyaXguZHJhd01hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICAvL3N0b3JlIG1hcHBpbmcgbWF0cml4IGJhc2VkIG9uIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IG1hdHJpeC5tYXRyaXhNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLCAgICAgICAgICAgIFxuICAgICAgICAgICAgaGVpZ2h0QXJyID0gbWF0cml4LmdldFJvd0hlaWdodChzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgd2lkdGhBcnIgPSBtYXRyaXguZ2V0Q29sV2lkdGgoc2hhZG93TWF0cml4KSxcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyID0gW10sXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgbWF0cml4UG9zWCA9IG1hdHJpeC5nZXRQb3Mod2lkdGhBcnIpLFxuICAgICAgICAgICAgbWF0cml4UG9zWSA9IG1hdHJpeC5nZXRQb3MoaGVpZ2h0QXJyKSxcbiAgICAgICAgICAgIHJvd3NwYW4sXG4gICAgICAgICAgICBjb2xzcGFuLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBjaGFydCxcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICByb3csXG4gICAgICAgICAgICBjb2w7XG4gICAgICAgIC8vY2FsY3VsYXRlIGFuZCBzZXQgcGxhY2Vob2xkZXIgaW4gc2hhZG93IG1hdHJpeFxuICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4LnNldFBsY0hsZHIoc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgICAgIG1hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uKGhlaWdodEFyciwgd2lkdGhBcnIpO1xuICAgICAgICAvL2NhbGN1bGF0ZSBjZWxsIHBvc2l0aW9uIGFuZCBoZWlodCBhbmQgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgXG4gICAgICAgICAgICBkcmF3TWFuYWdlck9iakFycltpXSA9IFtdOyAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgICAgIHJvd3NwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbiB8fCAxKTtcbiAgICAgICAgICAgICAgICBjb2xzcGFuID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNvbHNwYW4gfHwgMSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNoYXJ0ID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNoYXJ0O1xuICAgICAgICAgICAgICAgIGh0bWwgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaHRtbDtcbiAgICAgICAgICAgICAgICByb3cgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLnJvdyk7XG4gICAgICAgICAgICAgICAgY29sID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXS5jb2wpO1xuICAgICAgICAgICAgICAgIGxlZnQgPSBtYXRyaXhQb3NYW2NvbF07XG4gICAgICAgICAgICAgICAgdG9wID0gbWF0cml4UG9zWVtyb3ddO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gbWF0cml4UG9zWFtjb2wgKyBjb2xzcGFuXSAtIGxlZnQ7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF0cml4UG9zWVtyb3cgKyByb3dzcGFuXSAtIHRvcDtcbiAgICAgICAgICAgICAgICBpZCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaWQpIHx8IG1hdHJpeC5pZENyZWF0b3Iocm93LGNvbCk7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBkcmF3TWFuYWdlck9iakFycltpXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wICAgICAgIDogdG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgOiBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgICAgOiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICAgICA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICAgICA6IGlkLFxuICAgICAgICAgICAgICAgICAgICByb3dzcGFuICAgOiByb3dzcGFuLFxuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuICAgOiBjb2xzcGFuLFxuICAgICAgICAgICAgICAgICAgICBodG1sICAgICAgOiBodG1sLFxuICAgICAgICAgICAgICAgICAgICBjaGFydCAgICAgOiBjaGFydFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyYXdNYW5hZ2VyT2JqQXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5pZENyZWF0b3IgPSBmdW5jdGlvbigpe1xuICAgICAgICBjaGFydElkKys7ICAgICAgIFxuICAgICAgICByZXR1cm4gSUQgKyBjaGFydElkO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRQb3MgPSAgZnVuY3Rpb24oc3JjKXtcbiAgICAgICAgdmFyIGFyciA9IFtdLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBzcmMgJiYgc3JjLmxlbmd0aDtcblxuICAgICAgICBmb3IoOyBpIDw9IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGFyci5wdXNoKGkgPyAoc3JjW2ktMV0rYXJyW2ktMV0pIDogMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5zZXRQbGNIbGRyID0gZnVuY3Rpb24oc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKXtcbiAgICAgICAgdmFyIHJvdyxcbiAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkM7XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gc2hhZG93TWF0cml4Lmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7IFxuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgcm93ID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgY29sID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMV07XG5cbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPT09IHVuZGVmaW5lZCA/IGkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93O1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9PT0gdW5kZWZpbmVkID8gaiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFJvd0hlaWdodCA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5Sb3cgPSBzaGFkb3dNYXRyaXggJiYgc2hhZG93TWF0cml4Lmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNvbCxcbiAgICAgICAgICAgIGhlaWdodCA9IFtdLFxuICAgICAgICAgICAgY3VyckhlaWdodCxcbiAgICAgICAgICAgIG1heEhlaWdodDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4SGVpZ2h0ID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkNvbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYoc2hhZG93TWF0cml4W2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJIZWlnaHQgPSBzaGFkb3dNYXRyaXhbaV1bal0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgPCBjdXJySGVpZ2h0ID8gY3VyckhlaWdodCA6IG1heEhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoZWlnaHRbaV0gPSBtYXhIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRDb2xXaWR0aCA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCkge1xuICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgd2lkdGggPSBbXSxcbiAgICAgICAgICAgIGN1cnJXaWR0aCxcbiAgICAgICAgICAgIG1heFdpZHRoO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW5Db2wgPSBzaGFkb3dNYXRyaXhbal0ubGVuZ3RoOyBpIDwgbGVuQ29sOyBpKyspe1xuICAgICAgICAgICAgZm9yKGogPSAwLCBtYXhXaWR0aCA9IDA7IGogPCBsZW5Sb3c7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChzaGFkb3dNYXRyaXhbal1baV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycldpZHRoID0gc2hhZG93TWF0cml4W2pdW2ldLndpZHRoOyAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gbWF4V2lkdGggPCBjdXJyV2lkdGggPyBjdXJyV2lkdGggOiBtYXhXaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aWR0aFtpXSA9IG1heFdpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5tYXRyaXhNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBzaGFkb3dNYXRyaXggPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGwsXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICByb3dTcGFuLFxuICAgICAgICAgICAgY29sU3BhbixcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgZGVmYXVsdEggPSBtYXRyaXguZGVmYXVsdEgsXG4gICAgICAgICAgICBkZWZhdWx0VyA9IG1hdHJpeC5kZWZhdWx0VyxcbiAgICAgICAgICAgIG9mZnNldDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcm93U3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbikgfHwgMTtcbiAgICAgICAgICAgICAgICBjb2xTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuKSB8fCAxOyAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS53aWR0aCk7XG4gICAgICAgICAgICAgICAgd2lkdGggPSAod2lkdGggJiYgKHdpZHRoIC8gY29sU3BhbikpIHx8IGRlZmF1bHRXO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gK3dpZHRoLnRvRml4ZWQoMik7XG5cbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGhlaWdodCAmJiAoaGVpZ2h0IC8gcm93U3BhbikpIHx8IGRlZmF1bHRIOyAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAraGVpZ2h0LnRvRml4ZWQoMik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBvZmZzZXQgPSAwOyBrIDwgcm93U3BhbjsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobCA9IDA7IGwgPCBjb2xTcGFuOyBsKyspIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXSA9IHNoYWRvd01hdHJpeFtpICsga10gPyBzaGFkb3dNYXRyaXhbaSArIGtdIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBqICsgbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA6IChpICsgJy0nICsgaiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hhZG93TWF0cml4O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRCbG9jayAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUiA9IHBsYWNlSG9sZGVyLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkM7XG4gICAgICAgIGZvcihpID0gMDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsYWNlSG9sZGVyW2ldW2pdLmNvbmZpZy5pZCA9PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGxhY2VIb2xkZXJbaV1bal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnVwZGF0ZSA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbkNvbmZpZ1IsXG4gICAgICAgICAgICBsZW5Db25maWdDLFxuICAgICAgICAgICAgbGVuUGxhY2VIbGRyUixcbiAgICAgICAgICAgIGxlblBsYWNlSGxkckMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLCAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVjeWNsZWRDZWxsO1xuXG4gICAgICAgIHdoaWxlKGNvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChjb250YWluZXIubGFzdENoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxlblBsYWNlSGxkclIgPSBwbGFjZUhvbGRlci5sZW5ndGg7XG5cbiAgICAgICAgZm9yKGkgPSBsZW5QbGFjZUhsZHJSIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGxlblBsYWNlSGxkckMgPSBwbGFjZUhvbGRlcltpXS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IoaiA9IGxlblBsYWNlSGxkckMgLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIGlmKHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeC5kaXNwb3NhbEJveCA9IG1hdHJpeC5kaXNwb3NhbEJveC5jb25jYXQocGxhY2VIb2xkZXJbaV0ucG9wKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwbGFjZUhvbGRlcltpXVtqXTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0ucG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxhY2VIb2xkZXIucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbkNvbmZpZ1IgPSBjb25maWdNYW5hZ2VyLmxlbmd0aDsgaSA8IGxlbkNvbmZpZ1I7IGkrKykge1xuICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBbXTtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQ29uZmlnQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQ29uZmlnQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYoY29uZmlnTWFuYWdlcltpXVtqXS5jaGFydCkge1xuICAgICAgICAgICAgICAgICAgICByZWN5Y2xlZENlbGwgPSBtYXRyaXguZGlzcG9zYWxCb3gucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlY3ljbGVkQ2VsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSByZWN5Y2xlZENlbGwudXBkYXRlKGNvbmZpZ01hbmFnZXJbaV1bal0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSBuZXcgQ2VsbChjb25maWdNYW5hZ2VyW2ldW2pdLCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSBuZXcgQ2VsbChjb25maWdNYW5hZ2VyW2ldW2pdLCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbi8vICAgICBwcm90b01hdHJpeC51cGRhdGUgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuLy8gICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbi8vICAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4vLyAgICAgICAgICAgICBsZW4gPSBjb25maWdNYW5hZ2VyICYmIGNvbmZpZ01hbmFnZXIubGVuZ3RoLFxuLy8gICAgICAgICAgICAgbGVuQyxcbi8vICAgICAgICAgICAgIGxlblBsY0hsZHIsXG4vLyAgICAgICAgICAgICBpLFxuLy8gICAgICAgICAgICAgaixcbi8vICAgICAgICAgICAgIGssXG4vLyAgICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4vLyAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIgID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4vLyAgICAgICAgICAgICBkaXNwb3NhbEJveENoYXJ0ID0gbWF0cml4LmRpc3Bvc2FsQm94Q2hhcnQgPSBbXSxcbi8vICAgICAgICAgICAgIGRpc3Bvc2FsQm94R2VuID0gbWF0cml4LmRpc3Bvc2FsQm94R2VuID0gW10sXG4vLyAgICAgICAgICAgICByZWN5Y2xlZENlbGwsXG4vLyAgICAgICAgICAgICBub2RlID0gcGFyZW50Q29udGFpbmVyO1xuXG4vLyAgICAgICAgIHdoaWxlIChub2RlLmhhc0NoaWxkTm9kZXMoKSkge1xuLy8gICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmxhc3RDaGlsZCk7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBsZW5QbGNIbGRyID0gcGxhY2VIb2xkZXIubGVuZ3RoO1xuLy8gICAgICAgICBmb3IgKGsgPSAwOyBrIDwgbGVuUGxjSGxkcjsgaysrKSB7XG4vLyAgICAgICAgICAgICBsZW5DID0gcGxhY2VIb2xkZXJba10ubGVuZ3RoO1xuLy8gICAgICAgICAgICAgZm9yKGogPSBsZW5DIC0gMTsgaiA+PSAwIDsgai0tKSB7XG4vLyAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJba11bal0uY2hhcnQgJiYgKGRpc3Bvc2FsQm94Q2hhcnQgPSBkaXNwb3NhbEJveENoYXJ0LmNvbmNhdChwbGFjZUhvbGRlcltrXS5wb3AoKSkpO1xuLy8gICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2tdW2pdICYmIChwbGFjZUhvbGRlcltrXVtqXS5jaGFydCB8fCAoZGlzcG9zYWxCb3hHZW4gPSBcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhbEJveEdlbi5jb25jYXQocGxhY2VIb2xkZXJba10ucG9wKCkpKSk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gICAgICAgIFxuLy8gICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW47IGkrKykgeyAgICBcbi8vIC8qICAgICAgICAgICAgaWYoIXBsYWNlSG9sZGVyW2ldKSB7XG4vLyAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBbXTtcbi8vICAgICAgICAgICAgIH0qL1xuLy8gICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBbXTtcbi8vICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbi8vICAgICAgICAgICAgICAgICBpZihwbGFjZUhvbGRlcltpXVtqXSkge1xuLy8gICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChwbGFjZUhvbGRlcltpXVtqXS5ncmFwaGljcyk7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgICAgICAgICBjb25maWdNYW5hZ2VyW2ldW2pdLmNoYXJ0ICYmIChyZWN5Y2xlZENlbGwgPSBkaXNwb3NhbEJveENoYXJ0LnBvcCgpKTtcbi8vICAgICAgICAgICAgICAgICAgICAgY29uZmlnTWFuYWdlcltpXVtqXS5jaGFydCB8fCAocmVjeWNsZWRDZWxsID0gZGlzcG9zYWxCb3hHZW4ucG9wKCkpXG4vLyAgICAgICAgICAgICAgICAgICAgIGlmKHJlY3ljbGVkQ2VsbCkge1xuLy8gICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygxMSwndXBkYXRlJyxjb25maWdNYW5hZ2VyW2ldW2pdKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gcmVjeWNsZWRDZWxsLnVwZGF0ZShjb25maWdNYW5hZ2VyW2ldW2pdKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChwbGFjZUhvbGRlcltpXVtqXS5ncmFwaGljcyk7XG4vLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygyMiwnbmV3Jyxjb25maWdNYW5hZ2VyW2ldW2pdKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSxwYXJlbnRDb250YWluZXIpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgLyp9Ki9cbi8vICAgICAgICAgICAgIH1cblxuLy8gLyogICAgICAgICAgICBsZW5QbGNIbGRyID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoO1xuLy8gICAgICAgICAgICAgbGVuQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoO1xuXG4vLyAgICAgICAgICAgICBmb3IgKGsgPSBsZW5QbGNIbGRyIC0gMTsgayA+PSBsZW5DOyBrLS0pIHtcbi8vICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtrXS5jaGFydCAmJiAoZGlzcG9zYWxCb3hDaGFydCA9IGRpc3Bvc2FsQm94Q2hhcnQuY29uY2F0KHBsYWNlSG9sZGVyW2ldLnBvcCgpKSk7XG4vLyAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1ba10gJiYgKHBsYWNlSG9sZGVyW2ldW2tdLmNoYXJ0IHx8IChkaXNwb3NhbEJveEdlbiA9IFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FsQm94R2VuLmNvbmNhdChwbGFjZUhvbGRlcltpXS5wb3AoKSkpKTtcbi8vICAgICAgICAgICAgIH0qL1xuLy8gICAgICAgICB9XG4vLyAvKiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBkaXNwb3NhbEJveC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuLy8gICAgICAgICAgICAgaWYoZGlzcG9zYWxCb3hbaV0gIT09IHVuZGVmaW5lZCkge1xuLy8gICAgICAgICAgICAgICAgIGRpc3Bvc2FsQm94W2ldLmNoYXJ0ICYmIGRpc3Bvc2FsQm94W2ldLmNoYXJ0LmNoYXJ0T2JqLmRpc3Bvc2UoKTtcbi8vICAgICAgICAgICAgICAgICBwYXJlbnRDb250YWluZXIucmVtb3ZlQ2hpbGQoZGlzcG9zYWxCb3hbaV0gJiYgZGlzcG9zYWxCb3hbaV0uZ3JhcGhpY3MpO1xuLy8gICAgICAgICAgICAgICAgIGRlbGV0ZSBkaXNwb3NhbEJveFtpXTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGRlbGV0ZSBkaXNwb3NhbEJveFtpXTtcbi8vICAgICAgICAgfSovICAgXG4vLyAgICAgfTtcblxuXG5cbiAgICBwcm90b01hdHJpeC5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIG5vZGUgID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBsZW5SO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBwbGFjZUhvbGRlciAmJiBwbGFjZUhvbGRlci5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXSAmJiBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jaGFydCAmJiBwbGFjZUhvbGRlcltpXVtqXS5jaGFydC5jaGFydE9iaiAmJiBcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChub2RlLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSAnMHB4JztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9ICcwcHgnO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVNYXRyaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pO1xuICAgIH07XG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuICAgIFxuICAgIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cbiAgICB2YXIgZ2xvYmFsID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG4gICAgICAgIHdpbiA9IGdsb2JhbC53aW4sXG5cbiAgICAgICAgb2JqZWN0UHJvdG9Ub1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgIGFycmF5VG9TdHJpbmdJZGVudGlmaWVyID0gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKFtdKSxcbiAgICAgICAgaXNBcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RQcm90b1RvU3RyaW5nLmNhbGwob2JqKSA9PT0gYXJyYXlUb1N0cmluZ0lkZW50aWZpZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQSBmdW5jdGlvbiB0byBjcmVhdGUgYW4gYWJzdHJhY3Rpb24gbGF5ZXIgc28gdGhhdCB0aGUgdHJ5LWNhdGNoIC9cbiAgICAgICAgLy8gZXJyb3Igc3VwcHJlc3Npb24gb2YgZmxhc2ggY2FuIGJlIGF2b2lkZWQgd2hpbGUgcmFpc2luZyBldmVudHMuXG4gICAgICAgIG1hbmFnZWRGbkNhbGwgPSBmdW5jdGlvbiAoaXRlbSwgc2NvcGUsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBXZSBjaGFuZ2UgdGhlIHNjb3BlIG9mIHRoZSBmdW5jdGlvbiB3aXRoIHJlc3BlY3QgdG8gdGhlXG4gICAgICAgICAgICAvLyBvYmplY3QgdGhhdCByYWlzZWQgdGhlIGV2ZW50LlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpdGVtWzBdLmNhbGwoc2NvcGUsIGV2ZW50LCBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRnVuY3Rpb24gdGhhdCBleGVjdXRlcyBhbGwgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGludm9rZWQgdXBvbiB0cmlnZ2VyXG4gICAgICAgIC8vIG9mIGFuIGV2ZW50LlxuICAgICAgICBzbG90TG9hZGVyID0gZnVuY3Rpb24gKHNsb3QsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBJZiBzbG90IGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgd2UgYXNzdW1lIHRoYXQgdGhlIGxpc3RlbmVyXG4gICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgaWYgKCEoc2xvdCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIC8vIFN0YXR1dG9yeSBXM0MgTk9UIHByZXZlbnREZWZhdWx0IGZsYWdcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmFyaWFibGVzLlxuICAgICAgICAgICAgdmFyIGkgPSAwLCBzY29wZTtcblxuICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBzbG90IGFuZCBsb29rIGZvciBtYXRjaCB3aXRoIHJlc3BlY3QgdG9cbiAgICAgICAgICAgIC8vIHR5cGUgYW5kIGJpbmRpbmcuXG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbWF0Y2ggZm91bmQgdy5yLnQuIHR5cGUgYW5kIGJpbmQsIHdlIGZpcmUgaXQuXG4gICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciB8fCBzbG90W2ldWzFdID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHNlbmRlciBvZiB0aGUgZXZlbnQgZm9yIGdsb2JhbCBldmVudHMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjaG9pY2Ugb2Ygc2NvcGUgZGlmZmVyZXMgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYVxuICAgICAgICAgICAgICAgICAgICAvLyBnbG9iYWwgb3IgYSBsb2NhbCBldmVudCBpcyBiZWluZyByYWlzZWQuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlID0gc2xvdFtpXVsxXSA9PT0gZXZlbnQuc2VuZGVyID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnNlbmRlciA6IGdsb2JhbDtcblxuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkRm5DYWxsKHNsb3RbaV0sIHNjb3BlLCBldmVudCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgd2FudGVkIHRvIGRldGFjaCB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRldGFjaGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmRldGFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHByb3BhZ2F0aW9uIGZsYWcgaXMgc2V0IHRvIGZhbHNlIGFuZCBkaXNjb250bnVlXG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlmIG5lZWRlZC5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY2FuY2VsbGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBldmVudE1hcCA9IHtcbiAgICAgICAgICAgIGhvdmVyaW4gOiAnZGF0YXBsb3Ryb2xsb3ZlcicsXG4gICAgICAgICAgICBob3Zlcm91dCA6ICdkYXRhcGxvdHJvbGxvdXQnLFxuICAgICAgICAgICAgY2xpayA6ICdkYXRhcGxvdGNsaWNrJ1xuICAgICAgICB9LFxuICAgICAgICByYWlzZUV2ZW50LFxuXG4gICAgICAgIEV2ZW50VGFyZ2V0ID0ge1xuXG4gICAgICAgICAgICB1bnByb3BhZ2F0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuY2FuY2VsbGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldGFjaGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmRldGFjaGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZGVmYXVsdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLnByZXZlbnRlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEVudGlyZSBjb2xsZWN0aW9uIG9mIGxpc3RlbmVycy5cbiAgICAgICAgICAgIGxpc3RlbmVyczoge30sXG5cbiAgICAgICAgICAgIC8vIFRoZSBsYXN0IHJhaXNlZCBldmVudCBpZC4gQWxsb3dzIHRvIGNhbGN1bGF0ZSB0aGUgbmV4dCBldmVudCBpZC5cbiAgICAgICAgICAgIGxhc3RFdmVudElkOiAwLFxuXG4gICAgICAgICAgICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcmVjdXJzZVJldHVybixcbiAgICAgICAgICAgICAgICAgICAgRkNFdmVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGk7XG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2VSZXR1cm4ucHVzaChFdmVudFRhcmdldC5hZGRMaXN0ZW5lcih0eXBlW2ldLCBsaXN0ZW5lciwgYmluZCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWN1cnNlUmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRoZSB0eXBlIHBhcmFtZXRlci4gTGlzdGVuZXIgY2Fubm90IGJlIGFkZGVkIHdpdGhvdXRcbiAgICAgICAgICAgICAgICAvLyB2YWxpZCB0eXBlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIGhhcyBub3QgYmVlbiBwcm92aWRlZCB3aGlsZSBhZGRpbmcgYW4gZXZlbnQgbGlzdGVuZXIuIEVuc3VyZSB0aGF0IHlvdSBwYXNzIGFcbiAgICAgICAgICAgICAgICAgICAgICogYHN0cmluZ2AgdG8gdGhlIGZpcnN0IHBhcmFtZXRlciBvZiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9LlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU0OVxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU0OScsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5zcGVjaWZpZWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIExpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4gSXQgd2lsbCBub3QgZXZhbCBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTBcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTAnLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgTGlzdGVuZXInKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnNlcnRpb24gcG9zaXRpb24gZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB0aGVuIGNyZWF0ZSBvbmUuXG4gICAgICAgICAgICAgICAgaWYgKCEoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5wdXNoKFtsaXN0ZW5lciwgYmluZF0pO1xuXG4gICAgICAgICAgICAgICAgLy8gRXZlbnRzIG9mIGZ1c2lvbkNoYXJ0IHJhaXNlZCB2aWEgTXVsdGlDaGFydGluZy5cbiAgICAgICAgICAgICAgICBpZiAoRkNFdmVudFR5cGUgPSBldmVudE1hcFt0eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcihGQ0V2ZW50VHlwZSwgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQodHlwZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZDRXZlbnRPYmogOiBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZDRGF0YU9iaiA6IGRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIE11bHRpQ2hhcnRpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZW1vdmVMaXN0ZW5lcjogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgc2xvdCxcbiAgICAgICAgICAgICAgICAgICAgaTtcblxuICAgICAgICAgICAgICAgIC8vIExpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4gRWxzZSB3ZSBoYXZlIG5vdGhpbmcgdG8gcmVtb3ZlIVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBsaXN0ZW5lciBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgKiBPdGhlcndpc2UsIHRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbiBoYXMgbm8gd2F5IHRvIGtub3cgd2hpY2ggZnVuY3Rpb24gaXMgdG8gYmUgcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NjBcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NjAnLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgTGlzdGVuZXInKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHR5cGUgaXMgc2VudCBhcyBhcnJheSwgd2UgcmVjdXJzZSB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgbG9vayBpbnRvIGVhY2ggaXRlbSBvZiB0aGUgJ3R5cGUnIHBhcmFtZXRlciBhbmQgc2VuZCBpdCxcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxvbmcgd2l0aCBvdGhlciBwYXJhbWV0ZXJzIHRvIGEgcmVjdXJzZWQgYWRkTGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSByZW1vdmVkIHdpdGhvdXRcbiAgICAgICAgICAgICAgICAvLyB2YWxpZCB0eXBlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU1OVxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU1OScsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5zcGVjaWZpZWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERlc2Vuc2l0aXplIHRoZSB0eXBlIGNhc2UgZm9yIHVzZXIgYWNjZXNzYWJpbGl0eS5cbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcmVmZXJlbmNlIHRvIHRoZSBzbG90IGZvciBlYXN5IGxvb2t1cCBpbiB0aGlzIG1ldGhvZC5cbiAgICAgICAgICAgICAgICBzbG90ID0gRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIHdhcyBuZXZlciBhZGRlZCBhbmQgaGFsdCBtZXRob2QuXG4gICAgICAgICAgICAgICAgaWYgKCEoc2xvdCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBzbG90IGFuZCByZW1vdmUgZXZlcnkgaW5zdGFuY2Ugb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgaGFuZGxlci5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2xvdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGluc3RhbmNlcyBvZiB0aGUgbGlzdGVuZXIgZm91bmQgaW4gdGhlIHF1ZXVlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvdFtpXVswXSA9PT0gbGlzdGVuZXIgJiYgc2xvdFtpXVsxXSA9PT0gYmluZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBvcHRzIGNhbiBoYXZlIHsgYXN5bmM6dHJ1ZSwgb21uaTp0cnVlIH1cbiAgICAgICAgICAgIHRyaWdnZXJFdmVudDogZnVuY3Rpb24gKHR5cGUsIHNlbmRlciwgYXJncywgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxGbikge1xuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSwgZXZlbnQgdHlwZSBpcyBtaXNzaW5nLCBkaXNwYXRjaCBjYW5ub3QgcHJvY2VlZC5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE2MDJcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKHNlbmRlciwgJzAzMDkxNjAyJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ludmFsaWQgRXZlbnQgVHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIE1vZGVsIHRoZSBldmVudCBhcyBwZXIgVzNDIHN0YW5kYXJkcy4gQWRkIHRoZSBmdW5jdGlvbiB0byBjYW5jZWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBwcm9wYWdhdGlvbiBieSB1c2VyIGhhbmRsZXJzLiBBbHNvIGFwcGVuZCBhbiBpbmNyZW1lbnRhbFxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGlkLlxuICAgICAgICAgICAgICAgIHZhciBldmVudE9iamVjdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBldmVudElkOiAoRXZlbnRUYXJnZXQubGFzdEV2ZW50SWQgKz0gMSksXG4gICAgICAgICAgICAgICAgICAgIHNlbmRlcjogc2VuZGVyIHx8IG5ldyBFcnJvcignT3JwaGFuIEV2ZW50JyksXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbGxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHN0b3BQcm9wYWdhdGlvbjogdGhpcy51bnByb3BhZ2F0b3IsXG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0aGlzLnVuZGVmYXVsdGVyLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRldGFjaEhhbmRsZXI6IHRoaXMuZGV0YWNoZXJcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXZlbnQgbGlzdGVuZXJzIGFyZSB1c2VkIHRvIHRhcCBpbnRvIGRpZmZlcmVudCBzdGFnZXMgb2YgY3JlYXRpbmcsIHVwZGF0aW5nLCByZW5kZXJpbmcgb3IgcmVtb3ZpbmdcbiAgICAgICAgICAgICAgICAgKiBjaGFydHMuIEEgRnVzaW9uQ2hhcnRzIGluc3RhbmNlIGZpcmVzIHNwZWNpZmljIGV2ZW50cyBiYXNlZCBvbiB3aGF0IHN0YWdlIGl0IGlzIGluLiBGb3IgZXhhbXBsZSwgdGhlXG4gICAgICAgICAgICAgICAgICogYHJlbmRlckNvbXBsZXRlYCBldmVudCBpcyBmaXJlZCBlYWNoIHRpbWUgYSBjaGFydCBoYXMgZmluaXNoZWQgcmVuZGVyaW5nLiBZb3UgY2FuIGxpc3RlbiB0byBhbnkgc3VjaFxuICAgICAgICAgICAgICAgICAqIGV2ZW50IHVzaW5nIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gb3Ige0BsaW5rIEZ1c2lvbkNoYXJ0cyNhZGRFdmVudExpc3RlbmVyfSBhbmQgYmluZFxuICAgICAgICAgICAgICAgICAqIHlvdXIgb3duIGZ1bmN0aW9ucyB0byB0aGF0IGV2ZW50LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogVGhlc2UgZnVuY3Rpb25zIGFyZSBrbm93biBhcyBcImxpc3RlbmVyc1wiIGFuZCBhcmUgcGFzc2VkIG9uIHRvIHRoZSBzZWNvbmQgYXJndW1lbnQgKGBsaXN0ZW5lcmApIG9mIHRoZVxuICAgICAgICAgICAgICAgICAqIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gZnVuY3Rpb25zLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQGNhbGxiYWNrIEZ1c2lvbkNoYXJ0c35ldmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICogQHNlZSBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudE9iamVjdCAtIFRoZSBmaXJzdCBwYXJhbWV0ZXIgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBpcyBhbiBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAgICAgKiB0aGF0IGNvbnRhaW5zIGFsbCBpbmZvcm1hdGlvbiBwZXJ0YWluaW5nIHRvIGEgcGFydGljdWxhciBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE9iamVjdC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGV2ZW50T2JqZWN0LmV2ZW50SWQgLSBBIHVuaXF1ZSBJRCBhc3NvY2lhdGVkIHdpdGggdGhlIGV2ZW50LiBJbnRlcm5hbGx5IGl0IGlzIGFuXG4gICAgICAgICAgICAgICAgICogaW5jcmVtZW50aW5nIGNvdW50ZXIgYW5kIGFzIHN1Y2ggY2FuIGJlIGluZGlyZWN0bHkgdXNlZCB0byB2ZXJpZnkgdGhlIG9yZGVyIGluIHdoaWNoICB0aGUgZXZlbnQgd2FzXG4gICAgICAgICAgICAgICAgICogZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge0Z1c2lvbkNoYXJ0c30gZXZlbnRPYmplY3Quc2VuZGVyIC0gVGhlIGluc3RhbmNlIG9mIEZ1c2lvbkNoYXJ0cyBvYmplY3QgdGhhdCBmaXJlZCB0aGlzIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqIE9jY2Fzc2lvbmFsbHksIGZvciBldmVudHMgdGhhdCBhcmUgbm90IGZpcmVkIGJ5IGluZGl2aWR1YWwgY2hhcnRzLCBidXQgYXJlIGZpcmVkIGJ5IHRoZSBmcmFtZXdvcmssXG4gICAgICAgICAgICAgICAgICogd2lsbCBoYXZlIHRoZSBmcmFtZXdvcmsgYXMgdGhpcyBwcm9wZXJ0eS5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXZlbnRPYmplY3QuY2FuY2VsbGVkIC0gU2hvd3Mgd2hldGhlciBhbiAgZXZlbnQncyBwcm9wYWdhdGlvbiB3YXMgY2FuY2VsbGVkIG9yIG5vdC5cbiAgICAgICAgICAgICAgICAgKiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5zdG9wUHJvcGFnYXRpb24oKWAgaXMgY2FsbGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZXZlbnRPYmplY3Quc3RvcFByb3BhZ2F0aW9uIC0gQ2FsbCB0aGlzIGZ1bmN0aW9uIGZyb20gd2l0aGluIGEgbGlzdGVuZXIgdG8gcHJldmVudFxuICAgICAgICAgICAgICAgICAqIHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gYmVpbmcgZXhlY3V0ZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LnByZXZlbnRlZCAtIFNob3dzIHdoZXRoZXIgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIHRoaXMgZXZlbnQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICAgKiBwcmV2ZW50ZWQuIEl0IGlzIHNldCB0byBgdHJ1ZWAgd2hlbiBgLnByZXZlbnREZWZhdWx0KClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnByZXZlbnREZWZhdWx0IC0gQ2FsbCB0aGlzIGZ1bmN0aW9uIHRvIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIGFuXG4gICAgICAgICAgICAgICAgICogZXZlbnQuIEZvciBleGFtcGxlLCBmb3IgdGhlIGV2ZW50IHtAbGluayBGdXNpb25DaGFydHMjZXZlbnQ6YmVmb3JlUmVzaXplfSwgaWYgeW91IGRvXG4gICAgICAgICAgICAgICAgICogYC5wcmV2ZW50RGVmYXVsdCgpYCwgdGhlIHJlc2l6ZSB3aWxsIG5ldmVyIHRha2UgcGxhY2UgYW5kIGluc3RlYWRcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OnJlc2l6ZUNhbmNlbGxlZH0gd2lsbCBiZSBmaXJlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXZlbnRPYmplY3QuZGV0YWNoZWQgLSBEZW5vdGVzIHdoZXRoZXIgYSBsaXN0ZW5lciBoYXMgYmVlbiBkZXRhY2hlZCBhbmQgbm8gbG9uZ2VyXG4gICAgICAgICAgICAgICAgICogZ2V0cyBleGVjdXRlZCBmb3IgYW55IHN1YnNlcXVlbnQgZXZlbnQgb2YgdGhpcyBwYXJ0aWN1bGFyIGB0eXBlYC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LmRldGFjaEhhbmRsZXIgLSBBbGxvd3MgdGhlIGxpc3RlbmVyIHRvIHJlbW92ZSBpdHNlbGYgcmF0aGVyIHRoYW4gYmVpbmdcbiAgICAgICAgICAgICAgICAgKiBjYWxsZWQgZXh0ZXJuYWxseSBieSB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9LiBUaGlzIGlzIHZlcnkgdXNlZnVsIGZvciBvbmUtdGltZSBldmVudFxuICAgICAgICAgICAgICAgICAqIGxpc3RlbmluZyBvciBmb3Igc3BlY2lhbCBzaXR1YXRpb25zIHdoZW4gdGhlIGV2ZW50IGlzIG5vIGxvbmdlciByZXF1aXJlZCB0byBiZSBsaXN0ZW5lZCB3aGVuIHRoZVxuICAgICAgICAgICAgICAgICAqIGV2ZW50IGhhcyBiZWVuIGZpcmVkIHdpdGggYSBzcGVjaWZpYyBjb25kaXRpb24uXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRBcmdzIC0gRXZlcnkgZXZlbnQgaGFzIGFuIGFyZ3VtZW50IG9iamVjdCBhcyBzZWNvbmQgcGFyYW1ldGVyIHRoYXQgY29udGFpbnNcbiAgICAgICAgICAgICAgICAgKiBpbmZvcm1hdGlvbiByZWxldmFudCB0byB0aGF0IHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgc2xvdExvYWRlcihFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEZhY2lsaXRhdGUgdGhlIGNhbGwgb2YgYSBnbG9iYWwgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgc2xvdExvYWRlcihFdmVudFRhcmdldC5saXN0ZW5lcnNbJyonXSwgZXZlbnRPYmplY3QsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSBkZWZhdWx0IGFjdGlvblxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnRPYmplY3QucHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FuY2VsRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdEZuLmNhbGwoZXZlbnRTY29wZSB8fCBzZW5kZXIgfHwgd2luLCBldmVudE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgY2hhcnQgbG9hZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3Qgb2YgZXZlbnRzIHRoYXQgaGFzIGFuIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LiBVc2VkIGJ5IHRoZVxuICAgICAgICAgKiByYWlzZUV2ZW50IG1ldGhvZCB0byBjaGVjayB3aGV0aGVyIGEgcGFydGljdWxhciBldmVudCByYWlzZWRcbiAgICAgICAgICogaGFzIGFueSBjb3JyZXNwb25kaW5nIGxlZ2FjeSBldmVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBsZWdhY3lFdmVudExpc3QgPSBnbG9iYWwubGVnYWN5RXZlbnRMaXN0ID0ge30sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1haW50YWlucyBhIGxpc3Qgb2YgcmVjZW50bHkgcmFpc2VkIGNvbmRpdGlvbmFsIGV2ZW50c1xuICAgICAgICAgKiBAdHlwZSBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIGNvbmRpdGlvbkNoZWNrcyA9IHt9O1xuXG4gICAgLy8gRmFjaWxpdGF0ZSBmb3IgcmFpc2luZyBldmVudHMgaW50ZXJuYWxseS5cbiAgICByYWlzZUV2ZW50ID0gZ2xvYmFsLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgYXJncywgb2JqLCBldmVudFNjb3BlLFxuICAgICAgICAgICAgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQudHJpZ2dlckV2ZW50KHR5cGUsIG9iaiwgYXJncywgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgIH07XG5cbiAgICBnbG9iYWwuZGlzcG9zZUV2ZW50cyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgdmFyIHR5cGUsIGk7XG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgZXZlbnRzIGluIHRoZSBjb2xsZWN0aW9uIG9mIGxpc3RlbmVyc1xuICAgICAgICBmb3IgKHR5cGUgaW4gRXZlbnRUYXJnZXQubGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiBhIG1hdGNoIGlzIGZvdW5kLCBkZWxldGUgdGhlIGxpc3RlbmVyIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdW2ldWzFdID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGFsbG93cyB0byB1bmlmb3JtbHkgcmFpc2UgZXZlbnRzIG9mIEZ1c2lvbkNoYXJ0c1xuICAgICAqIEZyYW1ld29yay5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHNwZWNpZmllcyB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhcmdzIGFsbG93cyB0byBwcm92aWRlIGFuIGFyZ3VtZW50cyBvYmplY3QgdG8gYmVcbiAgICAgKiBwYXNzZWQgb24gdG8gdGhlIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgKiBAcGFyYW0gfSBvYmogaXMgdGhlIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBvYmplY3Qgb25cbiAgICAgKiBiZWhhbGYgb2Ygd2hpY2ggdGhlIGV2ZW50IHdvdWxkIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge2FycmF5fSBsZWdhY3lBcmdzIGlzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgb25cbiAgICAgKiB0byB0aGUgZXF1aXZhbGVudCBsZWdhY3kgZXZlbnQuXG4gICAgICogQHBhcmFtIHtFdmVudH0gc291cmNlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZGVmYXVsdEZuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FuY2VsRm5cbiAgICAgKlxuICAgICAqIEB0eXBlIHVuZGVmaW5lZFxuICAgICAqL1xuICAgIGdsb2JhbC5yYWlzZUV2ZW50V2l0aExlZ2FjeSA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzLCBvYmosIGxlZ2FjeUFyZ3MsXG4gICAgICAgICAgICBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBsZWdhY3kgPSBsZWdhY3lFdmVudExpc3RbbmFtZV07XG4gICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgaWYgKGxlZ2FjeSAmJiB0eXBlb2Ygd2luW2xlZ2FjeV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbltsZWdhY3ldLmFwcGx5KGV2ZW50U2NvcGUgfHwgd2luLCBsZWdhY3lBcmdzKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgYWxsb3dzIG9uZSB0byByYWlzZSByZWxhdGVkIGV2ZW50cyB0aGF0IGFyZSBncm91cGVkIHRvZ2V0aGVyIGFuZFxuICAgICAqIHJhaXNlZCBieSBtdWx0aXBsZSBzb3VyY2VzLiBVc3VhbGx5IHRoaXMgaXMgdXNlZCB3aGVyZSBhIGNvbmdyZWdhdGlvblxuICAgICAqIG9mIHN1Y2Nlc3NpdmUgZXZlbnRzIG5lZWQgdG8gY2FuY2VsIG91dCBlYWNoIG90aGVyIGFuZCBiZWhhdmUgbGlrZSBhXG4gICAgICogdW5pZmllZCBlbnRpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2hlY2sgaXMgdXNlZCB0byBpZGVudGlmeSBldmVudCBncm91cHMuIFByb3ZpZGUgc2FtZSB2YWx1ZVxuICAgICAqIGZvciBhbGwgZXZlbnRzIHRoYXQgeW91IHdhbnQgdG8gZ3JvdXAgdG9nZXRoZXIgZnJvbSBtdWx0aXBsZSBzb3VyY2VzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHNwZWNpZmllcyB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhcmdzIGFsbG93cyB0byBwcm92aWRlIGFuIGFyZ3VtZW50cyBvYmplY3QgdG8gYmVcbiAgICAgKiBwYXNzZWQgb24gdG8gdGhlIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgKiBAcGFyYW0gfSBvYmogaXMgdGhlIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBvYmplY3Qgb25cbiAgICAgKiBiZWhhbGYgb2Ygd2hpY2ggdGhlIGV2ZW50IHdvdWxkIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRTY29wZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbGxlZEZuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICAgICAqL1xuICAgIGdsb2JhbC5yYWlzZUV2ZW50R3JvdXAgPSBmdW5jdGlvbiAoY2hlY2ssIG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgdmFyIGlkID0gb2JqLmlkLFxuICAgICAgICAgICAgaGFzaCA9IGNoZWNrICsgaWQ7XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbkNoZWNrc1toYXNoXSkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbmRpdGlvbkNoZWNrc1toYXNoXSk7XG4gICAgICAgICAgICBkZWxldGUgY29uZGl0aW9uQ2hlY2tzW2hhc2hdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlkICYmIGhhc2gpIHtcbiAgICAgICAgICAgICAgICBjb25kaXRpb25DaGVja3NbaGFzaF0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmFpc2VFdmVudChuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29uZGl0aW9uQ2hlY2tzW2hhc2hdO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmFpc2VFdmVudChuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEV4dGVuZCB0aGUgZXZlbnRsaXN0ZW5lcnMgdG8gaW50ZXJuYWwgZ2xvYmFsLlxuICAgIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgIHJldHVybiBFdmVudFRhcmdldC5hZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgYmluZCk7XG4gICAgfTtcbiAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG59KTsiXX0=

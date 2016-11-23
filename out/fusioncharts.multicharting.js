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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJmdXNpb25jaGFydHMubXVsdGljaGFydGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTXVsdGlDaGFydGluZyBFeHRlbnNpb24gZm9yIEZ1c2lvbkNoYXJ0c1xuICogVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIGJhc2ljIHJvdXRpbmVzIHJlcXVpcmVkIGJ5IHN1YnNlcXVlbnQgbW9kdWxlcyB0b1xuICogZXh0ZW5kL3NjYWxlIG9yIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBNdWx0aUNoYXJ0aW5nIG9iamVjdC5cbiAqXG4gKi9cblxuIC8qIGdsb2JhbCB3aW5kb3c6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChlbnYsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBlbnYuZG9jdW1lbnQgP1xuICAgICAgICAgICAgZmFjdG9yeShlbnYpIDogZnVuY3Rpb24od2luKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3aW4uZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXaW5kb3cgd2l0aCBkb2N1bWVudCBub3QgcHJlc2VudCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFjdG9yeSh3aW4sIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbnYuTXVsdGlDaGFydGluZyA9IGZhY3RvcnkoZW52LCB0cnVlKTtcbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uIChfd2luZG93LCB3aW5kb3dFeGlzdHMpIHtcbiAgICAvLyBJbiBjYXNlIE11bHRpQ2hhcnRpbmcgYWxyZWFkeSBleGlzdHMuXG4gICAgaWYgKF93aW5kb3cuTXVsdGlDaGFydGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIE11bHRpQ2hhcnRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbiA9IF93aW5kb3c7XG5cbiAgICBpZiAod2luZG93RXhpc3RzKSB7XG4gICAgICAgIF93aW5kb3cuTXVsdGlDaGFydGluZyA9IE11bHRpQ2hhcnRpbmc7XG4gICAgfVxuICAgIHJldHVybiBNdWx0aUNoYXJ0aW5nO1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG1lcmdlID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpIHtcbiAgICAgICAgICAgIHZhciBpdGVtLFxuICAgICAgICAgICAgICAgIHNyY1ZhbCxcbiAgICAgICAgICAgICAgICB0Z3RWYWwsXG4gICAgICAgICAgICAgICAgc3RyLFxuICAgICAgICAgICAgICAgIGNSZWYsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHJGbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgICAgICAgICAgYXJyYXlUb1N0ciA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHIgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICAgICAgICAgICAgICBjaGVja0N5Y2xpY1JlZiA9IGZ1bmN0aW9uKG9iaiwgcGFyZW50QXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gcGFyZW50QXJyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmogPT09IHBhcmVudEFycltpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5kZXg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcblxuICAgICAgICAgICAgLy9jaGVjayB3aGV0aGVyIG9iajIgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgIC8vaWYgYXJyYXkgdGhlbiBpdGVyYXRlIHRocm91Z2ggaXQncyBpbmRleFxuICAgICAgICAgICAgLy8qKioqIE1PT1RPT0xTIHByZWN1dGlvblxuXG4gICAgICAgICAgICBpZiAoIXNyY0Fycikge1xuICAgICAgICAgICAgICAgIHRndEFyciA9IFtvYmoxXTtcbiAgICAgICAgICAgICAgICBzcmNBcnIgPSBbb2JqMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0Z3RBcnIucHVzaChvYmoxKTtcbiAgICAgICAgICAgICAgICBzcmNBcnIucHVzaChvYmoyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9iajIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGZvciAoaXRlbSA9IDA7IGl0ZW0gPCBvYmoyLmxlbmd0aDsgaXRlbSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VmFsID0gb2JqMltpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRndFZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShza2lwVW5kZWYgJiYgdGd0VmFsID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgdHlwZW9mIHNyY1ZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndFZhbCBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtIGluIG9iajIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0Z3RWYWwgIT09IG51bGwgJiYgdHlwZW9mIHRndFZhbCA9PT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggZm9yIGlzc3VlIEJVRzogRldYVC02MDJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFIDwgOSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobnVsbCkgZ2l2ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdbb2JqZWN0IE9iamVjdF0nIGluc3RlYWQgb2YgJ1tvYmplY3QgTnVsbF0nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0J3Mgd2h5IG51bGwgdmFsdWUgYmVjb21lcyBPYmplY3QgaW4gSUUgPCA5XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgPSBvYmplY3RUb1N0ckZuLmNhbGwodGd0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IG9iamVjdFRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0ciA9PT0gYXJyYXlUb1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgIShzcmNWYWwgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVuZDIgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmKSB7XG4gICAgICAgICAgICB2YXIgT0JKRUNUU1RSSU5HID0gJ29iamVjdCc7XG4gICAgICAgICAgICAvL2lmIG5vbmUgb2YgdGhlIGFyZ3VtZW50cyBhcmUgb2JqZWN0IHRoZW4gcmV0dXJuIGJhY2tcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HICYmIHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcgfHwgb2JqMiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIG9iajEgPSBvYmoyIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVyZ2Uob2JqMSwgb2JqMiwgc2tpcFVuZGVmKTtcbiAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICB9LFxuICAgICAgICBsaWIgPSB7XG4gICAgICAgICAgICBleHRlbmQyOiBleHRlbmQyLFxuICAgICAgICAgICAgbWVyZ2U6IG1lcmdlXG4gICAgICAgIH07XG5cblx0TXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliID0gKE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiB8fCBsaWIpO1xuXG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBBamF4ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGFqYXggPSB0aGlzLFxuXHRcdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXTtcblxuXHRcdCAgICBhamF4Lm9uU3VjY2VzcyA9IGFyZ3VtZW50LnN1Y2Nlc3M7XG5cdFx0ICAgIGFqYXgub25FcnJvciA9IGFyZ3VtZW50LmVycm9yO1xuXHRcdCAgICBhamF4Lm9wZW4gPSBmYWxzZTtcblx0XHQgICAgcmV0dXJuIGFqYXguZ2V0KGFyZ3VtZW50LnVybCk7XG5cdFx0fSxcblxuICAgICAgICBhamF4UHJvdG8gPSBBamF4LnByb3RvdHlwZSxcblxuICAgICAgICBGVU5DVElPTiA9ICdmdW5jdGlvbicsXG4gICAgICAgIE1TWE1MSFRUUCA9ICdNaWNyb3NvZnQuWE1MSFRUUCcsXG4gICAgICAgIE1TWE1MSFRUUDIgPSAnTXN4bWwyLlhNTEhUVFAnLFxuICAgICAgICBHRVQgPSAnR0VUJyxcbiAgICAgICAgWEhSRVFFUlJPUiA9ICdYbWxIdHRwcmVxdWVzdCBFcnJvcicsXG4gICAgICAgIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBtdWx0aUNoYXJ0aW5nUHJvdG8ud2luLCAvLyBrZWVwIGEgbG9jYWwgcmVmZXJlbmNlIG9mIHdpbmRvdyBzY29wZVxuXG4gICAgICAgIC8vIFByb2JlIElFIHZlcnNpb25cbiAgICAgICAgdmVyc2lvbiA9IHBhcnNlRmxvYXQod2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLnNwbGl0KCdNU0lFJylbMV0pLFxuICAgICAgICBpZWx0OCA9ICh2ZXJzaW9uID49IDUuNSAmJiB2ZXJzaW9uIDw9IDcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBmaXJlZm94ID0gL21vemlsbGEvaS50ZXN0KHdpbi5uYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZsYWdzLlxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBwYWdlIGlzIG9uIGZpbGUgcHJvdG9jb2wuXG4gICAgICAgIGZpbGVQcm90b2NvbCA9IHdpbi5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyxcbiAgICAgICAgQVhPYmplY3QgPSB3aW4uQWN0aXZlWE9iamVjdCxcblxuICAgICAgICAvLyBDaGVjayBpZiBuYXRpdmUgeGhyIGlzIHByZXNlbnRcbiAgICAgICAgWEhSTmF0aXZlID0gKCFBWE9iamVjdCB8fCAhZmlsZVByb3RvY29sKSAmJiB3aW4uWE1MSHR0cFJlcXVlc3QsXG5cbiAgICAgICAgLy8gUHJlcGFyZSBmdW5jdGlvbiB0byByZXRyaWV2ZSBjb21wYXRpYmxlIHhtbGh0dHByZXF1ZXN0LlxuICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4bWxodHRwO1xuXG4gICAgICAgICAgICAvLyBpZiB4bWxodHRwcmVxdWVzdCBpcyBwcmVzZW50IGFzIG5hdGl2ZSwgdXNlIGl0LlxuICAgICAgICAgICAgaWYgKFhIUk5hdGl2ZSkge1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhIUk5hdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBhY3RpdmVYIGZvciBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICAgICAgfSxcblxuICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBQcmV2ZW50cyBjYWNoZWluZyBvZiBBSkFYIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0lmLU1vZGlmaWVkLVNpbmNlJzogJ1NhdCwgMjkgT2N0IDE5OTQgMTk6NDM6MzEgR01UJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyB0aGUgc2VydmVyIGtub3cgdGhhdCB0aGlzIGlzIGFuIEFKQVggcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyBzZXJ2ZXIga25vdyB3aGljaCB3ZWIgYXBwbGljYXRpb24gaXMgc2VuZGluZyByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1CeSc6ICdGdXNpb25DaGFydHMnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZW50aW9ucyBjb250ZW50LXR5cGVzIHRoYXQgYXJlIGFjY2VwdGFibGUgZm9yIHRoZSByZXNwb25zZS4gU29tZSBzZXJ2ZXJzIHJlcXVpcmUgdGhpcyBmb3IgQWpheFxuICAgICAgICAgICAgICogY29tbXVuaWNhdGlvbi5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9wbGFpbiwgKi8qJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIE1JTUUgdHlwZSBvZiB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdCBhbG9uZyB3aXRoIGl0cyBjaGFyc2V0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnXG4gICAgICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5hamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFqYXgoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmdldCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IHdyYXBwZXIueG1saHR0cCxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sgPSB3cmFwcGVyLm9uRXJyb3IsXG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgPSB3cmFwcGVyLm9uU3VjY2VzcyxcbiAgICAgICAgICAgIHhSZXF1ZXN0ZWRCeSA9ICdYLVJlcXVlc3RlZC1CeScsXG4gICAgICAgICAgICBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGV2ZW50TGlzdCA9IFsnb25sb2Fkc3RhcnQnLCAnb25kdXJhdGlvbmNoYW5nZScsICdvbmxvYWRlZG1ldGFkYXRhJywgJ29ubG9hZGVkZGF0YScsICdvbnByb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAnb25jYW5wbGF5JywgJ29uY2FucGxheXRocm91Z2gnLCAnb25hYm9ydCcsICdvbmVycm9yJywgJ29udGltZW91dCcsICdvbmxvYWRlbmQnXTtcblxuICAgICAgICAvLyBYLVJlcXVlc3RlZC1CeSBpcyByZW1vdmVkIGZyb20gaGVhZGVyIGR1cmluZyBjcm9zcyBkb21haW4gYWpheCBjYWxsXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9eKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykvKSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaG9zdG5hbWUgIT09IC8oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKShbXlxcL1xcOl0qKS8uZXhlYyh1cmwpWzJdKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gaHR0cCBvciBodHRwcywgdGhlbiBpdHMgYSBzYW1lIGRvbWFpbiBjYWxsLiBObyBuZWVkIHRvIHVzZSByZWdleCB0byBnZXRcbiAgICAgICAgICAgIC8vIGRvbWFpbi4gSWYgaXQgY29udGFpbnMgdGhlbiBjaGVja3MgZG9tYWluLlxuICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbeFJlcXVlc3RlZEJ5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICFoYXNPd24uY2FsbChoZWFkZXJzLCB4UmVxdWVzdGVkQnkpICYmIChoZWFkZXJzW3hSZXF1ZXN0ZWRCeV0gPSAnRnVzaW9uQ2hhcnRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXhtbGh0dHAgfHwgaWVsdDggfHwgZmlyZWZveCkge1xuICAgICAgICAgICAgeG1saHR0cCA9IG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB3cmFwcGVyLnhtbGh0dHAgPSB4bWxodHRwO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzIDwgMzAwKSB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMzA0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA9PT0gMTIyMyB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh4bWxodHRwLnJlc3BvbnNlVGV4dCwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKG5ldyBFcnJvcihYSFJFUUVSUk9SKSwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgeG1saHR0cFtldmVudE5hbWVdID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50IDogZXZlbnRcbiAgICAgICAgICAgICAgICB9LCB3cmFwcGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4bWxodHRwLm9wZW4oR0VULCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3BsYWluJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5zZXRSZXF1ZXN0SGVhZGVyKGksIGhlYWRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB4bWxodHRwLnNlbmQoKTtcbiAgICAgICAgICAgIHdyYXBwZXIub3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3IsIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IGluc3RhbmNlLnhtbGh0dHA7XG5cbiAgICAgICAgaW5zdGFuY2Uub3BlbiA9IGZhbHNlO1xuICAgICAgICByZXR1cm4geG1saHR0cCAmJiB0eXBlb2YgeG1saHR0cC5hYm9ydCA9PT0gRlVOQ1RJT04gJiYgeG1saHR0cC5yZWFkeVN0YXRlICYmXG4gICAgICAgICAgICAgICAgeG1saHR0cC5yZWFkeVN0YXRlICE9PSAwICYmIHhtbGh0dHAuYWJvcnQoKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIGluc3RhbmNlLm9wZW4gJiYgaW5zdGFuY2UuYWJvcnQoKTtcblxuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25FcnJvcjtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9uU3VjY2VzcztcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLnhtbGh0dHA7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vcGVuO1xuXG4gICAgICAgIHJldHVybiAoaW5zdGFuY2UgPSBudWxsKTtcbiAgICB9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuICAgIC8vIFNvdXJjZTogaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8xNTA0LUFzay1CZW4tUGFyc2luZy1DU1YtU3RyaW5ncy1XaXRoLUphdmFzY3JpcHQtRXhlYy1SZWd1bGFyLUV4cHJlc3Npb24tQ29tbWFuZC5odG1cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXG5cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuICAgIGZ1bmN0aW9uIENTVlRvQXJyYXkgKHN0ckRhdGEsIHN0ckRlbGltaXRlcikge1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGRlbGltaXRlciBpcyBkZWZpbmVkLiBJZiBub3QsXG4gICAgICAgIC8vIHRoZW4gZGVmYXVsdCB0byBjb21tYS5cbiAgICAgICAgc3RyRGVsaW1pdGVyID0gKHN0ckRlbGltaXRlciB8fCBcIixcIik7XG4gICAgICAgIC8vIENyZWF0ZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBwYXJzZSB0aGUgQ1NWIHZhbHVlcy5cbiAgICAgICAgdmFyIG9ialBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIC8vIERlbGltaXRlcnMuXG4gICAgICAgICAgICAgICAgXCIoXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJ8XFxcXHI/XFxcXG58XFxcXHJ8XilcIiArXG4gICAgICAgICAgICAgICAgLy8gUXVvdGVkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIig/OlxcXCIoW15cXFwiXSooPzpcXFwiXFxcIlteXFxcIl0qKSopXFxcInxcIiArXG4gICAgICAgICAgICAgICAgLy8gU3RhbmRhcmQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKFteXFxcIlxcXFxcIiArIHN0ckRlbGltaXRlciArIFwiXFxcXHJcXFxcbl0qKSlcIlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFwiZ2lcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGRhdGEuIEdpdmUgdGhlIGFycmF5XG4gICAgICAgIC8vIGEgZGVmYXVsdCBlbXB0eSBmaXJzdCByb3cuXG4gICAgICAgIHZhciBhcnJEYXRhID0gW1tdXTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGluZGl2aWR1YWwgcGF0dGVyblxuICAgICAgICAvLyBtYXRjaGluZyBncm91cHMuXG4gICAgICAgIHZhciBhcnJNYXRjaGVzID0gbnVsbDtcbiAgICAgICAgLy8gS2VlcCBsb29waW5nIG92ZXIgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzXG4gICAgICAgIC8vIHVudGlsIHdlIGNhbiBubyBsb25nZXIgZmluZCBhIG1hdGNoLlxuICAgICAgICB3aGlsZSAoYXJyTWF0Y2hlcyA9IG9ialBhdHRlcm4uZXhlYyggc3RyRGF0YSApKXtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZGVsaW1pdGVyIHRoYXQgd2FzIGZvdW5kLlxuICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWREZWxpbWl0ZXIgPSBhcnJNYXRjaGVzWyAxIF07XG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGdpdmVuIGRlbGltaXRlciBoYXMgYSBsZW5ndGhcbiAgICAgICAgICAgIC8vIChpcyBub3QgdGhlIHN0YXJ0IG9mIHN0cmluZykgYW5kIGlmIGl0IG1hdGNoZXNcbiAgICAgICAgICAgIC8vIGZpZWxkIGRlbGltaXRlci4gSWYgaWQgZG9lcyBub3QsIHRoZW4gd2Uga25vd1xuICAgICAgICAgICAgLy8gdGhhdCB0aGlzIGRlbGltaXRlciBpcyBhIHJvdyBkZWxpbWl0ZXIuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgc3RyTWF0Y2hlZERlbGltaXRlci5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAoc3RyTWF0Y2hlZERlbGltaXRlciAhPSBzdHJEZWxpbWl0ZXIpXG4gICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBoYXZlIHJlYWNoZWQgYSBuZXcgcm93IG9mIGRhdGEsXG4gICAgICAgICAgICAgICAgLy8gYWRkIGFuIGVtcHR5IHJvdyB0byBvdXIgZGF0YSBhcnJheS5cbiAgICAgICAgICAgICAgICBhcnJEYXRhLnB1c2goIFtdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciBkZWxpbWl0ZXIgb3V0IG9mIHRoZSB3YXksXG4gICAgICAgICAgICAvLyBsZXQncyBjaGVjayB0byBzZWUgd2hpY2gga2luZCBvZiB2YWx1ZSB3ZVxuICAgICAgICAgICAgLy8gY2FwdHVyZWQgKHF1b3RlZCBvciB1bnF1b3RlZCkuXG4gICAgICAgICAgICBpZiAoYXJyTWF0Y2hlc1sgMiBdKXtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIHF1b3RlZCB2YWx1ZS4gV2hlbiB3ZSBjYXB0dXJlXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB2YWx1ZSwgdW5lc2NhcGUgYW55IGRvdWJsZSBxdW90ZXMuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDIgXS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICBuZXcgUmVnRXhwKCBcIlxcXCJcXFwiXCIsIFwiZ1wiICksXG4gICAgICAgICAgICAgICAgICAgIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgbm9uLXF1b3RlZCB2YWx1ZS5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgdmFsdWUgc3RyaW5nLCBsZXQncyBhZGRcbiAgICAgICAgICAgIC8vIGl0IHRvIHRoZSBkYXRhIGFycmF5LlxuICAgICAgICAgICAgYXJyRGF0YVsgYXJyRGF0YS5sZW5ndGggLSAxIF0ucHVzaCggc3RyTWF0Y2hlZFZhbHVlICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBwYXJzZWQgZGF0YS5cbiAgICAgICAgcmV0dXJuKCBhcnJEYXRhICk7XG4gICAgfVxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jb252ZXJ0VG9BcnJheSA9IGZ1bmN0aW9uIChkYXRhLCBkZWxpbWl0ZXIsIG91dHB1dEZvcm1hdCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZGVsaW1pdGVyID0gZGF0YS5kZWxpbWl0ZXI7XG4gICAgICAgICAgICBvdXRwdXRGb3JtYXQgPSBkYXRhLm91dHB1dEZvcm1hdDtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGF0YS5jYWxsYmFjaztcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLnN0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ1NWIHN0cmluZyBub3QgcHJvdmlkZWQnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3BsaXRlZERhdGEgPSBkYXRhLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pLFxuICAgICAgICAgICAgLy90b3RhbCBudW1iZXIgb2Ygcm93c1xuICAgICAgICAgICAgbGVuID0gc3BsaXRlZERhdGEubGVuZ3RoLFxuICAgICAgICAgICAgLy9maXJzdCByb3cgaXMgaGVhZGVyIGFuZCBzcGxpdGluZyBpdCBpbnRvIGFycmF5c1xuICAgICAgICAgICAgaGVhZGVyID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVswXSwgZGVsaW1pdGVyKSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICBpID0gMSxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgayA9IDAsXG4gICAgICAgICAgICBrbGVuID0gMCxcbiAgICAgICAgICAgIGNlbGwgPSBbXSxcbiAgICAgICAgICAgIG1pbiA9IE1hdGgubWluLFxuICAgICAgICAgICAgZmluYWxPYixcbiAgICAgICAgICAgIHVwZGF0ZU1hbmFnZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGpsZW4gPSAwLFxuICAgICAgICAgICAgICAgICAgICBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbGltID0gaSArIDMwMDA7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxpbSA+IGxlbikge1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBsZW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGltOyArK2kpIHtcblxuICAgICAgICAgICAgICAgICAgICAvL2NyZWF0ZSBjZWxsIGFycmF5IHRoYXQgY29pbnRhaW4gY3N2IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgY2VsbCA9IENTVlRvQXJyYXkoc3BsaXRlZERhdGFbaV0sIGRlbGltaXRlcik7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gY2VsbCAmJiBjZWxsWzBdO1xuICAgICAgICAgICAgICAgICAgICAvL3Rha2UgbWluIG9mIGhlYWRlciBsZW5ndGggYW5kIHRvdGFsIGNvbHVtbnNcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IG1pbihoZWFkZXIubGVuZ3RoLCBjZWxsLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dEZvcm1hdCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxPYi5wdXNoKGNlbGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG91dHB1dEZvcm1hdCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGpsZW47ICsraikgeyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGluZyB0aGUgZmluYWwgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW2hlYWRlcltqXV0gPSBjZWxsW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxPYi5wdXNoKG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGpsZW47ICsraikgeyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGluZyB0aGUgZmluYWwgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJbal1dLnB1c2goY2VsbFtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaSA8IGxlbiAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jYWxsIHVwZGF0ZSBtYW5hZ2VyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNldFRpbWVvdXQodXBkYXRlTWFuYWdlciwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZU1hbmFnZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhmaW5hbE9iKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG91dHB1dEZvcm1hdCA9IG91dHB1dEZvcm1hdCB8fCAxO1xuICAgICAgICBoZWFkZXIgPSBoZWFkZXIgJiYgaGVhZGVyWzBdO1xuXG4gICAgICAgIC8vaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gICAgICAgIGlmIChzcGxpdGVkRGF0YVtzcGxpdGVkRGF0YS5sZW5ndGggLSAxXSA9PT0gJycpIHtcbiAgICAgICAgICAgIHNwbGl0ZWREYXRhLnNwbGljZSgoc3BsaXRlZERhdGEubGVuZ3RoIC0gMSksIDEpO1xuICAgICAgICAgICAgbGVuLS07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG91dHB1dEZvcm1hdCA9PT0gMSkge1xuICAgICAgICAgICAgZmluYWxPYiA9IFtdO1xuICAgICAgICAgICAgZmluYWxPYi5wdXNoKGhlYWRlcik7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAzKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0ge307XG4gICAgICAgICAgICBmb3IgKGsgPSAwLCBrbGVuID0gaGVhZGVyLmxlbmd0aDsgayA8IGtsZW47ICsraykge1xuICAgICAgICAgICAgICAgIGZpbmFsT2JbaGVhZGVyW2tdXSA9IFtdO1xuICAgICAgICAgICAgfSAgIFxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuXG4gICAgfTtcblxufSk7XG4iLCIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyXHRtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcblx0XHRsaWIgPSBtdWx0aUNoYXJ0aW5nUHJvdG8ubGliLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlID0ge30sXG5cdFx0b3V0cHV0RGF0YVN0b3JhZ2UgPSBsaWIub3V0cHV0RGF0YVN0b3JhZ2UgPSB7fSxcblx0XHRtZXRhU3RvcmFnZSA9IGxpYi5tZXRhU3RvcmFnZSA9IHt9LFxuXHRcdGV4dGVuZDIgPSBsaWIuZXh0ZW5kMixcblx0XHQvLyBGb3Igc3RvcmluZyB0aGUgY2hpbGQgb2YgYSBwYXJlbnRcblx0XHRsaW5rU3RvcmUgPSB7fSxcblx0XHQvL0ZvciBzdG9yaW5nIHRoZSBwYXJlbnQgb2YgYSBjaGlsZFxuXHRcdHBhcmVudFN0b3JlID0gbGliLnBhcmVudFN0b3JlID0ge30sXG5cdFx0aWRDb3VudCA9IDAsXG5cdFx0Ly8gQ29uc3RydWN0b3IgY2xhc3MgZm9yIERhdGFTdG9yZS5cblx0XHREYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBcdHZhciBtYW5hZ2VyID0gdGhpcztcblx0ICAgIFx0bWFuYWdlci51bmlxdWVWYWx1ZXMgPSB7fTtcblx0ICAgIFx0bWFuYWdlci5zZXREYXRhKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHRkYXRhU3RvcmVQcm90byA9IERhdGFTdG9yZS5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byBleGVjdXRlIHRoZSBkYXRhUHJvY2Vzc29yIG92ZXIgdGhlIGRhdGFcblx0XHRleGVjdXRlUHJvY2Vzc29yID0gZnVuY3Rpb24gKHR5cGUsIGZpbHRlckZuLCBKU09ORGF0YSkge1xuXHRcdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRcdGNhc2UgICdzb3J0JyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUuc29ydC5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdGNhc2UgICdmaWx0ZXInIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuXHRcdFx0XHRjYXNlICdtYXAnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuXHRcdFx0XHRkZWZhdWx0IDogcmV0dXJuIGZpbHRlckZuKEpTT05EYXRhKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgYWxsIHRoZSBsaW5rZWQgY2hpbGQgZGF0YVxuXHRcdHVwZGF0YURhdGEgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRcdHBhcmVudERhdGEgPSAob3V0cHV0RGF0YVN0b3JhZ2VbaWRdICYmIG91dHB1dERhdGFTdG9yYWdlW2lkXS5kYXRhKSB8fCBkYXRhU3RvcmFnZVtpZF0sXG5cdFx0XHRcdGZpbHRlclN0b3JlID0gbGliLmZpbHRlclN0b3JlLFxuXHRcdFx0XHRsZW4sXG5cdFx0XHRcdGxpbmtJZHMsXG5cdFx0XHRcdGZpbHRlcnMsXG5cdFx0XHRcdGxpbmtJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0b3V0U3BlY3MsXG5cdFx0XHRcdGRhdGFTdG9yZSxcblx0XHRcdFx0cHJvY2Vzc29yLFxuXHRcdFx0XHQvLyBTdG9yZSBhbGwgdGhlIGRhdGFPYmpzIHRoYXQgYXJlIHVwZGF0ZWQuXG5cdFx0XHRcdHRlbXBEYXRhVXBkYXRlZCA9IGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblxuXHRcdFx0bGlua0lkcyA9IGxpbmtEYXRhLmxpbms7XG5cdFx0XHRmaWx0ZXJzID0gbGlua0RhdGEuZmlsdGVyO1xuXHRcdFx0bGVuID0gbGlua0lkcy5sZW5ndGg7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRkYXRhU3RvcmUgPSBsaW5rSWRzW2ldO1xuXHRcdFx0XHRsaW5rSWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRcdFx0dGVtcERhdGFVcGRhdGVkW2xpbmtJZF0gPSB0cnVlO1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldO1xuXHRcdFx0XHRmaWx0ZXJGbiA9IGZpbHRlci5nZXRQcm9jZXNzb3IoKTtcblx0XHRcdFx0dHlwZSA9IGZpbHRlci50eXBlO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyRm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRpZiAoZmlsdGVyU3RvcmVbZmlsdGVyLmlkXSkge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgZmlsdGVyRm4sIHBhcmVudERhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFTdG9yYWdlW2xpbmtJZF0gPSBwYXJlbnREYXRhO1xuXHRcdFx0XHRcdFx0ZmlsdGVyLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGkgLT0gMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBNb2RpZnlpbmcgZGF0YSBvZiBzZWxmIGFwcGxpZWQgcHJvY2Vzc29yLlxuXHRcdFx0XHRcdGlmIChvdXRTcGVjcyA9ICBvdXRwdXREYXRhU3RvcmFnZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0XHRwcm9jZXNzb3IgPSBvdXRTcGVjcy5wcm9jZXNzb3I7XG5cdFx0XHRcdFx0XHRvdXRwdXREYXRhU3RvcmFnZVtsaW5rSWRdID0gZXhlY3V0ZVByb2Nlc3Nvcihwcm9jZXNzb3IudHlwZSwgcHJvY2Vzc29yLmdldFByb2Nlc3NvcigpLFxuXHRcdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdFx0XHRcdGRhdGFTdG9yZS51bmlxdWVWYWx1ZXMgPSB7fTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShsaW5rSWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRnVuY3Rpb24gdG8gdXBkYXRlIG1ldGFEYXRhIG9mIHRoZSBjaGlsZCBkYXRhIHJlY3Vyc3NpdmVseVxuXHRcdHVwZGF0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGlkLCBtZXRhRGF0YSkge1xuXHRcdFx0dmFyIGxpbmtzID0gbGlua1N0b3JlW2lkXS5saW5rLFxuXHRcdFx0XHRsZW5ndGggPSBsaW5rcy5sZW5ndGgsXG5cdFx0XHRcdGksXG5cdFx0XHRcdG5ld01ldGFEYXRhLFxuXHRcdFx0XHRsaW5rO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0bGluayA9IGxpbmtzW2ldLmlkO1xuXHRcdFx0XHRuZXdNZXRhRGF0YSA9IG1ldGFTdG9yYWdlW2xpbmtdID0gZXh0ZW5kMih7fSwgbWV0YURhdGEpO1xuXHRcdFx0XHRpZiAobGlua1N0b3JlW2xpbmtdKSB7XG5cdFx0XHRcdFx0dXBkYXRlTWV0YURhdGEobGluaywgbmV3TWV0YURhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRtdWx0aUNoYXJ0aW5nUHJvdG8uY3JlYXRlRGF0YVN0b3JlID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVN0b3JlKGFyZ3VtZW50cyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgaW4gdGhlIGRhdGEgc3RvcmVcblx0ZGF0YVN0b3JlUHJvdG8uc2V0RGF0YSA9IGZ1bmN0aW9uIChkYXRhU3BlY3MsIGNhbGxiYWNrLCBub1JhaXNlRXZlbnRGbGFnKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRvbGRJZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdGlkID0gZGF0YVNwZWNzLmlkLFxuXHRcdFx0ZGF0YVR5cGUgPSBkYXRhU3BlY3MuZGF0YVR5cGUsXG5cdFx0XHRkYXRhU291cmNlID0gZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRvbGRKU09ORGF0YSA9IGRhdGFTdG9yYWdlW29sZElkXSB8fCBbXSxcblx0XHRcdGNhbGxiYWNrSGVscGVyRm4gPSBmdW5jdGlvbiAoSlNPTkRhdGEpIHtcblx0XHRcdFx0ZGF0YVN0b3JhZ2VbaWRdID0gb2xkSlNPTkRhdGEuY29uY2F0KEpTT05EYXRhIHx8IFtdKTtcblx0XHRcdFx0IW5vUmFpc2VFdmVudEZsYWcgJiYgSlNPTkRhdGEgJiYgbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFBZGRlZCcsIHtcblx0XHRcdFx0XHQnaWQnOiBpZCxcblx0XHRcdFx0XHQnZGF0YScgOiBKU09ORGF0YVxuXHRcdFx0XHR9LCBkYXRhU3RvcmUpO1xuXHRcdFx0XHRpZiAobGlua1N0b3JlW2lkXSkge1xuXHRcdFx0XHRcdHVwZGF0YURhdGEoaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhKU09ORGF0YSk7XG5cdFx0XHRcdH1cdFxuXHRcdFx0fTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2RhdGFTdG9yYWdlJyArIGlkQ291bnQgKys7XG5cdFx0ZGF0YVN0b3JlLmlkID0gaWQ7XG5cdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdGRhdGFTdG9yZS51bmlxdWVWYWx1ZXMgPSB7fTtcblxuXHRcdGlmIChkYXRhVHlwZSA9PT0gJ2NzdicpIHtcblx0XHRcdG11bHRpQ2hhcnRpbmdQcm90by5jb252ZXJ0VG9BcnJheSh7XG5cdFx0XHRcdHN0cmluZyA6IGRhdGFTcGVjcy5kYXRhU291cmNlLFxuXHRcdFx0XHRkZWxpbWl0ZXIgOiBkYXRhU3BlY3MuZGVsaW1pdGVyLFxuXHRcdFx0XHRvdXRwdXRGb3JtYXQgOiBkYXRhU3BlY3Mub3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHRjYWxsYmFjayA6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhU291cmNlKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBqc29uZGF0YSBvZiB0aGUgZGF0YSBvYmplY3Rcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaWQgPSB0aGlzLmlkO1xuXHRcdHJldHVybiAoKG91dHB1dERhdGFTdG9yYWdlW2lkXSAmJiBvdXRwdXREYXRhU3RvcmFnZVtpZF0uZGF0YSkgfHwgZGF0YVN0b3JhZ2VbaWRdKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgY2hpbGQgZGF0YSBvYmplY3QgYWZ0ZXIgYXBwbHlpbmcgZmlsdGVyIG9uIHRoZSBwYXJlbnQgZGF0YS5cblx0Ly8gQHBhcmFtcyB7ZmlsdGVyc30gLSBUaGlzIGNhbiBiZSBhIGZpbHRlciBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBmaWx0ZXIgZnVuY3Rpb25zLlxuXHRkYXRhU3RvcmVQcm90by5nZXREYXRhID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGEuaWQsXG5cdFx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbms7XG5cdFx0Ly8gSWYgbm8gcGFyYW1ldGVyIGlzIHByZXNlbnQgdGhlbiByZXR1cm4gdGhlIHVuZmlsdGVyZWQgZGF0YS5cblx0XHRpZiAoIWZpbHRlcnMpIHtcblx0XHRcdHJldHVybiBkYXRhU3RvcmFnZVtpZF07XG5cdFx0fVxuXHRcdC8vIElmIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvZiBmaWx0ZXIgdGhlbiByZXR1cm4gdGhlIGZpbHRlcmVkIGRhdGEgYWZ0ZXIgYXBwbHlpbmcgdGhlIGZpbHRlciBvdmVyIHRoZSBkYXRhLlxuXHRcdGVsc2Uge1xuXHRcdFx0bGV0IHJlc3VsdCA9IFtdLFxuXHRcdFx0XHRpLFxuXHRcdFx0XHRuZXdEYXRhLFxuXHRcdFx0XHRsaW5rRGF0YSxcblx0XHRcdFx0bmV3SWQsXG5cdFx0XHRcdGZpbHRlcixcblx0XHRcdFx0ZmlsdGVyRm4sXG5cdFx0XHRcdGRhdGFsaW5rcyxcblx0XHRcdFx0ZmlsdGVySUQsXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdG5ld0RhdGFPYmosXG5cdFx0XHRcdGlzRmlsdGVyQXJyYXkgPSBmaWx0ZXJzIGluc3RhbmNlb2YgQXJyYXksXG5cdFx0XHRcdGxlbiA9IGlzRmlsdGVyQXJyYXkgPyBmaWx0ZXJzLmxlbmd0aCA6IDE7XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ldIHx8IGZpbHRlcnM7XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldFByb2Nlc3NvcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdG5ld0RhdGEgPSBleGVjdXRlUHJvY2Vzc29yKHR5cGUsIGZpbHRlckZuLCBkYXRhU3RvcmFnZVtpZF0pO1xuXG5cdFx0XHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2RhdGFQcm9jZXNzb3JBcHBsaWVkJywge1xuXHRcdFx0XHRcdFx0J2RhdGFTdG9yZSc6IGRhdGEsXG5cdFx0XHRcdFx0XHQnZGF0YVByb2Nlc3NvcicgOiBmaWx0ZXJcblx0XHRcdFx0XHR9LCBkYXRhKTtcblxuXHRcdFx0XHRcdG5ld0RhdGFPYmogPSBuZXcgRGF0YVN0b3JlKHtkYXRhU291cmNlIDogbmV3RGF0YX0pO1xuXHRcdFx0XHRcdG5ld0lkID0gbmV3RGF0YU9iai5pZDtcblxuXHRcdFx0XHRcdC8vUGFzc2luZyB0aGUgbWV0YURhdGEgdG8gdGhlIGNoaWxkLlxuXHRcdFx0XHRcdG5ld0RhdGFPYmouYWRkTWV0YURhdGEobWV0YVN0b3JhZ2VbaWRdKTtcblx0XHRcdFx0XHRwYXJlbnRTdG9yZVtuZXdJZF0gPSBkYXRhO1xuXG5cdFx0XHRcdFx0cmVzdWx0LnB1c2gobmV3RGF0YU9iaik7XG5cblx0XHRcdFx0XHQvL1B1c2hpbmcgdGhlIGlkIGFuZCBmaWx0ZXIgb2YgY2hpbGQgY2xhc3MgdW5kZXIgdGhlIHBhcmVudCBjbGFzc2VzIGlkLlxuXHRcdFx0XHRcdGxpbmtEYXRhID0gbGlua1N0b3JlW2lkXSB8fCAobGlua1N0b3JlW2lkXSA9IHtcblx0XHRcdFx0XHRcdGxpbmsgOiBbXSxcblx0XHRcdFx0XHRcdGZpbHRlciA6IFtdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0bGlua0RhdGEubGluay5wdXNoKG5ld0RhdGFPYmopO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmZpbHRlci5wdXNoKGZpbHRlcik7XG5cblx0XHRcdFx0XHQvLyBTdG9yaW5nIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCB1bmRlciB0aGUgZmlsdGVyIGlkLlxuXHRcdFx0XHRcdGZpbHRlcklEID0gZmlsdGVyLmdldElEKCk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzID0gZmlsdGVyTGlua1tmaWx0ZXJJRF0gfHwgKGZpbHRlckxpbmtbZmlsdGVySURdID0gW10pO1xuXHRcdFx0XHRcdGRhdGFsaW5rcy5wdXNoKG5ld0RhdGFPYmopO1xuXG5cdFx0XHRcdFx0Ly8gc2V0dGluZyB0aGUgY3VycmVudCBpZCBhcyB0aGUgbmV3SUQgc28gdGhhdCB0aGUgbmV4dCBmaWx0ZXIgaXMgYXBwbGllZCBvbiB0aGUgY2hpbGQgZGF0YTtcblx0XHRcdFx0XHRpZCA9IG5ld0lkO1xuXHRcdFx0XHRcdGRhdGEgPSBuZXdEYXRhT2JqO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gKGlzRmlsdGVyQXJyYXkgPyByZXN1bHQgOiByZXN1bHRbMF0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBkZWxldGUgdGhlIGN1cnJlbnQgZGF0YSBmcm9tIHRoZSBkYXRhU3RvcmFnZSBhbmQgYWxzbyBhbGwgaXRzIGNoaWxkcyByZWN1cnNpdmVseVxuXHRkYXRhU3RvcmVQcm90by5kZWxldGVEYXRhID0gZnVuY3Rpb24gKG9wdGlvbmFsSWQpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhU3RvcmUuaWQsXG5cdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRmbGFnO1xuXG5cdFx0aWYgKGxpbmtEYXRhKSB7XG5cdFx0XHRsZXQgaSxcblx0XHRcdFx0bGluayA9IGxpbmtEYXRhLmxpbmssXG5cdFx0XHRcdGxlbiA9IGxpbmsubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRsaW5rW2ldLmRlbGV0ZURhdGEoKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBsaW5rU3RvcmVbaWRdO1xuXHRcdH1cblxuXHRcdGRlbGV0ZSBtZXRhU3RvcmFnZVtpZF07XG5cdFx0ZGVsZXRlIG91dHB1dERhdGFTdG9yYWdlW2lkXTtcblxuXHRcdGZsYWcgPSBkZWxldGUgZGF0YVN0b3JhZ2VbaWRdO1xuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdkYXRhRGVsZXRlZCcsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGRhdGFTdG9yZSk7XG5cdFx0cmV0dXJuIGZsYWc7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBpZCBvZiB0aGUgY3VycmVudCBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIG1vZGlmeSBkYXRhXG5cdGRhdGFTdG9yZVByb3RvLm1vZGlmeURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhU3RvcmUuaWQ7XG5cblx0XHRkYXRhU3RvcmFnZVtpZF0gPSBbXTtcblx0XHRkYXRhU3RvcmUuc2V0RGF0YShkYXRhU3BlY3MsIGNhbGxiYWNrLCB0cnVlKTtcblx0XHRcblx0XHRtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnZGF0YU1vZGlmaWVkJywge1xuXHRcdFx0J2lkJzogaWRcblx0XHR9LCBkYXRhU3RvcmUpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIHRvIHRoZSBkYXRhU3RvcmFnZSBhc3luY2hyb25vdXNseSB2aWEgYWpheFxuXHRkYXRhU3RvcmVQcm90by5zZXREYXRhVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcblx0XHRcdGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG5cdFx0XHRkZWxpbWl0ZXIgPSBhcmd1bWVudC5kZWxpbWl0ZXIsXG5cdFx0XHRvdXRwdXRGb3JtYXQgPSBhcmd1bWVudC5vdXRwdXRGb3JtYXQsXG5cdFx0XHRjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuXHRcdFx0Y2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuXHRcdFx0ZGF0YTtcblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5hamF4KHtcblx0XHRcdHVybCA6IGRhdGFTb3VyY2UsXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuXHRcdFx0XHRkYXRhU3RvcmUuc2V0RGF0YSh7XG5cdFx0XHRcdFx0ZGF0YVNvdXJjZSA6IGRhdGEsXG5cdFx0XHRcdFx0ZGF0YVR5cGUgOiBkYXRhVHlwZSxcblx0XHRcdFx0XHRkZWxpbWl0ZXIgOiBkZWxpbWl0ZXIsXG5cdFx0XHRcdFx0b3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHR9LCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXG5cdFx0XHRlcnJvciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSBrZXlzIG9mIHRoZSBKU09OIGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0S2V5cyA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmUuZ2V0SlNPTigpLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGtleXMgPSBkYXRhU3RvcmUua2V5cztcblxuXHRcdGlmIChrZXlzKSB7XG5cdFx0XHRyZXR1cm4ga2V5cztcblx0XHR9XG5cdFx0aWYgKGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gaW50ZXJuYWxEYXRhKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gKGRhdGFTdG9yZS5rZXlzID0gT2JqZWN0LmtleXMoaW50ZXJuYWxEYXRhKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IGFsbCB0aGUgdW5pcXVlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEga2V5XG5cdGRhdGFTdG9yZVByb3RvLmdldFVuaXF1ZVZhbHVlcyA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkYXRhU3RvcmUuZ2V0SlNPTigpLFxuXHRcdFx0aW50ZXJuYWxEYXRhID0gZGF0YVswXSxcblx0XHRcdGlzQXJyYXkgPSBpbnRlcm5hbERhdGEgaW5zdGFuY2VvZiBBcnJheSxcblx0XHRcdHVuaXF1ZVZhbHVlcyA9IGRhdGFTdG9yZS51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHRcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZGF0YVN0b3JlLmdldEtleXMoKS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQudG9VcHBlckNhc2UoKSA9PT0ga2V5LnRvVXBwZXJDYXNlKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpID0gMDtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSBpc0FycmF5ID8gMSA6IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aW50ZXJuYWxEYXRhID0gaXNBcnJheSA/IGRhdGFbaV1ba2V5XSA6IGRhdGFbaV1ba2V5XTtcblx0XHRcdCF0ZW1wVW5pcXVlVmFsdWVzW2ludGVybmFsRGF0YV0gJiYgKHRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSA9IHRydWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoZGF0YVN0b3JlLnVuaXF1ZVZhbHVlc1trZXldID0gT2JqZWN0LmtleXModGVtcFVuaXF1ZVZhbHVlcykpO1xuXHR9O1xuXG5cdC8vRnVuY3Rpb24gdG8gY2hhbmdlIHRoZSBvdXRwdXQgb2YgZ2V0SlNPTigpIGJhc2VkIG9uIHRoZSBkYXRhUHJvY2Vzc29yIGFwcGxpZWRcblx0ZGF0YVN0b3JlUHJvdG8uYXBwbHlEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKGRhdGFQcm9jZXNzb3IpIHtcblx0XHR2YXIgZGF0YVN0b3JlID0gdGhpcyxcblx0XHRcdHByb2Nlc3NvckZuID0gZGF0YVByb2Nlc3Nvci5nZXRQcm9jZXNzb3IoKSxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG91dHB1dCxcblx0XHRcdEpTT05EYXRhID0gZGF0YVN0b3JhZ2VbaWRdO1xuXG5cdFx0aWYgKHR5cGVvZiBwcm9jZXNzb3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0b3V0cHV0ID0gb3V0cHV0RGF0YVN0b3JhZ2VbZGF0YVN0b3JlLmlkXSA9IHtcblx0XHRcdFx0ZGF0YSA6IGV4ZWN1dGVQcm9jZXNzb3IodHlwZSwgcHJvY2Vzc29yRm4sIEpTT05EYXRhKSxcblx0XHRcdFx0cHJvY2Vzc29yIDogZGF0YVByb2Nlc3NvclxuXHRcdFx0fTtcblxuXHRcdFx0ZGVsZXRlIGRhdGFTdG9yZS5rZXlzO1xuXHRcdFx0ZGF0YVN0b3JlLnVuaXF1ZVZhbHVlcyA9IHt9O1xuXG5cdFx0XHRpZiAobGlua1N0b3JlW2lkXSkge1xuXHRcdFx0XHR1cGRhdGFEYXRhKGlkKTtcblx0XHRcdH1cblxuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ3RlbXBFdmVudCcsIHtcblx0XHRcdFx0J2RhdGFTdG9yZSc6IGRhdGFTdG9yZSxcblx0XHRcdFx0J2RhdGFQcm9jZXNzb3InIDogZGF0YVByb2Nlc3NvclxuXHRcdFx0fSwgZGF0YVN0b3JlKTtcblxuXHRcdFx0cmV0dXJuIG91dHB1dC5kYXRhO1xuXHRcdH1cblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgbWV0YWRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uYWRkTWV0YURhdGEgPSBmdW5jdGlvbiAobWV0YURhdGEsIG1lcmdlKSB7XG5cdFx0dmFyIGRhdGFTdG9yZSA9IHRoaXMsXG5cdFx0XHRpZCA9IGRhdGFTdG9yZS5pZCxcblx0XHRcdG5ld01ldGFEYXRhO1xuXHRcdGlmIChtZXJnZSkge1xuXHRcdFx0bmV3TWV0YURhdGEgPSBtZXRhU3RvcmFnZVtpZF0gPSBleHRlbmQyKG1ldGFTdG9yYWdlW2lkXSB8fCB7fSwgbWV0YURhdGEpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdG5ld01ldGFEYXRhID0gbWV0YVN0b3JhZ2VbaWRdID0gbWV0YURhdGE7XG5cdFx0fVxuXHRcdGxpbmtTdG9yZVtpZF0gJiYgdXBkYXRlTWV0YURhdGEoaWQsIG5ld01ldGFEYXRhKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGFkZGVkIG1ldGFEYXRhXG5cdGRhdGFTdG9yZVByb3RvLmdldE1ldGFEYXRhID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBtZXRhU3RvcmFnZVt0aGlzLmlkXTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byByZW1vdmUgZXZlbnQgbGlzdGVuZXIgYXQgZGF0YVN0b3JlIGxldmVsLlxuXHRkYXRhU3RvcmVQcm90by5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG5cdFx0bGliID0gbXVsdGlDaGFydGluZ1Byb3RvLmxpYixcblx0XHRmaWx0ZXJTdG9yZSA9IGxpYi5maWx0ZXJTdG9yZSA9IHt9LFxuXHRcdGZpbHRlckxpbmsgPSBsaWIuZmlsdGVyTGluayA9IHt9LFxuXHRcdGZpbHRlcklkQ291bnQgPSAwLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlLFxuXHRcdHBhcmVudFN0b3JlID0gbGliLnBhcmVudFN0b3JlLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhUHJvY2Vzc29yLlxuXHRcdERhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBcdHZhciBtYW5hZ2VyID0gdGhpcztcblx0ICAgIFx0bWFuYWdlci5hZGRSdWxlKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHRcblx0XHRkYXRhUHJvY2Vzc29yUHJvdG8gPSBEYXRhUHJvY2Vzc29yLnByb3RvdHlwZSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSBkYXRhIG9uIGNoYW5nZSBvZiBmaWx0ZXIuXG5cdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yID0gZnVuY3Rpb24gKGlkLCBjb3B5UGFyZW50VG9DaGlsZCkge1xuXHRcdFx0dmFyIGksXG5cdFx0XHRcdGRhdGEgPSBmaWx0ZXJMaW5rW2lkXSxcblx0XHRcdFx0SlNPTkRhdGEsXG5cdFx0XHRcdGRhdHVtLFxuXHRcdFx0XHRkYXRhSWQsXG5cdFx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICsrKSB7XG5cdFx0XHRcdGRhdHVtID0gZGF0YVtpXTtcblx0XHRcdFx0ZGF0YUlkID0gZGF0dW0uaWQ7XG5cdFx0XHRcdGlmICghbGliLnRlbXBEYXRhVXBkYXRlZFtkYXRhSWRdKSB7XG5cdFx0XHRcdFx0aWYgKHBhcmVudFN0b3JlW2RhdGFJZF0gJiYgZGF0YVN0b3JhZ2VbZGF0YUlkXSkge1xuXHRcdFx0XHRcdFx0SlNPTkRhdGEgPSBwYXJlbnRTdG9yZVtkYXRhSWRdLmdldERhdGEoKTtcblx0XHRcdFx0XHRcdGRhdHVtLm1vZGlmeURhdGEoY29weVBhcmVudFRvQ2hpbGQgPyBKU09ORGF0YSA6IGZpbHRlclN0b3JlW2lkXShKU09ORGF0YSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRlbGV0ZSBwYXJlbnRTdG9yZVtkYXRhSWRdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bGliLnRlbXBEYXRhVXBkYXRlZCA9IHt9O1xuXHRcdH07XG5cblx0bXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRhUHJvY2Vzc29yKGFyZ3VtZW50c1swXSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGZpbHRlciBpbiB0aGUgZmlsdGVyIHN0b3JlXG5cdGRhdGFQcm9jZXNzb3JQcm90by5hZGRSdWxlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXIgPSB0aGlzLFxuXHRcdFx0b2xkSWQgPSBmaWx0ZXIuaWQsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGZpbHRlckZuID0gKGFyZ3VtZW50ICYmIGFyZ3VtZW50LnJ1bGUpIHx8IGFyZ3VtZW50LFxuXHRcdFx0aWQgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlLFxuXHRcdFx0dHlwZSA9IGFyZ3VtZW50ICYmIGFyZ3VtZW50LnR5cGU7XG5cblx0XHRpZCA9IG9sZElkIHx8IGlkIHx8ICdmaWx0ZXJTdG9yZScgKyBmaWx0ZXJJZENvdW50ICsrO1xuXHRcdGZpbHRlclN0b3JlW2lkXSA9IGZpbHRlckZuO1xuXG5cdFx0ZmlsdGVyLmlkID0gaWQ7XG5cdFx0ZmlsdGVyLnR5cGUgPSB0eXBlO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCBhbmQgYWxzbyBvbiB0aGUgY2hpbGQgZGF0YS5cblx0XHRpZiAoZmlsdGVyTGlua1tpZF0pIHtcblx0XHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvcihpZCk7XG5cdFx0fVxuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckFkZGVkJywge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0XHQnZGF0YScgOiBmaWx0ZXJGblxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgdGhlIGZpbHRlciBtZXRob2QuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRQcm9jZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGZpbHRlclN0b3JlW3RoaXMuaWRdO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgSUQgb2YgdGhlIGZpbHRlci5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldElEID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9O1xuXG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmRlbGV0ZVByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ2ZpbHRlckRlbGV0ZWQnLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHR9LCBmaWx0ZXIpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5maWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdmaWx0ZXInXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uc29ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ3NvcnQnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8ubWFwID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnbWFwJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyLFxuICAgICAgICBOVUxMID0gbnVsbCxcbiAgICAgICAgQ09MT1IgPSAnY29sb3InLFxuICAgICAgICBQQUxFVFRFQ09MT1JTID0gJ3BhbGV0dGVDb2xvcnMnO1xuICAgIC8vZnVuY3Rpb24gdG8gY29udmVydCBkYXRhLCBpdCByZXR1cm5zIGZjIHN1cHBvcnRlZCBKU09OXG4gICAgdmFyIERhdGFBZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhYWRhcHRlciA9IHRoaXM7XG5cbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlID0gYXJndW1lbnQuZGF0YXN0b3JlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmRhdGFnZXRKU09OKCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWc7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2s7XG4gICAgICAgIGRhdGFhZGFwdGVyLkZDanNvbiA9IGRhdGFhZGFwdGVyLmNvbnZlcnREYXRhKCk7XG4gICAgfSxcbiAgICBwcm90b0RhdGFhZGFwdGVyID0gRGF0YUFkYXB0ZXIucHJvdG90eXBlO1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5jb252ZXJ0RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLCAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdncmVnYXRlZERhdGEsXG4gICAgICAgICAgICBnZW5lcmFsRGF0YSxcbiAgICAgICAgICAgIGpzb24gPSB7fSxcbiAgICAgICAgICAgIHByZWRlZmluZWRKc29uID0ge30sXG4gICAgICAgICAgICBqc29uRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFKU09OLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjYWxsYmFjayA9IGRhdGFhZGFwdGVyLmNhbGxiYWNrLFxuICAgICAgICAgICAgaXNNZXRhRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiAoZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldE1ldGFEYXRhKCkgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YSA9IGRhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAganNvbiA9IGRhdGFhZGFwdGVyLmpzb25DcmVhdG9yKGFnZ3JlZ2F0ZWREYXRhLCBjb25maWd1cmF0aW9uKTsgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBqc29uID0gKHByZWRlZmluZWRKc29uICYmIGV4dGVuZDIoanNvbixwcmVkZWZpbmVkSnNvbikpIHx8IGpzb247XG4gICAgICAgIGpzb24gPSAoY2FsbGJhY2sgJiYgY2FsbGJhY2soanNvbikpIHx8IGpzb247XG4gICAgICAgIHJldHVybiBpc01ldGFEYXRhID8gZGF0YWFkYXB0ZXIuc2V0RGVmYXVsdEF0dHIoanNvbikgOiBqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldFNvcnRlZERhdGEgPSBmdW5jdGlvbiAoZGF0YSwgY2F0ZWdvcnlBcnIsIGRpbWVuc2lvbiwgYWdncmVnYXRlTW9kZSkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgaW5kZW94T2ZLZXksXG4gICAgICAgICAgICBuZXdEYXRhID0gW10sXG4gICAgICAgICAgICBzdWJTZXREYXRhID0gW10sXG4gICAgICAgICAgICBrZXkgPSBbXSxcbiAgICAgICAgICAgIGNhdGVnb3JpZXMgPSBbXSxcbiAgICAgICAgICAgIGxlbktleSxcbiAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICBsZW5DYXQsXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBhcnIgPSBbXTtcbiAgICAgICAgKCFBcnJheS5pc0FycmF5KGRpbWVuc2lvbikgJiYgKGtleSA9IFtkaW1lbnNpb25dKSkgfHwgKGtleSA9IGRpbWVuc2lvbik7XG4gICAgICAgICghQXJyYXkuaXNBcnJheShjYXRlZ29yeUFyclswXSkgJiYgKGNhdGVnb3JpZXMgPSBbY2F0ZWdvcnlBcnJdKSkgfHwgKGNhdGVnb3JpZXMgPSBjYXRlZ29yeUFycik7XG5cbiAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbMF0pO1xuICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgaW5kZW94T2ZLZXkgPSBkYXRhWzBdLmluZGV4T2Yoa2V5W2tdKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yKGkgPSAwLGxlbkNhdCA9IGNhdGVnb3JpZXNba10ubGVuZ3RoOyBpIDwgbGVuQ2F0ICAmJiBpbmRlb3hPZktleSAhPT0gLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBkYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAoZGF0YVtqXVtpbmRlb3hPZktleV0gPT0gY2F0ZWdvcmllc1trXVtpXSkgJiYgKHN1YlNldERhdGEucHVzaChkYXRhW2pdKSk7XG4gICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgYXJyW2luZGVveE9mS2V5XSA9IGNhdGVnb3JpZXNba11baV07XG4gICAgICAgICAgICAgICAgKHN1YlNldERhdGEubGVuZ3RoID09PSAwKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGFycikpO1xuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVEYXRhKHN1YlNldERhdGEsIGNhdGVnb3JpZXNba11baV0sIGFnZ3JlZ2F0ZU1vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLnNldERlZmF1bHRBdHRyID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9ICcnLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLFxuICAgICAgICAgICAgY29uZiA9IGRhdGFhZGFwdGVyICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZiAmJiBjb25mLm1lYXN1cmUgfHwgW10sXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSxcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbMF1dICYmIG1ldGFEYXRhW21lYXN1cmVbMF1dO1xuICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIChwYWxldHRlQ29sb3JzID0gcGFsZXR0ZUNvbG9ycyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0W1BBTEVUVEVDT0xPUlNdID0gcGFsZXR0ZUNvbG9ycztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSBqc29uLmRhdGFzZXQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlID0gbWV0YURhdGFbbWVhc3VyZVtpXV0gJiYgbWV0YURhdGFbbWVhc3VyZVtpXV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKGpzb24uZGF0YXNldFtpXVtDT0xPUl0gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChtZXRhRGF0YU1lYXN1cmVbQ09MT1JdIGluc3RhbmNlb2YgRnVuY3Rpb24pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIChqc29uLmRhdGFzZXRbaV1bQ09MT1JdID0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciAmJiAoanNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5wbG90W0NPTE9SXSA9IGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzZXJpZXNUeXBlID0gKHNlcmllc1tzZXJpZXNUeXBlXSAmJiBzZXJpZXNUeXBlKSB8fCAnbXMnO1xuXG4gICAgICAgIGpzb24uY2hhcnQgfHwgKGpzb24uY2hhcnQgPSB7fSk7XG4gICAgICAgIFxuICAgICAgICBrZXlFeGNsdWRlZEpzb25TdHIgPSAobWV0YURhdGEgJiYgSlNPTi5zdHJpbmdpZnkoanNvbiwgZnVuY3Rpb24oayx2KXtcbiAgICAgICAgICAgIGlmKGsgPT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBOVUxMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0pKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAganNvbiA9IChrZXlFeGNsdWRlZEpzb25TdHIgJiYgSlNPTi5wYXJzZShrZXlFeGNsdWRlZEpzb25TdHIpKSB8fCBqc29uO1xuXG4gICAgICAgIHNlcmllc1tzZXJpZXNUeXBlXSgpO1xuXG4gICAgICAgIHJldHVybiBqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZURhdGEgPSBmdW5jdGlvbiAoZGF0YSwga2V5LCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBhZ2dyZWdhdGVNZXRob2QgPSB7XG4gICAgICAgICAgICAnc3VtJyA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gZGF0YVswXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDEsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKGRhdGFbaV1bal0gIT0ga2V5KSAmJiAoYWdncmVnYXRlZERhdGFbal0gPSBOdW1iZXIoYWdncmVnYXRlZERhdGFbal0pICsgTnVtYmVyKGRhdGFbaV1bal0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2F2ZXJhZ2UnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlBZ2dyZWdhdGVNdGhkID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgbGVuUiA9IGRhdGEubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkU3VtQXJyID0gaUFnZ3JlZ2F0ZU10aGQuc3VtKCksXG4gICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGFnZ3JlZ2F0ZWRTdW1BcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAoKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0gIT0ga2V5KSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IChOdW1iZXIoYWdncmVnYXRlZFN1bUFycltpXSkpIC8gbGVuUikpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGFnZ3JlZ2F0ZWREYXRhW2ldID0gYWdncmVnYXRlZFN1bUFycltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gYWdncmVnYXRlTW9kZSAmJiBhZ2dyZWdhdGVNb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSAoYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdICYmIGFnZ3JlZ2F0ZU1vZGUpIHx8ICdzdW0nO1xuXG4gICAgICAgIHJldHVybiBhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0oKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZW5lcmFsRGF0YUZvcm1hdCA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShqc29uRGF0YVswXSksXG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIGxlbkdlbmVyYWxEYXRhQXJyYXksXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uIHx8IFtdLFxuICAgICAgICAgICAgbWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZSB8fCBbXTtcbiAgICAgICAgaWYgKCFpc0FycmF5KXtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBbXTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0ucHVzaChkaW1lbnNpb24pO1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IGdlbmVyYWxEYXRhQXJyYXlbMF1bMF0uY29uY2F0KG1lYXN1cmUpO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0ganNvbkRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV0gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5HZW5lcmFsRGF0YUFycmF5ID0gZ2VuZXJhbERhdGFBcnJheVswXS5sZW5ndGg7IGogPCBsZW5HZW5lcmFsRGF0YUFycmF5OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uRGF0YVtpXVtnZW5lcmFsRGF0YUFycmF5WzBdW2pdXTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5W2krMV1bal0gPSB2YWx1ZSB8fCAnJzsgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGpzb25EYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZW5lcmFsRGF0YUFycmF5O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmpzb25DcmVhdG9yID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGNvbmYgPSBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgc2VyaWVzVHlwZSA9IGNvbmYgJiYgY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Nlcmllc25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3NzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0ganNvbkRhdGFbal1baW5kZXhNYXRjaExhYmVsXTsgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGxhYmVsIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3RzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0gPSB7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgIHJldHVybiBjb25mLm1lYXN1cmUgJiYgY29uZi5kaW1lbnNpb24gJiYgc2VyaWVzW3Nlcmllc1R5cGVdKGpzb25EYXRhLCBjb25mKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRGQ2pzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRkNqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERhdGFKc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFKU09OO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFnZ3JlZ2F0ZWREYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERpbWVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmRpbWVuc2lvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRNZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24ubWVhc3VyZTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRMaW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgbWF4ID0gLUluZmluaXR5LFxuICAgICAgICAgICAgbWluID0gK0luZmluaXR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGF0YSA9IGRhdGFhZGFwdGVyLmFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSArZGF0YVtpXVtqXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWF4ID0gbWF4IDwgdmFsdWUgPyB2YWx1ZSA6IG1heCk7XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1pbiA9IG1pbiA+IHZhbHVlID8gdmFsdWUgOiBtaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbWluJyA6IG1pbixcbiAgICAgICAgICAgICdtYXgnIDogbWF4XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBjYXRlZ29yeUxhYmVsID0gYXJndW1lbnRzWzBdICYmIGFyZ3VtZW50c1swXS50b1N0cmluZygpLFxuICAgICAgICAgICAgY2F0ZWdvcnlBcnIgPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLmNhdGVnb3JpZXMsXG4gICAgICAgICAgICBpbmRleCA9IGNhdGVnb3J5TGFiZWwgJiYgY2F0ZWdvcnlBcnIuaW5kZXhPZihjYXRlZ29yeUxhYmVsKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2hhcnQuZHJhd1RyZW5kUmVnaW9uKGluZGV4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuZGF0YUFkYXB0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YUFkYXB0ZXIoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xufSk7IiwiIC8qIGdsb2JhbCBGdXNpb25DaGFydHM6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge307XG5cbiAgICAgICAgICAgIGNoYXJ0LmRhdGFTdG9yZUpzb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERhdGFKc29uKCk7XG4gICAgICAgICAgICBjaGFydC5kaW1lbnNpb24gPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldERpbWVuc2lvbigpO1xuICAgICAgICAgICAgY2hhcnQubWVhc3VyZSA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24uZ2V0TWVhc3VyZSgpO1xuICAgICAgICAgICAgY2hhcnQuYWdncmVnYXRlZERhdGEgPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldEFnZ3JlZ2F0ZWREYXRhKCk7XG4gICAgICAgICAgICBjaGFydC5yZW5kZXIoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnRQcm90byA9IENoYXJ0LnByb3RvdHlwZSxcbiAgICAgICAgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyLFxuICAgICAgICBnZXRSb3dEYXRhID0gZnVuY3Rpb24oZGF0YSwgYWdncmVnYXRlZERhdGEsIGRpbWVuc2lvbiwgbWVhc3VyZSwga2V5KSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICAgICAgayxcbiAgICAgICAgICAgICAgICBrayxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSksXG4gICAgICAgICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICAgICAgICBtYXRjaE9iaiA9IHt9LFxuICAgICAgICAgICAgICAgIGluZGV4T2ZEaW1lbnNpb24gPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKGRpbWVuc2lvblswXSk7XG4gICAgICAgIFxuICAgICAgICAgICAgZm9yKGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgIGlzQXJyYXkgJiYgKGluZGV4ID0gZGF0YVtpXS5pbmRleE9mKGtleSkpO1xuICAgICAgICAgICAgICAgIGlmKGluZGV4ICE9PSAtMSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBsIDwgbGVuQzsgbCsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW2RhdGFbMF1bbF1dID0gZGF0YVtpXVtsXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKCFpc0FycmF5ICYmIGRhdGFbaV1bZGltZW5zaW9uWzBdXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmogPSBkYXRhW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKG1lYXN1cmVbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWdncmVnYXRlZERhdGFba11baW5kZXhPZkRpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW21lYXN1cmVbal1dID0gYWdncmVnYXRlZERhdGFba11baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgY2hhcnRQcm90by5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgICAgICAvL2dldCBmYyBzdXBwb3J0ZWQganNvbiAgICAgICAgICAgIFxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTsgICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnQuY2hhcnRPYmogPSBuZXcgRnVzaW9uQ2hhcnRzKGNoYXJ0LmNoYXJ0Q29uZmlnKTtcbiAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG5cbiAgICAgICAgZGF0YUFkYXB0ZXJPYmouY2hhcnQgPSBjaGFydC5jaGFydE9iajtcbiAgICAgICAgXG4gICAgICAgIGNoYXJ0LmNoYXJ0T2JqLmFkZEV2ZW50TGlzdGVuZXIoJ2RhdGFwbG90cm9sbG92ZXInLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgdmFyIGRhdGFPYmogPSBnZXRSb3dEYXRhKGNoYXJ0LmRhdGFTdG9yZUpzb24sIGNoYXJ0LmFnZ3JlZ2F0ZWREYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFydC5kaW1lbnNpb24sIGNoYXJ0Lm1lYXN1cmUsIGQuY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgICAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5yYWlzZUV2ZW50KCdob3ZlcmluJywge1xuICAgICAgICAgICAgICAgIGRhdGEgOiBkYXRhT2JqLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgOiBkLmNhdGVnb3J5TGFiZWxcbiAgICAgICAgICAgIH0sIGNoYXJ0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID1hcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaixcbiAgICAgICAgICAgIGNoYXJ0Q29uZmlnID0ge30sXG4gICAgICAgICAgICBkYXRhU291cmNlID0ge307XG4gICAgICAgIC8vcGFyc2UgYXJndW1lbnQgaW50byBjaGFydENvbmZpZyBcbiAgICAgICAgZXh0ZW5kMihjaGFydENvbmZpZyxhcmd1bWVudCk7XG4gICAgICAgIFxuICAgICAgICAvL2RhdGFBZGFwdGVyT2JqIFxuICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge307XG5cbiAgICAgICAgLy9zdG9yZSBmYyBzdXBwb3J0ZWQganNvbiB0byByZW5kZXIgY2hhcnRzXG4gICAgICAgIGRhdGFTb3VyY2UgPSBkYXRhQWRhcHRlck9iai5nZXRGQ2pzb24oKTtcblxuICAgICAgICAvL2RlbGV0ZSBkYXRhIGNvbmZpZ3VyYXRpb24gcGFydHMgZm9yIEZDIGpzb24gY29udmVydGVyXG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy9zZXQgZGF0YSBzb3VyY2UgaW50byBjaGFydCBjb25maWd1cmF0aW9uXG4gICAgICAgIGNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICBjaGFydC5jaGFydENvbmZpZyA9IGNoYXJ0Q29uZmlnOyAgICAgICAgXG4gICAgfTtcblxuICAgIGNoYXJ0UHJvdG8udXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICAgICAgY2hhcnQuZ2V0SlNPTihhcmd1bWVudCk7XG4gICAgICAgIGlmKGNoYXJ0LmNoYXJ0T2JqLmNoYXJ0VHlwZSgpID09ICdheGlzJykge1xuICAgICAgICAgICAgY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgLy9yZW5kZXIgRkMgXG4gICAgICAgICAgICBjaGFydC5jaGFydE9iaiA9IG5ldyBGdXNpb25DaGFydHMoY2hhcnQuY2hhcnRDb25maWcpO1xuICAgICAgICAgICAgY2hhcnQuY2hhcnRPYmoucmVuZGVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5jaGFydFR5cGUoY2hhcnQuY2hhcnRDb25maWcudHlwZSk7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5zZXRKU09ORGF0YShjaGFydC5jaGFydENvbmZpZy5kYXRhU291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhQWRhcHRlck9iai5jaGFydCA9IGNoYXJ0LmNoYXJ0T2JqO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFydChhcmd1bWVudHNbMF0pO1xuICAgIH07XG59KTsiLCJcblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBjcmVhdGVDaGFydCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0LFxuICAgICAgICBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICAgICAgUFggPSAncHgnLFxuICAgICAgICBESVYgPSAnZGl2JyxcbiAgICAgICAgRU1QVFlfU1RSSU5HID0gJycsXG4gICAgICAgIEFCU09MVVRFID0gJ2Fic29sdXRlJyxcbiAgICAgICAgTUFYX1BFUkNFTlQgPSAnMTAwJScsXG4gICAgICAgIFJFTEFUSVZFID0gJ3JlbGF0aXZlJyxcbiAgICAgICAgSUQgPSAnaWQtZmMtbWMtJyxcbiAgICAgICAgQk9SREVSX0JPWCA9ICdib3JkZXItYm94JztcblxuICAgIHZhciBDZWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzO1xuICAgICAgICAgICAgY2VsbC5jb250YWluZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGNlbGwuZHJhdygpO1xuICAgICAgICAgICAgY2VsbC5jb25maWcuY2hhcnQgJiYgY2VsbC5yZW5kZXJDaGFydCgpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b0NlbGwgPSBDZWxsLnByb3RvdHlwZTtcblxuICAgIHByb3RvQ2VsbC5kcmF3ID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgY2VsbC5ncmFwaGljcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoRElWKTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuYm94U2l6aW5nID0gQk9SREVSX0JPWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaW5uZXJIVE1MID0gY2VsbC5jb25maWcuaHRtbCB8fCBFTVBUWV9TVFJJTkc7XG4gICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwucmVuZGVyQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpczsgXG5cbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQucmVuZGVyQXQgPSBjZWxsLmNvbmZpZy5pZDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQud2lkdGggPSBNQVhfUEVSQ0VOVDtcbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQuaGVpZ2h0ID0gTUFYX1BFUkNFTlQ7XG4gICAgICBcbiAgICAgICAgaWYoY2VsbC5jaGFydCkge1xuICAgICAgICAgICAgY2VsbC5jaGFydC51cGRhdGUoY2VsbC5jb25maWcuY2hhcnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbC5jaGFydCA9IGNyZWF0ZUNoYXJ0KGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2VsbC5jaGFydDtcbiAgICB9O1xuXG4gICAgcHJvdG9DZWxsLnVwZGF0ZSA9IGZ1bmN0aW9uIChuZXdDb25maWcpIHtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzLFxuICAgICAgICAgICAgaWQgPSBjZWxsLmNvbmZpZy5pZDtcblxuICAgICAgICBpZihuZXdDb25maWcpe1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBuZXdDb25maWc7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5pZCA9IGlkO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnRvcCA9IGNlbGwuY29uZmlnLnRvcCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICAgICAgIWNlbGwuY29uZmlnLmNoYXJ0ICYmIChjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgICAgICAgICAgaWYoY2VsbC5jb25maWcuY2hhcnQpIHtcbiAgICAgICAgICAgICAgICBjZWxsLmNoYXJ0ID0gY2VsbC5yZW5kZXJDaGFydCgpOyAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGwuY2hhcnQ7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9ICBcbiAgICAgICAgcmV0dXJuIGNlbGw7ICAgICAgXG4gICAgfTtcblxuICAgIHZhciBNYXRyaXggPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBtYXRyaXggPSB0aGlzO1xuICAgICAgICAgICAgbWF0cml4LnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAvL21hdHJpeCBjb250YWluZXJcbiAgICAgICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3Rvcik7XG4gICAgICAgICAgICBtYXRyaXguY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdEggPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdFcgPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBbXTtcbiAgICAgICAgICAgIC8vZGlzcG9zZSBtYXRyaXggY29udGV4dFxuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIC8vc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXIgXG4gICAgICAgICAgICBtYXRyaXguc2V0QXR0ckNvbnRhaW5lcigpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGUsXG4gICAgICAgIGNoYXJ0SWQgPSAwO1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4LnNldEF0dHJDb250YWluZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcjsgICAgICAgIFxuICAgICAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSBSRUxBVElWRTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0Q29udGFpbmVyUmVzb2x1dGlvbiA9IGZ1bmN0aW9uIChoZWlnaHRBcnIsIHdpZHRoQXJyKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBoZWlnaHQgPSAwLFxuICAgICAgICAgICAgd2lkdGggPSAwLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBoZWlnaHRBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBoZWlnaHRBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHdpZHRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB3aWR0aCArPSB3aWR0aEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBQWDtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyBQWDtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBkcmF3IG1hdHJpeFxuICAgIHByb3RvTWF0cml4LmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhbEJveCA9IFtdO1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXggJiYgbWF0cml4LmNvbmZpZ3VyYXRpb24gfHwge30sXG4gICAgICAgICAgICAvL3N0b3JlIHZpcnR1YWwgbWF0cml4IGZvciB1c2VyIGdpdmVuIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBsZW4gPSBjb25maWdNYW5hZ2VyICYmIGNvbmZpZ01hbmFnZXIubGVuZ3RoLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBbXSxcbiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgY2FsbEJhY2sgPSBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgLy9zdG9yZSBjZWxsIG9iamVjdCBpbiBsb2dpY2FsIG1hdHJpeCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBwbGFjZUhvbGRlcjtcbiAgICAgICAgY2FsbEJhY2sgJiYgY2FsbEJhY2soKTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBtYW5hZ2UgbWF0cml4IGRyYXdcbiAgICBwcm90b01hdHJpeC5kcmF3TWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIC8vc3RvcmUgbWFwcGluZyBtYXRyaXggYmFzZWQgb24gdGhlIHVzZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgc2hhZG93TWF0cml4ID0gbWF0cml4Lm1hdHJpeE1hbmFnZXIoY29uZmlndXJhdGlvbiksICAgICAgICAgICAgXG4gICAgICAgICAgICBoZWlnaHRBcnIgPSBtYXRyaXguZ2V0Um93SGVpZ2h0KHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICB3aWR0aEFyciA9IG1hdHJpeC5nZXRDb2xXaWR0aChzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnIgPSBbXSxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICBtYXRyaXhQb3NYID0gbWF0cml4LmdldFBvcyh3aWR0aEFyciksXG4gICAgICAgICAgICBtYXRyaXhQb3NZID0gbWF0cml4LmdldFBvcyhoZWlnaHRBcnIpLFxuICAgICAgICAgICAgcm93c3BhbixcbiAgICAgICAgICAgIGNvbHNwYW4sXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGNoYXJ0LFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIGNvbDtcbiAgICAgICAgLy9jYWxjdWxhdGUgYW5kIHNldCBwbGFjZWhvbGRlciBpbiBzaGFkb3cgbWF0cml4XG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXguc2V0UGxjSGxkcihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICAgICAgbWF0cml4LnNldENvbnRhaW5lclJlc29sdXRpb24oaGVpZ2h0QXJyLCB3aWR0aEFycik7XG4gICAgICAgIC8vY2FsY3VsYXRlIGNlbGwgcG9zaXRpb24gYW5kIGhlaWh0IGFuZCBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICBcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldID0gW107ICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuIHx8IDEpO1xuICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbiB8fCAxKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2hhcnQ7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5odG1sO1xuICAgICAgICAgICAgICAgIHJvdyA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0ucm93KTtcbiAgICAgICAgICAgICAgICBjb2wgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLmNvbCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG1hdHJpeFBvc1hbY29sXTtcbiAgICAgICAgICAgICAgICB0b3AgPSBtYXRyaXhQb3NZW3Jvd107XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYW2NvbCArIGNvbHNwYW5dIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXRyaXhQb3NZW3JvdyArIHJvd3NwYW5dIC0gdG9wO1xuICAgICAgICAgICAgICAgIGlkID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5pZCkgfHwgbWF0cml4LmlkQ3JlYXRvcihyb3csY29sKTtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICA6IGxlZnQsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgICA6IGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICAgIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgICAgIDogaWQsXG4gICAgICAgICAgICAgICAgICAgIHJvd3NwYW4gICA6IHJvd3NwYW4sXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gICA6IGNvbHNwYW4sXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgICAgICA6IGh0bWwsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0ICAgICA6IGNoYXJ0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhd01hbmFnZXJPYmpBcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmlkQ3JlYXRvciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNoYXJ0SWQrKzsgICAgICAgXG4gICAgICAgIHJldHVybiBJRCArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFBvcyA9ICBmdW5jdGlvbihzcmMpe1xuICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHNyYyAmJiBzcmMubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPD0gbGVuOyBpKyspe1xuICAgICAgICAgICAgYXJyLnB1c2goaSA/IChzcmNbaS0xXSthcnJbaS0xXSkgOiAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnNldFBsY0hsZHIgPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pe1xuICAgICAgICB2YXIgcm93LFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQztcblxuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBzaGFkb3dNYXRyaXgubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXsgXG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICByb3cgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgICAgICBjb2wgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVsxXTtcblxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9PT0gdW5kZWZpbmVkID8gaSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3c7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID09PSB1bmRlZmluZWQgPyBqIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Um93SGVpZ2h0ID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgaGVpZ2h0ID0gW10sXG4gICAgICAgICAgICBjdXJySGVpZ2h0LFxuICAgICAgICAgICAgbWF4SGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykge1xuICAgICAgICAgICAgZm9yKGogPSAwLCBtYXhIZWlnaHQgPSAwLCBsZW5Db2wgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQ29sOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihzaGFkb3dNYXRyaXhbaV1bal0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyckhlaWdodCA9IHNoYWRvd01hdHJpeFtpXVtqXS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCA8IGN1cnJIZWlnaHQgPyBjdXJySGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhlaWdodFtpXSA9IG1heEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldENvbFdpZHRoID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICB3aWR0aCA9IFtdLFxuICAgICAgICAgICAgY3VycldpZHRoLFxuICAgICAgICAgICAgbWF4V2lkdGg7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtqXS5sZW5ndGg7IGkgPCBsZW5Db2w7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heFdpZHRoID0gMDsgaiA8IGxlblJvdzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYWRvd01hdHJpeFtqXVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBzaGFkb3dNYXRyaXhbal1baV0ud2lkdGg7ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSBtYXhXaWR0aCA8IGN1cnJXaWR0aCA/IGN1cnJXaWR0aCA6IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpZHRoW2ldID0gbWF4V2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Lm1hdHJpeE1hbmFnZXIgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIHJvd1NwYW4sXG4gICAgICAgICAgICBjb2xTcGFuLFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBkZWZhdWx0SCA9IG1hdHJpeC5kZWZhdWx0SCxcbiAgICAgICAgICAgIGRlZmF1bHRXID0gbWF0cml4LmRlZmF1bHRXLFxuICAgICAgICAgICAgb2Zmc2V0O1xuICAgICAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByb3dTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuKSB8fCAxO1xuICAgICAgICAgICAgICAgIGNvbFNwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNvbHNwYW4pIHx8IDE7ICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2lkdGggPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLndpZHRoKTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICh3aWR0aCAmJiAod2lkdGggLyBjb2xTcGFuKSkgfHwgZGVmYXVsdFc7XG4gICAgICAgICAgICAgICAgd2lkdGggPSArd2lkdGgudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGhlaWdodCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoaGVpZ2h0ICYmIChoZWlnaHQgLyByb3dTcGFuKSkgfHwgZGVmYXVsdEg7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICtoZWlnaHQudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIG9mZnNldCA9IDA7IGsgPCByb3dTcGFuOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsID0gMDsgbCA8IGNvbFNwYW47IGwrKykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdID0gc2hhZG93TWF0cml4W2kgKyBrXSA/IHNoYWRvd01hdHJpeFtpICsga10gOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IGogKyBsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZShzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkIDogKGkgKyAnLScgKyBqKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaGFkb3dNYXRyaXg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldEJsb2NrICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SID0gcGxhY2VIb2xkZXIubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQztcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwbGFjZUhvbGRlcltpXVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4LmRyYXdNYW5hZ2VyKGNvbmZpZ3VyYXRpb24pLFxuICAgICAgICAgICAgbGVuQ29uZmlnUixcbiAgICAgICAgICAgIGxlbkNvbmZpZ0MsXG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJSLFxuICAgICAgICAgICAgbGVuUGxhY2VIbGRyQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsICAgICAgICAgICAgXG4gICAgICAgICAgICByZWN5Y2xlZENlbGw7XG5cbiAgICAgICAgd2hpbGUoY29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNvbnRhaW5lci5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGVuUGxhY2VIbGRyUiA9IHBsYWNlSG9sZGVyLmxlbmd0aDtcblxuICAgICAgICBmb3IoaSA9IGxlblBsYWNlSGxkclIgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgbGVuUGxhY2VIbGRyQyA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihqID0gbGVuUGxhY2VIbGRyQyAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgaWYocGxhY2VIb2xkZXJbaV1bal0uY2hhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2FsQm94ID0gbWF0cml4LmRpc3Bvc2FsQm94LmNvbmNhdChwbGFjZUhvbGRlcltpXS5wb3AoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHBsYWNlSG9sZGVyW2ldW2pdO1xuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXS5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwbGFjZUhvbGRlci5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuQ29uZmlnUiA9IGNvbmZpZ01hbmFnZXIubGVuZ3RoOyBpIDwgbGVuQ29uZmlnUjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5Db25maWdDID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5Db25maWdDOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihjb25maWdNYW5hZ2VyW2ldW2pdLmNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY3ljbGVkQ2VsbCA9IG1hdHJpeC5kaXNwb3NhbEJveC5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVjeWNsZWRDZWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IHJlY3ljbGVkQ2VsbC51cGRhdGUoY29uZmlnTWFuYWdlcltpXVtqXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgbm9kZSAgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGxlblI7XG4gICAgICAgIGZvcihpID0gMCwgbGVuUiA9IHBsYWNlSG9sZGVyICYmIHBsYWNlSG9sZGVyLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQyA9IHBsYWNlSG9sZGVyW2ldICYmIHBsYWNlSG9sZGVyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0ICYmIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqICYmIFxuICAgICAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jaGFydC5jaGFydE9iai5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG5vZGUuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9ICcwcHgnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gJzBweCc7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZU1hdHJpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgoYXJndW1lbnRzWzBdLGFyZ3VtZW50c1sxXSk7XG4gICAgfTtcbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG4gICAgXG4gICAgLyogZ2xvYmFsIEZ1c2lvbkNoYXJ0czogdHJ1ZSAqL1xuICAgIHZhciBnbG9iYWwgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcbiAgICAgICAgd2luID0gZ2xvYmFsLndpbixcblxuICAgICAgICBvYmplY3RQcm90b1RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgYXJyYXlUb1N0cmluZ0lkZW50aWZpZXIgPSBvYmplY3RQcm90b1RvU3RyaW5nLmNhbGwoW10pLFxuICAgICAgICBpc0FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChvYmopID09PSBhcnJheVRvU3RyaW5nSWRlbnRpZmllcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBBIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbiBhYnN0cmFjdGlvbiBsYXllciBzbyB0aGF0IHRoZSB0cnktY2F0Y2ggL1xuICAgICAgICAvLyBlcnJvciBzdXBwcmVzc2lvbiBvZiBmbGFzaCBjYW4gYmUgYXZvaWRlZCB3aGlsZSByYWlzaW5nIGV2ZW50cy5cbiAgICAgICAgbWFuYWdlZEZuQ2FsbCA9IGZ1bmN0aW9uIChpdGVtLCBzY29wZSwgZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIFdlIGNoYW5nZSB0aGUgc2NvcGUgb2YgdGhlIGZ1bmN0aW9uIHdpdGggcmVzcGVjdCB0byB0aGVcbiAgICAgICAgICAgIC8vIG9iamVjdCB0aGF0IHJhaXNlZCB0aGUgZXZlbnQuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGl0ZW1bMF0uY2FsbChzY29wZSwgZXZlbnQsIGFyZ3MgfHwge30pO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgLy8gb2YgY2hhcnQgbG9hZC5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyBGdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIGFsbCBmdW5jdGlvbnMgdGhhdCBhcmUgdG8gYmUgaW52b2tlZCB1cG9uIHRyaWdnZXJcbiAgICAgICAgLy8gb2YgYW4gZXZlbnQuXG4gICAgICAgIHNsb3RMb2FkZXIgPSBmdW5jdGlvbiAoc2xvdCwgZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgIC8vIHdhcyBuZXZlciBhZGRlZCBhbmQgaGFsdCBtZXRob2QuXG4gICAgICAgICAgICBpZiAoIShzbG90IGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2YXJpYWJsZXMuXG4gICAgICAgICAgICB2YXIgaSA9IDAsIHNjb3BlO1xuXG4gICAgICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIHNsb3QgYW5kIGxvb2sgZm9yIG1hdGNoIHdpdGggcmVzcGVjdCB0b1xuICAgICAgICAgICAgLy8gdHlwZSBhbmQgYmluZGluZy5cbiAgICAgICAgICAgIGZvciAoOyBpIDwgc2xvdC5sZW5ndGg7IGkgKz0gMSkge1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBtYXRjaCBmb3VuZCB3LnIudC4gdHlwZSBhbmQgYmluZCwgd2UgZmlyZSBpdC5cbiAgICAgICAgICAgICAgICBpZiAoc2xvdFtpXVsxXSA9PT0gZXZlbnQuc2VuZGVyIHx8IHNsb3RbaV1bMV0gPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVybWluZSB0aGUgc2VuZGVyIG9mIHRoZSBldmVudCBmb3IgZ2xvYmFsIGV2ZW50cy5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNob2ljZSBvZiBzY29wZSBkaWZmZXJlcyBkZXBlbmRpbmcgb24gd2hldGhlciBhXG4gICAgICAgICAgICAgICAgICAgIC8vIGdsb2JhbCBvciBhIGxvY2FsIGV2ZW50IGlzIGJlaW5nIHJhaXNlZC5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUgPSBzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgP1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuc2VuZGVyIDogZ2xvYmFsO1xuXG4gICAgICAgICAgICAgICAgICAgIG1hbmFnZWRGbkNhbGwoc2xvdFtpXSwgc2NvcGUsIGV2ZW50LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgdXNlciB3YW50ZWQgdG8gZGV0YWNoIHRoZSBldmVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGV0YWNoZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuZGV0YWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgcHJvcGFnYXRpb24gZmxhZyBpcyBzZXQgdG8gZmFsc2UgYW5kIGRpc2NvbnRudWVcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaWYgbmVlZGVkLlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5jYW5jZWxsZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV2ZW50TWFwID0ge1xuICAgICAgICAgICAgaG92ZXJpbiA6ICdkYXRhcGxvdHJvbGxvdmVyJyxcbiAgICAgICAgICAgIGhvdmVyb3V0IDogJ2RhdGFwbG90cm9sbG91dCcsXG4gICAgICAgICAgICBjbGlrIDogJ2RhdGFwbG90Y2xpY2snXG4gICAgICAgIH0sXG4gICAgICAgIHJhaXNlRXZlbnQsXG5cbiAgICAgICAgRXZlbnRUYXJnZXQgPSB7XG5cbiAgICAgICAgICAgIHVucHJvcGFnYXRvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5jYW5jZWxsZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGV0YWNoZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuZGV0YWNoZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5kZWZhdWx0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMucHJldmVudGVkID0gdHJ1ZSkgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRW50aXJlIGNvbGxlY3Rpb24gb2YgbGlzdGVuZXJzLlxuICAgICAgICAgICAgbGlzdGVuZXJzOiB7fSxcblxuICAgICAgICAgICAgLy8gVGhlIGxhc3QgcmFpc2VkIGV2ZW50IGlkLiBBbGxvd3MgdG8gY2FsY3VsYXRlIHRoZSBuZXh0IGV2ZW50IGlkLlxuICAgICAgICAgICAgbGFzdEV2ZW50SWQ6IDAsXG5cbiAgICAgICAgICAgIGFkZExpc3RlbmVyOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciByZWN1cnNlUmV0dXJuLFxuICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgaTtcbiAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHR5cGUgaXMgc2VudCBhcyBhcnJheSwgd2UgcmVjdXJzZSB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY3Vyc2VSZXR1cm4gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgbG9vayBpbnRvIGVhY2ggaXRlbSBvZiB0aGUgJ3R5cGUnIHBhcmFtZXRlciBhbmQgc2VuZCBpdCxcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxvbmcgd2l0aCBvdGhlciBwYXJhbWV0ZXJzIHRvIGEgcmVjdXJzZWQgYWRkTGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybi5wdXNoKEV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2VSZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgYWRkZWQgd2l0aG91dFxuICAgICAgICAgICAgICAgIC8vIHZhbGlkIHR5cGUuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgaGFzIG5vdCBiZWVuIHByb3ZpZGVkIHdoaWxlIGFkZGluZyBhbiBldmVudCBsaXN0ZW5lci4gRW5zdXJlIHRoYXQgeW91IHBhc3MgYVxuICAgICAgICAgICAgICAgICAgICAgKiBgc3RyaW5nYCB0byB0aGUgZmlyc3QgcGFyYW1ldGVyIG9mIHtAbGluayBGdXNpb25DaGFydHMuYWRkRXZlbnRMaXN0ZW5lcn0uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTQ5XG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTQ5JywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdVbnNwZWNpZmllZCBFdmVudCBUeXBlJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLiBJdCB3aWxsIG5vdCBldmFsIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBsaXN0ZW5lciBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU1MFxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU1MCcsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignSW52YWxpZCBFdmVudCBMaXN0ZW5lcicpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERlc2Vuc2l0aXplIHRoZSB0eXBlIGNhc2UgZm9yIHVzZXIgYWNjZXNzYWJpbGl0eS5cbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGluc2VydGlvbiBwb3NpdGlvbiBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHRoZW4gY3JlYXRlIG9uZS5cbiAgICAgICAgICAgICAgICBpZiAoIShFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdID0gW107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lciB0byB0aGUgcXVldWUuXG4gICAgICAgICAgICAgICAgRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLnB1c2goW2xpc3RlbmVyLCBiaW5kXSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFdmVudHMgb2YgZnVzaW9uQ2hhcnQgcmFpc2VkIHZpYSBNdWx0aUNoYXJ0aW5nLlxuICAgICAgICAgICAgICAgIGlmIChGQ0V2ZW50VHlwZSA9IGV2ZW50TWFwW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyKEZDRXZlbnRUeXBlLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFpc2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRkNFdmVudE9iaiA6IGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRkNEYXRhT2JqIDogZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgTXVsdGlDaGFydGluZyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcblxuICAgICAgICAgICAgICAgIHZhciBzbG90LFxuICAgICAgICAgICAgICAgICAgICBpO1xuXG4gICAgICAgICAgICAgICAgLy8gTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLiBFbHNlIHdlIGhhdmUgbm90aGluZyB0byByZW1vdmUhXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqIE90aGVyd2lzZSwgdGhlIGV2ZW50IGxpc3RlbmVyIGZ1bmN0aW9uIGhhcyBubyB3YXkgdG8ga25vdyB3aGljaCBmdW5jdGlvbiBpcyB0byBiZSByZW1vdmVkLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTU2MFxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3IoYmluZCB8fCBnbG9iYWwsICcwMzA5MTU2MCcsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignSW52YWxpZCBFdmVudCBMaXN0ZW5lcicpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcih0eXBlW2ldLCBsaXN0ZW5lciwgYmluZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRoZSB0eXBlIHBhcmFtZXRlci4gTGlzdGVuZXIgY2Fubm90IGJlIHJlbW92ZWQgd2l0aG91dFxuICAgICAgICAgICAgICAgIC8vIHZhbGlkIHR5cGUuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTU5XG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTU5JywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdVbnNwZWNpZmllZCBFdmVudCBUeXBlJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSByZWZlcmVuY2UgdG8gdGhlIHNsb3QgZm9yIGVhc3kgbG9va3VwIGluIHRoaXMgbWV0aG9kLlxuICAgICAgICAgICAgICAgIHNsb3QgPSBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiBzbG90IGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgd2UgYXNzdW1lIHRoYXQgdGhlIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgICAgICBpZiAoIShzbG90IGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIHNsb3QgYW5kIHJlbW92ZSBldmVyeSBpbnN0YW5jZSBvZiB0aGVcbiAgICAgICAgICAgICAgICAvLyBldmVudCBoYW5kbGVyLlxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgaW5zdGFuY2VzIG9mIHRoZSBsaXN0ZW5lciBmb3VuZCBpbiB0aGUgcXVldWUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzBdID09PSBsaXN0ZW5lciAmJiBzbG90W2ldWzFdID09PSBiaW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIG9wdHMgY2FuIGhhdmUgeyBhc3luYzp0cnVlLCBvbW5pOnRydWUgfVxuICAgICAgICAgICAgdHJpZ2dlckV2ZW50OiBmdW5jdGlvbiAodHlwZSwgc2VuZGVyLCBhcmdzLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbEZuKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJbiBjYXNlLCBldmVudCB0eXBlIGlzIG1pc3NpbmcsIGRpc3BhdGNoIGNhbm5vdCBwcm9jZWVkLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRoZSBldmVudCBuYW1lIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLnJlbW92ZUV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAdHlwZWRlZiB7UGFyYW1ldGVyRXhjZXB0aW9ufSBFcnJvci0wMzA5MTYwMlxuICAgICAgICAgICAgICAgICAgICAgKiBAbWVtYmVyT2YgRnVzaW9uQ2hhcnRzLmRlYnVnZ2VyXG4gICAgICAgICAgICAgICAgICAgICAqIEBncm91cCBkZWJ1Z2dlci1lcnJvclxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnJhaXNlRXJyb3Ioc2VuZGVyLCAnMDMwOTE2MDInLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5kaXNwYXRjaEV2ZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignSW52YWxpZCBFdmVudCBUeXBlJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIERlc2Vuc2l0aXplIHRoZSB0eXBlIGNhc2UgZm9yIHVzZXIgYWNjZXNzYWJpbGl0eS5cbiAgICAgICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gTW9kZWwgdGhlIGV2ZW50IGFzIHBlciBXM0Mgc3RhbmRhcmRzLiBBZGQgdGhlIGZ1bmN0aW9uIHRvIGNhbmNlbFxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IHByb3BhZ2F0aW9uIGJ5IHVzZXIgaGFuZGxlcnMuIEFsc28gYXBwZW5kIGFuIGluY3JlbWVudGFsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgaWQuXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50T2JqZWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICBldmVudFR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SWQ6IChFdmVudFRhcmdldC5sYXN0RXZlbnRJZCArPSAxKSxcbiAgICAgICAgICAgICAgICAgICAgc2VuZGVyOiBzZW5kZXIgfHwgbmV3IEVycm9yKCdPcnBoYW4gRXZlbnQnKSxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsbGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgc3RvcFByb3BhZ2F0aW9uOiB0aGlzLnVucHJvcGFnYXRvcixcbiAgICAgICAgICAgICAgICAgICAgcHJldmVudGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcHJldmVudERlZmF1bHQ6IHRoaXMudW5kZWZhdWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGRldGFjaGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoSGFuZGxlcjogdGhpcy5kZXRhY2hlclxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBFdmVudCBsaXN0ZW5lcnMgYXJlIHVzZWQgdG8gdGFwIGludG8gZGlmZmVyZW50IHN0YWdlcyBvZiBjcmVhdGluZywgdXBkYXRpbmcsIHJlbmRlcmluZyBvciByZW1vdmluZ1xuICAgICAgICAgICAgICAgICAqIGNoYXJ0cy4gQSBGdXNpb25DaGFydHMgaW5zdGFuY2UgZmlyZXMgc3BlY2lmaWMgZXZlbnRzIGJhc2VkIG9uIHdoYXQgc3RhZ2UgaXQgaXMgaW4uIEZvciBleGFtcGxlLCB0aGVcbiAgICAgICAgICAgICAgICAgKiBgcmVuZGVyQ29tcGxldGVgIGV2ZW50IGlzIGZpcmVkIGVhY2ggdGltZSBhIGNoYXJ0IGhhcyBmaW5pc2hlZCByZW5kZXJpbmcuIFlvdSBjYW4gbGlzdGVuIHRvIGFueSBzdWNoXG4gICAgICAgICAgICAgICAgICogZXZlbnQgdXNpbmcge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfSBvciB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGFuZCBiaW5kXG4gICAgICAgICAgICAgICAgICogeW91ciBvd24gZnVuY3Rpb25zIHRvIHRoYXQgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGtub3duIGFzIFwibGlzdGVuZXJzXCIgYW5kIGFyZSBwYXNzZWQgb24gdG8gdGhlIHNlY29uZCBhcmd1bWVudCAoYGxpc3RlbmVyYCkgb2YgdGhlXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfSBhbmQge0BsaW5rIEZ1c2lvbkNoYXJ0cyNhZGRFdmVudExpc3RlbmVyfSBmdW5jdGlvbnMuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAY2FsbGJhY2sgRnVzaW9uQ2hhcnRzfmV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICogQHNlZSBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50T2JqZWN0IC0gVGhlIGZpcnN0IHBhcmFtZXRlciBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIGlzIGFuIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICAgICAqIHRoYXQgY29udGFpbnMgYWxsIGluZm9ybWF0aW9uIHBlcnRhaW5pbmcgdG8gYSBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50T2JqZWN0LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZXZlbnRPYmplY3QuZXZlbnRJZCAtIEEgdW5pcXVlIElEIGFzc29jaWF0ZWQgd2l0aCB0aGUgZXZlbnQuIEludGVybmFsbHkgaXQgaXMgYW5cbiAgICAgICAgICAgICAgICAgKiBpbmNyZW1lbnRpbmcgY291bnRlciBhbmQgYXMgc3VjaCBjYW4gYmUgaW5kaXJlY3RseSB1c2VkIHRvIHZlcmlmeSB0aGUgb3JkZXIgaW4gd2hpY2ggIHRoZSBldmVudCB3YXNcbiAgICAgICAgICAgICAgICAgKiBmaXJlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7RnVzaW9uQ2hhcnRzfSBldmVudE9iamVjdC5zZW5kZXIgLSBUaGUgaW5zdGFuY2Ugb2YgRnVzaW9uQ2hhcnRzIG9iamVjdCB0aGF0IGZpcmVkIHRoaXMgZXZlbnQuXG4gICAgICAgICAgICAgICAgICogT2NjYXNzaW9uYWxseSwgZm9yIGV2ZW50cyB0aGF0IGFyZSBub3QgZmlyZWQgYnkgaW5kaXZpZHVhbCBjaGFydHMsIGJ1dCBhcmUgZmlyZWQgYnkgdGhlIGZyYW1ld29yayxcbiAgICAgICAgICAgICAgICAgKiB3aWxsIGhhdmUgdGhlIGZyYW1ld29yayBhcyB0aGlzIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5jYW5jZWxsZWQgLSBTaG93cyB3aGV0aGVyIGFuICBldmVudCdzIHByb3BhZ2F0aW9uIHdhcyBjYW5jZWxsZWQgb3Igbm90LlxuICAgICAgICAgICAgICAgICAqIEl0IGlzIHNldCB0byBgdHJ1ZWAgd2hlbiBgLnN0b3BQcm9wYWdhdGlvbigpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5zdG9wUHJvcGFnYXRpb24gLSBDYWxsIHRoaXMgZnVuY3Rpb24gZnJvbSB3aXRoaW4gYSBsaXN0ZW5lciB0byBwcmV2ZW50XG4gICAgICAgICAgICAgICAgICogc3Vic2VxdWVudCBsaXN0ZW5lcnMgZnJvbSBiZWluZyBleGVjdXRlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXZlbnRPYmplY3QucHJldmVudGVkIC0gU2hvd3Mgd2hldGhlciB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgdGhpcyBldmVudCBoYXMgYmVlblxuICAgICAgICAgICAgICAgICAqIHByZXZlbnRlZC4gSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAucHJldmVudERlZmF1bHQoKWAgaXMgY2FsbGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZXZlbnRPYmplY3QucHJldmVudERlZmF1bHQgLSBDYWxsIHRoaXMgZnVuY3Rpb24gdG8gcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgYW5cbiAgICAgICAgICAgICAgICAgKiBldmVudC4gRm9yIGV4YW1wbGUsIGZvciB0aGUgZXZlbnQge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpiZWZvcmVSZXNpemV9LCBpZiB5b3UgZG9cbiAgICAgICAgICAgICAgICAgKiBgLnByZXZlbnREZWZhdWx0KClgLCB0aGUgcmVzaXplIHdpbGwgbmV2ZXIgdGFrZSBwbGFjZSBhbmQgaW5zdGVhZFxuICAgICAgICAgICAgICAgICAqIHtAbGluayBGdXNpb25DaGFydHMjZXZlbnQ6cmVzaXplQ2FuY2VsbGVkfSB3aWxsIGJlIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5kZXRhY2hlZCAtIERlbm90ZXMgd2hldGhlciBhIGxpc3RlbmVyIGhhcyBiZWVuIGRldGFjaGVkIGFuZCBubyBsb25nZXJcbiAgICAgICAgICAgICAgICAgKiBnZXRzIGV4ZWN1dGVkIGZvciBhbnkgc3Vic2VxdWVudCBldmVudCBvZiB0aGlzIHBhcnRpY3VsYXIgYHR5cGVgLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZXZlbnRPYmplY3QuZGV0YWNoSGFuZGxlciAtIEFsbG93cyB0aGUgbGlzdGVuZXIgdG8gcmVtb3ZlIGl0c2VsZiByYXRoZXIgdGhhbiBiZWluZ1xuICAgICAgICAgICAgICAgICAqIGNhbGxlZCBleHRlcm5hbGx5IGJ5IHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0uIFRoaXMgaXMgdmVyeSB1c2VmdWwgZm9yIG9uZS10aW1lIGV2ZW50XG4gICAgICAgICAgICAgICAgICogbGlzdGVuaW5nIG9yIGZvciBzcGVjaWFsIHNpdHVhdGlvbnMgd2hlbiB0aGUgZXZlbnQgaXMgbm8gbG9uZ2VyIHJlcXVpcmVkIHRvIGJlIGxpc3RlbmVkIHdoZW4gdGhlXG4gICAgICAgICAgICAgICAgICogZXZlbnQgaGFzIGJlZW4gZmlyZWQgd2l0aCBhIHNwZWNpZmljIGNvbmRpdGlvbi5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudEFyZ3MgLSBFdmVyeSBldmVudCBoYXMgYW4gYXJndW1lbnQgb2JqZWN0IGFzIHNlY29uZCBwYXJhbWV0ZXIgdGhhdCBjb250YWluc1xuICAgICAgICAgICAgICAgICAqIGluZm9ybWF0aW9uIHJlbGV2YW50IHRvIHRoYXQgcGFydGljdWxhciBldmVudC5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBzbG90TG9hZGVyKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSwgZXZlbnRPYmplY3QsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gRmFjaWxpdGF0ZSB0aGUgY2FsbCBvZiBhIGdsb2JhbCBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICAgICAgICBzbG90TG9hZGVyKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1snKiddLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIGRlZmF1bHQgYWN0aW9uXG4gICAgICAgICAgICAgICAgc3dpdGNoIChldmVudE9iamVjdC5wcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0cnVlOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYW5jZWxGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbEZuLmNhbGwoZXZlbnRTY29wZSB8fCBzZW5kZXIgfHwgd2luLCBldmVudE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgY2hhcnQgbG9hZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0Rm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0Rm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN0YXR1dG9yeSBXM0MgTk9UIHByZXZlbnREZWZhdWx0IGZsYWdcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBvZiBldmVudHMgdGhhdCBoYXMgYW4gZXF1aXZhbGVudCBsZWdhY3kgZXZlbnQuIFVzZWQgYnkgdGhlXG4gICAgICAgICAqIHJhaXNlRXZlbnQgbWV0aG9kIHRvIGNoZWNrIHdoZXRoZXIgYSBwYXJ0aWN1bGFyIGV2ZW50IHJhaXNlZFxuICAgICAgICAgKiBoYXMgYW55IGNvcnJlc3BvbmRpbmcgbGVnYWN5IGV2ZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIGxlZ2FjeUV2ZW50TGlzdCA9IGdsb2JhbC5sZWdhY3lFdmVudExpc3QgPSB7fSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFpbnRhaW5zIGEgbGlzdCBvZiByZWNlbnRseSByYWlzZWQgY29uZGl0aW9uYWwgZXZlbnRzXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgY29uZGl0aW9uQ2hlY2tzID0ge307XG5cbiAgICAvLyBGYWNpbGl0YXRlIGZvciByYWlzaW5nIGV2ZW50cyBpbnRlcm5hbGx5LlxuICAgIHJhaXNlRXZlbnQgPSBnbG9iYWwucmFpc2VFdmVudCA9IGZ1bmN0aW9uICh0eXBlLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHJldHVybiBFdmVudFRhcmdldC50cmlnZ2VyRXZlbnQodHlwZSwgb2JqLCBhcmdzLCBldmVudFNjb3BlLFxuICAgICAgICAgICAgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgfTtcblxuICAgIGdsb2JhbC5kaXNwb3NlRXZlbnRzID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICB2YXIgdHlwZSwgaTtcbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBldmVudHMgaW4gdGhlIGNvbGxlY3Rpb24gb2YgbGlzdGVuZXJzXG4gICAgICAgIGZvciAodHlwZSBpbiBFdmVudFRhcmdldC5saXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBXaGVuIGEgbWF0Y2ggaXMgZm91bmQsIGRlbGV0ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgIGlmIChFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV1baV1bMV0gPT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgYWxsb3dzIHRvIHVuaWZvcm1seSByYWlzZSBldmVudHMgb2YgRnVzaW9uQ2hhcnRzXG4gICAgICogRnJhbWV3b3JrLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0byBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGFyZ3MgYWxsb3dzIHRvIHByb3ZpZGUgYW4gYXJndW1lbnRzIG9iamVjdCB0byBiZVxuICAgICAqIHBhc3NlZCBvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAqIEBwYXJhbSB9IG9iaiBpcyB0aGUgRnVzaW9uQ2hhcnRzIGluc3RhbmNlIG9iamVjdCBvblxuICAgICAqIGJlaGFsZiBvZiB3aGljaCB0aGUgZXZlbnQgd291bGQgYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7YXJyYXl9IGxlZ2FjeUFyZ3MgaXMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCBvblxuICAgICAqIHRvIHRoZSBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC5cbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBzb3VyY2VcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxGblxuICAgICAqXG4gICAgICogQHR5cGUgdW5kZWZpbmVkXG4gICAgICovXG4gICAgZ2xvYmFsLnJhaXNlRXZlbnRXaXRoTGVnYWN5ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MsIG9iaiwgbGVnYWN5QXJncyxcbiAgICAgICAgICAgIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgdmFyIGxlZ2FjeSA9IGxlZ2FjeUV2ZW50TGlzdFtuYW1lXTtcbiAgICAgICAgcmFpc2VFdmVudChuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pO1xuICAgICAgICBpZiAobGVnYWN5ICYmIHR5cGVvZiB3aW5bbGVnYWN5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2luW2xlZ2FjeV0uYXBwbHkoZXZlbnRTY29wZSB8fCB3aW4sIGxlZ2FjeUFyZ3MpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBhbGxvd3Mgb25lIHRvIHJhaXNlIHJlbGF0ZWQgZXZlbnRzIHRoYXQgYXJlIGdyb3VwZWQgdG9nZXRoZXIgYW5kXG4gICAgICogcmFpc2VkIGJ5IG11bHRpcGxlIHNvdXJjZXMuIFVzdWFsbHkgdGhpcyBpcyB1c2VkIHdoZXJlIGEgY29uZ3JlZ2F0aW9uXG4gICAgICogb2Ygc3VjY2Vzc2l2ZSBldmVudHMgbmVlZCB0byBjYW5jZWwgb3V0IGVhY2ggb3RoZXIgYW5kIGJlaGF2ZSBsaWtlIGFcbiAgICAgKiB1bmlmaWVkIGVudGl0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGVjayBpcyB1c2VkIHRvIGlkZW50aWZ5IGV2ZW50IGdyb3Vwcy4gUHJvdmlkZSBzYW1lIHZhbHVlXG4gICAgICogZm9yIGFsbCBldmVudHMgdGhhdCB5b3Ugd2FudCB0byBncm91cCB0b2dldGhlciBmcm9tIG11bHRpcGxlIHNvdXJjZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0byBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGFyZ3MgYWxsb3dzIHRvIHByb3ZpZGUgYW4gYXJndW1lbnRzIG9iamVjdCB0byBiZVxuICAgICAqIHBhc3NlZCBvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAqIEBwYXJhbSB9IG9iaiBpcyB0aGUgRnVzaW9uQ2hhcnRzIGluc3RhbmNlIG9iamVjdCBvblxuICAgICAqIGJlaGFsZiBvZiB3aGljaCB0aGUgZXZlbnQgd291bGQgYmUgcmFpc2VkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFNjb3BlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZGVmYXVsdEZuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FuY2VsbGVkRm5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAgICovXG4gICAgZ2xvYmFsLnJhaXNlRXZlbnRHcm91cCA9IGZ1bmN0aW9uIChjaGVjaywgbmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLFxuICAgICAgICAgICAgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgaWQgPSBvYmouaWQsXG4gICAgICAgICAgICBoYXNoID0gY2hlY2sgKyBpZDtcblxuICAgICAgICBpZiAoY29uZGl0aW9uQ2hlY2tzW2hhc2hdKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoY29uZGl0aW9uQ2hlY2tzW2hhc2hdKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjb25kaXRpb25DaGVja3NbaGFzaF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoaWQgJiYgaGFzaCkge1xuICAgICAgICAgICAgICAgIGNvbmRpdGlvbkNoZWNrc1toYXNoXSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25kaXRpb25DaGVja3NbaGFzaF07XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gRXh0ZW5kIHRoZSBldmVudGxpc3RlbmVycyB0byBpbnRlcm5hbCBnbG9iYWwuXG4gICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LmFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xuICAgIGdsb2JhbC5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyLCBiaW5kKSB7XG4gICAgICAgIHJldHVybiBFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgYmluZCk7XG4gICAgfTtcbn0pOyJdfQ==

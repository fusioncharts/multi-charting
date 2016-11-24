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
    var MultiChartingProto = MultiCharting.prototype;

    MultiChartingProto.convertToArray = function (data, delimiter, outputFormat, callback) {
        var csvToArr = this;
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
                if(i === 1){
                    MultiChartingProto.raiseEvent('onParsingStart', {
                        Event: {
                            loaded: 0,
                            type:'loadstart',
                            total: len
                        }
                    }, csvToArr);
                }
                MultiChartingProto.raiseEvent('onParsingProgress', {
                    Event: {
                            loaded: i,
                            type:'progress',
                            total: len
                        }
                }, csvToArr);
                
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
                    MultiChartingProto.raiseEvent('onParsingEnd', {
                        Event: {
                            loaded: i,
                            type:'loadend',
                            total: len
                        }
                    }, csvToArr);
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
		//lib = multiChartingProto.lib,
        eventList = {
            'modelUpdated': 'modelupdated',
            'modelDeleted': 'modeldeleted',
            'metaInfoUpdate': 'metainfoupdated',
            'processorUpdated': 'processorupdated',
            'processorDeleted': 'processordeleted'
        },
        uidCounter = 0,
        gerateUID = function () {
            return 'model_id_' + (uidCounter++);
        },
        getProcessorStoreObj = function (processor, ds) {
            var storeObj = {
	                processor: processor,
	                listners: {}
	            },
	            listners;

            listners = storeObj.listners;
            listners[eventList.processorUpdated] = function () {
                ds._generateInputData();
            };
            listners[eventList.processorDeleted] =  function () {
                ds.removeDataProcessor(processor);
            };
            return storeObj;
        },
        addListners = function (element, listnersObj) {
            var eventName;
            if (listnersObj && element.addEventListener) {
                for (eventName in listnersObj) {
                    element.addEventListener(eventName, listnersObj[eventName]);
                }
            }
        },
        removeListners = function (element, listnersObj) {
            var eventName;
            if (listnersObj && element.removeEventListener) {
                for (eventName in listnersObj) {
                    element.removeEventListener(eventName, listnersObj[eventName]);
                }
            }
        },
		// Constructor class for DataModel.
		DataModel = function () {
	    	var ds = this;
	    	ds.links = {
              inputStore: undefined,
              inputJSON: undefined,
              inputData: [],
              processors: [],
              metaObj: {}
            };
            // add the unicId
            ds.id = gerateUID();
	    	arguments[0] && ds.setData(arguments[0]);
		},
		DataModelProto = DataModel.prototype;

        //
        multiChartingProto.createDataStore = function () {
            return new DataModel(arguments[0]);
        };

    DataModelProto.getId = function () {
        return this.id;
    };
    DataModelProto._generateInputData = function() {
        var ds = this;
        // remove all old data
        ds.links.inputData.length = 0;

        // get the data from the input Store
        if (ds.links.inputStore && ds.links.inputStore.getJSON) {
        	ds.links.inputData = ds.links.inputData.concat(ds.links.inputStore.getJSON());
            // ds.links.inputData.push.apply(ds.links.inputData, ds.links.inputStore.getJSON());
        }

        // add the input JSON (seperately added)
        if (ds.links.inputJSON && ds.links.inputJSON.length) {
        	ds.links.inputData = ds.links.inputData.concat(ds.links.inputJSON);
        	// ds.links.inputData.push.apply(ds.links.inputData, ds.links.inputJSON);
        }


        // for simplecity call the output JSON creation method as well
        ds._generateOutputData();

    };


    DataModelProto._generateOutputData = function () {
        var ds = this,
        links = ds.links,
        outputData = links.inputData.concat([]),
        i,
        l = links.processors.length,
        storeObj;

        if (l && outputData.length) {
            for (i = 0; i < l; i += 1) {
                storeObj = links.processors[i];
                if (storeObj && storeObj.processor && storeObj.processor.getProcessedData) {
                    // @todo: we have to create this new method in the processor to return a processed JSON data
                    outputData = storeObj.processor.getProcessedData(outputData);
                }
            }
        }
        ds.links.outputData = outputData;

        // raise the event for OutputData modified event
        ds.raiseEvent(eventList.modelUpdated, {
            'data': ds.links.outputData
        }, ds);
    };


    // Function to get the jsondata of the data object
	DataModelProto.getJSON = function () {
		var ds = this;
		return (ds.links.outputData || ds.links.inputData);
	};

    // Function to get child data Store object after applying filter on the parent data.
	// @params {filters} - This can be a filter function or an array of filter functions.
	DataModelProto.getChildModel = function (filters) {
		var ds = this,
			newDs,
            metaInfo = ds.links.metaObj,
            key,
            newDSLink,
            MetaConstructor,
			metaConstractor,
            inputStoreListners;
        newDs = new DataModel();
        newDSLink = newDs.links;
        newDSLink.inputStore = ds;

        // create listners
        inputStoreListners = newDSLink.inputStoreListners = {};
        inputStoreListners[eventList.modelUpdated] = function () {
            newDs._generateInputData();
        };
        inputStoreListners[eventList.modelDeleted] = function () {
            newDs.dispose();
        };
        inputStoreListners[eventList.metaInfoUpdate] = function () {
            newDs.raiseEvent(eventList.metaInfoUpdate, {});
        };

        // inherit metaInfos
        for (key in metaInfo) {
            MetaConstructor = function () {};
            metaConstractor.prototype = metaInfo[key];
            metaConstractor.prototype.constructor = MetaConstructor;
            newDSLink.metaObj[key] = new MetaConstructor();
        }

        // attached event listener on parent data
        addListners(ds, inputStoreListners);
        newDs._generateInputData();

        newDs.addDataProcessor(filters);
        return newDs;
	};

    // Function to add processor in the data store
    DataModelProto.addDataProcessor = function (processors) {
        var ds = this,
        i,
        l,
        processor,
        storeObj;
        // if single filter is passed make it an Array
        if (!(processors instanceof Array)) {
            processors = [processors];
        }
        l = processors.length;
        for (i = 0; i < l; i += 1) {
            processor = processors[i];
            if (processor && processor.addEventListener) {
                storeObj = getProcessorStoreObj(processor, ds);
                // add the listners
                addListners(processor, storeObj.listners);
                ds.links.processors.push(storeObj);
            }
        }
        // update the outputData
        ds._generateOutputData();
    };
    //Function to remove processor in the data store
    DataModelProto.removeDataProcessor = function (processors) {
        var ds = this,
        processorsStore = ds.links.processors,
        storeObj,
        i,
        l,
        j,
        k,
        processor,
        foundMatch;
        // if single filter is passed make it an Array
        if (!(processors instanceof Array)) {
            processors = [processors];
        }
        k = processors.length;
        for (j = 0; j < k; j += 1) {
            processor = processors[j];
            l = processorsStore.length;
            foundMatch = false;
            for (i = 0; i < l && !foundMatch; i += 1) {
                storeObj = processorsStore[i];
                if  (storeObj && storeObj.processor === processor) {
                    foundMatch = true;
                    // remove the listeners
                    removeListners(processor, storeObj.listners);
                    // remove the precessor store Obj
                    processorsStore.splice(i, 1);
                }
            }
        }
        // update the outputData
        ds._generateOutputData();
    };

    // Function to add event listener at dataStore level.
	DataModelProto.addEventListener = function (type, listener) {
		return multiChartingProto.addEventListener(type, listener, this);
	};

	// Function to remove event listener at dataStore level.
    DataModelProto.removeEventListener = function (type, listener) {
		return multiChartingProto.removeEventListener(type, listener, this);
	};

    DataModelProto.raiseEvent = function (type, dataObj) {
		return multiChartingProto.raiseEvent(type, dataObj, this);
	};

    // Function to add data in the data store
	DataModelProto.setData = function (dataSpecs, callback) {
		var ds = this,
			dataType = dataSpecs.dataType,
			dataSource = dataSpecs.dataSource,
			callbackHelperFn = function (JSONData) {
				ds.links.inputJSON = JSONData.concat(ds.links.inputJSON || []);
				ds._generateInputData();
				if (typeof callback === 'function') {
					callback(JSONData);
				}
			};

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

    // Function to remove all data (not the data linked from the parent) in the data store
    DataModelProto.clearData = function (){
        var ds = this;
        // clear inputData store
        ds.links.inputData && (ds.links.inputData.length = 0);
        // re-generate the store's data
        ds._generateInputData();
    };

    // Function to dispose a store
    DataModelProto.dispose = function (){
        var ds = this,
        links = ds.links,
        inputStore = links.inputStore,
        processorsStore = links.processors,
        storeObj,
        i;

        // remove inoutStore listeners
        if (inputStore && inputStore.removeEventListener) {
            removeListners(inputStore, links.inputStoreListners);
        }

        // remove all filters and thir listeners
        for (i = processorsStore.length - 1; i >= 0; i -= 1) {
            storeObj = processorsStore[i];
            // remove the listeners
            removeListners(storeObj.processor, storeObj.listners);
        }
        processorsStore.length = 0;

        // raise the event for OutputData modified event
        ds.raiseEvent(eventList.modelDeleted, {});


        // @todo: delete all links

        // @todo: clear all events as they will not be used any more

    };
    // Funtion to get all the keys of the JSON data
    // @todo: need to improve it for performance as well as for better results
	DataModelProto.getKeys = function () {
		var ds = this,
			data = ds.getJSON(),
			firstData = data[0] || {};

		return Object.keys(firstData);
	};

	// Funtion to get all the unique values corresponding to a key
    // @todo: need to improve it for performance as well as for better results
	DataModelProto.getUniqueValues = function (key) {
		var ds = this,
			data = ds.getJSON(),
			internalData = data[0],
			isArray = internalData instanceof Array,
			//uniqueValues = ds.uniqueValues[key],
			tempUniqueValues = {},
			len = data.length,
			i;

		// if (uniqueValues) {
		// 	return uniqueValues;
		// }

		if (isArray) {
			i = 1;
			key = ds.getKeys().findIndex(function (element) {
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

		return Object.keys(tempUniqueValues);
	};

    // Function to add / update metadata
	DataModelProto.updateMetaData = function (fieldName, metaInfo) {
        var ds = this,
        metaObj = ds.links.metaObj,
        fieldMetaInfo, key;
		if (fieldMetaInfo = metaObj[fieldName]) {
            for (key in metaInfo) {
                fieldMetaInfo[key] = metaInfo[key];
            }
        }
        ds.raiseEvent(eventList.metaInfoUpdate, {});
	};
    // Function to add metadata
    // Not required
	// DataModelProto.deleteMetaData = function (fieldName, metaInfoKey) {
    //     var ds = this,
    //     metaObj = ds.links.metaObj;
    //     if (metaObj[fieldName]) {
    //         metaObj[fieldName][metaInfoKey] = undefined;
    //     }
	// };

	// Function to get the added metaData
	DataModelProto.getMetaData = function (fieldName) {
		var ds = this,
        metaObj = ds.links.metaObj;
        return fieldName ? (metaObj[fieldName] || {}) : metaObj;
	};

	// Function to add data to the dataStorage asynchronously via ajax
    DataModelProto.setDataUrl = function () {
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
		eventList = {
            'modelUpdated': 'modelupdated',
            'modelDeleted': 'modeldeleted',
            'metaInfoUpdate': 'metainfoupdated',
            'processorUpdated': 'processorupdated',
            'processorDeleted': 'processordeleted'
        },
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

		multiChartingProto.raiseEvent(eventList.processorUpdated, {
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


	dataProcessorProto.dispose = function () {
		var filter = this,
			id = filter.id;

		filterLink[id] && updataFilterProcessor(id, true);

		delete filterStore[id];
		delete filterLink[id];

		multiChartingProto.raiseEvent(eventList.processorDeleted, {
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

	dataProcessorProto.getProcessedData = function (JSONData) {
		var dataProcessor = this,
			type = dataProcessor.type,
			filterFn = dataProcessor.getProcessor();
        switch (type) {
            case  'sort' : return Array.prototype.sort.call(JSONData, filterFn);
            case  'filter' : return Array.prototype.filter.call(JSONData, filterFn);
            case 'map' : return Array.prototype.map.call(JSONData, filterFn);
            default : return filterFn(JSONData);
        }
        
	};

	// Function to add event listener at dataProcessor level.
	dataProcessorProto.addEventListener = function (type, listener) {
		return multiChartingProto.addEventListener(type, listener, this);
	};

	// Function to remove event listener at dataProcessor level.
    dataProcessorProto.removeEventListener = function (type, listener) {
		return multiChartingProto.removeEventListener(type, listener, this);
	};

    dataProcessorProto.raiseEvent = function (type, dataObj) {
		return multiChartingProto.raiseEvent(type, dataObj, this);
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
            callback = dataadapter.callback,
            isMetaData = dataadapter.dataStore && (dataadapter.dataStore.getMetaData() ? true : false);
            predefinedJson = configuration && configuration.config;

        if (jsonData && configuration) {
            generalData = dataadapter.generalDataFormat(jsonData, configuration);
            configuration.categories && (aggregatedData = dataadapter.getSortedData(generalData, 
                                configuration.categories, configuration.dimension, configuration.aggregateMode));
            aggregatedData = aggregatedData || generalData;
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
            arr = [],
            dataStore = dataadapter.dataStore;
  
        (Array.isArray(dimension) && (key = dimension)) || (key = [dimension]);

        (categoryArr && !categoryArr.length) || (categoryArr = dataStore.getUniqueValues(key[0]));
        (Array.isArray(categoryArr[0]) && (categories = categoryArr)) || (categories = [categoryArr]);

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
                        color = metaDataMeasure[COLOR] && ((metaDataMeasure[COLOR] instanceof Function) ?
                                                                                metaDataMeasure[COLOR]() :
                                                                                metaDataMeasure[COLOR]);
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
            dataAdapterObj = argument.configuration || {},
            chartObj;

        //get fc supported json            
        chart.getJSON(argument);        
        //render FC 
        chartObj = chart.chartObj = new FusionCharts(chart.chartConfig);
        chartObj.render();

        dataAdapterObj.chart = chartObj;
        
        chartObj.addEventListener('trendRegionRollOver', function (e, d) {
            var dataObj = getRowData(chart.dataStoreJson, chart.aggregatedData, 
                                        chart.dimension, chart.measure, d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataObj,
                categoryLabel : d.categoryLabel
            }, chart);
        });

        chartObj.addEventListener('trendRegionRollOut', function (e, d) {
            MultiCharting.prototype.raiseEvent('hoverout', {
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
            hoverin : 'trendRegionRollOver',
            hoverout : 'trendRegionRollOut',
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJmdXNpb25jaGFydHMubXVsdGljaGFydGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTXVsdGlDaGFydGluZyBFeHRlbnNpb24gZm9yIEZ1c2lvbkNoYXJ0c1xuICogVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIGJhc2ljIHJvdXRpbmVzIHJlcXVpcmVkIGJ5IHN1YnNlcXVlbnQgbW9kdWxlcyB0b1xuICogZXh0ZW5kL3NjYWxlIG9yIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBNdWx0aUNoYXJ0aW5nIG9iamVjdC5cbiAqXG4gKi9cblxuIC8qIGdsb2JhbCB3aW5kb3c6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChlbnYsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBlbnYuZG9jdW1lbnQgP1xuICAgICAgICAgICAgZmFjdG9yeShlbnYpIDogZnVuY3Rpb24od2luKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3aW4uZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXaW5kb3cgd2l0aCBkb2N1bWVudCBub3QgcHJlc2VudCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFjdG9yeSh3aW4sIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbnYuTXVsdGlDaGFydGluZyA9IGZhY3RvcnkoZW52LCB0cnVlKTtcbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uIChfd2luZG93LCB3aW5kb3dFeGlzdHMpIHtcbiAgICAvLyBJbiBjYXNlIE11bHRpQ2hhcnRpbmcgYWxyZWFkeSBleGlzdHMuXG4gICAgaWYgKF93aW5kb3cuTXVsdGlDaGFydGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIE11bHRpQ2hhcnRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbiA9IF93aW5kb3c7XG5cbiAgICBpZiAod2luZG93RXhpc3RzKSB7XG4gICAgICAgIF93aW5kb3cuTXVsdGlDaGFydGluZyA9IE11bHRpQ2hhcnRpbmc7XG4gICAgfVxuICAgIHJldHVybiBNdWx0aUNoYXJ0aW5nO1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG1lcmdlID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpIHtcbiAgICAgICAgICAgIHZhciBpdGVtLFxuICAgICAgICAgICAgICAgIHNyY1ZhbCxcbiAgICAgICAgICAgICAgICB0Z3RWYWwsXG4gICAgICAgICAgICAgICAgc3RyLFxuICAgICAgICAgICAgICAgIGNSZWYsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHJGbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgICAgICAgICAgYXJyYXlUb1N0ciA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHIgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICAgICAgICAgICAgICBjaGVja0N5Y2xpY1JlZiA9IGZ1bmN0aW9uKG9iaiwgcGFyZW50QXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gcGFyZW50QXJyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmogPT09IHBhcmVudEFycltpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5kZXg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcblxuICAgICAgICAgICAgLy9jaGVjayB3aGV0aGVyIG9iajIgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgIC8vaWYgYXJyYXkgdGhlbiBpdGVyYXRlIHRocm91Z2ggaXQncyBpbmRleFxuICAgICAgICAgICAgLy8qKioqIE1PT1RPT0xTIHByZWN1dGlvblxuXG4gICAgICAgICAgICBpZiAoIXNyY0Fycikge1xuICAgICAgICAgICAgICAgIHRndEFyciA9IFtvYmoxXTtcbiAgICAgICAgICAgICAgICBzcmNBcnIgPSBbb2JqMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0Z3RBcnIucHVzaChvYmoxKTtcbiAgICAgICAgICAgICAgICBzcmNBcnIucHVzaChvYmoyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9iajIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGZvciAoaXRlbSA9IDA7IGl0ZW0gPCBvYmoyLmxlbmd0aDsgaXRlbSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VmFsID0gb2JqMltpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRndFZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShza2lwVW5kZWYgJiYgdGd0VmFsID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgdHlwZW9mIHNyY1ZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndFZhbCBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtIGluIG9iajIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0Z3RWYWwgIT09IG51bGwgJiYgdHlwZW9mIHRndFZhbCA9PT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggZm9yIGlzc3VlIEJVRzogRldYVC02MDJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFIDwgOSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobnVsbCkgZ2l2ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdbb2JqZWN0IE9iamVjdF0nIGluc3RlYWQgb2YgJ1tvYmplY3QgTnVsbF0nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0J3Mgd2h5IG51bGwgdmFsdWUgYmVjb21lcyBPYmplY3QgaW4gSUUgPCA5XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgPSBvYmplY3RUb1N0ckZuLmNhbGwodGd0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IG9iamVjdFRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0ciA9PT0gYXJyYXlUb1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgIShzcmNWYWwgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVuZDIgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmKSB7XG4gICAgICAgICAgICB2YXIgT0JKRUNUU1RSSU5HID0gJ29iamVjdCc7XG4gICAgICAgICAgICAvL2lmIG5vbmUgb2YgdGhlIGFyZ3VtZW50cyBhcmUgb2JqZWN0IHRoZW4gcmV0dXJuIGJhY2tcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HICYmIHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcgfHwgb2JqMiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIG9iajEgPSBvYmoyIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVyZ2Uob2JqMSwgb2JqMiwgc2tpcFVuZGVmKTtcbiAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICB9LFxuICAgICAgICBsaWIgPSB7XG4gICAgICAgICAgICBleHRlbmQyOiBleHRlbmQyLFxuICAgICAgICAgICAgbWVyZ2U6IG1lcmdlXG4gICAgICAgIH07XG5cblx0TXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliID0gKE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiB8fCBsaWIpO1xuXG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBBamF4ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGFqYXggPSB0aGlzLFxuXHRcdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXTtcblxuXHRcdCAgICBhamF4Lm9uU3VjY2VzcyA9IGFyZ3VtZW50LnN1Y2Nlc3M7XG5cdFx0ICAgIGFqYXgub25FcnJvciA9IGFyZ3VtZW50LmVycm9yO1xuXHRcdCAgICBhamF4Lm9wZW4gPSBmYWxzZTtcblx0XHQgICAgcmV0dXJuIGFqYXguZ2V0KGFyZ3VtZW50LnVybCk7XG5cdFx0fSxcblxuICAgICAgICBhamF4UHJvdG8gPSBBamF4LnByb3RvdHlwZSxcblxuICAgICAgICBGVU5DVElPTiA9ICdmdW5jdGlvbicsXG4gICAgICAgIE1TWE1MSFRUUCA9ICdNaWNyb3NvZnQuWE1MSFRUUCcsXG4gICAgICAgIE1TWE1MSFRUUDIgPSAnTXN4bWwyLlhNTEhUVFAnLFxuICAgICAgICBHRVQgPSAnR0VUJyxcbiAgICAgICAgWEhSRVFFUlJPUiA9ICdYbWxIdHRwcmVxdWVzdCBFcnJvcicsXG4gICAgICAgIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBtdWx0aUNoYXJ0aW5nUHJvdG8ud2luLCAvLyBrZWVwIGEgbG9jYWwgcmVmZXJlbmNlIG9mIHdpbmRvdyBzY29wZVxuXG4gICAgICAgIC8vIFByb2JlIElFIHZlcnNpb25cbiAgICAgICAgdmVyc2lvbiA9IHBhcnNlRmxvYXQod2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLnNwbGl0KCdNU0lFJylbMV0pLFxuICAgICAgICBpZWx0OCA9ICh2ZXJzaW9uID49IDUuNSAmJiB2ZXJzaW9uIDw9IDcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBmaXJlZm94ID0gL21vemlsbGEvaS50ZXN0KHdpbi5uYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZsYWdzLlxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBwYWdlIGlzIG9uIGZpbGUgcHJvdG9jb2wuXG4gICAgICAgIGZpbGVQcm90b2NvbCA9IHdpbi5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyxcbiAgICAgICAgQVhPYmplY3QgPSB3aW4uQWN0aXZlWE9iamVjdCxcblxuICAgICAgICAvLyBDaGVjayBpZiBuYXRpdmUgeGhyIGlzIHByZXNlbnRcbiAgICAgICAgWEhSTmF0aXZlID0gKCFBWE9iamVjdCB8fCAhZmlsZVByb3RvY29sKSAmJiB3aW4uWE1MSHR0cFJlcXVlc3QsXG5cbiAgICAgICAgLy8gUHJlcGFyZSBmdW5jdGlvbiB0byByZXRyaWV2ZSBjb21wYXRpYmxlIHhtbGh0dHByZXF1ZXN0LlxuICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4bWxodHRwO1xuXG4gICAgICAgICAgICAvLyBpZiB4bWxodHRwcmVxdWVzdCBpcyBwcmVzZW50IGFzIG5hdGl2ZSwgdXNlIGl0LlxuICAgICAgICAgICAgaWYgKFhIUk5hdGl2ZSkge1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhIUk5hdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBhY3RpdmVYIGZvciBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICAgICAgfSxcblxuICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBQcmV2ZW50cyBjYWNoZWluZyBvZiBBSkFYIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0lmLU1vZGlmaWVkLVNpbmNlJzogJ1NhdCwgMjkgT2N0IDE5OTQgMTk6NDM6MzEgR01UJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyB0aGUgc2VydmVyIGtub3cgdGhhdCB0aGlzIGlzIGFuIEFKQVggcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyBzZXJ2ZXIga25vdyB3aGljaCB3ZWIgYXBwbGljYXRpb24gaXMgc2VuZGluZyByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1CeSc6ICdGdXNpb25DaGFydHMnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZW50aW9ucyBjb250ZW50LXR5cGVzIHRoYXQgYXJlIGFjY2VwdGFibGUgZm9yIHRoZSByZXNwb25zZS4gU29tZSBzZXJ2ZXJzIHJlcXVpcmUgdGhpcyBmb3IgQWpheFxuICAgICAgICAgICAgICogY29tbXVuaWNhdGlvbi5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9wbGFpbiwgKi8qJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIE1JTUUgdHlwZSBvZiB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdCBhbG9uZyB3aXRoIGl0cyBjaGFyc2V0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnXG4gICAgICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5hamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFqYXgoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmdldCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IHdyYXBwZXIueG1saHR0cCxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sgPSB3cmFwcGVyLm9uRXJyb3IsXG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgPSB3cmFwcGVyLm9uU3VjY2VzcyxcbiAgICAgICAgICAgIHhSZXF1ZXN0ZWRCeSA9ICdYLVJlcXVlc3RlZC1CeScsXG4gICAgICAgICAgICBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGV2ZW50TGlzdCA9IFsnb25sb2Fkc3RhcnQnLCAnb25kdXJhdGlvbmNoYW5nZScsICdvbmxvYWRlZG1ldGFkYXRhJywgJ29ubG9hZGVkZGF0YScsICdvbnByb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAnb25jYW5wbGF5JywgJ29uY2FucGxheXRocm91Z2gnLCAnb25hYm9ydCcsICdvbmVycm9yJywgJ29udGltZW91dCcsICdvbmxvYWRlbmQnXTtcblxuICAgICAgICAvLyBYLVJlcXVlc3RlZC1CeSBpcyByZW1vdmVkIGZyb20gaGVhZGVyIGR1cmluZyBjcm9zcyBkb21haW4gYWpheCBjYWxsXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9eKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykvKSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaG9zdG5hbWUgIT09IC8oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKShbXlxcL1xcOl0qKS8uZXhlYyh1cmwpWzJdKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gaHR0cCBvciBodHRwcywgdGhlbiBpdHMgYSBzYW1lIGRvbWFpbiBjYWxsLiBObyBuZWVkIHRvIHVzZSByZWdleCB0byBnZXRcbiAgICAgICAgICAgIC8vIGRvbWFpbi4gSWYgaXQgY29udGFpbnMgdGhlbiBjaGVja3MgZG9tYWluLlxuICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbeFJlcXVlc3RlZEJ5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICFoYXNPd24uY2FsbChoZWFkZXJzLCB4UmVxdWVzdGVkQnkpICYmIChoZWFkZXJzW3hSZXF1ZXN0ZWRCeV0gPSAnRnVzaW9uQ2hhcnRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXhtbGh0dHAgfHwgaWVsdDggfHwgZmlyZWZveCkge1xuICAgICAgICAgICAgeG1saHR0cCA9IG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB3cmFwcGVyLnhtbGh0dHAgPSB4bWxodHRwO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzIDwgMzAwKSB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMzA0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA9PT0gMTIyMyB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh4bWxodHRwLnJlc3BvbnNlVGV4dCwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKG5ldyBFcnJvcihYSFJFUUVSUk9SKSwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgeG1saHR0cFtldmVudE5hbWVdID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50IDogZXZlbnRcbiAgICAgICAgICAgICAgICB9LCB3cmFwcGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4bWxodHRwLm9wZW4oR0VULCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3BsYWluJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5zZXRSZXF1ZXN0SGVhZGVyKGksIGhlYWRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB4bWxodHRwLnNlbmQoKTtcbiAgICAgICAgICAgIHdyYXBwZXIub3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3IsIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IGluc3RhbmNlLnhtbGh0dHA7XG5cbiAgICAgICAgaW5zdGFuY2Uub3BlbiA9IGZhbHNlO1xuICAgICAgICByZXR1cm4geG1saHR0cCAmJiB0eXBlb2YgeG1saHR0cC5hYm9ydCA9PT0gRlVOQ1RJT04gJiYgeG1saHR0cC5yZWFkeVN0YXRlICYmXG4gICAgICAgICAgICAgICAgeG1saHR0cC5yZWFkeVN0YXRlICE9PSAwICYmIHhtbGh0dHAuYWJvcnQoKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIGluc3RhbmNlLm9wZW4gJiYgaW5zdGFuY2UuYWJvcnQoKTtcblxuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25FcnJvcjtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9uU3VjY2VzcztcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLnhtbGh0dHA7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vcGVuO1xuXG4gICAgICAgIHJldHVybiAoaW5zdGFuY2UgPSBudWxsKTtcbiAgICB9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuICAgIC8vIFNvdXJjZTogaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8xNTA0LUFzay1CZW4tUGFyc2luZy1DU1YtU3RyaW5ncy1XaXRoLUphdmFzY3JpcHQtRXhlYy1SZWd1bGFyLUV4cHJlc3Npb24tQ29tbWFuZC5odG1cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXG5cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuICAgIGZ1bmN0aW9uIENTVlRvQXJyYXkgKHN0ckRhdGEsIHN0ckRlbGltaXRlcikge1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGRlbGltaXRlciBpcyBkZWZpbmVkLiBJZiBub3QsXG4gICAgICAgIC8vIHRoZW4gZGVmYXVsdCB0byBjb21tYS5cbiAgICAgICAgc3RyRGVsaW1pdGVyID0gKHN0ckRlbGltaXRlciB8fCBcIixcIik7XG4gICAgICAgIC8vIENyZWF0ZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBwYXJzZSB0aGUgQ1NWIHZhbHVlcy5cbiAgICAgICAgdmFyIG9ialBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIC8vIERlbGltaXRlcnMuXG4gICAgICAgICAgICAgICAgXCIoXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJ8XFxcXHI/XFxcXG58XFxcXHJ8XilcIiArXG4gICAgICAgICAgICAgICAgLy8gUXVvdGVkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIig/OlxcXCIoW15cXFwiXSooPzpcXFwiXFxcIlteXFxcIl0qKSopXFxcInxcIiArXG4gICAgICAgICAgICAgICAgLy8gU3RhbmRhcmQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKFteXFxcIlxcXFxcIiArIHN0ckRlbGltaXRlciArIFwiXFxcXHJcXFxcbl0qKSlcIlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFwiZ2lcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGRhdGEuIEdpdmUgdGhlIGFycmF5XG4gICAgICAgIC8vIGEgZGVmYXVsdCBlbXB0eSBmaXJzdCByb3cuXG4gICAgICAgIHZhciBhcnJEYXRhID0gW1tdXTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGluZGl2aWR1YWwgcGF0dGVyblxuICAgICAgICAvLyBtYXRjaGluZyBncm91cHMuXG4gICAgICAgIHZhciBhcnJNYXRjaGVzID0gbnVsbDtcbiAgICAgICAgLy8gS2VlcCBsb29waW5nIG92ZXIgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzXG4gICAgICAgIC8vIHVudGlsIHdlIGNhbiBubyBsb25nZXIgZmluZCBhIG1hdGNoLlxuICAgICAgICB3aGlsZSAoYXJyTWF0Y2hlcyA9IG9ialBhdHRlcm4uZXhlYyggc3RyRGF0YSApKXtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZGVsaW1pdGVyIHRoYXQgd2FzIGZvdW5kLlxuICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWREZWxpbWl0ZXIgPSBhcnJNYXRjaGVzWyAxIF07XG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGdpdmVuIGRlbGltaXRlciBoYXMgYSBsZW5ndGhcbiAgICAgICAgICAgIC8vIChpcyBub3QgdGhlIHN0YXJ0IG9mIHN0cmluZykgYW5kIGlmIGl0IG1hdGNoZXNcbiAgICAgICAgICAgIC8vIGZpZWxkIGRlbGltaXRlci4gSWYgaWQgZG9lcyBub3QsIHRoZW4gd2Uga25vd1xuICAgICAgICAgICAgLy8gdGhhdCB0aGlzIGRlbGltaXRlciBpcyBhIHJvdyBkZWxpbWl0ZXIuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgc3RyTWF0Y2hlZERlbGltaXRlci5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAoc3RyTWF0Y2hlZERlbGltaXRlciAhPSBzdHJEZWxpbWl0ZXIpXG4gICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBoYXZlIHJlYWNoZWQgYSBuZXcgcm93IG9mIGRhdGEsXG4gICAgICAgICAgICAgICAgLy8gYWRkIGFuIGVtcHR5IHJvdyB0byBvdXIgZGF0YSBhcnJheS5cbiAgICAgICAgICAgICAgICBhcnJEYXRhLnB1c2goIFtdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciBkZWxpbWl0ZXIgb3V0IG9mIHRoZSB3YXksXG4gICAgICAgICAgICAvLyBsZXQncyBjaGVjayB0byBzZWUgd2hpY2gga2luZCBvZiB2YWx1ZSB3ZVxuICAgICAgICAgICAgLy8gY2FwdHVyZWQgKHF1b3RlZCBvciB1bnF1b3RlZCkuXG4gICAgICAgICAgICBpZiAoYXJyTWF0Y2hlc1sgMiBdKXtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIHF1b3RlZCB2YWx1ZS4gV2hlbiB3ZSBjYXB0dXJlXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB2YWx1ZSwgdW5lc2NhcGUgYW55IGRvdWJsZSBxdW90ZXMuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDIgXS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICBuZXcgUmVnRXhwKCBcIlxcXCJcXFwiXCIsIFwiZ1wiICksXG4gICAgICAgICAgICAgICAgICAgIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgbm9uLXF1b3RlZCB2YWx1ZS5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgdmFsdWUgc3RyaW5nLCBsZXQncyBhZGRcbiAgICAgICAgICAgIC8vIGl0IHRvIHRoZSBkYXRhIGFycmF5LlxuICAgICAgICAgICAgYXJyRGF0YVsgYXJyRGF0YS5sZW5ndGggLSAxIF0ucHVzaCggc3RyTWF0Y2hlZFZhbHVlICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBwYXJzZWQgZGF0YS5cbiAgICAgICAgcmV0dXJuKCBhcnJEYXRhICk7XG4gICAgfVxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG4gICAgdmFyIE11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlO1xuXG4gICAgTXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY3N2VG9BcnIgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBpZihpID09PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgTXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ29uUGFyc2luZ1N0YXJ0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonbG9hZHN0YXJ0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogbGVuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGNzdlRvQXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgTXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ29uUGFyc2luZ1Byb2dyZXNzJywge1xuICAgICAgICAgICAgICAgICAgICBFdmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidwcm9ncmVzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IGxlblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGNzdlRvQXJyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIE11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KCdvblBhcnNpbmdFbmQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFdmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidsb2FkZW5kJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogbGVuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGNzdlRvQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZmluYWxPYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBvdXRwdXRGb3JtYXQgPSBvdXRwdXRGb3JtYXQgfHwgMTtcbiAgICAgICAgaGVhZGVyID0gaGVhZGVyICYmIGhlYWRlclswXTtcblxuICAgICAgICAvL2lmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAoc3BsaXRlZERhdGFbc3BsaXRlZERhdGEubGVuZ3RoIC0gMV0gPT09ICcnKSB7XG4gICAgICAgICAgICBzcGxpdGVkRGF0YS5zcGxpY2UoKHNwbGl0ZWREYXRhLmxlbmd0aCAtIDEpLCAxKTtcbiAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXQgPT09IDEpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgICAgIGZpbmFsT2IucHVzaChoZWFkZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdCA9PT0gMikge1xuICAgICAgICAgICAgZmluYWxPYiA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdCA9PT0gMykge1xuICAgICAgICAgICAgZmluYWxPYiA9IHt9O1xuICAgICAgICAgICAgZm9yIChrID0gMCwga2xlbiA9IGhlYWRlci5sZW5ndGg7IGsgPCBrbGVuOyArK2spIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltrXV0gPSBbXTtcbiAgICAgICAgICAgIH0gICBcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZU1hbmFnZXIoKTtcblxuICAgIH07XG5cbn0pO1xuIiwiLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhclx0bXVsdGlDaGFydGluZ1Byb3RvID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUsXG5cdFx0Ly9saWIgPSBtdWx0aUNoYXJ0aW5nUHJvdG8ubGliLFxuICAgICAgICBldmVudExpc3QgPSB7XG4gICAgICAgICAgICAnbW9kZWxVcGRhdGVkJzogJ21vZGVsdXBkYXRlZCcsXG4gICAgICAgICAgICAnbW9kZWxEZWxldGVkJzogJ21vZGVsZGVsZXRlZCcsXG4gICAgICAgICAgICAnbWV0YUluZm9VcGRhdGUnOiAnbWV0YWluZm91cGRhdGVkJyxcbiAgICAgICAgICAgICdwcm9jZXNzb3JVcGRhdGVkJzogJ3Byb2Nlc3NvcnVwZGF0ZWQnLFxuICAgICAgICAgICAgJ3Byb2Nlc3NvckRlbGV0ZWQnOiAncHJvY2Vzc29yZGVsZXRlZCdcbiAgICAgICAgfSxcbiAgICAgICAgdWlkQ291bnRlciA9IDAsXG4gICAgICAgIGdlcmF0ZVVJRCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnbW9kZWxfaWRfJyArICh1aWRDb3VudGVyKyspO1xuICAgICAgICB9LFxuICAgICAgICBnZXRQcm9jZXNzb3JTdG9yZU9iaiA9IGZ1bmN0aW9uIChwcm9jZXNzb3IsIGRzKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmVPYmogPSB7XG5cdCAgICAgICAgICAgICAgICBwcm9jZXNzb3I6IHByb2Nlc3Nvcixcblx0ICAgICAgICAgICAgICAgIGxpc3RuZXJzOiB7fVxuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICBsaXN0bmVycztcblxuICAgICAgICAgICAgbGlzdG5lcnMgPSBzdG9yZU9iai5saXN0bmVycztcbiAgICAgICAgICAgIGxpc3RuZXJzW2V2ZW50TGlzdC5wcm9jZXNzb3JVcGRhdGVkXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsaXN0bmVyc1tldmVudExpc3QucHJvY2Vzc29yRGVsZXRlZF0gPSAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRzLnJlbW92ZURhdGFQcm9jZXNzb3IocHJvY2Vzc29yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gc3RvcmVPYmo7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZExpc3RuZXJzID0gZnVuY3Rpb24gKGVsZW1lbnQsIGxpc3RuZXJzT2JqKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnROYW1lO1xuICAgICAgICAgICAgaWYgKGxpc3RuZXJzT2JqICYmIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIGZvciAoZXZlbnROYW1lIGluIGxpc3RuZXJzT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RuZXJzT2JqW2V2ZW50TmFtZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlTGlzdG5lcnMgPSBmdW5jdGlvbiAoZWxlbWVudCwgbGlzdG5lcnNPYmopIHtcbiAgICAgICAgICAgIHZhciBldmVudE5hbWU7XG4gICAgICAgICAgICBpZiAobGlzdG5lcnNPYmogJiYgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChldmVudE5hbWUgaW4gbGlzdG5lcnNPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdG5lcnNPYmpbZXZlbnROYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhTW9kZWwuXG5cdFx0RGF0YU1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgZHMgPSB0aGlzO1xuXHQgICAgXHRkcy5saW5rcyA9IHtcbiAgICAgICAgICAgICAgaW5wdXRTdG9yZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBpbnB1dEpTT046IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgaW5wdXREYXRhOiBbXSxcbiAgICAgICAgICAgICAgcHJvY2Vzc29yczogW10sXG4gICAgICAgICAgICAgIG1ldGFPYmo6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gYWRkIHRoZSB1bmljSWRcbiAgICAgICAgICAgIGRzLmlkID0gZ2VyYXRlVUlEKCk7XG5cdCAgICBcdGFyZ3VtZW50c1swXSAmJiBkcy5zZXREYXRhKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHREYXRhTW9kZWxQcm90byA9IERhdGFNb2RlbC5wcm90b3R5cGU7XG5cbiAgICAgICAgLy9cbiAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YU1vZGVsKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH07XG5cbiAgICBEYXRhTW9kZWxQcm90by5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfTtcbiAgICBEYXRhTW9kZWxQcm90by5fZ2VuZXJhdGVJbnB1dERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcztcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBvbGQgZGF0YVxuICAgICAgICBkcy5saW5rcy5pbnB1dERhdGEubGVuZ3RoID0gMDtcblxuICAgICAgICAvLyBnZXQgdGhlIGRhdGEgZnJvbSB0aGUgaW5wdXQgU3RvcmVcbiAgICAgICAgaWYgKGRzLmxpbmtzLmlucHV0U3RvcmUgJiYgZHMubGlua3MuaW5wdXRTdG9yZS5nZXRKU09OKSB7XG4gICAgICAgIFx0ZHMubGlua3MuaW5wdXREYXRhID0gZHMubGlua3MuaW5wdXREYXRhLmNvbmNhdChkcy5saW5rcy5pbnB1dFN0b3JlLmdldEpTT04oKSk7XG4gICAgICAgICAgICAvLyBkcy5saW5rcy5pbnB1dERhdGEucHVzaC5hcHBseShkcy5saW5rcy5pbnB1dERhdGEsIGRzLmxpbmtzLmlucHV0U3RvcmUuZ2V0SlNPTigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCB0aGUgaW5wdXQgSlNPTiAoc2VwZXJhdGVseSBhZGRlZClcbiAgICAgICAgaWYgKGRzLmxpbmtzLmlucHV0SlNPTiAmJiBkcy5saW5rcy5pbnB1dEpTT04ubGVuZ3RoKSB7XG4gICAgICAgIFx0ZHMubGlua3MuaW5wdXREYXRhID0gZHMubGlua3MuaW5wdXREYXRhLmNvbmNhdChkcy5saW5rcy5pbnB1dEpTT04pO1xuICAgICAgICBcdC8vIGRzLmxpbmtzLmlucHV0RGF0YS5wdXNoLmFwcGx5KGRzLmxpbmtzLmlucHV0RGF0YSwgZHMubGlua3MuaW5wdXRKU09OKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gZm9yIHNpbXBsZWNpdHkgY2FsbCB0aGUgb3V0cHV0IEpTT04gY3JlYXRpb24gbWV0aG9kIGFzIHdlbGxcbiAgICAgICAgZHMuX2dlbmVyYXRlT3V0cHV0RGF0YSgpO1xuXG4gICAgfTtcblxuXG4gICAgRGF0YU1vZGVsUHJvdG8uX2dlbmVyYXRlT3V0cHV0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgbGlua3MgPSBkcy5saW5rcyxcbiAgICAgICAgb3V0cHV0RGF0YSA9IGxpbmtzLmlucHV0RGF0YS5jb25jYXQoW10pLFxuICAgICAgICBpLFxuICAgICAgICBsID0gbGlua3MucHJvY2Vzc29ycy5sZW5ndGgsXG4gICAgICAgIHN0b3JlT2JqO1xuXG4gICAgICAgIGlmIChsICYmIG91dHB1dERhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgc3RvcmVPYmogPSBsaW5rcy5wcm9jZXNzb3JzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChzdG9yZU9iaiAmJiBzdG9yZU9iai5wcm9jZXNzb3IgJiYgc3RvcmVPYmoucHJvY2Vzc29yLmdldFByb2Nlc3NlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRvZG86IHdlIGhhdmUgdG8gY3JlYXRlIHRoaXMgbmV3IG1ldGhvZCBpbiB0aGUgcHJvY2Vzc29yIHRvIHJldHVybiBhIHByb2Nlc3NlZCBKU09OIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YSA9IHN0b3JlT2JqLnByb2Nlc3Nvci5nZXRQcm9jZXNzZWREYXRhKG91dHB1dERhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkcy5saW5rcy5vdXRwdXREYXRhID0gb3V0cHV0RGF0YTtcblxuICAgICAgICAvLyByYWlzZSB0aGUgZXZlbnQgZm9yIE91dHB1dERhdGEgbW9kaWZpZWQgZXZlbnRcbiAgICAgICAgZHMucmFpc2VFdmVudChldmVudExpc3QubW9kZWxVcGRhdGVkLCB7XG4gICAgICAgICAgICAnZGF0YSc6IGRzLmxpbmtzLm91dHB1dERhdGFcbiAgICAgICAgfSwgZHMpO1xuICAgIH07XG5cblxuICAgIC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUganNvbmRhdGEgb2YgdGhlIGRhdGEgb2JqZWN0XG5cdERhdGFNb2RlbFByb3RvLmdldEpTT04gPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRzID0gdGhpcztcblx0XHRyZXR1cm4gKGRzLmxpbmtzLm91dHB1dERhdGEgfHwgZHMubGlua3MuaW5wdXREYXRhKTtcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGdldCBjaGlsZCBkYXRhIFN0b3JlIG9iamVjdCBhZnRlciBhcHBseWluZyBmaWx0ZXIgb24gdGhlIHBhcmVudCBkYXRhLlxuXHQvLyBAcGFyYW1zIHtmaWx0ZXJzfSAtIFRoaXMgY2FuIGJlIGEgZmlsdGVyIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIGZpbHRlciBmdW5jdGlvbnMuXG5cdERhdGFNb2RlbFByb3RvLmdldENoaWxkTW9kZWwgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuXHRcdHZhciBkcyA9IHRoaXMsXG5cdFx0XHRuZXdEcyxcbiAgICAgICAgICAgIG1ldGFJbmZvID0gZHMubGlua3MubWV0YU9iaixcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIG5ld0RTTGluayxcbiAgICAgICAgICAgIE1ldGFDb25zdHJ1Y3Rvcixcblx0XHRcdG1ldGFDb25zdHJhY3RvcixcbiAgICAgICAgICAgIGlucHV0U3RvcmVMaXN0bmVycztcbiAgICAgICAgbmV3RHMgPSBuZXcgRGF0YU1vZGVsKCk7XG4gICAgICAgIG5ld0RTTGluayA9IG5ld0RzLmxpbmtzO1xuICAgICAgICBuZXdEU0xpbmsuaW5wdXRTdG9yZSA9IGRzO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBsaXN0bmVyc1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnMgPSBuZXdEU0xpbmsuaW5wdXRTdG9yZUxpc3RuZXJzID0ge307XG4gICAgICAgIGlucHV0U3RvcmVMaXN0bmVyc1tldmVudExpc3QubW9kZWxVcGRhdGVkXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5ld0RzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuICAgICAgICB9O1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnNbZXZlbnRMaXN0Lm1vZGVsRGVsZXRlZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBuZXdEcy5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlucHV0U3RvcmVMaXN0bmVyc1tldmVudExpc3QubWV0YUluZm9VcGRhdGVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV3RHMucmFpc2VFdmVudChldmVudExpc3QubWV0YUluZm9VcGRhdGUsIHt9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbmhlcml0IG1ldGFJbmZvc1xuICAgICAgICBmb3IgKGtleSBpbiBtZXRhSW5mbykge1xuICAgICAgICAgICAgTWV0YUNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICBtZXRhQ29uc3RyYWN0b3IucHJvdG90eXBlID0gbWV0YUluZm9ba2V5XTtcbiAgICAgICAgICAgIG1ldGFDb25zdHJhY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNZXRhQ29uc3RydWN0b3I7XG4gICAgICAgICAgICBuZXdEU0xpbmsubWV0YU9ialtrZXldID0gbmV3IE1ldGFDb25zdHJ1Y3RvcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYXR0YWNoZWQgZXZlbnQgbGlzdGVuZXIgb24gcGFyZW50IGRhdGFcbiAgICAgICAgYWRkTGlzdG5lcnMoZHMsIGlucHV0U3RvcmVMaXN0bmVycyk7XG4gICAgICAgIG5ld0RzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuXG4gICAgICAgIG5ld0RzLmFkZERhdGFQcm9jZXNzb3IoZmlsdGVycyk7XG4gICAgICAgIHJldHVybiBuZXdEcztcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGFkZCBwcm9jZXNzb3IgaW4gdGhlIGRhdGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5hZGREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKHByb2Nlc3NvcnMpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgaSxcbiAgICAgICAgbCxcbiAgICAgICAgcHJvY2Vzc29yLFxuICAgICAgICBzdG9yZU9iajtcbiAgICAgICAgLy8gaWYgc2luZ2xlIGZpbHRlciBpcyBwYXNzZWQgbWFrZSBpdCBhbiBBcnJheVxuICAgICAgICBpZiAoIShwcm9jZXNzb3JzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBwcm9jZXNzb3JzID0gW3Byb2Nlc3NvcnNdO1xuICAgICAgICB9XG4gICAgICAgIGwgPSBwcm9jZXNzb3JzLmxlbmd0aDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgcHJvY2Vzc29yID0gcHJvY2Vzc29yc1tpXTtcbiAgICAgICAgICAgIGlmIChwcm9jZXNzb3IgJiYgcHJvY2Vzc29yLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBzdG9yZU9iaiA9IGdldFByb2Nlc3NvclN0b3JlT2JqKHByb2Nlc3NvciwgZHMpO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgbGlzdG5lcnNcbiAgICAgICAgICAgICAgICBhZGRMaXN0bmVycyhwcm9jZXNzb3IsIHN0b3JlT2JqLmxpc3RuZXJzKTtcbiAgICAgICAgICAgICAgICBkcy5saW5rcy5wcm9jZXNzb3JzLnB1c2goc3RvcmVPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgb3V0cHV0RGF0YVxuICAgICAgICBkcy5fZ2VuZXJhdGVPdXRwdXREYXRhKCk7XG4gICAgfTtcbiAgICAvL0Z1bmN0aW9uIHRvIHJlbW92ZSBwcm9jZXNzb3IgaW4gdGhlIGRhdGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5yZW1vdmVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKHByb2Nlc3NvcnMpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgcHJvY2Vzc29yc1N0b3JlID0gZHMubGlua3MucHJvY2Vzc29ycyxcbiAgICAgICAgc3RvcmVPYmosXG4gICAgICAgIGksXG4gICAgICAgIGwsXG4gICAgICAgIGosXG4gICAgICAgIGssXG4gICAgICAgIHByb2Nlc3NvcixcbiAgICAgICAgZm91bmRNYXRjaDtcbiAgICAgICAgLy8gaWYgc2luZ2xlIGZpbHRlciBpcyBwYXNzZWQgbWFrZSBpdCBhbiBBcnJheVxuICAgICAgICBpZiAoIShwcm9jZXNzb3JzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBwcm9jZXNzb3JzID0gW3Byb2Nlc3NvcnNdO1xuICAgICAgICB9XG4gICAgICAgIGsgPSBwcm9jZXNzb3JzLmxlbmd0aDtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGs7IGogKz0gMSkge1xuICAgICAgICAgICAgcHJvY2Vzc29yID0gcHJvY2Vzc29yc1tqXTtcbiAgICAgICAgICAgIGwgPSBwcm9jZXNzb3JzU3RvcmUubGVuZ3RoO1xuICAgICAgICAgICAgZm91bmRNYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGwgJiYgIWZvdW5kTWF0Y2g7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHN0b3JlT2JqID0gcHJvY2Vzc29yc1N0b3JlW2ldO1xuICAgICAgICAgICAgICAgIGlmICAoc3RvcmVPYmogJiYgc3RvcmVPYmoucHJvY2Vzc29yID09PSBwcm9jZXNzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RuZXJzKHByb2Nlc3Nvciwgc3RvcmVPYmoubGlzdG5lcnMpO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHByZWNlc3NvciBzdG9yZSBPYmpcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc29yc1N0b3JlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBvdXRwdXREYXRhXG4gICAgICAgIGRzLl9nZW5lcmF0ZU91dHB1dERhdGEoKTtcbiAgICB9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gYWRkIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFTdG9yZSBsZXZlbC5cblx0RGF0YU1vZGVsUHJvdG8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFTdG9yZSBsZXZlbC5cbiAgICBEYXRhTW9kZWxQcm90by5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcblxuICAgIERhdGFNb2RlbFByb3RvLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YU9iaikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCh0eXBlLCBkYXRhT2JqLCB0aGlzKTtcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIGluIHRoZSBkYXRhIHN0b3JlXG5cdERhdGFNb2RlbFByb3RvLnNldERhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkcyA9IHRoaXMsXG5cdFx0XHRkYXRhVHlwZSA9IGRhdGFTcGVjcy5kYXRhVHlwZSxcblx0XHRcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdGNhbGxiYWNrSGVscGVyRm4gPSBmdW5jdGlvbiAoSlNPTkRhdGEpIHtcblx0XHRcdFx0ZHMubGlua3MuaW5wdXRKU09OID0gSlNPTkRhdGEuY29uY2F0KGRzLmxpbmtzLmlucHV0SlNPTiB8fCBbXSk7XG5cdFx0XHRcdGRzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soSlNPTkRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0aWYgKGRhdGFUeXBlID09PSAnY3N2Jykge1xuXHRcdFx0bXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5KHtcblx0XHRcdFx0c3RyaW5nIDogZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRcdGRlbGltaXRlciA6IGRhdGFTcGVjcy5kZWxpbWl0ZXIsXG5cdFx0XHRcdG91dHB1dEZvcm1hdCA6IGRhdGFTcGVjcy5vdXRwdXRGb3JtYXQsXG5cdFx0XHRcdGNhbGxiYWNrIDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYWxsYmFja0hlbHBlckZuKGRhdGFTb3VyY2UpO1xuXHRcdH1cblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSBhbGwgZGF0YSAobm90IHRoZSBkYXRhIGxpbmtlZCBmcm9tIHRoZSBwYXJlbnQpIGluIHRoZSBkYXRhIHN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8uY2xlYXJEYXRhID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBkcyA9IHRoaXM7XG4gICAgICAgIC8vIGNsZWFyIGlucHV0RGF0YSBzdG9yZVxuICAgICAgICBkcy5saW5rcy5pbnB1dERhdGEgJiYgKGRzLmxpbmtzLmlucHV0RGF0YS5sZW5ndGggPSAwKTtcbiAgICAgICAgLy8gcmUtZ2VuZXJhdGUgdGhlIHN0b3JlJ3MgZGF0YVxuICAgICAgICBkcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcbiAgICB9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gZGlzcG9zZSBhIHN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgZHMgPSB0aGlzLFxuICAgICAgICBsaW5rcyA9IGRzLmxpbmtzLFxuICAgICAgICBpbnB1dFN0b3JlID0gbGlua3MuaW5wdXRTdG9yZSxcbiAgICAgICAgcHJvY2Vzc29yc1N0b3JlID0gbGlua3MucHJvY2Vzc29ycyxcbiAgICAgICAgc3RvcmVPYmosXG4gICAgICAgIGk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGlub3V0U3RvcmUgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpbnB1dFN0b3JlICYmIGlucHV0U3RvcmUucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgcmVtb3ZlTGlzdG5lcnMoaW5wdXRTdG9yZSwgbGlua3MuaW5wdXRTdG9yZUxpc3RuZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBhbGwgZmlsdGVycyBhbmQgdGhpciBsaXN0ZW5lcnNcbiAgICAgICAgZm9yIChpID0gcHJvY2Vzc29yc1N0b3JlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgICAgICAgICBzdG9yZU9iaiA9IHByb2Nlc3NvcnNTdG9yZVtpXTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgICAgICAgICByZW1vdmVMaXN0bmVycyhzdG9yZU9iai5wcm9jZXNzb3IsIHN0b3JlT2JqLmxpc3RuZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzb3JzU3RvcmUubGVuZ3RoID0gMDtcblxuICAgICAgICAvLyByYWlzZSB0aGUgZXZlbnQgZm9yIE91dHB1dERhdGEgbW9kaWZpZWQgZXZlbnRcbiAgICAgICAgZHMucmFpc2VFdmVudChldmVudExpc3QubW9kZWxEZWxldGVkLCB7fSk7XG5cblxuICAgICAgICAvLyBAdG9kbzogZGVsZXRlIGFsbCBsaW5rc1xuXG4gICAgICAgIC8vIEB0b2RvOiBjbGVhciBhbGwgZXZlbnRzIGFzIHRoZXkgd2lsbCBub3QgYmUgdXNlZCBhbnkgbW9yZVxuXG4gICAgfTtcbiAgICAvLyBGdW50aW9uIHRvIGdldCBhbGwgdGhlIGtleXMgb2YgdGhlIEpTT04gZGF0YVxuICAgIC8vIEB0b2RvOiBuZWVkIHRvIGltcHJvdmUgaXQgZm9yIHBlcmZvcm1hbmNlIGFzIHdlbGwgYXMgZm9yIGJldHRlciByZXN1bHRzXG5cdERhdGFNb2RlbFByb3RvLmdldEtleXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRzID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkcy5nZXRKU09OKCksXG5cdFx0XHRmaXJzdERhdGEgPSBkYXRhWzBdIHx8IHt9O1xuXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKGZpcnN0RGF0YSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSB1bmlxdWUgdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXlcbiAgICAvLyBAdG9kbzogbmVlZCB0byBpbXByb3ZlIGl0IGZvciBwZXJmb3JtYW5jZSBhcyB3ZWxsIGFzIGZvciBiZXR0ZXIgcmVzdWx0c1xuXHREYXRhTW9kZWxQcm90by5nZXRVbmlxdWVWYWx1ZXMgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dmFyIGRzID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkcy5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0aXNBcnJheSA9IGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5LFxuXHRcdFx0Ly91bmlxdWVWYWx1ZXMgPSBkcy51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdC8vIGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHQvLyBcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0Ly8gfVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZHMuZ2V0S2V5cygpLmZpbmRJbmRleChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC50b1VwcGVyQ2FzZSgpID09PSBrZXkudG9VcHBlckNhc2UoKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGkgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IGlzQXJyYXkgPyAxIDogMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpbnRlcm5hbERhdGEgPSBpc0FycmF5ID8gZGF0YVtpXVtrZXldIDogZGF0YVtpXVtrZXldO1xuXHRcdFx0IXRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSAmJiAodGVtcFVuaXF1ZVZhbHVlc1tpbnRlcm5hbERhdGFdID0gdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKHRlbXBVbmlxdWVWYWx1ZXMpO1xuXHR9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gYWRkIC8gdXBkYXRlIG1ldGFkYXRhXG5cdERhdGFNb2RlbFByb3RvLnVwZGF0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgbWV0YUluZm8pIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgbWV0YU9iaiA9IGRzLmxpbmtzLm1ldGFPYmosXG4gICAgICAgIGZpZWxkTWV0YUluZm8sIGtleTtcblx0XHRpZiAoZmllbGRNZXRhSW5mbyA9IG1ldGFPYmpbZmllbGROYW1lXSkge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gbWV0YUluZm8pIHtcbiAgICAgICAgICAgICAgICBmaWVsZE1ldGFJbmZvW2tleV0gPSBtZXRhSW5mb1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRzLnJhaXNlRXZlbnQoZXZlbnRMaXN0Lm1ldGFJbmZvVXBkYXRlLCB7fSk7XG5cdH07XG4gICAgLy8gRnVuY3Rpb24gdG8gYWRkIG1ldGFkYXRhXG4gICAgLy8gTm90IHJlcXVpcmVkXG5cdC8vIERhdGFNb2RlbFByb3RvLmRlbGV0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgbWV0YUluZm9LZXkpIHtcbiAgICAvLyAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAvLyAgICAgbWV0YU9iaiA9IGRzLmxpbmtzLm1ldGFPYmo7XG4gICAgLy8gICAgIGlmIChtZXRhT2JqW2ZpZWxkTmFtZV0pIHtcbiAgICAvLyAgICAgICAgIG1ldGFPYmpbZmllbGROYW1lXVttZXRhSW5mb0tleV0gPSB1bmRlZmluZWQ7XG4gICAgLy8gICAgIH1cblx0Ly8gfTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGFkZGVkIG1ldGFEYXRhXG5cdERhdGFNb2RlbFByb3RvLmdldE1ldGFEYXRhID0gZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuXHRcdHZhciBkcyA9IHRoaXMsXG4gICAgICAgIG1ldGFPYmogPSBkcy5saW5rcy5tZXRhT2JqO1xuICAgICAgICByZXR1cm4gZmllbGROYW1lID8gKG1ldGFPYmpbZmllbGROYW1lXSB8fCB7fSkgOiBtZXRhT2JqO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIHRvIHRoZSBkYXRhU3RvcmFnZSBhc3luY2hyb25vdXNseSB2aWEgYWpheFxuICAgIERhdGFNb2RlbFByb3RvLnNldERhdGFVcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhU3RvcmUgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcbiAgICAgICAgICAgIGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBhcmd1bWVudC5kZWxpbWl0ZXIsXG4gICAgICAgICAgICBvdXRwdXRGb3JtYXQgPSBhcmd1bWVudC5vdXRwdXRGb3JtYXQsXG4gICAgICAgICAgICBjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuICAgICAgICAgICAgY2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8uYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBkYXRhU291cmNlLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRhdGFTdG9yZS5zZXREYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZSA6IGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlIDogZGF0YVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA6IGRlbGltaXRlcixcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNhbGxiYWNrQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUgPSB7fSxcblx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbmsgPSB7fSxcblx0XHRmaWx0ZXJJZENvdW50ID0gMCxcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSxcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSxcblx0XHRldmVudExpc3QgPSB7XG4gICAgICAgICAgICAnbW9kZWxVcGRhdGVkJzogJ21vZGVsdXBkYXRlZCcsXG4gICAgICAgICAgICAnbW9kZWxEZWxldGVkJzogJ21vZGVsZGVsZXRlZCcsXG4gICAgICAgICAgICAnbWV0YUluZm9VcGRhdGUnOiAnbWV0YWluZm91cGRhdGVkJyxcbiAgICAgICAgICAgICdwcm9jZXNzb3JVcGRhdGVkJzogJ3Byb2Nlc3NvcnVwZGF0ZWQnLFxuICAgICAgICAgICAgJ3Byb2Nlc3NvckRlbGV0ZWQnOiAncHJvY2Vzc29yZGVsZXRlZCdcbiAgICAgICAgfSxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVByb2Nlc3Nvci5cblx0XHREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuYWRkUnVsZShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0XG5cdFx0ZGF0YVByb2Nlc3NvclByb3RvID0gRGF0YVByb2Nlc3Nvci5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byB1cGRhdGUgZGF0YSBvbiBjaGFuZ2Ugb2YgZmlsdGVyLlxuXHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvciA9IGZ1bmN0aW9uIChpZCwgY29weVBhcmVudFRvQ2hpbGQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRkYXRhID0gZmlsdGVyTGlua1tpZF0sXG5cdFx0XHRcdEpTT05EYXRhLFxuXHRcdFx0XHRkYXR1bSxcblx0XHRcdFx0ZGF0YUlkLFxuXHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXR1bSA9IGRhdGFbaV07XG5cdFx0XHRcdGRhdGFJZCA9IGRhdHVtLmlkO1xuXHRcdFx0XHRpZiAoIWxpYi50ZW1wRGF0YVVwZGF0ZWRbZGF0YUlkXSkge1xuXHRcdFx0XHRcdGlmIChwYXJlbnRTdG9yZVtkYXRhSWRdICYmIGRhdGFTdG9yYWdlW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRcdEpTT05EYXRhID0gcGFyZW50U3RvcmVbZGF0YUlkXS5nZXREYXRhKCk7XG5cdFx0XHRcdFx0XHRkYXR1bS5tb2RpZnlEYXRhKGNvcHlQYXJlbnRUb0NoaWxkID8gSlNPTkRhdGEgOiBmaWx0ZXJTdG9yZVtpZF0oSlNPTkRhdGEpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgcGFyZW50U3RvcmVbZGF0YUlkXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVByb2Nlc3Nvcihhcmd1bWVudHNbMF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBmaWx0ZXIgaW4gdGhlIGZpbHRlciBzdG9yZVxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdG9sZElkID0gZmlsdGVyLmlkLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRmaWx0ZXJGbiA9IChhcmd1bWVudCAmJiBhcmd1bWVudC5ydWxlKSB8fCBhcmd1bWVudCxcblx0XHRcdGlkID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZSxcblx0XHRcdHR5cGUgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlO1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZmlsdGVyU3RvcmUnICsgZmlsdGVySWRDb3VudCArKztcblx0XHRmaWx0ZXJTdG9yZVtpZF0gPSBmaWx0ZXJGbjtcblxuXHRcdGZpbHRlci5pZCA9IGlkO1xuXHRcdGZpbHRlci50eXBlID0gdHlwZTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgZGF0YSBvbiB3aGljaCB0aGUgZmlsdGVyIGlzIGFwcGxpZWQgYW5kIGFsc28gb24gdGhlIGNoaWxkIGRhdGEuXG5cdFx0aWYgKGZpbHRlckxpbmtbaWRdKSB7XG5cdFx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQpO1xuXHRcdH1cblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KGV2ZW50TGlzdC5wcm9jZXNzb3JVcGRhdGVkLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IGZpbHRlckZuXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCB0aGUgZmlsdGVyIG1ldGhvZC5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldFByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZmlsdGVyU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBJRCBvZiB0aGUgZmlsdGVyLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnRMaXN0LnByb2Nlc3NvckRlbGV0ZWQsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2ZpbHRlcidcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5zb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnc29ydCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5tYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdtYXAnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0UHJvY2Vzc2VkRGF0YSA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdHZhciBkYXRhUHJvY2Vzc29yID0gdGhpcyxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRmaWx0ZXJGbiA9IGRhdGFQcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGNhc2UgICdmaWx0ZXInIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuICAgICAgICAgICAgY2FzZSAnbWFwJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIFxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhUHJvY2Vzc29yIGxldmVsLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFQcm9jZXNzb3IgbGV2ZWwuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YU9iaikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCh0eXBlLCBkYXRhT2JqLCB0aGlzKTtcblx0fTtcblxufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMixcbiAgICAgICAgTlVMTCA9IG51bGwsXG4gICAgICAgIENPTE9SID0gJ2NvbG9yJyxcbiAgICAgICAgUEFMRVRURUNPTE9SUyA9ICdwYWxldHRlQ29sb3JzJztcbiAgICAvL2Z1bmN0aW9uIHRvIGNvbnZlcnQgZGF0YSwgaXQgcmV0dXJucyBmYyBzdXBwb3J0ZWQgSlNPTlxuICAgIHZhciBEYXRhQWRhcHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YWFkYXB0ZXIgPSB0aGlzO1xuXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZSA9IGFyZ3VtZW50LmRhdGFzdG9yZTsgICAgICAgXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFKU09OID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlICYmIGRhdGFhZGFwdGVyLmRhdGFTdG9yZS5nZXRKU09OKCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24gPSBhcmd1bWVudC5jb25maWc7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNhbGxiYWNrID0gYXJndW1lbnQuY2FsbGJhY2s7XG4gICAgICAgIGRhdGFhZGFwdGVyLkZDanNvbiA9IGRhdGFhZGFwdGVyLmNvbnZlcnREYXRhKCk7XG4gICAgfSxcbiAgICBwcm90b0RhdGFhZGFwdGVyID0gRGF0YUFkYXB0ZXIucHJvdG90eXBlO1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5jb252ZXJ0RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLCAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdncmVnYXRlZERhdGEsXG4gICAgICAgICAgICBnZW5lcmFsRGF0YSxcbiAgICAgICAgICAgIGpzb24gPSB7fSxcbiAgICAgICAgICAgIHByZWRlZmluZWRKc29uID0ge30sXG4gICAgICAgICAgICBqc29uRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFKU09OLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjYWxsYmFjayA9IGRhdGFhZGFwdGVyLmNhbGxiYWNrLFxuICAgICAgICAgICAgaXNNZXRhRGF0YSA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiAoZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldE1ldGFEYXRhKCkgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YSA9IGRhdGFhZGFwdGVyLmdlbmVyYWxEYXRhRm9ybWF0KGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhIHx8IGdlbmVyYWxEYXRhO1xuICAgICAgICAgICAgZGF0YWFkYXB0ZXIuYWdncmVnYXRlZERhdGEgPSBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIGpzb24gPSBkYXRhYWRhcHRlci5qc29uQ3JlYXRvcihhZ2dyZWdhdGVkRGF0YSwgY29uZmlndXJhdGlvbik7ICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAganNvbiA9IChwcmVkZWZpbmVkSnNvbiAmJiBleHRlbmQyKGpzb24scHJlZGVmaW5lZEpzb24pKSB8fCBqc29uO1xuICAgICAgICBqc29uID0gKGNhbGxiYWNrICYmIGNhbGxiYWNrKGpzb24pKSB8fCBqc29uO1xuICAgICAgICByZXR1cm4gaXNNZXRhRGF0YSA/IGRhdGFhZGFwdGVyLnNldERlZmF1bHRBdHRyKGpzb24pIDoganNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRTb3J0ZWREYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNhdGVnb3J5QXJyLCBkaW1lbnNpb24sIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGluZGVveE9mS2V5LFxuICAgICAgICAgICAgbmV3RGF0YSA9IFtdLFxuICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdLFxuICAgICAgICAgICAga2V5ID0gW10sXG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgICAgICBsZW5LZXksXG4gICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgbGVuQ2F0LFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgYXJyID0gW10sXG4gICAgICAgICAgICBkYXRhU3RvcmUgPSBkYXRhYWRhcHRlci5kYXRhU3RvcmU7XG4gIFxuICAgICAgICAoQXJyYXkuaXNBcnJheShkaW1lbnNpb24pICYmIChrZXkgPSBkaW1lbnNpb24pKSB8fCAoa2V5ID0gW2RpbWVuc2lvbl0pO1xuXG4gICAgICAgIChjYXRlZ29yeUFyciAmJiAhY2F0ZWdvcnlBcnIubGVuZ3RoKSB8fCAoY2F0ZWdvcnlBcnIgPSBkYXRhU3RvcmUuZ2V0VW5pcXVlVmFsdWVzKGtleVswXSkpO1xuICAgICAgICAoQXJyYXkuaXNBcnJheShjYXRlZ29yeUFyclswXSkgJiYgKGNhdGVnb3JpZXMgPSBjYXRlZ29yeUFycikpIHx8IChjYXRlZ29yaWVzID0gW2NhdGVnb3J5QXJyXSk7XG5cbiAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbMF0pO1xuICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgaW5kZW94T2ZLZXkgPSBkYXRhWzBdLmluZGV4T2Yoa2V5W2tdKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yKGkgPSAwLGxlbkNhdCA9IGNhdGVnb3JpZXNba10ubGVuZ3RoOyBpIDwgbGVuQ2F0ICAmJiBpbmRlb3hPZktleSAhPT0gLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBkYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAoZGF0YVtqXVtpbmRlb3hPZktleV0gPT0gY2F0ZWdvcmllc1trXVtpXSkgJiYgKHN1YlNldERhdGEucHVzaChkYXRhW2pdKSk7XG4gICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgYXJyW2luZGVveE9mS2V5XSA9IGNhdGVnb3JpZXNba11baV07XG4gICAgICAgICAgICAgICAgKHN1YlNldERhdGEubGVuZ3RoID09PSAwKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGFycikpO1xuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVEYXRhKHN1YlNldERhdGEsIGNhdGVnb3JpZXNba11baV0sIGFnZ3JlZ2F0ZU1vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLnNldERlZmF1bHRBdHRyID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9ICcnLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLFxuICAgICAgICAgICAgY29uZiA9IGRhdGFhZGFwdGVyICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZiAmJiBjb25mLm1lYXN1cmUgfHwgW10sXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSxcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbMF1dICYmIG1ldGFEYXRhW21lYXN1cmVbMF1dO1xuICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIChwYWxldHRlQ29sb3JzID0gcGFsZXR0ZUNvbG9ycyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gaW5zdGFuY2VvZiBGdW5jdGlvbikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0W1BBTEVUVEVDT0xPUlNdID0gcGFsZXR0ZUNvbG9ycztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4gPSBqc29uLmRhdGFzZXQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlID0gbWV0YURhdGFbbWVhc3VyZVtpXV0gJiYgbWV0YURhdGFbbWVhc3VyZVtpXV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKGpzb24uZGF0YXNldFtpXVtDT0xPUl0gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChtZXRhRGF0YU1lYXN1cmVbQ09MT1JdIGluc3RhbmNlb2YgRnVuY3Rpb24pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmICgobWV0YURhdGFNZWFzdXJlW0NPTE9SXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgJiYgKGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0ucGxvdFtDT0xPUl0gPSBjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHNlcmllc1R5cGUgPSBzZXJpZXNUeXBlICYmIHNlcmllc1R5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgc2VyaWVzVHlwZSA9IChzZXJpZXNbc2VyaWVzVHlwZV0gJiYgc2VyaWVzVHlwZSkgfHwgJ21zJztcblxuICAgICAgICBqc29uLmNoYXJ0IHx8IChqc29uLmNoYXJ0ID0ge30pO1xuICAgICAgICBcbiAgICAgICAga2V5RXhjbHVkZWRKc29uU3RyID0gKG1ldGFEYXRhICYmIEpTT04uc3RyaW5naWZ5KGpzb24sIGZ1bmN0aW9uKGssdil7XG4gICAgICAgICAgICBpZihrID09ICdjb2xvcicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTlVMTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9KSkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICAgIGpzb24gPSAoa2V5RXhjbHVkZWRKc29uU3RyICYmIEpTT04ucGFyc2Uoa2V5RXhjbHVkZWRKc29uU3RyKSkgfHwganNvbjtcblxuICAgICAgICBzZXJpZXNbc2VyaWVzVHlwZV0oKTtcblxuICAgICAgICByZXR1cm4ganNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEsIGtleSwgYWdncmVnYXRlTW9kZSkge1xuICAgICAgICB2YXIgYWdncmVnYXRlTWV0aG9kID0ge1xuICAgICAgICAgICAgJ3N1bScgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IGRhdGFbMF07XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAxLCBsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChkYXRhW2ldW2pdICE9IGtleSkgJiYgKGFnZ3JlZ2F0ZWREYXRhW2pdID0gTnVtYmVyKGFnZ3JlZ2F0ZWREYXRhW2pdKSArIE51bWJlcihkYXRhW2ldW2pdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdhdmVyYWdlJyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBpQWdncmVnYXRlTXRoZCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGxlblIgPSBkYXRhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFN1bUFyciA9IGlBZ2dyZWdhdGVNdGhkLnN1bSgpLFxuICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBhZ2dyZWdhdGVkU3VtQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgKChhZ2dyZWdhdGVkU3VtQXJyW2ldICE9IGtleSkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAoYWdncmVnYXRlZERhdGFbaV0gPSAoTnVtYmVyKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pKSAvIGxlblIpKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYWdncmVnYXRlTW9kZSA9IGFnZ3JlZ2F0ZU1vZGUgJiYgYWdncmVnYXRlTW9kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gKGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSAmJiBhZ2dyZWdhdGVNb2RlKSB8fCAnc3VtJztcblxuICAgICAgICByZXR1cm4gYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdKCk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2VuZXJhbERhdGFGb3JtYXQgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoanNvbkRhdGFbMF0pLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheSA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBsZW5HZW5lcmFsRGF0YUFycmF5LFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBkaW1lbnNpb24gPSBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiB8fCBbXSxcbiAgICAgICAgICAgIG1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUgfHwgW107XG4gICAgICAgIGlmICghaXNBcnJheSl7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gW107XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdLnB1c2goZGltZW5zaW9uKTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChtZWFzdXJlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGpzb25EYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuR2VuZXJhbERhdGFBcnJheSA9IGdlbmVyYWxEYXRhQXJyYXlbMF0ubGVuZ3RoOyBqIDwgbGVuR2VuZXJhbERhdGFBcnJheTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbaV1bZ2VuZXJhbERhdGFBcnJheVswXVtqXV07ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdW2pdID0gdmFsdWUgfHwgJyc7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBqc29uRGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VuZXJhbERhdGFBcnJheTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5qc29uQ3JlYXRvciA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBjb25mID0gY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnbXMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNhdGVnb3JpZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NhdGVnb3J5JzogWyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllc1swXS5jYXRlZ29yeS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRbaV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzZXJpZXNuYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXS5kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdzcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVswXSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hMYWJlbF07ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hWYWx1ZV07IFxuICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsYWJlbCcgOiBsYWJlbCB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDogdmFsdWUgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICd0cycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbkRpbWVuc2lvbiA9ICBjb25maWd1cmF0aW9uLmRpbWVuc2lvbi5sZW5ndGg7IGkgPCBsZW5EaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkuZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldID0geyAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduYW1lJyA6IGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0uZGF0YS5wdXNoKGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzZXJpZXNUeXBlID0gKHNlcmllc1tzZXJpZXNUeXBlXSAmJiBzZXJpZXNUeXBlKSB8fCAnbXMnO1xuICAgICAgICByZXR1cm4gY29uZi5tZWFzdXJlICYmIGNvbmYuZGltZW5zaW9uICYmIHNlcmllc1tzZXJpZXNUeXBlXShqc29uRGF0YSwgY29uZik7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RkNqc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLkZDanNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhSnNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhSlNPTjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVkRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGVkRGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREaW1lbnNpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbi5kaW1lbnNpb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLm1lYXN1cmU7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TGltaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIG1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgICAgIG1pbiA9ICtJbmZpbml0eSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspe1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIHZhbHVlID0gK2RhdGFbaV1bal07XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1heCA9IG1heCA8IHZhbHVlID8gdmFsdWUgOiBtYXgpO1xuICAgICAgICAgICAgICAgIHZhbHVlICYmIChtaW4gPSBtaW4gPiB2YWx1ZSA/IHZhbHVlIDogbWluKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ21pbicgOiBtaW4sXG4gICAgICAgICAgICAnbWF4JyA6IG1heFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmhpZ2hsaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA9IGFyZ3VtZW50c1swXSAmJiBhcmd1bWVudHNbMF0udG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNhdGVnb3J5QXJyID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLFxuICAgICAgICAgICAgaW5kZXggPSBjYXRlZ29yeUxhYmVsICYmIGNhdGVnb3J5QXJyLmluZGV4T2YoY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNoYXJ0LmRyYXdUcmVuZFJlZ2lvbihpbmRleCk7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFBZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFBZGFwdGVyKGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbn0pOyIsIiAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgQ2hhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdIHx8IHt9O1xuXG4gICAgICAgICAgICBjaGFydC5kYXRhU3RvcmVKc29uID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXREYXRhSnNvbigpO1xuICAgICAgICAgICAgY2hhcnQuZGltZW5zaW9uID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXREaW1lbnNpb24oKTtcbiAgICAgICAgICAgIGNoYXJ0Lm1lYXN1cmUgPSBhcmd1bWVudC5jb25maWd1cmF0aW9uLmdldE1lYXN1cmUoKTtcbiAgICAgICAgICAgIGNoYXJ0LmFnZ3JlZ2F0ZWREYXRhID0gYXJndW1lbnQuY29uZmlndXJhdGlvbi5nZXRBZ2dyZWdhdGVkRGF0YSgpO1xuICAgICAgICAgICAgY2hhcnQucmVuZGVyKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNoYXJ0UHJvdG8gPSBDaGFydC5wcm90b3R5cGUsXG4gICAgICAgIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMixcbiAgICAgICAgZ2V0Um93RGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGFnZ3JlZ2F0ZWREYXRhLCBkaW1lbnNpb24sIG1lYXN1cmUsIGtleSkge1xuICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgICAgIGssXG4gICAgICAgICAgICAgICAga2ssXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0pLFxuICAgICAgICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgICAgICAgbWF0Y2hPYmogPSB7fSxcbiAgICAgICAgICAgICAgICBpbmRleE9mRGltZW5zaW9uID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihkaW1lbnNpb25bMF0pO1xuICAgICAgICBcbiAgICAgICAgICAgIGZvcihsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpc0FycmF5ICYmIChpbmRleCA9IGRhdGFbaV0uaW5kZXhPZihrZXkpKTtcbiAgICAgICAgICAgICAgICBpZihpbmRleCAhPT0gLTEgJiYgaXNBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IobCA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgbCA8IGxlbkM7IGwrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialtkYXRhWzBdW2xdXSA9IGRhdGFbaV1bbF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW4gPSBtZWFzdXJlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFnZ3JlZ2F0ZWREYXRhWzBdLmluZGV4T2YobWVhc3VyZVtqXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBrayA9IGFnZ3JlZ2F0ZWREYXRhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleE9mRGltZW5zaW9uXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmpbbWVhc3VyZVtqXV0gPSBhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaE9iajtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZighaXNBcnJheSAmJiBkYXRhW2ldW2RpbWVuc2lvblswXV0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqID0gZGF0YVtpXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGNoYXJ0UHJvdG8ucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBkYXRhQWRhcHRlck9iaiA9IGFyZ3VtZW50LmNvbmZpZ3VyYXRpb24gfHwge30sXG4gICAgICAgICAgICBjaGFydE9iajtcblxuICAgICAgICAvL2dldCBmYyBzdXBwb3J0ZWQganNvbiAgICAgICAgICAgIFxuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTsgICAgICAgIFxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnRPYmogPSBjaGFydC5jaGFydE9iaiA9IG5ldyBGdXNpb25DaGFydHMoY2hhcnQuY2hhcnRDb25maWcpO1xuICAgICAgICBjaGFydE9iai5yZW5kZXIoKTtcblxuICAgICAgICBkYXRhQWRhcHRlck9iai5jaGFydCA9IGNoYXJ0T2JqO1xuICAgICAgICBcbiAgICAgICAgY2hhcnRPYmouYWRkRXZlbnRMaXN0ZW5lcigndHJlbmRSZWdpb25Sb2xsT3ZlcicsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICB2YXIgZGF0YU9iaiA9IGdldFJvd0RhdGEoY2hhcnQuZGF0YVN0b3JlSnNvbiwgY2hhcnQuYWdncmVnYXRlZERhdGEsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LmRpbWVuc2lvbiwgY2hhcnQubWVhc3VyZSwgZC5jYXRlZ29yeUxhYmVsKTtcbiAgICAgICAgICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLnJhaXNlRXZlbnQoJ2hvdmVyaW4nLCB7XG4gICAgICAgICAgICAgICAgZGF0YSA6IGRhdGFPYmosXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA6IGQuY2F0ZWdvcnlMYWJlbFxuICAgICAgICAgICAgfSwgY2hhcnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjaGFydE9iai5hZGRFdmVudExpc3RlbmVyKCd0cmVuZFJlZ2lvblJvbGxPdXQnLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUucmFpc2VFdmVudCgnaG92ZXJvdXQnLCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA6IGQuY2F0ZWdvcnlMYWJlbFxuICAgICAgICAgICAgfSwgY2hhcnQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY2hhcnRQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgYXJndW1lbnQgPWFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyT2JqLFxuICAgICAgICAgICAgY2hhcnRDb25maWcgPSB7fSxcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgPSB7fTtcbiAgICAgICAgLy9wYXJzZSBhcmd1bWVudCBpbnRvIGNoYXJ0Q29uZmlnIFxuICAgICAgICBleHRlbmQyKGNoYXJ0Q29uZmlnLGFyZ3VtZW50KTtcbiAgICAgICAgXG4gICAgICAgIC8vZGF0YUFkYXB0ZXJPYmogXG4gICAgICAgIGRhdGFBZGFwdGVyT2JqID0gYXJndW1lbnQuY29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgICAgICAvL3N0b3JlIGZjIHN1cHBvcnRlZCBqc29uIHRvIHJlbmRlciBjaGFydHNcbiAgICAgICAgZGF0YVNvdXJjZSA9IGRhdGFBZGFwdGVyT2JqLmdldEZDanNvbigpO1xuXG4gICAgICAgIC8vZGVsZXRlIGRhdGEgY29uZmlndXJhdGlvbiBwYXJ0cyBmb3IgRkMganNvbiBjb252ZXJ0ZXJcbiAgICAgICAgZGVsZXRlIGNoYXJ0Q29uZmlnLmNvbmZpZ3VyYXRpb247XG4gICAgICAgIFxuICAgICAgICAvL3NldCBkYXRhIHNvdXJjZSBpbnRvIGNoYXJ0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgY2hhcnRDb25maWcuZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgICAgIGNoYXJ0LmNoYXJ0Q29uZmlnID0gY2hhcnRDb25maWc7ICAgICAgICBcbiAgICB9O1xuXG4gICAgY2hhcnRQcm90by51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9YXJndW1lbnRzWzBdIHx8IHt9LFxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJPYmogPSBhcmd1bWVudC5jb25maWd1cmF0aW9uIHx8IHt9O1xuICAgICAgICBjaGFydC5nZXRKU09OKGFyZ3VtZW50KTtcbiAgICAgICAgaWYoY2hhcnQuY2hhcnRPYmouY2hhcnRUeXBlKCkgPT0gJ2F4aXMnKSB7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5kaXNwb3NlKCk7XG4gICAgICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0T2JqID0gbmV3IEZ1c2lvbkNoYXJ0cyhjaGFydC5jaGFydENvbmZpZyk7XG4gICAgICAgICAgICBjaGFydC5jaGFydE9iai5yZW5kZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0T2JqLmNoYXJ0VHlwZShjaGFydC5jaGFydENvbmZpZy50eXBlKTtcbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0T2JqLnNldEpTT05EYXRhKGNoYXJ0LmNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UpO1xuICAgICAgICB9XG4gICAgICAgIGRhdGFBZGFwdGVyT2JqLmNoYXJ0ID0gY2hhcnQuY2hhcnRPYmo7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENoYXJ0KGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbn0pOyIsIlxuXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGNyZWF0ZUNoYXJ0ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlQ2hhcnQsXG4gICAgICAgIGRvY3VtZW50ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luLmRvY3VtZW50LFxuICAgICAgICBQWCA9ICdweCcsXG4gICAgICAgIERJViA9ICdkaXYnLFxuICAgICAgICBFTVBUWV9TVFJJTkcgPSAnJyxcbiAgICAgICAgQUJTT0xVVEUgPSAnYWJzb2x1dGUnLFxuICAgICAgICBNQVhfUEVSQ0VOVCA9ICcxMDAlJyxcbiAgICAgICAgUkVMQVRJVkUgPSAncmVsYXRpdmUnLFxuICAgICAgICBJRCA9ICdpZC1mYy1tYy0nLFxuICAgICAgICBCT1JERVJfQk9YID0gJ2JvcmRlci1ib3gnO1xuXG4gICAgdmFyIENlbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG4gICAgICAgICAgICBjZWxsLmNvbnRhaW5lciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgY2VsbC5kcmF3KCk7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCAmJiBjZWxsLnJlbmRlckNoYXJ0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvQ2VsbCA9IENlbGwucHJvdG90eXBlO1xuXG4gICAgcHJvdG9DZWxsLmRyYXcgPSBmdW5jdGlvbiAoKXtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzO1xuICAgICAgICBjZWxsLmdyYXBoaWNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChESVYpO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmlkID0gY2VsbC5jb25maWcuaWQgfHwgRU1QVFlfU1RSSU5HOyAgICAgICAgXG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuaGVpZ2h0ID0gY2VsbC5jb25maWcuaGVpZ2h0ICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUud2lkdGggPSBjZWxsLmNvbmZpZy53aWR0aCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnRvcCA9IGNlbGwuY29uZmlnLnRvcCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmxlZnQgPSBjZWxsLmNvbmZpZy5sZWZ0ICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUucG9zaXRpb24gPSBBQlNPTFVURTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5ib3hTaXppbmcgPSBCT1JERVJfQk9YO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLmNsYXNzTmFtZSA9IGNlbGwuY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pbm5lckhUTUwgPSBjZWxsLmNvbmZpZy5odG1sIHx8IEVNUFRZX1NUUklORztcbiAgICAgICAgY2VsbC5jb250YWluZXIuYXBwZW5kQ2hpbGQoY2VsbC5ncmFwaGljcyk7XG4gICAgfTtcblxuICAgIHByb3RvQ2VsbC5yZW5kZXJDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzOyBcblxuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC5yZW5kZXJBdCA9IGNlbGwuY29uZmlnLmlkO1xuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC53aWR0aCA9IE1BWF9QRVJDRU5UO1xuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC5oZWlnaHQgPSBNQVhfUEVSQ0VOVDtcbiAgICAgIFxuICAgICAgICBpZihjZWxsLmNoYXJ0KSB7XG4gICAgICAgICAgICBjZWxsLmNoYXJ0LnVwZGF0ZShjZWxsLmNvbmZpZy5jaGFydCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsLmNoYXJ0ID0gY3JlYXRlQ2hhcnQoY2VsbC5jb25maWcuY2hhcnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjZWxsLmNoYXJ0O1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwudXBkYXRlID0gZnVuY3Rpb24gKG5ld0NvbmZpZykge1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXMsXG4gICAgICAgICAgICBpZCA9IGNlbGwuY29uZmlnLmlkO1xuXG4gICAgICAgIGlmKG5ld0NvbmZpZyl7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IG5ld0NvbmZpZztcbiAgICAgICAgICAgIGNlbGwuY29uZmlnLmlkID0gaWQ7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLmlkID0gY2VsbC5jb25maWcuaWQgfHwgRU1QVFlfU1RSSU5HOyAgICAgICAgXG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLmNsYXNzTmFtZSA9IGNlbGwuY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuaGVpZ2h0ID0gY2VsbC5jb25maWcuaGVpZ2h0ICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUudG9wID0gY2VsbC5jb25maWcudG9wICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmxlZnQgPSBjZWxsLmNvbmZpZy5sZWZ0ICsgUFg7XG4gICAgICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgICAgICAhY2VsbC5jb25maWcuY2hhcnQgJiYgKGNlbGwuZ3JhcGhpY3MuaW5uZXJIVE1MID0gY2VsbC5jb25maWcuaHRtbCB8fCBFTVBUWV9TVFJJTkcpO1xuICAgICAgICAgICAgY2VsbC5jb250YWluZXIuYXBwZW5kQ2hpbGQoY2VsbC5ncmFwaGljcyk7XG4gICAgICAgICAgICBpZihjZWxsLmNvbmZpZy5jaGFydCkge1xuICAgICAgICAgICAgICAgIGNlbGwuY2hhcnQgPSBjZWxsLnJlbmRlckNoYXJ0KCk7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY2VsbC5jaGFydDtcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0gIFxuICAgICAgICByZXR1cm4gY2VsbDsgICAgICBcbiAgICB9O1xuXG4gICAgdmFyIE1hdHJpeCA9IGZ1bmN0aW9uIChzZWxlY3RvciwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXM7XG4gICAgICAgICAgICBtYXRyaXguc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgICAgICAgIC8vbWF0cml4IGNvbnRhaW5lclxuICAgICAgICAgICAgbWF0cml4Lm1hdHJpeENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIG1hdHJpeC5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0SCA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0VyA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kaXNwb3NhbEJveCA9IFtdO1xuICAgICAgICAgICAgLy9kaXNwb3NlIG1hdHJpeCBjb250ZXh0XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zZSgpO1xuICAgICAgICAgICAgLy9zZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lciBcbiAgICAgICAgICAgIG1hdHJpeC5zZXRBdHRyQ29udGFpbmVyKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvTWF0cml4ID0gTWF0cml4LnByb3RvdHlwZSxcbiAgICAgICAgY2hhcnRJZCA9IDA7XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBzdHlsZSwgYXR0ciBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgcHJvdG9NYXRyaXguc2V0QXR0ckNvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyOyAgICAgICAgXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFJFTEFUSVZFO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uID0gZnVuY3Rpb24gKGhlaWdodEFyciwgd2lkdGhBcnIpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgICAgICB3aWR0aCA9IDAsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGhlaWdodEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IGhlaWdodEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gd2lkdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHdpZHRoICs9IHdpZHRoQXJyW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFBYO1xuICAgICAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArIFBYO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIGRyYXcgbWF0cml4XG4gICAgcHJvdG9NYXRyaXguZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FsQm94ID0gW107XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IG1hdHJpeCAmJiBtYXRyaXguY29uZmlndXJhdGlvbiB8fCB7fSxcbiAgICAgICAgICAgIC8vc3RvcmUgdmlydHVhbCBtYXRyaXggZm9yIHVzZXIgZ2l2ZW4gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IFtdLFxuICAgICAgICAgICAgcGFyZW50Q29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBjYWxsQmFjayA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV0gPSBbXTtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGNvbmZpZ01hbmFnZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICAvL3N0b3JlIGNlbGwgb2JqZWN0IGluIGxvZ2ljYWwgbWF0cml4IHN0cnVjdHVyZVxuICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSxwYXJlbnRDb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbWF0cml4LnBsYWNlSG9sZGVyID0gW107XG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IHBsYWNlSG9sZGVyO1xuICAgICAgICBjYWxsQmFjayAmJiBjYWxsQmFjaygpO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIG1hbmFnZSBtYXRyaXggZHJhd1xuICAgIHByb3RvTWF0cml4LmRyYXdNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgLy9zdG9yZSBtYXBwaW5nIG1hdHJpeCBiYXNlZCBvbiB0aGUgdXNlciBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBzaGFkb3dNYXRyaXggPSBtYXRyaXgubWF0cml4TWFuYWdlcihjb25maWd1cmF0aW9uKSwgICAgICAgICAgICBcbiAgICAgICAgICAgIGhlaWdodEFyciA9IG1hdHJpeC5nZXRSb3dIZWlnaHQoc2hhZG93TWF0cml4KSxcbiAgICAgICAgICAgIHdpZHRoQXJyID0gbWF0cml4LmdldENvbFdpZHRoKHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICBkcmF3TWFuYWdlck9iakFyciA9IFtdLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIG1hdHJpeFBvc1ggPSBtYXRyaXguZ2V0UG9zKHdpZHRoQXJyKSxcbiAgICAgICAgICAgIG1hdHJpeFBvc1kgPSBtYXRyaXguZ2V0UG9zKGhlaWdodEFyciksXG4gICAgICAgICAgICByb3dzcGFuLFxuICAgICAgICAgICAgY29sc3BhbixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgdG9wLFxuICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgY2hhcnQsXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgY29sO1xuICAgICAgICAvL2NhbGN1bGF0ZSBhbmQgc2V0IHBsYWNlaG9sZGVyIGluIHNoYWRvdyBtYXRyaXhcbiAgICAgICAgY29uZmlndXJhdGlvbiA9IG1hdHJpeC5zZXRQbGNIbGRyKHNoYWRvd01hdHJpeCwgY29uZmlndXJhdGlvbik7XG4gICAgICAgIC8vZnVuY3Rpb24gdG8gc2V0IGhlaWdodCwgd2lkdGggb24gbWF0cml4IGNvbnRhaW5lclxuICAgICAgICBtYXRyaXguc2V0Q29udGFpbmVyUmVzb2x1dGlvbihoZWlnaHRBcnIsIHdpZHRoQXJyKTtcbiAgICAgICAgLy9jYWxjdWxhdGUgY2VsbCBwb3NpdGlvbiBhbmQgaGVpaHQgYW5kIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgIFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnJbaV0gPSBbXTsgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4gfHwgMSk7XG4gICAgICAgICAgICAgICAgY29sc3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuIHx8IDEpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGFydCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jaGFydDtcbiAgICAgICAgICAgICAgICBodG1sID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmh0bWw7XG4gICAgICAgICAgICAgICAgcm93ID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXS5yb3cpO1xuICAgICAgICAgICAgICAgIGNvbCA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0uY29sKTtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbWF0cml4UG9zWFtjb2xdO1xuICAgICAgICAgICAgICAgIHRvcCA9IG1hdHJpeFBvc1lbcm93XTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IG1hdHJpeFBvc1hbY29sICsgY29sc3Bhbl0gLSBsZWZ0O1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IG1hdHJpeFBvc1lbcm93ICsgcm93c3Bhbl0gLSB0b3A7XG4gICAgICAgICAgICAgICAgaWQgPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmlkKSB8fCBtYXRyaXguaWRDcmVhdG9yKHJvdyxjb2wpO1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jbGFzc05hbWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnJbaV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRvcCAgICAgICA6IHRvcCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdCAgICAgIDogbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICAgIDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgICAgOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lIDogY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICBpZCAgICAgICAgOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgcm93c3BhbiAgIDogcm93c3BhbixcbiAgICAgICAgICAgICAgICAgICAgY29sc3BhbiAgIDogY29sc3BhbixcbiAgICAgICAgICAgICAgICAgICAgaHRtbCAgICAgIDogaHRtbCxcbiAgICAgICAgICAgICAgICAgICAgY2hhcnQgICAgIDogY2hhcnRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcmF3TWFuYWdlck9iakFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguaWRDcmVhdG9yID0gZnVuY3Rpb24oKXtcbiAgICAgICAgY2hhcnRJZCsrOyAgICAgICBcbiAgICAgICAgcmV0dXJuIElEICsgY2hhcnRJZDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0UG9zID0gIGZ1bmN0aW9uKHNyYyl7XG4gICAgICAgIHZhciBhcnIgPSBbXSxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuID0gc3JjICYmIHNyYy5sZW5ndGg7XG5cbiAgICAgICAgZm9yKDsgaSA8PSBsZW47IGkrKyl7XG4gICAgICAgICAgICBhcnIucHVzaChpID8gKHNyY1tpLTFdK2FycltpLTFdKSA6IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguc2V0UGxjSGxkciA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCwgY29uZmlndXJhdGlvbil7XG4gICAgICAgIHZhciByb3csXG4gICAgICAgICAgICBjb2wsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICBsZW5DO1xuXG4gICAgICAgIGZvcihpID0gMCwgbGVuUiA9IHNoYWRvd01hdHJpeC5sZW5ndGg7IGkgPCBsZW5SOyBpKyspeyBcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IHNoYWRvd01hdHJpeFtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIHJvdyA9IHNoYWRvd01hdHJpeFtpXVtqXS5pZC5zcGxpdCgnLScpWzBdO1xuICAgICAgICAgICAgICAgIGNvbCA9IHNoYWRvd01hdHJpeFtpXVtqXS5pZC5zcGxpdCgnLScpWzFdO1xuXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93ID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93ID09PSB1bmRlZmluZWQgPyBpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdztcbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2wgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2wgPT09IHVuZGVmaW5lZCA/IGogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRSb3dIZWlnaHQgPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICBoZWlnaHQgPSBbXSxcbiAgICAgICAgICAgIGN1cnJIZWlnaHQsXG4gICAgICAgICAgICBtYXhIZWlnaHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heEhlaWdodCA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtpXS5sZW5ndGg7IGogPCBsZW5Db2w7IGorKykge1xuICAgICAgICAgICAgICAgIGlmKHNoYWRvd01hdHJpeFtpXVtqXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJySGVpZ2h0ID0gc2hhZG93TWF0cml4W2ldW2pdLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gbWF4SGVpZ2h0IDwgY3VyckhlaWdodCA/IGN1cnJIZWlnaHQgOiBtYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGVpZ2h0W2ldID0gbWF4SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Q29sV2lkdGggPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBsZW5Sb3cgPSBzaGFkb3dNYXRyaXggJiYgc2hhZG93TWF0cml4Lmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNvbCxcbiAgICAgICAgICAgIHdpZHRoID0gW10sXG4gICAgICAgICAgICBjdXJyV2lkdGgsXG4gICAgICAgICAgICBtYXhXaWR0aDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2pdLmxlbmd0aDsgaSA8IGxlbkNvbDsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4V2lkdGggPSAwOyBqIDwgbGVuUm93OyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hhZG93TWF0cml4W2pdW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJXaWR0aCA9IHNoYWRvd01hdHJpeFtqXVtpXS53aWR0aDsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IG1heFdpZHRoIDwgY3VycldpZHRoID8gY3VycldpZHRoIDogbWF4V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2lkdGhbaV0gPSBtYXhXaWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgubWF0cml4TWFuYWdlciA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgc2hhZG93TWF0cml4ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgcm93U3BhbixcbiAgICAgICAgICAgIGNvbFNwYW4sXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIGRlZmF1bHRIID0gbWF0cml4LmRlZmF1bHRILFxuICAgICAgICAgICAgZGVmYXVsdFcgPSBtYXRyaXguZGVmYXVsdFcsXG4gICAgICAgICAgICBvZmZzZXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJvd1NwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4pIHx8IDE7XG4gICAgICAgICAgICAgICAgY29sU3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbikgfHwgMTsgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aWR0aCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ud2lkdGgpO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gKHdpZHRoICYmICh3aWR0aCAvIGNvbFNwYW4pKSB8fCBkZWZhdWx0VztcbiAgICAgICAgICAgICAgICB3aWR0aCA9ICt3aWR0aC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IChoZWlnaHQgJiYgKGhlaWdodCAvIHJvd1NwYW4pKSB8fCBkZWZhdWx0SDsgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gK2hlaWdodC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMCwgb2Zmc2V0ID0gMDsgayA8IHJvd1NwYW47IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGwgPSAwOyBsIDwgY29sU3BhbjsgbCsrKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga10gPSBzaGFkb3dNYXRyaXhbaSArIGtdID8gc2hhZG93TWF0cml4W2kgKyBrXSA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gaiArIGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgOiAoaSArICctJyArIGopLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNoYWRvd01hdHJpeDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0QmxvY2sgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIgPSBwbGFjZUhvbGRlci5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChwbGFjZUhvbGRlcltpXVtqXS5jb25maWcuaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBsYWNlSG9sZGVyW2ldW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC51cGRhdGUgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguZHJhd01hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBsZW5Db25maWdSLFxuICAgICAgICAgICAgbGVuQ29uZmlnQyxcbiAgICAgICAgICAgIGxlblBsYWNlSGxkclIsXG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJDLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lciwgICAgICAgICAgICBcbiAgICAgICAgICAgIHJlY3ljbGVkQ2VsbDtcblxuICAgICAgICB3aGlsZShjb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoY29udGFpbmVyLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZW5QbGFjZUhsZHJSID0gcGxhY2VIb2xkZXIubGVuZ3RoO1xuXG4gICAgICAgIGZvcihpID0gbGVuUGxhY2VIbGRyUiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZW5QbGFjZUhsZHJDID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGogPSBsZW5QbGFjZUhsZHJDIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpZihwbGFjZUhvbGRlcltpXVtqXS5jaGFydCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBtYXRyaXguZGlzcG9zYWxCb3guY29uY2F0KHBsYWNlSG9sZGVyW2ldLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGxhY2VIb2xkZXJbaV1bal07XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYWNlSG9sZGVyLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5Db25maWdSID0gY29uZmlnTWFuYWdlci5sZW5ndGg7IGkgPCBsZW5Db25maWdSOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkNvbmZpZ0MgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkNvbmZpZ0M7IGorKykge1xuICAgICAgICAgICAgICAgIGlmKGNvbmZpZ01hbmFnZXJbaV1bal0uY2hhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjeWNsZWRDZWxsID0gbWF0cml4LmRpc3Bvc2FsQm94LnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZWN5Y2xlZENlbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gcmVjeWNsZWRDZWxsLnVwZGF0ZShjb25maWdNYW5hZ2VyW2ldW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdID0gbmV3IENlbGwoY29uZmlnTWFuYWdlcltpXVtqXSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBub2RlICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgbGVuUjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gcGxhY2VIb2xkZXIgJiYgcGxhY2VIb2xkZXIubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0gJiYgcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQgJiYgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmogJiYgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSAnMHB4JztcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhcmd1bWVudHNbMF0sYXJndW1lbnRzWzFdKTtcbiAgICB9O1xufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcbiAgICBcbiAgICAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG4gICAgdmFyIGdsb2JhbCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBnbG9iYWwud2luLFxuXG4gICAgICAgIG9iamVjdFByb3RvVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBhcnJheVRvU3RyaW5nSWRlbnRpZmllciA9IG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChbXSksXG4gICAgICAgIGlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKG9iaikgPT09IGFycmF5VG9TdHJpbmdJZGVudGlmaWVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEEgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGFic3RyYWN0aW9uIGxheWVyIHNvIHRoYXQgdGhlIHRyeS1jYXRjaCAvXG4gICAgICAgIC8vIGVycm9yIHN1cHByZXNzaW9uIG9mIGZsYXNoIGNhbiBiZSBhdm9pZGVkIHdoaWxlIHJhaXNpbmcgZXZlbnRzLlxuICAgICAgICBtYW5hZ2VkRm5DYWxsID0gZnVuY3Rpb24gKGl0ZW0sIHNjb3BlLCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gV2UgY2hhbmdlIHRoZSBzY29wZSBvZiB0aGUgZnVuY3Rpb24gd2l0aCByZXNwZWN0IHRvIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IHRoYXQgcmFpc2VkIHRoZSBldmVudC5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXRlbVswXS5jYWxsKHNjb3BlLCBldmVudCwgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgYWxsIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBpbnZva2VkIHVwb24gdHJpZ2dlclxuICAgICAgICAvLyBvZiBhbiBldmVudC5cbiAgICAgICAgc2xvdExvYWRlciA9IGZ1bmN0aW9uIChzbG90LCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlcy5cbiAgICAgICAgICAgIHZhciBpID0gMCwgc2NvcGU7XG5cbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgbG9vayBmb3IgbWF0Y2ggd2l0aCByZXNwZWN0IHRvXG4gICAgICAgICAgICAvLyB0eXBlIGFuZCBiaW5kaW5nLlxuICAgICAgICAgICAgZm9yICg7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoIGZvdW5kIHcuci50LiB0eXBlIGFuZCBiaW5kLCB3ZSBmaXJlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgfHwgc2xvdFtpXVsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBzZW5kZXIgb2YgdGhlIGV2ZW50IGZvciBnbG9iYWwgZXZlbnRzLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlIG9mIHNjb3BlIGRpZmZlcmVzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xvYmFsIG9yIGEgbG9jYWwgZXZlbnQgaXMgYmVpbmcgcmFpc2VkLlxuICAgICAgICAgICAgICAgICAgICBzY29wZSA9IHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciA/XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zZW5kZXIgOiBnbG9iYWw7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEZuQ2FsbChzbG90W2ldLCBzY29wZSwgZXZlbnQsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIHdhbnRlZCB0byBkZXRhY2ggdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kZXRhY2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kZXRhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBwcm9wYWdhdGlvbiBmbGFnIGlzIHNldCB0byBmYWxzZSBhbmQgZGlzY29udG51ZVxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpZiBuZWVkZWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNhbmNlbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXZlbnRNYXAgPSB7XG4gICAgICAgICAgICBob3ZlcmluIDogJ3RyZW5kUmVnaW9uUm9sbE92ZXInLFxuICAgICAgICAgICAgaG92ZXJvdXQgOiAndHJlbmRSZWdpb25Sb2xsT3V0JyxcbiAgICAgICAgICAgIGNsaWsgOiAnZGF0YXBsb3RjbGljaydcbiAgICAgICAgfSxcbiAgICAgICAgcmFpc2VFdmVudCxcblxuICAgICAgICBFdmVudFRhcmdldCA9IHtcblxuICAgICAgICAgICAgdW5wcm9wYWdhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmNhbmNlbGxlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXRhY2hlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kZXRhY2hlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRlZmF1bHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5wcmV2ZW50ZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpcmUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMuXG4gICAgICAgICAgICBsaXN0ZW5lcnM6IHt9LFxuXG4gICAgICAgICAgICAvLyBUaGUgbGFzdCByYWlzZWQgZXZlbnQgaWQuIEFsbG93cyB0byBjYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgaWQuXG4gICAgICAgICAgICBsYXN0RXZlbnRJZDogMCxcblxuICAgICAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlY3Vyc2VSZXR1cm4sXG4gICAgICAgICAgICAgICAgICAgIEZDRXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpO1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuLnB1c2goRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZVJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSBhZGRlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBoYXMgbm90IGJlZW4gcHJvdmlkZWQgd2hpbGUgYWRkaW5nIGFuIGV2ZW50IGxpc3RlbmVyLiBFbnN1cmUgdGhhdCB5b3UgcGFzcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIGBzdHJpbmdgIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgb2Yge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NDlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NDknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEl0IHdpbGwgbm90IGV2YWwgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTUwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTUwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zZXJ0aW9uIHBvc2l0aW9uIGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgdGhlbiBjcmVhdGUgb25lLlxuICAgICAgICAgICAgICAgIGlmICghKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ucHVzaChbbGlzdGVuZXIsIGJpbmRdKTtcblxuICAgICAgICAgICAgICAgIC8vIEV2ZW50cyBvZiBmdXNpb25DaGFydCByYWlzZWQgdmlhIE11bHRpQ2hhcnRpbmcuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xufSk7Il19

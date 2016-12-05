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
        deepCopy = function (obj) {
            var out,
                i,
                len = obj.length;
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                out = [];
                for ( i = 0 ; i < len; i++ ) {
                    out[i] = deepCopy(obj[i]);
                }
                return out;
            }
            if (typeof obj === 'object') {
                out = {};
                for ( i in obj ) {
                    out[i] = deepCopy(obj[i]);
                }
                return out;
            }
            return obj;
        },
        lib = {
            extend2: extend2,
            merge: merge,
            deepCopy : deepCopy
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

    MultiChartingProto.convertToArray = function (data, delimiter, outputFormat, synchronousParse, callback) {
        var csvToArr = this;
        if (typeof data === 'object') {
            delimiter = data.delimiter;
            outputFormat = data.outputFormat;
            callback = data.callback;
            synchronousParse = data.synchronousParse;
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
                    synchronousParse ? updateManager() : setTimeout(updateManager, 0);
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

        callbackHelperFn = function (ds, JSONData, callback) {
            ds.links.inputJSON = JSONData.concat(ds.links.inputJSON || []);
            ds._generateInputData();
            if (typeof callback === 'function') {
                callback(JSONData);
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

    // Function to generate input data of dataStore depending upon its parentData and its own data
    DataModelProto._generateInputData = function() {
        var ds = this,
            dsLinks = ds.links,
            rawCSV;
        // remove all old data
        ds.links.inputData.length = 0;

        if (rawCSV = dsLinks.rawCSV) {
            delete dsLinks.rawCSV;
            rawCSV.synchronousParse = true;
            ds.parseToJSON(rawCSV);
        }
        // get the data from the input Store
        if (dsLinks.inputStore && dsLinks.inputStore.getJSON) {
        	dsLinks.inputData = dsLinks.inputData.concat(dsLinks.inputStore.getJSON());
            // dsLinks.inputData.push.apply(dsLinks.inputData, dsLinks.inputStore.getJSON());
        }

        // add the input JSON (seperately added)
        if (dsLinks.inputJSON && dsLinks.inputJSON.length) {
        	dsLinks.inputData = dsLinks.inputData.concat(dsLinks.inputJSON);
        	// dsLinks.inputData.push.apply(dsLinks.inputData, ds.links.inputJSON);
        }

        // for simplicity call the output JSON creation method as well
        ds._generateOutputData();
    };

    // Function to generate output data of a dataStore
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
		var ds = this,
            dsLinks = ds.links,
            rawCSV;
        // If raw CSV data is present, parse the csv data synchronously and return the json data
        if (rawCSV = dsLinks.rawCSV) {
            delete dsLinks.rawCSV;
            rawCSV.synchronousParse = true;
            ds.parseToJSON(rawCSV);
        }
        return (dsLinks.outputData || dsLinks.inputData);
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
			dataSource = dataSpecs.dataSource;

		if (dataType === 'csv') {
			if (dataSpecs.parseToJSON === 0) {
                ds.links.rawCSV = dataSpecs;
                if (typeof callback === 'function') {
                    callback(dataSource);
                }
            }
            else {
                ds.parseToJSON(dataSpecs, callback);
            }
		}
		else {
			callbackHelperFn(ds, dataSource, callback);
		}
	};

    // Function to convert csv data to json data
    DataModelProto.parseToJSON = function (dataSpecs, callback) {
        var dataSource = this;
        // When only callback is given buy the user.
        if (typeof dataSpecs === 'function') {
            callback = dataSpecs;
            dataSpecs = dataSource.links.rawCSV;
        }

        multiChartingProto.convertToArray({
            synchronousParse : dataSpecs.synchronousParse,
            string : dataSpecs.dataSource,
            delimiter : dataSpecs.delimiter,
            outputFormat : dataSpecs.outputFormat || 2,
            callback : function (data) {
                callbackHelperFn(dataSource, data, callback);
            }
        });
    };

    // Function to remove all data (not the data linked from the parent) in the data store
    DataModelProto.clearData = function (){
        var ds = this;
        // clear inputData store
        ds.links.inputJSON && (ds.links.inputJSON = undefined);
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

    /*Function to add metadata
        Not required
    	DataModelProto.deleteMetaData = function (fieldName, metaInfoKey) {
            var ds = this,
            metaObj = ds.links.metaObj;
            if (metaObj[fieldName]) {
                metaObj[fieldName][metaInfoKey] = undefined;
            }
	};*/

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
            callback = arguments[1],
            callbackArgs = argument.callbackArgs,
            data;

        multiChartingProto.ajax({
            url : dataSource,
            success : function(string) {
                data = dataType === 'json' ? JSON.parse(string) : string;
                argument.dataSource = data;
                dataStore.setData(argument, callback);
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
    var DataAdapter = function (dataSource, conf, callback) {
        var dataadapter = this;

        dataadapter.dataStore = dataSource;       
        dataadapter.dataJSON = dataadapter.dataStore && dataadapter.dataStore.getJSON();
        dataadapter.configuration = conf;
        dataadapter.callback = callback;
        dataadapter.FCjson = dataadapter.__convertData__();
    },
    protoDataadapter = DataAdapter.prototype;

    protoDataadapter.__convertData__ = function() {
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
            generalData = dataadapter.__generalDataFormat__(jsonData, configuration);
            configuration.categories = configuration.categories || 
                                        dataadapter.dataStore.getUniqueValues(configuration.dimension[0]);
            configuration.categories && (aggregatedData = dataadapter.__getSortedData__(generalData, 
                                configuration.categories, configuration.dimension, configuration.aggregateMode));
            aggregatedData = aggregatedData || generalData;
            dataadapter.aggregatedData = aggregatedData;
            json = dataadapter.__jsonCreator__(aggregatedData, configuration);            
        }
        json = (predefinedJson && extend2(json,predefinedJson)) || json;
        json = (callback && callback(json)) || json;
        return isMetaData ? dataadapter.__setDefaultAttr__(json) : json;
    };

    protoDataadapter.__getSortedData__ = function (data, categoryArr, dimension, aggregateMode) {
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

        (categoryArr && categoryArr.length) || (categoryArr = dataStore.getUniqueValues(key[0]));
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
                newData.push(dataadapter.__getAggregateData__(subSetData, categories[k][i], aggregateMode));
            }
        }        
        return newData;
    };

    protoDataadapter.update = function (dataSource, conf, callback){
        var dataadapter = this;

        dataadapter.dataStore = dataSource || dataadapter.dataStore;       
        dataadapter.dataJSON = dataadapter.dataStore && dataadapter.dataStore.getJSON();
        dataadapter.configuration = conf || dataadapter.configuration;
        dataadapter.callback = callback || dataadapter.callback;
        dataadapter.FCjson = dataadapter.__convertData__();
    };

    protoDataadapter.__setDefaultAttr__ = function (json) {
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
                    if (!metaDataMeasure) {
                        return;
                    }
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

                        metaDataMeasure && metaDataMeasure[COLOR] && (json.dataset[i][COLOR] = 
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
                        color = metaDataMeasure &&metaDataMeasure[COLOR] && 
                            ((metaDataMeasure[COLOR] instanceof Function) ? metaDataMeasure[COLOR]() : 
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

    protoDataadapter.__getAggregateData__ = function (data, key, aggregateMode) {
        var aggregateMethod = {
            'sum' : function(){
                var i,
                    j,
                    lenR,
                    lenC,
                    aggregatedData = [];
                for(i = 0, lenR = data.length; i < lenR; i++) {
                    for(j = 0, lenC = data[i].length; j < lenC; j++) {
                        (data[i][j] == key) && (aggregatedData[j] = key); 
                        aggregatedData[j] || (aggregatedData[j] = 0);
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

    protoDataadapter.__generalDataFormat__ = function(jsonData, configuration) {
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

    protoDataadapter.__jsonCreator__ = function(jsonData, configuration) {
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

    protoDataadapter.getJSON = function() {
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
        for(i = 0, lenR = data && data.length; i < lenR; i++){
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

    protoDataadapter.getDataStore = function() {
        return this.dataStore;
    };

    protoDataadapter.getCategories = function () {
        return this.configuration.categories;
    };

    MultiCharting.prototype.dataAdapter = function (dataSource, conf, callback) {
        return new DataAdapter(dataSource, conf, callback);
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

    var document = MultiCharting.prototype.win.document,
        deepCopy = MultiCharting.prototype.lib.deepCopy,
    	MAX_PERCENT = '100%',
        dataAdapter = MultiCharting.prototype.dataAdapter,
        ID = 'chart-container-',
        chartId = 0,
        PX = 'px',
        SPAN = 'span',
        Chart = function(conf) {
            var chart = this,
                dataAdapterConf = {},
                createChartConf = {},
                dataStore;

            chart.isChart = true;
            
            chart.conf = {};

            Object.assign(chart.conf, conf);

            chart.autoUpdate = chart.conf.autoUpdate || 1;

            dataAdapterConf = {
                'dimension' : chart.conf.dimension,
                'measure' : chart.conf.measure,
                'seriesType' : chart.conf.seriesType,
                'categories' : chart.conf.categories,
                'aggregateMode' : chart.conf.aggregation,
                'config' : chart.conf.config
            };

            chart.dataAdapter = dataAdapter(conf.dataSource, dataAdapterConf, conf.callback);

            dataStore = chart.dataAdapter.getDataStore();

            dataStore && dataStore.addEventListener('modelUpdated',function() {
                chart.update();
            });

            createChartConf = {
                'type' : chart.conf.type,
                'width' : chart.conf.width || MAX_PERCENT,
                'height' : chart.conf.height || MAX_PERCENT,
                'dataSource' : chart.dataAdapter.getJSON()
            };

            chart.chartInstance = chart.__createChart__(createChartConf);
        },
        ProtoChart = Chart.prototype;

    ProtoChart.__createChart__ = function (json) {
        var chart = this,
            chartObj;

        //render FC 
        chartObj = new FusionCharts(json);

        chartObj.addEventListener('trendRegionRollOver', function (e, d) {
            var dataObj = chart.__getRowData__(d.categoryLabel);
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


        return chartObj;
    };

    ProtoChart.update = function(conf){
        var chart = this,
            dataAdapterConf = {},
            createChartConf =  {};

        conf = conf || {};

        Object.assign(chart.conf, conf);

        dataAdapterConf = {
            'dimension' : chart.conf.dimension,
            'measure' : chart.conf.measure,
            'seriesType' : chart.conf.seriesType,
            'categories' : chart.conf.categories,
            'aggregateMode' : chart.conf.aggregation,
            'config' : chart.conf.config
        };
        chart.dataAdapter.update(conf.dataSource, dataAdapterConf, conf.callback);

        createChartConf = {
            'type' : chart.conf.type,
            'width' : chart.conf.width || MAX_PERCENT,
            'height' : chart.conf.height || MAX_PERCENT,
            'dataSource' : chart.dataAdapter.getJSON()
        };
        chart.__chartUpdate__(createChartConf);
        return chart;
    };

    ProtoChart.getChartInstance = function() {
        return this.chartInstance;
    };

    ProtoChart.getConf = function () {
    	var conf = {};
    	Object.assign(conf, this.conf);
    	return conf;
    };

    ProtoChart.render = function(id) {
        var chart = this,
        	container = document.getElementById(id);

		id && chart.chartInstance.render(chart.__chartContainer__(container));
    };

	ProtoChart.__chartContainer__ = function(container) {
		var chart = this,
			id = chart.__idCreator__();

		chart.container = {};
		chart.container.config = {};
		chart.container.config.id = id;
		chart.container.graphics = document.createElement(SPAN);
		chart.container.graphics.id = id;
		chart.container.graphics.style.display = 'block';
		container.appendChild(chart.container.graphics);
		return id;
	};

	ProtoChart.getChartContainer = function() {
		return this.container;
	};

	ProtoChart.updateChartContainer = function(config) {
		var chart = this;

		config || (config = {});
		Object.assign(chart.container.config, config);

		chart.container.graphics.height = chart.container.height + PX;
		chart.container.graphics.width = chart.container.width + PX;
	};

	ProtoChart.__idCreator__ = function(){
        chartId++;       
        return ID + chartId;
    };

    ProtoChart.getLimit = function(){
    	return this.dataAdapter && this.dataAdapter.getLimit();
    };

    ProtoChart.__chartUpdate__ = function(json){
        var chart = this,
        chartJson = json || {};

        if(chart.chartInstance.chartType() != chartJson.type) {
            chart.chartInstance.chartType(chartJson.type);
        }
        chart.chartInstance.setJSONData(chartJson.dataSource);
     };

    ProtoChart.__getRowData__ = function(key) {
        var chart = this,
            i = 0,
            j = 0,
            k,
            kk,
            l,
            lenR,
            len,
            lenC,
            data = deepCopy(chart.dataAdapter.getDataJson()),
            aggregatedData = deepCopy(chart.dataAdapter.getAggregatedData()),
            dimension = chart.dataAdapter.getDimension(),
            measure = chart.dataAdapter.getMeasure(),
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

    ProtoChart.highlight = function (id) {
        var chart = this,
            categoryLabel = id && id.toString(),
            categoryArr = chart.dataAdapter.getCategories(),
            index = categoryLabel && categoryArr.indexOf(categoryLabel);
        chart.chartInstance.drawTrendRegion(index);
    };

    MultiCharting.prototype.chart = function (config) {
        return new Chart(config);
    };
});
(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    var document = MultiCharting.prototype.win.document,
        chartCtrlr = MultiCharting.prototype.chart,
        PX = 'px',
        DIV = 'div',
        EMPTY_STRING = '',
        ABSOLUTE = 'absolute',
        RELATIVE = 'relative',
        ID = 'id-fc-mc-',
        BORDER_BOX = 'border-box';

    var Cell = function (config, container) {
            var cell = this;

            cell.container = container;
            cell.config = config;
            cell.__draw__();
            cell.config.chart && cell.__renderChart__();
        },
        protoCell = Cell.prototype;

    protoCell.__draw__ = function (){
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
        cell.config.chart || (cell.graphics.innerHTML = cell.config.html || EMPTY_STRING);
        cell.container.appendChild(cell.graphics);
    };

    protoCell.__renderChart__ = function () {
        var cell = this,
            chartContainer,
            conf = {
                'height' : cell.config.height,
                'width' : cell.config.width
            },
            disposalBox = cell.disposalBox,
            chartConfig,
            isRecycled = false;

        cell.config.chart.isChart || (chartConfig = cell.config.chart);
        if(chartConfig) {
            if(disposalBox && disposalBox.length){
                delete cell.config.chart;
                cell.config.chart = disposalBox.pop();
                isRecycled = true;
            } else {
                cell.config.chart = chartCtrlr(chartConfig);
            }
        }

        chartContainer = cell.config.chart.getChartContainer();
        chartContainer && cell.config.chart.updateChartContainer(conf);
        chartContainer && (cell.graphics.appendChild(chartContainer.graphics));
        chartContainer || cell.config.chart.render(cell.config.id);
        isRecycled && cell.config.chart.update(chartConfig);
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
            matrix.__setAttrContainer__();
            //store virtual matrix for user given configuration
            matrix.configManager = configuration && matrix && matrix.__drawManager__(configuration);
        },
        protoMatrix = Matrix.prototype,
        chartId = 0;

    //function to set style, attr on matrix container
    protoMatrix.__setAttrContainer__ = function() {
        var matrix = this,
            container = matrix && matrix.matrixContainer;        
        container.style.position = RELATIVE;
    };

    //function to set height, width on matrix container
    protoMatrix.__setContainerResolution__ = function (heightArr, widthArr) {
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
    protoMatrix.draw = function(callBack){
        var matrix = this,
            configManager = matrix.configManager,
            len = configManager && configManager.length,
            placeHolder = [],
            parentContainer = matrix && matrix.matrixContainer,
            lenC,
            i,
            j;
        
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
    protoMatrix.__drawManager__ = function (configuration) {
        var matrix = this,
            i,
            j,
            lenRow = configuration.length,
            //store mapping matrix based on the user configuration
            shadowMatrix = matrix.__matrixManager__(configuration),            
            heightArr = matrix.__getRowHeight__(shadowMatrix),
            widthArr = matrix.__getColWidth__(shadowMatrix),
            drawManagerObjArr = [],
            lenCell,
            matrixPosX = matrix.__getPos__(widthArr),
            matrixPosY = matrix.__getPos__(heightArr),
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
        configuration = matrix.__setPlcHldr__(shadowMatrix, configuration);
        //function to set height, width on matrix container
        matrix.__setContainerResolution__(heightArr, widthArr);
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
                id = (configuration[i][j] && configuration[i][j].id) || matrix.__idCreator__(row,col);
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

    protoMatrix.__idCreator__ = function(){
        chartId++;       
        return ID + chartId;
    };

    protoMatrix.__getPos__ =  function(src){
        var arr = [],
            i = 0,
            len = src && src.length;

        for(; i <= len; i++){
            arr.push(i ? (src[i-1]+arr[i-1]) : 0);
        }

        return arr;
    };

    protoMatrix.__setPlcHldr__ = function(shadowMatrix, configuration){
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

    protoMatrix.__getRowHeight__ = function(shadowMatrix) {
        var matrix = this,
            i,
            j,
            lenRow = shadowMatrix && shadowMatrix.length,
            lenCol,
            height = [],
            currHeight,
            defaultH = matrix.defaultH,
            maxHeight;
            
        for (i = 0; i < lenRow; i++) {
            for(j = 0, maxHeight = 0, lenCol = shadowMatrix[i].length; j < lenCol; j++) {
                if(shadowMatrix[i][j]) {
                    currHeight = shadowMatrix[i][j].height;
                    maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
                }
            }
            height[i] = maxHeight || defaultH;
        }

        return height;
    };

    protoMatrix.__getColWidth__ = function(shadowMatrix) {
        var matrix = this,
            i = 0,
            j = 0,
            lenRow = shadowMatrix && shadowMatrix.length,
            lenCol,
            width = [],
            currWidth,
            defaultW = matrix.defaultW,
            maxWidth;
        for (i = 0, lenCol = shadowMatrix[j].length; i < lenCol; i++){
            for(j = 0, maxWidth = 0; j < lenRow; j++) {
                if (shadowMatrix[j][i]) {
                    currWidth = shadowMatrix[j][i].width;        
                    maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
                }
            }
            width[i] = maxWidth || defaultW;
        }

        return width;
    };

    protoMatrix.__matrixManager__ = function (configuration) {
        var shadowMatrix = [],
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
            offset;
            
        for (i = 0; i < lenRow; i++) {            
            for (j = 0, lenCell = configuration[i].length; j < lenCell; j++) {
            
                rowSpan = (configuration[i][j] && configuration[i][j].rowspan) || 1;
                colSpan = (configuration[i][j] && configuration[i][j].colspan) || 1;   
                
                width = (configuration[i][j] && configuration[i][j].width);
                width = (width && (width / colSpan)) || undefined;
                width = width && +width.toFixed(2);

                height = (configuration[i][j] && configuration[i][j].height);
                height = (height && (height / rowSpan)) || undefined;                      
                height = height && +height.toFixed(2);

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

    protoMatrix.__getBlock__  = function() {
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
            container = matrix && matrix.matrixContainer,
            placeHolder = matrix && matrix.placeHolder,
            disposalBox = [],
            i,
            j;

        while(container.hasChildNodes()) {
            container.removeChild(container.lastChild);
        }
        for (i = placeHolder.length - 1; i >= 0; i--) {
            for (j = placeHolder[i].length - 1; j >= 0; j--) {
                placeHolder[i][j].config && placeHolder[i][j].config.chart && 
                                (disposalBox.push(placeHolder[i][j].config.chart));
            }
        }
        protoCell.disposalBox = disposalBox;
        matrix.configuration = configuration || matrix.configuration;
        matrix.configManager = matrix.__drawManager__(matrix.configuration);
        matrix.draw();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsImNvbW1vbi1heGlzLmpzIiwiY29tbW9uLWNhcHRpb24uanMiLCJtdWx0aWNoYXJ0aW5nLmV2ZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZnVzaW9uY2hhcnRzLm11bHRpY2hhcnRpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE11bHRpQ2hhcnRpbmcgRXh0ZW5zaW9uIGZvciBGdXNpb25DaGFydHNcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBiYXNpYyByb3V0aW5lcyByZXF1aXJlZCBieSBzdWJzZXF1ZW50IG1vZHVsZXMgdG9cbiAqIGV4dGVuZC9zY2FsZSBvciBhZGQgZnVuY3Rpb25hbGl0eSB0byB0aGUgTXVsdGlDaGFydGluZyBvYmplY3QuXG4gKlxuICovXG5cbiAvKiBnbG9iYWwgd2luZG93OiB0cnVlICovXG5cbihmdW5jdGlvbiAoZW52LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZW52LmRvY3VtZW50ID9cbiAgICAgICAgICAgIGZhY3RvcnkoZW52KSA6IGZ1bmN0aW9uKHdpbikge1xuICAgICAgICAgICAgICAgIGlmICghd2luLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2luZG93IHdpdGggZG9jdW1lbnQgbm90IHByZXNlbnQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhY3Rvcnkod2luLCB0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW52Lk11bHRpQ2hhcnRpbmcgPSBmYWN0b3J5KGVudiwgdHJ1ZSk7XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0aGlzLCBmdW5jdGlvbiAoX3dpbmRvdywgd2luZG93RXhpc3RzKSB7XG4gICAgLy8gSW4gY2FzZSBNdWx0aUNoYXJ0aW5nIGFscmVhZHkgZXhpc3RzLlxuICAgIGlmIChfd2luZG93Lk11bHRpQ2hhcnRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBNdWx0aUNoYXJ0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4gPSBfd2luZG93O1xuXG4gICAgaWYgKHdpbmRvd0V4aXN0cykge1xuICAgICAgICBfd2luZG93Lk11bHRpQ2hhcnRpbmcgPSBNdWx0aUNoYXJ0aW5nO1xuICAgIH1cbiAgICByZXR1cm4gTXVsdGlDaGFydGluZztcbn0pO1xuIiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBtZXJnZSA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSxcbiAgICAgICAgICAgICAgICBzcmNWYWwsXG4gICAgICAgICAgICAgICAgdGd0VmFsLFxuICAgICAgICAgICAgICAgIHN0cixcbiAgICAgICAgICAgICAgICBjUmVmLFxuICAgICAgICAgICAgICAgIG9iamVjdFRvU3RyRm4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICAgICAgICAgIGFycmF5VG9TdHIgPSAnW29iamVjdCBBcnJheV0nLFxuICAgICAgICAgICAgICAgIG9iamVjdFRvU3RyID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgICAgICAgICAgICAgY2hlY2tDeWNsaWNSZWYgPSBmdW5jdGlvbihvYmosIHBhcmVudEFycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IHBhcmVudEFyci5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBiSW5kZXggPSAtMTtcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqID09PSBwYXJlbnRBcnJbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgT0JKRUNUU1RSSU5HID0gJ29iamVjdCc7XG5cbiAgICAgICAgICAgIC8vY2hlY2sgd2hldGhlciBvYmoyIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAvL2lmIGFycmF5IHRoZW4gaXRlcmF0ZSB0aHJvdWdoIGl0J3MgaW5kZXhcbiAgICAgICAgICAgIC8vKioqKiBNT09UT09MUyBwcmVjdXRpb25cblxuICAgICAgICAgICAgaWYgKCFzcmNBcnIpIHtcbiAgICAgICAgICAgICAgICB0Z3RBcnIgPSBbb2JqMV07XG4gICAgICAgICAgICAgICAgc3JjQXJyID0gW29iajJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyLnB1c2gob2JqMSk7XG4gICAgICAgICAgICAgICAgc3JjQXJyLnB1c2gob2JqMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvYmoyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gPSAwOyBpdGVtIDwgb2JqMi5sZW5ndGg7IGl0ZW0gKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0Z3RWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoc2tpcFVuZGVmICYmIHRndFZhbCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RWYWwgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoaXRlbSBpbiBvYmoyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VmFsID0gb2JqMltpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGd0VmFsICE9PSBudWxsICYmIHR5cGVvZiB0Z3RWYWwgPT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4IGZvciBpc3N1ZSBCVUc6IEZXWFQtNjAyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJRSA8IDkgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG51bGwpIGdpdmVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAnW29iamVjdCBPYmplY3RdJyBpbnN0ZWFkIG9mICdbb2JqZWN0IE51bGxdJ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCdzIHdoeSBudWxsIHZhbHVlIGJlY29tZXMgT2JqZWN0IGluIElFIDwgOVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gb2JqZWN0VG9TdHJGbi5jYWxsKHRndFZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBvYmplY3RUb1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgdHlwZW9mIHNyY1ZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHIgPT09IGFycmF5VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8ICEoc3JjVmFsIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndEFycltjUmVmXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlKHNyY1ZhbCwgdGd0VmFsLCBza2lwVW5kZWYsIHRndEFyciwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICB9LFxuICAgICAgICBleHRlbmQyID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZikge1xuICAgICAgICAgICAgdmFyIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuICAgICAgICAgICAgLy9pZiBub25lIG9mIHRoZSBhcmd1bWVudHMgYXJlIG9iamVjdCB0aGVuIHJldHVybiBiYWNrXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORyAmJiB0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMiAhPT0gT0JKRUNUU1RSSU5HIHx8IG9iajIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICBvYmoxID0gb2JqMiBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lcmdlKG9iajEsIG9iajIsIHNraXBVbmRlZik7XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVlcENvcHkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICB2YXIgb3V0LFxuICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgbGVuID0gb2JqLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwIDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRbaV0gPSBkZWVwQ29weShvYmpbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICAgICAgZm9yICggaSBpbiBvYmogKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtpXSA9IGRlZXBDb3B5KG9ialtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9LFxuICAgICAgICBsaWIgPSB7XG4gICAgICAgICAgICBleHRlbmQyOiBleHRlbmQyLFxuICAgICAgICAgICAgbWVyZ2U6IG1lcmdlLFxuICAgICAgICAgICAgZGVlcENvcHkgOiBkZWVwQ29weVxuICAgICAgICB9O1xuXG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiA9IChNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgfHwgbGliKTtcblxufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBBamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFqYXggPSB0aGlzLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgICBhamF4Lm9uU3VjY2VzcyA9IGFyZ3VtZW50LnN1Y2Nlc3M7XG4gICAgICAgICAgICBhamF4Lm9uRXJyb3IgPSBhcmd1bWVudC5lcnJvcjtcbiAgICAgICAgICAgIGFqYXgub3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGFqYXguZ2V0KGFyZ3VtZW50LnVybCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWpheFByb3RvID0gQWpheC5wcm90b3R5cGUsXG5cbiAgICAgICAgRlVOQ1RJT04gPSAnZnVuY3Rpb24nLFxuICAgICAgICBNU1hNTEhUVFAgPSAnTWljcm9zb2Z0LlhNTEhUVFAnLFxuICAgICAgICBNU1hNTEhUVFAyID0gJ01zeG1sMi5YTUxIVFRQJyxcbiAgICAgICAgR0VUID0gJ0dFVCcsXG4gICAgICAgIFhIUkVRRVJST1IgPSAnWG1sSHR0cHJlcXVlc3QgRXJyb3InLFxuICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcbiAgICAgICAgd2luID0gbXVsdGlDaGFydGluZ1Byb3RvLndpbiwgLy8ga2VlcCBhIGxvY2FsIHJlZmVyZW5jZSBvZiB3aW5kb3cgc2NvcGVcblxuICAgICAgICAvLyBQcm9iZSBJRSB2ZXJzaW9uXG4gICAgICAgIHZlcnNpb24gPSBwYXJzZUZsb2F0KHdpbi5uYXZpZ2F0b3IuYXBwVmVyc2lvbi5zcGxpdCgnTVNJRScpWzFdKSxcbiAgICAgICAgaWVsdDggPSAodmVyc2lvbiA+PSA1LjUgJiYgdmVyc2lvbiA8PSA3KSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgZmlyZWZveCA9IC9tb3ppbGxhL2kudGVzdCh3aW4ubmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENhbGN1bGF0ZSBmbGFncy5cbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgcGFnZSBpcyBvbiBmaWxlIHByb3RvY29sLlxuICAgICAgICBmaWxlUHJvdG9jb2wgPSB3aW4ubG9jYXRpb24ucHJvdG9jb2wgPT09ICdmaWxlOicsXG4gICAgICAgIEFYT2JqZWN0ID0gd2luLkFjdGl2ZVhPYmplY3QsXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgbmF0aXZlIHhociBpcyBwcmVzZW50XG4gICAgICAgIFhIUk5hdGl2ZSA9ICghQVhPYmplY3QgfHwgIWZpbGVQcm90b2NvbCkgJiYgd2luLlhNTEh0dHBSZXF1ZXN0LFxuXG4gICAgICAgIC8vIFByZXBhcmUgZnVuY3Rpb24gdG8gcmV0cmlldmUgY29tcGF0aWJsZSB4bWxodHRwcmVxdWVzdC5cbiAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgeG1saHR0cDtcblxuICAgICAgICAgICAgLy8gaWYgeG1saHR0cHJlcXVlc3QgaXMgcHJlc2VudCBhcyBuYXRpdmUsIHVzZSBpdC5cbiAgICAgICAgICAgIGlmIChYSFJOYXRpdmUpIHtcbiAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBYSFJOYXRpdmUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXdYbWxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgYWN0aXZlWCBmb3IgSUVcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBBWE9iamVjdChNU1hNTEhUVFAyKTtcbiAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBWE9iamVjdChNU1hNTEhUVFAyKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBWE9iamVjdChNU1hNTEhUVFApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB4bWxodHRwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHhtbGh0dHA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUHJldmVudHMgY2FjaGVpbmcgb2YgQUpBWCByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdJZi1Nb2RpZmllZC1TaW5jZSc6ICdTYXQsIDI5IE9jdCAxOTk0IDE5OjQzOjMxIEdNVCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExldHMgdGhlIHNlcnZlciBrbm93IHRoYXQgdGhpcyBpcyBhbiBBSkFYIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExldHMgc2VydmVyIGtub3cgd2hpY2ggd2ViIGFwcGxpY2F0aW9uIGlzIHNlbmRpbmcgcmVxdWVzdHMuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtQnknOiAnRnVzaW9uQ2hhcnRzJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTWVudGlvbnMgY29udGVudC10eXBlcyB0aGF0IGFyZSBhY2NlcHRhYmxlIGZvciB0aGUgcmVzcG9uc2UuIFNvbWUgc2VydmVycyByZXF1aXJlIHRoaXMgZm9yIEFqYXhcbiAgICAgICAgICAgICAqIGNvbW11bmljYXRpb24uXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnQWNjZXB0JzogJ3RleHQvcGxhaW4sICovKicsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoZSBNSU1FIHR5cGUgb2YgdGhlIGJvZHkgb2YgdGhlIHJlcXVlc3QgYWxvbmcgd2l0aCBpdHMgY2hhcnNldC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04J1xuICAgICAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuYWpheCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBamF4KGFyZ3VtZW50c1swXSk7XG4gICAgfTtcblxuICAgIGFqYXhQcm90by5nZXQgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHZhciB3cmFwcGVyID0gdGhpcyxcbiAgICAgICAgICAgIHhtbGh0dHAgPSB3cmFwcGVyLnhtbGh0dHAsXG4gICAgICAgICAgICBlcnJvckNhbGxiYWNrID0gd3JhcHBlci5vbkVycm9yLFxuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrID0gd3JhcHBlci5vblN1Y2Nlc3MsXG4gICAgICAgICAgICB4UmVxdWVzdGVkQnkgPSAnWC1SZXF1ZXN0ZWQtQnknLFxuICAgICAgICAgICAgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBldmVudExpc3QgPSBbJ29ubG9hZHN0YXJ0JywgJ29uZHVyYXRpb25jaGFuZ2UnLCAnb25sb2FkZWRtZXRhZGF0YScsICdvbmxvYWRlZGRhdGEnLCAnb25wcm9ncmVzcycsXG4gICAgICAgICAgICAgICAgJ29uY2FucGxheScsICdvbmNhbnBsYXl0aHJvdWdoJywgJ29uYWJvcnQnLCAnb25lcnJvcicsICdvbnRpbWVvdXQnLCAnb25sb2FkZW5kJ107XG5cbiAgICAgICAgLy8gWC1SZXF1ZXN0ZWQtQnkgaXMgcmVtb3ZlZCBmcm9tIGhlYWRlciBkdXJpbmcgY3Jvc3MgZG9tYWluIGFqYXggY2FsbFxuICAgICAgICBpZiAodXJsLnNlYXJjaCgvXihodHRwOlxcL1xcL3xodHRwczpcXC9cXC8pLykgIT09IC0xICYmXG4gICAgICAgICAgICAgICAgd2luLmxvY2F0aW9uLmhvc3RuYW1lICE9PSAvKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykoW15cXC9cXDpdKikvLmV4ZWModXJsKVsyXSkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHVybCBkb2VzIG5vdCBjb250YWluIGh0dHAgb3IgaHR0cHMsIHRoZW4gaXRzIGEgc2FtZSBkb21haW4gY2FsbC4gTm8gbmVlZCB0byB1c2UgcmVnZXggdG8gZ2V0XG4gICAgICAgICAgICAvLyBkb21haW4uIElmIGl0IGNvbnRhaW5zIHRoZW4gY2hlY2tzIGRvbWFpbi5cbiAgICAgICAgICAgIGRlbGV0ZSBoZWFkZXJzW3hSZXF1ZXN0ZWRCeV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAhaGFzT3duLmNhbGwoaGVhZGVycywgeFJlcXVlc3RlZEJ5KSAmJiAoaGVhZGVyc1t4UmVxdWVzdGVkQnldID0gJ0Z1c2lvbkNoYXJ0cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF4bWxodHRwIHx8IGllbHQ4IHx8IGZpcmVmb3gpIHtcbiAgICAgICAgICAgIHhtbGh0dHAgPSBuZXdYbWxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgd3JhcHBlci54bWxodHRwID0geG1saHR0cDtcbiAgICAgICAgfVxuXG4gICAgICAgIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoeG1saHR0cC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCgheG1saHR0cC5zdGF0dXMgJiYgZmlsZVByb3RvY29sKSB8fCAoeG1saHR0cC5zdGF0dXMgPj0gMjAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA8IDMwMCkgfHwgeG1saHR0cC5zdGF0dXMgPT09IDMwNCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1saHR0cC5zdGF0dXMgPT09IDEyMjMgfHwgeG1saHR0cC5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soeG1saHR0cC5yZXNwb25zZVRleHQsIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhuZXcgRXJyb3IoWEhSRVFFUlJPUiksIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdyYXBwZXIub3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgICAgIHhtbGh0dHBbZXZlbnROYW1lXSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBFdmVudCA6IGV2ZW50XG4gICAgICAgICAgICAgICAgfSwgd3JhcHBlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgeG1saHR0cC5vcGVuKEdFVCwgdXJsLCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKHhtbGh0dHAub3ZlcnJpZGVNaW1lVHlwZSkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAub3ZlcnJpZGVNaW1lVHlwZSgndGV4dC9wbGFpbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgaW4gaGVhZGVycykge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcihpLCBoZWFkZXJzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeG1saHR0cC5zZW5kKCk7XG4gICAgICAgICAgICB3cmFwcGVyLm9wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yLCB3cmFwcGVyLCB1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHhtbGh0dHA7XG4gICAgfTtcblxuICAgIGFqYXhQcm90by5hYm9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcyxcbiAgICAgICAgICAgIHhtbGh0dHAgPSBpbnN0YW5jZS54bWxodHRwO1xuXG4gICAgICAgIGluc3RhbmNlLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHhtbGh0dHAgJiYgdHlwZW9mIHhtbGh0dHAuYWJvcnQgPT09IEZVTkNUSU9OICYmIHhtbGh0dHAucmVhZHlTdGF0ZSAmJlxuICAgICAgICAgICAgICAgIHhtbGh0dHAucmVhZHlTdGF0ZSAhPT0gMCAmJiB4bWxodHRwLmFib3J0KCk7XG4gICAgfTtcblxuICAgIGFqYXhQcm90by5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICBpbnN0YW5jZS5vcGVuICYmIGluc3RhbmNlLmFib3J0KCk7XG5cbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9uRXJyb3I7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vblN1Y2Nlc3M7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS54bWxodHRwO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub3BlbjtcblxuICAgICAgICByZXR1cm4gKGluc3RhbmNlID0gbnVsbCk7XG4gICAgfTtcbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICAvLyBTb3VyY2U6IGh0dHA6Ly93d3cuYmVubmFkZWwuY29tL2Jsb2cvMTUwNC1Bc2stQmVuLVBhcnNpbmctQ1NWLVN0cmluZ3MtV2l0aC1KYXZhc2NyaXB0LUV4ZWMtUmVndWxhci1FeHByZXNzaW9uLUNvbW1hbmQuaHRtXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cblxuXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cbiAgICBmdW5jdGlvbiBDU1ZUb0FycmF5IChzdHJEYXRhLCBzdHJEZWxpbWl0ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBkZWxpbWl0ZXIgaXMgZGVmaW5lZC4gSWYgbm90LFxuICAgICAgICAvLyB0aGVuIGRlZmF1bHQgdG8gY29tbWEuXG4gICAgICAgIHN0ckRlbGltaXRlciA9IChzdHJEZWxpbWl0ZXIgfHwgXCIsXCIpO1xuICAgICAgICAvLyBDcmVhdGUgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcGFyc2UgdGhlIENTViB2YWx1ZXMuXG4gICAgICAgIHZhciBvYmpQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAvLyBEZWxpbWl0ZXJzLlxuICAgICAgICAgICAgICAgIFwiKFxcXFxcIiArIHN0ckRlbGltaXRlciArIFwifFxcXFxyP1xcXFxufFxcXFxyfF4pXCIgK1xuICAgICAgICAgICAgICAgIC8vIFF1b3RlZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoPzpcXFwiKFteXFxcIl0qKD86XFxcIlxcXCJbXlxcXCJdKikqKVxcXCJ8XCIgK1xuICAgICAgICAgICAgICAgIC8vIFN0YW5kYXJkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIihbXlxcXCJcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcIlxcXFxyXFxcXG5dKikpXCJcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcImdpXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBkYXRhLiBHaXZlIHRoZSBhcnJheVxuICAgICAgICAvLyBhIGRlZmF1bHQgZW1wdHkgZmlyc3Qgcm93LlxuICAgICAgICB2YXIgYXJyRGF0YSA9IFtbXV07XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBpbmRpdmlkdWFsIHBhdHRlcm5cbiAgICAgICAgLy8gbWF0Y2hpbmcgZ3JvdXBzLlxuICAgICAgICB2YXIgYXJyTWF0Y2hlcyA9IG51bGw7XG4gICAgICAgIC8vIEtlZXAgbG9vcGluZyBvdmVyIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlc1xuICAgICAgICAvLyB1bnRpbCB3ZSBjYW4gbm8gbG9uZ2VyIGZpbmQgYSBtYXRjaC5cbiAgICAgICAgd2hpbGUgKGFyck1hdGNoZXMgPSBvYmpQYXR0ZXJuLmV4ZWMoIHN0ckRhdGEgKSl7XG4gICAgICAgICAgICAvLyBHZXQgdGhlIGRlbGltaXRlciB0aGF0IHdhcyBmb3VuZC5cbiAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkRGVsaW1pdGVyID0gYXJyTWF0Y2hlc1sgMSBdO1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBnaXZlbiBkZWxpbWl0ZXIgaGFzIGEgbGVuZ3RoXG4gICAgICAgICAgICAvLyAoaXMgbm90IHRoZSBzdGFydCBvZiBzdHJpbmcpIGFuZCBpZiBpdCBtYXRjaGVzXG4gICAgICAgICAgICAvLyBmaWVsZCBkZWxpbWl0ZXIuIElmIGlkIGRvZXMgbm90LCB0aGVuIHdlIGtub3dcbiAgICAgICAgICAgIC8vIHRoYXQgdGhpcyBkZWxpbWl0ZXIgaXMgYSByb3cgZGVsaW1pdGVyLlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHN0ck1hdGNoZWREZWxpbWl0ZXIubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgKHN0ck1hdGNoZWREZWxpbWl0ZXIgIT0gc3RyRGVsaW1pdGVyKVxuICAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgLy8gU2luY2Ugd2UgaGF2ZSByZWFjaGVkIGEgbmV3IHJvdyBvZiBkYXRhLFxuICAgICAgICAgICAgICAgIC8vIGFkZCBhbiBlbXB0eSByb3cgdG8gb3VyIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICAgICAgYXJyRGF0YS5wdXNoKCBbXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgZGVsaW1pdGVyIG91dCBvZiB0aGUgd2F5LFxuICAgICAgICAgICAgLy8gbGV0J3MgY2hlY2sgdG8gc2VlIHdoaWNoIGtpbmQgb2YgdmFsdWUgd2VcbiAgICAgICAgICAgIC8vIGNhcHR1cmVkIChxdW90ZWQgb3IgdW5xdW90ZWQpLlxuICAgICAgICAgICAgaWYgKGFyck1hdGNoZXNbIDIgXSl7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBxdW90ZWQgdmFsdWUuIFdoZW4gd2UgY2FwdHVyZVxuICAgICAgICAgICAgICAgIC8vIHRoaXMgdmFsdWUsIHVuZXNjYXBlIGFueSBkb3VibGUgcXVvdGVzLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAyIF0ucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFJlZ0V4cCggXCJcXFwiXFxcIlwiLCBcImdcIiApLFxuICAgICAgICAgICAgICAgICAgICBcIlxcXCJcIlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIG5vbi1xdW90ZWQgdmFsdWUuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDMgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIHZhbHVlIHN0cmluZywgbGV0J3MgYWRkXG4gICAgICAgICAgICAvLyBpdCB0byB0aGUgZGF0YSBhcnJheS5cbiAgICAgICAgICAgIGFyckRhdGFbIGFyckRhdGEubGVuZ3RoIC0gMSBdLnB1c2goIHN0ck1hdGNoZWRWYWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJldHVybiB0aGUgcGFyc2VkIGRhdGEuXG4gICAgICAgIHJldHVybiggYXJyRGF0YSApO1xuICAgIH1cbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuICAgIHZhciBNdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZTtcblxuICAgIE11bHRpQ2hhcnRpbmdQcm90by5jb252ZXJ0VG9BcnJheSA9IGZ1bmN0aW9uIChkYXRhLCBkZWxpbWl0ZXIsIG91dHB1dEZvcm1hdCwgc3luY2hyb25vdXNQYXJzZSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNzdlRvQXJyID0gdGhpcztcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZGVsaW1pdGVyID0gZGF0YS5kZWxpbWl0ZXI7XG4gICAgICAgICAgICBvdXRwdXRGb3JtYXQgPSBkYXRhLm91dHB1dEZvcm1hdDtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGF0YS5jYWxsYmFjaztcbiAgICAgICAgICAgIHN5bmNocm9ub3VzUGFyc2UgPSBkYXRhLnN5bmNocm9ub3VzUGFyc2U7XG4gICAgICAgICAgICBkYXRhID0gZGF0YS5zdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NTViBzdHJpbmcgbm90IHByb3ZpZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwbGl0ZWREYXRhID0gZGF0YS5zcGxpdCgvXFxyXFxufFxccnxcXG4vKSxcbiAgICAgICAgICAgIC8vdG90YWwgbnVtYmVyIG9mIHJvd3NcbiAgICAgICAgICAgIGxlbiA9IHNwbGl0ZWREYXRhLmxlbmd0aCxcbiAgICAgICAgICAgIC8vZmlyc3Qgcm93IGlzIGhlYWRlciBhbmQgc3BsaXRpbmcgaXQgaW50byBhcnJheXNcbiAgICAgICAgICAgIGhlYWRlciA9IENTVlRvQXJyYXkoc3BsaXRlZERhdGFbMF0sIGRlbGltaXRlciksIC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgICAgaSA9IDEsXG4gICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgIGsgPSAwLFxuICAgICAgICAgICAga2xlbiA9IDAsXG4gICAgICAgICAgICBjZWxsID0gW10sXG4gICAgICAgICAgICBtaW4gPSBNYXRoLm1pbixcbiAgICAgICAgICAgIGZpbmFsT2IsXG4gICAgICAgICAgICB1cGRhdGVNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW0gPSAwLFxuICAgICAgICAgICAgICAgICAgICBqbGVuID0gMCxcbiAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGkgKyAzMDAwO1xuICAgICAgICAgICAgICAgIGlmKGkgPT09IDEpe1xuICAgICAgICAgICAgICAgICAgICBNdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnb25QYXJzaW5nU3RhcnQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFdmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidsb2Fkc3RhcnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsOiBsZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgY3N2VG9BcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBNdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnb25QYXJzaW5nUHJvZ3Jlc3MnLCB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkOiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6J3Byb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogbGVuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgY3N2VG9BcnIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChsaW0gPiBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgbGltID0gbGVuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxpbTsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgY2VsbCBhcnJheSB0aGF0IGNvaW50YWluIGNzdiBkYXRhXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhW2ldLCBkZWxpbWl0ZXIpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgICAgICAgICAgY2VsbCA9IGNlbGwgJiYgY2VsbFswXTtcbiAgICAgICAgICAgICAgICAgICAgLy90YWtlIG1pbiBvZiBoZWFkZXIgbGVuZ3RoIGFuZCB0b3RhbCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgICAgIGpsZW4gPSBtaW4oaGVhZGVyLmxlbmd0aCwgY2VsbC5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRGb3JtYXQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2IucHVzaChjZWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJbal1dID0gY2VsbFtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2IucHVzaChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2JbaGVhZGVyW2pdXS5wdXNoKGNlbGxbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY2FsbCB1cGRhdGUgbWFuYWdlclxuICAgICAgICAgICAgICAgICAgICBzeW5jaHJvbm91c1BhcnNlID8gdXBkYXRlTWFuYWdlcigpIDogc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBNdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnb25QYXJzaW5nRW5kJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQ6IGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonbG9hZGVuZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IGxlblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBjc3ZUb0Fycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTsiLCIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyXHRtdWx0aUNoYXJ0aW5nUHJvdG8gPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZSxcblx0XHQvL2xpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG4gICAgICAgIGV2ZW50TGlzdCA9IHtcbiAgICAgICAgICAgICdtb2RlbFVwZGF0ZWQnOiAnbW9kZWx1cGRhdGVkJyxcbiAgICAgICAgICAgICdtb2RlbERlbGV0ZWQnOiAnbW9kZWxkZWxldGVkJyxcbiAgICAgICAgICAgICdtZXRhSW5mb1VwZGF0ZSc6ICdtZXRhaW5mb3VwZGF0ZWQnLFxuICAgICAgICAgICAgJ3Byb2Nlc3NvclVwZGF0ZWQnOiAncHJvY2Vzc29ydXBkYXRlZCcsXG4gICAgICAgICAgICAncHJvY2Vzc29yRGVsZXRlZCc6ICdwcm9jZXNzb3JkZWxldGVkJ1xuICAgICAgICB9LFxuICAgICAgICB1aWRDb3VudGVyID0gMCxcbiAgICAgICAgZ2VyYXRlVUlEID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdtb2RlbF9pZF8nICsgKHVpZENvdW50ZXIrKyk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldFByb2Nlc3NvclN0b3JlT2JqID0gZnVuY3Rpb24gKHByb2Nlc3NvciwgZHMpIHtcbiAgICAgICAgICAgIHZhciBzdG9yZU9iaiA9IHtcblx0ICAgICAgICAgICAgICAgIHByb2Nlc3NvcjogcHJvY2Vzc29yLFxuXHQgICAgICAgICAgICAgICAgbGlzdG5lcnM6IHt9XG5cdCAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgIGxpc3RuZXJzO1xuXG4gICAgICAgICAgICBsaXN0bmVycyA9IHN0b3JlT2JqLmxpc3RuZXJzO1xuICAgICAgICAgICAgbGlzdG5lcnNbZXZlbnRMaXN0LnByb2Nlc3NvclVwZGF0ZWRdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxpc3RuZXJzW2V2ZW50TGlzdC5wcm9jZXNzb3JEZWxldGVkXSA9ICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZHMucmVtb3ZlRGF0YVByb2Nlc3Nvcihwcm9jZXNzb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBzdG9yZU9iajtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkTGlzdG5lcnMgPSBmdW5jdGlvbiAoZWxlbWVudCwgbGlzdG5lcnNPYmopIHtcbiAgICAgICAgICAgIHZhciBldmVudE5hbWU7XG4gICAgICAgICAgICBpZiAobGlzdG5lcnNPYmogJiYgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgZm9yIChldmVudE5hbWUgaW4gbGlzdG5lcnNPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdG5lcnNPYmpbZXZlbnROYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZW1vdmVMaXN0bmVycyA9IGZ1bmN0aW9uIChlbGVtZW50LCBsaXN0bmVyc09iaikge1xuICAgICAgICAgICAgdmFyIGV2ZW50TmFtZTtcbiAgICAgICAgICAgIGlmIChsaXN0bmVyc09iaiAmJiBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGV2ZW50TmFtZSBpbiBsaXN0bmVyc09iaikge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0bmVyc09ialtldmVudE5hbWVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGJhY2tIZWxwZXJGbiA9IGZ1bmN0aW9uIChkcywgSlNPTkRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBkcy5saW5rcy5pbnB1dEpTT04gPSBKU09ORGF0YS5jb25jYXQoZHMubGlua3MuaW5wdXRKU09OIHx8IFtdKTtcbiAgICAgICAgICAgIGRzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKEpTT05EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhTW9kZWwuXG5cdFx0RGF0YU1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgZHMgPSB0aGlzO1xuXHQgICAgXHRkcy5saW5rcyA9IHtcbiAgICAgICAgICAgICAgaW5wdXRTdG9yZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBpbnB1dEpTT046IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgaW5wdXREYXRhOiBbXSxcbiAgICAgICAgICAgICAgcHJvY2Vzc29yczogW10sXG4gICAgICAgICAgICAgIG1ldGFPYmo6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gYWRkIHRoZSB1bmljSWRcbiAgICAgICAgICAgIGRzLmlkID0gZ2VyYXRlVUlEKCk7XG5cdCAgICBcdGFyZ3VtZW50c1swXSAmJiBkcy5zZXREYXRhKGFyZ3VtZW50c1swXSk7XG5cdFx0fSxcblx0XHREYXRhTW9kZWxQcm90byA9IERhdGFNb2RlbC5wcm90b3R5cGU7XG5cbiAgICAgICAgLy9cbiAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvLmNyZWF0ZURhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YU1vZGVsKGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH07XG5cbiAgICBEYXRhTW9kZWxQcm90by5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIGlucHV0IGRhdGEgb2YgZGF0YVN0b3JlIGRlcGVuZGluZyB1cG9uIGl0cyBwYXJlbnREYXRhIGFuZCBpdHMgb3duIGRhdGFcbiAgICBEYXRhTW9kZWxQcm90by5fZ2VuZXJhdGVJbnB1dERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgICAgIGRzTGlua3MgPSBkcy5saW5rcyxcbiAgICAgICAgICAgIHJhd0NTVjtcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBvbGQgZGF0YVxuICAgICAgICBkcy5saW5rcy5pbnB1dERhdGEubGVuZ3RoID0gMDtcblxuICAgICAgICBpZiAocmF3Q1NWID0gZHNMaW5rcy5yYXdDU1YpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkc0xpbmtzLnJhd0NTVjtcbiAgICAgICAgICAgIHJhd0NTVi5zeW5jaHJvbm91c1BhcnNlID0gdHJ1ZTtcbiAgICAgICAgICAgIGRzLnBhcnNlVG9KU09OKHJhd0NTVik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZ2V0IHRoZSBkYXRhIGZyb20gdGhlIGlucHV0IFN0b3JlXG4gICAgICAgIGlmIChkc0xpbmtzLmlucHV0U3RvcmUgJiYgZHNMaW5rcy5pbnB1dFN0b3JlLmdldEpTT04pIHtcbiAgICAgICAgXHRkc0xpbmtzLmlucHV0RGF0YSA9IGRzTGlua3MuaW5wdXREYXRhLmNvbmNhdChkc0xpbmtzLmlucHV0U3RvcmUuZ2V0SlNPTigpKTtcbiAgICAgICAgICAgIC8vIGRzTGlua3MuaW5wdXREYXRhLnB1c2guYXBwbHkoZHNMaW5rcy5pbnB1dERhdGEsIGRzTGlua3MuaW5wdXRTdG9yZS5nZXRKU09OKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHRoZSBpbnB1dCBKU09OIChzZXBlcmF0ZWx5IGFkZGVkKVxuICAgICAgICBpZiAoZHNMaW5rcy5pbnB1dEpTT04gJiYgZHNMaW5rcy5pbnB1dEpTT04ubGVuZ3RoKSB7XG4gICAgICAgIFx0ZHNMaW5rcy5pbnB1dERhdGEgPSBkc0xpbmtzLmlucHV0RGF0YS5jb25jYXQoZHNMaW5rcy5pbnB1dEpTT04pO1xuICAgICAgICBcdC8vIGRzTGlua3MuaW5wdXREYXRhLnB1c2guYXBwbHkoZHNMaW5rcy5pbnB1dERhdGEsIGRzLmxpbmtzLmlucHV0SlNPTik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3Igc2ltcGxpY2l0eSBjYWxsIHRoZSBvdXRwdXQgSlNPTiBjcmVhdGlvbiBtZXRob2QgYXMgd2VsbFxuICAgICAgICBkcy5fZ2VuZXJhdGVPdXRwdXREYXRhKCk7XG4gICAgfTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIG91dHB1dCBkYXRhIG9mIGEgZGF0YVN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8uX2dlbmVyYXRlT3V0cHV0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgbGlua3MgPSBkcy5saW5rcyxcbiAgICAgICAgb3V0cHV0RGF0YSA9IGxpbmtzLmlucHV0RGF0YS5jb25jYXQoW10pLFxuICAgICAgICBpLFxuICAgICAgICBsID0gbGlua3MucHJvY2Vzc29ycy5sZW5ndGgsXG4gICAgICAgIHN0b3JlT2JqO1xuXG4gICAgICAgIGlmIChsICYmIG91dHB1dERhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgc3RvcmVPYmogPSBsaW5rcy5wcm9jZXNzb3JzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChzdG9yZU9iaiAmJiBzdG9yZU9iai5wcm9jZXNzb3IgJiYgc3RvcmVPYmoucHJvY2Vzc29yLmdldFByb2Nlc3NlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRvZG86IHdlIGhhdmUgdG8gY3JlYXRlIHRoaXMgbmV3IG1ldGhvZCBpbiB0aGUgcHJvY2Vzc29yIHRvIHJldHVybiBhIHByb2Nlc3NlZCBKU09OIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YSA9IHN0b3JlT2JqLnByb2Nlc3Nvci5nZXRQcm9jZXNzZWREYXRhKG91dHB1dERhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBkcy5saW5rcy5vdXRwdXREYXRhID0gb3V0cHV0RGF0YTtcblxuICAgICAgICAvLyByYWlzZSB0aGUgZXZlbnQgZm9yIE91dHB1dERhdGEgbW9kaWZpZWQgZXZlbnRcbiAgICAgICAgZHMucmFpc2VFdmVudChldmVudExpc3QubW9kZWxVcGRhdGVkLCB7XG4gICAgICAgICAgICAnZGF0YSc6IGRzLmxpbmtzLm91dHB1dERhdGFcbiAgICAgICAgfSwgZHMpO1xuICAgIH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHREYXRhTW9kZWxQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkcyA9IHRoaXMsXG4gICAgICAgICAgICBkc0xpbmtzID0gZHMubGlua3MsXG4gICAgICAgICAgICByYXdDU1Y7XG4gICAgICAgIC8vIElmIHJhdyBDU1YgZGF0YSBpcyBwcmVzZW50LCBwYXJzZSB0aGUgY3N2IGRhdGEgc3luY2hyb25vdXNseSBhbmQgcmV0dXJuIHRoZSBqc29uIGRhdGFcbiAgICAgICAgaWYgKHJhd0NTViA9IGRzTGlua3MucmF3Q1NWKSB7XG4gICAgICAgICAgICBkZWxldGUgZHNMaW5rcy5yYXdDU1Y7XG4gICAgICAgICAgICByYXdDU1Yuc3luY2hyb25vdXNQYXJzZSA9IHRydWU7XG4gICAgICAgICAgICBkcy5wYXJzZVRvSlNPTihyYXdDU1YpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoZHNMaW5rcy5vdXRwdXREYXRhIHx8IGRzTGlua3MuaW5wdXREYXRhKTtcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGdldCBjaGlsZCBkYXRhIFN0b3JlIG9iamVjdCBhZnRlciBhcHBseWluZyBmaWx0ZXIgb24gdGhlIHBhcmVudCBkYXRhLlxuXHQvLyBAcGFyYW1zIHtmaWx0ZXJzfSAtIFRoaXMgY2FuIGJlIGEgZmlsdGVyIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIGZpbHRlciBmdW5jdGlvbnMuXG5cdERhdGFNb2RlbFByb3RvLmdldENoaWxkTW9kZWwgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuXHRcdHZhciBkcyA9IHRoaXMsXG5cdFx0XHRuZXdEcyxcbiAgICAgICAgICAgIG1ldGFJbmZvID0gZHMubGlua3MubWV0YU9iaixcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIG5ld0RTTGluayxcbiAgICAgICAgICAgIE1ldGFDb25zdHJ1Y3Rvcixcblx0XHRcdG1ldGFDb25zdHJhY3RvcixcbiAgICAgICAgICAgIGlucHV0U3RvcmVMaXN0bmVycztcbiAgICAgICAgbmV3RHMgPSBuZXcgRGF0YU1vZGVsKCk7XG4gICAgICAgIG5ld0RTTGluayA9IG5ld0RzLmxpbmtzO1xuICAgICAgICBuZXdEU0xpbmsuaW5wdXRTdG9yZSA9IGRzO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBsaXN0bmVyc1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnMgPSBuZXdEU0xpbmsuaW5wdXRTdG9yZUxpc3RuZXJzID0ge307XG4gICAgICAgIGlucHV0U3RvcmVMaXN0bmVyc1tldmVudExpc3QubW9kZWxVcGRhdGVkXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5ld0RzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuICAgICAgICB9O1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnNbZXZlbnRMaXN0Lm1vZGVsRGVsZXRlZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBuZXdEcy5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlucHV0U3RvcmVMaXN0bmVyc1tldmVudExpc3QubWV0YUluZm9VcGRhdGVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV3RHMucmFpc2VFdmVudChldmVudExpc3QubWV0YUluZm9VcGRhdGUsIHt9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbmhlcml0IG1ldGFJbmZvc1xuICAgICAgICBmb3IgKGtleSBpbiBtZXRhSW5mbykge1xuICAgICAgICAgICAgTWV0YUNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICBtZXRhQ29uc3RyYWN0b3IucHJvdG90eXBlID0gbWV0YUluZm9ba2V5XTtcbiAgICAgICAgICAgIG1ldGFDb25zdHJhY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNZXRhQ29uc3RydWN0b3I7XG4gICAgICAgICAgICBuZXdEU0xpbmsubWV0YU9ialtrZXldID0gbmV3IE1ldGFDb25zdHJ1Y3RvcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYXR0YWNoZWQgZXZlbnQgbGlzdGVuZXIgb24gcGFyZW50IGRhdGFcbiAgICAgICAgYWRkTGlzdG5lcnMoZHMsIGlucHV0U3RvcmVMaXN0bmVycyk7XG4gICAgICAgIG5ld0RzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuXG4gICAgICAgIG5ld0RzLmFkZERhdGFQcm9jZXNzb3IoZmlsdGVycyk7XG4gICAgICAgIHJldHVybiBuZXdEcztcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGFkZCBwcm9jZXNzb3IgaW4gdGhlIGRhdGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5hZGREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKHByb2Nlc3NvcnMpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgaSxcbiAgICAgICAgbCxcbiAgICAgICAgcHJvY2Vzc29yLFxuICAgICAgICBzdG9yZU9iajtcbiAgICAgICAgLy8gaWYgc2luZ2xlIGZpbHRlciBpcyBwYXNzZWQgbWFrZSBpdCBhbiBBcnJheVxuICAgICAgICBpZiAoIShwcm9jZXNzb3JzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBwcm9jZXNzb3JzID0gW3Byb2Nlc3NvcnNdO1xuICAgICAgICB9XG4gICAgICAgIGwgPSBwcm9jZXNzb3JzLmxlbmd0aDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgcHJvY2Vzc29yID0gcHJvY2Vzc29yc1tpXTtcbiAgICAgICAgICAgIGlmIChwcm9jZXNzb3IgJiYgcHJvY2Vzc29yLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBzdG9yZU9iaiA9IGdldFByb2Nlc3NvclN0b3JlT2JqKHByb2Nlc3NvciwgZHMpO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgbGlzdG5lcnNcbiAgICAgICAgICAgICAgICBhZGRMaXN0bmVycyhwcm9jZXNzb3IsIHN0b3JlT2JqLmxpc3RuZXJzKTtcbiAgICAgICAgICAgICAgICBkcy5saW5rcy5wcm9jZXNzb3JzLnB1c2goc3RvcmVPYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgb3V0cHV0RGF0YVxuICAgICAgICBkcy5fZ2VuZXJhdGVPdXRwdXREYXRhKCk7XG4gICAgfTtcbiAgICAvL0Z1bmN0aW9uIHRvIHJlbW92ZSBwcm9jZXNzb3IgaW4gdGhlIGRhdGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5yZW1vdmVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKHByb2Nlc3NvcnMpIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgcHJvY2Vzc29yc1N0b3JlID0gZHMubGlua3MucHJvY2Vzc29ycyxcbiAgICAgICAgc3RvcmVPYmosXG4gICAgICAgIGksXG4gICAgICAgIGwsXG4gICAgICAgIGosXG4gICAgICAgIGssXG4gICAgICAgIHByb2Nlc3NvcixcbiAgICAgICAgZm91bmRNYXRjaDtcbiAgICAgICAgLy8gaWYgc2luZ2xlIGZpbHRlciBpcyBwYXNzZWQgbWFrZSBpdCBhbiBBcnJheVxuICAgICAgICBpZiAoIShwcm9jZXNzb3JzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBwcm9jZXNzb3JzID0gW3Byb2Nlc3NvcnNdO1xuICAgICAgICB9XG4gICAgICAgIGsgPSBwcm9jZXNzb3JzLmxlbmd0aDtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGs7IGogKz0gMSkge1xuICAgICAgICAgICAgcHJvY2Vzc29yID0gcHJvY2Vzc29yc1tqXTtcbiAgICAgICAgICAgIGwgPSBwcm9jZXNzb3JzU3RvcmUubGVuZ3RoO1xuICAgICAgICAgICAgZm91bmRNYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGwgJiYgIWZvdW5kTWF0Y2g7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHN0b3JlT2JqID0gcHJvY2Vzc29yc1N0b3JlW2ldO1xuICAgICAgICAgICAgICAgIGlmICAoc3RvcmVPYmogJiYgc3RvcmVPYmoucHJvY2Vzc29yID09PSBwcm9jZXNzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RuZXJzKHByb2Nlc3Nvciwgc3RvcmVPYmoubGlzdG5lcnMpO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHByZWNlc3NvciBzdG9yZSBPYmpcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc29yc1N0b3JlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBvdXRwdXREYXRhXG4gICAgICAgIGRzLl9nZW5lcmF0ZU91dHB1dERhdGEoKTtcbiAgICB9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gYWRkIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFTdG9yZSBsZXZlbC5cblx0RGF0YU1vZGVsUHJvdG8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFTdG9yZSBsZXZlbC5cbiAgICBEYXRhTW9kZWxQcm90by5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIG11bHRpQ2hhcnRpbmdQcm90by5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB0aGlzKTtcblx0fTtcblxuICAgIERhdGFNb2RlbFByb3RvLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YU9iaikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCh0eXBlLCBkYXRhT2JqLCB0aGlzKTtcblx0fTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGFkZCBkYXRhIGluIHRoZSBkYXRhIHN0b3JlXG5cdERhdGFNb2RlbFByb3RvLnNldERhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzLCBjYWxsYmFjaykge1xuXHRcdHZhciBkcyA9IHRoaXMsXG5cdFx0XHRkYXRhVHlwZSA9IGRhdGFTcGVjcy5kYXRhVHlwZSxcblx0XHRcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZTtcblxuXHRcdGlmIChkYXRhVHlwZSA9PT0gJ2NzdicpIHtcblx0XHRcdGlmIChkYXRhU3BlY3MucGFyc2VUb0pTT04gPT09IDApIHtcbiAgICAgICAgICAgICAgICBkcy5saW5rcy5yYXdDU1YgPSBkYXRhU3BlY3M7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhU291cmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkcy5wYXJzZVRvSlNPTihkYXRhU3BlY3MsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYWxsYmFja0hlbHBlckZuKGRzLCBkYXRhU291cmNlLCBjYWxsYmFjayk7XG5cdFx0fVxuXHR9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gY29udmVydCBjc3YgZGF0YSB0byBqc29uIGRhdGFcbiAgICBEYXRhTW9kZWxQcm90by5wYXJzZVRvSlNPTiA9IGZ1bmN0aW9uIChkYXRhU3BlY3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkYXRhU291cmNlID0gdGhpcztcbiAgICAgICAgLy8gV2hlbiBvbmx5IGNhbGxiYWNrIGlzIGdpdmVuIGJ1eSB0aGUgdXNlci5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhU3BlY3MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGF0YVNwZWNzO1xuICAgICAgICAgICAgZGF0YVNwZWNzID0gZGF0YVNvdXJjZS5saW5rcy5yYXdDU1Y7XG4gICAgICAgIH1cblxuICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8uY29udmVydFRvQXJyYXkoe1xuICAgICAgICAgICAgc3luY2hyb25vdXNQYXJzZSA6IGRhdGFTcGVjcy5zeW5jaHJvbm91c1BhcnNlLFxuICAgICAgICAgICAgc3RyaW5nIDogZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG4gICAgICAgICAgICBkZWxpbWl0ZXIgOiBkYXRhU3BlY3MuZGVsaW1pdGVyLFxuICAgICAgICAgICAgb3V0cHV0Rm9ybWF0IDogZGF0YVNwZWNzLm91dHB1dEZvcm1hdCB8fCAyLFxuICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrSGVscGVyRm4oZGF0YVNvdXJjZSwgZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gcmVtb3ZlIGFsbCBkYXRhIChub3QgdGhlIGRhdGEgbGlua2VkIGZyb20gdGhlIHBhcmVudCkgaW4gdGhlIGRhdGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5jbGVhckRhdGEgPSBmdW5jdGlvbiAoKXtcbiAgICAgICAgdmFyIGRzID0gdGhpcztcbiAgICAgICAgLy8gY2xlYXIgaW5wdXREYXRhIHN0b3JlXG4gICAgICAgIGRzLmxpbmtzLmlucHV0SlNPTiAmJiAoZHMubGlua3MuaW5wdXRKU09OID0gdW5kZWZpbmVkKTtcbiAgICAgICAgLy8gcmUtZ2VuZXJhdGUgdGhlIHN0b3JlJ3MgZGF0YVxuICAgICAgICBkcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcbiAgICB9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gZGlzcG9zZSBhIHN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgZHMgPSB0aGlzLFxuICAgICAgICBsaW5rcyA9IGRzLmxpbmtzLFxuICAgICAgICBpbnB1dFN0b3JlID0gbGlua3MuaW5wdXRTdG9yZSxcbiAgICAgICAgcHJvY2Vzc29yc1N0b3JlID0gbGlua3MucHJvY2Vzc29ycyxcbiAgICAgICAgc3RvcmVPYmosXG4gICAgICAgIGk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGlub3V0U3RvcmUgbGlzdGVuZXJzXG4gICAgICAgIGlmIChpbnB1dFN0b3JlICYmIGlucHV0U3RvcmUucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgcmVtb3ZlTGlzdG5lcnMoaW5wdXRTdG9yZSwgbGlua3MuaW5wdXRTdG9yZUxpc3RuZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBhbGwgZmlsdGVycyBhbmQgdGhpciBsaXN0ZW5lcnNcbiAgICAgICAgZm9yIChpID0gcHJvY2Vzc29yc1N0b3JlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgICAgICAgICBzdG9yZU9iaiA9IHByb2Nlc3NvcnNTdG9yZVtpXTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgICAgICAgICByZW1vdmVMaXN0bmVycyhzdG9yZU9iai5wcm9jZXNzb3IsIHN0b3JlT2JqLmxpc3RuZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzb3JzU3RvcmUubGVuZ3RoID0gMDtcblxuICAgICAgICAvLyByYWlzZSB0aGUgZXZlbnQgZm9yIE91dHB1dERhdGEgbW9kaWZpZWQgZXZlbnRcbiAgICAgICAgZHMucmFpc2VFdmVudChldmVudExpc3QubW9kZWxEZWxldGVkLCB7fSk7XG5cblxuICAgICAgICAvLyBAdG9kbzogZGVsZXRlIGFsbCBsaW5rc1xuXG4gICAgICAgIC8vIEB0b2RvOiBjbGVhciBhbGwgZXZlbnRzIGFzIHRoZXkgd2lsbCBub3QgYmUgdXNlZCBhbnkgbW9yZVxuXG4gICAgfTtcbiAgICAvLyBGdW50aW9uIHRvIGdldCBhbGwgdGhlIGtleXMgb2YgdGhlIEpTT04gZGF0YVxuICAgIC8vIEB0b2RvOiBuZWVkIHRvIGltcHJvdmUgaXQgZm9yIHBlcmZvcm1hbmNlIGFzIHdlbGwgYXMgZm9yIGJldHRlciByZXN1bHRzXG5cdERhdGFNb2RlbFByb3RvLmdldEtleXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRzID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkcy5nZXRKU09OKCksXG5cdFx0XHRmaXJzdERhdGEgPSBkYXRhWzBdIHx8IHt9O1xuXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKGZpcnN0RGF0YSk7XG5cdH07XG5cblx0Ly8gRnVudGlvbiB0byBnZXQgYWxsIHRoZSB1bmlxdWUgdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXlcbiAgICAvLyBAdG9kbzogbmVlZCB0byBpbXByb3ZlIGl0IGZvciBwZXJmb3JtYW5jZSBhcyB3ZWxsIGFzIGZvciBiZXR0ZXIgcmVzdWx0c1xuXHREYXRhTW9kZWxQcm90by5nZXRVbmlxdWVWYWx1ZXMgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dmFyIGRzID0gdGhpcyxcblx0XHRcdGRhdGEgPSBkcy5nZXRKU09OKCksXG5cdFx0XHRpbnRlcm5hbERhdGEgPSBkYXRhWzBdLFxuXHRcdFx0aXNBcnJheSA9IGludGVybmFsRGF0YSBpbnN0YW5jZW9mIEFycmF5LFxuXHRcdFx0Ly91bmlxdWVWYWx1ZXMgPSBkcy51bmlxdWVWYWx1ZXNba2V5XSxcblx0XHRcdHRlbXBVbmlxdWVWYWx1ZXMgPSB7fSxcblx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoLFxuXHRcdFx0aTtcblxuXHRcdC8vIGlmICh1bmlxdWVWYWx1ZXMpIHtcblx0XHQvLyBcdHJldHVybiB1bmlxdWVWYWx1ZXM7XG5cdFx0Ly8gfVxuXG5cdFx0aWYgKGlzQXJyYXkpIHtcblx0XHRcdGkgPSAxO1xuXHRcdFx0a2V5ID0gZHMuZ2V0S2V5cygpLmZpbmRJbmRleChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC50b1VwcGVyQ2FzZSgpID09PSBrZXkudG9VcHBlckNhc2UoKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGkgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IGlzQXJyYXkgPyAxIDogMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpbnRlcm5hbERhdGEgPSBpc0FycmF5ID8gZGF0YVtpXVtrZXldIDogZGF0YVtpXVtrZXldO1xuXHRcdFx0IXRlbXBVbmlxdWVWYWx1ZXNbaW50ZXJuYWxEYXRhXSAmJiAodGVtcFVuaXF1ZVZhbHVlc1tpbnRlcm5hbERhdGFdID0gdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKHRlbXBVbmlxdWVWYWx1ZXMpO1xuXHR9O1xuXG4gICAgLy8gRnVuY3Rpb24gdG8gYWRkIC8gdXBkYXRlIG1ldGFkYXRhXG5cdERhdGFNb2RlbFByb3RvLnVwZGF0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgbWV0YUluZm8pIHtcbiAgICAgICAgdmFyIGRzID0gdGhpcyxcbiAgICAgICAgbWV0YU9iaiA9IGRzLmxpbmtzLm1ldGFPYmosXG4gICAgICAgIGZpZWxkTWV0YUluZm8sIGtleTtcblx0XHRpZiAoZmllbGRNZXRhSW5mbyA9IG1ldGFPYmpbZmllbGROYW1lXSkge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gbWV0YUluZm8pIHtcbiAgICAgICAgICAgICAgICBmaWVsZE1ldGFJbmZvW2tleV0gPSBtZXRhSW5mb1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRzLnJhaXNlRXZlbnQoZXZlbnRMaXN0Lm1ldGFJbmZvVXBkYXRlLCB7fSk7XG5cdH07XG5cbiAgICAvKkZ1bmN0aW9uIHRvIGFkZCBtZXRhZGF0YVxuICAgICAgICBOb3QgcmVxdWlyZWRcbiAgICBcdERhdGFNb2RlbFByb3RvLmRlbGV0ZU1ldGFEYXRhID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgbWV0YUluZm9LZXkpIHtcbiAgICAgICAgICAgIHZhciBkcyA9IHRoaXMsXG4gICAgICAgICAgICBtZXRhT2JqID0gZHMubGlua3MubWV0YU9iajtcbiAgICAgICAgICAgIGlmIChtZXRhT2JqW2ZpZWxkTmFtZV0pIHtcbiAgICAgICAgICAgICAgICBtZXRhT2JqW2ZpZWxkTmFtZV1bbWV0YUluZm9LZXldID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXHR9OyovXG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBhZGRlZCBtZXRhRGF0YVxuXHREYXRhTW9kZWxQcm90by5nZXRNZXRhRGF0YSA9IGZ1bmN0aW9uIChmaWVsZE5hbWUpIHtcblx0XHR2YXIgZHMgPSB0aGlzLFxuICAgICAgICBtZXRhT2JqID0gZHMubGlua3MubWV0YU9iajtcbiAgICAgICAgcmV0dXJuIGZpZWxkTmFtZSA/IChtZXRhT2JqW2ZpZWxkTmFtZV0gfHwge30pIDogbWV0YU9iajtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSB0byB0aGUgZGF0YVN0b3JhZ2UgYXN5bmNocm9ub3VzbHkgdmlhIGFqYXhcbiAgICBEYXRhTW9kZWxQcm90by5zZXREYXRhVXJsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YVN0b3JlID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IGFyZ3VtZW50LmRhdGFTb3VyY2UsXG4gICAgICAgICAgICBkYXRhVHlwZSA9IGFyZ3VtZW50LmRhdGFUeXBlLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBhcmd1bWVudHNbMV0sXG4gICAgICAgICAgICBjYWxsYmFja0FyZ3MgPSBhcmd1bWVudC5jYWxsYmFja0FyZ3MsXG4gICAgICAgICAgICBkYXRhO1xuXG4gICAgICAgIG11bHRpQ2hhcnRpbmdQcm90by5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGRhdGFTb3VyY2UsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGRhdGFUeXBlID09PSAnanNvbicgPyBKU09OLnBhcnNlKHN0cmluZykgOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgYXJndW1lbnQuZGF0YVNvdXJjZSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgZGF0YVN0b3JlLnNldERhdGEoYXJndW1lbnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNhbGxiYWNrQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUgPSB7fSxcblx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbmsgPSB7fSxcblx0XHRmaWx0ZXJJZENvdW50ID0gMCxcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSxcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSxcblx0XHRldmVudExpc3QgPSB7XG4gICAgICAgICAgICAnbW9kZWxVcGRhdGVkJzogJ21vZGVsdXBkYXRlZCcsXG4gICAgICAgICAgICAnbW9kZWxEZWxldGVkJzogJ21vZGVsZGVsZXRlZCcsXG4gICAgICAgICAgICAnbWV0YUluZm9VcGRhdGUnOiAnbWV0YWluZm91cGRhdGVkJyxcbiAgICAgICAgICAgICdwcm9jZXNzb3JVcGRhdGVkJzogJ3Byb2Nlc3NvcnVwZGF0ZWQnLFxuICAgICAgICAgICAgJ3Byb2Nlc3NvckRlbGV0ZWQnOiAncHJvY2Vzc29yZGVsZXRlZCdcbiAgICAgICAgfSxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVByb2Nlc3Nvci5cblx0XHREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuYWRkUnVsZShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0XG5cdFx0ZGF0YVByb2Nlc3NvclByb3RvID0gRGF0YVByb2Nlc3Nvci5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byB1cGRhdGUgZGF0YSBvbiBjaGFuZ2Ugb2YgZmlsdGVyLlxuXHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvciA9IGZ1bmN0aW9uIChpZCwgY29weVBhcmVudFRvQ2hpbGQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRkYXRhID0gZmlsdGVyTGlua1tpZF0sXG5cdFx0XHRcdEpTT05EYXRhLFxuXHRcdFx0XHRkYXR1bSxcblx0XHRcdFx0ZGF0YUlkLFxuXHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXR1bSA9IGRhdGFbaV07XG5cdFx0XHRcdGRhdGFJZCA9IGRhdHVtLmlkO1xuXHRcdFx0XHRpZiAoIWxpYi50ZW1wRGF0YVVwZGF0ZWRbZGF0YUlkXSkge1xuXHRcdFx0XHRcdGlmIChwYXJlbnRTdG9yZVtkYXRhSWRdICYmIGRhdGFTdG9yYWdlW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRcdEpTT05EYXRhID0gcGFyZW50U3RvcmVbZGF0YUlkXS5nZXREYXRhKCk7XG5cdFx0XHRcdFx0XHRkYXR1bS5tb2RpZnlEYXRhKGNvcHlQYXJlbnRUb0NoaWxkID8gSlNPTkRhdGEgOiBmaWx0ZXJTdG9yZVtpZF0oSlNPTkRhdGEpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgcGFyZW50U3RvcmVbZGF0YUlkXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVByb2Nlc3Nvcihhcmd1bWVudHNbMF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBmaWx0ZXIgaW4gdGhlIGZpbHRlciBzdG9yZVxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdG9sZElkID0gZmlsdGVyLmlkLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRmaWx0ZXJGbiA9IChhcmd1bWVudCAmJiBhcmd1bWVudC5ydWxlKSB8fCBhcmd1bWVudCxcblx0XHRcdGlkID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZSxcblx0XHRcdHR5cGUgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlO1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZmlsdGVyU3RvcmUnICsgZmlsdGVySWRDb3VudCArKztcblx0XHRmaWx0ZXJTdG9yZVtpZF0gPSBmaWx0ZXJGbjtcblxuXHRcdGZpbHRlci5pZCA9IGlkO1xuXHRcdGZpbHRlci50eXBlID0gdHlwZTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgZGF0YSBvbiB3aGljaCB0aGUgZmlsdGVyIGlzIGFwcGxpZWQgYW5kIGFsc28gb24gdGhlIGNoaWxkIGRhdGEuXG5cdFx0aWYgKGZpbHRlckxpbmtbaWRdKSB7XG5cdFx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQpO1xuXHRcdH1cblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KGV2ZW50TGlzdC5wcm9jZXNzb3JVcGRhdGVkLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IGZpbHRlckZuXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCB0aGUgZmlsdGVyIG1ldGhvZC5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldFByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZmlsdGVyU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBJRCBvZiB0aGUgZmlsdGVyLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnRMaXN0LnByb2Nlc3NvckRlbGV0ZWQsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2ZpbHRlcidcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5zb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnc29ydCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5tYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdtYXAnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0UHJvY2Vzc2VkRGF0YSA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdHZhciBkYXRhUHJvY2Vzc29yID0gdGhpcyxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRmaWx0ZXJGbiA9IGRhdGFQcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGNhc2UgICdmaWx0ZXInIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuICAgICAgICAgICAgY2FzZSAnbWFwJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIFxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhUHJvY2Vzc29yIGxldmVsLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFQcm9jZXNzb3IgbGV2ZWwuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YU9iaikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCh0eXBlLCBkYXRhT2JqLCB0aGlzKTtcblx0fTtcblxufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDIsXG4gICAgICAgIE5VTEwgPSBudWxsLFxuICAgICAgICBDT0xPUiA9ICdjb2xvcicsXG4gICAgICAgIFBBTEVUVEVDT0xPUlMgPSAncGFsZXR0ZUNvbG9ycyc7XG4gICAgLy9mdW5jdGlvbiB0byBjb252ZXJ0IGRhdGEsIGl0IHJldHVybnMgZmMgc3VwcG9ydGVkIEpTT05cbiAgICB2YXIgRGF0YUFkYXB0ZXIgPSBmdW5jdGlvbiAoZGF0YVNvdXJjZSwgY29uZiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcztcblxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhU3RvcmUgPSBkYXRhU291cmNlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldEpTT04oKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbiA9IGNvbmY7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIGRhdGFhZGFwdGVyLkZDanNvbiA9IGRhdGFhZGFwdGVyLl9fY29udmVydERhdGFfXygpO1xuICAgIH0sXG4gICAgcHJvdG9EYXRhYWRhcHRlciA9IERhdGFBZGFwdGVyLnByb3RvdHlwZTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19jb252ZXJ0RGF0YV9fID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSxcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhLFxuICAgICAgICAgICAganNvbiA9IHt9LFxuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSB7fSxcbiAgICAgICAgICAgIGpzb25EYXRhID0gZGF0YWFkYXB0ZXIuZGF0YUpTT04sXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZGF0YWFkYXB0ZXIuY2FsbGJhY2ssXG4gICAgICAgICAgICBpc01ldGFEYXRhID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlICYmIChkYXRhYWRhcHRlci5kYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSA/IHRydWUgOiBmYWxzZSk7XG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IGNvbmZpZ3VyYXRpb24gJiYgY29uZmlndXJhdGlvbi5jb25maWc7XG5cbiAgICAgICAgaWYgKGpzb25EYXRhICYmIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhID0gZGF0YWFkYXB0ZXIuX19nZW5lcmFsRGF0YUZvcm1hdF9fKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyA9IGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhYWRhcHRlci5kYXRhU3RvcmUuZ2V0VW5pcXVlVmFsdWVzKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uWzBdKTtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcyAmJiAoYWdncmVnYXRlZERhdGEgPSBkYXRhYWRhcHRlci5fX2dldFNvcnRlZERhdGFfXyhnZW5lcmFsRGF0YSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24uY2F0ZWdvcmllcywgY29uZmlndXJhdGlvbi5kaW1lbnNpb24sIGNvbmZpZ3VyYXRpb24uYWdncmVnYXRlTW9kZSkpO1xuICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBhZ2dyZWdhdGVkRGF0YSB8fCBnZW5lcmFsRGF0YTtcbiAgICAgICAgICAgIGRhdGFhZGFwdGVyLmFnZ3JlZ2F0ZWREYXRhID0gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICBqc29uID0gZGF0YWFkYXB0ZXIuX19qc29uQ3JlYXRvcl9fKGFnZ3JlZ2F0ZWREYXRhLCBjb25maWd1cmF0aW9uKTsgICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBqc29uID0gKHByZWRlZmluZWRKc29uICYmIGV4dGVuZDIoanNvbixwcmVkZWZpbmVkSnNvbikpIHx8IGpzb247XG4gICAgICAgIGpzb24gPSAoY2FsbGJhY2sgJiYgY2FsbGJhY2soanNvbikpIHx8IGpzb247XG4gICAgICAgIHJldHVybiBpc01ldGFEYXRhID8gZGF0YWFkYXB0ZXIuX19zZXREZWZhdWx0QXR0cl9fKGpzb24pIDoganNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5fX2dldFNvcnRlZERhdGFfXyA9IGZ1bmN0aW9uIChkYXRhLCBjYXRlZ29yeUFyciwgZGltZW5zaW9uLCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBpbmRlb3hPZktleSxcbiAgICAgICAgICAgIG5ld0RhdGEgPSBbXSxcbiAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXSxcbiAgICAgICAgICAgIGtleSA9IFtdLFxuICAgICAgICAgICAgY2F0ZWdvcmllcyA9IFtdLFxuICAgICAgICAgICAgbGVuS2V5LFxuICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgIGxlbkNhdCxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGFyciA9IFtdLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlO1xuICBcbiAgICAgICAgKEFycmF5LmlzQXJyYXkoZGltZW5zaW9uKSAmJiAoa2V5ID0gZGltZW5zaW9uKSkgfHwgKGtleSA9IFtkaW1lbnNpb25dKTtcblxuICAgICAgICAoY2F0ZWdvcnlBcnIgJiYgY2F0ZWdvcnlBcnIubGVuZ3RoKSB8fCAoY2F0ZWdvcnlBcnIgPSBkYXRhU3RvcmUuZ2V0VW5pcXVlVmFsdWVzKGtleVswXSkpO1xuICAgICAgICAoQXJyYXkuaXNBcnJheShjYXRlZ29yeUFyclswXSkgJiYgKGNhdGVnb3JpZXMgPSBjYXRlZ29yeUFycikpIHx8IChjYXRlZ29yaWVzID0gW2NhdGVnb3J5QXJyXSk7XG5cbiAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbMF0pO1xuICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgaW5kZW94T2ZLZXkgPSBkYXRhWzBdLmluZGV4T2Yoa2V5W2tdKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yKGkgPSAwLGxlbkNhdCA9IGNhdGVnb3JpZXNba10ubGVuZ3RoOyBpIDwgbGVuQ2F0ICAmJiBpbmRlb3hPZktleSAhPT0gLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBkYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAoZGF0YVtqXVtpbmRlb3hPZktleV0gPT0gY2F0ZWdvcmllc1trXVtpXSkgJiYgKHN1YlNldERhdGEucHVzaChkYXRhW2pdKSk7XG4gICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgYXJyW2luZGVveE9mS2V5XSA9IGNhdGVnb3JpZXNba11baV07XG4gICAgICAgICAgICAgICAgKHN1YlNldERhdGEubGVuZ3RoID09PSAwKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGFycikpO1xuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhYWRhcHRlci5fX2dldEFnZ3JlZ2F0ZURhdGFfXyhzdWJTZXREYXRhLCBjYXRlZ29yaWVzW2tdW2ldLCBhZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci51cGRhdGUgPSBmdW5jdGlvbiAoZGF0YVNvdXJjZSwgY29uZiwgY2FsbGJhY2spe1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzO1xuXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZSA9IGRhdGFTb3VyY2UgfHwgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldEpTT04oKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbiA9IGNvbmYgfHwgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbjtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBkYXRhYWRhcHRlci5jYWxsYmFjaztcbiAgICAgICAgZGF0YWFkYXB0ZXIuRkNqc29uID0gZGF0YWFkYXB0ZXIuX19jb252ZXJ0RGF0YV9fKCk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19zZXREZWZhdWx0QXR0cl9fID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9ICcnLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLFxuICAgICAgICAgICAgY29uZiA9IGRhdGFhZGFwdGVyICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZiAmJiBjb25mLm1lYXN1cmUgfHwgW10sXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSxcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbMF1dICYmIG1ldGFEYXRhW21lYXN1cmVbMF1dO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1ldGFEYXRhTWVhc3VyZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKHBhbGV0dGVDb2xvcnMgPSBwYWxldHRlQ29sb3JzICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobWV0YURhdGFNZWFzdXJlW0NPTE9SXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKSk7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnRbUEFMRVRURUNPTE9SU10gPSBwYWxldHRlQ29sb3JzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ21zJyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uZGF0YXNldC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmUgPSBtZXRhRGF0YVttZWFzdXJlW2ldXSAmJiBtZXRhRGF0YVttZWFzdXJlW2ldXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlICYmIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKGpzb24uZGF0YXNldFtpXVtDT0xPUl0gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChtZXRhRGF0YU1lYXN1cmVbQ09MT1JdIGluc3RhbmNlb2YgRnVuY3Rpb24pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBtZXRhRGF0YU1lYXN1cmUgJiZtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobWV0YURhdGFNZWFzdXJlW0NPTE9SXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yICYmIChqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLnBsb3RbQ09MT1JdID0gY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG5cbiAgICAgICAganNvbi5jaGFydCB8fCAoanNvbi5jaGFydCA9IHt9KTtcbiAgICAgICAgXG4gICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9IChtZXRhRGF0YSAmJiBKU09OLnN0cmluZ2lmeShqc29uLCBmdW5jdGlvbihrLHYpe1xuICAgICAgICAgICAgaWYoayA9PSAnY29sb3InKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5VTEw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSkpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgICBqc29uID0gKGtleUV4Y2x1ZGVkSnNvblN0ciAmJiBKU09OLnBhcnNlKGtleUV4Y2x1ZGVkSnNvblN0cikpIHx8IGpzb247XG5cbiAgICAgICAgc2VyaWVzW3Nlcmllc1R5cGVdKCk7XG5cbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19nZXRBZ2dyZWdhdGVEYXRhX18gPSBmdW5jdGlvbiAoZGF0YSwga2V5LCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBhZ2dyZWdhdGVNZXRob2QgPSB7XG4gICAgICAgICAgICAnc3VtJyA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChkYXRhW2ldW2pdID09IGtleSkgJiYgKGFnZ3JlZ2F0ZWREYXRhW2pdID0ga2V5KTsgXG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YVtqXSB8fCAoYWdncmVnYXRlZERhdGFbal0gPSAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChkYXRhW2ldW2pdICE9IGtleSkgJiYgKGFnZ3JlZ2F0ZWREYXRhW2pdID0gTnVtYmVyKGFnZ3JlZ2F0ZWREYXRhW2pdKSArIE51bWJlcihkYXRhW2ldW2pdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdhdmVyYWdlJyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBpQWdncmVnYXRlTXRoZCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGxlblIgPSBkYXRhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFN1bUFyciA9IGlBZ2dyZWdhdGVNdGhkLnN1bSgpLFxuICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gW107XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBhZ2dyZWdhdGVkU3VtQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgKChhZ2dyZWdhdGVkU3VtQXJyW2ldICE9IGtleSkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAoYWdncmVnYXRlZERhdGFbaV0gPSAoTnVtYmVyKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pKSAvIGxlblIpKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IGFnZ3JlZ2F0ZWRTdW1BcnJbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYWdncmVnYXRlTW9kZSA9IGFnZ3JlZ2F0ZU1vZGUgJiYgYWdncmVnYXRlTW9kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gKGFnZ3JlZ2F0ZU1ldGhvZFthZ2dyZWdhdGVNb2RlXSAmJiBhZ2dyZWdhdGVNb2RlKSB8fCAnc3VtJztcblxuICAgICAgICByZXR1cm4gYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdKCk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19nZW5lcmFsRGF0YUZvcm1hdF9fID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGpzb25EYXRhWzBdKSxcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXkgPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgbGVuR2VuZXJhbERhdGFBcnJheSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGltZW5zaW9uID0gY29uZmlndXJhdGlvbi5kaW1lbnNpb24gfHwgW10sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlIHx8IFtdO1xuICAgICAgICBpZiAoIWlzQXJyYXkpe1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXSA9IFtdO1xuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVswXS5wdXNoKGRpbWVuc2lvbik7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gZ2VuZXJhbERhdGFBcnJheVswXVswXS5jb25jYXQobWVhc3VyZSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBqc29uRGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbaSsxXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkdlbmVyYWxEYXRhQXJyYXkgPSBnZW5lcmFsRGF0YUFycmF5WzBdLmxlbmd0aDsgaiA8IGxlbkdlbmVyYWxEYXRhQXJyYXk7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2ldW2dlbmVyYWxEYXRhQXJyYXlbMF1bal1dOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbaSsxXVtqXSA9IHZhbHVlIHx8ICcnOyAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ganNvbkRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlbmVyYWxEYXRhQXJyYXk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19qc29uQ3JlYXRvcl9fID0gZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIGNvbmYgPSBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgc2VyaWVzVHlwZSA9IGNvbmYgJiYgY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgc2VyaWVzID0ge1xuICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiBbICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzWzBdLmNhdGVnb3J5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Nlcmllc25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3NzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoVmFsdWUsIFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0ganNvbkRhdGFbal1baW5kZXhNYXRjaExhYmVsXTsgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbal1baW5kZXhNYXRjaFZhbHVlXTsgXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGxhYmVsIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiB2YWx1ZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3RzJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXNbaV0gPSB7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXS5kYXRhLnB1c2goanNvbkRhdGFbal1baW5kZXhNYXRjaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgIHJldHVybiBjb25mLm1lYXN1cmUgJiYgY29uZi5kaW1lbnNpb24gJiYgc2VyaWVzW3Nlcmllc1R5cGVdKGpzb25EYXRhLCBjb25mKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRKU09OID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLkZDanNvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhSnNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhSlNPTjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRBZ2dyZWdhdGVkRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGVkRGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREaW1lbnNpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbi5kaW1lbnNpb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TWVhc3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLm1lYXN1cmU7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0TGltaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIG1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgICAgIG1pbiA9ICtJbmZpbml0eSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhYWRhcHRlci5hZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gZGF0YSAmJiBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSArZGF0YVtpXVtqXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWF4ID0gbWF4IDwgdmFsdWUgPyB2YWx1ZSA6IG1heCk7XG4gICAgICAgICAgICAgICAgdmFsdWUgJiYgKG1pbiA9IG1pbiA+IHZhbHVlID8gdmFsdWUgOiBtaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbWluJyA6IG1pbixcbiAgICAgICAgICAgICdtYXgnIDogbWF4XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuZ2V0RGF0YVN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFTdG9yZTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRDYXRlZ29yaWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmNhdGVnb3JpZXM7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFBZGFwdGVyID0gZnVuY3Rpb24gKGRhdGFTb3VyY2UsIGNvbmYsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YUFkYXB0ZXIoZGF0YVNvdXJjZSwgY29uZiwgY2FsbGJhY2spO1xuICAgIH07XG59KTsiLCIgLyogZ2xvYmFsIEZ1c2lvbkNoYXJ0czogdHJ1ZSAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICAgICAgZGVlcENvcHkgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZGVlcENvcHksXG4gICAgXHRNQVhfUEVSQ0VOVCA9ICcxMDAlJyxcbiAgICAgICAgZGF0YUFkYXB0ZXIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5kYXRhQWRhcHRlcixcbiAgICAgICAgSUQgPSAnY2hhcnQtY29udGFpbmVyLScsXG4gICAgICAgIGNoYXJ0SWQgPSAwLFxuICAgICAgICBQWCA9ICdweCcsXG4gICAgICAgIFNQQU4gPSAnc3BhbicsXG4gICAgICAgIENoYXJ0ID0gZnVuY3Rpb24oY29uZikge1xuICAgICAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkYXRhQWRhcHRlckNvbmYgPSB7fSxcbiAgICAgICAgICAgICAgICBjcmVhdGVDaGFydENvbmYgPSB7fSxcbiAgICAgICAgICAgICAgICBkYXRhU3RvcmU7XG5cbiAgICAgICAgICAgIGNoYXJ0LmlzQ2hhcnQgPSB0cnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGFydC5jb25mID0ge307XG5cbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oY2hhcnQuY29uZiwgY29uZik7XG5cbiAgICAgICAgICAgIGNoYXJ0LmF1dG9VcGRhdGUgPSBjaGFydC5jb25mLmF1dG9VcGRhdGUgfHwgMTtcblxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJDb25mID0ge1xuICAgICAgICAgICAgICAgICdkaW1lbnNpb24nIDogY2hhcnQuY29uZi5kaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgJ21lYXN1cmUnIDogY2hhcnQuY29uZi5tZWFzdXJlLFxuICAgICAgICAgICAgICAgICdzZXJpZXNUeXBlJyA6IGNoYXJ0LmNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgICAgICAnY2F0ZWdvcmllcycgOiBjaGFydC5jb25mLmNhdGVnb3JpZXMsXG4gICAgICAgICAgICAgICAgJ2FnZ3JlZ2F0ZU1vZGUnIDogY2hhcnQuY29uZi5hZ2dyZWdhdGlvbixcbiAgICAgICAgICAgICAgICAnY29uZmlnJyA6IGNoYXJ0LmNvbmYuY29uZmlnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjaGFydC5kYXRhQWRhcHRlciA9IGRhdGFBZGFwdGVyKGNvbmYuZGF0YVNvdXJjZSwgZGF0YUFkYXB0ZXJDb25mLCBjb25mLmNhbGxiYWNrKTtcblxuICAgICAgICAgICAgZGF0YVN0b3JlID0gY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0RGF0YVN0b3JlKCk7XG5cbiAgICAgICAgICAgIGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuYWRkRXZlbnRMaXN0ZW5lcignbW9kZWxVcGRhdGVkJyxmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjaGFydC51cGRhdGUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjcmVhdGVDaGFydENvbmYgPSB7XG4gICAgICAgICAgICAgICAgJ3R5cGUnIDogY2hhcnQuY29uZi50eXBlLFxuICAgICAgICAgICAgICAgICd3aWR0aCcgOiBjaGFydC5jb25mLndpZHRoIHx8IE1BWF9QRVJDRU5ULFxuICAgICAgICAgICAgICAgICdoZWlnaHQnIDogY2hhcnQuY29uZi5oZWlnaHQgfHwgTUFYX1BFUkNFTlQsXG4gICAgICAgICAgICAgICAgJ2RhdGFTb3VyY2UnIDogY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0SlNPTigpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjaGFydC5jaGFydEluc3RhbmNlID0gY2hhcnQuX19jcmVhdGVDaGFydF9fKGNyZWF0ZUNoYXJ0Q29uZik7XG4gICAgICAgIH0sXG4gICAgICAgIFByb3RvQ2hhcnQgPSBDaGFydC5wcm90b3R5cGU7XG5cbiAgICBQcm90b0NoYXJ0Ll9fY3JlYXRlQ2hhcnRfXyA9IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgIHZhciBjaGFydCA9IHRoaXMsXG4gICAgICAgICAgICBjaGFydE9iajtcblxuICAgICAgICAvL3JlbmRlciBGQyBcbiAgICAgICAgY2hhcnRPYmogPSBuZXcgRnVzaW9uQ2hhcnRzKGpzb24pO1xuXG4gICAgICAgIGNoYXJ0T2JqLmFkZEV2ZW50TGlzdGVuZXIoJ3RyZW5kUmVnaW9uUm9sbE92ZXInLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICAgdmFyIGRhdGFPYmogPSBjaGFydC5fX2dldFJvd0RhdGFfXyhkLmNhdGVnb3J5TGFiZWwpO1xuICAgICAgICAgICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUucmFpc2VFdmVudCgnaG92ZXJpbicsIHtcbiAgICAgICAgICAgICAgICBkYXRhIDogZGF0YU9iaixcbiAgICAgICAgICAgICAgICBjYXRlZ29yeUxhYmVsIDogZC5jYXRlZ29yeUxhYmVsXG4gICAgICAgICAgICB9LCBjaGFydCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgY2hhcnRPYmouYWRkRXZlbnRMaXN0ZW5lcigndHJlbmRSZWdpb25Sb2xsT3V0JywgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUucmFpc2VFdmVudCgnaG92ZXJvdXQnLCB7XG4gICAgICAgICAgICAgICBjYXRlZ29yeUxhYmVsIDogZC5jYXRlZ29yeUxhYmVsXG4gICAgICAgICAgIH0sIGNoYXJ0KTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgIHJldHVybiBjaGFydE9iajtcbiAgICB9O1xuXG4gICAgUHJvdG9DaGFydC51cGRhdGUgPSBmdW5jdGlvbihjb25mKXtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGRhdGFBZGFwdGVyQ29uZiA9IHt9LFxuICAgICAgICAgICAgY3JlYXRlQ2hhcnRDb25mID0gIHt9O1xuXG4gICAgICAgIGNvbmYgPSBjb25mIHx8IHt9O1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24oY2hhcnQuY29uZiwgY29uZik7XG5cbiAgICAgICAgZGF0YUFkYXB0ZXJDb25mID0ge1xuICAgICAgICAgICAgJ2RpbWVuc2lvbicgOiBjaGFydC5jb25mLmRpbWVuc2lvbixcbiAgICAgICAgICAgICdtZWFzdXJlJyA6IGNoYXJ0LmNvbmYubWVhc3VyZSxcbiAgICAgICAgICAgICdzZXJpZXNUeXBlJyA6IGNoYXJ0LmNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgICdjYXRlZ29yaWVzJyA6IGNoYXJ0LmNvbmYuY2F0ZWdvcmllcyxcbiAgICAgICAgICAgICdhZ2dyZWdhdGVNb2RlJyA6IGNoYXJ0LmNvbmYuYWdncmVnYXRpb24sXG4gICAgICAgICAgICAnY29uZmlnJyA6IGNoYXJ0LmNvbmYuY29uZmlnXG4gICAgICAgIH07XG4gICAgICAgIGNoYXJ0LmRhdGFBZGFwdGVyLnVwZGF0ZShjb25mLmRhdGFTb3VyY2UsIGRhdGFBZGFwdGVyQ29uZiwgY29uZi5jYWxsYmFjayk7XG5cbiAgICAgICAgY3JlYXRlQ2hhcnRDb25mID0ge1xuICAgICAgICAgICAgJ3R5cGUnIDogY2hhcnQuY29uZi50eXBlLFxuICAgICAgICAgICAgJ3dpZHRoJyA6IGNoYXJ0LmNvbmYud2lkdGggfHwgTUFYX1BFUkNFTlQsXG4gICAgICAgICAgICAnaGVpZ2h0JyA6IGNoYXJ0LmNvbmYuaGVpZ2h0IHx8IE1BWF9QRVJDRU5ULFxuICAgICAgICAgICAgJ2RhdGFTb3VyY2UnIDogY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0SlNPTigpXG4gICAgICAgIH07XG4gICAgICAgIGNoYXJ0Ll9fY2hhcnRVcGRhdGVfXyhjcmVhdGVDaGFydENvbmYpO1xuICAgICAgICByZXR1cm4gY2hhcnQ7XG4gICAgfTtcblxuICAgIFByb3RvQ2hhcnQuZ2V0Q2hhcnRJbnN0YW5jZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGFydEluc3RhbmNlO1xuICAgIH07XG5cbiAgICBQcm90b0NoYXJ0LmdldENvbmYgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgY29uZiA9IHt9O1xuICAgIFx0T2JqZWN0LmFzc2lnbihjb25mLCB0aGlzLmNvbmYpO1xuICAgIFx0cmV0dXJuIGNvbmY7XG4gICAgfTtcblxuICAgIFByb3RvQ2hhcnQucmVuZGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgXHRjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cblx0XHRpZCAmJiBjaGFydC5jaGFydEluc3RhbmNlLnJlbmRlcihjaGFydC5fX2NoYXJ0Q29udGFpbmVyX18oY29udGFpbmVyKSk7XG4gICAgfTtcblxuXHRQcm90b0NoYXJ0Ll9fY2hhcnRDb250YWluZXJfXyA9IGZ1bmN0aW9uKGNvbnRhaW5lcikge1xuXHRcdHZhciBjaGFydCA9IHRoaXMsXG5cdFx0XHRpZCA9IGNoYXJ0Ll9faWRDcmVhdG9yX18oKTtcblxuXHRcdGNoYXJ0LmNvbnRhaW5lciA9IHt9O1xuXHRcdGNoYXJ0LmNvbnRhaW5lci5jb25maWcgPSB7fTtcblx0XHRjaGFydC5jb250YWluZXIuY29uZmlnLmlkID0gaWQ7XG5cdFx0Y2hhcnQuY29udGFpbmVyLmdyYXBoaWNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChTUEFOKTtcblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3MuaWQgPSBpZDtcblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3Muc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGNoYXJ0LmNvbnRhaW5lci5ncmFwaGljcyk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9O1xuXG5cdFByb3RvQ2hhcnQuZ2V0Q2hhcnRDb250YWluZXIgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jb250YWluZXI7XG5cdH07XG5cblx0UHJvdG9DaGFydC51cGRhdGVDaGFydENvbnRhaW5lciA9IGZ1bmN0aW9uKGNvbmZpZykge1xuXHRcdHZhciBjaGFydCA9IHRoaXM7XG5cblx0XHRjb25maWcgfHwgKGNvbmZpZyA9IHt9KTtcblx0XHRPYmplY3QuYXNzaWduKGNoYXJ0LmNvbnRhaW5lci5jb25maWcsIGNvbmZpZyk7XG5cblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3MuaGVpZ2h0ID0gY2hhcnQuY29udGFpbmVyLmhlaWdodCArIFBYO1xuXHRcdGNoYXJ0LmNvbnRhaW5lci5ncmFwaGljcy53aWR0aCA9IGNoYXJ0LmNvbnRhaW5lci53aWR0aCArIFBYO1xuXHR9O1xuXG5cdFByb3RvQ2hhcnQuX19pZENyZWF0b3JfXyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNoYXJ0SWQrKzsgICAgICAgXG4gICAgICAgIHJldHVybiBJRCArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIFByb3RvQ2hhcnQuZ2V0TGltaXQgPSBmdW5jdGlvbigpe1xuICAgIFx0cmV0dXJuIHRoaXMuZGF0YUFkYXB0ZXIgJiYgdGhpcy5kYXRhQWRhcHRlci5nZXRMaW1pdCgpO1xuICAgIH07XG5cbiAgICBQcm90b0NoYXJ0Ll9fY2hhcnRVcGRhdGVfXyA9IGZ1bmN0aW9uKGpzb24pe1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICBjaGFydEpzb24gPSBqc29uIHx8IHt9O1xuXG4gICAgICAgIGlmKGNoYXJ0LmNoYXJ0SW5zdGFuY2UuY2hhcnRUeXBlKCkgIT0gY2hhcnRKc29uLnR5cGUpIHtcbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0SW5zdGFuY2UuY2hhcnRUeXBlKGNoYXJ0SnNvbi50eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBjaGFydC5jaGFydEluc3RhbmNlLnNldEpTT05EYXRhKGNoYXJ0SnNvbi5kYXRhU291cmNlKTtcbiAgICAgfTtcblxuICAgIFByb3RvQ2hhcnQuX19nZXRSb3dEYXRhX18gPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAga2ssXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBkYXRhID0gZGVlcENvcHkoY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0RGF0YUpzb24oKSksXG4gICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IGRlZXBDb3B5KGNoYXJ0LmRhdGFBZGFwdGVyLmdldEFnZ3JlZ2F0ZWREYXRhKCkpLFxuICAgICAgICAgICAgZGltZW5zaW9uID0gY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0RGltZW5zaW9uKCksXG4gICAgICAgICAgICBtZWFzdXJlID0gY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0TWVhc3VyZSgpLFxuICAgICAgICAgICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSksXG4gICAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbWF0Y2hPYmogPSB7fSxcbiAgICAgICAgICAgIGluZGV4T2ZEaW1lbnNpb24gPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKGRpbWVuc2lvblswXSk7XG4gICAgXG4gICAgICAgIGZvcihsZW5SID0gZGF0YS5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGlzQXJyYXkgJiYgKGluZGV4ID0gZGF0YVtpXS5pbmRleE9mKGtleSkpO1xuICAgICAgICAgICAgaWYoaW5kZXggIT09IC0xICYmIGlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBmb3IobCA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgbCA8IGxlbkM7IGwrKyl7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW2RhdGFbMF1bbF1dID0gZGF0YVtpXVtsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW4gPSBtZWFzdXJlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleE9mRGltZW5zaW9uXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFpc0FycmF5ICYmIGRhdGFbaV1bZGltZW5zaW9uWzBdXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICBtYXRjaE9iaiA9IGRhdGFbaV07XG5cbiAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbiA9IG1lYXN1cmUubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhZ2dyZWdhdGVkRGF0YVswXS5pbmRleE9mKG1lYXN1cmVbal0pO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBrayA9IGFnZ3JlZ2F0ZWREYXRhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4T2ZEaW1lbnNpb25dID09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoT2JqW21lYXN1cmVbal1dID0gYWdncmVnYXRlZERhdGFba11baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaE9iajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBQcm90b0NoYXJ0LmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgY2F0ZWdvcnlMYWJlbCA9IGlkICYmIGlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjYXRlZ29yeUFyciA9IGNoYXJ0LmRhdGFBZGFwdGVyLmdldENhdGVnb3JpZXMoKSxcbiAgICAgICAgICAgIGluZGV4ID0gY2F0ZWdvcnlMYWJlbCAmJiBjYXRlZ29yeUFyci5pbmRleE9mKGNhdGVnb3J5TGFiZWwpO1xuICAgICAgICBjaGFydC5jaGFydEluc3RhbmNlLmRyYXdUcmVuZFJlZ2lvbihpbmRleCk7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNoYXJ0ID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICByZXR1cm4gbmV3IENoYXJ0KGNvbmZpZyk7XG4gICAgfTtcbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICB2YXIgZG9jdW1lbnQgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS53aW4uZG9jdW1lbnQsXG4gICAgICAgIGNoYXJ0Q3RybHIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jaGFydCxcbiAgICAgICAgUFggPSAncHgnLFxuICAgICAgICBESVYgPSAnZGl2JyxcbiAgICAgICAgRU1QVFlfU1RSSU5HID0gJycsXG4gICAgICAgIEFCU09MVVRFID0gJ2Fic29sdXRlJyxcbiAgICAgICAgUkVMQVRJVkUgPSAncmVsYXRpdmUnLFxuICAgICAgICBJRCA9ICdpZC1mYy1tYy0nLFxuICAgICAgICBCT1JERVJfQk9YID0gJ2JvcmRlci1ib3gnO1xuXG4gICAgdmFyIENlbGwgPSBmdW5jdGlvbiAoY29uZmlnLCBjb250YWluZXIpIHtcbiAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcztcblxuICAgICAgICAgICAgY2VsbC5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgICAgIGNlbGwuX19kcmF3X18oKTtcbiAgICAgICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0ICYmIGNlbGwuX19yZW5kZXJDaGFydF9fKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvQ2VsbCA9IENlbGwucHJvdG90eXBlO1xuXG4gICAgcHJvdG9DZWxsLl9fZHJhd19fID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcztcbiAgICAgICAgY2VsbC5ncmFwaGljcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoRElWKTtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5pZCA9IGNlbGwuY29uZmlnLmlkIHx8IEVNUFRZX1NUUklORzsgICAgICAgIFxuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmhlaWdodCA9IGNlbGwuY29uZmlnLmhlaWdodCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLndpZHRoID0gY2VsbC5jb25maWcud2lkdGggKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS50b3AgPSBjZWxsLmNvbmZpZy50b3AgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5sZWZ0ID0gY2VsbC5jb25maWcubGVmdCArIFBYO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLnBvc2l0aW9uID0gQUJTT0xVVEU7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUuYm94U2l6aW5nID0gQk9SREVSX0JPWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5jbGFzc05hbWUgPSBjZWxsLmNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0IHx8IChjZWxsLmdyYXBoaWNzLmlubmVySFRNTCA9IGNlbGwuY29uZmlnLmh0bWwgfHwgRU1QVFlfU1RSSU5HKTtcbiAgICAgICAgY2VsbC5jb250YWluZXIuYXBwZW5kQ2hpbGQoY2VsbC5ncmFwaGljcyk7XG4gICAgfTtcblxuICAgIHByb3RvQ2VsbC5fX3JlbmRlckNoYXJ0X18gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjZWxsID0gdGhpcyxcbiAgICAgICAgICAgIGNoYXJ0Q29udGFpbmVyLFxuICAgICAgICAgICAgY29uZiA9IHtcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JyA6IGNlbGwuY29uZmlnLmhlaWdodCxcbiAgICAgICAgICAgICAgICAnd2lkdGgnIDogY2VsbC5jb25maWcud2lkdGhcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNwb3NhbEJveCA9IGNlbGwuZGlzcG9zYWxCb3gsXG4gICAgICAgICAgICBjaGFydENvbmZpZyxcbiAgICAgICAgICAgIGlzUmVjeWNsZWQgPSBmYWxzZTtcblxuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydC5pc0NoYXJ0IHx8IChjaGFydENvbmZpZyA9IGNlbGwuY29uZmlnLmNoYXJ0KTtcbiAgICAgICAgaWYoY2hhcnRDb25maWcpIHtcbiAgICAgICAgICAgIGlmKGRpc3Bvc2FsQm94ICYmIGRpc3Bvc2FsQm94Lmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNlbGwuY29uZmlnLmNoYXJ0O1xuICAgICAgICAgICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0ID0gZGlzcG9zYWxCb3gucG9wKCk7XG4gICAgICAgICAgICAgICAgaXNSZWN5Y2xlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNlbGwuY29uZmlnLmNoYXJ0ID0gY2hhcnRDdHJscihjaGFydENvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjaGFydENvbnRhaW5lciA9IGNlbGwuY29uZmlnLmNoYXJ0LmdldENoYXJ0Q29udGFpbmVyKCk7XG4gICAgICAgIGNoYXJ0Q29udGFpbmVyICYmIGNlbGwuY29uZmlnLmNoYXJ0LnVwZGF0ZUNoYXJ0Q29udGFpbmVyKGNvbmYpO1xuICAgICAgICBjaGFydENvbnRhaW5lciAmJiAoY2VsbC5ncmFwaGljcy5hcHBlbmRDaGlsZChjaGFydENvbnRhaW5lci5ncmFwaGljcykpO1xuICAgICAgICBjaGFydENvbnRhaW5lciB8fCBjZWxsLmNvbmZpZy5jaGFydC5yZW5kZXIoY2VsbC5jb25maWcuaWQpO1xuICAgICAgICBpc1JlY3ljbGVkICYmIGNlbGwuY29uZmlnLmNoYXJ0LnVwZGF0ZShjaGFydENvbmZpZyk7XG4gICAgfTtcblxuICAgIHZhciBNYXRyaXggPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBtYXRyaXggPSB0aGlzO1xuICAgICAgICAgICAgbWF0cml4LnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAvL21hdHJpeCBjb250YWluZXJcbiAgICAgICAgICAgIG1hdHJpeC5tYXRyaXhDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3Rvcik7XG4gICAgICAgICAgICBtYXRyaXguY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdEggPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGVmYXVsdFcgPSAxMDA7XG4gICAgICAgICAgICBtYXRyaXguZGlzcG9zYWxCb3ggPSBbXTtcbiAgICAgICAgICAgIC8vZGlzcG9zZSBtYXRyaXggY29udGV4dFxuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIC8vc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXIgXG4gICAgICAgICAgICBtYXRyaXguX19zZXRBdHRyQ29udGFpbmVyX18oKTtcbiAgICAgICAgICAgIC8vc3RvcmUgdmlydHVhbCBtYXRyaXggZm9yIHVzZXIgZ2l2ZW4gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgbWF0cml4LmNvbmZpZ01hbmFnZXIgPSBjb25maWd1cmF0aW9uICYmIG1hdHJpeCAmJiBtYXRyaXguX19kcmF3TWFuYWdlcl9fKGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGUsXG4gICAgICAgIGNoYXJ0SWQgPSAwO1xuXG4gICAgLy9mdW5jdGlvbiB0byBzZXQgc3R5bGUsIGF0dHIgb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4Ll9fc2V0QXR0ckNvbnRhaW5lcl9fID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXI7ICAgICAgICBcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gUkVMQVRJVkU7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gc2V0IGhlaWdodCwgd2lkdGggb24gbWF0cml4IGNvbnRhaW5lclxuICAgIHByb3RvTWF0cml4Ll9fc2V0Q29udGFpbmVyUmVzb2x1dGlvbl9fID0gZnVuY3Rpb24gKGhlaWdodEFyciwgd2lkdGhBcnIpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgICAgICB3aWR0aCA9IDAsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGhlaWdodEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaGVpZ2h0ICs9IGhlaWdodEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMCwgbGVuID0gd2lkdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHdpZHRoICs9IHdpZHRoQXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBQWDtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyBQWDsgICAgICAgIFxuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIGRyYXcgbWF0cml4XG4gICAgcHJvdG9NYXRyaXguZHJhdyA9IGZ1bmN0aW9uKGNhbGxCYWNrKXtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWdNYW5hZ2VyID0gbWF0cml4LmNvbmZpZ01hbmFnZXIsXG4gICAgICAgICAgICBsZW4gPSBjb25maWdNYW5hZ2VyICYmIGNvbmZpZ01hbmFnZXIubGVuZ3RoLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBbXSxcbiAgICAgICAgICAgIHBhcmVudENvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqO1xuICAgICAgICBcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gW107XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBjb25maWdNYW5hZ2VyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgLy9zdG9yZSBjZWxsIG9iamVjdCBpbiBsb2dpY2FsIG1hdHJpeCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXSA9IG5ldyBDZWxsKGNvbmZpZ01hbmFnZXJbaV1bal0scGFyZW50Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBwbGFjZUhvbGRlcjtcbiAgICAgICAgY2FsbEJhY2sgJiYgY2FsbEJhY2soKTtcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBtYW5hZ2UgbWF0cml4IGRyYXdcbiAgICBwcm90b01hdHJpeC5fX2RyYXdNYW5hZ2VyX18gPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICAvL3N0b3JlIG1hcHBpbmcgbWF0cml4IGJhc2VkIG9uIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHNoYWRvd01hdHJpeCA9IG1hdHJpeC5fX21hdHJpeE1hbmFnZXJfXyhjb25maWd1cmF0aW9uKSwgICAgICAgICAgICBcbiAgICAgICAgICAgIGhlaWdodEFyciA9IG1hdHJpeC5fX2dldFJvd0hlaWdodF9fKHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICB3aWR0aEFyciA9IG1hdHJpeC5fX2dldENvbFdpZHRoX18oc2hhZG93TWF0cml4KSxcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyID0gW10sXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgbWF0cml4UG9zWCA9IG1hdHJpeC5fX2dldFBvc19fKHdpZHRoQXJyKSxcbiAgICAgICAgICAgIG1hdHJpeFBvc1kgPSBtYXRyaXguX19nZXRQb3NfXyhoZWlnaHRBcnIpLFxuICAgICAgICAgICAgcm93c3BhbixcbiAgICAgICAgICAgIGNvbHNwYW4sXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGNoYXJ0LFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIGNvbDtcbiAgICAgICAgLy9jYWxjdWxhdGUgYW5kIHNldCBwbGFjZWhvbGRlciBpbiBzaGFkb3cgbWF0cml4XG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXguX19zZXRQbGNIbGRyX18oc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgLy9mdW5jdGlvbiB0byBzZXQgaGVpZ2h0LCB3aWR0aCBvbiBtYXRyaXggY29udGFpbmVyXG4gICAgICAgIG1hdHJpeC5fX3NldENvbnRhaW5lclJlc29sdXRpb25fXyhoZWlnaHRBcnIsIHdpZHRoQXJyKTtcbiAgICAgICAgLy9jYWxjdWxhdGUgY2VsbCBwb3NpdGlvbiBhbmQgaGVpaHQgYW5kIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgIFxuICAgICAgICAgICAgZHJhd01hbmFnZXJPYmpBcnJbaV0gPSBbXTsgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgICAgICByb3dzcGFuID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4gfHwgMSk7XG4gICAgICAgICAgICAgICAgY29sc3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuIHx8IDEpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGFydCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jaGFydDtcbiAgICAgICAgICAgICAgICBodG1sID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmh0bWw7XG4gICAgICAgICAgICAgICAgcm93ID0gcGFyc2VJbnQoY29uZmlndXJhdGlvbltpXVtqXS5yb3cpO1xuICAgICAgICAgICAgICAgIGNvbCA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0uY29sKTtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbWF0cml4UG9zWFtjb2xdO1xuICAgICAgICAgICAgICAgIHRvcCA9IG1hdHJpeFBvc1lbcm93XTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IG1hdHJpeFBvc1hbY29sICsgY29sc3Bhbl0gLSBsZWZ0O1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IG1hdHJpeFBvc1lbcm93ICsgcm93c3Bhbl0gLSB0b3A7XG4gICAgICAgICAgICAgICAgaWQgPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmlkKSB8fCBtYXRyaXguX19pZENyZWF0b3JfXyhyb3csY29sKTtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2xhc3NOYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICA6IGxlZnQsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgICA6IGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICAgIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgICAgIDogaWQsXG4gICAgICAgICAgICAgICAgICAgIHJvd3NwYW4gICA6IHJvd3NwYW4sXG4gICAgICAgICAgICAgICAgICAgIGNvbHNwYW4gICA6IGNvbHNwYW4sXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgICAgICA6IGh0bWwsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0ICAgICA6IGNoYXJ0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJhd01hbmFnZXJPYmpBcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Ll9faWRDcmVhdG9yX18gPSBmdW5jdGlvbigpe1xuICAgICAgICBjaGFydElkKys7ICAgICAgIFxuICAgICAgICByZXR1cm4gSUQgKyBjaGFydElkO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5fX2dldFBvc19fID0gIGZ1bmN0aW9uKHNyYyl7XG4gICAgICAgIHZhciBhcnIgPSBbXSxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuID0gc3JjICYmIHNyYy5sZW5ndGg7XG5cbiAgICAgICAgZm9yKDsgaSA8PSBsZW47IGkrKyl7XG4gICAgICAgICAgICBhcnIucHVzaChpID8gKHNyY1tpLTFdK2FycltpLTFdKSA6IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19zZXRQbGNIbGRyX18gPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgsIGNvbmZpZ3VyYXRpb24pe1xuICAgICAgICB2YXIgcm93LFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQztcblxuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBzaGFkb3dNYXRyaXgubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXsgXG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBzaGFkb3dNYXRyaXhbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICByb3cgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgICAgICBjb2wgPSBzaGFkb3dNYXRyaXhbaV1bal0uaWQuc3BsaXQoJy0nKVsxXTtcblxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLnJvdyA9PT0gdW5kZWZpbmVkID8gaSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3c7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID09PSB1bmRlZmluZWQgPyBqIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19nZXRSb3dIZWlnaHRfXyA9IGZ1bmN0aW9uKHNoYWRvd01hdHJpeCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICBoZWlnaHQgPSBbXSxcbiAgICAgICAgICAgIGN1cnJIZWlnaHQsXG4gICAgICAgICAgICBkZWZhdWx0SCA9IG1hdHJpeC5kZWZhdWx0SCxcbiAgICAgICAgICAgIG1heEhlaWdodDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4SGVpZ2h0ID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkNvbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYoc2hhZG93TWF0cml4W2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJIZWlnaHQgPSBzaGFkb3dNYXRyaXhbaV1bal0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgPCBjdXJySGVpZ2h0ID8gY3VyckhlaWdodCA6IG1heEhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoZWlnaHRbaV0gPSBtYXhIZWlnaHQgfHwgZGVmYXVsdEg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5fX2dldENvbFdpZHRoX18gPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGogPSAwLFxuICAgICAgICAgICAgbGVuUm93ID0gc2hhZG93TWF0cml4ICYmIHNoYWRvd01hdHJpeC5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICB3aWR0aCA9IFtdLFxuICAgICAgICAgICAgY3VycldpZHRoLFxuICAgICAgICAgICAgZGVmYXVsdFcgPSBtYXRyaXguZGVmYXVsdFcsXG4gICAgICAgICAgICBtYXhXaWR0aDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuQ29sID0gc2hhZG93TWF0cml4W2pdLmxlbmd0aDsgaSA8IGxlbkNvbDsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4V2lkdGggPSAwOyBqIDwgbGVuUm93OyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hhZG93TWF0cml4W2pdW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJXaWR0aCA9IHNoYWRvd01hdHJpeFtqXVtpXS53aWR0aDsgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IG1heFdpZHRoIDwgY3VycldpZHRoID8gY3VycldpZHRoIDogbWF4V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2lkdGhbaV0gPSBtYXhXaWR0aCB8fCBkZWZhdWx0VztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19tYXRyaXhNYW5hZ2VyX18gPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgc2hhZG93TWF0cml4ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgbGVuUm93ID0gY29uZmlndXJhdGlvbi5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgcm93U3BhbixcbiAgICAgICAgICAgIGNvbFNwYW4sXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgICAgIG9mZnNldDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcm93U3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbikgfHwgMTtcbiAgICAgICAgICAgICAgICBjb2xTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuKSB8fCAxOyAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS53aWR0aCk7XG4gICAgICAgICAgICAgICAgd2lkdGggPSAod2lkdGggJiYgKHdpZHRoIC8gY29sU3BhbikpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHdpZHRoICYmICt3aWR0aC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IChoZWlnaHQgJiYgKGhlaWdodCAvIHJvd1NwYW4pKSB8fCB1bmRlZmluZWQ7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IGhlaWdodCAmJiAraGVpZ2h0LnRvRml4ZWQoMik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBvZmZzZXQgPSAwOyBrIDwgcm93U3BhbjsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobCA9IDA7IGwgPCBjb2xTcGFuOyBsKyspIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZG93TWF0cml4W2kgKyBrXSA9IHNoYWRvd01hdHJpeFtpICsga10gPyBzaGFkb3dNYXRyaXhbaSArIGtdIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBqICsgbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoc2hhZG93TWF0cml4W2kgKyBrXVtvZmZzZXRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCA6IChpICsgJy0nICsgaiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggOiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2hhZG93TWF0cml4O1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5fX2dldEJsb2NrX18gID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZCA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblIgPSBwbGFjZUhvbGRlci5sZW5ndGgsXG4gICAgICAgICAgICBsZW5DO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChwbGFjZUhvbGRlcltpXVtqXS5jb25maWcuaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBsYWNlSG9sZGVyW2ldW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC51cGRhdGUgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgZGlzcG9zYWxCb3ggPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqO1xuXG4gICAgICAgIHdoaWxlKGNvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChjb250YWluZXIubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSBwbGFjZUhvbGRlci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgZm9yIChqID0gcGxhY2VIb2xkZXJbaV0ubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jb25maWcgJiYgcGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmNoYXJ0ICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZGlzcG9zYWxCb3gucHVzaChwbGFjZUhvbGRlcltpXVtqXS5jb25maWcuY2hhcnQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwcm90b0NlbGwuZGlzcG9zYWxCb3ggPSBkaXNwb3NhbEJveDtcbiAgICAgICAgbWF0cml4LmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uIHx8IG1hdHJpeC5jb25maWd1cmF0aW9uO1xuICAgICAgICBtYXRyaXguY29uZmlnTWFuYWdlciA9IG1hdHJpeC5fX2RyYXdNYW5hZ2VyX18obWF0cml4LmNvbmZpZ3VyYXRpb24pO1xuICAgICAgICBtYXRyaXguZHJhdygpO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIG5vZGUgID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IG1hdHJpeCAmJiBtYXRyaXgucGxhY2VIb2xkZXIsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBsZW5SO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBwbGFjZUhvbGRlciAmJiBwbGFjZUhvbGRlci5sZW5ndGg7IGkgPCBsZW5SOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXSAmJiBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBwbGFjZUhvbGRlcltpXVtqXS5jaGFydCAmJiBwbGFjZUhvbGRlcltpXVtqXS5jaGFydC5jaGFydE9iaiAmJiBcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmouZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChub2RlLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5zdHlsZS5oZWlnaHQgPSAnMHB4JztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9ICcwcHgnO1xuICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVNYXRyaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pO1xuICAgIH07XG59KTsiLCJGdXNpb25DaGFydHMucmVnaXN0ZXIoJ21vZHVsZScsIFsncHJpdmF0ZScsICdtb2R1bGVzLnJlbmRlcmVyLmpzLWV4dGVuc2lvbi1heGlzJyxcbiAgICBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHRoaXMsXG4gICAgICAgICAgICBsaWIgPSBnbG9iYWwuaGNMaWIsXG4gICAgICAgICAgICBjaGFydEFQSSA9IGxpYi5jaGFydEFQSSxcbiAgICAgICAgICAgIHBsdWNrTnVtYmVyID0gbGliLnBsdWNrTnVtYmVyLFxuICAgICAgICAgICAgcGx1Y2sgPSBsaWIucGx1Y2ssXG4gICAgICAgICAgICBnZXRBeGlzTGltaXRzID0gbGliLmdldEF4aXNMaW1pdHM7XG5cbiAgICAgICAgY2hhcnRBUEkgKCdheGlzJywge1xuICAgICAgICAgICAgc3RhbmRhbG9uZUluaXQgOiB0cnVlLFxuICAgICAgICAgICAgZnJpZW5kbHlOYW1lIDogJ2F4aXMnXG4gICAgICAgIH0sIGNoYXJ0QVBJLmRyYXdpbmdwYWQpO1xuXG4gICAgICAgIEZ1c2lvbkNoYXJ0cy5yZWdpc3RlcignY29tcG9uZW50JywgWydleHRlbnNpb24nLCAnZHJhd2F4aXMnLCB7XG4gICAgICAgICAgICB0eXBlIDogJ2RyYXdpbmdwYWQnLFxuXG4gICAgICAgICAgICBpbml0IDogZnVuY3Rpb24gKGNoYXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHMgPSBjaGFydC5jb21wb25lbnRzLFxuICAgICAgICAgICAgICAgICAgICBheGlzQ29uZmlnID0gZXh0ZW5zaW9uLmF4aXNDb25maWcgfHwgKGV4dGVuc2lvbi5heGlzQ29uZmlnID0ge30pLFxuICAgICAgICAgICAgICAgICAgICBjaGFydEluc3RhbmNlID0gY2hhcnQuY2hhcnRJbnN0YW5jZTtcblxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHMuYXhpcyB8fCAoY29tcG9uZW50cy5heGlzID0gbmV3IChGdXNpb25DaGFydHMuZ2V0Q29tcG9uZW50KCdtYWluJywgJ2F4aXMnKSkoKSk7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uLmNoYXJ0ID0gY2hhcnQ7XG5cbiAgICAgICAgICAgICAgICBjaGFydEluc3RhbmNlLnNldEF4aXMgPSBleHRlbnNpb24uc2V0QXhpcyA9IGZ1bmN0aW9uIChkYXRhLCBkcmF3KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzQ29uZmlnLmF4aXNUeXBlID09PSAneScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcubWluID0gZGF0YVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcubWF4ID0gZGF0YVsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcubWluID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcubWF4ID0gZGF0YS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5jYXRlZ29yeSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRyYXcgJiYgIGV4dGVuc2lvbi5kcmF3KCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNoYXJ0SW5zdGFuY2UuZ2V0TGltaXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2F4aXNDb25maWcubWluTGltaXQsIGF4aXNDb25maWcubWF4TGltaXRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbmZpZ3VyZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXhpc0NvbmZpZyA9IGV4dGVuc2lvbi5heGlzQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBjaGFydCA9IGV4dGVuc2lvbi5jaGFydCxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gY2hhcnQuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBqc29uRGF0YSA9IGNoYXJ0Lmpzb25EYXRhLmNoYXJ0LFxuICAgICAgICAgICAgICAgICAgICBheGlzVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgaXNBeGlzT3BwLFxuICAgICAgICAgICAgICAgICAgICBjYW52YXNCb3JkZXJUaGlja25lc3MsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclRoaWNrbmVzcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGNoYXJ0LmNoYXJ0SW5zdGFuY2UuYXJncyxcbiAgICAgICAgICAgICAgICAgICAgaXNZYXhpcyxcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzUGFkZGluZ0xlZnQgPSBwbHVja051bWJlcihqc29uRGF0YS5jYW52YXNwYWRkaW5nbGVmdCwganNvbkRhdGEuY2FudmFzcGFkZGluZyksXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc1BhZGRpbmdSaWdodCA9IHBsdWNrTnVtYmVyKGpzb25EYXRhLmNhbnZhc3BhZGRpbmdyaWdodCwganNvbkRhdGEuY2FudmFzcGFkZGluZyk7XG5cbiAgICAgICAgICAgICAgICBjaGFydC5fbWFuYWdlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICBjYW52YXNCb3JkZXJUaGlja25lc3MgPSBwbHVja051bWJlcihjb25maWcuY2FudmFzYm9yZGVydGhpY2tuZXNzLCAwKTtcbiAgICAgICAgICAgICAgICBib3JkZXJUaGlja25lc3MgPSBwbHVja051bWJlcihjb25maWcuYm9yZGVydGhpY2tuZXNzLCAwKTtcblxuICAgICAgICAgICAgICAgIGF4aXNUeXBlID0gYXhpc0NvbmZpZy5heGlzVHlwZSA9IHBsdWNrKGFyZ3MuYXhpc1R5cGUsICd5Jyk7XG4gICAgICAgICAgICAgICAgaXNZYXhpcyA9IGF4aXNUeXBlID09PSAneSc7XG5cbiAgICAgICAgICAgICAgICBleHRlbnNpb24uc2V0QXhpcyhpc1lheGlzID8gW2pzb25EYXRhLmRhdGFNaW4sIGpzb25EYXRhLmRhdGFNYXhdIDogY2hhcnQuanNvbkRhdGEuY2F0ZWdvcmllcywgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgaXNBeGlzT3BwID0gYXhpc0NvbmZpZy5pc0F4aXNPcHAgPSBwbHVja051bWJlcihqc29uRGF0YS5pc2F4aXNvcHBvc2l0ZSwgMCk7XG5cbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLnRvcCA9IGlzWWF4aXMgPyBjb25maWcubWFyZ2luVG9wICsgY2FudmFzQm9yZGVyVGhpY2tuZXNzICsgYm9yZGVyVGhpY2tuZXNzIDpcbiAgICAgICAgICAgICAgICAgICAgKGlzQXhpc09wcCA/IGNvbmZpZy5oZWlnaHQgLSBwbHVja051bWJlcihqc29uRGF0YS5jaGFydGJvdHRvbW1hcmdpbiwgMCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Y2tOdW1iZXIoanNvbkRhdGEuY2hhcnR0b3BtYXJnaW4sIDApKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLmxlZnQgPSBpc1lheGlzID8gKGlzQXhpc09wcCA/IHBsdWNrTnVtYmVyKGpzb25EYXRhLmNoYXJ0cmlnaHRtYXJnaW4sIDApIDpcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLndpZHRoIC0gcGx1Y2tOdW1iZXIoanNvbkRhdGEuY2hhcnRyaWdodG1hcmdpbiwgMCkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb25maWcubWFyZ2luTGVmdCArIGNhbnZhc0JvcmRlclRoaWNrbmVzcyArIGJvcmRlclRoaWNrbmVzcyArIGNhbnZhc1BhZGRpbmdMZWZ0KTtcblxuICAgICAgICAgICAgICAgIGF4aXNDb25maWcuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCAtIGNvbmZpZy5tYXJnaW5Ub3AgLSBjb25maWcubWFyZ2luQm90dG9tIC1cbiAgICAgICAgICAgICAgICAgICAgMiAqIGNhbnZhc0JvcmRlclRoaWNrbmVzcyAtIDIgKiBib3JkZXJUaGlja25lc3M7XG5cbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLmRpdmxpbmUgPSBwbHVja051bWJlcihqc29uRGF0YS5udW1kaXZsaW5lcywgNCk7XG5cbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLmF4aXNMZW4gPSBjb25maWcud2lkdGggLSBjb25maWcubWFyZ2luUmlnaHQgLSBjb25maWcubWFyZ2luTGVmdCAtXG4gICAgICAgICAgICAgICAgICAgIDIgKiBjYW52YXNCb3JkZXJUaGlja25lc3MgLSAyICogYm9yZGVyVGhpY2tuZXNzIC0gY2FudmFzUGFkZGluZ0xlZnQgLSBjYW52YXNQYWRkaW5nUmlnaHQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkcmF3IDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgY2hhcnQgPSBleHRlbnNpb24uY2hhcnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHMgPSBjaGFydC5jb21wb25lbnRzLFxuICAgICAgICAgICAgICAgICAgICBwYXBlciA9IGNvbXBvbmVudHMucGFwZXIsXG4gICAgICAgICAgICAgICAgICAgIGF4aXMgPSBjb21wb25lbnRzLmF4aXMsXG4gICAgICAgICAgICAgICAgICAgIGF4aXNDb25maWcgPSBleHRlbnNpb24uYXhpc0NvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgaW5jcmVtZW50b3IsXG4gICAgICAgICAgICAgICAgICAgIG1heExpbWl0LFxuICAgICAgICAgICAgICAgICAgICBsaW1pdHMsXG4gICAgICAgICAgICAgICAgICAgIGRpdkdhcCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5VmFsdWVzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgbWluLFxuICAgICAgICAgICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICAgICAgICAgIG51bWJlckZvcm1hdHRlciA9IGNvbXBvbmVudHMubnVtYmVyRm9ybWF0dGVyLFxuICAgICAgICAgICAgICAgICAgICBheGlzSW50ZXJ2YWxzID0gYXhpcy5nZXRTY2FsZU9iaigpLmdldEludGVydmFsT2JqKCkuZ2V0Q29uZmlnKCdpbnRlcnZhbHMnKSxcbiAgICAgICAgICAgICAgICAgICAgbWluTGltaXQ7XG5cbiAgICAgICAgICAgICAgICBtYXggPSBheGlzQ29uZmlnLm1heCB8fCAxO1xuICAgICAgICAgICAgICAgIG1pbiA9IGF4aXNDb25maWcubWluIHx8IDA7XG4gICAgICAgICAgICAgICAgbGVmdCA9IGF4aXNDb25maWcubGVmdDtcbiAgICAgICAgICAgICAgICB0b3AgPSBheGlzQ29uZmlnLnRvcDtcblxuICAgICAgICAgICAgICAgIGF4aXMuZ2V0U2NhbGVPYmooKS5zZXRDb25maWcoJ2dyYXBoaWNzJywge1xuICAgICAgICAgICAgICAgICAgICBwYXBlcjogcGFwZXJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBheGlzLnNldFJhbmdlKG1heCxtaW4pO1xuICAgICAgICAgICAgICAgIGF4aXMuc2V0QXhpc1Bvc2l0aW9uKGxlZnQsdG9wKTtcblxuICAgICAgICAgICAgICAgIGlmIChheGlzQ29uZmlnLmF4aXNUeXBlID09ICd4Jykge1xuXG4gICAgICAgICAgICAgICAgICAgIG1pbkxpbWl0ID0gbWluO1xuICAgICAgICAgICAgICAgICAgICBtYXhMaW1pdCA9IG1heDtcbiAgICAgICAgICAgICAgICAgICAgYXhpcy5zZXRBeGlzTGVuZ3RoKGF4aXNDb25maWcuYXhpc0xlbik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8PSBtYXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWxzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlWYWx1ZXMgPSBheGlzQ29uZmlnLmNhdGVnb3J5IHx8IFsnc3RhcnQnLCAnZW5kJ107XG5cbiAgICAgICAgICAgICAgICAgICAgYXhpc0ludGVydmFscy5tYWpvci5mb3JtYXR0ZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYXRlZ29yeVZhbHVlc1t2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBheGlzLnNldEF4aXNMZW5ndGgoYXhpc0NvbmZpZy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBheGlzLmdldFNjYWxlT2JqKCkuc2V0Q29uZmlnKCd2ZXJ0aWNhbCcsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0cyA9IGdldEF4aXNMaW1pdHMobWF4LCBtaW4sIG51bGwsIG51bGwsIHRydWUsIHRydWUsIGF4aXNDb25maWcuZGl2bGluZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGRpdkdhcCA9IGxpbWl0cy5kaXZHYXA7XG4gICAgICAgICAgICAgICAgICAgIG1heExpbWl0ID0gbGltaXRzLk1heDtcbiAgICAgICAgICAgICAgICAgICAgbWluTGltaXQgPSBpbmNyZW1lbnRvciA9IGxpbWl0cy5NaW47XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGluY3JlbWVudG9yIDw9IG1heExpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbHMucHVzaChpbmNyZW1lbnRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNyZW1lbnRvciArPSBkaXZHYXA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBheGlzSW50ZXJ2YWxzLm1ham9yLmZvcm1hdHRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bWJlckZvcm1hdHRlci55QXhpcyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5pc0F4aXNPcHAgJiYgYXhpcy5nZXRTY2FsZU9iaigpLnNldENvbmZpZygnb3Bwb3NpdGUnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBheGlzSW50ZXJ2YWxzLm1ham9yLmRyYXdUaWNrcz0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBheGlzQ29uZmlnLm1heExpbWl0ID0gbWF4TGltaXQ7XG4gICAgICAgICAgICAgICAgYXhpc0NvbmZpZy5taW5MaW1pdCA9IG1pbkxpbWl0O1xuXG4gICAgICAgICAgICAgICAgYXhpcy5nZXRTY2FsZU9iaigpLmdldEludGVydmFsT2JqKCkubWFuYWdlSW50ZXJ2YWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW50ZXJ2YWxzID0gdGhpcy5nZXRDb25maWcoJ2ludGVydmFscycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLmdldENvbmZpZygnc2NhbGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVydmFsUG9pbnRzID0gaW50ZXJ2YWxzLm1ham9yLmludGVydmFsUG9pbnRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuO1xuXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlLnNldFJhbmdlKG1heExpbWl0LCBtaW5MaW1pdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGFiZWxzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbFBvaW50cy5wdXNoKGxhYmVsc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGF4aXMuZHJhdygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFttaW5MaW1pdCwgbWF4TGltaXRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XSk7XG4gICAgfVxuXSk7XG4iLCJGdXNpb25DaGFydHMucmVnaXN0ZXIoJ21vZHVsZScsIFsncHJpdmF0ZScsICdtb2R1bGVzLnJlbmRlcmVyLmpzLWV4dGVuc2lvbi1jYXB0aW9uJyxcbiAgICBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgZ2xvYmFsID0gdGhpcyxcbiAgICAgICAgICAgIGxpYiA9IGdsb2JhbC5oY0xpYixcbiAgICAgICAgICAgIGNoYXJ0QVBJID0gbGliLmNoYXJ0QVBJO1xuXG4gICAgICAgIGNoYXJ0QVBJKCdjYXB0aW9uJywge1xuICAgICAgICAgICAgc3RhbmRhbG9uZUluaXQ6IHRydWUsXG4gICAgICAgICAgICBmcmllbmRseU5hbWU6ICdjYXB0aW9uJ1xuICAgICAgICB9LCBjaGFydEFQSS5kcmF3aW5ncGFkKTtcblxuICAgICAgICBGdXNpb25DaGFydHMucmVnaXN0ZXIoJ2NvbXBvbmVudCcsIFsnZXh0ZW5zaW9uJywgJ2NhcHRpb24nLCB7XG4gICAgICAgICAgICB0eXBlOiAnZHJhd2luZ3BhZCcsXG5cbiAgICAgICAgICAgIGluaGVyZWl0QmFzZUV4dGVuc2lvbjogdHJ1ZSxcblxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oY2hhcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgaWFwaSA9IGV4dGVuc2lvbi5jaGFydDtcbiAgICAgICAgICAgICAgICBleHRlbnNpb24uY2hhcnQgPSBjaGFydDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgaWFwaSA9IGV4dGVuc2lvbi5jaGFydCxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnID0gaWFwaS5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIENhcHRpb24gPSBGdXNpb25DaGFydHMucmVnaXN0ZXIoJ2NvbXBvbmVudCcsIFsnY2FwdGlvbicsICdjYXB0aW9uJ10pLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzID0gaWFwaS5jb21wb25lbnRzIHx8IChpYXBpLmNvbXBvbmVudHMgPSB7fSksXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb24gPSBjb21wb25lbnRzLmNhcHRpb24sXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb25Db25maWcgPSBjYXB0aW9uLmNvbmZpZztcblxuICAgICAgICAgICAgICAgIGlhcGkuX21hbmFnZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgaWFwaS5fcG9zdFNwYWNlTWFuYWdlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jYW52YXNMZWZ0ID0gY29uZmlnLm9yaWdNYXJnaW5MZWZ0O1xuICAgICAgICAgICAgICAgIGNhcHRpb24gfHwgKGNhcHRpb24gPSBuZXcgQ2FwdGlvbigpKTtcbiAgICAgICAgICAgICAgICBjYXB0aW9uLmluaXQoKTtcbiAgICAgICAgICAgICAgICBjYXB0aW9uLmNoYXJ0ID0gaWFwaTtcbiAgICAgICAgICAgICAgICBjYXB0aW9uLmNvbmZpZ3VyZSgpO1xuICAgICAgICAgICAgICAgIGNhcHRpb24ubWFuYWdlU3BhY2UoY29uZmlnLmhlaWdodCxjb25maWcud2lkdGgpO1xuICAgICAgICAgICAgICAgIGNhcHRpb25Db25maWcuZHJhd0NhcHRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNhcHRpb24ubWFuYWdlUG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICBjYXB0aW9uICYmIGNhcHRpb24uZHJhdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XSk7XG4gICAgfVxuXSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcbiAgICBcbiAgICAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG4gICAgdmFyIGdsb2JhbCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBnbG9iYWwud2luLFxuXG4gICAgICAgIG9iamVjdFByb3RvVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBhcnJheVRvU3RyaW5nSWRlbnRpZmllciA9IG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChbXSksXG4gICAgICAgIGlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKG9iaikgPT09IGFycmF5VG9TdHJpbmdJZGVudGlmaWVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEEgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGFic3RyYWN0aW9uIGxheWVyIHNvIHRoYXQgdGhlIHRyeS1jYXRjaCAvXG4gICAgICAgIC8vIGVycm9yIHN1cHByZXNzaW9uIG9mIGZsYXNoIGNhbiBiZSBhdm9pZGVkIHdoaWxlIHJhaXNpbmcgZXZlbnRzLlxuICAgICAgICBtYW5hZ2VkRm5DYWxsID0gZnVuY3Rpb24gKGl0ZW0sIHNjb3BlLCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gV2UgY2hhbmdlIHRoZSBzY29wZSBvZiB0aGUgZnVuY3Rpb24gd2l0aCByZXNwZWN0IHRvIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IHRoYXQgcmFpc2VkIHRoZSBldmVudC5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXRlbVswXS5jYWxsKHNjb3BlLCBldmVudCwgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgYWxsIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBpbnZva2VkIHVwb24gdHJpZ2dlclxuICAgICAgICAvLyBvZiBhbiBldmVudC5cbiAgICAgICAgc2xvdExvYWRlciA9IGZ1bmN0aW9uIChzbG90LCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlcy5cbiAgICAgICAgICAgIHZhciBpID0gMCwgc2NvcGU7XG5cbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgbG9vayBmb3IgbWF0Y2ggd2l0aCByZXNwZWN0IHRvXG4gICAgICAgICAgICAvLyB0eXBlIGFuZCBiaW5kaW5nLlxuICAgICAgICAgICAgZm9yICg7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoIGZvdW5kIHcuci50LiB0eXBlIGFuZCBiaW5kLCB3ZSBmaXJlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgfHwgc2xvdFtpXVsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBzZW5kZXIgb2YgdGhlIGV2ZW50IGZvciBnbG9iYWwgZXZlbnRzLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlIG9mIHNjb3BlIGRpZmZlcmVzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xvYmFsIG9yIGEgbG9jYWwgZXZlbnQgaXMgYmVpbmcgcmFpc2VkLlxuICAgICAgICAgICAgICAgICAgICBzY29wZSA9IHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciA/XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zZW5kZXIgOiBnbG9iYWw7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEZuQ2FsbChzbG90W2ldLCBzY29wZSwgZXZlbnQsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIHdhbnRlZCB0byBkZXRhY2ggdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kZXRhY2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kZXRhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBwcm9wYWdhdGlvbiBmbGFnIGlzIHNldCB0byBmYWxzZSBhbmQgZGlzY29udG51ZVxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpZiBuZWVkZWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNhbmNlbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXZlbnRNYXAgPSB7XG4gICAgICAgICAgICBob3ZlcmluIDogJ3RyZW5kUmVnaW9uUm9sbE92ZXInLFxuICAgICAgICAgICAgaG92ZXJvdXQgOiAndHJlbmRSZWdpb25Sb2xsT3V0JyxcbiAgICAgICAgICAgIGNsaWsgOiAnZGF0YXBsb3RjbGljaydcbiAgICAgICAgfSxcbiAgICAgICAgcmFpc2VFdmVudCxcblxuICAgICAgICBFdmVudFRhcmdldCA9IHtcblxuICAgICAgICAgICAgdW5wcm9wYWdhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmNhbmNlbGxlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXRhY2hlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kZXRhY2hlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRlZmF1bHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5wcmV2ZW50ZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpcmUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMuXG4gICAgICAgICAgICBsaXN0ZW5lcnM6IHt9LFxuXG4gICAgICAgICAgICAvLyBUaGUgbGFzdCByYWlzZWQgZXZlbnQgaWQuIEFsbG93cyB0byBjYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgaWQuXG4gICAgICAgICAgICBsYXN0RXZlbnRJZDogMCxcblxuICAgICAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlY3Vyc2VSZXR1cm4sXG4gICAgICAgICAgICAgICAgICAgIEZDRXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpO1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuLnB1c2goRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZVJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSBhZGRlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBoYXMgbm90IGJlZW4gcHJvdmlkZWQgd2hpbGUgYWRkaW5nIGFuIGV2ZW50IGxpc3RlbmVyLiBFbnN1cmUgdGhhdCB5b3UgcGFzcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIGBzdHJpbmdgIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgb2Yge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NDlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NDknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEl0IHdpbGwgbm90IGV2YWwgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTUwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTUwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zZXJ0aW9uIHBvc2l0aW9uIGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgdGhlbiBjcmVhdGUgb25lLlxuICAgICAgICAgICAgICAgIGlmICghKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ucHVzaChbbGlzdGVuZXIsIGJpbmRdKTtcblxuICAgICAgICAgICAgICAgIC8vIEV2ZW50cyBvZiBmdXNpb25DaGFydCByYWlzZWQgdmlhIE11bHRpQ2hhcnRpbmcuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xufSk7Il19

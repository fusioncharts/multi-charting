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
                    setTimeout(updateManager, 0);
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
            callback = arguments[1],
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

    protoDataadapter.highlight = function(id) {
        var dataadapter = this,
            categoryLabel = id && id.toString(),
            categoryArr = dataadapter.configuration.categories,
            index = categoryLabel && categoryArr.indexOf(categoryLabel);
        dataadapter.chart.drawTrendRegion(index);
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
            data = chart.dataAdapter.getDataJson(),
            aggregatedData = chart.dataAdapter.getAggregatedData(),
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
    	this.dataAdapter.highlight(id);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyIsIm11bHRpY2hhcnRpbmcuZXZlbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJmdXNpb25jaGFydHMubXVsdGljaGFydGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTXVsdGlDaGFydGluZyBFeHRlbnNpb24gZm9yIEZ1c2lvbkNoYXJ0c1xuICogVGhpcyBtb2R1bGUgY29udGFpbnMgdGhlIGJhc2ljIHJvdXRpbmVzIHJlcXVpcmVkIGJ5IHN1YnNlcXVlbnQgbW9kdWxlcyB0b1xuICogZXh0ZW5kL3NjYWxlIG9yIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBNdWx0aUNoYXJ0aW5nIG9iamVjdC5cbiAqXG4gKi9cblxuIC8qIGdsb2JhbCB3aW5kb3c6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChlbnYsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBlbnYuZG9jdW1lbnQgP1xuICAgICAgICAgICAgZmFjdG9yeShlbnYpIDogZnVuY3Rpb24od2luKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF3aW4uZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXaW5kb3cgd2l0aCBkb2N1bWVudCBub3QgcHJlc2VudCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFjdG9yeSh3aW4sIHRydWUpO1xuICAgICAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbnYuTXVsdGlDaGFydGluZyA9IGZhY3RvcnkoZW52LCB0cnVlKTtcbiAgICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uIChfd2luZG93LCB3aW5kb3dFeGlzdHMpIHtcbiAgICAvLyBJbiBjYXNlIE11bHRpQ2hhcnRpbmcgYWxyZWFkeSBleGlzdHMuXG4gICAgaWYgKF93aW5kb3cuTXVsdGlDaGFydGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIE11bHRpQ2hhcnRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbiA9IF93aW5kb3c7XG5cbiAgICBpZiAod2luZG93RXhpc3RzKSB7XG4gICAgICAgIF93aW5kb3cuTXVsdGlDaGFydGluZyA9IE11bHRpQ2hhcnRpbmc7XG4gICAgfVxuICAgIHJldHVybiBNdWx0aUNoYXJ0aW5nO1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG1lcmdlID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpIHtcbiAgICAgICAgICAgIHZhciBpdGVtLFxuICAgICAgICAgICAgICAgIHNyY1ZhbCxcbiAgICAgICAgICAgICAgICB0Z3RWYWwsXG4gICAgICAgICAgICAgICAgc3RyLFxuICAgICAgICAgICAgICAgIGNSZWYsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHJGbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgICAgICAgICAgYXJyYXlUb1N0ciA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHIgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICAgICAgICAgICAgICBjaGVja0N5Y2xpY1JlZiA9IGZ1bmN0aW9uKG9iaiwgcGFyZW50QXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gcGFyZW50QXJyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IC0xO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmogPT09IHBhcmVudEFycltpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiSW5kZXg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcblxuICAgICAgICAgICAgLy9jaGVjayB3aGV0aGVyIG9iajIgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgIC8vaWYgYXJyYXkgdGhlbiBpdGVyYXRlIHRocm91Z2ggaXQncyBpbmRleFxuICAgICAgICAgICAgLy8qKioqIE1PT1RPT0xTIHByZWN1dGlvblxuXG4gICAgICAgICAgICBpZiAoIXNyY0Fycikge1xuICAgICAgICAgICAgICAgIHRndEFyciA9IFtvYmoxXTtcbiAgICAgICAgICAgICAgICBzcmNBcnIgPSBbb2JqMl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0Z3RBcnIucHVzaChvYmoxKTtcbiAgICAgICAgICAgICAgICBzcmNBcnIucHVzaChvYmoyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9iajIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGZvciAoaXRlbSA9IDA7IGl0ZW0gPCBvYmoyLmxlbmd0aDsgaXRlbSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VmFsID0gb2JqMltpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRndFZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShza2lwVW5kZWYgJiYgdGd0VmFsID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgdHlwZW9mIHNyY1ZhbCAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHRndFZhbCBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY1JlZiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtIGluIG9iajIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0Z3RWYWwgIT09IG51bGwgJiYgdHlwZW9mIHRndFZhbCA9PT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggZm9yIGlzc3VlIEJVRzogRldYVC02MDJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFIDwgOSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobnVsbCkgZ2l2ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdbb2JqZWN0IE9iamVjdF0nIGluc3RlYWQgb2YgJ1tvYmplY3QgTnVsbF0nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0J3Mgd2h5IG51bGwgdmFsdWUgYmVjb21lcyBPYmplY3QgaW4gSUUgPCA5XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgPSBvYmplY3RUb1N0ckZuLmNhbGwodGd0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IG9iamVjdFRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0ciA9PT0gYXJyYXlUb1N0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmNWYWwgPT09IG51bGwgfHwgIShzcmNWYWwgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjUmVmID0gY2hlY2tDeWNsaWNSZWYodGd0VmFsLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0QXJyW2NSZWZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2Uoc3JjVmFsLCB0Z3RWYWwsIHNraXBVbmRlZiwgdGd0QXJyLCBzcmNBcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVuZDIgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmKSB7XG4gICAgICAgICAgICB2YXIgT0JKRUNUU1RSSU5HID0gJ29iamVjdCc7XG4gICAgICAgICAgICAvL2lmIG5vbmUgb2YgdGhlIGFyZ3VtZW50cyBhcmUgb2JqZWN0IHRoZW4gcmV0dXJuIGJhY2tcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HICYmIHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoyICE9PSBPQkpFQ1RTVFJJTkcgfHwgb2JqMiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajEgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIG9iajEgPSBvYmoyIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVyZ2Uob2JqMSwgb2JqMiwgc2tpcFVuZGVmKTtcbiAgICAgICAgICAgIHJldHVybiBvYmoxO1xuICAgICAgICB9LFxuICAgICAgICBsaWIgPSB7XG4gICAgICAgICAgICBleHRlbmQyOiBleHRlbmQyLFxuICAgICAgICAgICAgbWVyZ2U6IG1lcmdlXG4gICAgICAgIH07XG5cblx0TXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliID0gKE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYiB8fCBsaWIpO1xuXG59KTsiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdHZhciBBamF4ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGFqYXggPSB0aGlzLFxuXHRcdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXTtcblxuXHRcdCAgICBhamF4Lm9uU3VjY2VzcyA9IGFyZ3VtZW50LnN1Y2Nlc3M7XG5cdFx0ICAgIGFqYXgub25FcnJvciA9IGFyZ3VtZW50LmVycm9yO1xuXHRcdCAgICBhamF4Lm9wZW4gPSBmYWxzZTtcblx0XHQgICAgcmV0dXJuIGFqYXguZ2V0KGFyZ3VtZW50LnVybCk7XG5cdFx0fSxcblxuICAgICAgICBhamF4UHJvdG8gPSBBamF4LnByb3RvdHlwZSxcblxuICAgICAgICBGVU5DVElPTiA9ICdmdW5jdGlvbicsXG4gICAgICAgIE1TWE1MSFRUUCA9ICdNaWNyb3NvZnQuWE1MSFRUUCcsXG4gICAgICAgIE1TWE1MSFRUUDIgPSAnTXN4bWwyLlhNTEhUVFAnLFxuICAgICAgICBHRVQgPSAnR0VUJyxcbiAgICAgICAgWEhSRVFFUlJPUiA9ICdYbWxIdHRwcmVxdWVzdCBFcnJvcicsXG4gICAgICAgIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBtdWx0aUNoYXJ0aW5nUHJvdG8ud2luLCAvLyBrZWVwIGEgbG9jYWwgcmVmZXJlbmNlIG9mIHdpbmRvdyBzY29wZVxuXG4gICAgICAgIC8vIFByb2JlIElFIHZlcnNpb25cbiAgICAgICAgdmVyc2lvbiA9IHBhcnNlRmxvYXQod2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLnNwbGl0KCdNU0lFJylbMV0pLFxuICAgICAgICBpZWx0OCA9ICh2ZXJzaW9uID49IDUuNSAmJiB2ZXJzaW9uIDw9IDcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBmaXJlZm94ID0gL21vemlsbGEvaS50ZXN0KHdpbi5uYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZsYWdzLlxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBwYWdlIGlzIG9uIGZpbGUgcHJvdG9jb2wuXG4gICAgICAgIGZpbGVQcm90b2NvbCA9IHdpbi5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JyxcbiAgICAgICAgQVhPYmplY3QgPSB3aW4uQWN0aXZlWE9iamVjdCxcblxuICAgICAgICAvLyBDaGVjayBpZiBuYXRpdmUgeGhyIGlzIHByZXNlbnRcbiAgICAgICAgWEhSTmF0aXZlID0gKCFBWE9iamVjdCB8fCAhZmlsZVByb3RvY29sKSAmJiB3aW4uWE1MSHR0cFJlcXVlc3QsXG5cbiAgICAgICAgLy8gUHJlcGFyZSBmdW5jdGlvbiB0byByZXRyaWV2ZSBjb21wYXRpYmxlIHhtbGh0dHByZXF1ZXN0LlxuICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4bWxodHRwO1xuXG4gICAgICAgICAgICAvLyBpZiB4bWxodHRwcmVxdWVzdCBpcyBwcmVzZW50IGFzIG5hdGl2ZSwgdXNlIGl0LlxuICAgICAgICAgICAgaWYgKFhIUk5hdGl2ZSkge1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFhIUk5hdGl2ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBhY3RpdmVYIGZvciBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4bWxodHRwID0gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUDIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFYT2JqZWN0KE1TWE1MSFRUUCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICAgICAgfSxcblxuICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBQcmV2ZW50cyBjYWNoZWluZyBvZiBBSkFYIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0lmLU1vZGlmaWVkLVNpbmNlJzogJ1NhdCwgMjkgT2N0IDE5OTQgMTk6NDM6MzEgR01UJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyB0aGUgc2VydmVyIGtub3cgdGhhdCB0aGlzIGlzIGFuIEFKQVggcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTGV0cyBzZXJ2ZXIga25vdyB3aGljaCB3ZWIgYXBwbGljYXRpb24gaXMgc2VuZGluZyByZXF1ZXN0cy5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1CeSc6ICdGdXNpb25DaGFydHMnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZW50aW9ucyBjb250ZW50LXR5cGVzIHRoYXQgYXJlIGFjY2VwdGFibGUgZm9yIHRoZSByZXNwb25zZS4gU29tZSBzZXJ2ZXJzIHJlcXVpcmUgdGhpcyBmb3IgQWpheFxuICAgICAgICAgICAgICogY29tbXVuaWNhdGlvbi5cbiAgICAgICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9wbGFpbiwgKi8qJyxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIE1JTUUgdHlwZSBvZiB0aGUgYm9keSBvZiB0aGUgcmVxdWVzdCBhbG9uZyB3aXRoIGl0cyBjaGFyc2V0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnXG4gICAgICAgIH07XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5hamF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFqYXgoYXJndW1lbnRzWzBdKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmdldCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IHdyYXBwZXIueG1saHR0cCxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sgPSB3cmFwcGVyLm9uRXJyb3IsXG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgPSB3cmFwcGVyLm9uU3VjY2VzcyxcbiAgICAgICAgICAgIHhSZXF1ZXN0ZWRCeSA9ICdYLVJlcXVlc3RlZC1CeScsXG4gICAgICAgICAgICBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGV2ZW50TGlzdCA9IFsnb25sb2Fkc3RhcnQnLCAnb25kdXJhdGlvbmNoYW5nZScsICdvbmxvYWRlZG1ldGFkYXRhJywgJ29ubG9hZGVkZGF0YScsICdvbnByb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAnb25jYW5wbGF5JywgJ29uY2FucGxheXRocm91Z2gnLCAnb25hYm9ydCcsICdvbmVycm9yJywgJ29udGltZW91dCcsICdvbmxvYWRlbmQnXTtcblxuICAgICAgICAvLyBYLVJlcXVlc3RlZC1CeSBpcyByZW1vdmVkIGZyb20gaGVhZGVyIGR1cmluZyBjcm9zcyBkb21haW4gYWpheCBjYWxsXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9eKGh0dHA6XFwvXFwvfGh0dHBzOlxcL1xcLykvKSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaG9zdG5hbWUgIT09IC8oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKShbXlxcL1xcOl0qKS8uZXhlYyh1cmwpWzJdKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGRvZXMgbm90IGNvbnRhaW4gaHR0cCBvciBodHRwcywgdGhlbiBpdHMgYSBzYW1lIGRvbWFpbiBjYWxsLiBObyBuZWVkIHRvIHVzZSByZWdleCB0byBnZXRcbiAgICAgICAgICAgIC8vIGRvbWFpbi4gSWYgaXQgY29udGFpbnMgdGhlbiBjaGVja3MgZG9tYWluLlxuICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbeFJlcXVlc3RlZEJ5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICFoYXNPd24uY2FsbChoZWFkZXJzLCB4UmVxdWVzdGVkQnkpICYmIChoZWFkZXJzW3hSZXF1ZXN0ZWRCeV0gPSAnRnVzaW9uQ2hhcnRzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXhtbGh0dHAgfHwgaWVsdDggfHwgZmlyZWZveCkge1xuICAgICAgICAgICAgeG1saHR0cCA9IG5ld1htbEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB3cmFwcGVyLnhtbGh0dHAgPSB4bWxodHRwO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzIDwgMzAwKSB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMzA0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA9PT0gMTIyMyB8fCB4bWxodHRwLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh4bWxodHRwLnJlc3BvbnNlVGV4dCwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKG5ldyBFcnJvcihYSFJFUUVSUk9SKSwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgeG1saHR0cFtldmVudE5hbWVdID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50IDogZXZlbnRcbiAgICAgICAgICAgICAgICB9LCB3cmFwcGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4bWxodHRwLm9wZW4oR0VULCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3BsYWluJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgeG1saHR0cC5zZXRSZXF1ZXN0SGVhZGVyKGksIGhlYWRlcnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB4bWxodHRwLnNlbmQoKTtcbiAgICAgICAgICAgIHdyYXBwZXIub3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3IsIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geG1saHR0cDtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLFxuICAgICAgICAgICAgeG1saHR0cCA9IGluc3RhbmNlLnhtbGh0dHA7XG5cbiAgICAgICAgaW5zdGFuY2Uub3BlbiA9IGZhbHNlO1xuICAgICAgICByZXR1cm4geG1saHR0cCAmJiB0eXBlb2YgeG1saHR0cC5hYm9ydCA9PT0gRlVOQ1RJT04gJiYgeG1saHR0cC5yZWFkeVN0YXRlICYmXG4gICAgICAgICAgICAgICAgeG1saHR0cC5yZWFkeVN0YXRlICE9PSAwICYmIHhtbGh0dHAuYWJvcnQoKTtcbiAgICB9O1xuXG4gICAgYWpheFByb3RvLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIGluc3RhbmNlLm9wZW4gJiYgaW5zdGFuY2UuYWJvcnQoKTtcblxuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25FcnJvcjtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9uU3VjY2VzcztcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLnhtbGh0dHA7XG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vcGVuO1xuXG4gICAgICAgIHJldHVybiAoaW5zdGFuY2UgPSBudWxsKTtcbiAgICB9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuICAgIC8vIFNvdXJjZTogaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8xNTA0LUFzay1CZW4tUGFyc2luZy1DU1YtU3RyaW5ncy1XaXRoLUphdmFzY3JpcHQtRXhlYy1SZWd1bGFyLUV4cHJlc3Npb24tQ29tbWFuZC5odG1cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXG5cbiAgICAvLyBUaGlzIHdpbGwgcGFyc2UgYSBkZWxpbWl0ZWQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2ZcbiAgICAvLyBhcnJheXMuIFRoZSBkZWZhdWx0IGRlbGltaXRlciBpcyB0aGUgY29tbWEsIGJ1dCB0aGlzXG4gICAgLy8gY2FuIGJlIG92ZXJyaWRlbiBpbiB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuICAgIGZ1bmN0aW9uIENTVlRvQXJyYXkgKHN0ckRhdGEsIHN0ckRlbGltaXRlcikge1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGRlbGltaXRlciBpcyBkZWZpbmVkLiBJZiBub3QsXG4gICAgICAgIC8vIHRoZW4gZGVmYXVsdCB0byBjb21tYS5cbiAgICAgICAgc3RyRGVsaW1pdGVyID0gKHN0ckRlbGltaXRlciB8fCBcIixcIik7XG4gICAgICAgIC8vIENyZWF0ZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBwYXJzZSB0aGUgQ1NWIHZhbHVlcy5cbiAgICAgICAgdmFyIG9ialBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIC8vIERlbGltaXRlcnMuXG4gICAgICAgICAgICAgICAgXCIoXFxcXFwiICsgc3RyRGVsaW1pdGVyICsgXCJ8XFxcXHI/XFxcXG58XFxcXHJ8XilcIiArXG4gICAgICAgICAgICAgICAgLy8gUXVvdGVkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIig/OlxcXCIoW15cXFwiXSooPzpcXFwiXFxcIlteXFxcIl0qKSopXFxcInxcIiArXG4gICAgICAgICAgICAgICAgLy8gU3RhbmRhcmQgZmllbGRzLlxuICAgICAgICAgICAgICAgIFwiKFteXFxcIlxcXFxcIiArIHN0ckRlbGltaXRlciArIFwiXFxcXHJcXFxcbl0qKSlcIlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFwiZ2lcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGRhdGEuIEdpdmUgdGhlIGFycmF5XG4gICAgICAgIC8vIGEgZGVmYXVsdCBlbXB0eSBmaXJzdCByb3cuXG4gICAgICAgIHZhciBhcnJEYXRhID0gW1tdXTtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IHRvIGhvbGQgb3VyIGluZGl2aWR1YWwgcGF0dGVyblxuICAgICAgICAvLyBtYXRjaGluZyBncm91cHMuXG4gICAgICAgIHZhciBhcnJNYXRjaGVzID0gbnVsbDtcbiAgICAgICAgLy8gS2VlcCBsb29waW5nIG92ZXIgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzXG4gICAgICAgIC8vIHVudGlsIHdlIGNhbiBubyBsb25nZXIgZmluZCBhIG1hdGNoLlxuICAgICAgICB3aGlsZSAoYXJyTWF0Y2hlcyA9IG9ialBhdHRlcm4uZXhlYyggc3RyRGF0YSApKXtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZGVsaW1pdGVyIHRoYXQgd2FzIGZvdW5kLlxuICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWREZWxpbWl0ZXIgPSBhcnJNYXRjaGVzWyAxIF07XG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGdpdmVuIGRlbGltaXRlciBoYXMgYSBsZW5ndGhcbiAgICAgICAgICAgIC8vIChpcyBub3QgdGhlIHN0YXJ0IG9mIHN0cmluZykgYW5kIGlmIGl0IG1hdGNoZXNcbiAgICAgICAgICAgIC8vIGZpZWxkIGRlbGltaXRlci4gSWYgaWQgZG9lcyBub3QsIHRoZW4gd2Uga25vd1xuICAgICAgICAgICAgLy8gdGhhdCB0aGlzIGRlbGltaXRlciBpcyBhIHJvdyBkZWxpbWl0ZXIuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgc3RyTWF0Y2hlZERlbGltaXRlci5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAoc3RyTWF0Y2hlZERlbGltaXRlciAhPSBzdHJEZWxpbWl0ZXIpXG4gICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBoYXZlIHJlYWNoZWQgYSBuZXcgcm93IG9mIGRhdGEsXG4gICAgICAgICAgICAgICAgLy8gYWRkIGFuIGVtcHR5IHJvdyB0byBvdXIgZGF0YSBhcnJheS5cbiAgICAgICAgICAgICAgICBhcnJEYXRhLnB1c2goIFtdICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIG91ciBkZWxpbWl0ZXIgb3V0IG9mIHRoZSB3YXksXG4gICAgICAgICAgICAvLyBsZXQncyBjaGVjayB0byBzZWUgd2hpY2gga2luZCBvZiB2YWx1ZSB3ZVxuICAgICAgICAgICAgLy8gY2FwdHVyZWQgKHF1b3RlZCBvciB1bnF1b3RlZCkuXG4gICAgICAgICAgICBpZiAoYXJyTWF0Y2hlc1sgMiBdKXtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIHF1b3RlZCB2YWx1ZS4gV2hlbiB3ZSBjYXB0dXJlXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB2YWx1ZSwgdW5lc2NhcGUgYW55IGRvdWJsZSBxdW90ZXMuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDIgXS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICBuZXcgUmVnRXhwKCBcIlxcXCJcXFwiXCIsIFwiZ1wiICksXG4gICAgICAgICAgICAgICAgICAgIFwiXFxcIlwiXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgbm9uLXF1b3RlZCB2YWx1ZS5cbiAgICAgICAgICAgICAgICB2YXIgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1sgMyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgdmFsdWUgc3RyaW5nLCBsZXQncyBhZGRcbiAgICAgICAgICAgIC8vIGl0IHRvIHRoZSBkYXRhIGFycmF5LlxuICAgICAgICAgICAgYXJyRGF0YVsgYXJyRGF0YS5sZW5ndGggLSAxIF0ucHVzaCggc3RyTWF0Y2hlZFZhbHVlICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBwYXJzZWQgZGF0YS5cbiAgICAgICAgcmV0dXJuKCBhcnJEYXRhICk7XG4gICAgfVxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG4gICAgdmFyIE11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlO1xuXG4gICAgTXVsdGlDaGFydGluZ1Byb3RvLmNvbnZlcnRUb0FycmF5ID0gZnVuY3Rpb24gKGRhdGEsIGRlbGltaXRlciwgb3V0cHV0Rm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY3N2VG9BcnIgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIgPSBkYXRhLmRlbGltaXRlcjtcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGRhdGEub3V0cHV0Rm9ybWF0O1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhLmNhbGxiYWNrO1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3RyaW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU1Ygc3RyaW5nIG5vdCBwcm92aWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iLFxuICAgICAgICAgICAgdXBkYXRlTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGltID0gMCxcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsaW0gPSBpICsgMzAwMDtcbiAgICAgICAgICAgICAgICBpZihpID09PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgTXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ29uUGFyc2luZ1N0YXJ0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonbG9hZHN0YXJ0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogbGVuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGNzdlRvQXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgTXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoJ29uUGFyc2luZ1Byb2dyZXNzJywge1xuICAgICAgICAgICAgICAgICAgICBFdmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidwcm9ncmVzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IGxlblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGNzdlRvQXJyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGltID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGxlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsaW07ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY3JlYXRlIGNlbGwgYXJyYXkgdGhhdCBjb2ludGFpbiBjc3YgZGF0YVxuICAgICAgICAgICAgICAgICAgICBjZWxsID0gQ1NWVG9BcnJheShzcGxpdGVkRGF0YVtpXSwgZGVsaW1pdGVyKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBjZWxsICYmIGNlbGxbMF07XG4gICAgICAgICAgICAgICAgICAgIC8vdGFrZSBtaW4gb2YgaGVhZGVyIGxlbmd0aCBhbmQgdG90YWwgY29sdW1uc1xuICAgICAgICAgICAgICAgICAgICBqbGVuID0gbWluKGhlYWRlci5sZW5ndGgsIGNlbGwubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3V0cHV0Rm9ybWF0ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyW2pdXSA9IGNlbGxbal07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgamxlbjsgKytqKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NyZWF0aW5nIHRoZSBmaW5hbCBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iW2hlYWRlcltqXV0ucHVzaChjZWxsW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpIDwgbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL2NhbGwgdXBkYXRlIG1hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCh1cGRhdGVNYW5hZ2VyLCAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBNdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCgnb25QYXJzaW5nRW5kJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQ6IGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonbG9hZGVuZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IGxlblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBjc3ZUb0Fycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGZpbmFsT2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3V0cHV0Rm9ybWF0ID0gb3V0cHV0Rm9ybWF0IHx8IDE7XG4gICAgICAgIGhlYWRlciA9IGhlYWRlciAmJiBoZWFkZXJbMF07XG5cbiAgICAgICAgLy9pZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHNwbGl0ZWREYXRhW3NwbGl0ZWREYXRhLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgICAgICAgc3BsaXRlZERhdGEuc3BsaWNlKChzcGxpdGVkRGF0YS5sZW5ndGggLSAxKSwgMSk7XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0ID09PSAxKSB7XG4gICAgICAgICAgICBmaW5hbE9iID0gW107XG4gICAgICAgICAgICBmaW5hbE9iLnB1c2goaGVhZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXQgPT09IDMpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTtcbiIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXJcdG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdC8vbGliID0gbXVsdGlDaGFydGluZ1Byb3RvLmxpYixcbiAgICAgICAgZXZlbnRMaXN0ID0ge1xuICAgICAgICAgICAgJ21vZGVsVXBkYXRlZCc6ICdtb2RlbHVwZGF0ZWQnLFxuICAgICAgICAgICAgJ21vZGVsRGVsZXRlZCc6ICdtb2RlbGRlbGV0ZWQnLFxuICAgICAgICAgICAgJ21ldGFJbmZvVXBkYXRlJzogJ21ldGFpbmZvdXBkYXRlZCcsXG4gICAgICAgICAgICAncHJvY2Vzc29yVXBkYXRlZCc6ICdwcm9jZXNzb3J1cGRhdGVkJyxcbiAgICAgICAgICAgICdwcm9jZXNzb3JEZWxldGVkJzogJ3Byb2Nlc3NvcmRlbGV0ZWQnXG4gICAgICAgIH0sXG4gICAgICAgIHVpZENvdW50ZXIgPSAwLFxuICAgICAgICBnZXJhdGVVSUQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ21vZGVsX2lkXycgKyAodWlkQ291bnRlcisrKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UHJvY2Vzc29yU3RvcmVPYmogPSBmdW5jdGlvbiAocHJvY2Vzc29yLCBkcykge1xuICAgICAgICAgICAgdmFyIHN0b3JlT2JqID0ge1xuXHQgICAgICAgICAgICAgICAgcHJvY2Vzc29yOiBwcm9jZXNzb3IsXG5cdCAgICAgICAgICAgICAgICBsaXN0bmVyczoge31cblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgbGlzdG5lcnM7XG5cbiAgICAgICAgICAgIGxpc3RuZXJzID0gc3RvcmVPYmoubGlzdG5lcnM7XG4gICAgICAgICAgICBsaXN0bmVyc1tldmVudExpc3QucHJvY2Vzc29yVXBkYXRlZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZHMuX2dlbmVyYXRlSW5wdXREYXRhKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGlzdG5lcnNbZXZlbnRMaXN0LnByb2Nlc3NvckRlbGV0ZWRdID0gIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkcy5yZW1vdmVEYXRhUHJvY2Vzc29yKHByb2Nlc3Nvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlT2JqO1xuICAgICAgICB9LFxuICAgICAgICBhZGRMaXN0bmVycyA9IGZ1bmN0aW9uIChlbGVtZW50LCBsaXN0bmVyc09iaikge1xuICAgICAgICAgICAgdmFyIGV2ZW50TmFtZTtcbiAgICAgICAgICAgIGlmIChsaXN0bmVyc09iaiAmJiBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGV2ZW50TmFtZSBpbiBsaXN0bmVyc09iaikge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0bmVyc09ialtldmVudE5hbWVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RuZXJzID0gZnVuY3Rpb24gKGVsZW1lbnQsIGxpc3RuZXJzT2JqKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnROYW1lO1xuICAgICAgICAgICAgaWYgKGxpc3RuZXJzT2JqICYmIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIGZvciAoZXZlbnROYW1lIGluIGxpc3RuZXJzT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RuZXJzT2JqW2V2ZW50TmFtZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YU1vZGVsLlxuXHRcdERhdGFNb2RlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIFx0dmFyIGRzID0gdGhpcztcblx0ICAgIFx0ZHMubGlua3MgPSB7XG4gICAgICAgICAgICAgIGlucHV0U3RvcmU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgaW5wdXRKU09OOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGlucHV0RGF0YTogW10sXG4gICAgICAgICAgICAgIHByb2Nlc3NvcnM6IFtdLFxuICAgICAgICAgICAgICBtZXRhT2JqOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIGFkZCB0aGUgdW5pY0lkXG4gICAgICAgICAgICBkcy5pZCA9IGdlcmF0ZVVJRCgpO1xuXHQgICAgXHRhcmd1bWVudHNbMF0gJiYgZHMuc2V0RGF0YShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0RGF0YU1vZGVsUHJvdG8gPSBEYXRhTW9kZWwucHJvdG90eXBlO1xuXG4gICAgICAgIC8vXG4gICAgICAgIG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGFNb2RlbChhcmd1bWVudHNbMF0pO1xuICAgICAgICB9O1xuXG4gICAgRGF0YU1vZGVsUHJvdG8uZ2V0SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgIH07XG4gICAgRGF0YU1vZGVsUHJvdG8uX2dlbmVyYXRlSW5wdXREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkcyA9IHRoaXM7XG4gICAgICAgIC8vIHJlbW92ZSBhbGwgb2xkIGRhdGFcbiAgICAgICAgZHMubGlua3MuaW5wdXREYXRhLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBkYXRhIGZyb20gdGhlIGlucHV0IFN0b3JlXG4gICAgICAgIGlmIChkcy5saW5rcy5pbnB1dFN0b3JlICYmIGRzLmxpbmtzLmlucHV0U3RvcmUuZ2V0SlNPTikge1xuICAgICAgICBcdGRzLmxpbmtzLmlucHV0RGF0YSA9IGRzLmxpbmtzLmlucHV0RGF0YS5jb25jYXQoZHMubGlua3MuaW5wdXRTdG9yZS5nZXRKU09OKCkpO1xuICAgICAgICAgICAgLy8gZHMubGlua3MuaW5wdXREYXRhLnB1c2guYXBwbHkoZHMubGlua3MuaW5wdXREYXRhLCBkcy5saW5rcy5pbnB1dFN0b3JlLmdldEpTT04oKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgdGhlIGlucHV0IEpTT04gKHNlcGVyYXRlbHkgYWRkZWQpXG4gICAgICAgIGlmIChkcy5saW5rcy5pbnB1dEpTT04gJiYgZHMubGlua3MuaW5wdXRKU09OLmxlbmd0aCkge1xuICAgICAgICBcdGRzLmxpbmtzLmlucHV0RGF0YSA9IGRzLmxpbmtzLmlucHV0RGF0YS5jb25jYXQoZHMubGlua3MuaW5wdXRKU09OKTtcbiAgICAgICAgXHQvLyBkcy5saW5rcy5pbnB1dERhdGEucHVzaC5hcHBseShkcy5saW5rcy5pbnB1dERhdGEsIGRzLmxpbmtzLmlucHV0SlNPTik7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIGZvciBzaW1wbGVjaXR5IGNhbGwgdGhlIG91dHB1dCBKU09OIGNyZWF0aW9uIG1ldGhvZCBhcyB3ZWxsXG4gICAgICAgIGRzLl9nZW5lcmF0ZU91dHB1dERhdGEoKTtcblxuICAgIH07XG5cblxuICAgIERhdGFNb2RlbFByb3RvLl9nZW5lcmF0ZU91dHB1dERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkcyA9IHRoaXMsXG4gICAgICAgIGxpbmtzID0gZHMubGlua3MsXG4gICAgICAgIG91dHB1dERhdGEgPSBsaW5rcy5pbnB1dERhdGEuY29uY2F0KFtdKSxcbiAgICAgICAgaSxcbiAgICAgICAgbCA9IGxpbmtzLnByb2Nlc3NvcnMubGVuZ3RoLFxuICAgICAgICBzdG9yZU9iajtcblxuICAgICAgICBpZiAobCAmJiBvdXRwdXREYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHN0b3JlT2JqID0gbGlua3MucHJvY2Vzc29yc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVPYmogJiYgc3RvcmVPYmoucHJvY2Vzc29yICYmIHN0b3JlT2JqLnByb2Nlc3Nvci5nZXRQcm9jZXNzZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0b2RvOiB3ZSBoYXZlIHRvIGNyZWF0ZSB0aGlzIG5ldyBtZXRob2QgaW4gdGhlIHByb2Nlc3NvciB0byByZXR1cm4gYSBwcm9jZXNzZWQgSlNPTiBkYXRhXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGEgPSBzdG9yZU9iai5wcm9jZXNzb3IuZ2V0UHJvY2Vzc2VkRGF0YShvdXRwdXREYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZHMubGlua3Mub3V0cHV0RGF0YSA9IG91dHB1dERhdGE7XG5cbiAgICAgICAgLy8gcmFpc2UgdGhlIGV2ZW50IGZvciBPdXRwdXREYXRhIG1vZGlmaWVkIGV2ZW50XG4gICAgICAgIGRzLnJhaXNlRXZlbnQoZXZlbnRMaXN0Lm1vZGVsVXBkYXRlZCwge1xuICAgICAgICAgICAgJ2RhdGEnOiBkcy5saW5rcy5vdXRwdXREYXRhXG4gICAgICAgIH0sIGRzKTtcbiAgICB9O1xuXG5cbiAgICAvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGpzb25kYXRhIG9mIHRoZSBkYXRhIG9iamVjdFxuXHREYXRhTW9kZWxQcm90by5nZXRKU09OID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkcyA9IHRoaXM7XG5cdFx0cmV0dXJuIChkcy5saW5rcy5vdXRwdXREYXRhIHx8IGRzLmxpbmtzLmlucHV0RGF0YSk7XG5cdH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBnZXQgY2hpbGQgZGF0YSBTdG9yZSBvYmplY3QgYWZ0ZXIgYXBwbHlpbmcgZmlsdGVyIG9uIHRoZSBwYXJlbnQgZGF0YS5cblx0Ly8gQHBhcmFtcyB7ZmlsdGVyc30gLSBUaGlzIGNhbiBiZSBhIGZpbHRlciBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBmaWx0ZXIgZnVuY3Rpb25zLlxuXHREYXRhTW9kZWxQcm90by5nZXRDaGlsZE1vZGVsID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcblx0XHR2YXIgZHMgPSB0aGlzLFxuXHRcdFx0bmV3RHMsXG4gICAgICAgICAgICBtZXRhSW5mbyA9IGRzLmxpbmtzLm1ldGFPYmosXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBuZXdEU0xpbmssXG4gICAgICAgICAgICBNZXRhQ29uc3RydWN0b3IsXG5cdFx0XHRtZXRhQ29uc3RyYWN0b3IsXG4gICAgICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnM7XG4gICAgICAgIG5ld0RzID0gbmV3IERhdGFNb2RlbCgpO1xuICAgICAgICBuZXdEU0xpbmsgPSBuZXdEcy5saW5rcztcbiAgICAgICAgbmV3RFNMaW5rLmlucHV0U3RvcmUgPSBkcztcblxuICAgICAgICAvLyBjcmVhdGUgbGlzdG5lcnNcbiAgICAgICAgaW5wdXRTdG9yZUxpc3RuZXJzID0gbmV3RFNMaW5rLmlucHV0U3RvcmVMaXN0bmVycyA9IHt9O1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnNbZXZlbnRMaXN0Lm1vZGVsVXBkYXRlZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBuZXdEcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW5wdXRTdG9yZUxpc3RuZXJzW2V2ZW50TGlzdC5tb2RlbERlbGV0ZWRdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV3RHMuZGlzcG9zZSgpO1xuICAgICAgICB9O1xuICAgICAgICBpbnB1dFN0b3JlTGlzdG5lcnNbZXZlbnRMaXN0Lm1ldGFJbmZvVXBkYXRlXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5ld0RzLnJhaXNlRXZlbnQoZXZlbnRMaXN0Lm1ldGFJbmZvVXBkYXRlLCB7fSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaW5oZXJpdCBtZXRhSW5mb3NcbiAgICAgICAgZm9yIChrZXkgaW4gbWV0YUluZm8pIHtcbiAgICAgICAgICAgIE1ldGFDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgbWV0YUNvbnN0cmFjdG9yLnByb3RvdHlwZSA9IG1ldGFJbmZvW2tleV07XG4gICAgICAgICAgICBtZXRhQ29uc3RyYWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTWV0YUNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgbmV3RFNMaW5rLm1ldGFPYmpba2V5XSA9IG5ldyBNZXRhQ29uc3RydWN0b3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGF0dGFjaGVkIGV2ZW50IGxpc3RlbmVyIG9uIHBhcmVudCBkYXRhXG4gICAgICAgIGFkZExpc3RuZXJzKGRzLCBpbnB1dFN0b3JlTGlzdG5lcnMpO1xuICAgICAgICBuZXdEcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcblxuICAgICAgICBuZXdEcy5hZGREYXRhUHJvY2Vzc29yKGZpbHRlcnMpO1xuICAgICAgICByZXR1cm4gbmV3RHM7XG5cdH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBhZGQgcHJvY2Vzc29yIGluIHRoZSBkYXRhIHN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8uYWRkRGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uIChwcm9jZXNzb3JzKSB7XG4gICAgICAgIHZhciBkcyA9IHRoaXMsXG4gICAgICAgIGksXG4gICAgICAgIGwsXG4gICAgICAgIHByb2Nlc3NvcixcbiAgICAgICAgc3RvcmVPYmo7XG4gICAgICAgIC8vIGlmIHNpbmdsZSBmaWx0ZXIgaXMgcGFzc2VkIG1ha2UgaXQgYW4gQXJyYXlcbiAgICAgICAgaWYgKCEocHJvY2Vzc29ycyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgcHJvY2Vzc29ycyA9IFtwcm9jZXNzb3JzXTtcbiAgICAgICAgfVxuICAgICAgICBsID0gcHJvY2Vzc29ycy5sZW5ndGg7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHByb2Nlc3NvciA9IHByb2Nlc3NvcnNbaV07XG4gICAgICAgICAgICBpZiAocHJvY2Vzc29yICYmIHByb2Nlc3Nvci5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgc3RvcmVPYmogPSBnZXRQcm9jZXNzb3JTdG9yZU9iaihwcm9jZXNzb3IsIGRzKTtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGxpc3RuZXJzXG4gICAgICAgICAgICAgICAgYWRkTGlzdG5lcnMocHJvY2Vzc29yLCBzdG9yZU9iai5saXN0bmVycyk7XG4gICAgICAgICAgICAgICAgZHMubGlua3MucHJvY2Vzc29ycy5wdXNoKHN0b3JlT2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgdGhlIG91dHB1dERhdGFcbiAgICAgICAgZHMuX2dlbmVyYXRlT3V0cHV0RGF0YSgpO1xuICAgIH07XG4gICAgLy9GdW5jdGlvbiB0byByZW1vdmUgcHJvY2Vzc29yIGluIHRoZSBkYXRhIHN0b3JlXG4gICAgRGF0YU1vZGVsUHJvdG8ucmVtb3ZlRGF0YVByb2Nlc3NvciA9IGZ1bmN0aW9uIChwcm9jZXNzb3JzKSB7XG4gICAgICAgIHZhciBkcyA9IHRoaXMsXG4gICAgICAgIHByb2Nlc3NvcnNTdG9yZSA9IGRzLmxpbmtzLnByb2Nlc3NvcnMsXG4gICAgICAgIHN0b3JlT2JqLFxuICAgICAgICBpLFxuICAgICAgICBsLFxuICAgICAgICBqLFxuICAgICAgICBrLFxuICAgICAgICBwcm9jZXNzb3IsXG4gICAgICAgIGZvdW5kTWF0Y2g7XG4gICAgICAgIC8vIGlmIHNpbmdsZSBmaWx0ZXIgaXMgcGFzc2VkIG1ha2UgaXQgYW4gQXJyYXlcbiAgICAgICAgaWYgKCEocHJvY2Vzc29ycyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgcHJvY2Vzc29ycyA9IFtwcm9jZXNzb3JzXTtcbiAgICAgICAgfVxuICAgICAgICBrID0gcHJvY2Vzc29ycy5sZW5ndGg7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBrOyBqICs9IDEpIHtcbiAgICAgICAgICAgIHByb2Nlc3NvciA9IHByb2Nlc3NvcnNbal07XG4gICAgICAgICAgICBsID0gcHJvY2Vzc29yc1N0b3JlLmxlbmd0aDtcbiAgICAgICAgICAgIGZvdW5kTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsICYmICFmb3VuZE1hdGNoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBzdG9yZU9iaiA9IHByb2Nlc3NvcnNTdG9yZVtpXTtcbiAgICAgICAgICAgICAgICBpZiAgKHN0b3JlT2JqICYmIHN0b3JlT2JqLnByb2Nlc3NvciA9PT0gcHJvY2Vzc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0bmVycyhwcm9jZXNzb3IsIHN0b3JlT2JqLmxpc3RuZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBwcmVjZXNzb3Igc3RvcmUgT2JqXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NvcnNTdG9yZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgb3V0cHV0RGF0YVxuICAgICAgICBkcy5fZ2VuZXJhdGVPdXRwdXREYXRhKCk7XG4gICAgfTtcblxuICAgIC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG5cdERhdGFNb2RlbFByb3RvLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lciBhdCBkYXRhU3RvcmUgbGV2ZWwuXG4gICAgRGF0YU1vZGVsUHJvdG8ucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cbiAgICBEYXRhTW9kZWxQcm90by5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGRhdGFPYmopIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQodHlwZSwgZGF0YU9iaiwgdGhpcyk7XG5cdH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBhZGQgZGF0YSBpbiB0aGUgZGF0YSBzdG9yZVxuXHREYXRhTW9kZWxQcm90by5zZXREYXRhID0gZnVuY3Rpb24gKGRhdGFTcGVjcywgY2FsbGJhY2spIHtcblx0XHR2YXIgZHMgPSB0aGlzLFxuXHRcdFx0ZGF0YVR5cGUgPSBkYXRhU3BlY3MuZGF0YVR5cGUsXG5cdFx0XHRkYXRhU291cmNlID0gZGF0YVNwZWNzLmRhdGFTb3VyY2UsXG5cdFx0XHRjYWxsYmFja0hlbHBlckZuID0gZnVuY3Rpb24gKEpTT05EYXRhKSB7XG5cdFx0XHRcdGRzLmxpbmtzLmlucHV0SlNPTiA9IEpTT05EYXRhLmNvbmNhdChkcy5saW5rcy5pbnB1dEpTT04gfHwgW10pO1xuXHRcdFx0XHRkcy5fZ2VuZXJhdGVJbnB1dERhdGEoKTtcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKEpTT05EYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdGlmIChkYXRhVHlwZSA9PT0gJ2NzdicpIHtcblx0XHRcdG11bHRpQ2hhcnRpbmdQcm90by5jb252ZXJ0VG9BcnJheSh7XG5cdFx0XHRcdHN0cmluZyA6IGRhdGFTcGVjcy5kYXRhU291cmNlLFxuXHRcdFx0XHRkZWxpbWl0ZXIgOiBkYXRhU3BlY3MuZGVsaW1pdGVyLFxuXHRcdFx0XHRvdXRwdXRGb3JtYXQgOiBkYXRhU3BlY3Mub3V0cHV0Rm9ybWF0LFxuXHRcdFx0XHRjYWxsYmFjayA6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Y2FsbGJhY2tIZWxwZXJGbihkYXRhU291cmNlKTtcblx0XHR9XG5cdH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byByZW1vdmUgYWxsIGRhdGEgKG5vdCB0aGUgZGF0YSBsaW5rZWQgZnJvbSB0aGUgcGFyZW50KSBpbiB0aGUgZGF0YSBzdG9yZVxuICAgIERhdGFNb2RlbFByb3RvLmNsZWFyRGF0YSA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgZHMgPSB0aGlzO1xuICAgICAgICAvLyBjbGVhciBpbnB1dERhdGEgc3RvcmVcbiAgICAgICAgZHMubGlua3MuaW5wdXRKU09OICYmIChkcy5saW5rcy5pbnB1dEpTT04gPSB1bmRlZmluZWQpO1xuICAgICAgICAvLyByZS1nZW5lcmF0ZSB0aGUgc3RvcmUncyBkYXRhXG4gICAgICAgIGRzLl9nZW5lcmF0ZUlucHV0RGF0YSgpO1xuICAgIH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBkaXNwb3NlIGEgc3RvcmVcbiAgICBEYXRhTW9kZWxQcm90by5kaXNwb3NlID0gZnVuY3Rpb24gKCl7XG4gICAgICAgIHZhciBkcyA9IHRoaXMsXG4gICAgICAgIGxpbmtzID0gZHMubGlua3MsXG4gICAgICAgIGlucHV0U3RvcmUgPSBsaW5rcy5pbnB1dFN0b3JlLFxuICAgICAgICBwcm9jZXNzb3JzU3RvcmUgPSBsaW5rcy5wcm9jZXNzb3JzLFxuICAgICAgICBzdG9yZU9iaixcbiAgICAgICAgaTtcblxuICAgICAgICAvLyByZW1vdmUgaW5vdXRTdG9yZSBsaXN0ZW5lcnNcbiAgICAgICAgaWYgKGlucHV0U3RvcmUgJiYgaW5wdXRTdG9yZS5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICByZW1vdmVMaXN0bmVycyhpbnB1dFN0b3JlLCBsaW5rcy5pbnB1dFN0b3JlTGlzdG5lcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBmaWx0ZXJzIGFuZCB0aGlyIGxpc3RlbmVyc1xuICAgICAgICBmb3IgKGkgPSBwcm9jZXNzb3JzU3RvcmUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC09IDEpIHtcbiAgICAgICAgICAgIHN0b3JlT2JqID0gcHJvY2Vzc29yc1N0b3JlW2ldO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnNcbiAgICAgICAgICAgIHJlbW92ZUxpc3RuZXJzKHN0b3JlT2JqLnByb2Nlc3Nvciwgc3RvcmVPYmoubGlzdG5lcnMpO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NvcnNTdG9yZS5sZW5ndGggPSAwO1xuXG4gICAgICAgIC8vIHJhaXNlIHRoZSBldmVudCBmb3IgT3V0cHV0RGF0YSBtb2RpZmllZCBldmVudFxuICAgICAgICBkcy5yYWlzZUV2ZW50KGV2ZW50TGlzdC5tb2RlbERlbGV0ZWQsIHt9KTtcblxuXG4gICAgICAgIC8vIEB0b2RvOiBkZWxldGUgYWxsIGxpbmtzXG5cbiAgICAgICAgLy8gQHRvZG86IGNsZWFyIGFsbCBldmVudHMgYXMgdGhleSB3aWxsIG5vdCBiZSB1c2VkIGFueSBtb3JlXG5cbiAgICB9O1xuICAgIC8vIEZ1bnRpb24gdG8gZ2V0IGFsbCB0aGUga2V5cyBvZiB0aGUgSlNPTiBkYXRhXG4gICAgLy8gQHRvZG86IG5lZWQgdG8gaW1wcm92ZSBpdCBmb3IgcGVyZm9ybWFuY2UgYXMgd2VsbCBhcyBmb3IgYmV0dGVyIHJlc3VsdHNcblx0RGF0YU1vZGVsUHJvdG8uZ2V0S2V5cyA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZHMgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRzLmdldEpTT04oKSxcblx0XHRcdGZpcnN0RGF0YSA9IGRhdGFbMF0gfHwge307XG5cblx0XHRyZXR1cm4gT2JqZWN0LmtleXMoZmlyc3REYXRhKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCBhbGwgdGhlIHVuaXF1ZSB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byBhIGtleVxuICAgIC8vIEB0b2RvOiBuZWVkIHRvIGltcHJvdmUgaXQgZm9yIHBlcmZvcm1hbmNlIGFzIHdlbGwgYXMgZm9yIGJldHRlciByZXN1bHRzXG5cdERhdGFNb2RlbFByb3RvLmdldFVuaXF1ZVZhbHVlcyA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgZHMgPSB0aGlzLFxuXHRcdFx0ZGF0YSA9IGRzLmdldEpTT04oKSxcblx0XHRcdGludGVybmFsRGF0YSA9IGRhdGFbMF0sXG5cdFx0XHRpc0FycmF5ID0gaW50ZXJuYWxEYXRhIGluc3RhbmNlb2YgQXJyYXksXG5cdFx0XHQvL3VuaXF1ZVZhbHVlcyA9IGRzLnVuaXF1ZVZhbHVlc1trZXldLFxuXHRcdFx0dGVtcFVuaXF1ZVZhbHVlcyA9IHt9LFxuXHRcdFx0bGVuID0gZGF0YS5sZW5ndGgsXG5cdFx0XHRpO1xuXG5cdFx0Ly8gaWYgKHVuaXF1ZVZhbHVlcykge1xuXHRcdC8vIFx0cmV0dXJuIHVuaXF1ZVZhbHVlcztcblx0XHQvLyB9XG5cblx0XHRpZiAoaXNBcnJheSkge1xuXHRcdFx0aSA9IDE7XG5cdFx0XHRrZXkgPSBkcy5nZXRLZXlzKCkuZmluZEluZGV4KGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdHJldHVybiBlbGVtZW50LnRvVXBwZXJDYXNlKCkgPT09IGtleS50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aSA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gaXNBcnJheSA/IDEgOiAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGludGVybmFsRGF0YSA9IGlzQXJyYXkgPyBkYXRhW2ldW2tleV0gOiBkYXRhW2ldW2tleV07XG5cdFx0XHQhdGVtcFVuaXF1ZVZhbHVlc1tpbnRlcm5hbERhdGFdICYmICh0ZW1wVW5pcXVlVmFsdWVzW2ludGVybmFsRGF0YV0gPSB0cnVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gT2JqZWN0LmtleXModGVtcFVuaXF1ZVZhbHVlcyk7XG5cdH07XG5cbiAgICAvLyBGdW5jdGlvbiB0byBhZGQgLyB1cGRhdGUgbWV0YWRhdGFcblx0RGF0YU1vZGVsUHJvdG8udXBkYXRlTWV0YURhdGEgPSBmdW5jdGlvbiAoZmllbGROYW1lLCBtZXRhSW5mbykge1xuICAgICAgICB2YXIgZHMgPSB0aGlzLFxuICAgICAgICBtZXRhT2JqID0gZHMubGlua3MubWV0YU9iaixcbiAgICAgICAgZmllbGRNZXRhSW5mbywga2V5O1xuXHRcdGlmIChmaWVsZE1ldGFJbmZvID0gbWV0YU9ialtmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBtZXRhSW5mbykge1xuICAgICAgICAgICAgICAgIGZpZWxkTWV0YUluZm9ba2V5XSA9IG1ldGFJbmZvW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZHMucmFpc2VFdmVudChldmVudExpc3QubWV0YUluZm9VcGRhdGUsIHt9KTtcblx0fTtcbiAgICAvLyBGdW5jdGlvbiB0byBhZGQgbWV0YWRhdGFcbiAgICAvLyBOb3QgcmVxdWlyZWRcblx0Ly8gRGF0YU1vZGVsUHJvdG8uZGVsZXRlTWV0YURhdGEgPSBmdW5jdGlvbiAoZmllbGROYW1lLCBtZXRhSW5mb0tleSkge1xuICAgIC8vICAgICB2YXIgZHMgPSB0aGlzLFxuICAgIC8vICAgICBtZXRhT2JqID0gZHMubGlua3MubWV0YU9iajtcbiAgICAvLyAgICAgaWYgKG1ldGFPYmpbZmllbGROYW1lXSkge1xuICAgIC8vICAgICAgICAgbWV0YU9ialtmaWVsZE5hbWVdW21ldGFJbmZvS2V5XSA9IHVuZGVmaW5lZDtcbiAgICAvLyAgICAgfVxuXHQvLyB9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGdldCB0aGUgYWRkZWQgbWV0YURhdGFcblx0RGF0YU1vZGVsUHJvdG8uZ2V0TWV0YURhdGEgPSBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG5cdFx0dmFyIGRzID0gdGhpcyxcbiAgICAgICAgbWV0YU9iaiA9IGRzLmxpbmtzLm1ldGFPYmo7XG4gICAgICAgIHJldHVybiBmaWVsZE5hbWUgPyAobWV0YU9ialtmaWVsZE5hbWVdIHx8IHt9KSA6IG1ldGFPYmo7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgdG8gdGhlIGRhdGFTdG9yYWdlIGFzeW5jaHJvbm91c2x5IHZpYSBhamF4XG4gICAgRGF0YU1vZGVsUHJvdG8uc2V0RGF0YVVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRhdGFTdG9yZSA9IHRoaXMsXG4gICAgICAgICAgICBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgPSBhcmd1bWVudC5kYXRhU291cmNlLFxuICAgICAgICAgICAgZGF0YVR5cGUgPSBhcmd1bWVudC5kYXRhVHlwZSxcbiAgICAgICAgICAgIGRlbGltaXRlciA9IGFyZ3VtZW50LmRlbGltaXRlcixcbiAgICAgICAgICAgIG91dHB1dEZvcm1hdCA9IGFyZ3VtZW50Lm91dHB1dEZvcm1hdCxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXJndW1lbnRzWzFdLFxuICAgICAgICAgICAgY2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICBtdWx0aUNoYXJ0aW5nUHJvdG8uYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBkYXRhU291cmNlLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhVHlwZSA9PT0gJ2pzb24nID8gSlNPTi5wYXJzZShzdHJpbmcpIDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGRhdGFTdG9yZS5zZXREYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZSA6IGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlIDogZGF0YVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA6IGRlbGltaXRlcixcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0Rm9ybWF0IDogb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNhbGxiYWNrQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSk7XG4iLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cblx0dmFyIG11bHRpQ2hhcnRpbmdQcm90byA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuXHRcdGxpYiA9IG11bHRpQ2hhcnRpbmdQcm90by5saWIsXG5cdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUgPSB7fSxcblx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbmsgPSB7fSxcblx0XHRmaWx0ZXJJZENvdW50ID0gMCxcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSxcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSxcblx0XHRldmVudExpc3QgPSB7XG4gICAgICAgICAgICAnbW9kZWxVcGRhdGVkJzogJ21vZGVsdXBkYXRlZCcsXG4gICAgICAgICAgICAnbW9kZWxEZWxldGVkJzogJ21vZGVsZGVsZXRlZCcsXG4gICAgICAgICAgICAnbWV0YUluZm9VcGRhdGUnOiAnbWV0YWluZm91cGRhdGVkJyxcbiAgICAgICAgICAgICdwcm9jZXNzb3JVcGRhdGVkJzogJ3Byb2Nlc3NvcnVwZGF0ZWQnLFxuICAgICAgICAgICAgJ3Byb2Nlc3NvckRlbGV0ZWQnOiAncHJvY2Vzc29yZGVsZXRlZCdcbiAgICAgICAgfSxcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVByb2Nlc3Nvci5cblx0XHREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuYWRkUnVsZShhcmd1bWVudHNbMF0pO1xuXHRcdH0sXG5cdFx0XG5cdFx0ZGF0YVByb2Nlc3NvclByb3RvID0gRGF0YVByb2Nlc3Nvci5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byB1cGRhdGUgZGF0YSBvbiBjaGFuZ2Ugb2YgZmlsdGVyLlxuXHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvciA9IGZ1bmN0aW9uIChpZCwgY29weVBhcmVudFRvQ2hpbGQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRkYXRhID0gZmlsdGVyTGlua1tpZF0sXG5cdFx0XHRcdEpTT05EYXRhLFxuXHRcdFx0XHRkYXR1bSxcblx0XHRcdFx0ZGF0YUlkLFxuXHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXR1bSA9IGRhdGFbaV07XG5cdFx0XHRcdGRhdGFJZCA9IGRhdHVtLmlkO1xuXHRcdFx0XHRpZiAoIWxpYi50ZW1wRGF0YVVwZGF0ZWRbZGF0YUlkXSkge1xuXHRcdFx0XHRcdGlmIChwYXJlbnRTdG9yZVtkYXRhSWRdICYmIGRhdGFTdG9yYWdlW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRcdEpTT05EYXRhID0gcGFyZW50U3RvcmVbZGF0YUlkXS5nZXREYXRhKCk7XG5cdFx0XHRcdFx0XHRkYXR1bS5tb2RpZnlEYXRhKGNvcHlQYXJlbnRUb0NoaWxkID8gSlNPTkRhdGEgOiBmaWx0ZXJTdG9yZVtpZF0oSlNPTkRhdGEpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgcGFyZW50U3RvcmVbZGF0YUlkXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblx0XHR9O1xuXG5cdG11bHRpQ2hhcnRpbmdQcm90by5jcmVhdGVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVByb2Nlc3Nvcihhcmd1bWVudHNbMF0pO1xuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBmaWx0ZXIgaW4gdGhlIGZpbHRlciBzdG9yZVxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdG9sZElkID0gZmlsdGVyLmlkLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRmaWx0ZXJGbiA9IChhcmd1bWVudCAmJiBhcmd1bWVudC5ydWxlKSB8fCBhcmd1bWVudCxcblx0XHRcdGlkID0gYXJndW1lbnQgJiYgYXJndW1lbnQudHlwZSxcblx0XHRcdHR5cGUgPSBhcmd1bWVudCAmJiBhcmd1bWVudC50eXBlO1xuXG5cdFx0aWQgPSBvbGRJZCB8fCBpZCB8fCAnZmlsdGVyU3RvcmUnICsgZmlsdGVySWRDb3VudCArKztcblx0XHRmaWx0ZXJTdG9yZVtpZF0gPSBmaWx0ZXJGbjtcblxuXHRcdGZpbHRlci5pZCA9IGlkO1xuXHRcdGZpbHRlci50eXBlID0gdHlwZTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgZGF0YSBvbiB3aGljaCB0aGUgZmlsdGVyIGlzIGFwcGxpZWQgYW5kIGFsc28gb24gdGhlIGNoaWxkIGRhdGEuXG5cdFx0aWYgKGZpbHRlckxpbmtbaWRdKSB7XG5cdFx0XHR1cGRhdGFGaWx0ZXJQcm9jZXNzb3IoaWQpO1xuXHRcdH1cblxuXHRcdG11bHRpQ2hhcnRpbmdQcm90by5yYWlzZUV2ZW50KGV2ZW50TGlzdC5wcm9jZXNzb3JVcGRhdGVkLCB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdkYXRhJyA6IGZpbHRlckZuXG5cdFx0fSwgZmlsdGVyKTtcblx0fTtcblxuXHQvLyBGdW50aW9uIHRvIGdldCB0aGUgZmlsdGVyIG1ldGhvZC5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmdldFByb2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZmlsdGVyU3RvcmVbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBJRCBvZiB0aGUgZmlsdGVyLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdGlkID0gZmlsdGVyLmlkO1xuXG5cdFx0ZmlsdGVyTGlua1tpZF0gJiYgdXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkLCB0cnVlKTtcblxuXHRcdGRlbGV0ZSBmaWx0ZXJTdG9yZVtpZF07XG5cdFx0ZGVsZXRlIGZpbHRlckxpbmtbaWRdO1xuXG5cdFx0bXVsdGlDaGFydGluZ1Byb3RvLnJhaXNlRXZlbnQoZXZlbnRMaXN0LnByb2Nlc3NvckRlbGV0ZWQsIHtcblx0XHRcdCdpZCc6IGlkLFxuXHRcdH0sIGZpbHRlcik7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmZpbHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ2ZpbHRlcidcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5zb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnc29ydCdcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5tYXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdtYXAnXG5cdFx0XHR9XG5cdFx0KTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0UHJvY2Vzc2VkRGF0YSA9IGZ1bmN0aW9uIChKU09ORGF0YSkge1xuXHRcdHZhciBkYXRhUHJvY2Vzc29yID0gdGhpcyxcblx0XHRcdHR5cGUgPSBkYXRhUHJvY2Vzc29yLnR5cGUsXG5cdFx0XHRmaWx0ZXJGbiA9IGRhdGFQcm9jZXNzb3IuZ2V0UHJvY2Vzc29yKCk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGNhc2UgICdmaWx0ZXInIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChKU09ORGF0YSwgZmlsdGVyRm4pO1xuICAgICAgICAgICAgY2FzZSAnbWFwJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcbiAgICAgICAgICAgIGRlZmF1bHQgOiByZXR1cm4gZmlsdGVyRm4oSlNPTkRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIFxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBldmVudCBsaXN0ZW5lciBhdCBkYXRhUHJvY2Vzc29yIGxldmVsLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdGhpcyk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIGF0IGRhdGFQcm9jZXNzb3IgbGV2ZWwuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gbXVsdGlDaGFydGluZ1Byb3RvLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHRoaXMpO1xuXHR9O1xuXG4gICAgZGF0YVByb2Nlc3NvclByb3RvLnJhaXNlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YU9iaikge1xuXHRcdHJldHVybiBtdWx0aUNoYXJ0aW5nUHJvdG8ucmFpc2VFdmVudCh0eXBlLCBkYXRhT2JqLCB0aGlzKTtcblx0fTtcblxufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGV4dGVuZDIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIuZXh0ZW5kMixcbiAgICAgICAgTlVMTCA9IG51bGwsXG4gICAgICAgIENPTE9SID0gJ2NvbG9yJyxcbiAgICAgICAgUEFMRVRURUNPTE9SUyA9ICdwYWxldHRlQ29sb3JzJztcbiAgICAvL2Z1bmN0aW9uIHRvIGNvbnZlcnQgZGF0YSwgaXQgcmV0dXJucyBmYyBzdXBwb3J0ZWQgSlNPTlxuICAgIHZhciBEYXRhQWRhcHRlciA9IGZ1bmN0aW9uIChkYXRhU291cmNlLCBjb25mLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzO1xuXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZSA9IGRhdGFTb3VyY2U7ICAgICAgIFxuICAgICAgICBkYXRhYWRhcHRlci5kYXRhSlNPTiA9IGRhdGFhZGFwdGVyLmRhdGFTdG9yZSAmJiBkYXRhYWRhcHRlci5kYXRhU3RvcmUuZ2V0SlNPTigpO1xuICAgICAgICBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uID0gY29uZjtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgZGF0YWFkYXB0ZXIuRkNqc29uID0gZGF0YWFkYXB0ZXIuX19jb252ZXJ0RGF0YV9fKCk7XG4gICAgfSxcbiAgICBwcm90b0RhdGFhZGFwdGVyID0gRGF0YUFkYXB0ZXIucHJvdG90eXBlO1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5fX2NvbnZlcnREYXRhX18gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcywgICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGEsXG4gICAgICAgICAgICBqc29uID0ge30sXG4gICAgICAgICAgICBwcmVkZWZpbmVkSnNvbiA9IHt9LFxuICAgICAgICAgICAganNvbkRhdGEgPSBkYXRhYWRhcHRlci5kYXRhSlNPTixcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBkYXRhYWRhcHRlci5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBkYXRhYWRhcHRlci5jYWxsYmFjayxcbiAgICAgICAgICAgIGlzTWV0YURhdGEgPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgKGRhdGFhZGFwdGVyLmRhdGFTdG9yZS5nZXRNZXRhRGF0YSgpID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICAgICAgICAgIHByZWRlZmluZWRKc29uID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLmNvbmZpZztcblxuICAgICAgICBpZiAoanNvbkRhdGEgJiYgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgZ2VuZXJhbERhdGEgPSBkYXRhYWRhcHRlci5fX2dlbmVyYWxEYXRhRm9ybWF0X18oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pO1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzID0gY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZS5nZXRVbmlxdWVWYWx1ZXMoY29uZmlndXJhdGlvbi5kaW1lbnNpb25bMF0pO1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzICYmIChhZ2dyZWdhdGVkRGF0YSA9IGRhdGFhZGFwdGVyLl9fZ2V0U29ydGVkRGF0YV9fKGdlbmVyYWxEYXRhLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLCBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiwgY29uZmlndXJhdGlvbi5hZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICBhZ2dyZWdhdGVkRGF0YSA9IGFnZ3JlZ2F0ZWREYXRhIHx8IGdlbmVyYWxEYXRhO1xuICAgICAgICAgICAgZGF0YWFkYXB0ZXIuYWdncmVnYXRlZERhdGEgPSBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIGpzb24gPSBkYXRhYWRhcHRlci5fX2pzb25DcmVhdG9yX18oYWdncmVnYXRlZERhdGEsIGNvbmZpZ3VyYXRpb24pOyAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIGpzb24gPSAocHJlZGVmaW5lZEpzb24gJiYgZXh0ZW5kMihqc29uLHByZWRlZmluZWRKc29uKSkgfHwganNvbjtcbiAgICAgICAganNvbiA9IChjYWxsYmFjayAmJiBjYWxsYmFjayhqc29uKSkgfHwganNvbjtcbiAgICAgICAgcmV0dXJuIGlzTWV0YURhdGEgPyBkYXRhYWRhcHRlci5fX3NldERlZmF1bHRBdHRyX18oanNvbikgOiBqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLl9fZ2V0U29ydGVkRGF0YV9fID0gZnVuY3Rpb24gKGRhdGEsIGNhdGVnb3J5QXJyLCBkaW1lbnNpb24sIGFnZ3JlZ2F0ZU1vZGUpIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGluZGVveE9mS2V5LFxuICAgICAgICAgICAgbmV3RGF0YSA9IFtdLFxuICAgICAgICAgICAgc3ViU2V0RGF0YSA9IFtdLFxuICAgICAgICAgICAga2V5ID0gW10sXG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gW10sXG4gICAgICAgICAgICBsZW5LZXksXG4gICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgbGVuQ2F0LFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgYXJyID0gW10sXG4gICAgICAgICAgICBkYXRhU3RvcmUgPSBkYXRhYWRhcHRlci5kYXRhU3RvcmU7XG4gIFxuICAgICAgICAoQXJyYXkuaXNBcnJheShkaW1lbnNpb24pICYmIChrZXkgPSBkaW1lbnNpb24pKSB8fCAoa2V5ID0gW2RpbWVuc2lvbl0pO1xuXG4gICAgICAgIChjYXRlZ29yeUFyciAmJiAhY2F0ZWdvcnlBcnIubGVuZ3RoKSB8fCAoY2F0ZWdvcnlBcnIgPSBkYXRhU3RvcmUuZ2V0VW5pcXVlVmFsdWVzKGtleVswXSkpO1xuICAgICAgICAoQXJyYXkuaXNBcnJheShjYXRlZ29yeUFyclswXSkgJiYgKGNhdGVnb3JpZXMgPSBjYXRlZ29yeUFycikpIHx8IChjYXRlZ29yaWVzID0gW2NhdGVnb3J5QXJyXSk7XG5cbiAgICAgICAgbmV3RGF0YS5wdXNoKGRhdGFbMF0pO1xuICAgICAgICBmb3IoayA9IDAsIGxlbktleSA9IGtleS5sZW5ndGg7IGsgPCBsZW5LZXk7IGsrKykge1xuICAgICAgICAgICAgaW5kZW94T2ZLZXkgPSBkYXRhWzBdLmluZGV4T2Yoa2V5W2tdKTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yKGkgPSAwLGxlbkNhdCA9IGNhdGVnb3JpZXNba10ubGVuZ3RoOyBpIDwgbGVuQ2F0ICAmJiBpbmRlb3hPZktleSAhPT0gLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1YlNldERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBkYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAoZGF0YVtqXVtpbmRlb3hPZktleV0gPT0gY2F0ZWdvcmllc1trXVtpXSkgJiYgKHN1YlNldERhdGEucHVzaChkYXRhW2pdKSk7XG4gICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgYXJyW2luZGVveE9mS2V5XSA9IGNhdGVnb3JpZXNba11baV07XG4gICAgICAgICAgICAgICAgKHN1YlNldERhdGEubGVuZ3RoID09PSAwKSAmJiAoc3ViU2V0RGF0YS5wdXNoKGFycikpO1xuICAgICAgICAgICAgICAgIG5ld0RhdGEucHVzaChkYXRhYWRhcHRlci5fX2dldEFnZ3JlZ2F0ZURhdGFfXyhzdWJTZXREYXRhLCBjYXRlZ29yaWVzW2tdW2ldLCBhZ2dyZWdhdGVNb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci51cGRhdGUgPSBmdW5jdGlvbiAoZGF0YVNvdXJjZSwgY29uZiwgY2FsbGJhY2spe1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzO1xuXG4gICAgICAgIGRhdGFhZGFwdGVyLmRhdGFTdG9yZSA9IGRhdGFTb3VyY2UgfHwgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlOyAgICAgICBcbiAgICAgICAgZGF0YWFkYXB0ZXIuZGF0YUpTT04gPSBkYXRhYWRhcHRlci5kYXRhU3RvcmUgJiYgZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLmdldEpTT04oKTtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbiA9IGNvbmYgfHwgZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbjtcbiAgICAgICAgZGF0YWFkYXB0ZXIuY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBkYXRhYWRhcHRlci5jYWxsYmFjaztcbiAgICAgICAgZGF0YWFkYXB0ZXIuRkNqc29uID0gZGF0YWFkYXB0ZXIuX19jb252ZXJ0RGF0YV9fKCk7XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19zZXREZWZhdWx0QXR0cl9fID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGRhdGFhZGFwdGVyID0gdGhpcyxcbiAgICAgICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9ICcnLFxuICAgICAgICAgICAgcGFsZXR0ZUNvbG9ycyA9ICcnLFxuICAgICAgICAgICAgZGF0YVN0b3JlID0gZGF0YWFkYXB0ZXIuZGF0YVN0b3JlLFxuICAgICAgICAgICAgY29uZiA9IGRhdGFhZGFwdGVyICYmIGRhdGFhZGFwdGVyLmNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBtZWFzdXJlID0gY29uZiAmJiBjb25mLm1lYXN1cmUgfHwgW10sXG4gICAgICAgICAgICBtZXRhRGF0YSA9IGRhdGFTdG9yZSAmJiBkYXRhU3RvcmUuZ2V0TWV0YURhdGEoKSxcbiAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSxcbiAgICAgICAgICAgIHNlcmllc1R5cGUgPSBjb25mICYmIGNvbmYuc2VyaWVzVHlwZSxcbiAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbMF1dICYmIG1ldGFEYXRhW21lYXN1cmVbMF1dO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1ldGFEYXRhTWVhc3VyZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKHBhbGV0dGVDb2xvcnMgPSBwYWxldHRlQ29sb3JzICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobWV0YURhdGFNZWFzdXJlW0NPTE9SXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKSk7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnRbUEFMRVRURUNPTE9SU10gPSBwYWxldHRlQ29sb3JzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ21zJyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uZGF0YXNldC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmUgPSBtZXRhRGF0YVttZWFzdXJlW2ldXSAmJiBtZXRhRGF0YVttZWFzdXJlW2ldXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlICYmIG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0gJiYgKGpzb24uZGF0YXNldFtpXVtDT0xPUl0gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChtZXRhRGF0YU1lYXN1cmVbQ09MT1JdIGluc3RhbmNlb2YgRnVuY3Rpb24pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YURhdGFNZWFzdXJlW0NPTE9SXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldFswXS5zZXJpZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFEYXRhTWVhc3VyZSA9IG1ldGFEYXRhW21lYXN1cmVbaV1dICYmIG1ldGFEYXRhW21lYXN1cmVbaV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBtZXRhRGF0YU1lYXN1cmUgJiZtZXRhRGF0YU1lYXN1cmVbQ09MT1JdICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgobWV0YURhdGFNZWFzdXJlW0NPTE9SXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IG1ldGFEYXRhTWVhc3VyZVtDT0xPUl0oKSA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhRGF0YU1lYXN1cmVbQ09MT1JdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yICYmIChqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLnBsb3RbQ09MT1JdID0gY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBzZXJpZXNUeXBlID0gc2VyaWVzVHlwZSAmJiBzZXJpZXNUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG5cbiAgICAgICAganNvbi5jaGFydCB8fCAoanNvbi5jaGFydCA9IHt9KTtcbiAgICAgICAgXG4gICAgICAgIGtleUV4Y2x1ZGVkSnNvblN0ciA9IChtZXRhRGF0YSAmJiBKU09OLnN0cmluZ2lmeShqc29uLCBmdW5jdGlvbihrLHYpe1xuICAgICAgICAgICAgaWYoayA9PSAnY29sb3InKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5VTEw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSkpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgICBqc29uID0gKGtleUV4Y2x1ZGVkSnNvblN0ciAmJiBKU09OLnBhcnNlKGtleUV4Y2x1ZGVkSnNvblN0cikpIHx8IGpzb247XG5cbiAgICAgICAgc2VyaWVzW3Nlcmllc1R5cGVdKCk7XG5cbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfTtcblxuICAgIHByb3RvRGF0YWFkYXB0ZXIuX19nZXRBZ2dyZWdhdGVEYXRhX18gPSBmdW5jdGlvbiAoZGF0YSwga2V5LCBhZ2dyZWdhdGVNb2RlKSB7XG4gICAgICAgIHZhciBhZ2dyZWdhdGVNZXRob2QgPSB7XG4gICAgICAgICAgICAnc3VtJyA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIGosXG4gICAgICAgICAgICAgICAgICAgIGxlblIsXG4gICAgICAgICAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gZGF0YVswXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDEsIGxlblIgPSBkYXRhLmxlbmd0aDsgaSA8IGxlblI7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBkYXRhW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKGRhdGFbaV1bal0gIT0ga2V5KSAmJiAoYWdncmVnYXRlZERhdGFbal0gPSBOdW1iZXIoYWdncmVnYXRlZERhdGFbal0pICsgTnVtYmVyKGRhdGFbaV1bal0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWdncmVnYXRlZERhdGE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2F2ZXJhZ2UnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlBZ2dyZWdhdGVNdGhkID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgbGVuUiA9IGRhdGEubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVkU3VtQXJyID0gaUFnZ3JlZ2F0ZU10aGQuc3VtKCksXG4gICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZERhdGEgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IGFnZ3JlZ2F0ZWRTdW1BcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAoKGFnZ3JlZ2F0ZWRTdW1BcnJbaV0gIT0ga2V5KSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgIChhZ2dyZWdhdGVkRGF0YVtpXSA9IChOdW1iZXIoYWdncmVnYXRlZFN1bUFycltpXSkpIC8gbGVuUikpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGFnZ3JlZ2F0ZWREYXRhW2ldID0gYWdncmVnYXRlZFN1bUFycltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdGVkRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZ2dyZWdhdGVNb2RlID0gYWdncmVnYXRlTW9kZSAmJiBhZ2dyZWdhdGVNb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFnZ3JlZ2F0ZU1vZGUgPSAoYWdncmVnYXRlTWV0aG9kW2FnZ3JlZ2F0ZU1vZGVdICYmIGFnZ3JlZ2F0ZU1vZGUpIHx8ICdzdW0nO1xuXG4gICAgICAgIHJldHVybiBhZ2dyZWdhdGVNZXRob2RbYWdncmVnYXRlTW9kZV0oKTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5fX2dlbmVyYWxEYXRhRm9ybWF0X18gPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoanNvbkRhdGFbMF0pLFxuICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheSA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBsZW5HZW5lcmFsRGF0YUFycmF5LFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBkaW1lbnNpb24gPSBjb25maWd1cmF0aW9uLmRpbWVuc2lvbiB8fCBbXSxcbiAgICAgICAgICAgIG1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUgfHwgW107XG4gICAgICAgIGlmICghaXNBcnJheSl7XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gW107XG4gICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdLnB1c2goZGltZW5zaW9uKTtcbiAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChtZWFzdXJlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGpzb25EYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuR2VuZXJhbERhdGFBcnJheSA9IGdlbmVyYWxEYXRhQXJyYXlbMF0ubGVuZ3RoOyBqIDwgbGVuR2VuZXJhbERhdGFBcnJheTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbkRhdGFbaV1bZ2VuZXJhbERhdGFBcnJheVswXVtqXV07ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdW2pdID0gdmFsdWUgfHwgJyc7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBqc29uRGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VuZXJhbERhdGFBcnJheTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5fX2pzb25DcmVhdG9yX18gPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICB2YXIgY29uZiA9IGNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBzZXJpZXNUeXBlID0gY29uZiAmJiBjb25mLnNlcmllc1R5cGUsXG4gICAgICAgICAgICBzZXJpZXMgPSB7XG4gICAgICAgICAgICAgICAgJ21zJyA6IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jYXRlZ29yaWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjYXRlZ29yeSc6IFsgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNhdGVnb3JpZXNbMF0uY2F0ZWdvcnkucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0W2ldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2VyaWVzbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRbaV0uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZScgOiBqc29uRGF0YVtqXVtpbmRleE1hdGNoXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hMYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwgPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbMF0pO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBsZW5EYXRhID0ganNvbkRhdGEubGVuZ3RoOyBqIDwgbGVuRGF0YTsgaisrKSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBqc29uRGF0YVtqXVtpbmRleE1hdGNoTGFiZWxdOyAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uRGF0YVtqXVtpbmRleE1hdGNoVmFsdWVdOyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDogbGFiZWwgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJyA6IHZhbHVlIHx8ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5ID0ge307XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uY2F0ZWdvcnkuZGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGpzb24uY2hhcnQuZGF0YXNldHNbMF0uZGF0YXNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5NZWFzdXJlID0gY29uZmlndXJhdGlvbi5tZWFzdXJlLmxlbmd0aDsgaSA8IGxlbk1lYXN1cmU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5jaGFydC5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllc1tpXSA9IHsgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNoYXJ0LmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqc29uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIHNlcmllc1R5cGUgPSBzZXJpZXNUeXBlICYmIHNlcmllc1R5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgc2VyaWVzVHlwZSA9IChzZXJpZXNbc2VyaWVzVHlwZV0gJiYgc2VyaWVzVHlwZSkgfHwgJ21zJztcbiAgICAgICAgcmV0dXJuIGNvbmYubWVhc3VyZSAmJiBjb25mLmRpbWVuc2lvbiAmJiBzZXJpZXNbc2VyaWVzVHlwZV0oanNvbkRhdGEsIGNvbmYpO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEpTT04gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRkNqc29uO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERhdGFKc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFKU09OO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldEFnZ3JlZ2F0ZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFnZ3JlZ2F0ZWREYXRhO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmdldERpbWVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmRpbWVuc2lvbjtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRNZWFzdXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24ubWVhc3VyZTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXRMaW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YWFkYXB0ZXIgPSB0aGlzLFxuICAgICAgICAgICAgbWF4ID0gLUluZmluaXR5LFxuICAgICAgICAgICAgbWluID0gK0luZmluaXR5LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SLFxuICAgICAgICAgICAgbGVuQyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGF0YSA9IGRhdGFhZGFwdGVyLmFnZ3JlZ2F0ZWREYXRhO1xuICAgICAgICBmb3IoaSA9IDAsIGxlblIgPSBkYXRhICYmIGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbGVuQyA9IGRhdGFbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICtkYXRhW2ldW2pdO1xuICAgICAgICAgICAgICAgIHZhbHVlICYmIChtYXggPSBtYXggPCB2YWx1ZSA/IHZhbHVlIDogbWF4KTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAobWluID0gbWluID4gdmFsdWUgPyB2YWx1ZSA6IG1pbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdtaW4nIDogbWluLFxuICAgICAgICAgICAgJ21heCcgOiBtYXhcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcHJvdG9EYXRhYWRhcHRlci5nZXREYXRhU3RvcmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVN0b3JlO1xuICAgIH07XG5cbiAgICBwcm90b0RhdGFhZGFwdGVyLmhpZ2hsaWdodCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHZhciBkYXRhYWRhcHRlciA9IHRoaXMsXG4gICAgICAgICAgICBjYXRlZ29yeUxhYmVsID0gaWQgJiYgaWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNhdGVnb3J5QXJyID0gZGF0YWFkYXB0ZXIuY29uZmlndXJhdGlvbi5jYXRlZ29yaWVzLFxuICAgICAgICAgICAgaW5kZXggPSBjYXRlZ29yeUxhYmVsICYmIGNhdGVnb3J5QXJyLmluZGV4T2YoY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgIGRhdGFhZGFwdGVyLmNoYXJ0LmRyYXdUcmVuZFJlZ2lvbihpbmRleCk7XG4gICAgfTtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFBZGFwdGVyID0gZnVuY3Rpb24gKGRhdGFTb3VyY2UsIGNvbmYsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YUFkYXB0ZXIoZGF0YVNvdXJjZSwgY29uZiwgY2FsbGJhY2spO1xuICAgIH07XG59KTsiLCIgLyogZ2xvYmFsIEZ1c2lvbkNoYXJ0czogdHJ1ZSAqL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIHZhciBkb2N1bWVudCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbi5kb2N1bWVudCxcbiAgICBcdE1BWF9QRVJDRU5UID0gJzEwMCUnLFxuICAgICAgICBkYXRhQWRhcHRlciA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmRhdGFBZGFwdGVyLFxuICAgICAgICBJRCA9ICdjaGFydC1jb250YWluZXItJyxcbiAgICAgICAgY2hhcnRJZCA9IDAsXG4gICAgICAgIFBYID0gJ3B4JyxcbiAgICAgICAgU1BBTiA9ICdzcGFuJyxcbiAgICAgICAgQ2hhcnQgPSBmdW5jdGlvbihjb25mKSB7XG4gICAgICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGRhdGFBZGFwdGVyQ29uZiA9IHt9LFxuICAgICAgICAgICAgICAgIGNyZWF0ZUNoYXJ0Q29uZiA9IHt9LFxuICAgICAgICAgICAgICAgIGRhdGFTdG9yZTtcblxuICAgICAgICAgICAgY2hhcnQuaXNDaGFydCA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNoYXJ0LmNvbmYgPSB7fTtcblxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihjaGFydC5jb25mLCBjb25mKTtcblxuICAgICAgICAgICAgY2hhcnQuYXV0b1VwZGF0ZSA9IGNoYXJ0LmNvbmYuYXV0b1VwZGF0ZSB8fCAxO1xuXG4gICAgICAgICAgICBkYXRhQWRhcHRlckNvbmYgPSB7XG4gICAgICAgICAgICAgICAgJ2RpbWVuc2lvbicgOiBjaGFydC5jb25mLmRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAnbWVhc3VyZScgOiBjaGFydC5jb25mLm1lYXN1cmUsXG4gICAgICAgICAgICAgICAgJ3Nlcmllc1R5cGUnIDogY2hhcnQuY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgICAgICdjYXRlZ29yaWVzJyA6IGNoYXJ0LmNvbmYuY2F0ZWdvcmllcyxcbiAgICAgICAgICAgICAgICAnYWdncmVnYXRlTW9kZScgOiBjaGFydC5jb25mLmFnZ3JlZ2F0aW9uLFxuICAgICAgICAgICAgICAgICdjb25maWcnIDogY2hhcnQuY29uZi5jb25maWdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNoYXJ0LmRhdGFBZGFwdGVyID0gZGF0YUFkYXB0ZXIoY29uZi5kYXRhU291cmNlLCBkYXRhQWRhcHRlckNvbmYsIGNvbmYuY2FsbGJhY2spO1xuXG4gICAgICAgICAgICBkYXRhU3RvcmUgPSBjaGFydC5kYXRhQWRhcHRlci5nZXREYXRhU3RvcmUoKTtcblxuICAgICAgICAgICAgZGF0YVN0b3JlICYmIGRhdGFTdG9yZS5hZGRFdmVudExpc3RlbmVyKCdtb2RlbFVwZGF0ZWQnLGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNoYXJ0LnVwZGF0ZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNyZWF0ZUNoYXJ0Q29uZiA9IHtcbiAgICAgICAgICAgICAgICAndHlwZScgOiBjaGFydC5jb25mLnR5cGUsXG4gICAgICAgICAgICAgICAgJ3dpZHRoJyA6IGNoYXJ0LmNvbmYud2lkdGggfHwgTUFYX1BFUkNFTlQsXG4gICAgICAgICAgICAgICAgJ2hlaWdodCcgOiBjaGFydC5jb25mLmhlaWdodCB8fCBNQVhfUEVSQ0VOVCxcbiAgICAgICAgICAgICAgICAnZGF0YVNvdXJjZScgOiBjaGFydC5kYXRhQWRhcHRlci5nZXRKU09OKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0SW5zdGFuY2UgPSBjaGFydC5fX2NyZWF0ZUNoYXJ0X18oY3JlYXRlQ2hhcnRDb25mKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHJvdG9DaGFydCA9IENoYXJ0LnByb3RvdHlwZTtcblxuICAgIFByb3RvQ2hhcnQuX19jcmVhdGVDaGFydF9fID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGNoYXJ0T2JqO1xuXG4gICAgICAgIC8vcmVuZGVyIEZDIFxuICAgICAgICBjaGFydE9iaiA9IG5ldyBGdXNpb25DaGFydHMoanNvbik7XG5cbiAgICAgICAgY2hhcnRPYmouYWRkRXZlbnRMaXN0ZW5lcigndHJlbmRSZWdpb25Sb2xsT3ZlcicsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICB2YXIgZGF0YU9iaiA9IGNoYXJ0Ll9fZ2V0Um93RGF0YV9fKGQuY2F0ZWdvcnlMYWJlbCk7XG4gICAgICAgICAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5yYWlzZUV2ZW50KCdob3ZlcmluJywge1xuICAgICAgICAgICAgICAgIGRhdGEgOiBkYXRhT2JqLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgOiBkLmNhdGVnb3J5TGFiZWxcbiAgICAgICAgICAgIH0sIGNoYXJ0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICBjaGFydE9iai5hZGRFdmVudExpc3RlbmVyKCd0cmVuZFJlZ2lvblJvbGxPdXQnLCBmdW5jdGlvbiAoZSwgZCkge1xuICAgICAgICAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5yYWlzZUV2ZW50KCdob3Zlcm91dCcsIHtcbiAgICAgICAgICAgICAgIGNhdGVnb3J5TGFiZWwgOiBkLmNhdGVnb3J5TGFiZWxcbiAgICAgICAgICAgfSwgY2hhcnQpO1xuICAgICAgIH0pO1xuXG5cbiAgICAgICAgcmV0dXJuIGNoYXJ0T2JqO1xuICAgIH07XG5cbiAgICBQcm90b0NoYXJ0LnVwZGF0ZSA9IGZ1bmN0aW9uKGNvbmYpe1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICAgICAgZGF0YUFkYXB0ZXJDb25mID0ge30sXG4gICAgICAgICAgICBjcmVhdGVDaGFydENvbmYgPSAge307XG5cbiAgICAgICAgY29uZiA9IGNvbmYgfHwge307XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihjaGFydC5jb25mLCBjb25mKTtcblxuICAgICAgICBkYXRhQWRhcHRlckNvbmYgPSB7XG4gICAgICAgICAgICAnZGltZW5zaW9uJyA6IGNoYXJ0LmNvbmYuZGltZW5zaW9uLFxuICAgICAgICAgICAgJ21lYXN1cmUnIDogY2hhcnQuY29uZi5tZWFzdXJlLFxuICAgICAgICAgICAgJ3Nlcmllc1R5cGUnIDogY2hhcnQuY29uZi5zZXJpZXNUeXBlLFxuICAgICAgICAgICAgJ2NhdGVnb3JpZXMnIDogY2hhcnQuY29uZi5jYXRlZ29yaWVzLFxuICAgICAgICAgICAgJ2FnZ3JlZ2F0ZU1vZGUnIDogY2hhcnQuY29uZi5hZ2dyZWdhdGlvbixcbiAgICAgICAgICAgICdjb25maWcnIDogY2hhcnQuY29uZi5jb25maWdcbiAgICAgICAgfTtcbiAgICAgICAgY2hhcnQuZGF0YUFkYXB0ZXIudXBkYXRlKGNvbmYuZGF0YVNvdXJjZSwgZGF0YUFkYXB0ZXJDb25mLCBjb25mLmNhbGxiYWNrKTtcblxuICAgICAgICBjcmVhdGVDaGFydENvbmYgPSB7XG4gICAgICAgICAgICAndHlwZScgOiBjaGFydC5jb25mLnR5cGUsXG4gICAgICAgICAgICAnd2lkdGgnIDogY2hhcnQuY29uZi53aWR0aCB8fCBNQVhfUEVSQ0VOVCxcbiAgICAgICAgICAgICdoZWlnaHQnIDogY2hhcnQuY29uZi5oZWlnaHQgfHwgTUFYX1BFUkNFTlQsXG4gICAgICAgICAgICAnZGF0YVNvdXJjZScgOiBjaGFydC5kYXRhQWRhcHRlci5nZXRKU09OKClcbiAgICAgICAgfTtcbiAgICAgICAgY2hhcnQuX19jaGFydFVwZGF0ZV9fKGNyZWF0ZUNoYXJ0Q29uZik7XG4gICAgICAgIHJldHVybiBjaGFydDtcbiAgICB9O1xuXG4gICAgUHJvdG9DaGFydC5nZXRDaGFydEluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoYXJ0SW5zdGFuY2U7XG4gICAgfTtcblxuICAgIFByb3RvQ2hhcnQucmVuZGVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgXHRjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cblx0XHRpZCAmJiBjaGFydC5jaGFydEluc3RhbmNlLnJlbmRlcihjaGFydC5fX2NoYXJ0Q29udGFpbmVyX18oY29udGFpbmVyKSk7XG4gICAgfTtcblxuXHRQcm90b0NoYXJ0Ll9fY2hhcnRDb250YWluZXJfXyA9IGZ1bmN0aW9uKGNvbnRhaW5lcikge1xuXHRcdHZhciBjaGFydCA9IHRoaXMsXG5cdFx0XHRpZCA9IGNoYXJ0Ll9faWRDcmVhdG9yX18oKTtcblxuXHRcdGNoYXJ0LmNvbnRhaW5lciA9IHt9O1xuXHRcdGNoYXJ0LmNvbnRhaW5lci5jb25maWcgPSB7fTtcblx0XHRjaGFydC5jb250YWluZXIuY29uZmlnLmlkID0gaWQ7XG5cdFx0Y2hhcnQuY29udGFpbmVyLmdyYXBoaWNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChTUEFOKTtcblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3MuaWQgPSBpZDtcblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3Muc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGNoYXJ0LmNvbnRhaW5lci5ncmFwaGljcyk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9O1xuXG5cdFByb3RvQ2hhcnQuZ2V0Q2hhcnRDb250YWluZXIgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jb250YWluZXI7XG5cdH07XG5cblx0UHJvdG9DaGFydC51cGRhdGVDaGFydENvbnRhaW5lciA9IGZ1bmN0aW9uKGNvbmZpZykge1xuXHRcdHZhciBjaGFydCA9IHRoaXM7XG5cblx0XHRjb25maWcgfHwgKGNvbmZpZyA9IHt9KTtcblx0XHRPYmplY3QuYXNzaWduKGNoYXJ0LmNvbnRhaW5lci5jb25maWcsIGNvbmZpZyk7XG5cblx0XHRjaGFydC5jb250YWluZXIuZ3JhcGhpY3MuaGVpZ2h0ID0gY2hhcnQuY29udGFpbmVyLmhlaWdodCArIFBYO1xuXHRcdGNoYXJ0LmNvbnRhaW5lci5ncmFwaGljcy53aWR0aCA9IGNoYXJ0LmNvbnRhaW5lci53aWR0aCArIFBYO1xuXHR9O1xuXG5cdFByb3RvQ2hhcnQuX19pZENyZWF0b3JfXyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNoYXJ0SWQrKzsgICAgICAgXG4gICAgICAgIHJldHVybiBJRCArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIFByb3RvQ2hhcnQuZ2V0TGltaXQgPSBmdW5jdGlvbigpe1xuICAgIFx0cmV0dXJuIHRoaXMuZGF0YUFkYXB0ZXIgJiYgdGhpcy5kYXRhQWRhcHRlci5nZXRMaW1pdCgpO1xuICAgIH07XG5cbiAgICBQcm90b0NoYXJ0Ll9fY2hhcnRVcGRhdGVfXyA9IGZ1bmN0aW9uKGpzb24pe1xuICAgICAgICB2YXIgY2hhcnQgPSB0aGlzLFxuICAgICAgICBjaGFydEpzb24gPSBqc29uIHx8IHt9O1xuXG4gICAgICAgIGlmKGNoYXJ0LmNoYXJ0SW5zdGFuY2UuY2hhcnRUeXBlKCkgIT0gY2hhcnRKc29uLnR5cGUpIHtcbiAgICAgICAgICAgIGNoYXJ0LmNoYXJ0SW5zdGFuY2UuY2hhcnRUeXBlKGNoYXJ0SnNvbi50eXBlKTtcbiAgICAgICAgfVxuICAgICAgICBjaGFydC5jaGFydEluc3RhbmNlLnNldEpTT05EYXRhKGNoYXJ0SnNvbi5kYXRhU291cmNlKTtcbiAgICAgfTtcblxuICAgIFByb3RvQ2hhcnQuX19nZXRSb3dEYXRhX18gPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAga2ssXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBkYXRhID0gY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0RGF0YUpzb24oKSxcbiAgICAgICAgICAgIGFnZ3JlZ2F0ZWREYXRhID0gY2hhcnQuZGF0YUFkYXB0ZXIuZ2V0QWdncmVnYXRlZERhdGEoKSxcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IGNoYXJ0LmRhdGFBZGFwdGVyLmdldERpbWVuc2lvbigpLFxuICAgICAgICAgICAgbWVhc3VyZSA9IGNoYXJ0LmRhdGFBZGFwdGVyLmdldE1lYXN1cmUoKSxcbiAgICAgICAgICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0pLFxuICAgICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIG1hdGNoT2JqID0ge30sXG4gICAgICAgICAgICBpbmRleE9mRGltZW5zaW9uID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihkaW1lbnNpb25bMF0pO1xuICAgIFxuICAgICAgICBmb3IobGVuUiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBpc0FycmF5ICYmIChpbmRleCA9IGRhdGFbaV0uaW5kZXhPZihrZXkpKTtcbiAgICAgICAgICAgIGlmKGluZGV4ICE9PSAtMSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yKGwgPSAwLCBsZW5DID0gZGF0YVtpXS5sZW5ndGg7IGwgPCBsZW5DOyBsKyspe1xuICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialtkYXRhWzBdW2xdXSA9IGRhdGFbaV1bbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcihqID0gMCwgbGVuID0gbWVhc3VyZS5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFnZ3JlZ2F0ZWREYXRhWzBdLmluZGV4T2YobWVhc3VyZVtqXSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDAsIGtrID0gYWdncmVnYXRlZERhdGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWdncmVnYXRlZERhdGFba11baW5kZXhPZkRpbWVuc2lvbl0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hPYmpbbWVhc3VyZVtqXV0gPSBhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighaXNBcnJheSAmJiBkYXRhW2ldW2RpbWVuc2lvblswXV0gPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hPYmogPSBkYXRhW2ldO1xuXG4gICAgICAgICAgICAgICAgZm9yKGogPSAwLCBsZW4gPSBtZWFzdXJlLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYWdncmVnYXRlZERhdGFbMF0uaW5kZXhPZihtZWFzdXJlW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMCwga2sgPSBhZ2dyZWdhdGVkRGF0YS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihhZ2dyZWdhdGVkRGF0YVtrXVtpbmRleE9mRGltZW5zaW9uXSA9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaE9ialttZWFzdXJlW2pdXSA9IGFnZ3JlZ2F0ZWREYXRhW2tdW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgUHJvdG9DaGFydC5oaWdobGlnaHQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICBcdHRoaXMuZGF0YUFkYXB0ZXIuaGlnaGxpZ2h0KGlkKTtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY2hhcnQgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhcnQoY29uZmlnKTtcbiAgICB9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG4gICAgdmFyIGRvY3VtZW50ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luLmRvY3VtZW50LFxuICAgICAgICBjaGFydEN0cmxyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY2hhcnQsXG4gICAgICAgIFBYID0gJ3B4JyxcbiAgICAgICAgRElWID0gJ2RpdicsXG4gICAgICAgIEVNUFRZX1NUUklORyA9ICcnLFxuICAgICAgICBBQlNPTFVURSA9ICdhYnNvbHV0ZScsXG4gICAgICAgIFJFTEFUSVZFID0gJ3JlbGF0aXZlJyxcbiAgICAgICAgSUQgPSAnaWQtZmMtbWMtJyxcbiAgICAgICAgQk9SREVSX0JPWCA9ICdib3JkZXItYm94JztcblxuICAgIHZhciBDZWxsID0gZnVuY3Rpb24gKGNvbmZpZywgY29udGFpbmVyKSB7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG5cbiAgICAgICAgICAgIGNlbGwuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgY2VsbC5jb25maWcgPSBjb25maWc7XG4gICAgICAgICAgICBjZWxsLl9fZHJhd19fKCk7XG4gICAgICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCAmJiBjZWxsLl9fcmVuZGVyQ2hhcnRfXygpO1xuICAgICAgICB9LFxuICAgICAgICBwcm90b0NlbGwgPSBDZWxsLnByb3RvdHlwZTtcblxuICAgIHByb3RvQ2VsbC5fX2RyYXdfXyA9IGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXM7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KERJVik7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuaWQgPSBjZWxsLmNvbmZpZy5pZCB8fCBFTVBUWV9TVFJJTkc7ICAgICAgICBcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5oZWlnaHQgPSBjZWxsLmNvbmZpZy5oZWlnaHQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS53aWR0aCA9IGNlbGwuY29uZmlnLndpZHRoICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUudG9wID0gY2VsbC5jb25maWcudG9wICsgUFg7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3Muc3R5bGUubGVmdCA9IGNlbGwuY29uZmlnLmxlZnQgKyBQWDtcbiAgICAgICAgY2VsbC5ncmFwaGljcy5zdHlsZS5wb3NpdGlvbiA9IEFCU09MVVRFO1xuICAgICAgICBjZWxsLmdyYXBoaWNzLnN0eWxlLmJveFNpemluZyA9IEJPUkRFUl9CT1g7XG4gICAgICAgIGNlbGwuZ3JhcGhpY3MuY2xhc3NOYW1lID0gY2VsbC5jb25maWcuY2xhc3NOYW1lO1xuICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCB8fCAoY2VsbC5ncmFwaGljcy5pbm5lckhUTUwgPSBjZWxsLmNvbmZpZy5odG1sIHx8IEVNUFRZX1NUUklORyk7XG4gICAgICAgIGNlbGwuY29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwuZ3JhcGhpY3MpO1xuICAgIH07XG5cbiAgICBwcm90b0NlbGwuX19yZW5kZXJDaGFydF9fID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2VsbCA9IHRoaXMsXG4gICAgICAgICAgICBjaGFydENvbnRhaW5lcixcbiAgICAgICAgICAgIGNvbmYgPSB7XG4gICAgICAgICAgICAgICAgJ2hlaWdodCcgOiBjZWxsLmNvbmZpZy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgJ3dpZHRoJyA6IGNlbGwuY29uZmlnLndpZHRoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzcG9zYWxCb3ggPSBjZWxsLmRpc3Bvc2FsQm94LFxuICAgICAgICAgICAgY2hhcnRDb25maWcsXG4gICAgICAgICAgICBpc1JlY3ljbGVkID0gZmFsc2U7XG5cbiAgICAgICAgY2VsbC5jb25maWcuY2hhcnQuaXNDaGFydCB8fCAoY2hhcnRDb25maWcgPSBjZWxsLmNvbmZpZy5jaGFydCk7XG4gICAgICAgIGlmKGNoYXJ0Q29uZmlnKSB7XG4gICAgICAgICAgICBpZihkaXNwb3NhbEJveCAmJiBkaXNwb3NhbEJveC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjZWxsLmNvbmZpZy5jaGFydDtcbiAgICAgICAgICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCA9IGRpc3Bvc2FsQm94LnBvcCgpO1xuICAgICAgICAgICAgICAgIGlzUmVjeWNsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjZWxsLmNvbmZpZy5jaGFydCA9IGNoYXJ0Q3RybHIoY2hhcnRDb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2hhcnRDb250YWluZXIgPSBjZWxsLmNvbmZpZy5jaGFydC5nZXRDaGFydENvbnRhaW5lcigpO1xuICAgICAgICBjaGFydENvbnRhaW5lciAmJiBjZWxsLmNvbmZpZy5jaGFydC51cGRhdGVDaGFydENvbnRhaW5lcihjb25mKTtcbiAgICAgICAgY2hhcnRDb250YWluZXIgJiYgKGNlbGwuZ3JhcGhpY3MuYXBwZW5kQ2hpbGQoY2hhcnRDb250YWluZXIuZ3JhcGhpY3MpKTtcbiAgICAgICAgY2hhcnRDb250YWluZXIgfHwgY2VsbC5jb25maWcuY2hhcnQucmVuZGVyKGNlbGwuY29uZmlnLmlkKTtcbiAgICAgICAgaXNSZWN5Y2xlZCAmJiBjZWxsLmNvbmZpZy5jaGFydC51cGRhdGUoY2hhcnRDb25maWcpO1xuICAgIH07XG5cbiAgICB2YXIgTWF0cml4ID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbWF0cml4ID0gdGhpcztcbiAgICAgICAgICAgIG1hdHJpeC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgLy9tYXRyaXggY29udGFpbmVyXG4gICAgICAgICAgICBtYXRyaXgubWF0cml4Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgbWF0cml4LmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgbWF0cml4LmRlZmF1bHRIID0gMTAwO1xuICAgICAgICAgICAgbWF0cml4LmRlZmF1bHRXID0gMTAwO1xuICAgICAgICAgICAgbWF0cml4LmRpc3Bvc2FsQm94ID0gW107XG4gICAgICAgICAgICAvL2Rpc3Bvc2UgbWF0cml4IGNvbnRleHRcbiAgICAgICAgICAgIG1hdHJpeC5kaXNwb3NlKCk7XG4gICAgICAgICAgICAvL3NldCBzdHlsZSwgYXR0ciBvbiBtYXRyaXggY29udGFpbmVyIFxuICAgICAgICAgICAgbWF0cml4Ll9fc2V0QXR0ckNvbnRhaW5lcl9fKCk7XG4gICAgICAgICAgICAvL3N0b3JlIHZpcnR1YWwgbWF0cml4IGZvciB1c2VyIGdpdmVuIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIG1hdHJpeC5jb25maWdNYW5hZ2VyID0gY29uZmlndXJhdGlvbiAmJiBtYXRyaXggJiYgbWF0cml4Ll9fZHJhd01hbmFnZXJfXyhjb25maWd1cmF0aW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvdG9NYXRyaXggPSBNYXRyaXgucHJvdG90eXBlLFxuICAgICAgICBjaGFydElkID0gMDtcblxuICAgIC8vZnVuY3Rpb24gdG8gc2V0IHN0eWxlLCBhdHRyIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5fX3NldEF0dHJDb250YWluZXJfXyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyOyAgICAgICAgXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFJFTEFUSVZFO1xuICAgIH07XG5cbiAgICAvL2Z1bmN0aW9uIHRvIHNldCBoZWlnaHQsIHdpZHRoIG9uIG1hdHJpeCBjb250YWluZXJcbiAgICBwcm90b01hdHJpeC5fX3NldENvbnRhaW5lclJlc29sdXRpb25fXyA9IGZ1bmN0aW9uIChoZWlnaHRBcnIsIHdpZHRoQXJyKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXIsXG4gICAgICAgICAgICBoZWlnaHQgPSAwLFxuICAgICAgICAgICAgd2lkdGggPSAwLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBoZWlnaHRBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBoZWlnaHRBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHdpZHRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB3aWR0aCArPSB3aWR0aEFycltpXTtcbiAgICAgICAgfVxuICAgICAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgUFg7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgUFg7ICAgICAgICBcbiAgICB9O1xuXG4gICAgLy9mdW5jdGlvbiB0byBkcmF3IG1hdHJpeFxuICAgIHByb3RvTWF0cml4LmRyYXcgPSBmdW5jdGlvbihjYWxsQmFjayl7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IG1hdHJpeC5jb25maWdNYW5hZ2VyLFxuICAgICAgICAgICAgbGVuID0gY29uZmlnTWFuYWdlciAmJiBjb25maWdNYW5hZ2VyLmxlbmd0aCxcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gW10sXG4gICAgICAgICAgICBwYXJlbnRDb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGxlbkMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgajtcbiAgICAgICAgXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwbGFjZUhvbGRlcltpXSA9IFtdO1xuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gY29uZmlnTWFuYWdlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspe1xuICAgICAgICAgICAgICAgIC8vc3RvcmUgY2VsbCBvYmplY3QgaW4gbG9naWNhbCBtYXRyaXggc3RydWN0dXJlXG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0gPSBuZXcgQ2VsbChjb25maWdNYW5hZ2VyW2ldW2pdLHBhcmVudENvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBbXTtcbiAgICAgICAgbWF0cml4LnBsYWNlSG9sZGVyID0gcGxhY2VIb2xkZXI7XG4gICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKCk7XG4gICAgfTtcblxuICAgIC8vZnVuY3Rpb24gdG8gbWFuYWdlIG1hdHJpeCBkcmF3XG4gICAgcHJvdG9NYXRyaXguX19kcmF3TWFuYWdlcl9fID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgLy9zdG9yZSBtYXBwaW5nIG1hdHJpeCBiYXNlZCBvbiB0aGUgdXNlciBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBzaGFkb3dNYXRyaXggPSBtYXRyaXguX19tYXRyaXhNYW5hZ2VyX18oY29uZmlndXJhdGlvbiksICAgICAgICAgICAgXG4gICAgICAgICAgICBoZWlnaHRBcnIgPSBtYXRyaXguX19nZXRSb3dIZWlnaHRfXyhzaGFkb3dNYXRyaXgpLFxuICAgICAgICAgICAgd2lkdGhBcnIgPSBtYXRyaXguX19nZXRDb2xXaWR0aF9fKHNoYWRvd01hdHJpeCksXG4gICAgICAgICAgICBkcmF3TWFuYWdlck9iakFyciA9IFtdLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIG1hdHJpeFBvc1ggPSBtYXRyaXguX19nZXRQb3NfXyh3aWR0aEFyciksXG4gICAgICAgICAgICBtYXRyaXhQb3NZID0gbWF0cml4Ll9fZ2V0UG9zX18oaGVpZ2h0QXJyKSxcbiAgICAgICAgICAgIHJvd3NwYW4sXG4gICAgICAgICAgICBjb2xzcGFuLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBjbGFzc05hbWUsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBjaGFydCxcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICByb3csXG4gICAgICAgICAgICBjb2w7XG4gICAgICAgIC8vY2FsY3VsYXRlIGFuZCBzZXQgcGxhY2Vob2xkZXIgaW4gc2hhZG93IG1hdHJpeFxuICAgICAgICBjb25maWd1cmF0aW9uID0gbWF0cml4Ll9fc2V0UGxjSGxkcl9fKHNoYWRvd01hdHJpeCwgY29uZmlndXJhdGlvbik7XG4gICAgICAgIC8vZnVuY3Rpb24gdG8gc2V0IGhlaWdodCwgd2lkdGggb24gbWF0cml4IGNvbnRhaW5lclxuICAgICAgICBtYXRyaXguX19zZXRDb250YWluZXJSZXNvbHV0aW9uX18oaGVpZ2h0QXJyLCB3aWR0aEFycik7XG4gICAgICAgIC8vY2FsY3VsYXRlIGNlbGwgcG9zaXRpb24gYW5kIGhlaWh0IGFuZCBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICBcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyW2ldID0gW107ICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuIHx8IDEpO1xuICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbiB8fCAxKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2hhcnQ7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5odG1sO1xuICAgICAgICAgICAgICAgIHJvdyA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0ucm93KTtcbiAgICAgICAgICAgICAgICBjb2wgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLmNvbCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG1hdHJpeFBvc1hbY29sXTtcbiAgICAgICAgICAgICAgICB0b3AgPSBtYXRyaXhQb3NZW3Jvd107XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYW2NvbCArIGNvbHNwYW5dIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXRyaXhQb3NZW3JvdyArIHJvd3NwYW5dIC0gdG9wO1xuICAgICAgICAgICAgICAgIGlkID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5pZCkgfHwgbWF0cml4Ll9faWRDcmVhdG9yX18ocm93LGNvbCk7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLmNsYXNzTmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBkcmF3TWFuYWdlck9iakFycltpXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wICAgICAgIDogdG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgOiBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgICAgOiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICAgICA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICAgICA6IGlkLFxuICAgICAgICAgICAgICAgICAgICByb3dzcGFuICAgOiByb3dzcGFuLFxuICAgICAgICAgICAgICAgICAgICBjb2xzcGFuICAgOiBjb2xzcGFuLFxuICAgICAgICAgICAgICAgICAgICBodG1sICAgICAgOiBodG1sLFxuICAgICAgICAgICAgICAgICAgICBjaGFydCAgICAgOiBjaGFydFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyYXdNYW5hZ2VyT2JqQXJyO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5fX2lkQ3JlYXRvcl9fID0gZnVuY3Rpb24oKXtcbiAgICAgICAgY2hhcnRJZCsrOyAgICAgICBcbiAgICAgICAgcmV0dXJuIElEICsgY2hhcnRJZDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19nZXRQb3NfXyA9ICBmdW5jdGlvbihzcmMpe1xuICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHNyYyAmJiBzcmMubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPD0gbGVuOyBpKyspe1xuICAgICAgICAgICAgYXJyLnB1c2goaSA/IChzcmNbaS0xXSthcnJbaS0xXSkgOiAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Ll9fc2V0UGxjSGxkcl9fID0gZnVuY3Rpb24oc2hhZG93TWF0cml4LCBjb25maWd1cmF0aW9uKXtcbiAgICAgICAgdmFyIHJvdyxcbiAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkM7XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gc2hhZG93TWF0cml4Lmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7IFxuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gc2hhZG93TWF0cml4W2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgcm93ID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgY29sID0gc2hhZG93TWF0cml4W2ldW2pdLmlkLnNwbGl0KCctJylbMV07XG5cbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPT09IHVuZGVmaW5lZCA/IGkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0ucm93O1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9IGNvbmZpZ3VyYXRpb25bcm93XVtjb2xdLmNvbCA9PT0gdW5kZWZpbmVkID8gaiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5jb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb247XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Ll9fZ2V0Um93SGVpZ2h0X18gPSBmdW5jdGlvbihzaGFkb3dNYXRyaXgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgaGVpZ2h0ID0gW10sXG4gICAgICAgICAgICBjdXJySGVpZ2h0LFxuICAgICAgICAgICAgZGVmYXVsdEggPSBtYXRyaXguZGVmYXVsdEgsXG4gICAgICAgICAgICBtYXhIZWlnaHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heEhlaWdodCA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtpXS5sZW5ndGg7IGogPCBsZW5Db2w7IGorKykge1xuICAgICAgICAgICAgICAgIGlmKHNoYWRvd01hdHJpeFtpXVtqXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJySGVpZ2h0ID0gc2hhZG93TWF0cml4W2ldW2pdLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gbWF4SGVpZ2h0IDwgY3VyckhlaWdodCA/IGN1cnJIZWlnaHQgOiBtYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGVpZ2h0W2ldID0gbWF4SGVpZ2h0IHx8IGRlZmF1bHRIO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19nZXRDb2xXaWR0aF9fID0gZnVuY3Rpb24oc2hhZG93TWF0cml4KSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgIGxlblJvdyA9IHNoYWRvd01hdHJpeCAmJiBzaGFkb3dNYXRyaXgubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ29sLFxuICAgICAgICAgICAgd2lkdGggPSBbXSxcbiAgICAgICAgICAgIGN1cnJXaWR0aCxcbiAgICAgICAgICAgIGRlZmF1bHRXID0gbWF0cml4LmRlZmF1bHRXLFxuICAgICAgICAgICAgbWF4V2lkdGg7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbkNvbCA9IHNoYWRvd01hdHJpeFtqXS5sZW5ndGg7IGkgPCBsZW5Db2w7IGkrKyl7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heFdpZHRoID0gMDsgaiA8IGxlblJvdzsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYWRvd01hdHJpeFtqXVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBzaGFkb3dNYXRyaXhbal1baV0ud2lkdGg7ICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSBtYXhXaWR0aCA8IGN1cnJXaWR0aCA/IGN1cnJXaWR0aCA6IG1heFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpZHRoW2ldID0gbWF4V2lkdGggfHwgZGVmYXVsdFc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4Ll9fbWF0cml4TWFuYWdlcl9fID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIHNoYWRvd01hdHJpeCA9IFtdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQ2VsbCxcbiAgICAgICAgICAgIHJvd1NwYW4sXG4gICAgICAgICAgICBjb2xTcGFuLFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICBvZmZzZXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7ICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DZWxsID0gY29uZmlndXJhdGlvbltpXS5sZW5ndGg7IGogPCBsZW5DZWxsOyBqKyspIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJvd1NwYW4gPSAoY29uZmlndXJhdGlvbltpXVtqXSAmJiBjb25maWd1cmF0aW9uW2ldW2pdLnJvd3NwYW4pIHx8IDE7XG4gICAgICAgICAgICAgICAgY29sU3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbikgfHwgMTsgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aWR0aCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ud2lkdGgpO1xuICAgICAgICAgICAgICAgIHdpZHRoID0gKHdpZHRoICYmICh3aWR0aCAvIGNvbFNwYW4pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgd2lkdGggPSB3aWR0aCAmJiArd2lkdGgudG9GaXhlZCgyKTtcblxuICAgICAgICAgICAgICAgIGhlaWdodCA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAoaGVpZ2h0ICYmIChoZWlnaHQgLyByb3dTcGFuKSkgfHwgdW5kZWZpbmVkOyAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBoZWlnaHQgJiYgK2hlaWdodC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMCwgb2Zmc2V0ID0gMDsgayA8IHJvd1NwYW47IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGwgPSAwOyBsIDwgY29sU3BhbjsgbCsrKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd01hdHJpeFtpICsga10gPSBzaGFkb3dNYXRyaXhbaSArIGtdID8gc2hhZG93TWF0cml4W2kgKyBrXSA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gaiArIGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKHNoYWRvd01hdHJpeFtpICsga11bb2Zmc2V0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFkb3dNYXRyaXhbaSArIGtdW29mZnNldF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgOiAoaSArICctJyArIGopLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoIDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNoYWRvd01hdHJpeDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguX19nZXRCbG9ja19fICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5SID0gcGxhY2VIb2xkZXIubGVuZ3RoLFxuICAgICAgICAgICAgbGVuQztcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIGxlbkMgPSBwbGFjZUhvbGRlcltpXS5sZW5ndGg7IGogPCBsZW5DOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwbGFjZUhvbGRlcltpXVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXgudXBkYXRlID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyID0gbWF0cml4ICYmIG1hdHJpeC5wbGFjZUhvbGRlcixcbiAgICAgICAgICAgIGRpc3Bvc2FsQm94ID0gW10sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgajtcblxuICAgICAgICB3aGlsZShjb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoY29udGFpbmVyLmxhc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gcGxhY2VIb2xkZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGZvciAoaiA9IHBsYWNlSG9sZGVyW2ldLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY29uZmlnICYmIHBsYWNlSG9sZGVyW2ldW2pdLmNvbmZpZy5jaGFydCAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGRpc3Bvc2FsQm94LnB1c2gocGxhY2VIb2xkZXJbaV1bal0uY29uZmlnLmNoYXJ0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcHJvdG9DZWxsLmRpc3Bvc2FsQm94ID0gZGlzcG9zYWxCb3g7XG4gICAgICAgIG1hdHJpeC5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbiB8fCBtYXRyaXguY29uZmlndXJhdGlvbjtcbiAgICAgICAgbWF0cml4LmNvbmZpZ01hbmFnZXIgPSBtYXRyaXguX19kcmF3TWFuYWdlcl9fKG1hdHJpeC5jb25maWd1cmF0aW9uKTtcbiAgICAgICAgbWF0cml4LmRyYXcoKTtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBub2RlICA9IG1hdHJpeCAmJiBtYXRyaXgubWF0cml4Q29udGFpbmVyLFxuICAgICAgICAgICAgcGxhY2VIb2xkZXIgPSBtYXRyaXggJiYgbWF0cml4LnBsYWNlSG9sZGVyLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBsZW5DLFxuICAgICAgICAgICAgbGVuUjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gcGxhY2VIb2xkZXIgJiYgcGxhY2VIb2xkZXIubGVuZ3RoOyBpIDwgbGVuUjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5DID0gcGxhY2VIb2xkZXJbaV0gJiYgcGxhY2VIb2xkZXJbaV0ubGVuZ3RoOyBqIDwgbGVuQzsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQgJiYgcGxhY2VIb2xkZXJbaV1bal0uY2hhcnQuY2hhcnRPYmogJiYgXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldW2pdLmNoYXJ0LmNoYXJ0T2JqLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5sYXN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG4gICAgICAgIG5vZGUuc3R5bGUud2lkdGggPSAnMHB4JztcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY3JlYXRlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhcmd1bWVudHNbMF0sYXJndW1lbnRzWzFdKTtcbiAgICB9O1xufSk7IiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcbiAgICBcbiAgICAvKiBnbG9iYWwgRnVzaW9uQ2hhcnRzOiB0cnVlICovXG4gICAgdmFyIGdsb2JhbCA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLFxuICAgICAgICB3aW4gPSBnbG9iYWwud2luLFxuXG4gICAgICAgIG9iamVjdFByb3RvVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBhcnJheVRvU3RyaW5nSWRlbnRpZmllciA9IG9iamVjdFByb3RvVG9TdHJpbmcuY2FsbChbXSksXG4gICAgICAgIGlzQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0UHJvdG9Ub1N0cmluZy5jYWxsKG9iaikgPT09IGFycmF5VG9TdHJpbmdJZGVudGlmaWVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEEgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGFic3RyYWN0aW9uIGxheWVyIHNvIHRoYXQgdGhlIHRyeS1jYXRjaCAvXG4gICAgICAgIC8vIGVycm9yIHN1cHByZXNzaW9uIG9mIGZsYXNoIGNhbiBiZSBhdm9pZGVkIHdoaWxlIHJhaXNpbmcgZXZlbnRzLlxuICAgICAgICBtYW5hZ2VkRm5DYWxsID0gZnVuY3Rpb24gKGl0ZW0sIHNjb3BlLCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gV2UgY2hhbmdlIHRoZSBzY29wZSBvZiB0aGUgZnVuY3Rpb24gd2l0aCByZXNwZWN0IHRvIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IHRoYXQgcmFpc2VkIHRoZSBldmVudC5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXRlbVswXS5jYWxsKHNjb3BlLCBldmVudCwgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbGwgZXJyb3IgaW4gYSBzZXBhcmF0ZSB0aHJlYWQgdG8gYXZvaWQgc3RvcHBpbmdcbiAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgYWxsIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBpbnZva2VkIHVwb24gdHJpZ2dlclxuICAgICAgICAvLyBvZiBhbiBldmVudC5cbiAgICAgICAgc2xvdExvYWRlciA9IGZ1bmN0aW9uIChzbG90LCBldmVudCwgYXJncykge1xuICAgICAgICAgICAgLy8gSWYgc2xvdCBkb2VzIG5vdCBoYXZlIGEgcXVldWUsIHdlIGFzc3VtZSB0aGF0IHRoZSBsaXN0ZW5lclxuICAgICAgICAgICAgLy8gd2FzIG5ldmVyIGFkZGVkIGFuZCBoYWx0IG1ldGhvZC5cbiAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGF0dXRvcnkgVzNDIE5PVCBwcmV2ZW50RGVmYXVsdCBmbGFnXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZhcmlhYmxlcy5cbiAgICAgICAgICAgIHZhciBpID0gMCwgc2NvcGU7XG5cbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgbG9vayBmb3IgbWF0Y2ggd2l0aCByZXNwZWN0IHRvXG4gICAgICAgICAgICAvLyB0eXBlIGFuZCBiaW5kaW5nLlxuICAgICAgICAgICAgZm9yICg7IGkgPCBzbG90Lmxlbmd0aDsgaSArPSAxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoIGZvdW5kIHcuci50LiB0eXBlIGFuZCBiaW5kLCB3ZSBmaXJlIGl0LlxuICAgICAgICAgICAgICAgIGlmIChzbG90W2ldWzFdID09PSBldmVudC5zZW5kZXIgfHwgc2xvdFtpXVsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBzZW5kZXIgb2YgdGhlIGV2ZW50IGZvciBnbG9iYWwgZXZlbnRzLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlIG9mIHNjb3BlIGRpZmZlcmVzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2xvYmFsIG9yIGEgbG9jYWwgZXZlbnQgaXMgYmVpbmcgcmFpc2VkLlxuICAgICAgICAgICAgICAgICAgICBzY29wZSA9IHNsb3RbaV1bMV0gPT09IGV2ZW50LnNlbmRlciA/XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zZW5kZXIgOiBnbG9iYWw7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlZEZuQ2FsbChzbG90W2ldLCBzY29wZSwgZXZlbnQsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIHdhbnRlZCB0byBkZXRhY2ggdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kZXRhY2hlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5kZXRhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciBwcm9wYWdhdGlvbiBmbGFnIGlzIHNldCB0byBmYWxzZSBhbmQgZGlzY29udG51ZVxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpZiBuZWVkZWQuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNhbmNlbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXZlbnRNYXAgPSB7XG4gICAgICAgICAgICBob3ZlcmluIDogJ3RyZW5kUmVnaW9uUm9sbE92ZXInLFxuICAgICAgICAgICAgaG92ZXJvdXQgOiAndHJlbmRSZWdpb25Sb2xsT3V0JyxcbiAgICAgICAgICAgIGNsaWsgOiAnZGF0YXBsb3RjbGljaydcbiAgICAgICAgfSxcbiAgICAgICAgcmFpc2VFdmVudCxcblxuICAgICAgICBFdmVudFRhcmdldCA9IHtcblxuICAgICAgICAgICAgdW5wcm9wYWdhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmNhbmNlbGxlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXRhY2hlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5kZXRhY2hlZCA9IHRydWUpID09PSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRlZmF1bHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5wcmV2ZW50ZWQgPSB0cnVlKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpcmUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMuXG4gICAgICAgICAgICBsaXN0ZW5lcnM6IHt9LFxuXG4gICAgICAgICAgICAvLyBUaGUgbGFzdCByYWlzZWQgZXZlbnQgaWQuIEFsbG93cyB0byBjYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgaWQuXG4gICAgICAgICAgICBsYXN0RXZlbnRJZDogMCxcblxuICAgICAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlY3Vyc2VSZXR1cm4sXG4gICAgICAgICAgICAgICAgICAgIEZDRXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBpO1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdHlwZSBpcyBzZW50IGFzIGFycmF5LCB3ZSByZWN1cnNlIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZVJldHVybiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBsb29rIGludG8gZWFjaCBpdGVtIG9mIHRoZSAndHlwZScgcGFyYW1ldGVyIGFuZCBzZW5kIGl0LFxuICAgICAgICAgICAgICAgICAgICAvLyBhbG9uZyB3aXRoIG90aGVyIHBhcmFtZXRlcnMgdG8gYSByZWN1cnNlZCBhZGRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNlUmV0dXJuLnB1c2goRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZVtpXSwgbGlzdGVuZXIsIGJpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZVJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgdHlwZSBwYXJhbWV0ZXIuIExpc3RlbmVyIGNhbm5vdCBiZSBhZGRlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBoYXMgbm90IGJlZW4gcHJvdmlkZWQgd2hpbGUgYWRkaW5nIGFuIGV2ZW50IGxpc3RlbmVyLiBFbnN1cmUgdGhhdCB5b3UgcGFzcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIGBzdHJpbmdgIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgb2Yge0BsaW5rIEZ1c2lvbkNoYXJ0cy5hZGRFdmVudExpc3RlbmVyfS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NDlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NDknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5hZGRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEl0IHdpbGwgbm90IGV2YWwgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IGxpc3RlbmVyIHBhc3NlZCB0byB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG5lZWRzIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTUwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTUwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQuYWRkTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgaW5zZXJ0aW9uIHBvc2l0aW9uIGRvZXMgbm90IGhhdmUgYSBxdWV1ZSwgdGhlbiBjcmVhdGUgb25lLlxuICAgICAgICAgICAgICAgIGlmICghKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICBFdmVudFRhcmdldC5saXN0ZW5lcnNbdHlwZV0ucHVzaChbbGlzdGVuZXIsIGJpbmRdKTtcblxuICAgICAgICAgICAgICAgIC8vIEV2ZW50cyBvZiBmdXNpb25DaGFydCByYWlzZWQgdmlhIE11bHRpQ2hhcnRpbmcuXG4gICAgICAgICAgICAgICAgaWYgKEZDRXZlbnRUeXBlID0gZXZlbnRNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXIoRkNFdmVudFR5cGUsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0V2ZW50T2JqIDogZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQ0RhdGFPYmogOiBkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBNdWx0aUNoYXJ0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNsb3QsXG4gICAgICAgICAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgICAgICAvLyBMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uIEVsc2Ugd2UgaGF2ZSBub3RoaW5nIHRvIHJlbW92ZSFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbGlzdGVuZXIgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICogT3RoZXJ3aXNlLCB0aGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24gaGFzIG5vIHdheSB0byBrbm93IHdoaWNoIGZ1bmN0aW9uIGlzIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNTYwXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihiaW5kIHx8IGdsb2JhbCwgJzAzMDkxNTYwJywgJ3BhcmFtJywgJzo6RXZlbnRUYXJnZXQucmVtb3ZlTGlzdGVuZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IExpc3RlbmVyJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0eXBlIGlzIHNlbnQgYXMgYXJyYXksIHdlIHJlY3Vyc2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGxvb2sgaW50byBlYWNoIGl0ZW0gb2YgdGhlICd0eXBlJyBwYXJhbWV0ZXIgYW5kIHNlbmQgaXQsXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsb25nIHdpdGggb3RoZXIgcGFyYW1ldGVycyB0byBhIHJlY3Vyc2VkIGFkZExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGVbaV0sIGxpc3RlbmVyLCBiaW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIHR5cGUgcGFyYW1ldGVyLiBMaXN0ZW5lciBjYW5ub3QgYmUgcmVtb3ZlZCB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gdmFsaWQgdHlwZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBUaGUgZXZlbnQgbmFtZSBwYXNzZWQgdG8ge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfSBuZWVkcyB0byBiZSBhIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQHR5cGVkZWYge1BhcmFtZXRlckV4Y2VwdGlvbn0gRXJyb3ItMDMwOTE1NTlcbiAgICAgICAgICAgICAgICAgICAgICogQG1lbWJlck9mIEZ1c2lvbkNoYXJ0cy5kZWJ1Z2dlclxuICAgICAgICAgICAgICAgICAgICAgKiBAZ3JvdXAgZGVidWdnZXItZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5yYWlzZUVycm9yKGJpbmQgfHwgZ2xvYmFsLCAnMDMwOTE1NTknLCAncGFyYW0nLCAnOjpFdmVudFRhcmdldC5yZW1vdmVMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ1Vuc3BlY2lmaWVkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXNlbnNpdGl6ZSB0aGUgdHlwZSBjYXNlIGZvciB1c2VyIGFjY2Vzc2FiaWxpdHkuXG4gICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xvdCBmb3IgZWFzeSBsb29rdXAgaW4gdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgc2xvdCA9IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHNsb3QgZG9lcyBub3QgaGF2ZSBhIHF1ZXVlLCB3ZSBhc3N1bWUgdGhhdCB0aGUgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyB3YXMgbmV2ZXIgYWRkZWQgYW5kIGhhbHQgbWV0aG9kLlxuICAgICAgICAgICAgICAgIGlmICghKHNsb3QgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgc2xvdCBhbmQgcmVtb3ZlIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNsb3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIGxpc3RlbmVyIGZvdW5kIGluIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3RbaV1bMF0gPT09IGxpc3RlbmVyICYmIHNsb3RbaV1bMV0gPT09IGJpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gb3B0cyBjYW4gaGF2ZSB7IGFzeW5jOnRydWUsIG9tbmk6dHJ1ZSB9XG4gICAgICAgICAgICB0cmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBzZW5kZXIsIGFyZ3MsIGV2ZW50U2NvcGUsIGRlZmF1bHRGbiwgY2FuY2VsRm4pIHtcblxuICAgICAgICAgICAgICAgIC8vIEluIGNhc2UsIGV2ZW50IHR5cGUgaXMgbWlzc2luZywgZGlzcGF0Y2ggY2Fubm90IHByb2NlZWQuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVGhlIGV2ZW50IG5hbWUgcGFzc2VkIHRvIHtAbGluayBGdXNpb25DaGFydHMucmVtb3ZlRXZlbnRMaXN0ZW5lcn0gbmVlZHMgdG8gYmUgYSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICAgICAqIEB0eXBlZGVmIHtQYXJhbWV0ZXJFeGNlcHRpb259IEVycm9yLTAzMDkxNjAyXG4gICAgICAgICAgICAgICAgICAgICAqIEBtZW1iZXJPZiBGdXNpb25DaGFydHMuZGVidWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICogQGdyb3VwIGRlYnVnZ2VyLWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWwucmFpc2VFcnJvcihzZW5kZXIsICcwMzA5MTYwMicsICdwYXJhbScsICc6OkV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCdJbnZhbGlkIEV2ZW50IFR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRGVzZW5zaXRpemUgdGhlIHR5cGUgY2FzZSBmb3IgdXNlciBhY2Nlc3NhYmlsaXR5LlxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNb2RlbCB0aGUgZXZlbnQgYXMgcGVyIFczQyBzdGFuZGFyZHMuIEFkZCB0aGUgZnVuY3Rpb24gdG8gY2FuY2VsXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgcHJvcGFnYXRpb24gYnkgdXNlciBoYW5kbGVycy4gQWxzbyBhcHBlbmQgYW4gaW5jcmVtZW50YWxcbiAgICAgICAgICAgICAgICAvLyBldmVudCBpZC5cbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRPYmplY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRJZDogKEV2ZW50VGFyZ2V0Lmxhc3RFdmVudElkICs9IDEpLFxuICAgICAgICAgICAgICAgICAgICBzZW5kZXI6IHNlbmRlciB8fCBuZXcgRXJyb3IoJ09ycGhhbiBFdmVudCcpLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb246IHRoaXMudW5wcm9wYWdhdG9yLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdGhpcy51bmRlZmF1bHRlcixcbiAgICAgICAgICAgICAgICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkZXRhY2hIYW5kbGVyOiB0aGlzLmRldGFjaGVyXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZCB0byB0YXAgaW50byBkaWZmZXJlbnQgc3RhZ2VzIG9mIGNyZWF0aW5nLCB1cGRhdGluZywgcmVuZGVyaW5nIG9yIHJlbW92aW5nXG4gICAgICAgICAgICAgICAgICogY2hhcnRzLiBBIEZ1c2lvbkNoYXJ0cyBpbnN0YW5jZSBmaXJlcyBzcGVjaWZpYyBldmVudHMgYmFzZWQgb24gd2hhdCBzdGFnZSBpdCBpcyBpbi4gRm9yIGV4YW1wbGUsIHRoZVxuICAgICAgICAgICAgICAgICAqIGByZW5kZXJDb21wbGV0ZWAgZXZlbnQgaXMgZmlyZWQgZWFjaCB0aW1lIGEgY2hhcnQgaGFzIGZpbmlzaGVkIHJlbmRlcmluZy4gWW91IGNhbiBsaXN0ZW4gdG8gYW55IHN1Y2hcbiAgICAgICAgICAgICAgICAgKiBldmVudCB1c2luZyB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IG9yIHtAbGluayBGdXNpb25DaGFydHMjYWRkRXZlbnRMaXN0ZW5lcn0gYW5kIGJpbmRcbiAgICAgICAgICAgICAgICAgKiB5b3VyIG93biBmdW5jdGlvbnMgdG8gdGhhdCBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUga25vd24gYXMgXCJsaXN0ZW5lcnNcIiBhbmQgYXJlIHBhc3NlZCBvbiB0byB0aGUgc2Vjb25kIGFyZ3VtZW50IChgbGlzdGVuZXJgKSBvZiB0aGVcbiAgICAgICAgICAgICAgICAgKiB7QGxpbmsgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJ9IGFuZCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2FkZEV2ZW50TGlzdGVuZXJ9IGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBjYWxsYmFjayBGdXNpb25DaGFydHN+ZXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgICAgICAqIEBzZWUgRnVzaW9uQ2hhcnRzLmFkZEV2ZW50TGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRPYmplY3QgLSBUaGUgZmlyc3QgcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXMgYW4gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgICogdGhhdCBjb250YWlucyBhbGwgaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byBhIHBhcnRpY3VsYXIgZXZlbnQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRPYmplY3QudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBldmVudE9iamVjdC5ldmVudElkIC0gQSB1bmlxdWUgSUQgYXNzb2NpYXRlZCB3aXRoIHRoZSBldmVudC4gSW50ZXJuYWxseSBpdCBpcyBhblxuICAgICAgICAgICAgICAgICAqIGluY3JlbWVudGluZyBjb3VudGVyIGFuZCBhcyBzdWNoIGNhbiBiZSBpbmRpcmVjdGx5IHVzZWQgdG8gdmVyaWZ5IHRoZSBvcmRlciBpbiB3aGljaCAgdGhlIGV2ZW50IHdhc1xuICAgICAgICAgICAgICAgICAqIGZpcmVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtGdXNpb25DaGFydHN9IGV2ZW50T2JqZWN0LnNlbmRlciAtIFRoZSBpbnN0YW5jZSBvZiBGdXNpb25DaGFydHMgb2JqZWN0IHRoYXQgZmlyZWQgdGhpcyBldmVudC5cbiAgICAgICAgICAgICAgICAgKiBPY2Nhc3Npb25hbGx5LCBmb3IgZXZlbnRzIHRoYXQgYXJlIG5vdCBmaXJlZCBieSBpbmRpdmlkdWFsIGNoYXJ0cywgYnV0IGFyZSBmaXJlZCBieSB0aGUgZnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgICAqIHdpbGwgaGF2ZSB0aGUgZnJhbWV3b3JrIGFzIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmNhbmNlbGxlZCAtIFNob3dzIHdoZXRoZXIgYW4gIGV2ZW50J3MgcHJvcGFnYXRpb24gd2FzIGNhbmNlbGxlZCBvciBub3QuXG4gICAgICAgICAgICAgICAgICogSXQgaXMgc2V0IHRvIGB0cnVlYCB3aGVuIGAuc3RvcFByb3BhZ2F0aW9uKClgIGlzIGNhbGxlZC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50T2JqZWN0LnN0b3BQcm9wYWdhdGlvbiAtIENhbGwgdGhpcyBmdW5jdGlvbiBmcm9tIHdpdGhpbiBhIGxpc3RlbmVyIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBldmVudE9iamVjdC5wcmV2ZW50ZWQgLSBTaG93cyB3aGV0aGVyIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgICogcHJldmVudGVkLiBJdCBpcyBzZXQgdG8gYHRydWVgIHdoZW4gYC5wcmV2ZW50RGVmYXVsdCgpYCBpcyBjYWxsZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCAtIENhbGwgdGhpcyBmdW5jdGlvbiB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhblxuICAgICAgICAgICAgICAgICAqIGV2ZW50LiBGb3IgZXhhbXBsZSwgZm9yIHRoZSBldmVudCB7QGxpbmsgRnVzaW9uQ2hhcnRzI2V2ZW50OmJlZm9yZVJlc2l6ZX0sIGlmIHlvdSBkb1xuICAgICAgICAgICAgICAgICAqIGAucHJldmVudERlZmF1bHQoKWAsIHRoZSByZXNpemUgd2lsbCBuZXZlciB0YWtlIHBsYWNlIGFuZCBpbnN0ZWFkXG4gICAgICAgICAgICAgICAgICoge0BsaW5rIEZ1c2lvbkNoYXJ0cyNldmVudDpyZXNpemVDYW5jZWxsZWR9IHdpbGwgYmUgZmlyZWQuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV2ZW50T2JqZWN0LmRldGFjaGVkIC0gRGVub3RlcyB3aGV0aGVyIGEgbGlzdGVuZXIgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5vIGxvbmdlclxuICAgICAgICAgICAgICAgICAqIGdldHMgZXhlY3V0ZWQgZm9yIGFueSBzdWJzZXF1ZW50IGV2ZW50IG9mIHRoaXMgcGFydGljdWxhciBgdHlwZWAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudE9iamVjdC5kZXRhY2hIYW5kbGVyIC0gQWxsb3dzIHRoZSBsaXN0ZW5lciB0byByZW1vdmUgaXRzZWxmIHJhdGhlciB0aGFuIGJlaW5nXG4gICAgICAgICAgICAgICAgICogY2FsbGVkIGV4dGVybmFsbHkgYnkge0BsaW5rIEZ1c2lvbkNoYXJ0cy5yZW1vdmVFdmVudExpc3RlbmVyfS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3Igb25lLXRpbWUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiBsaXN0ZW5pbmcgb3IgZm9yIHNwZWNpYWwgc2l0dWF0aW9ucyB3aGVuIHRoZSBldmVudCBpcyBubyBsb25nZXIgcmVxdWlyZWQgdG8gYmUgbGlzdGVuZWQgd2hlbiB0aGVcbiAgICAgICAgICAgICAgICAgKiBldmVudCBoYXMgYmVlbiBmaXJlZCB3aXRoIGEgc3BlY2lmaWMgY29uZGl0aW9uLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50QXJncyAtIEV2ZXJ5IGV2ZW50IGhhcyBhbiBhcmd1bWVudCBvYmplY3QgYXMgc2Vjb25kIHBhcmFtZXRlciB0aGF0IGNvbnRhaW5zXG4gICAgICAgICAgICAgICAgICogaW5mb3JtYXRpb24gcmVsZXZhbnQgdG8gdGhhdCBwYXJ0aWN1bGFyIGV2ZW50LlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzW3R5cGVdLCBldmVudE9iamVjdCwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGYWNpbGl0YXRlIHRoZSBjYWxsIG9mIGEgZ2xvYmFsIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIHNsb3RMb2FkZXIoRXZlbnRUYXJnZXQubGlzdGVuZXJzWycqJ10sIGV2ZW50T2JqZWN0LCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50T2JqZWN0LnByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbmNlbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsRm4uY2FsbChldmVudFNjb3BlIHx8IHNlbmRlciB8fCB3aW4sIGV2ZW50T2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBlcnJvciBpbiBhIHNlcGFyYXRlIHRocmVhZCB0byBhdm9pZCBzdG9wcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBjaGFydCBsb2FkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGbi5jYWxsKGV2ZW50U2NvcGUgfHwgc2VuZGVyIHx8IHdpbiwgZXZlbnRPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGVycm9yIGluIGEgc2VwYXJhdGUgdGhyZWFkIHRvIGF2b2lkIHN0b3BwaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIGNoYXJ0IGxvYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3RhdHV0b3J5IFczQyBOT1QgcHJldmVudERlZmF1bHQgZmxhZ1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG9mIGV2ZW50cyB0aGF0IGhhcyBhbiBlcXVpdmFsZW50IGxlZ2FjeSBldmVudC4gVXNlZCBieSB0aGVcbiAgICAgICAgICogcmFpc2VFdmVudCBtZXRob2QgdG8gY2hlY2sgd2hldGhlciBhIHBhcnRpY3VsYXIgZXZlbnQgcmFpc2VkXG4gICAgICAgICAqIGhhcyBhbnkgY29ycmVzcG9uZGluZyBsZWdhY3kgZXZlbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgbGVnYWN5RXZlbnRMaXN0ID0gZ2xvYmFsLmxlZ2FjeUV2ZW50TGlzdCA9IHt9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWludGFpbnMgYSBsaXN0IG9mIHJlY2VudGx5IHJhaXNlZCBjb25kaXRpb25hbCBldmVudHNcbiAgICAgICAgICogQHR5cGUgb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBjb25kaXRpb25DaGVja3MgPSB7fTtcblxuICAgIC8vIEZhY2lsaXRhdGUgZm9yIHJhaXNpbmcgZXZlbnRzIGludGVybmFsbHkuXG4gICAgcmFpc2VFdmVudCA9IGdsb2JhbC5yYWlzZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSxcbiAgICAgICAgICAgIGRlZmF1bHRGbiwgY2FuY2VsbGVkRm4pIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnRyaWdnZXJFdmVudCh0eXBlLCBvYmosIGFyZ3MsIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmRpc3Bvc2VFdmVudHMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciB0eXBlLCBpO1xuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGV2ZW50cyBpbiB0aGUgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAgICAgICAgZm9yICh0eXBlIGluIEV2ZW50VGFyZ2V0Lmxpc3RlbmVycykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYSBtYXRjaCBpcyBmb3VuZCwgZGVsZXRlIHRoZSBsaXN0ZW5lciBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXVtpXVsxXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50VGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhbGxvd3MgdG8gdW5pZm9ybWx5IHJhaXNlIGV2ZW50cyBvZiBGdXNpb25DaGFydHNcbiAgICAgKiBGcmFtZXdvcmsuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHthcnJheX0gbGVnYWN5QXJncyBpcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIG9uXG4gICAgICogdG8gdGhlIGVxdWl2YWxlbnQgbGVnYWN5IGV2ZW50LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IHNvdXJjZVxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRGblxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbmNlbEZuXG4gICAgICpcbiAgICAgKiBAdHlwZSB1bmRlZmluZWRcbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudFdpdGhMZWdhY3kgPSBmdW5jdGlvbiAobmFtZSwgYXJncywgb2JqLCBsZWdhY3lBcmdzLFxuICAgICAgICAgICAgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbikge1xuICAgICAgICB2YXIgbGVnYWN5ID0gbGVnYWN5RXZlbnRMaXN0W25hbWVdO1xuICAgICAgICByYWlzZUV2ZW50KG5hbWUsIGFyZ3MsIG9iaiwgZXZlbnRTY29wZSwgZGVmYXVsdEZuLCBjYW5jZWxsZWRGbik7XG4gICAgICAgIGlmIChsZWdhY3kgJiYgdHlwZW9mIHdpbltsZWdhY3ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5bbGVnYWN5XS5hcHBseShldmVudFNjb3BlIHx8IHdpbiwgbGVnYWN5QXJncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGFsbG93cyBvbmUgdG8gcmFpc2UgcmVsYXRlZCBldmVudHMgdGhhdCBhcmUgZ3JvdXBlZCB0b2dldGhlciBhbmRcbiAgICAgKiByYWlzZWQgYnkgbXVsdGlwbGUgc291cmNlcy4gVXN1YWxseSB0aGlzIGlzIHVzZWQgd2hlcmUgYSBjb25ncmVnYXRpb25cbiAgICAgKiBvZiBzdWNjZXNzaXZlIGV2ZW50cyBuZWVkIHRvIGNhbmNlbCBvdXQgZWFjaCBvdGhlciBhbmQgYmVoYXZlIGxpa2UgYVxuICAgICAqIHVuaWZpZWQgZW50aXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoZWNrIGlzIHVzZWQgdG8gaWRlbnRpZnkgZXZlbnQgZ3JvdXBzLiBQcm92aWRlIHNhbWUgdmFsdWVcbiAgICAgKiBmb3IgYWxsIGV2ZW50cyB0aGF0IHlvdSB3YW50IHRvIGdyb3VwIHRvZ2V0aGVyIGZyb20gbXVsdGlwbGUgc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIHJhaXNlZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXJncyBhbGxvd3MgdG8gcHJvdmlkZSBhbiBhcmd1bWVudHMgb2JqZWN0IHRvIGJlXG4gICAgICogcGFzc2VkIG9uIHRvIHRoZSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICogQHBhcmFtIH0gb2JqIGlzIHRoZSBGdXNpb25DaGFydHMgaW5zdGFuY2Ugb2JqZWN0IG9uXG4gICAgICogYmVoYWxmIG9mIHdoaWNoIHRoZSBldmVudCB3b3VsZCBiZSByYWlzZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50U2NvcGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0Rm5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYW5jZWxsZWRGblxuICAgICAqXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICAgKi9cbiAgICBnbG9iYWwucmFpc2VFdmVudEdyb3VwID0gZnVuY3Rpb24gKGNoZWNrLCBuYW1lLCBhcmdzLCBvYmosIGV2ZW50U2NvcGUsXG4gICAgICAgICAgICBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKSB7XG4gICAgICAgIHZhciBpZCA9IG9iai5pZCxcbiAgICAgICAgICAgIGhhc2ggPSBjaGVjayArIGlkO1xuXG4gICAgICAgIGlmIChjb25kaXRpb25DaGVja3NbaGFzaF0pIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjb25kaXRpb25DaGVja3NbaGFzaF0pO1xuICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZCAmJiBoYXNoKSB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uQ2hlY2tzW2hhc2hdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbmRpdGlvbkNoZWNrc1toYXNoXTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhaXNlRXZlbnQobmFtZSwgYXJncywgb2JqLCBldmVudFNjb3BlLCBkZWZhdWx0Rm4sIGNhbmNlbGxlZEZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBFeHRlbmQgdGhlIGV2ZW50bGlzdGVuZXJzIHRvIGludGVybmFsIGdsb2JhbC5cbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgYmluZCkge1xuICAgICAgICByZXR1cm4gRXZlbnRUYXJnZXQuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGJpbmQpO1xuICAgIH07XG4gICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIGJpbmQpIHtcbiAgICAgICAgcmV0dXJuIEV2ZW50VGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBiaW5kKTtcbiAgICB9O1xufSk7Il19

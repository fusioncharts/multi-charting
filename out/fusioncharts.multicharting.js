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
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {
	
	MultiCharting.prototype.ajax = function () {
		return new Ajax(arguments[0]);
	}

	var Ajax = function () {
			var ajax = this,
				argument = arguments[0];

		    ajax.onSuccess = argument.success;
		    ajax.onError = argument.error;
		    ajax.open = false;
		    return ajax.get(argument.url);
		},

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
        },

        ajaxProto = Ajax.prototype,

        FUNCTION = 'function',
        MSXMLHTTP = 'Microsoft.XMLHTTP',
        MSXMLHTTP2 = 'Msxml2.XMLHTTP',
        GET = 'GET',
        POST = 'POST',
        XHREQERROR = 'XmlHttprequest Error',
        RUN = 'run',
        ERRNO = '1110111515A',
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
        XHRNative = (!AXObject || !fileProtocol) && win.XMLHttpRequest;


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
            try {
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
            }
            catch (error) {
                if (errorCallback) {
                    errorCallback(error, wrapper, url);
                }
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
    },

    ajaxProto.abort = function () {
        var instance = this,
            xmlhttp = instance.xmlhttp;

        instance.open = false;
        return xmlhttp && typeof xmlhttp.abort === FUNCTION && xmlhttp.readyState &&
                xmlhttp.readyState !== 0 && xmlhttp.abort();
    },

    ajaxProto.dispose = function () {
        var instance = this;
        instance.open && instance.abort();

        delete instance.onError;
        delete instance.onSuccess;
        delete instance.xmlhttp;
        delete instance.open;

        return (instance = null);
    }
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

    MultiCharting.prototype.convertToArray = function (data, delimiter, structure, callback) {
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
            finalOb = [],
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
                    //take min of header length and total columns
                    jlen = min(header.length, cell.length);

                    if(structure === 1){
                        finalOb.push(cell);
                    }
                    else if (structure === 2){
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

        structure = structure || 1;

        //if the value is empty
        if (splitedData[splitedData.length - 1] === '') {
            splitedData.splice((splitedData.length - 1), 1);
            len--;
        }
        if (structure === 1){
            finalOb = [];
            finalOb.push(header);
        } else if(structure === 2) {
            finalOb = [];
        }else if(structure === 3){
            finalOb = {};
            for (k = 0, klen = header.length; k < klen; ++k) {
                finalOb[header[k]] = [];
            }   
        }

        updateManager();

    };

});


(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.createDataStore = function () {
        return new DataStore(arguments);
    };

    var lib = MultiCharting.prototype.lib,
        dataStorage = lib.dataStorage = {},
        // For storing the child of a parent
        linkStore = {},
        //For storing the parent of a child
        parentStore = lib.parentStore = {},
        idCount = 0,
        // Constructor class for DataStore.
        DataStore = function () {
            var manager = this;
            manager.setData(arguments);
        },
        dataStoreProto = DataStore.prototype,

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
            var dataSource = dataSpecs.dataSource,
                dataType = dataSpecs.dataType,
                JSONData;

            switch(dataType) {
                case 'csv' : 
                    break;
                case 'json' : 
                default : JSONData = dataSource;
            };

            return JSONData;
        };

    // Function to add data in the data store
    dataStoreProto.setData = function () {
        var data = this,
            oldId = data.id,
            argument = arguments[0],
            id = argument.id,
            oldJSONData = dataStorage[oldId] || [],
            JSONData = parseData(argument);

        id = oldId || id || 'dataStorage' + idCount ++;
        dataStorage[id] = oldJSONData.concat(JSONData || []);

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
        return dataStorage[this.id];
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
                isFilterArray = filters instanceof Array,
                len = isFilterArray ? filters.length : 1;

            for (i = 0; i < len; i++) {
                filter = filters[i] || filters;
                filterFn = filter.getFilter();
                type = filter.type;

                if (typeof filterFn === 'function') {
                    newData = executeProcessor(type, filterFn, dataStorage[id]);

                    newDataObj = new DataStore(newData);
                    newId = newDataObj.id;
                    parentStore[newId] = data;

                    dataStorage[newId] = newData;
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

    // Function to delete the current data from the dataStorage and also all its childs recursively
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

        flag = delete dataStorage[id];
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

        dataStorage[id] = [];
        data.setData(arguments);
        dispatchEvent(new CustomEvent('dataModified', {'detail' : {
            'id': data.id
        }}));
    };

    // Function to add data to the dataStorage asynchronously via ajax
    dataStoreProto.setDataUrl = function () {
        var data = this,
            argument = arguments[0],
            dataSource = argument.dataSource,
            dataType = argument.dataType,
            callback = argument.callback,
            callbackArgs = argument.callbackArgs,
            JSONData;

        ajax = MultiCharting.prototype.ajax({
            url : dataSource,
            success : function(JSONString){
                JSONData = JSON.parse(JSONString);
                data.setData({
                    dataSource : JSONData
                });

                if (typeof callback === 'function') {
                    callback(callbackArgs);
                }
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
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.createDataProcessor = function () {
        return new DataProcessor(arguments);
    };

    var lib = MultiCharting.prototype.lib,
        filterStore = lib.filterStore = {},
        filterLink = lib.filterLink = {},
        filterIdCount = 0,
        dataStorage = lib.dataStorage,
        parentStore = lib.parentStore,
        
        // Constructor class for DataProcessor.
        DataProcessor = function () {
            var manager = this;
            manager.addRule(arguments);
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
            {   rule : arguments[0],
                type : 'filter'
            }
        );
    };

    dataProcessorProto.sort = function () {
        this.addRule(
            {   rule : arguments[0],
                type : 'sort'
            }
        );
    };

    dataProcessorProto.addInfo = function () {
        this.addRule(
            {   rule : arguments[0],
                type : 'addInfo'
            }
        );
    };

    dataProcessorProto.reExpress = function () {
        this.addRule(
            {   rule : arguments[0],
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

    var createChart = MultiCharting.prototype.createChart,
        Matrix = function (selector, configuration) {
            var matrix = this;
            matrix.selector = selector;
            matrix.matrixContainer = document.getElementById(selector);
            matrix.configuration = configuration;
            matrix.defaultH = 100;
            matrix.defaultW = 100;

            matrix.setAttrContainer();
        },
        chartId = 0;

    protoMatrix = Matrix.prototype;

    protoMatrix.setAttrContainer = function() {
        var matrix = this,
            container = matrix && matrix.matrixContainer;
        container.style.display = 'block';
        container.style.position = 'relative';        
    };

    protoMatrix.setContainerResolution = function (heightArr, widthArr) {
        var matrix = this,
            container = matrix && matrix.matrixContainer,
            height = 0,
            width = 0,
            i,
            j,
            len;
        for(i = 0, len = heightArr.length; i < len; i++) {
            height += heightArr[i];
        }

        for(i = 0, len = widthArr.length; i < len; i++) {
            width += widthArr[i];
        }

        container.style.height = height + 'px';
        container.style.width = width + 'px';
    };

    protoMatrix.draw = function(){
        var matrix = this,
            configuration = matrix && matrix.configuration || {},
            config = configuration.config,
            className = '',
            configManager = configuration && matrix && matrix.drawManager(configuration),
            len = configManager && configManager.length,
            placeHolder = [];
        
        for(i = 0; i < len; i++) {
            placeHolder[i] = matrix.drawCell({
                'height' : configManager[i].height,
                'width' : configManager[i].width,
                'top' : configManager[i].top,
                'left' : configManager[i].left,
                'id' : configManager[i].id,
                'html' : configManager[i].html,
                'chart' : configManager[i].chart
            });
            if(configManager[i].chart){
                configManager[i].chart.renderAt = configManager[i].id;
            }
            placeHolder[i].chart = (configManager[i].chart && createChart(configManager[i].chart)) || {};
        }
        matrix.placeHolder = [];
        matrix.placeHolder = placeHolder;
    };

    protoMatrix.drawCell = function(configuration, id, className) {
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
        cell.innerHTML = configuration.html || '';
        matrixContainer.appendChild(cell);

        return {
            config : {
                id : cell.id,
                height : cell.style.height,
                width : cell.style.width,
                top : cell.style.top,
                left : cell.style.left,
                html : configuration.html || '',
                chart : configuration.chart || {}
            },
            graphics : cell
        };
    };

    protoMatrix.drawManager = function (configuration) {
        var matrix = this,
            i,
            j,
            lenRow = configuration.length,
            mapArr = matrix.matrixManager(configuration),
            processedConfig = matrix.setPlcHldr(mapArr, configuration),
            heightArr = matrix.getRowHeight(mapArr),
            widthArr = matrix.getColWidth(mapArr),
            drawManagerObjArr = [],
            lenRow,
            lenCell,
            matrixPosX = matrix.getPos(widthArr),
            matrixPosY = matrix.getPos(heightArr),
            rowspan,
            colspan,
            id,
            top,
            left,
            height,
            width,
            chart,
            html;

        matrix.setContainerResolution(heightArr, widthArr);
        for (i = 0; i < lenRow; i++) {            
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
                drawManagerObjArr.push({
                    top : top,
                    left : left,
                    height : height,
                    width : width,
                    id : id,
                    html : html,
                    chart : chart
                });
            }
        }
       
        return drawManagerObjArr;
    };

    protoMatrix.idCreator = function(row, col){
        chartId++;
        return 'id-' + row + '-' + col + '-' + chartId;
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

    protoMatrix.setPlcHldr = function(mapArr, configuration){
        var matrix = this,
            row,
            col,
            i,
            j,
            lenR,
            lenC;

        for(i = 0, lenR = mapArr.length; i < lenR; i++){ 
            for(j = 0, lenC = mapArr[i].length; j < lenC; j++){
                row = mapArr[i][j].id.split('-')[0];
                col = mapArr[i][j].id.split('-')[1];

                configuration[row][col].row = configuration[row][col].row === undefined ? i : configuration[row][col].row;
                configuration[row][col].col = configuration[row][col].col === undefined ? j : configuration[row][col].col;
            }
        }
        return configuration;
    };

    protoMatrix.getRowHeight = function(mapArr) {
        var i,
            j,
            lenRow = mapArr && mapArr.length,
            lenCol,
            height = [],
            currHeight,
            maxHeight;
            
        for (i = 0; i < lenRow; i++) {
            for(j = 0, maxHeight = 0, lenCol = mapArr[i].length; j < lenCol; j++) {
                currHeight = mapArr[i][j].height;
                maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
            }
            height[i] = maxHeight;
        }

        return height;
    };

    protoMatrix.getColWidth = function(mapArr) {
        var i = 0,
            j = 0,
            lenRow = mapArr && mapArr.length,
            lenCol,
            width = [],
            currWidth,
            maxWidth;
        for (i = 0, lenCol = mapArr[j].length; i < lenCol; i++){
            for(j = 0, maxWidth = 0; j < lenRow; j++) {
                currWidth = mapArr[j][i].width;        
                maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
            }
            width[i] = maxWidth;
        }

        return width;
    };

    protoMatrix.matrixManager = function (configuration) {
        var matrix = this,
            mapArr = [],
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
                
                height = (configuration[i][j] && configuration[i][j].height);
                height = (height && (height / rowSpan)) || defaultH;                      
                for (k = 0, offset = 0; k < rowSpan; k++) {
                    for (l = 0; l < colSpan; l++) {
                        
                        mapArr[i + k] = mapArr[i + k] ? mapArr[i + k] : [];                        
                        offset = j + l;
                        
                        while(mapArr[i + k][offset]) {
                            offset++;
                        }
                        
                        mapArr[i + k][offset] = { 
                            id : (i + '-' + j),
                            width : width,
                            height : height
                        };
                    }
                }
            }
        }

        return mapArr;
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwibXVsdGljaGFydGluZy5saWIuanMiLCJtdWx0aWNoYXJ0aW5nLmFqYXguanMiLCJtdWx0aWNoYXJ0aW5nLmNzdi5qcyIsIm11bHRpY2hhcnRpbmcuZGF0YXN0b3JlLmpzIiwibXVsdGljaGFydGluZy5kYXRhcHJvY2Vzc29yLmpzIiwibXVsdGljaGFydGluZy5kYXRhYWRhcHRlci5qcyIsIm11bHRpY2hhcnRpbmcuY3JlYXRlY2hhcnQuanMiLCJtdWx0aWNoYXJ0aW5nLm1hdHJpeC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZ1c2lvbmNoYXJ0cy5tdWx0aWNoYXJ0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNdWx0aUNoYXJ0aW5nIEV4dGVuc2lvbiBmb3IgRnVzaW9uQ2hhcnRzXG4gKiBUaGlzIG1vZHVsZSBjb250YWlucyB0aGUgYmFzaWMgcm91dGluZXMgcmVxdWlyZWQgYnkgc3Vic2VxdWVudCBtb2R1bGVzIHRvXG4gKiBleHRlbmQvc2NhbGUgb3IgYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIE11bHRpQ2hhcnRpbmcgb2JqZWN0LlxuICpcbiAqL1xuXG4gLyogZ2xvYmFsIHdpbmRvdzogdHJ1ZSAqL1xuXG4oZnVuY3Rpb24gKGVudiwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGVudi5kb2N1bWVudCA/XG4gICAgICAgICAgICBmYWN0b3J5KGVudikgOiBmdW5jdGlvbih3aW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdpbi5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbmRvdyB3aXRoIGRvY3VtZW50IG5vdCBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KHdpbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5NdWx0aUNoYXJ0aW5nID0gZmFjdG9yeShlbnYsIHRydWUpO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKF93aW5kb3csIHdpbmRvd0V4aXN0cykge1xuICAgIC8vIEluIGNhc2UgTXVsdGlDaGFydGluZyBhbHJlYWR5IGV4aXN0cy5cbiAgICBpZiAoX3dpbmRvdy5NdWx0aUNoYXJ0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgTXVsdGlDaGFydGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUud2luID0gX3dpbmRvdztcblxuICAgIGlmICh3aW5kb3dFeGlzdHMpIHtcbiAgICAgICAgX3dpbmRvdy5NdWx0aUNoYXJ0aW5nID0gTXVsdGlDaGFydGluZztcbiAgICB9XG4gICAgcmV0dXJuIE11bHRpQ2hhcnRpbmc7XG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycikge1xuICAgICAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICAgICAgc3JjVmFsLFxuICAgICAgICAgICAgICAgIHRndFZhbCxcbiAgICAgICAgICAgICAgICBzdHIsXG4gICAgICAgICAgICAgICAgY1JlZixcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ckZuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgICAgICAgICBhcnJheVRvU3RyID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0ciA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgICAgICAgICAgIGNoZWNrQ3ljbGljUmVmID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRBcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBwYXJlbnRBcnIubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gLTE7XG5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiA9PT0gcGFyZW50QXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYkluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE9CSkVDVFNUUklORyA9ICdvYmplY3QnO1xuXG4gICAgICAgICAgICAvL2NoZWNrIHdoZXRoZXIgb2JqMiBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy9pZiBhcnJheSB0aGVuIGl0ZXJhdGUgdGhyb3VnaCBpdCdzIGluZGV4XG4gICAgICAgICAgICAvLyoqKiogTU9PVE9PTFMgcHJlY3V0aW9uXG5cbiAgICAgICAgICAgIGlmICghc3JjQXJyKSB7XG4gICAgICAgICAgICAgICAgdGd0QXJyID0gW29iajFdO1xuICAgICAgICAgICAgICAgIHNyY0FyciA9IFtvYmoyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRndEFyci5wdXNoKG9iajEpO1xuICAgICAgICAgICAgICAgIHNyY0Fyci5wdXNoKG9iajIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgZm9yIChpdGVtID0gMDsgaXRlbSA8IG9iajIubGVuZ3RoOyBpdGVtICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RWYWwgPSBvYmoyW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGd0VmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHNraXBVbmRlZiAmJiB0Z3RWYWwgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoxW2l0ZW1dID0gdGd0VmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3JjVmFsICE9PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gdGd0VmFsIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY1JlZiA9IGNoZWNrQ3ljbGljUmVmKHRndFZhbCwgc3JjQXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjUmVmICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGl0ZW0gaW4gb2JqMikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjVmFsID0gb2JqMVtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFZhbCA9IG9iajJbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRndFZhbCAhPT0gbnVsbCAmJiB0eXBlb2YgdGd0VmFsID09PSBPQkpFQ1RTVFJJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCBmb3IgaXNzdWUgQlVHOiBGV1hULTYwMlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUgPCA5IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChudWxsKSBnaXZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ1tvYmplY3QgT2JqZWN0XScgaW5zdGVhZCBvZiAnW29iamVjdCBOdWxsXSdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQncyB3aHkgbnVsbCB2YWx1ZSBiZWNvbWVzIE9iamVjdCBpbiBJRSA8IDlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IG9iamVjdFRvU3RyRm4uY2FsbCh0Z3RWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gb2JqZWN0VG9TdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVmFsID09PSBudWxsIHx8IHR5cGVvZiBzcmNWYWwgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyID09PSBhcnJheVRvU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyY1ZhbCA9PT0gbnVsbCB8fCAhKHNyY1ZhbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNWYWwgPSBvYmoxW2l0ZW1dID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNSZWYgPSBjaGVja0N5Y2xpY1JlZih0Z3RWYWwsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNSZWYgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1ZhbCA9IG9iajFbaXRlbV0gPSB0Z3RBcnJbY1JlZl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZShzcmNWYWwsIHRndFZhbCwgc2tpcFVuZGVmLCB0Z3RBcnIsIHNyY0Fycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqMVtpdGVtXSA9IHRndFZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iajFbaXRlbV0gPSB0Z3RWYWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2JqMTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0ZW5kMiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCBza2lwVW5kZWYpIHtcbiAgICAgICAgICAgIHZhciBPQkpFQ1RTVFJJTkcgPSAnb2JqZWN0JztcbiAgICAgICAgICAgIC8vaWYgbm9uZSBvZiB0aGUgYXJndW1lbnRzIGFyZSBvYmplY3QgdGhlbiByZXR1cm4gYmFja1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoxICE9PSBPQkpFQ1RTVFJJTkcgJiYgdHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iajIgIT09IE9CSkVDVFNUUklORyB8fCBvYmoyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqMSAhPT0gT0JKRUNUU1RSSU5HKSB7XG4gICAgICAgICAgICAgICAgb2JqMSA9IG9iajIgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZShvYmoxLCBvYmoyLCBza2lwVW5kZWYpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgICAgIH0sXG4gICAgICAgIGxpYiA9IHtcbiAgICAgICAgICAgIGV4dGVuZDI6IGV4dGVuZDIsXG4gICAgICAgICAgICBtZXJnZTogbWVyZ2VcbiAgICAgICAgfTtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIgPSAoTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliIHx8IGxpYik7XG5cbn0pOyIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblx0XG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmFqYXggPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBBamF4KGFyZ3VtZW50c1swXSk7XG5cdH1cblxuXHR2YXIgQWpheCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBhamF4ID0gdGhpcyxcblx0XHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF07XG5cblx0XHQgICAgYWpheC5vblN1Y2Nlc3MgPSBhcmd1bWVudC5zdWNjZXNzO1xuXHRcdCAgICBhamF4Lm9uRXJyb3IgPSBhcmd1bWVudC5lcnJvcjtcblx0XHQgICAgYWpheC5vcGVuID0gZmFsc2U7XG5cdFx0ICAgIHJldHVybiBhamF4LmdldChhcmd1bWVudC51cmwpO1xuXHRcdH0sXG5cblx0XHQvLyBQcmVwYXJlIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGNvbXBhdGlibGUgeG1saHR0cHJlcXVlc3QuXG4gICAgICAgIG5ld1htbEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHhtbGh0dHA7XG5cbiAgICAgICAgICAgIC8vIGlmIHhtbGh0dHByZXF1ZXN0IGlzIHByZXNlbnQgYXMgbmF0aXZlLCB1c2UgaXQuXG4gICAgICAgICAgICBpZiAoWEhSTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgWEhSTmF0aXZlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIGFjdGl2ZVggZm9yIElFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhtbGh0dHAgPSBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgbmV3WG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQMik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IG5ldyBBWE9iamVjdChNU1hNTEhUVFApO1xuICAgICAgICAgICAgICAgICAgICBuZXdYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQVhPYmplY3QoTVNYTUxIVFRQKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeG1saHR0cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFByZXZlbnRzIGNhY2hlaW5nIG9mIEFKQVggcmVxdWVzdHMuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnSWYtTW9kaWZpZWQtU2luY2UnOiAnU2F0LCAyOSBPY3QgMTk5NCAxOTo0MzozMSBHTVQnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHRoZSBzZXJ2ZXIga25vdyB0aGF0IHRoaXMgaXMgYW4gQUpBWCByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZXRzIHNlcnZlciBrbm93IHdoaWNoIHdlYiBhcHBsaWNhdGlvbiBpcyBzZW5kaW5nIHJlcXVlc3RzLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLUJ5JzogJ0Z1c2lvbkNoYXJ0cycsXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1lbnRpb25zIGNvbnRlbnQtdHlwZXMgdGhhdCBhcmUgYWNjZXB0YWJsZSBmb3IgdGhlIHJlc3BvbnNlLiBTb21lIHNlcnZlcnMgcmVxdWlyZSB0aGlzIGZvciBBamF4XG4gICAgICAgICAgICAgKiBjb21tdW5pY2F0aW9uLlxuICAgICAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ0FjY2VwdCc6ICd0ZXh0L3BsYWluLCAqLyonLFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgTUlNRSB0eXBlIG9mIHRoZSBib2R5IG9mIHRoZSByZXF1ZXN0IGFsb25nIHdpdGggaXRzIGNoYXJzZXQuXG4gICAgICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCdcbiAgICAgICAgfSxcblxuICAgICAgICBhamF4UHJvdG8gPSBBamF4LnByb3RvdHlwZSxcblxuICAgICAgICBGVU5DVElPTiA9ICdmdW5jdGlvbicsXG4gICAgICAgIE1TWE1MSFRUUCA9ICdNaWNyb3NvZnQuWE1MSFRUUCcsXG4gICAgICAgIE1TWE1MSFRUUDIgPSAnTXN4bWwyLlhNTEhUVFAnLFxuICAgICAgICBHRVQgPSAnR0VUJyxcbiAgICAgICAgUE9TVCA9ICdQT1NUJyxcbiAgICAgICAgWEhSRVFFUlJPUiA9ICdYbWxIdHRwcmVxdWVzdCBFcnJvcicsXG4gICAgICAgIFJVTiA9ICdydW4nLFxuICAgICAgICBFUlJOTyA9ICcxMTEwMTExNTE1QScsXG4gICAgICAgIHdpbiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLndpbiwgLy8ga2VlcCBhIGxvY2FsIHJlZmVyZW5jZSBvZiB3aW5kb3cgc2NvcGVcblxuICAgICAgICAvLyBQcm9iZSBJRSB2ZXJzaW9uXG4gICAgICAgIHZlcnNpb24gPSBwYXJzZUZsb2F0KHdpbi5uYXZpZ2F0b3IuYXBwVmVyc2lvbi5zcGxpdCgnTVNJRScpWzFdKSxcbiAgICAgICAgaWVsdDggPSAodmVyc2lvbiA+PSA1LjUgJiYgdmVyc2lvbiA8PSA3KSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgZmlyZWZveCA9IC9tb3ppbGxhL2kudGVzdCh3aW4ubmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENhbGN1bGF0ZSBmbGFncy5cbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgcGFnZSBpcyBvbiBmaWxlIHByb3RvY29sLlxuICAgICAgICBmaWxlUHJvdG9jb2wgPSB3aW4ubG9jYXRpb24ucHJvdG9jb2wgPT09ICdmaWxlOicsXG4gICAgICAgIEFYT2JqZWN0ID0gd2luLkFjdGl2ZVhPYmplY3QsXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgbmF0aXZlIHhociBpcyBwcmVzZW50XG4gICAgICAgIFhIUk5hdGl2ZSA9ICghQVhPYmplY3QgfHwgIWZpbGVQcm90b2NvbCkgJiYgd2luLlhNTEh0dHBSZXF1ZXN0O1xuXG5cbiAgICBhamF4UHJvdG8uZ2V0ID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB2YXIgd3JhcHBlciA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gd3JhcHBlci54bWxodHRwLFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjayA9IHdyYXBwZXIub25FcnJvcixcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayA9IHdyYXBwZXIub25TdWNjZXNzLFxuICAgICAgICAgICAgeFJlcXVlc3RlZEJ5ID0gJ1gtUmVxdWVzdGVkLUJ5JyxcbiAgICAgICAgICAgIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIC8vIFgtUmVxdWVzdGVkLUJ5IGlzIHJlbW92ZWQgZnJvbSBoZWFkZXIgZHVyaW5nIGNyb3NzIGRvbWFpbiBhamF4IGNhbGxcbiAgICAgICAgaWYgKHVybC5zZWFyY2goL14oaHR0cDpcXC9cXC98aHR0cHM6XFwvXFwvKS8pICE9PSAtMSAmJlxuICAgICAgICAgICAgICAgIHdpbi5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gLyhodHRwOlxcL1xcL3xodHRwczpcXC9cXC8pKFteXFwvXFw6XSopLy5leGVjKHVybClbMl0pIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB1cmwgZG9lcyBub3QgY29udGFpbiBodHRwIG9yIGh0dHBzLCB0aGVuIGl0cyBhIHNhbWUgZG9tYWluIGNhbGwuIE5vIG5lZWQgdG8gdXNlIHJlZ2V4IHRvIGdldFxuICAgICAgICAgICAgLy8gZG9tYWluLiBJZiBpdCBjb250YWlucyB0aGVuIGNoZWNrcyBkb21haW4uXG4gICAgICAgICAgICBkZWxldGUgaGVhZGVyc1t4UmVxdWVzdGVkQnldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgIWhhc093bi5jYWxsKGhlYWRlcnMsIHhSZXF1ZXN0ZWRCeSkgJiYgKGhlYWRlcnNbeFJlcXVlc3RlZEJ5XSA9ICdGdXNpb25DaGFydHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgheG1saHR0cCB8fCBpZWx0OCB8fCBmaXJlZm94KSB7XG4gICAgICAgICAgICB4bWxodHRwID0gbmV3WG1sSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHdyYXBwZXIueG1saHR0cCA9IHhtbGh0dHA7XG4gICAgICAgIH1cblxuICAgICAgICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHhtbGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKCF4bWxodHRwLnN0YXR1cyAmJiBmaWxlUHJvdG9jb2wpIHx8ICh4bWxodHRwLnN0YXR1cyA+PSAyMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxodHRwLnN0YXR1cyA8IDMwMCkgfHwgeG1saHR0cC5zdGF0dXMgPT09IDMwNCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhtbGh0dHAuc3RhdHVzID09PSAxMjIzIHx8IHhtbGh0dHAuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soeG1saHR0cC5yZXNwb25zZVRleHQsIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhuZXcgRXJyb3IoWEhSRVFFUlJPUiksIHdyYXBwZXIsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhtbGh0dHAub3BlbihHRVQsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICh4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoaSwgaGVhZGVyc1tpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHhtbGh0dHAuc2VuZCgpO1xuICAgICAgICAgICAgd3JhcHBlci5vcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvciwgd3JhcHBlciwgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB4bWxodHRwO1xuICAgIH0sXG5cbiAgICBhamF4UHJvdG8uYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMsXG4gICAgICAgICAgICB4bWxodHRwID0gaW5zdGFuY2UueG1saHR0cDtcblxuICAgICAgICBpbnN0YW5jZS5vcGVuID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB4bWxodHRwICYmIHR5cGVvZiB4bWxodHRwLmFib3J0ID09PSBGVU5DVElPTiAmJiB4bWxodHRwLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgICAgICB4bWxodHRwLnJlYWR5U3RhdGUgIT09IDAgJiYgeG1saHR0cC5hYm9ydCgpO1xuICAgIH0sXG5cbiAgICBhamF4UHJvdG8uZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcztcbiAgICAgICAgaW5zdGFuY2Uub3BlbiAmJiBpbnN0YW5jZS5hYm9ydCgpO1xuXG4gICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5vbkVycm9yO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2Uub25TdWNjZXNzO1xuICAgICAgICBkZWxldGUgaW5zdGFuY2UueG1saHR0cDtcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlLm9wZW47XG5cbiAgICAgICAgcmV0dXJuIChpbnN0YW5jZSA9IG51bGwpO1xuICAgIH1cbn0pOyIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICAvLyBTb3VyY2U6IGh0dHA6Ly93d3cuYmVubmFkZWwuY29tL2Jsb2cvMTUwNC1Bc2stQmVuLVBhcnNpbmctQ1NWLVN0cmluZ3MtV2l0aC1KYXZhc2NyaXB0LUV4ZWMtUmVndWxhci1FeHByZXNzaW9uLUNvbW1hbmQuaHRtXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cblxuXG4gICAgLy8gVGhpcyB3aWxsIHBhcnNlIGEgZGVsaW1pdGVkIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mXG4gICAgLy8gYXJyYXlzLiBUaGUgZGVmYXVsdCBkZWxpbWl0ZXIgaXMgdGhlIGNvbW1hLCBidXQgdGhpc1xuICAgIC8vIGNhbiBiZSBvdmVycmlkZW4gaW4gdGhlIHNlY29uZCBhcmd1bWVudC5cbiAgICBmdW5jdGlvbiBDU1ZUb0FycmF5IChzdHJEYXRhLCBzdHJEZWxpbWl0ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBkZWxpbWl0ZXIgaXMgZGVmaW5lZC4gSWYgbm90LFxuICAgICAgICAvLyB0aGVuIGRlZmF1bHQgdG8gY29tbWEuXG4gICAgICAgIHN0ckRlbGltaXRlciA9IChzdHJEZWxpbWl0ZXIgfHwgXCIsXCIpO1xuICAgICAgICAvLyBDcmVhdGUgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcGFyc2UgdGhlIENTViB2YWx1ZXMuXG4gICAgICAgIHZhciBvYmpQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAvLyBEZWxpbWl0ZXJzLlxuICAgICAgICAgICAgICAgIFwiKFxcXFxcIiArIHN0ckRlbGltaXRlciArIFwifFxcXFxyP1xcXFxufFxcXFxyfF4pXCIgK1xuICAgICAgICAgICAgICAgIC8vIFF1b3RlZCBmaWVsZHMuXG4gICAgICAgICAgICAgICAgXCIoPzpcXFwiKFteXFxcIl0qKD86XFxcIlxcXCJbXlxcXCJdKikqKVxcXCJ8XCIgK1xuICAgICAgICAgICAgICAgIC8vIFN0YW5kYXJkIGZpZWxkcy5cbiAgICAgICAgICAgICAgICBcIihbXlxcXCJcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcIlxcXFxyXFxcXG5dKikpXCJcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcImdpXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBkYXRhLiBHaXZlIHRoZSBhcnJheVxuICAgICAgICAvLyBhIGRlZmF1bHQgZW1wdHkgZmlyc3Qgcm93LlxuICAgICAgICB2YXIgYXJyRGF0YSA9IFtbXV07XG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSB0byBob2xkIG91ciBpbmRpdmlkdWFsIHBhdHRlcm5cbiAgICAgICAgLy8gbWF0Y2hpbmcgZ3JvdXBzLlxuICAgICAgICB2YXIgYXJyTWF0Y2hlcyA9IG51bGw7XG4gICAgICAgIC8vIEtlZXAgbG9vcGluZyBvdmVyIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlc1xuICAgICAgICAvLyB1bnRpbCB3ZSBjYW4gbm8gbG9uZ2VyIGZpbmQgYSBtYXRjaC5cbiAgICAgICAgd2hpbGUgKGFyck1hdGNoZXMgPSBvYmpQYXR0ZXJuLmV4ZWMoIHN0ckRhdGEgKSl7XG4gICAgICAgICAgICAvLyBHZXQgdGhlIGRlbGltaXRlciB0aGF0IHdhcyBmb3VuZC5cbiAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkRGVsaW1pdGVyID0gYXJyTWF0Y2hlc1sgMSBdO1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBnaXZlbiBkZWxpbWl0ZXIgaGFzIGEgbGVuZ3RoXG4gICAgICAgICAgICAvLyAoaXMgbm90IHRoZSBzdGFydCBvZiBzdHJpbmcpIGFuZCBpZiBpdCBtYXRjaGVzXG4gICAgICAgICAgICAvLyBmaWVsZCBkZWxpbWl0ZXIuIElmIGlkIGRvZXMgbm90LCB0aGVuIHdlIGtub3dcbiAgICAgICAgICAgIC8vIHRoYXQgdGhpcyBkZWxpbWl0ZXIgaXMgYSByb3cgZGVsaW1pdGVyLlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHN0ck1hdGNoZWREZWxpbWl0ZXIubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgKHN0ck1hdGNoZWREZWxpbWl0ZXIgIT0gc3RyRGVsaW1pdGVyKVxuICAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgLy8gU2luY2Ugd2UgaGF2ZSByZWFjaGVkIGEgbmV3IHJvdyBvZiBkYXRhLFxuICAgICAgICAgICAgICAgIC8vIGFkZCBhbiBlbXB0eSByb3cgdG8gb3VyIGRhdGEgYXJyYXkuXG4gICAgICAgICAgICAgICAgYXJyRGF0YS5wdXNoKCBbXSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBvdXIgZGVsaW1pdGVyIG91dCBvZiB0aGUgd2F5LFxuICAgICAgICAgICAgLy8gbGV0J3MgY2hlY2sgdG8gc2VlIHdoaWNoIGtpbmQgb2YgdmFsdWUgd2VcbiAgICAgICAgICAgIC8vIGNhcHR1cmVkIChxdW90ZWQgb3IgdW5xdW90ZWQpLlxuICAgICAgICAgICAgaWYgKGFyck1hdGNoZXNbIDIgXSl7XG4gICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgYSBxdW90ZWQgdmFsdWUuIFdoZW4gd2UgY2FwdHVyZVxuICAgICAgICAgICAgICAgIC8vIHRoaXMgdmFsdWUsIHVuZXNjYXBlIGFueSBkb3VibGUgcXVvdGVzLlxuICAgICAgICAgICAgICAgIHZhciBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWyAyIF0ucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFJlZ0V4cCggXCJcXFwiXFxcIlwiLCBcImdcIiApLFxuICAgICAgICAgICAgICAgICAgICBcIlxcXCJcIlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIG5vbi1xdW90ZWQgdmFsdWUuXG4gICAgICAgICAgICAgICAgdmFyIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbIDMgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgb3VyIHZhbHVlIHN0cmluZywgbGV0J3MgYWRkXG4gICAgICAgICAgICAvLyBpdCB0byB0aGUgZGF0YSBhcnJheS5cbiAgICAgICAgICAgIGFyckRhdGFbIGFyckRhdGEubGVuZ3RoIC0gMSBdLnB1c2goIHN0ck1hdGNoZWRWYWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJldHVybiB0aGUgcGFyc2VkIGRhdGEuXG4gICAgICAgIHJldHVybiggYXJyRGF0YSApO1xuICAgIH1cbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuXG4gICAgTXVsdGlDaGFydGluZy5wcm90b3R5cGUuY29udmVydFRvQXJyYXkgPSBmdW5jdGlvbiAoZGF0YSwgZGVsaW1pdGVyLCBzdHJ1Y3R1cmUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzcGxpdGVkRGF0YSA9IGRhdGEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyksXG4gICAgICAgICAgICAvL3RvdGFsIG51bWJlciBvZiByb3dzXG4gICAgICAgICAgICBsZW4gPSBzcGxpdGVkRGF0YS5sZW5ndGgsXG4gICAgICAgICAgICAvL2ZpcnN0IHJvdyBpcyBoZWFkZXIgYW5kIHNwbGl0aW5nIGl0IGludG8gYXJyYXlzXG4gICAgICAgICAgICBoZWFkZXIgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhWzBdLCBkZWxpbWl0ZXIpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgIGkgPSAxLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBrID0gMCxcbiAgICAgICAgICAgIGtsZW4gPSAwLFxuICAgICAgICAgICAgY2VsbCA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBmaW5hbE9iID0gW10sXG4gICAgICAgICAgICB1cGRhdGVNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW0gPSAwLFxuICAgICAgICAgICAgICAgICAgICBqbGVuID0gMCxcbiAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxpbSA9IGkgKyAzMDAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChsaW0gPiBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgbGltID0gbGVuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxpbTsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgY2VsbCBhcnJheSB0aGF0IGNvaW50YWluIGNzdiBkYXRhXG4gICAgICAgICAgICAgICAgICAgIGNlbGwgPSBDU1ZUb0FycmF5KHNwbGl0ZWREYXRhW2ldLCBkZWxpbWl0ZXIpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgICAgICAgICAgICAgLy90YWtlIG1pbiBvZiBoZWFkZXIgbGVuZ3RoIGFuZCB0b3RhbCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgICAgIGpsZW4gPSBtaW4oaGVhZGVyLmxlbmd0aCwgY2VsbC5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKHN0cnVjdHVyZSA9PT0gMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbE9iLnB1c2goY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RydWN0dXJlID09PSAyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJbal1dID0gY2VsbFtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2IucHVzaChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBqbGVuOyArK2opIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3JlYXRpbmcgdGhlIGZpbmFsIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsT2JbaGVhZGVyW2pdXS5wdXNoKGNlbGxbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBsZW4gLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY2FsbCB1cGRhdGUgbWFuYWdlclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXRUaW1lb3V0KHVwZGF0ZU1hbmFnZXIsIDApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZmluYWxPYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBzdHJ1Y3R1cmUgPSBzdHJ1Y3R1cmUgfHwgMTtcblxuICAgICAgICAvL2lmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAoc3BsaXRlZERhdGFbc3BsaXRlZERhdGEubGVuZ3RoIC0gMV0gPT09ICcnKSB7XG4gICAgICAgICAgICBzcGxpdGVkRGF0YS5zcGxpY2UoKHNwbGl0ZWREYXRhLmxlbmd0aCAtIDEpLCAxKTtcbiAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJ1Y3R1cmUgPT09IDEpe1xuICAgICAgICAgICAgZmluYWxPYiA9IFtdO1xuICAgICAgICAgICAgZmluYWxPYi5wdXNoKGhlYWRlcik7XG4gICAgICAgIH0gZWxzZSBpZihzdHJ1Y3R1cmUgPT09IDIpIHtcbiAgICAgICAgICAgIGZpbmFsT2IgPSBbXTtcbiAgICAgICAgfWVsc2UgaWYoc3RydWN0dXJlID09PSAzKXtcbiAgICAgICAgICAgIGZpbmFsT2IgPSB7fTtcbiAgICAgICAgICAgIGZvciAoayA9IDAsIGtsZW4gPSBoZWFkZXIubGVuZ3RoOyBrIDwga2xlbjsgKytrKSB7XG4gICAgICAgICAgICAgICAgZmluYWxPYltoZWFkZXJba11dID0gW107XG4gICAgICAgICAgICB9ICAgXG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVNYW5hZ2VyKCk7XG5cbiAgICB9O1xuXG59KTtcbiIsIlxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShNdWx0aUNoYXJ0aW5nKTtcbiAgICB9XG59KShmdW5jdGlvbiAoTXVsdGlDaGFydGluZykge1xuXG5cdE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZURhdGFTdG9yZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGFTdG9yZShhcmd1bWVudHMpO1xuXHR9O1xuXG5cdHZhclx0bGliID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLFxuXHRcdGRhdGFTdG9yYWdlID0gbGliLmRhdGFTdG9yYWdlID0ge30sXG5cdFx0Ly8gRm9yIHN0b3JpbmcgdGhlIGNoaWxkIG9mIGEgcGFyZW50XG5cdFx0bGlua1N0b3JlID0ge30sXG5cdFx0Ly9Gb3Igc3RvcmluZyB0aGUgcGFyZW50IG9mIGEgY2hpbGRcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSA9IHt9LFxuXHRcdGlkQ291bnQgPSAwLFxuXHRcdC8vIENvbnN0cnVjdG9yIGNsYXNzIGZvciBEYXRhU3RvcmUuXG5cdFx0RGF0YVN0b3JlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuc2V0RGF0YShhcmd1bWVudHMpO1xuXHRcdH0sXG5cdFx0ZGF0YVN0b3JlUHJvdG8gPSBEYXRhU3RvcmUucHJvdG90eXBlLFxuXG5cdFx0Ly9GdW5jdGlvbiB0byB1cGRhdGUgYWxsIHRoZSBsaW5rZWQgY2hpbGQgZGF0YVxuXHRcdHVwZGF0YURhdGEgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRsaW5rRGF0YSA9IGxpbmtTdG9yZVtpZF0sXG5cdFx0XHRcdHBhcmVudERhdGEgPSBkYXRhU3RvcmFnZVtpZF0sXG5cdFx0XHRcdGZpbHRlclN0b3JlID0gbGliLmZpbHRlclN0b3JlLFxuXHRcdFx0XHRsZW4sXG5cdFx0XHRcdGxpbmtJZHMsXG5cdFx0XHRcdGZpbHRlcnMsXG5cdFx0XHRcdGxpbmtJZCxcblx0XHRcdFx0ZmlsdGVyLFxuXHRcdFx0XHRmaWx0ZXJGbixcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0aW5mbyxcblx0XHRcdFx0Ly8gU3RvcmUgYWxsIHRoZSBkYXRhT2JqcyB0aGF0IGFyZSB1cGRhdGVkLlxuXHRcdFx0XHR0ZW1wRGF0YVVwZGF0ZWQgPSBsaWIudGVtcERhdGFVcGRhdGVkID0ge307XG5cblx0XHRcdGxpbmtJZHMgPSBsaW5rRGF0YS5saW5rO1xuXHRcdFx0ZmlsdGVycyA9IGxpbmtEYXRhLmZpbHRlcjtcblx0XHRcdGxlbiA9IGxpbmtJZHMubGVuZ3RoO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0bGlua0lkID0gbGlua0lkc1tpXTtcblxuXHRcdFx0XHR0ZW1wRGF0YVVwZGF0ZWRbbGlua0lkXSA9IHRydWU7XG5cdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbaV07XG5cdFx0XHRcdGZpbHRlckZuID0gZmlsdGVyLmdldEZpbHRlcigpO1xuXHRcdFx0XHR0eXBlID0gZmlsdGVyLnR5cGU7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBmaWx0ZXJGbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmIChmaWx0ZXJTdG9yZVtmaWx0ZXIuaWRdKSB7XG5cdFx0XHRcdFx0XHRkYXRhU3RvcmFnZVtsaW5rSWRdID0gZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBmaWx0ZXJGbiwgcGFyZW50RGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbGlua0lkXSA9IHBhcmVudERhdGE7XG5cdFx0XHRcdFx0XHRmaWx0ZXIuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aSAtPSAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGxpbmtTdG9yZVtsaW5rSWRdKSB7XG5cdFx0XHRcdFx0dXBkYXRhRGF0YShsaW5rSWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdGhlIGRhdGFQcm9jZXNzb3Igb3ZlciB0aGUgZGF0YVxuXHRcdGV4ZWN1dGVQcm9jZXNzb3IgPSBmdW5jdGlvbiAodHlwZSwgZmlsdGVyRm4sIEpTT05EYXRhKSB7XG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAgJ3NvcnQnIDogcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAgJ2ZpbHRlcicgOiByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKEpTT05EYXRhLCBmaWx0ZXJGbik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2FkZEluZm8nIDpcblx0XHRcdFx0Y2FzZSAncmVFeHByZXNzJyA6IHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoSlNPTkRhdGEsIGZpbHRlckZuKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdCA6IHJldHVybiBmaWx0ZXJGbihKU09ORGF0YSk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vRnVuY3Rpb24gdG8gY29udmVydC9nZXQgcmF3IGRhdGEgaW50byBKU09OIGRhdGFcblx0XHRwYXJzZURhdGEgPSBmdW5jdGlvbiAoZGF0YVNwZWNzKSB7XG5cdFx0XHR2YXJcdGRhdGFTb3VyY2UgPSBkYXRhU3BlY3MuZGF0YVNvdXJjZSxcblx0XHRcdFx0ZGF0YVR5cGUgPSBkYXRhU3BlY3MuZGF0YVR5cGUsXG5cdFx0XHRcdEpTT05EYXRhO1xuXG5cdFx0XHRzd2l0Y2goZGF0YVR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnY3N2JyA6IFxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdqc29uJyA6IFxuXHRcdFx0XHRkZWZhdWx0IDogSlNPTkRhdGEgPSBkYXRhU291cmNlO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIEpTT05EYXRhO1xuXHRcdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgaW4gdGhlIGRhdGEgc3RvcmVcblx0ZGF0YVN0b3JlUHJvdG8uc2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMsXG5cdFx0XHRvbGRJZCA9IGRhdGEuaWQsXG5cdFx0XHRhcmd1bWVudCA9IGFyZ3VtZW50c1swXSxcblx0XHRcdGlkID0gYXJndW1lbnQuaWQsXG5cdFx0XHRvbGRKU09ORGF0YSA9IGRhdGFTdG9yYWdlW29sZElkXSB8fCBbXSxcblx0XHRcdEpTT05EYXRhID0gcGFyc2VEYXRhKGFyZ3VtZW50KTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2RhdGFTdG9yYWdlJyArIGlkQ291bnQgKys7XG5cdFx0ZGF0YVN0b3JhZ2VbaWRdID0gb2xkSlNPTkRhdGEuY29uY2F0KEpTT05EYXRhIHx8IFtdKTtcblxuXHRcdGRhdGEuaWQgPSBpZDtcblxuXHRcdGlmIChsaW5rU3RvcmVbaWRdKSB7XG5cdFx0XHR1cGRhdGFEYXRhKGlkKVxuXHRcdH1cblx0XHRkaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZGF0YUFkZGVkJywgeydkZXRhaWwnIDoge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0XHQnZGF0YScgOiBKU09ORGF0YVxuXHRcdH19KSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IHRoZSBqc29uZGF0YSBvZiB0aGUgZGF0YSBvYmplY3Rcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SlNPTiA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZGF0YVN0b3JhZ2VbdGhpcy5pZF07XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gZ2V0IGNoaWxkIGRhdGEgb2JqZWN0IGFmdGVyIGFwcGx5aW5nIGZpbHRlciBvbiB0aGUgcGFyZW50IGRhdGEuXG5cdC8vIEBwYXJhbXMge2ZpbHRlcnN9IC0gVGhpcyBjYW4gYmUgYSBmaWx0ZXIgZnVuY3Rpb24gb3IgYW4gYXJyYXkgb2YgZmlsdGVyIGZ1bmN0aW9ucy5cblx0ZGF0YVN0b3JlUHJvdG8uZ2V0RGF0YSA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG5cdFx0dmFyIGRhdGEgPSB0aGlzLFxuXHRcdFx0aWQgPSBkYXRhLmlkLFxuXHRcdFx0ZmlsdGVyTGluayA9IGxpYi5maWx0ZXJMaW5rO1xuXHRcdC8vIElmIG5vIHBhcmFtZXRlciBpcyBwcmVzZW50IHRoZW4gcmV0dXJuIHRoZSB1bmZpbHRlcmVkIGRhdGEuXG5cdFx0aWYgKCFmaWx0ZXJzKSB7XG5cdFx0XHRyZXR1cm4gZGF0YVN0b3JhZ2VbaWRdO1xuXHRcdH1cblx0XHQvLyBJZiBwYXJhbWV0ZXIgaXMgYW4gYXJyYXkgb2YgZmlsdGVyIHRoZW4gcmV0dXJuIHRoZSBmaWx0ZXJlZCBkYXRhIGFmdGVyIGFwcGx5aW5nIHRoZSBmaWx0ZXIgb3ZlciB0aGUgZGF0YS5cblx0XHRlbHNlIHtcblx0XHRcdGxldCByZXN1bHQgPSBbXSxcblx0XHRcdFx0aSxcblx0XHRcdFx0bmV3RGF0YSxcblx0XHRcdFx0bGlua0RhdGEsXG5cdFx0XHRcdG5ld0lkLFxuXHRcdFx0XHRmaWx0ZXIsXG5cdFx0XHRcdGZpbHRlckZuLFxuXHRcdFx0XHRkYXRhbGlua3MsXG5cdFx0XHRcdGZpbHRlcklELFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRpc0ZpbHRlckFycmF5ID0gZmlsdGVycyBpbnN0YW5jZW9mIEFycmF5LFxuXHRcdFx0XHRsZW4gPSBpc0ZpbHRlckFycmF5ID8gZmlsdGVycy5sZW5ndGggOiAxO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0ZmlsdGVyID0gZmlsdGVyc1tpXSB8fCBmaWx0ZXJzO1xuXHRcdFx0XHRmaWx0ZXJGbiA9IGZpbHRlci5nZXRGaWx0ZXIoKTtcblx0XHRcdFx0dHlwZSA9IGZpbHRlci50eXBlO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyRm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRuZXdEYXRhID0gZXhlY3V0ZVByb2Nlc3Nvcih0eXBlLCBmaWx0ZXJGbiwgZGF0YVN0b3JhZ2VbaWRdKTtcblxuXHRcdFx0XHRcdG5ld0RhdGFPYmogPSBuZXcgRGF0YVN0b3JlKG5ld0RhdGEpO1xuXHRcdFx0XHRcdG5ld0lkID0gbmV3RGF0YU9iai5pZDtcblx0XHRcdFx0XHRwYXJlbnRTdG9yZVtuZXdJZF0gPSBkYXRhO1xuXG5cdFx0XHRcdFx0ZGF0YVN0b3JhZ2VbbmV3SWRdID0gbmV3RGF0YTtcblx0XHRcdFx0XHRyZXN1bHQucHVzaChuZXdEYXRhT2JqKTtcblxuXHRcdFx0XHRcdC8vUHVzaGluZyB0aGUgaWQgYW5kIGZpbHRlciBvZiBjaGlsZCBjbGFzcyB1bmRlciB0aGUgcGFyZW50IGNsYXNzZXMgaWQuXG5cdFx0XHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdIHx8IChsaW5rU3RvcmVbaWRdID0ge1xuXHRcdFx0XHRcdFx0bGluayA6IFtdLFxuXHRcdFx0XHRcdFx0ZmlsdGVyIDogW11cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRsaW5rRGF0YS5saW5rLnB1c2gobmV3SWQpO1xuXHRcdFx0XHRcdGxpbmtEYXRhLmZpbHRlci5wdXNoKGZpbHRlcik7XG5cblx0XHRcdFx0XHQvLyBTdG9yaW5nIHRoZSBkYXRhIG9uIHdoaWNoIHRoZSBmaWx0ZXIgaXMgYXBwbGllZCB1bmRlciB0aGUgZmlsdGVyIGlkLlxuXHRcdFx0XHRcdGZpbHRlcklEID0gZmlsdGVyLmdldElEKCk7XG5cdFx0XHRcdFx0ZGF0YWxpbmtzID0gZmlsdGVyTGlua1tmaWx0ZXJJRF0gfHwgKGZpbHRlckxpbmtbZmlsdGVySURdID0gW10pO1xuXHRcdFx0XHRcdGRhdGFsaW5rcy5wdXNoKG5ld0RhdGFPYmopXG5cblx0XHRcdFx0XHQvLyBzZXR0aW5nIHRoZSBjdXJyZW50IGlkIGFzIHRoZSBuZXdJRCBzbyB0aGF0IHRoZSBuZXh0IGZpbHRlciBpcyBhcHBsaWVkIG9uIHRoZSBjaGlsZCBkYXRhO1xuXHRcdFx0XHRcdGlkID0gbmV3SWQ7XG5cdFx0XHRcdFx0ZGF0YSA9IG5ld0RhdGFPYmo7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiAoaXNGaWx0ZXJBcnJheSA/IHJlc3VsdCA6IHJlc3VsdFswXSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGRlbGV0ZSB0aGUgY3VycmVudCBkYXRhIGZyb20gdGhlIGRhdGFTdG9yYWdlIGFuZCBhbHNvIGFsbCBpdHMgY2hpbGRzIHJlY3Vyc2l2ZWx5XG5cdGRhdGFTdG9yZVByb3RvLmRlbGV0ZURhdGEgPSBmdW5jdGlvbiAob3B0aW9uYWxJZCkge1xuXHRcdHZhciBkYXRhID0gdGhpcyxcblx0XHRcdGlkID0gb3B0aW9uYWxJZCB8fCBkYXRhLmlkLFxuXHRcdFx0bGlua0RhdGEgPSBsaW5rU3RvcmVbaWRdLFxuXHRcdFx0ZmxhZztcblxuXHRcdGlmIChsaW5rRGF0YSkge1xuXHRcdFx0bGV0IGksXG5cdFx0XHRcdGxpbmsgPSBsaW5rRGF0YS5saW5rLFxuXHRcdFx0XHRsZW4gPSBsaW5rLmxlbmd0aDtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKyspIHtcblx0XHRcdFx0ZGF0YS5kZWxldGVEYXRhKGxpbmtbaV0pO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGxpbmtTdG9yZVtpZF07XG5cdFx0fVxuXG5cdFx0ZmxhZyA9IGRlbGV0ZSBkYXRhU3RvcmFnZVtpZF07XG5cdFx0ZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2RhdGFEZWxldGVkJywgeydkZXRhaWwnIDoge1xuXHRcdFx0J2lkJzogaWQsXG5cdFx0fX0pKTtcblx0XHRyZXR1cm4gZmxhZztcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIGlkIG9mIHRoZSBjdXJyZW50IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8uZ2V0SUQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQ7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gbW9kaWZ5IGRhdGFcblx0ZGF0YVN0b3JlUHJvdG8ubW9kaWZ5RGF0YSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZGF0YSA9IHRoaXM7XG5cblx0XHRkYXRhU3RvcmFnZVtpZF0gPSBbXTtcblx0XHRkYXRhLnNldERhdGEoYXJndW1lbnRzKTtcblx0XHRkaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZGF0YU1vZGlmaWVkJywgeydkZXRhaWwnIDoge1xuXHRcdFx0J2lkJzogZGF0YS5pZFxuXHRcdH19KSk7XG5cdH07XG5cblx0Ly8gRnVuY3Rpb24gdG8gYWRkIGRhdGEgdG8gdGhlIGRhdGFTdG9yYWdlIGFzeW5jaHJvbm91c2x5IHZpYSBhamF4XG5cdGRhdGFTdG9yZVByb3RvLnNldERhdGFVcmwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRhdGEgPSB0aGlzLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRkYXRhU291cmNlID0gYXJndW1lbnQuZGF0YVNvdXJjZSxcblx0XHRcdGRhdGFUeXBlID0gYXJndW1lbnQuZGF0YVR5cGUsXG5cdFx0XHRjYWxsYmFjayA9IGFyZ3VtZW50LmNhbGxiYWNrLFxuXHRcdFx0Y2FsbGJhY2tBcmdzID0gYXJndW1lbnQuY2FsbGJhY2tBcmdzLFxuXHRcdFx0SlNPTkRhdGE7XG5cblx0XHRhamF4ID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUuYWpheCh7XG5cdFx0XHR1cmwgOiBkYXRhU291cmNlLFxuXHRcdFx0c3VjY2VzcyA6IGZ1bmN0aW9uKEpTT05TdHJpbmcpe1xuXHRcdFx0XHRKU09ORGF0YSA9IEpTT04ucGFyc2UoSlNPTlN0cmluZyk7XG5cdFx0XHRcdGRhdGEuc2V0RGF0YSh7XG5cdFx0XHRcdFx0ZGF0YVNvdXJjZSA6IEpTT05EYXRhXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRlcnJvciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjYWxsYmFjayhjYWxsYmFja0FyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuXHRNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVEYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0YVByb2Nlc3Nvcihhcmd1bWVudHMpO1xuXHR9O1xuXG5cdHZhciBsaWIgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5saWIsXG5cdFx0ZmlsdGVyU3RvcmUgPSBsaWIuZmlsdGVyU3RvcmUgPSB7fSxcblx0XHRmaWx0ZXJMaW5rID0gbGliLmZpbHRlckxpbmsgPSB7fSxcblx0XHRmaWx0ZXJJZENvdW50ID0gMCxcblx0XHRkYXRhU3RvcmFnZSA9IGxpYi5kYXRhU3RvcmFnZSxcblx0XHRwYXJlbnRTdG9yZSA9IGxpYi5wYXJlbnRTdG9yZSxcblx0XHRcblx0XHQvLyBDb25zdHJ1Y3RvciBjbGFzcyBmb3IgRGF0YVByb2Nlc3Nvci5cblx0XHREYXRhUHJvY2Vzc29yID0gZnVuY3Rpb24gKCkge1xuXHQgICAgXHR2YXIgbWFuYWdlciA9IHRoaXM7XG5cdCAgICBcdG1hbmFnZXIuYWRkUnVsZShhcmd1bWVudHMpO1xuXHRcdH0sXG5cdFx0XG5cdFx0ZGF0YVByb2Nlc3NvclByb3RvID0gRGF0YVByb2Nlc3Nvci5wcm90b3R5cGUsXG5cblx0XHQvLyBGdW5jdGlvbiB0byB1cGRhdGUgZGF0YSBvbiBjaGFuZ2Ugb2YgZmlsdGVyLlxuXHRcdHVwZGF0YUZpbHRlclByb2Nlc3NvciA9IGZ1bmN0aW9uIChpZCwgY29weVBhcmVudFRvQ2hpbGQpIHtcblx0XHRcdHZhciBpLFxuXHRcdFx0XHRkYXRhID0gZmlsdGVyTGlua1tpZF0sXG5cdFx0XHRcdEpTT05EYXRhLFxuXHRcdFx0XHRkYXR1bSxcblx0XHRcdFx0ZGF0YUlkLFxuXHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aDtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArKykge1xuXHRcdFx0XHRkYXR1bSA9IGRhdGFbaV07XG5cdFx0XHRcdGRhdGFJZCA9IGRhdHVtLmlkO1xuXHRcdFx0XHRpZiAoIWxpYi50ZW1wRGF0YVVwZGF0ZWRbZGF0YUlkXSkge1xuXHRcdFx0XHRcdGlmIChwYXJlbnRTdG9yZVtkYXRhSWRdICYmIGRhdGFTdG9yYWdlW2RhdGFJZF0pIHtcblx0XHRcdFx0XHRcdEpTT05EYXRhID0gcGFyZW50U3RvcmVbZGF0YUlkXS5nZXREYXRhKCk7XG5cdFx0XHRcdFx0XHRkYXR1bS5tb2RpZnlEYXRhKGNvcHlQYXJlbnRUb0NoaWxkID8gSlNPTkRhdGEgOiBmaWx0ZXJTdG9yZVtpZF0oSlNPTkRhdGEpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgcGFyZW50U3RvcmVbZGF0YUlkXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGxpYi50ZW1wRGF0YVVwZGF0ZWQgPSB7fTtcblx0XHR9O1xuXG5cdC8vIEZ1bmN0aW9uIHRvIGFkZCBmaWx0ZXIgaW4gdGhlIGZpbHRlciBzdG9yZVxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uYWRkUnVsZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVyID0gdGhpcyxcblx0XHRcdG9sZElkID0gZmlsdGVyLmlkLFxuXHRcdFx0YXJndW1lbnQgPSBhcmd1bWVudHNbMF0sXG5cdFx0XHRmaWx0ZXJGbiA9IGFyZ3VtZW50LnJ1bGUsXG5cdFx0XHRpZCA9IGFyZ3VtZW50LnR5cGUsXG5cdFx0XHR0eXBlID0gYXJndW1lbnQudHlwZTtcblxuXHRcdGlkID0gb2xkSWQgfHwgaWQgfHwgJ2ZpbHRlclN0b3JlJyArIGZpbHRlcklkQ291bnQgKys7XG5cdFx0ZmlsdGVyU3RvcmVbaWRdID0gZmlsdGVyRm47XG5cblx0XHRmaWx0ZXIuaWQgPSBpZDtcblx0XHRmaWx0ZXIudHlwZSA9IHR5cGU7XG5cblx0XHQvLyBVcGRhdGUgdGhlIGRhdGEgb24gd2hpY2ggdGhlIGZpbHRlciBpcyBhcHBsaWVkIGFuZCBhbHNvIG9uIHRoZSBjaGlsZCBkYXRhLlxuXHRcdGlmIChmaWx0ZXJMaW5rW2lkXSkge1xuXHRcdFx0dXBkYXRhRmlsdGVyUHJvY2Vzc29yKGlkKTtcblx0XHR9XG5cblx0XHRkaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZmlsdGVyQWRkZWQnLCB7J2RldGFpbCcgOiB7XG5cdFx0XHQnaWQnOiBpZCxcblx0XHRcdCdmaWx0ZXInIDogZmlsdGVyRm5cblx0XHR9fSkpO1xuXHR9O1xuXG5cdC8vIEZ1bnRpb24gdG8gZ2V0IHRoZSBmaWx0ZXIgbWV0aG9kLlxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZ2V0RmlsdGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBmaWx0ZXJTdG9yZVt0aGlzLmlkXTtcblx0fTtcblxuXHQvLyBGdW5jdGlvbiB0byBnZXQgdGhlIElEIG9mIHRoZSBmaWx0ZXIuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5nZXRJRCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5pZDtcblx0fTtcblxuXG5cdGRhdGFQcm9jZXNzb3JQcm90by5kZWxldGVGaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGZpbHRlciA9IHRoaXMsXG5cdFx0XHRpZCA9IGZpbHRlci5pZDtcblxuXHRcdGZpbHRlckxpbmtbaWRdICYmIHVwZGF0YUZpbHRlclByb2Nlc3NvcihpZCwgdHJ1ZSk7XG5cblx0XHRkZWxldGUgZmlsdGVyU3RvcmVbaWRdO1xuXHRcdGRlbGV0ZSBmaWx0ZXJMaW5rW2lkXTtcblx0fTtcblxuXHRkYXRhUHJvY2Vzc29yUHJvdG8uZmlsdGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuYWRkUnVsZShcblx0XHRcdHtcdHJ1bGUgOiBhcmd1bWVudHNbMF0sXG5cdFx0XHRcdHR5cGUgOiAnZmlsdGVyJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLnNvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdzb3J0J1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLmFkZEluZm8gPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5hZGRSdWxlKFxuXHRcdFx0e1x0cnVsZSA6IGFyZ3VtZW50c1swXSxcblx0XHRcdFx0dHlwZSA6ICdhZGRJbmZvJ1xuXHRcdFx0fVxuXHRcdCk7XG5cdH07XG5cblx0ZGF0YVByb2Nlc3NvclByb3RvLnJlRXhwcmVzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmFkZFJ1bGUoXG5cdFx0XHR7XHRydWxlIDogYXJndW1lbnRzWzBdLFxuXHRcdFx0XHR0eXBlIDogJ3JlRXhwcmVzcydcblx0XHRcdH1cblx0XHQpO1xuXHR9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5kYXRhYWRhcHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnREYXRhKGFyZ3VtZW50c1swXSk7XG4gICAgfTtcbiAgICB2YXIgZXh0ZW5kMiA9IE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmxpYi5leHRlbmQyO1xuICAgIC8vZnVuY3Rpb24gdG8gY29udmVydCBkYXRhLCBpdCByZXR1cm5zIGZjIHN1cHBvcnRlZCBKU09OXG4gICAgZnVuY3Rpb24gY29udmVydERhdGEoKSB7XG4gICAgICAgIHZhciBhcmd1bWVudCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcbiAgICAgICAgICAgIGpzb25EYXRhID0gYXJndW1lbnQuanNvbkRhdGEsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gYXJndW1lbnQuY29uZmlnLFxuICAgICAgICAgICAgY2FsbGJhY2tGTiA9IGFyZ3VtZW50LmNhbGxiYWNrRk4sXG4gICAgICAgICAgICBqc29uQ3JlYXRvciA9IGZ1bmN0aW9uKGpzb25EYXRhLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbmYgPSBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzZXJpZXNUeXBlID0gY29uZiAmJiBjb25mLnNlcmllc1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIHNlcmllcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtcycgOiBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqc29uID0ge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRpbWVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuTWVhc3VyZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmNhdGVnb3JpZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2F0ZWdvcnlcIjogWyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW5EaW1lbnNpb24gPSAgY29uZmlndXJhdGlvbi5kaW1lbnNpb24ubGVuZ3RoOyBpIDwgbGVuRGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5kaW1lbnNpb25baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXRjaCAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uY2F0ZWdvcmllc1swXS5jYXRlZ29yeS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuTWVhc3VyZSA9IGNvbmZpZ3VyYXRpb24ubWVhc3VyZS5sZW5ndGg7IGkgPCBsZW5NZWFzdXJlOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaCA9IGpzb25EYXRhWzBdLmluZGV4T2YoY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2VyaWVzbmFtZScgOiBjb25maWd1cmF0aW9uLm1lYXN1cmVbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqID0gMSwgbGVuRGF0YSA9IGpzb25EYXRhLmxlbmd0aDsgaiA8IGxlbkRhdGE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldFtpXS5kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDoganNvbkRhdGFbal1baW5kZXhNYXRjaF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3MnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2hWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuRGltZW5zaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5NZWFzdXJlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5EYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaExhYmVsID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLmRpbWVuc2lvblswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXRjaFZhbHVlID0ganNvbkRhdGFbMF0uaW5kZXhPZihjb25maWd1cmF0aW9uLm1lYXN1cmVbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHsgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBqc29uRGF0YVtqXVtpbmRleE1hdGNoTGFiZWxdOyAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2pdW2luZGV4TWF0Y2hWYWx1ZV07IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwnIDogbGFiZWwgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsdWUnIDogdmFsdWUgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ganNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAndHMnIDogZnVuY3Rpb24oanNvbkRhdGEsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5EaW1lbnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbk1lYXN1cmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbkRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZGF0YXNldHNbMF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmNhdGVnb3J5ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0c1swXS5jYXRlZ29yeS5kYXRhID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuRGltZW5zaW9uID0gIGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uLmxlbmd0aDsgaSA8IGxlbkRpbWVuc2lvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24uZGltZW5zaW9uW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWF0Y2ggIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmNhdGVnb3J5LmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0c1swXS5kYXRhc2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0c1swXS5kYXRhc2V0WzBdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbi5kYXRhc2V0c1swXS5kYXRhc2V0WzBdLnNlcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbk1lYXN1cmUgPSBjb25maWd1cmF0aW9uLm1lYXN1cmUubGVuZ3RoOyBpIDwgbGVuTWVhc3VyZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWF0Y2ggPSBqc29uRGF0YVswXS5pbmRleE9mKGNvbmZpZ3VyYXRpb24ubWVhc3VyZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hdGNoICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldID0geyAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnIDogY29uZmlndXJhdGlvbi5tZWFzdXJlW2ldLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IoaiA9IDEsIGxlbkRhdGEgPSBqc29uRGF0YS5sZW5ndGg7IGogPCBsZW5EYXRhOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uLmRhdGFzZXRzWzBdLmRhdGFzZXRbMF0uc2VyaWVzW2ldLmRhdGEucHVzaChqc29uRGF0YVtqXVtpbmRleE1hdGNoXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2VyaWVzVHlwZSA9IHNlcmllc1R5cGUgJiYgc2VyaWVzVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHNlcmllc1R5cGUgPSAoc2VyaWVzW3Nlcmllc1R5cGVdICYmIHNlcmllc1R5cGUpIHx8ICdtcyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlcmllc1tzZXJpZXNUeXBlXShqc29uRGF0YSwgY29uZik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuZXJhbERhdGFGb3JtYXQgPSBmdW5jdGlvbihqc29uRGF0YSwgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShqc29uRGF0YVswXSksXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXkgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgaixcbiAgICAgICAgICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgICAgICAgICBsZW5HZW5lcmFsRGF0YUFycmF5LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzQXJyYXkpe1xuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsRGF0YUFycmF5WzBdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0ucHVzaChjb25maWd1cmF0aW9uLmRpbWVuc2lvbik7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxEYXRhQXJyYXlbMF0gPSBnZW5lcmFsRGF0YUFycmF5WzBdWzBdLmNvbmNhdChjb25maWd1cmF0aW9uLm1lYXN1cmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBqc29uRGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW5HZW5lcmFsRGF0YUFycmF5ID0gZ2VuZXJhbERhdGFBcnJheVswXS5sZW5ndGg7IGogPCBsZW5HZW5lcmFsRGF0YUFycmF5OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25EYXRhW2ldW2dlbmVyYWxEYXRhQXJyYXlbMF1bal1dOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbERhdGFBcnJheVtpKzFdW2pdID0gdmFsdWUgfHwgJyc7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGpzb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhbERhdGFBcnJheTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhQXJyYXksXG4gICAgICAgICAgICBqc29uLFxuICAgICAgICAgICAgcHJlZGVmaW5lZEpzb24gPSBjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uY29uZmlnO1xuXG4gICAgICAgIGlmIChqc29uRGF0YSAmJiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICBkYXRhQXJyYXkgPSBnZW5lcmFsRGF0YUZvcm1hdChqc29uRGF0YSwgY29uZmlndXJhdGlvbik7XG4gICAgICAgICAgICBqc29uID0ganNvbkNyZWF0b3IoZGF0YUFycmF5LCBjb25maWd1cmF0aW9uKTtcbiAgICAgICAgICAgIGpzb24gPSAocHJlZGVmaW5lZEpzb24gJiYgZXh0ZW5kMihqc29uLHByZWRlZmluZWRKc29uKSkgfHwganNvbjsgICAgXG4gICAgICAgICAgICByZXR1cm4gKGNhbGxiYWNrRk4gJiYgY2FsbGJhY2tGTihqc29uKSkgfHwganNvbjsgICAgXG4gICAgICAgIH1cbiAgICB9XG59KTsiLCJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoTXVsdGlDaGFydGluZyk7XG4gICAgfVxufSkoZnVuY3Rpb24gKE11bHRpQ2hhcnRpbmcpIHtcblxuICAgIE11bHRpQ2hhcnRpbmcucHJvdG90eXBlLmNyZWF0ZUNoYXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENoYXJ0KGFyZ3VtZW50c1swXSk7XG4gICAgfTtcblxuICAgIHZhciBDaGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjaGFydCA9IHRoaXM7ICAgICAgICAgICBcbiAgICAgICAgICAgIGNoYXJ0LnJlbmRlcihhcmd1bWVudHNbMF0pO1xuICAgICAgICB9LFxuICAgICAgICBjaGFydFByb3RvID0gQ2hhcnQucHJvdG90eXBlLFxuICAgICAgICBleHRlbmQyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUubGliLmV4dGVuZDIsXG4gICAgICAgIGRhdGFhZGFwdGVyID0gTXVsdGlDaGFydGluZy5wcm90b3R5cGUuZGF0YWFkYXB0ZXI7XG5cbiAgICBjaGFydFByb3RvLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXJ0ID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3VtZW50ID1hcmd1bWVudHNbMF0gfHwge30sXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgY2FsbGJhY2tGTixcbiAgICAgICAgICAgIGpzb25EYXRhLFxuICAgICAgICAgICAgY2hhcnRDb25maWcgPSB7fSxcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgPSB7fSxcbiAgICAgICAgICAgIGNvbmZpZ0RhdGEgPSB7fTtcbiAgICAgICAgLy9wYXJzZSBhcmd1bWVudCBpbnRvIGNoYXJ0Q29uZmlnIFxuICAgICAgICBleHRlbmQyKGNoYXJ0Q29uZmlnLGFyZ3VtZW50KTtcbiAgICAgICAgXG4gICAgICAgIC8vZGF0YSBjb25maWd1cmF0aW9uIFxuICAgICAgICBjb25maWd1cmF0aW9uID0gY2hhcnRDb25maWcuY29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICAgICAgY29uZmlnRGF0YS5qc29uRGF0YSA9IGNoYXJ0Q29uZmlnLmpzb25EYXRhO1xuICAgICAgICBjb25maWdEYXRhLmNhbGxiYWNrRk4gPSBjb25maWd1cmF0aW9uLmNhbGxiYWNrO1xuICAgICAgICBjb25maWdEYXRhLmNvbmZpZyA9IGNvbmZpZ3VyYXRpb24uZGF0YTtcblxuICAgICAgICAvL3N0b3JlIGZjIHN1cHBvcnRlZCBqc29uIHRvIHJlbmRlciBjaGFydHNcbiAgICAgICAgZGF0YVNvdXJjZSA9IGRhdGFhZGFwdGVyKGNvbmZpZ0RhdGEpO1xuICAgICAgICBcbiAgICAgICAgLy9kZWxldGUgZGF0YSBjb25maWd1cmF0aW9uIHBhcnRzIGZvciBGQyBqc29uIGNvbnZlcnRlclxuICAgICAgICBkZWxldGUgY2hhcnRDb25maWcuanNvbkRhdGE7XG4gICAgICAgIGRlbGV0ZSBjaGFydENvbmZpZy5jb25maWd1cmF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy9zZXQgZGF0YSBzb3VyY2UgaW50byBjaGFydCBjb25maWd1cmF0aW9uXG4gICAgICAgIGNoYXJ0Q29uZmlnLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICBjaGFydC5jaGFydE9iaiA9IGNoYXJ0Q29uZmlnO1xuICAgICAgICBcbiAgICAgICAgLy9yZW5kZXIgRkMgXG4gICAgICAgIHZhciBjaGFydCA9IG5ldyBGdXNpb25DaGFydHMoY2hhcnRDb25maWcpO1xuICAgICAgICBjaGFydC5yZW5kZXIoKTtcbiAgICB9O1xufSk7IiwiXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KE11bHRpQ2hhcnRpbmcpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChNdWx0aUNoYXJ0aW5nKSB7XG5cbiAgICBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVNYXRyaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGFyZ3VtZW50c1swXSxhcmd1bWVudHNbMV0pO1xuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlQ2hhcnQgPSBNdWx0aUNoYXJ0aW5nLnByb3RvdHlwZS5jcmVhdGVDaGFydCxcbiAgICAgICAgTWF0cml4ID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbWF0cml4ID0gdGhpcztcbiAgICAgICAgICAgIG1hdHJpeC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgbWF0cml4Lm1hdHJpeENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIG1hdHJpeC5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0SCA9IDEwMDtcbiAgICAgICAgICAgIG1hdHJpeC5kZWZhdWx0VyA9IDEwMDtcblxuICAgICAgICAgICAgbWF0cml4LnNldEF0dHJDb250YWluZXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhcnRJZCA9IDA7XG5cbiAgICBwcm90b01hdHJpeCA9IE1hdHJpeC5wcm90b3R5cGU7XG5cbiAgICBwcm90b01hdHJpeC5zZXRBdHRyQ29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXI7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgICAgICAgIFxuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5zZXRDb250YWluZXJSZXNvbHV0aW9uID0gZnVuY3Rpb24gKGhlaWdodEFyciwgd2lkdGhBcnIpIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBjb250YWluZXIgPSBtYXRyaXggJiYgbWF0cml4Lm1hdHJpeENvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IDAsXG4gICAgICAgICAgICB3aWR0aCA9IDAsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBoZWlnaHRBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGhlaWdodCArPSBoZWlnaHRBcnJbaV07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHdpZHRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB3aWR0aCArPSB3aWR0aEFycltpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSBtYXRyaXggJiYgbWF0cml4LmNvbmZpZ3VyYXRpb24gfHwge30sXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWd1cmF0aW9uLmNvbmZpZyxcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9ICcnLFxuICAgICAgICAgICAgY29uZmlnTWFuYWdlciA9IGNvbmZpZ3VyYXRpb24gJiYgbWF0cml4ICYmIG1hdHJpeC5kcmF3TWFuYWdlcihjb25maWd1cmF0aW9uKSxcbiAgICAgICAgICAgIGxlbiA9IGNvbmZpZ01hbmFnZXIgJiYgY29uZmlnTWFuYWdlci5sZW5ndGgsXG4gICAgICAgICAgICBwbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldID0gbWF0cml4LmRyYXdDZWxsKHtcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JyA6IGNvbmZpZ01hbmFnZXJbaV0uaGVpZ2h0LFxuICAgICAgICAgICAgICAgICd3aWR0aCcgOiBjb25maWdNYW5hZ2VyW2ldLndpZHRoLFxuICAgICAgICAgICAgICAgICd0b3AnIDogY29uZmlnTWFuYWdlcltpXS50b3AsXG4gICAgICAgICAgICAgICAgJ2xlZnQnIDogY29uZmlnTWFuYWdlcltpXS5sZWZ0LFxuICAgICAgICAgICAgICAgICdpZCcgOiBjb25maWdNYW5hZ2VyW2ldLmlkLFxuICAgICAgICAgICAgICAgICdodG1sJyA6IGNvbmZpZ01hbmFnZXJbaV0uaHRtbCxcbiAgICAgICAgICAgICAgICAnY2hhcnQnIDogY29uZmlnTWFuYWdlcltpXS5jaGFydFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZihjb25maWdNYW5hZ2VyW2ldLmNoYXJ0KXtcbiAgICAgICAgICAgICAgICBjb25maWdNYW5hZ2VyW2ldLmNoYXJ0LnJlbmRlckF0ID0gY29uZmlnTWFuYWdlcltpXS5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYWNlSG9sZGVyW2ldLmNoYXJ0ID0gKGNvbmZpZ01hbmFnZXJbaV0uY2hhcnQgJiYgY3JlYXRlQ2hhcnQoY29uZmlnTWFuYWdlcltpXS5jaGFydCkpIHx8IHt9O1xuICAgICAgICB9XG4gICAgICAgIG1hdHJpeC5wbGFjZUhvbGRlciA9IFtdO1xuICAgICAgICBtYXRyaXgucGxhY2VIb2xkZXIgPSBwbGFjZUhvbGRlcjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZHJhd0NlbGwgPSBmdW5jdGlvbihjb25maWd1cmF0aW9uLCBpZCwgY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLFxuICAgICAgICAgICAgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICAgICAgbWF0cml4Q29udGFpbmVyID0gbWF0cml4ICYmIG1hdHJpeC5tYXRyaXhDb250YWluZXI7XG5cbiAgICAgICAgY2VsbC5pZCA9IGNvbmZpZ3VyYXRpb24uaWQgfHwgJyc7XG4gICAgICAgIGNlbGwuY2xhc3NOYW1lID0gKGNvbmZpZ3VyYXRpb24gJiYgY29uZmlndXJhdGlvbi5wdXJwb3NlKSB8fCAnJyArICcgY2VsbCAnICsgKGNsYXNzTmFtZSB8fCAnJyk7XG4gICAgICAgIGNlbGwuc3R5bGUuaGVpZ2h0ID0gY29uZmlndXJhdGlvbiAmJiAgY29uZmlndXJhdGlvbi5oZWlnaHQgKyAncHgnO1xuICAgICAgICBjZWxsLnN0eWxlLndpZHRoID0gY29uZmlndXJhdGlvbiAmJiAgY29uZmlndXJhdGlvbi53aWR0aCArICdweCc7XG4gICAgICAgIGNlbGwuc3R5bGUudG9wID0gY29uZmlndXJhdGlvbiAmJiBjb25maWd1cmF0aW9uLnRvcCArICdweCc7XG4gICAgICAgIGNlbGwuc3R5bGUubGVmdCA9IGNvbmZpZ3VyYXRpb24gJiYgIGNvbmZpZ3VyYXRpb24ubGVmdCArICdweCc7XG4gICAgICAgIGNlbGwuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBjZWxsLmlubmVySFRNTCA9IGNvbmZpZ3VyYXRpb24uaHRtbCB8fCAnJztcbiAgICAgICAgbWF0cml4Q29udGFpbmVyLmFwcGVuZENoaWxkKGNlbGwpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb25maWcgOiB7XG4gICAgICAgICAgICAgICAgaWQgOiBjZWxsLmlkLFxuICAgICAgICAgICAgICAgIGhlaWdodCA6IGNlbGwuc3R5bGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIHdpZHRoIDogY2VsbC5zdHlsZS53aWR0aCxcbiAgICAgICAgICAgICAgICB0b3AgOiBjZWxsLnN0eWxlLnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0IDogY2VsbC5zdHlsZS5sZWZ0LFxuICAgICAgICAgICAgICAgIGh0bWwgOiBjb25maWd1cmF0aW9uLmh0bWwgfHwgJycsXG4gICAgICAgICAgICAgICAgY2hhcnQgOiBjb25maWd1cmF0aW9uLmNoYXJ0IHx8IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ3JhcGhpY3MgOiBjZWxsXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmRyYXdNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGxlblJvdyA9IGNvbmZpZ3VyYXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgbWFwQXJyID0gbWF0cml4Lm1hdHJpeE1hbmFnZXIoY29uZmlndXJhdGlvbiksXG4gICAgICAgICAgICBwcm9jZXNzZWRDb25maWcgPSBtYXRyaXguc2V0UGxjSGxkcihtYXBBcnIsIGNvbmZpZ3VyYXRpb24pLFxuICAgICAgICAgICAgaGVpZ2h0QXJyID0gbWF0cml4LmdldFJvd0hlaWdodChtYXBBcnIpLFxuICAgICAgICAgICAgd2lkdGhBcnIgPSBtYXRyaXguZ2V0Q29sV2lkdGgobWFwQXJyKSxcbiAgICAgICAgICAgIGRyYXdNYW5hZ2VyT2JqQXJyID0gW10sXG4gICAgICAgICAgICBsZW5Sb3csXG4gICAgICAgICAgICBsZW5DZWxsLFxuICAgICAgICAgICAgbWF0cml4UG9zWCA9IG1hdHJpeC5nZXRQb3Mod2lkdGhBcnIpLFxuICAgICAgICAgICAgbWF0cml4UG9zWSA9IG1hdHJpeC5nZXRQb3MoaGVpZ2h0QXJyKSxcbiAgICAgICAgICAgIHJvd3NwYW4sXG4gICAgICAgICAgICBjb2xzcGFuLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0b3AsXG4gICAgICAgICAgICBsZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICBjaGFydCxcbiAgICAgICAgICAgIGh0bWw7XG5cbiAgICAgICAgbWF0cml4LnNldENvbnRhaW5lclJlc29sdXRpb24oaGVpZ2h0QXJyLCB3aWR0aEFycik7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5Sb3c7IGkrKykgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuQ2VsbCA9IGNvbmZpZ3VyYXRpb25baV0ubGVuZ3RoOyBqIDwgbGVuQ2VsbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93c3BhbiA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5yb3dzcGFuIHx8IDEpO1xuICAgICAgICAgICAgICAgIGNvbHNwYW4gPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY29sc3BhbiB8fCAxKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0uY2hhcnQ7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5odG1sO1xuICAgICAgICAgICAgICAgIHJvdyA9IHBhcnNlSW50KGNvbmZpZ3VyYXRpb25baV1bal0ucm93KTtcbiAgICAgICAgICAgICAgICBjb2wgPSBwYXJzZUludChjb25maWd1cmF0aW9uW2ldW2pdLmNvbCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IG1hdHJpeFBvc1hbY29sXTtcbiAgICAgICAgICAgICAgICB0b3AgPSBtYXRyaXhQb3NZW3Jvd107XG4gICAgICAgICAgICAgICAgd2lkdGggPSBtYXRyaXhQb3NYW2NvbCArIGNvbHNwYW5dIC0gbGVmdDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXRyaXhQb3NZW3JvdyArIHJvd3NwYW5dIC0gdG9wO1xuICAgICAgICAgICAgICAgIGlkID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5pZCkgfHwgbWF0cml4LmlkQ3JlYXRvcihyb3csY29sKTtcbiAgICAgICAgICAgICAgICBkcmF3TWFuYWdlck9iakFyci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wIDogdG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0IDogbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBpZCA6IGlkLFxuICAgICAgICAgICAgICAgICAgICBodG1sIDogaHRtbCxcbiAgICAgICAgICAgICAgICAgICAgY2hhcnQgOiBjaGFydFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgXG4gICAgICAgIHJldHVybiBkcmF3TWFuYWdlck9iakFycjtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguaWRDcmVhdG9yID0gZnVuY3Rpb24ocm93LCBjb2wpe1xuICAgICAgICBjaGFydElkKys7XG4gICAgICAgIHJldHVybiAnaWQtJyArIHJvdyArICctJyArIGNvbCArICctJyArIGNoYXJ0SWQ7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LmdldFBvcyA9ICBmdW5jdGlvbihzcmMpe1xuICAgICAgICB2YXIgYXJyID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHNyYyAmJiBzcmMubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPD0gbGVuOyBpKyspe1xuICAgICAgICAgICAgYXJyLnB1c2goaSA/IChzcmNbaS0xXSthcnJbaS0xXSkgOiAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIHByb3RvTWF0cml4LnNldFBsY0hsZHIgPSBmdW5jdGlvbihtYXBBcnIsIGNvbmZpZ3VyYXRpb24pe1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcyxcbiAgICAgICAgICAgIHJvdyxcbiAgICAgICAgICAgIGNvbCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUixcbiAgICAgICAgICAgIGxlbkM7XG5cbiAgICAgICAgZm9yKGkgPSAwLCBsZW5SID0gbWFwQXJyLmxlbmd0aDsgaSA8IGxlblI7IGkrKyl7IFxuICAgICAgICAgICAgZm9yKGogPSAwLCBsZW5DID0gbWFwQXJyW2ldLmxlbmd0aDsgaiA8IGxlbkM7IGorKyl7XG4gICAgICAgICAgICAgICAgcm93ID0gbWFwQXJyW2ldW2pdLmlkLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgICAgICAgY29sID0gbWFwQXJyW2ldW2pdLmlkLnNwbGl0KCctJylbMV07XG5cbiAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPSBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3cgPT09IHVuZGVmaW5lZCA/IGkgOiBjb25maWd1cmF0aW9uW3Jvd11bY29sXS5yb3c7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID0gY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sID09PSB1bmRlZmluZWQgPyBqIDogY29uZmlndXJhdGlvbltyb3ddW2NvbF0uY29sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5nZXRSb3dIZWlnaHQgPSBmdW5jdGlvbihtYXBBcnIpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgbGVuUm93ID0gbWFwQXJyICYmIG1hcEFyci5sZW5ndGgsXG4gICAgICAgICAgICBsZW5Db2wsXG4gICAgICAgICAgICBoZWlnaHQgPSBbXSxcbiAgICAgICAgICAgIGN1cnJIZWlnaHQsXG4gICAgICAgICAgICBtYXhIZWlnaHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlblJvdzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoaiA9IDAsIG1heEhlaWdodCA9IDAsIGxlbkNvbCA9IG1hcEFycltpXS5sZW5ndGg7IGogPCBsZW5Db2w7IGorKykge1xuICAgICAgICAgICAgICAgIGN1cnJIZWlnaHQgPSBtYXBBcnJbaV1bal0uaGVpZ2h0O1xuICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCA8IGN1cnJIZWlnaHQgPyBjdXJySGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGVpZ2h0W2ldID0gbWF4SGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9O1xuXG4gICAgcHJvdG9NYXRyaXguZ2V0Q29sV2lkdGggPSBmdW5jdGlvbihtYXBBcnIpIHtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBsZW5Sb3cgPSBtYXBBcnIgJiYgbWFwQXJyLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNvbCxcbiAgICAgICAgICAgIHdpZHRoID0gW10sXG4gICAgICAgICAgICBjdXJyV2lkdGgsXG4gICAgICAgICAgICBtYXhXaWR0aDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuQ29sID0gbWFwQXJyW2pdLmxlbmd0aDsgaSA8IGxlbkNvbDsgaSsrKXtcbiAgICAgICAgICAgIGZvcihqID0gMCwgbWF4V2lkdGggPSAwOyBqIDwgbGVuUm93OyBqKyspIHtcbiAgICAgICAgICAgICAgICBjdXJyV2lkdGggPSBtYXBBcnJbal1baV0ud2lkdGg7ICAgICAgICBcbiAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IG1heFdpZHRoIDwgY3VycldpZHRoID8gY3VycldpZHRoIDogbWF4V2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aWR0aFtpXSA9IG1heFdpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH07XG5cbiAgICBwcm90b01hdHJpeC5tYXRyaXhNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMsXG4gICAgICAgICAgICBtYXBBcnIgPSBbXSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGwsXG4gICAgICAgICAgICBsZW5Sb3cgPSBjb25maWd1cmF0aW9uLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbkNlbGwsXG4gICAgICAgICAgICByb3dTcGFuLFxuICAgICAgICAgICAgY29sU3BhbixcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgZGVmYXVsdEggPSBtYXRyaXguZGVmYXVsdEgsXG4gICAgICAgICAgICBkZWZhdWx0VyA9IG1hdHJpeC5kZWZhdWx0VyxcbiAgICAgICAgICAgIG9mZnNldDtcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuUm93OyBpKyspIHsgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbkNlbGwgPSBjb25maWd1cmF0aW9uW2ldLmxlbmd0aDsgaiA8IGxlbkNlbGw7IGorKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcm93U3BhbiA9IChjb25maWd1cmF0aW9uW2ldW2pdICYmIGNvbmZpZ3VyYXRpb25baV1bal0ucm93c3BhbikgfHwgMTtcbiAgICAgICAgICAgICAgICBjb2xTcGFuID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5jb2xzcGFuKSB8fCAxOyAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpZHRoID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS53aWR0aCk7XG4gICAgICAgICAgICAgICAgd2lkdGggPSAod2lkdGggJiYgKHdpZHRoIC8gY29sU3BhbikpIHx8IGRlZmF1bHRXOyAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gKGNvbmZpZ3VyYXRpb25baV1bal0gJiYgY29uZmlndXJhdGlvbltpXVtqXS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGhlaWdodCA9IChoZWlnaHQgJiYgKGhlaWdodCAvIHJvd1NwYW4pKSB8fCBkZWZhdWx0SDsgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMCwgb2Zmc2V0ID0gMDsgayA8IHJvd1NwYW47IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGwgPSAwOyBsIDwgY29sU3BhbjsgbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcEFycltpICsga10gPSBtYXBBcnJbaSArIGtdID8gbWFwQXJyW2kgKyBrXSA6IFtdOyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gaiArIGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlKG1hcEFycltpICsga11bb2Zmc2V0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBBcnJbaSArIGtdW29mZnNldF0gPSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkIDogKGkgKyAnLScgKyBqKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXBBcnI7XG4gICAgfTtcbn0pOyJdfQ==

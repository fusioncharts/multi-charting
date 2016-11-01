//function definition for convert data, it returns fc supported JSON
function convertData(DATA, configuration, callbackFN) {
	var jsonCreator = function(DATA, configuration) {
		var conf = configuration,
			seriesType = conf && conf.seriesType,
			series = {
			'ms' : function(DATA, configuration) {
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
	            	indexMatch = DATA[0].indexOf(configuration.dimension[i]);
	            	if (indexMatch != -1) {
	            		for (j = 1, lenData = DATA.length; j < lenData; j++) {
	            			json.categories[0].category.push({
	            				'label' : DATA[j][indexMatch]
	            			});
	            		}
	            	}
	            }
	           	json.dataset = [];
	           	for (i = 0, lenMeasure = configuration.measure.length; i < lenMeasure; i++) {
	           		indexMatch = DATA[0].indexOf(configuration.measure[i]);
	           		if (indexMatch != -1) {
	           			json.dataset[i] = {
	           				'seriesname' : configuration.measure[i],
	           				'data': []
	           			};
	           			for(j = 1, lenData = DATA.length; j < lenData; j++) {
	           				json.dataset[i].data.push({
	           					'value' : DATA[j][indexMatch]
	           				});
	           			}
	           		}
	           	}
	            return json;
			},
			'ss' : function(DATA, configuration) {
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
	            indexMatchLabel = DATA[0].indexOf(configuration.dimension[0]);
	            indexMatchValue = DATA[0].indexOf(configuration.measure[0]);
        		for (j = 1, lenData = DATA.length; j < lenData; j++) {        			
            		label = DATA[j][indexMatchLabel];             		 		
            		value = DATA[j][indexMatchValue]; 
        			json.data.push({
        				'label' : label || '',
        				'value' : value || ''
        			});
        		}	            	
	            return json;
			}
		};
		seriesType = seriesType ? (series[seriesType] ? seriesType.toLowerCase() : 'ms')  : 'ms';		
		return series[seriesType](DATA, conf);
	},
	generalDataFormat = function(DATA, configuration) {
		var isArray = Array.isArray(DATA[0]),
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
			for (i = 0, len = DATA.length; i < len; i++) {
				generalDataArray[i+1] = [];
				for (j = 0, lenGeneralDataArray = generalDataArray[0].length; j < lenGeneralDataArray; j++) {
					value = DATA[i][generalDataArray[0][j]];					
					generalDataArray[i+1][j] = value || '';				
				}
			}
		} else {
			return DATA;
		}
		return generalDataArray;
	},
	dataArray,
	json,
	predefinedJson = configuration && configuration.config;

	if (DATA && configuration) {
		dataArray = generalDataFormat(DATA, configuration);
		json = jsonCreator(dataArray, configuration);
		json = (predefinedJson && extend2(json,predefinedJson)) || json;	
		return (callbackFN && callbackFN(json)) || json;	
	}
}

function extend2(obj1, obj2, skipUndef) {
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

}

function merge(obj1, obj2, skipUndef, tgtArr, srcArr) {
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
}
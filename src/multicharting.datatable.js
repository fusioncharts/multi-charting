(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {
    var multiChartingProto = MultiCharting.prototype,
    lib = multiChartingProto.lib,
    eventList = lib.eventList;

    var DrawData = function () {
        var drawData = this;
        if (typeof arguments[0] === 'object') {
        	drawData.container = arguments[0].container;
        	drawData.data = arguments[0].datastrore;
        	drawData.hiddenFields = arguments[0].hiddenfields;
        	drawData.fieldsOrder = arguments[0].fieldsorder;
        }else{
        	drawData.container = arguments[1];
        	drawData.data = arguments[0];
        	drawData.hiddenFields = arguments[2];
        	drawData.fieldsOrder = arguments[3];
        }

        if (drawData.data && drawData.data.addEventListener) {
            drawData.data.addEventListener( 'modelUpdated', function () {
                drawData.drawTable();
            });
        }
        drawData.drawTable();
    },
    protoDrawData = DrawData.prototype;

    protoDrawData.drawTable = function () {
        var drawData = this,
            containerID = drawData.container,         
            con = document.getElementById(containerID);
            con.innerHTML = '';
        
        drawData.createTable();
        drawData.addData();
        drawData.showVisuals();
    }

    protoDrawData.createTable = function () {
    	var drawData = this;
    	drawData.table = document.createElement('TABLE');
    	drawData.table.id = 'data-table';
    	drawData.table.className = 'mytable';
    };

	protoDrawData.addHeader = function (id,addto,val) {
        var headerEle = document.createElement("TH"),
            textEle = document.createTextNode(val);
        headerEle.id = id;
        headerEle.className = 'table-header';
        headerEle.appendChild(textEle);
        addto.appendChild(headerEle);
        return headerEle;
    };

    protoDrawData.insertRow = function (id,addto) {
        var tr = document.createElement('TR');
        tr.id = id;
        tr.className = 'table-row'
        addto.appendChild(tr);
        return tr;
    };

    protoDrawData.insertCell = function (id,addto,val,applyon,isArray) {

        var drawData = applyon,
            data = drawData.data.getJSON(),
            td = document.createElement('TD'),
            textEle = document.createTextNode(val),
            inputField = document.createElement('INPUT'),
            isArray = isArray,
            row,
            property;

        inputField.className = 'table-text'
        inputField.setAttribute('type', 'text');
        inputField.setAttribute('value', val);
        inputField.addEventListener('focusout',function(){
            //console.log(id,drawData);
            if(isArray){
                id = id.split('-');
                row = Number(id[0]);
                property = Number(id[1]);
                data[row][property] = inputField.value;
            }else{
                id = id.split('-');
                row = Number(id[0]);
                property = id[1];
                data[row][property] = inputField.value;
            }
        });
        inputField.addEventListener("keyup", function(event) {
            event.preventDefault();
            if (event.keyCode == 13) {

            }
        });
        td.id = id;
        td.className = 'table-cell'
        td.appendChild(inputField);
        addto.appendChild(td);
        return td;
    };

    protoDrawData.addInputText = function (id,val) {
        var inputField = document.createElement('INPUT');
        inputField.id = id;
        inputField.className = 'table-text'
        inputField.setAttribute('type', 'text');
        inputField.setAttribute('value', val);
        return inputField;
    };

    protoDrawData.addData = function () {
    	var drawData = this,
            dataStore = drawData && drawData.data,
    		tableE = drawData && drawData.table,
    		hiddenFields = drawData && drawData.hiddenFields,
    		fieldsOrder = drawData && drawData.fieldsOrder,
            data = dataStore.getJSON(),
    		headerLength = data[0] && data[0].length,
    		datalen = data && data.length,
    		insertRow = drawData && drawData.insertRow,
    		addHeader = drawData && drawData.addHeader,
    		insertCell = drawData && drawData.insertCell,
    		row,
            keys,
            len,
            headerRow,
    		currentRow,
    		i,
    		j,
    		idHiddenField = function (field) {
    			return hiddenFields.indexOf(field);
    		};

        //var a = performance.now()
    	for(i = 0; i < datalen; i++){
            row = data[i];
            if(Array.isArray(row)){
                currentRow = insertRow(i,tableE);
                if(!i){
                    for(j = 0; j < headerLength; j++){
                        addHeader('th' + j, currentRow, row[j] === undefined ? '' : row[j]);
                    }
                }else{
                    for(j = 0; j < headerLength; j++){
                        insertCell(i + '-' + j, currentRow, row[j] === undefined ? '' : row[j], drawData, true);
                    }
                }
            }else{
                if(!i){
                    headerRow = insertRow('header',tableE);
                    keys = Object.keys(row);
                    len = keys.length;
                    for(j = 0; j < len; j++){
                    	if(idHiddenField(keys[j])){
                    		addHeader('th' + j, headerRow, keys[j] === undefined ? '' : keys[j]);
                    	}          
                    }
                }
                currentRow = insertRow(i,tableE);
                for (var property in row) {
                    if (row.hasOwnProperty(property) && idHiddenField(property)) {
                        insertCell(i + '-' + property, currentRow, row[property] === undefined ? '' : row[property], drawData, false);
                    }
                }
            }
        }
        //console.log('Time taken to draw '+datalen+' data : '+(performance.now() - a)+' ms');
    };

    protoDrawData.showVisuals = function () {
    	var drawData = this,
    		tableE = drawData && drawData.table,
    		containerID = drawData && drawData.container,
    		container = document.getElementById(containerID);

    	container.appendChild(tableE);
    };

    MultiCharting.prototype.dataTable = function () {
        return new DrawData(arguments[0], arguments[1], arguments[2], arguments[3]);
    };
});
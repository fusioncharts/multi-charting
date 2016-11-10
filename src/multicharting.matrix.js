                

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
            placeHolder = [],
            parentContainer = matrix && matrix.matrixContainer,
            lenC;
        
        for(i = 0; i < len; i++) {
            placeHolder[i] = [];
            for(j = 0, lenC = configManager[i].length; j < lenC; j++){
                placeHolder[i][j] = new Cell(configManager[i][j],parentContainer);
            }
        }
        matrix.placeHolder = [];
        matrix.placeHolder = placeHolder;
    };

/*    protoMatrix.drawCell = function(configuration, id, className) {
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
                rowspan : configuration.rowspan,
                colspan : configuration.colspan,                
                id      : cell.id,
                height  : cell.style.height,
                width   : cell.style.width,
                top     : cell.style.top,
                left    : cell.style.left,
                html    : configuration.html || '',
                chart   : configuration.chart || {}
            },
            graphics : cell
        };
    };*/

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
                drawManagerObjArr[i].push({
                    top     : top,
                    left    : left,
                    height  : height,
                    width   : width,
                    id      : id,
                    rowspan : rowspan,
                    colspan : colspan,
                    html    : html,
                    chart   : chart
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

    protoMatrix.update = function (configuration) {
        var matrix = this,
            configManager = configuration && matrix && matrix.drawManager(configuration),
            len = configManager && configManager.length,
            lenC,
            lenPlcHldr,
            i,
            j,
            k,
            placeHolder = matrix && matrix.placeHolder,
            parentContainer  = matrix && matrix.matrixContainer,
            disposalBox = [],
            recycledCell;

        lenPlcHldr = placeHolder.length;
        for (k = lenC; k < lenPlcHldr; k++) {
            disposalBox = disposalBox.concat(placeHolder.pop());
        }

        for(i = 0; i < len; i++) {    
            if(!placeHolder[i]) {
                placeHolder[i] = [];
            }
            for(j = 0, lenC = configManager[i].length; j < lenC; j++){
                if(placeHolder[i][j]) {
                    placeHolder[i][j].update(configManager[i][j]);                    
                } else {
                    recycledCell = disposalBox.pop();
                    if(recycledCell) {
                        placeHolder[i][j] = recycledCell.update(configManager[i][j]);
                        
                    } else {
                        placeHolder[i][j] = new Cell(configManager[i][j],parentContainer);
                    }
                }
            }

            lenPlcHldr = placeHolder[i].length;

            for (k = lenC; k < lenPlcHldr; k++) {
                disposalBox = disposalBox.concat(placeHolder[i].pop());
            }
        }

        for(i = 0, len = disposalBox.length; i < len; i++) {
            delete disposalBox[i];
        }
    };

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
        cell.graphics = document.createElement('div');
        cell.graphics.id = cell.config.id || '';        
        cell.graphics.style.height = cell.config.height + 'px';
        cell.graphics.style.width = cell.config.width + 'px';
        cell.graphics.style.top = cell.config.top + 'px';
        cell.graphics.style.left = cell.config.left + 'px';
        cell.graphics.style.position = 'absolute';
        cell.graphics.innerHTML = cell.config.html || '';
        cell.container.appendChild(cell.graphics);
    };

    protoCell.renderChart = function () {
        var cell = this; 

        cell.config.chart.renderAt = cell.config.id;
        cell.config.chart.width = '100%';
        cell.config.chart.height = '100%';
      
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
            cell.graphics.id = cell.config.id || '';        
            cell.graphics.style.height = cell.config.height + 'px';
            cell.graphics.style.width = cell.config.width + 'px';
            cell.graphics.style.top = cell.config.top + 'px';
            cell.graphics.style.left = cell.config.left + 'px';
            cell.graphics.style.position = 'absolute';
            cell.graphics.innerHTML = cell.config.html || '';            
            if(cell.config.chart) {
                cell.chart = cell.renderChart();             
            } else {
                delete cell.chart;
            }          
        }        
    };
});
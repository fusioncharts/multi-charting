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
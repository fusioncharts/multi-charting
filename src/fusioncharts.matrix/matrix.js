var Grid = function (selector, configuration) {
	var grid = this;
	grid.configuration = configuration;
	grid.gridDiv = document.getElementById(selector);
	grid.gridDiv.style.height = configuration.height + 'px';
	grid.gridDiv.style.width = configuration.width + 'px';	
	grid.gridDiv.style.display = 'block';
	grid.gridDiv.style.position = 'relative';
	grid.gridDiv.style.outline = '2px solid red';
}

var protoGrid = Grid.prototype;

protoGrid.draw = function(){
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		className = '',
		configManager = grid && grid.gridManager(),
		len = configManager && configManager.length;
	for(i = 0; i < len; i++) {
		this.drawDiv({
			'height' : configManager[i].height,
			'width' : configManager[i].width,
			'top' : configManager[i].top,
			'left' : configManager[i].left				
		}, className);
	}
};

protoGrid.drawDiv = function(configuration,className) {
	var grid = this,
		cell = document.createElement('div'),
		gridDiv = grid && grid.gridDiv;
	cell.className = (configuration && configuration.purpose) || '' + ' cell ' + (className || '');
	cell.style.height = configuration &&  configuration.height + 'px';
	cell.style.width = configuration &&  configuration.width + 'px';
	cell.style.top = configuration && configuration.top + 'px';
	cell.style.left = configuration &&  configuration.left + 'px';
	cell.style.position = 'absolute';
	cell.style.outline = '1px solid black';
	gridDiv.appendChild(cell);
};

protoGrid.calcRowHeight = function() {
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		lenConf = config && config.length,
		height = configuration && configuration.height,
		dimension = configuration && configuration.dimension,
		defaultH = height / dimension[1],
		i,
		j,
		row,
		rowNo,
		heightArr = [],
		maxHeight,
		endRow,
		startRow,
		currHeight,
		isRowArray,
		gridCurrH = 0;
	for(k = 0; k < dimension[1]; k++) {
		maxHeight = 0;
		for(i = 0; i < lenConf; i++) {
			row = config[i].row;
			currHeight = config[i].height;
			isRowArray = Array.isArray(row);
			if(currHeight) {
				rowNo = isRowArray && row.length || 1;
				startRow = ((isRowArray && row[0]) || row) - 1;
				if(startRow == k && rowNo === 1) {
					maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
				}
				endRow = ((isRowArray && row[rowNo - 1]) || row) - 1;
				if(endRow == k && heightArr[endRow - 1]) {
					currHeight = grid.getDiff(heightArr, (k - 1), currHeight);
					maxHeight = maxHeight < currHeight ? currHeight : maxHeight;	
				}

			}
		}
		heightArr[k] = maxHeight ? maxHeight : ((height - gridCurrH) / (dimension[1] - k));
		gridCurrH += heightArr[k]
	}
	heightArr = ratioEquilizer(heightArr, height);
	return heightArr;	
};

protoGrid.calcColWidth = function() {
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		lenConf = config && config.length,
		width = configuration && configuration.width,
		dimension = configuration && configuration.dimension,
		defaultW = width / dimension[0],
		i,
		j,
		col,
		colNo,
		widthArr = [],
		maxWidth,
		endCol,
		startCol,
		currWidth,
		isColArray,
		gridCurrW = 0;
	for(k = 0; k < dimension[0]; k++) {
		maxWidth = 0;
		for(i = 0; i < lenConf; i++) {
			col = config[i].col;
			currWidth = config[i].width;
			isColArray = Array.isArray(col);
			if (currWidth){
				colNo = (isColArray && col.length) || 1;				
				startCol = (isColArray && col[0] || col) - 1;
				if (startCol === k && colNo === 1){
					maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
				}
				endCol = (isColArray && col[col.length - 1] || col) - 1;
				if(endCol == k && widthArr[endCol - 1]) {
					currWidth = grid.getDiff(widthArr, k - 1, currWidth);
					maxWidth = maxWidth < currWidth ? currWidth : maxWidth;				
				}

			}
		}
		widthArr[k] = maxWidth ? maxWidth : ((width - gridCurrW) / (dimension[0] - k));
		gridCurrW += widthArr[k];
	}
	widthArr = ratioEquilizer(widthArr, width);
	return widthArr;	
};

protoGrid.getDiff = function(arr, index, value){
	var i = 0,
		total = 0;
	for(; i < index; i++) {
		total += arr[i];
	}
	return (value - total);
};

protoGrid.getPos =  function(src){
		var arr = [],
			i;
		for(i = 0; i <= src.length; i++){
			if(i == 0){
				arr.push(0);
			}else{
				arr.push(src[i-1]+arr[i-1]);
			}
		}
		return arr;
};

protoGrid.gridManager = function(){
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		lenConf = config && config.length,
		cellH = configuration.height / configuration.dimension[1],
		cellW = configuration.width / configuration.dimension[0],
		dimensionX = configuration.dimension[0],
		dimensionY = configuration.dimension[1],
		gridHeightArr = grid && grid.calcRowHeight(),
		gridWidhtArr = grid && grid.calcColWidth(),
		configManager = [],
		gridPosX = grid.gridPosX = grid.getPos(gridWidhtArr),
		gridPosY = grid.gridPosY = grid.getPos(gridHeightArr),
		i = 0,
		j,
		isRowArr,
		isColArr,
		col,
		row,
		top,
		left,
		height,
		width;

		if(!config || !lenConf){//if config isn't defined or empty
			for(i = 0; i < dimensionY; i++){
				for(j = 0; j < dimensionX; j++){
					
					top = i * cellH;
					left = j * cellW;
					height = cellH;
					width = cellW;
					
					configManager.push({
						top : top,
						left : left,
						height : height,
						width : width
					});
				}
			}
		} else {
			for(i; i < lenConf; i++){
				row = config[i].row;
				col = config[i].col;
				
				isColArr = Array.isArray(col);
				isRowArr = Array.isArray(row);
				
				top = gridPosY[(isRowArr ? Math.min.apply(null,row) : row)-1];
				left = gridPosX[(isColArr ? Math.min.apply(null,col) : col)-1];
				height = gridPosY[(isRowArr ? Math.max.apply(null,row) : row)] - top;
				width = gridPosX[(isColArr ? Math.max.apply(null,col) : col)] - left;
				
				configManager.push({
					top : top,
					left : left,
					height : height,
					width : width
				});
			}
		}	
		return configManager;
};

function getArrSum(arr) {
	var i = 0,
		len = arr && arr.length,
		sum = 0;
	for(; i < len; i++){
		sum += arr[i];
	}
	return sum;
}

function ratioEquilizer(arr, value) {
	var i = 0,
		lenArr = arr && arr.length,
		sum = 0,
		diff;
	for(;i < lenArr; i++) {
		sum += arr[i];
	}
	for(i = 0; i < lenArr; i++){		
		arr[i] = (arr[i] / sum) * value;
	}
	return arr;
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
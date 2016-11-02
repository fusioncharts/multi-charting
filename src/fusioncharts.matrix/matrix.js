var Grid = function (selector, configuration) {
	var grid = this;
	grid.configuration = configuration;
	grid.gridDiv = document.getElementById(selector);	
	grid.gridDiv.style.height = configuration.height + 'px';
	grid.gridDiv.style.width = configuration.width + 'px';
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
	gridDiv.appendChild(cell);
};

protoGrid.calcRowHeight = function() {
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		lenConf = config && config.length,
		height = configuration && configuration.height,
		width = configuration && configuration.width,
		dimension = configuration && configuration.dimension,
		defaultH = height / dimension[1],
		defaultW = width / dimension[0],
		i,
		j,
		row,
		rowNo,
		heightArr = [],
		maxHeight,
		endRow,
		startRow,
		currHeight,
		isRowArray;
	for(k = 0; k < dimension[1]; k++) {
		maxHeight = 0;
		for(i = 0; i < lenConf; i++) {
			row = config[i].row;
			currHeight = config[i].height;
			isRowArray = Array.isArray(row);
			if (currHeight){
				rowNo = (isRowArray && row.length) || 1;				
				startRow = (isRowArray && row[0] || row) - 1;
				if (startRow === k && rowNo === 1){
					maxHeight = maxHeight < currHeight ? currHeight : maxHeight;
				}
				endRow = (isRowArray && row[row.length - 1] || row) - 1;
				if(endRow === k && heightArr[endRow - rowNo -1]) {
					currHeight = grid.getDiff(heightArr, k, currHeight);
					maxHeight = maxHeight < currHeight ? currHeight : maxHeight;				
				}
			}
		}
		heightArr[k] = (maxHeight != 0) ? maxHeight : defaultH;
	}
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
		isColArray;
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
				if(endCol === k && widthArr[endCol - colNo -1]) {
					currWidth = grid.getDiff(widthArr, k, currWidth);
					maxWidth = maxWidth < currWidth ? currWidth : maxWidth;
				}
			}
		}
		widthArr[k] = (maxWidth != 0) ? maxWidth : defaultW;
	}
	console.log(widthArr)
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
		gridHeightArr = grid && grid.calcRowHeight(),
		gridWidhtArr = grid && grid.calcColWidth(),
		managerObj = [],
		gridPosX = grid.gridPosX = grid.getPos(gridWidhtArr),
		gridPosY = grid.gridPosY = grid.getPos(gridHeightArr),
		i = 0,
		isRowArr,
		isColArr,
		col,
		row,
		top,
		left,
		height,
		width;
		
		for(i; i < lenConf; i++){
			row = config[i].row;
			col = config[i].col;
			
			isColArr = Array.isArray(col);
			isRowArr = Array.isArray(row);
			
			top = gridPosY[(isRowArr ? Math.min.apply(null,row) : row)-1];
			left = gridPosX[(isColArr ? Math.min.apply(null,col) : col)-1];
			height = gridPosY[(isRowArr ? Math.max.apply(null,row) : row)] - top;
			width = gridPosX[(isColArr ? Math.max.apply(null,col) : col)] - left;
			
			managerObj.push({
				top : top,
				left : left,
				height : height,
				width : width
			});
		}

		return managerObj;
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
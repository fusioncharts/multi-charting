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
		cellH = configuration.height / configuration.dimension[1],
		cellW = configuration.width / configuration.dimension[0],
		className = '';		
	for(i = 0; i < configuration.dimension[1]; i++){
		className = '';
		for (j = 0; j < configuration.dimension[0]; j++) {
			className = (j + 1) + '' + (i + 1);
			this.drawDiv({
				'height' : cellH,
				'width' : cellW,				
			}, className);
		}
	}
};

protoGrid.drawDiv = function(configuration,className) {
	var grid = this,
		cell = document.createElement('div'),
		gridDiv = grid && grid.gridDiv;
	cell.className = (configuration.purpose) || '' + ' cell ' + (className || '');
	cell.style.height = configuration.height + 'px';
	cell.style.width = configuration.width + 'px';
	gridDiv.appendChild(cell);
};

protoGrid.gridManager = function(){
	console.log(this.configuration)
	var grid = this,
		configuration = grid && grid.configuration,
		config = configuration && configuration.config,
		lenConf = config.length,
		i,
		rowNo,
		colNo,
		row,
		col,
		isRowArray,
		isColArray,
		cell,
		className = '',
		cellH = configuration.height / configuration.dimension[1],
		cellW = configuration.width / configuration.dimension[0];
	for(i = 0; i < lenConf; i++){
		row = config[i].row;
		isRowArray = Array.isArray(row);
		rowNo = isRowArray ? row.length : 1;
		col = config[i].col;
		isColArray = Array.isArray(col);
		colNo =  isColArray ? col.length : 1;
		for (k = 1; k <= rowNo; k++) {
			if (k == 1) {
				className = (isColArray ? col[0] : col) + '' + (isRowArray ? row[0] : row);
				cell = document.getElementsByClassName(className)[0];
				cell.style.width = cellW * colNo + 'px';
				cell.style.height =cellH * rowNo + 'px';
				cell.style.outline = '1px solid #ff0000';
			}	
			for(l = 2; l <= colNo && isColArray; l++) {
				className = col[l - 1] + '' + (isRowArray ? row[k - 1] : row);
				cell = document.getElementsByClassName(className)[0];	
				cell.style.display = 'none';
			}

		}
	}
};

(function(){
	var configuration = {
        dimension : [2,2],
        height : 600,
        width : 600,
        config : [{
            'row':1,
            'col':1,
            'height' : 100,
            'width' : 100,
            'purpose' : 'chart'
        },
        {
            'row':1,
            'col':2,
            'height' : 100,
            'width' : 100,
            'purpose' : 'chart'
        },
        {
            'row':2,
            'col':1,
            'height' : 50,
            'width' : 100,
            'purpose' : 'chart'
        }]
    };	
	var g = new Grid('grid', configuration);
	g.draw();
	g.gridManager();
}());
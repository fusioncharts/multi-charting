fs = require('fs');

var START_YEAR = 1971,
	END_YEAR = 2250,
	dt = [],
	val = [],
	start = new Date(START_YEAR + '-01-01').getTime(),
	length = (END_YEAR - START_YEAR) * 365;


for (var i = 0; i <= length; i++) {
	D = new Date(start + (86400000 * i));
	date = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate();
	min = i + 100;
	max = i + 110;
	value = Math.round(min + (Math.random() * max - min));

	// val += value + ", ";
	// dt += '"' + date + '", ';
	val.push(value);;
	dt.push(date);
}

console.log('Total number of data points: ', i);


data = {
    "chart": {
        "axes": [
            {
                "x": {},
                "y": {}
            }
        ],
        "datasets": [
            {
                "category": {
                    "dateformat": "%Y-%m-%e",
                    "data": dt
                },
                "dataset": [
                    {
                        "uid": "ds-1",
                        "series": [{
                            "plottype": "line",
                            // "plottype": "column",
                            "name": "Series 1",
                        	data: val
                        }]
                    }
                ]                
            }
        ]
    }
};


fs.writeFileSync('test/tsdata.js', 'var dataObj = ' + JSON.stringify(data, null, 4));
// fs.writeFileSync('test/tsdata.json', JSON.stringify(data, null, 4));

// console.log(val);
// console.log(dt);

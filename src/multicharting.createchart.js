 /* global FusionCharts: true */

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

   // var FusionCharts = MultiCharting.prototype.win.FusionCharts;

    var Chart = function () {
            var chart = this,
                argument = arguments[0] || {};

            chart.dataStoreJson = argument.configuration.getDataJson();
            chart.dimension = argument.configuration.getDimension();
            chart.render(arguments[0]);
        },
        chartProto = Chart.prototype,
        extend2 = MultiCharting.prototype.lib.extend2;

    chartProto.render = function () {
        var chart = this,
            argument = arguments[0] || {};

        //get fc supported json            
        chart.getJSON(argument);        
        //render FC 
        chart.chartObj = new FusionCharts(chart.chartConfig);
        chart.chartObj.render();

        chart.chartObj.addEventListener('dataplotrollover', function (e, d) {
            var dataRow = getRowData(chart.dataStoreJson, chart.dimension, d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataRow
            }, chart);
        });
    };

    chartProto.getJSON = function () {
        var chart = this,
            argument =arguments[0] || {},
            configuration,
            chartConfig = {},
            dataSource = {},
            configData = {};
        //parse argument into chartConfig 
        extend2(chartConfig,argument);
        
        //data configuration 
        configuration = argument.configuration || {};

        //store fc supported json to render charts
        dataSource = configuration.getFCjson();

        //delete data configuration parts for FC json converter
        delete chartConfig.configuration;
        
        //set data source into chart configuration
        chartConfig.dataSource = dataSource;
        chart.chartConfig = chartConfig;        
    };

    chartProto.update = function () {
        var chart = this,
            argument =arguments[0] || {};

        chart.getJSON(argument);
        chart.chartObj.chartType(chart.chartConfig.type);
        chart.chartObj.setJSONData(chart.chartConfig.dataSource);
    };

    function getRowData (data, dimension, key) {
        var i = 0,
            j = 0,
            lenR,
            len,
            isArray = Array.isArray(data[0]),
            index = -1,
            keys,
            row = [];
    
        for(lenR = data.length; i < lenR; i++) {
            isArray && (index = data[i].indexOf(key));
            if(index !== -1 && isArray) {
                return data[i];
            }
            if(!isArray && data[i][dimension] == key) {
                keys = Object.keys(data[i]);                
                for (j = 0, len = keys.length; j < len; j++) {
                    row[j] = data[i][keys[j]];
                }
                return row;
            }
        }
    
    }

    MultiCharting.prototype.createChart = function () {
        return new Chart(arguments[0]);
    };
});
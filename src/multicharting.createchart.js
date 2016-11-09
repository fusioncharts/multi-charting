
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

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== "undefined") {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    MultiCharting.prototype.createChart = function () {
        return new Chart(arguments);
    };

    var Chart = function () {
            var chart = this;
            chart.render(arguments);
        },
        chartProto = Chart.prototype;

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
        configData.jsonData = chartConfig.dataStore;
        configData.callbackFN = configuration.callback;
        configData.config = configuration.data;

        //store fc supported json to render charts
        dataSource = this.dataadapter(configData);

        //delete data configuration parts for FC json converter
        delete chartConfig.dataStore;
        delete chartConfig.configuration;
        
        //set data source into chart configuration
        chartConfig.dataSource = dataSource;
        chart.chartObj = chartConfig;
        //render FC 
        FusionCharts.ready(function () {
            var chart = new FusionCharts(chartConfig);
            chart.render();
        });
    };
});

(function (factory) {
    if (typeof module === 'object' && typeof module.exports !== 'undefined') {
        module.exports = factory;
    } else {
        factory(MultiCharting);
    }
})(function (MultiCharting) {

    var MAX_PERCENT = '100%',
        /*createChart = MultiCharting.prototype.createChart,*/
        dataAdapter = MultiCharting.prototype.dataAdapter,
        Chart = function(conf) {
            var chart = this,
                dataAdapterConf = {},
                dataAdapterObj = {},
                createChartObj = {};

            chart.conf = conf;

            dataAdapterConf = {
                'dimension' : conf.dimension,
                'measure' : conf.measure,
                'seriesType' : conf.seriesType,
                'categories' : conf.categories,
                'aggregateMode' : conf.aggregation,
                'config' : conf.config
            }
            dataAdapterObj = dataAdapter(conf.dataSource, dataAdapterConf, conf.callback);

            chart.dataAdapter = dataAdapterObj;

            createChartConf = {
                'type' : conf.type,
                'width' : conf.width || MAX_PERCENT,
                'height' : conf.height || MAX_PERCENT,
                'dataSource' : dataAdapterObj._getFCjson()
            };

            chart.chartInstance = chart._createChart(createChartConf);

        },
        protoChart = Chart.prototype;

    protoChart._createChart = function (json) {
        var chart = this,
            chartObj;

        //render FC 
        chartObj = new FusionCharts(json);
        // chart.chartObj.render();
        
        chartObj.addEventListener('dataplotrollover', function (e, d) {
            var dataObj = chart._getRowData(d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataObj,
                categoryLabel : d.categoryLabel
            }, chart);
        });

        return chartObj;
    };

    protoChart.draw = function(id) {
        var chart = this;

        id || chart.chartInstance.render();
        id && chart.chartInstance.render(id);
    };

    protoChart._chartUpdate = function(json){
        var chart = this,
        chartJson = json || {};

        if(chart.chartInstance.chartType() != chartJson.type) {
            chart.chartInstance.chartType(chartJson.type);
        }

        chart.chartInstance.setJSONData(chartJson.dataSource);
        
        return chart;
    };

    protoChart._getRowData = function(key) {
        var chart = this,
            i = 0,
            j = 0,
            k,
            kk,
            l,
            lenR,
            len,
            lenC
            data = chart.dataAdapter._getDataJson(),
            aggregatedData = chart.dataAdapter._getAggregatedData(),
            dimension = chart.dataAdapter._getAggregatedData(),
            measure = chart.dataAdapter._getMeasure(),
            isArray = Array.isArray(data[0]),
            index = -1,
            matchObj = {},
            indexOfDimension = aggregatedData[0].indexOf(dimension[0]);
    
        for(lenR = data.length; i < lenR; i++) {
            isArray && (index = data[i].indexOf(key));
            if(index !== -1 && isArray) {
                for(l = 0, lenC = data[i].length; l < lenC; l++){
                    matchObj[data[0][l]] = data[i][l];
                }
                for(j = 0, len = measure.length; j < len; j++) {
                    index = aggregatedData[0].indexOf(measure[j]);
                    for (k = 0, kk = aggregatedData.length; k < kk; k++) {
                        if(aggregatedData[k][indexOfDimension] == key) {
                            matchObj[measure[j]] = aggregatedData[k][index];
                        }
                    }
                }
                return matchObj;
            }

            if(!isArray && data[i][dimension[0]] == key) {
                matchObj = data[i];

                for(j = 0, len = measure.length; j < len; j++) {
                    index = aggregatedData[0].indexOf(measure[j]);
                    for (k = 0, kk = aggregatedData.length; k < kk; k++) {
                        if(aggregatedData[k][indexOfDimension] == key) {
                            matchObj[measure[j]] = aggregatedData[k][index];
                        }
                    }
                }
                return matchObj;
            }
        }
    };

    MultiCharting.prototype.chart = function (config) {
        return new Chart(config);
    };
});

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
                createChartObj = {},
                dataStore;

            chart.conf = {};

            Object.assign(chart.conf, conf);

            dataAdapterConf = {
                'dimension' : chart.conf.dimension,
                'measure' : chart.conf.measure,
                'seriesType' : chart.conf.seriesType,
                'categories' : chart.conf.categories,
                'aggregateMode' : chart.conf.aggregation,
                'config' : chart.conf.config
            }

            chart.dataAdapter = dataAdapter(conf.dataSource, dataAdapterConf, conf.callback);

            dataStore = chart.dataAdapter._getDataStore();

            dataStore.addEventListener('dataModified',function() {
                protoChart.update();
            })

            createChartConf = {
                'type' : chart.conf.type,
                'width' : chart.conf.width || MAX_PERCENT,
                'height' : chart.conf.height || MAX_PERCENT,
                'dataSource' : dataAdapterObj.getJSON()
            };

            chart.chartInstance = chart._createChart(createChartConf);

        },
        protoChart = Chart.prototype;

    protoChart._createChart = function (json) {
        var chart = this,
            chartObj;

        //render FC 
        chartObj = new FusionCharts(json);

        chartObj.addEventListener('dataplotrollover', function (e, d) {
            var dataObj = chart._getRowData(d.categoryLabel);
            MultiCharting.prototype.raiseEvent('hoverin', {
                data : dataObj,
                categoryLabel : d.categoryLabel
            }, chart);
        });

        return chartObj;
    };

    protoChart.update = function(conf){
        var chart = this,
            dataAdapterConf = {},
            dataAdapterObj = {},
            createChartObj = {};

        Object.assign(chart.conf, conf);

        dataAdapterConf = {
            'dimension' : chart.conf.dimension,
            'measure' : chart.conf.measure,
            'seriesType' : chart.conf.seriesType,
            'categories' : chart.conf.categories,
            'aggregateMode' : chart.conf.aggregation,
            'config' : chart.conf.config
        }

        chart.dataAdapter.update(conf.dataSource, dataAdapterConf, conf.callback);

        createChartConf = {
            'type' : chart.conf.type,
            'width' : chart.conf.width || MAX_PERCENT,
            'height' : chart.conf.height || MAX_PERCENT,
            'dataSource' : chart.dataAdapter.getJSON()
        };

        chart._chartUpdate(createChartConf);
    };

    protoChart.getChartInstance = function() {
        return this.chartInstance;
    }

    protoChart.render = function(id) {
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
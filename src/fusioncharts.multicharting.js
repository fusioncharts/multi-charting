// (fucntion (MC) {
// 	if (!MC) {
// 		return;
// 	}
// })(MC)

var multiCharting = function () {
	},

	multiProto = multiCharting.prototype;

multiProto.createDataStore = function () {
	return new dataStorage(arguments);
};

multiProto.createDataProcessor = function () {
	return new dataProcessor(arguments);
}

multiProto.createChart = function () {
	var argument = arguments && arguments[0],
		chartType = argument && argument.type,
		container = argument && argument.container,
		configuration = argument && argument.configuration,
		callbackFN = argument && argument.callbackFN,
		DATA = argument && argument.dataStore,
		chartConfig = {},
		dataSource = {};
	dataSource = convertData(DATA, configuration, callbackFN);
	chartConfig.type = chartType;
	chartConfig.renderAt = container;
	chartConfig.dataFormat = 'json';
	chartConfig.dataSource = dataSource
	FusionCharts.ready(function () {
	    var chart = new FusionCharts(chartConfig);
	    chart.render();
	});
};
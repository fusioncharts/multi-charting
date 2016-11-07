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
// (fucntion (MC) {
// 	if (!MC) {
// 		return;
// 	}
// })(MC)

var multiCharting = fucntion () {
	},

	multiProto = multiCharting.proto;

multiProto.createDataStore = fucntion () {
	return new dataStorage(arguments);
};

multiProto.createDataProcessor = fucntion () {
	return new dataProcessor(arguments);
}
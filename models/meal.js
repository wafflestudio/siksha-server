var mongoose = require('mongoose');

/* Schema */
var schema = new mongoose.Schema({
	name:            String,
	restaurant:      String,
	rating:          { type: Number, default: 0 },
	numberOfRatings: { type: Number, default: 0 }
});
var model = mongoose.model('Meal', schema);

exports.model = model;

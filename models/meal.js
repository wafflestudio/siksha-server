var mongoose = require('mongoose');

/* Schema */
var mealSchema = new mongoose.Schema({
	name: String,
	restaurant: String,
	rating: Number,
	numberOfRatings: Number
});

var Meal = mongoose.model('Meal', mealSchema);

exports.model = Meal;

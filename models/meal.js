var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* Schema */
var mealSchema = new Schema({
	name:            String,
	restaurant:      String,
	rating:          { type: Number, default: 0 },
	numberOfRatings: { type: Number, default: 0 }
});

var Meal = mongoose.model('Meal', mealSchema);

exports.model = Meal;

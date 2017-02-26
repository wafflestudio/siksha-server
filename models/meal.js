var mongoose = require('mongoose')

// mongodb connection
var dbUri = 'mongodb://localhost/meal'
var db = mongoose.createConnection(dbUri)
db.on('error', console.error.bind(console, 'connection error:'))

/* Schema */
var mealSchema = new mongoose.Schema({
  name: String,
  restaurant: String,
  rating: {
    type: Number,
    default: 0
  },
  numberOfRatings: {
    type: Number,
    default: 0
  }
})
var Meal = db.model('Meal', mealSchema)

module.exports = Meal

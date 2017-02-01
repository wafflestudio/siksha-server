var mongoose = require('mongoose')

// mongodb connection
var dbUri = 'mongodb://localhost/restaurant'
var db = mongoose.createConnection(dbUri)
db.on('error', console.error.bind(console, 'connection error:'))
/* Schema */
var schema = new mongoose.Schema({
  name: String,
  operatingHour: String,
  location: String
})
var model = db.model('Restaurant', schema)

exports.model = model

var mongoose = require('mongoose');

/* Schema */
var schema = new mongoose.Schema({
    name: String,
    operatingHour: String,
    location: String
});
var model = mongoose.model('Restaurant', schema);

exports.model = model;

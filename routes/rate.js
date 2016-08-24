/**
 * Wednesday, August 24, 2016
 * Ilhyun Jo
 * 
 * define http verbs for rating a meal
 * 
 * Only implement rating here. Implement retrieving ratings in menu.js to prevent redundant
 * mongoose.connect from happening.
 * 
 * TODO: Handle errors for when meal for Meal.findOne doesn't exist
 * TODO: Create meal data for mongodb when creating menu. 
 * */

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Meal = require('../models/meal.js').model;


router.get('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
//	var rating = Meal.findOne({ restaurant: req.params.restaurant, meal: req.params.meal }).;
	db.once('open', function () {
		res.render('meal', { meal: req.params.meal, restaurant: req.params.restaurant,
			rating: Meal.findOne({ restaurant: req.params.restaurant, meal: req.params.meal }, function (error, meal) {
				if(error) console.error.bind(console, 'non existing meal error:');
				else return meal.rating;
			};)
		});
	});
});
		
router.put('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		Meal.findOne({ restaurant: req.params.restaurant, meal: req.params.meal }, function(error, meal) {
			if(error) console.error.bind(console. 'non existing meal error:');
			else {
				meal.rating = (meal.numberOfRatings * meal.rating + req.body.rating) / (meal.numberOfRatings + 1);
				meal.numberOfRatings.$inc();
				meal.save();
			}
		});
	});
});





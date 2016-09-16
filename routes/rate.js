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

router.get('/', function (req, res, next) {
	console.log('Time', Date.now());
	next();
}, function (req, res) {
	res.render('index', { title: 'Meal rate' });
});

/*router.get('/:restaurant', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');

	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));

	db.once('open', function() {
		res.render('index', { title: req.params.restaurant });
	});
});*/

router.get('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
//	var rating = Meal.findOne({ restaurant: req.params.restaurant, meal: req.params.meal }).;
	db.on('open', function () {
		res.render('meal', { meal: req.params.meal, restaurant: req.params.restaurant,
			rating: Meal.findOne({ restaurant: req.params.restaurant, meal: req.params.meal }, function (error, meal) {
				if(error) console.error.bind(console, 'non existing meal error:');
				else return meal.rating;
			})
		});
	});
});

router.post('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		Meal.findOne({ name: req.params.meal, restaurant: req.params.restaurant}, function (err, meal) {
			var rating;
			if(!meal) {
				console.log("inside meal == null 1");
				var newMeal = new Meal({
					name: req.params.meal,
					restaurant: req.params.restaurant,
					rating: req.body.rating,
					numberOfRatings: '1'
				});
				console.log("inside meal == null 2");
				newMeal.save( function( err, meal) {
					if(err) return console.error(err);
					console.dir(meal);
					db.disconnect();
				});
				console.log("inside meal == null 3");
				rating = newMeal.rating;
			} else {
				console.log("inside else 1");
				console.dir("on top" + meal.numberOfRatings * meal.rating + req.body.rating);
				console.dir("on bottome" + meal.numberOfRatings + 1);
				meal.rating = (Number(meal.numberOfRatings) * Number(meal.rating) + Number(req.body.rating)) / (Number(meal.numberOfRatings) + 1);
				meal.numberOfRatings += 1;
				meal.save(function (err, meal) {
					if(err) return console.error(err);
					console.dir(meal);
					db.disconnect();
				});
				console.log("inside else 2");
				rating = meal.rating;
			}
			console.log("before json");
			res.json( { rating: rating } );
			console.log("after json");
		});
	});
});

module.exports = router;
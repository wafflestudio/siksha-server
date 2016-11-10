/**
 * Wednesday, August 24, 2016
 * Ilhyun Jo
 * 
 * define http verbs for rating a meal and retrieving rating info
 * 
 * TODO: Make some better names for routes 
 **/

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Meal = require('../models/meal.js').model;
var menu = require('../menu.js');

router.get('/all', function (req, res) {
	var db = mongoose.connect('mongodb://localhost/meal').connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Meal.find(function(error, mealList) {
			if(error) console.error.bind(console, 'connection error:');
			else res.send(mealList);
			mongoose.disconnect();
		});;
	});
});

router.get('/view', function (req, res) {
	db = mongoose.connect('mongodb://localhost/meal').connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		menu.crawl(req.query.date, function(resultString) {
			var result = JSON.parse(resultString);
			var menuDict = {};
			var menuNames = [];
			var ratedMenu = [];
			for(var i in result.data) {
				var restaurant = result.data[i];
				for(var j in restaurant.foods) {
					var meal = restaurant.foods[j];
					menuNames.push(meal.name);
					if(meal.name in menuDict) {
						menuDict[meal.name].push(restaurant.restaurant);
					} else {
						menuDict[meal.name] = [restaurant.restaurant];
					}
				}
			}
			Meal.find({ name: {$in: menuNames} }, function (error,doc) {
				if(error) console.error.bind(console, 'Meal.findOne error:');
				else { 
					for(var k in doc) {
						if(menuDict[doc[k].name].contains(doc[k].restaurant)) {
							ratedMenu.push(doc[k]);
						}
					}
					for(var l in ratedMenu) {
						var ratedMeal = ratedMenu[l];
						if(result.data.indexOfRestaurant(ratedMeal.restaurant) > -1) {
							var foodArray = result.data[result.data.indexOfRestaurant(ratedMeal.restaurant)].foods;
							var unratedMealList = foodArray.sublistOfFoodNamed(ratedMeal.name);
							for(var m in unratedMealList) {
								console.log("unratedMealList[m] = " + unratedMealList[m].name +"//type:" + typeof(unratedMealList[m]));
								var unratedMeal = unratedMealList[m];
								unratedMeal["rating"] = ratedMeal.rating;
							}
						}
					}
					res.send(result);
					mongoose.disconnect();
				}
			});
		});
	});
});

Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {
		if (this[i] == obj) {
			return true;
		}
	}
	return false;
}

Array.prototype.indexOfRestaurant = function(restaurantName) {
	for (var i in this) {
		if (this[i].restaurant === restaurantName) {
			return i;
		}
	}
	return -1;
}

Array.prototype.sublistOfFoodNamed = function(foodName) {
	var foodList = [];
	for (var i in this) {
		if (this[i].name === foodName) {
			foodList.push(this[i]);
			console.log("this[i] = " + this[i].name + this[i].time);
		}
	}
	return foodList;
}

function indexRestaurant(str, list) {
	for (var i in list) {
		if (list[i].restaurant === str) {
			return i;
		}
	}
	return -1;
}

function indexFood(str, list) {
	for (var i in list) {
		if(list[i].name === str) {
			return i;
		}
	}
	return -1;
}

router.get('/:restaurant', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Meal.find({ restaurant: req.params.restaurant }, function(error, mealList) {
			if(error) console.error.bind(console, 'Meal.find error:');
			else res.send(mealList);
			mongoose.disconnect();
		});
	});
});

router.get('/:restaurant/:meal', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.on('open', function () {
		var rating;
		var numberOfRatings;
		Meal.findOne({ name: req.params.meal, restaurant: req.params.restaurant }, function (error, meal) {
			if(error) console.error.bind(console, 'Meal.findOne error:');
			else if(!meal) { rating = 0; numberOfRatings = 0 }
			else { rating = meal.rating; numberOfRatings = meal.numberOfRatings }
			res.send({
				meal: req.params.meal,
				restaurant: req.params.restaurant,
				rating: rating,
				numberOfRatings: numberOfRatings
			});
			mongoose.disconnect();
		});
	});
});

router.post('/', function (req, res) {
	mongoose.connect('mongodb://localhost/meal');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		Meal.findOne({ name: req.body.meal, restaurant: req.body.restaurant}, function (err, meal) {
			var rating;
			if(!meal) {
				var newMeal = new Meal({
					name: req.body.meal,
					restaurant: req.body.restaurant,
					rating: req.body.rating,
					numberOfRatings: '1'
				});
				newMeal.save( function( err, meal) {
					if(err) return console.error(err);
					console.dir(meal);
					mongoose.disconnect();
				});
				rating = newMeal.rating;
			} else {
				meal.rating = (Number(meal.numberOfRatings) * Number(meal.rating) + Number(req.body.rating)) / (Number(meal.numberOfRatings) + 1);
				meal.numberOfRatings += 1;
				meal.save(function (err, meal) {
					if(err) return console.error(err);
					mongoose.disconnect();
				});
				rating = meal.rating;
			}
			res.json( { rating: rating } );
		});
	});
});

module.exports = router;

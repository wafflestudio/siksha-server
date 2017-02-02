/**
 * Wednesday, August 24, 2016
 * Ilhyun Jo
 *
 * define http verbs for rating a meal and retrieving rating info
 **/

var express = require('express')
var router = express.Router()
var Meal = require('../models/meal')
var menu = require('../menu')

router.get('/all', function (req, res, next) {
  Meal.find(function (error, meals) {
    if (error) {
      return next(error)
    } else {
      return res.send(meals)
    }
  })
})

router.get('/view', function (req, res, next) {
  if (!req.query.date) {
    var err = new Error('Date missing from query')
    err.status = 401
    return next(err)
  }
  menu.crawl(req.query.date, function (resultString) {
    var result = JSON.parse(resultString)
    var menus = []
    for (var i in result.data) {
      var restaurant = result.data[i]
      for (var j in restaurant.foods) {
        var meal = restaurant.foods[j]
        menus.push({
          meal: meal,
          restaurant: restaurant.restaurant
        })
      }
    }
    Meal.find(function (error, meals) {
      if (error) {
        return next(error)
      }
      for (var i in meals) {
        for (var j in menus) {
          if (meals[i].name === menus[j].meal.name && meals[i].restaurant === menus[j].restaurant) {
            menus[j].meal.rating = meals[i].rating
            menus[j].meal.numberOfRatings = meals[i].numberOfRatings
          }
        }
      }
      return res.send(result)
    })
  })
})

router.get('/restaurant/:restaurant', function (req, res, next) {
  var restaurant = unescape(req.params.restaurant)
  Meal.find({ restaurant: restaurant }, function (error, meals) {
    if (error) {
      return next(error)
    } else {
      return res.send(meals)
    }
  })
})

router.get('/restaurant/:restaurant/meal/:meal', function (req, res, next) {
  var restaurant = unescape(req.params.restaurant)
  var meal = unescape(req.params.meal)
  Meal.findOne({ name: meal, restaurant: restaurant }, function (error, meal) {
    if (error) {
      return next(error)
    } else {
      return res.send(meal)
    }
  })
})

router.post('/', function (req, res, next) {
  if (!req.body.key || req.body.key !== 'siksha1996') {
    var err = new Error('Need correct api key')
    err.status = 401
    return next(err)
  }
  if (req.body.meal && req.body.restaurant && req.body.rating) {
    Meal.findOne({ name: req.body.meal, restaurant: req.body.restaurant }, function (error, meal) {
      if (error) {
        return next(error)
      }
      if (!meal) {
        new Meal({
          name: req.body.meal,
          restaurant: req.body.restaurant,
          rating: req.body.rating,
          numberOfRatings: '1'
        }).save(function (error, meal) {
          if (error) {
            return next(error)
          }
        })
      } else {
        meal.rating = (Number(meal.numberOfRatings) * Number(meal.rating) + Number(req.body.rating)) / (Number(meal.numberOfRatings) + 1)
        meal.numberOfRatings += 1
        meal.save(function (error, meal) {
          if (error) {
            return next(error)
          }
        })
      }
      return res.end('Rating successful')
    })
  } else {
    var err = new Error('Missing data from form')
    err.status = 401
    return next(err)
  }
})

module.exports = router

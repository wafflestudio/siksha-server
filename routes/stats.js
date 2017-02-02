var express = require('express')
var router = express.Router()
var Meal = require('../models/meal')
var menu = require('../menu')

router.get('/all', function (req, res, next) {
  if (!req.query.rank) {
    var err = new Error('Ranking is missing from query')
    err.status = 401
    return next(err)
  } else {
    var ranking = req.query.rank
    Meal.find({}, { _id: 0, __v: 0 }, function (error, meals) {
      if (error) {
        return next(error)
      } else {
        return res.send(meals[0])
      }
    }).sort({ rating: -1, _id: 1 }).skip(ranking-1).limit(1)
  }
})
router.get('/:date', function (req, res, next) {
  var menus = []
  if (req.params.date === 'today' || req.params.date === 'tomorrow') {
    if (!req.query.rank) {
      var err = new Error('Ranking is missing from query')
      err.status = 401
      return next(err)
    } else {
      var ranking = req.query.rank
      menu.crawl(req.params.date, function (resultString) {
        var result = JSON.parse(resultString)
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
        Meal.find({}, { _id: 0, __v: 0 }, function (error, meals) {
          if (error) {
            return next(error)
          } else {
            for (var i in meals) {
              for (var j in menus) {
                if (meals[i].name === menus[j].meal.name && meals[i].restaurant === menus[j].restaurant) {
                  return res.send(meals[0])
                }
              }
            }
            var err = new Error('Rank number out of range')
            err.status = 400
            return next(err)
          }
        }).sort({ rating: -1 }).skip(ranking-1).limit(1)
      })
    }
  } else {
    var err = new Error('Date parameter form is wrong')
    err.status = 400
    return next(err)
  }
})

module.exports = router

var xml2js = require('xml2js')
var parser = new xml2js.Parser()
var fs = require('fs')
var moment = require('moment')

var mongoose = require('mongoose')
var Bluebird = require('bluebird')

var Restaurant = require('./models/restaurant.js').model

function updateInformation (callback) {
  Restaurant.find(function (find_error, restaurants) {
    var removeTasks = []
    for (var i = 0; i < restaurants.length; i++) {
      removeTasks.push(restaurants[i].remove())
    }

    Bluebird.all(removeTasks).then(function () {
      var data = fs.readFileSync(__dirname + '/public/information.xml', 'utf8')
      parser.parseString(data, function (parse_error, body) {
        if (!parse_error) {
          var information = body['information']
          var names = information['name'][0]['item']
          var operatingHours = information['operating_hour'][0]['item']
          var locations = information['location'][0]['item']
          var saveTasks = []
          for (var i = 0; i < names.length; i++) {
            var restaurant = new Restaurant({
              name: names[i],
              operatingHour: operatingHours[i],
              location: locations[i]
            })
            saveTasks.push(restaurant.save())
          }
          Bluebird.all(saveTasks).then(function (elements) {
            var result = { time: moment(new Date()).format('YYYY-MM-DD HH:mm'), data: elements }
            fs.writeFileSync(__dirname + '/public/jsons/information.json', JSON.stringify(result))
            callback(true)
          }, function (db_error) {
            callback(false)
          })
        }
      })
    }, function (db_error) {
      callback(false)
    })
  })
}

function viewInformation (callback) {
  fs.readFile(__dirname + '/public/jsons/information.json', {encoding: 'utf8'}, function (error, data) {
    if (!error) {
      callback(JSON.parse(data))
    } else {
      Restaurant.find(function (db_error, restaurants) {
        var result = {time: moment(new Date()).format('YYYY-MM-DD HH:mm'), data: restaurants}
        fs.writeFileSync(__dirname + "/public/jsons/information.json", JSON.stringify(result))
        callback(result)
      })
    }
  })
}

function getLatestTime () {
  var data = fs.readFileSync(__dirname + '/public/jsons/information.json', 'utf8')
  return { latest: JSON.parse(data).time }
}

module.exports = {
  view: function (callback) {
    viewInformation(function (result) {
      callback(result)
    })
  },
  update: function (callback) {
    updateInformation(function (success) {
      callback(success)
    })
  },
  latest: function (callback) {
    callback(getLatestTime())
  }
}

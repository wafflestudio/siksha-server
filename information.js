var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var fs = require('fs');
var moment = require('moment');

var mongoose = require('mongoose');
var promise = require('bluebird');

var Restaurant = require('./models/restaurant.js').model;

function updateInformations(callback) {
    mongoose.connect('mongodb://localhost/restaurant');
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() { 
        Restaurant.find(function(find_error, restaurants) {
            var removeTasks = [];
            for (var i = 0; i < restaurants.length; i++)
                removeTasks.push(restaurants[i].remove());  
            
            promise.all(removeTasks).then(function() {
                var data = fs.readFileSync(__dirname + '/public/informations.xml', 'utf8');                    
                parser.parseString(data, function(parse_error, body) {
                    if (!parse_error) {
                        var informations = body["informations"];
                        var names = informations["names"][0]["item"];
                        var operatingHours = informations["operating_hours"][0]["item"];
                        var locations = informations["locations"][0]["item"];

                        var saveTasks = [];
                        for (var i = 0; i < names.length; i++) {
                            var restaurant = new Restaurant({
                                name: names[i],
                                operatingHour: operatingHours[i],
                                location: locations[i]
                            }); 
                            saveTasks.push(restaurant.save());
                        }

                        promise.all(saveTasks).then(function(elements) {
                            var result = { time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: elements }; 
                            fs.writeFileSync(__dirname + "/public/jsons/informations.json", JSON.stringify(result));
                            mongoose.disconnect();
                            callback(result);
                        }, function(db_error) {
                            mongoose.disconnect();
                            callback(db_error);
                        });
                    }
                });         
            }, function(db_error) {
                mongoose.disconnect();
                callback(db_error);
            });
        });
    });
}

function viewInformations(callback) {
    fs.readFile(__dirname + "/public/jsons/informations.json", { encoding: "utf8" }, function(error, data) {
        if (!error) {
            callback(JSON.parse(data));
        }
        else {
            mongoose.connect('mongodb://localhost/restaurant');
            var db = mongoose.connection;

            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function() {
                Restaurant.find(function(db_error, restaurants) {
                    var result = { time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: restaurants };
                    fs.writeFileSync(__dirname + "/public/jsons/informations.json", JSON.stringify(result));
                    mongoose.disconnect();
                    callback(result);
                });
            });
        }
    });
}

function getLatestTime() {
    var data = fs.readFileSync(__dirname + "/public/jsons/informations.json", "utf8");
    return JSON.parse(data).time;
}

module.exports = {
    view: function(callback) {
        viewInformations(function(result) {
            callback(result);
        });
    },
    update: function(callback) {
        updateInformations(function(result) {
            callback(result);
        });
    },
    latest: function(callback) {
        callback(getLatestTime());
    }
};

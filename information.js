var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var fs = require('fs');
var moment = require('moment');

var mongoose = require('mongoose');
var promise = require('bluebird');

/* Schema */
var restaurantSchema = mongoose.Schema({
    name: String,
    operating_hour: String,
    location: String
});
/* Model */
var Restaurant = mongoose.model('Restaurant', restaurantSchema);

function updateInformations(req, res) {
    mongoose.connect('mongodb://localhost/restaurant');
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback() { 
        Restaurant.find(function(find_error, restaurants) {
            var removeTasks = [];
            for (var i = 0; i < restaurants.length; i++)
                removeTasks.push(restaurants[i].remove());  
            
            promise.all(removeTasks).then(function() {
                var data = fs.readFileSync(__dirname + '/public/informations.xml', 'utf-8');                    
                parser.parseString(data, function(parse_error, body) {
                    if (!parse_error) {
                        var informations = body["informations"];
                        var names = informations["names"][0]["item"];
                        var operating_hours = informations["operating_hours"][0]["item"];
                        var locations = informations["locations"][0]["item"];

                        var saveTasks = [];
                        for (var i = 0; i < names.length; i++) {
                            var restaurant = new Restaurant({
                                name: names[i],
                                operating_hour: operating_hours[i],
                                location: locations[i]
                            }); 
                            saveTasks.push(restaurant.save());
                        }

                        promise.all(saveTasks).then(function(elements) {
                            var result = { time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: elements }; 
                            fs.writeFileSync(__dirname + "/public/jsons/informations.json", JSON.stringify(result));
                            res.send(result);
                            mongoose.disconnect();
                        }, function(db_error) {
                            res.send(db_error);
                            mongoose.disconnect();
                        });
                    }
                });         
            }, function(db_error) {
                res.send(db_error);
                mongoose.disconnect();
            });
        });
    });
}

function viewInformations(req, res) {
    fs.readFile(__dirname + "/public/jsons/informations.json", { encoding: "utf8" }, function(error, data) {
        if (!error) {
            res.send(data);
        }
        else {
            mongoose.connect('mongodb://localhost/restaurant');
            var db = mongoose.connection;

            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function callback() {
                Restaurant.find(function(db_error, restaurants) {
                    var result = { time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: restaurants };
                    fs.writeFileSync(__dirname + "/public/jsons/informations.json", JSON.stringify(result));
                    res.send(result);
                    mongoose.disconnect();
                });
            });
        }
    });
}

function getLatestTime(req, res) {
    fs.readFile(__dirname + "/public/jsons/informations.json", { encoding: "utf8" }, function(error, data) {
        res.send({ latest: JSON.parse(data).time });
    });
}

module.exports = {
    view: function(req, res, next) {
        viewInformations(req, res);
    },
    update: function(req, res, next) {
        updateInformations(req, res);
    },
    latest: function(req, res, next) {
        getLatestTime(req, res);
    }
};

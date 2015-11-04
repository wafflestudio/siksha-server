var iconv = require('iconv-lite');
var request = require('request');
var Bluebird = require('bluebird');
var cheerio = require('cheerio');
var fs = require('fs');
var moment = require('moment');

var name = require('./name.js');
var logger = require('./logger.js');

function getPrice(mark, time) {
    switch (mark) {
        case 'ⓐ':
            if (time === "breakfast")
                return "1000";
            else
                return "1700";
        case 'ⓑ':
        case "menu_a":
            return "2000";
        case 'ⓒ':
        case "menu_b":
            return "2500";
        case 'ⓓ':
        case "menu_c":
            return "3000";
        case 'ⓔ':
        case "menu_d":
            return "3500";
        case 'ⓕ':
        case "menu_e":
            return "4000";
        case 'ⓖ':
            return "4500";
        case 'ⓗ':
            return "5000";
        case 'ⓘ':
            return "5500";
        case 'ⓙ':
            return "6000";
        default:
            return "Error";
    }
}

function getTimeSlot(index) {
    if (index >= 0 && index < 2)
        return "breakfast";
    else if (index >= 2 && index < 5)
        return "lunch";
    else
        return "dinner";
}

function fetchNextSundayMenu(query, callback) {
    var options = {
        url: "http://dorm.snu.ac.kr/dk_board/facility/food.php?" + query,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
        },
        encoding: null
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(iconv.decode(body, "utf8"));
            var foods = [];

            for (var i = 0; i < 7; i++) {
                var tr = $("tbody").first().children().get(i);
                var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(0);
                var food = $(td).text().trim();
                var time = getTimeSlot(i);

                if (food !== "") {
                    var price = getPrice($(td).find("li").attr("class"), time);
                    foods.push({time: time, name: food, price: (price === "Error" ? "Etc" : price)});
                }
            }

            callback(foods);
        }
    });
}

function crawlGraduateRestaurant(flag, callback) {
    return new Bluebird(function (resolve) {
        var options = {
            url: "http://dorm.snu.ac.kr/dk_board/facility/food.php",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
            },
            encoding: null
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "utf8"));
                var todayIndex = new Date().getDay();

                if (todayIndex === 6 && flag === "tomorrow") {
                    var query = $("div.go").find("a[class=right]").attr("href").substring(11).trim();

                    fetchNextSundayMenu(query, function (data) {
                        resolve(callback({restaurant: "대학원 기숙사 식당", foods: data}));
                    });
                }
                else {
                    var foods = [];

                    for (var i = 0; i <= 6; i++) {
                        var tr = $("tbody").first().children().get(i);
                        var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
                        var food = $(td).text().trim();
                        var time = getTimeSlot(i);

                        if (food !== "") {
                            var price = getPrice($(td).find("li").attr("class"), time);
                            foods.push({time: time, name: food, price: (price === "Error" ? "Etc" : price)});
                        }
                    }

                    resolve(callback({restaurant: "대학원 기숙사 식당", foods: foods}));
                }
            }
        });
    });
}

function crawlSNUCORestaurants(flag, group, callback) {
    return new Bluebird(function (resolve) {
        var today = new Date();
        var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
        var query = flag === "today" ? "?date=" + moment(today).format("YYYY-MM-DD") : "?date=" + moment(tomorrow).format("YYYY-MM-DD");
        var options = {
            url: "http://www.snuco.com/html/restaurant/restaurant_menu" + (group === "directManagement" ? "1.asp" : "2.asp") + query,
            encoding: null
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "euc-kr"));
                var restaurants = name.getRawNames(group);
                var list = [];

                for (var i = 0; i < restaurants.length; i++) {
                    var foods = [];
                    var restaurant = restaurants[i];
                    var tr = $("table").find("tr:contains(" + restaurant + ")");
                    var breakfasts = tr.find("td:nth-child(3)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");
                    var lunches = tr.find("td:nth-child(5)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");
                    var dinners = tr.find("td:nth-child(7)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");

                    for (var j = 0; j < breakfasts.length; j++) {
                        var breakfast = breakfasts[j].trim();

                        if (breakfast !== "") {
                            var food = breakfast.substring(1).trim();
                            var price = getPrice(breakfast.charAt(0), "breakfast");

                            if (price === "Error") {
                                var token = breakfast.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;

                                if (regex.test(token)) {
                                    food = breakfast.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                foods.push({time: "breakfast", name: food, price: price});
                        }
                    }
                    for (var j = 0; j < lunches.length; j++) {
                        var lunch = lunches[j].trim();

                        if (lunch !== "") {
                            var food = lunch.substring(1).trim();
                            var price = getPrice(lunch.charAt(0), "lunch");

                            if (price === "Error") {
                                var token = lunch.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;

                                if (regex.test(token)) {
                                    food = lunch.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                foods.push({time: "lunch", name: food, price: price});
                        }
                    }
                    for (var j = 0; j < dinners.length; j++) {
                        var dinner = dinners[j].trim();

                        if (dinner !== "") {
                            var food = dinner.substring(1).trim();
                            var price = getPrice(dinner.charAt(0), "dinner");

                            if (price === "Error") {
                                var token = dinner.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;

                                if (regex.test(token)) {
                                    food = dinner.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                foods.push({time: "dinner", name: food, price: price});
                        }
                    }

                    list.push({restaurant: name.getName(restaurant), foods: foods});
                }

                resolve(callback(list));
            }
        });
    });
}

function crawlVetRestaurant(flag, callback) {
    return new Bluebird(function (resolve) {
        var options = {
            url: "http://vet.snu.ac.kr/kor/html/bbs/menu/index.jsp",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
            },
            encoding: null
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "utf8"));
                var todayIndex = new Date().getDay();
                var foods = [];

                if (todayIndex !== 0 && !(todayIndex === 6 && flag === "tomorrow")) {
                    var tbody = $("table[bgcolor=dddddd] > tbody");
                    var tr = $(tbody).children().get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
                    var lunchTd = $(tr).children().get(1);
                    var dinnerTd = $(tr).children().get(2);
                    var lunch = $(lunchTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();
                    var dinner = $(dinnerTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();

                    if (lunch !== "" && lunch !== "휴무") {
                        foods.push({time: "lunch", name: lunch, price: "Etc"});
                    }

                    if (dinner !== "" && dinner !== "휴무") {
                        foods.push({time: "dinner", name: dinner, price: "Etc"});
                    }
                }

                resolve(callback({restaurant: "85동 수의대 식당", foods: foods}));
            }
        });
    });
}

function combineCrawlingData(flag, callback) {
    var data = [];
    var graduate, vet, directManagements, consignments;

    Bluebird.all([
        crawlSNUCORestaurants(flag, "directManagement", function (data) {
            directManagements = data;
        }),
        crawlSNUCORestaurants(flag, "consignment", function (data) {
            consignments = data;
        }),
        crawlGraduateRestaurant(flag, function (data) {
            graduate = data;
        }),
        crawlVetRestaurant(flag, function (data) {
            vet = data;
        }),
    ]).then(function () {
        for (var i = 0; i < directManagements.length; i++) {
            data.push(directManagements[i]);
        }
        for (var i = 0; i < consignments.length; i++) {
            data.push(consignments[i]);
        }
        data.push(graduate);
        data.push(vet);

        callback({time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: data});
    });
}

function updateCrawlingData(callback) {
    Bluebird.all([
        new Bluebird(function (resolve, reject) {
            combineCrawlingData("today", function (data) {
                fs.writeFile(__dirname + "/public/jsons/today.json", JSON.stringify(data), function (error) {
                    if (error) {
                        logger.error("An error occurs while writing today data.");
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            });
        }),
        new Bluebird(function (resolve, reject) {
            combineCrawlingData("tomorrow", function (data) {
                fs.writeFile(__dirname + "/public/jsons/tomorrow.json", JSON.stringify(data), function (error) {
                    if (error) {
                        logger.error("An error occurs while writing tomorrow data.");
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            });
        })]).then(function (success) {
        callback(true);
    }, function (failure) {
        callback(false);
    });
}

module.exports = {
    crawl: function (query, callback) {
        if (!(query === "today" || query === "tomorrow")) {
            combineCrawlingData("today", function (data) {
                callback(data);
            });
        }
        else {
            var fileName = query === "today" ? "today.json" : "tomorrow.json";
            fs.readFile(__dirname + "/public/jsons/" + fileName, {encoding: "utf8"}, function (error, data) {
                if (!error) {
                    callback(data);
                }
                else {
                    combineCrawlingData(query, function (data) {
                        callback(data);
                    });
                }
            });
        }
    },
    update: function (callback) {
        updateCrawlingData(function (success) {
            callback(success);
        });
    }
};

var iconv = require('iconv-lite');
var request = require('request');
var bluebird = require('bluebird');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

var name = require('./name.js');

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
            return "Etc";
        default:
            return "Error";
    }
}

function getTimeslot(index) {
    if (index >= 0 && index < 2)
        return "breakfast";
    else if (index >= 2 && index < 5)
        return "lunch";
    else
        return "dinner";
}

function fetchNextSundayData(query, callback) {
    var options = {
        url: "http://dorm.snu.ac.kr/dk_board/facility/food.php?" + query,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
        },
        encoding: null
    };

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(iconv.decode(body, "utf8"));
            var menus = [];

            for (var i = 0; i < 7; i++) {
                var tr = $("tbody").first().children().get(i);
                var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(0);
                var menu = $(td).text().trim();
                var time = getTimeslot(i);

                if (menu !== "") {
                    var price = getPrice($(td).find("li").attr("class"), time);
                    menus.push({ time: time, name: menu, price: (price === "Error" ? "Etc" : price) });
                }
            }

            callback(menus);
        }
    });
}

function crawlGraduateRestaurant(flag, callback) {
    return new bluebird(function(resolve) {
        var options = {
            url: "http://dorm.snu.ac.kr/dk_board/facility/food.php",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
            },
            encoding: null
        };

        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "utf8"));
                var todayIndex = new Date().getDay();

                if (todayIndex === 6 && flag === "tomorrow") {
                    var query = $("div.go").find("a[class=right]").attr("href").substring(11).trim();
          
                    fetchNextSundayData(query, function(data) {
                        resolve(callback({ restaurant: "대학원 기숙사 식당", menus: data }));
                    });
                }
                else {
                    var menus = [];
          
                    for (var i = 0; i <= 6; i++) {
                        var tr = $("tbody").first().children().get(i);
                        var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
                        var menu = $(td).text().trim();
                        var time = getTimeslot(i);
    
                        if (menu !== "") {
                            var price = getPrice($(td).find("li").attr("class"), time);
                            menus.push({ time: time, name: menu, price: (price === "Error" ? "Etc" : price) });
                        }
                    }

                    resolve(callback({ restaurant: "대학원 기숙사 식당", menus: menus }));
                }
            }
        });
    });
}

function crawlSNUCOData(flag, group, callback) {
    return new bluebird(function(resolve) {
        var today = new Date();
        var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
        var query = flag === "today" ? "?date=" + moment(today).format("YYYY-MM-DD") : "?date=" + moment(tomorrow).format("YYYY-MM-DD");
        var options = {
            url: "http://www.snuco.com/html/restaurant/restaurant_menu" + (group === "directManagement" ? "1.asp" : "2.asp") + query,
            encoding: null
        };
    
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "euc-kr"));
                var restaurants = name.getRawNames(group);
                var list = [];
            
                for (var i = 0; i < restaurants.length; i++) {
                    var menus = [];
                    var restaurant = restaurants[i];
                    var tr = $("table").find("tr:contains(" + restaurant + ")");
                    var breakfasts = tr.find("td:nth-child(3)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");
                    var lunches = tr.find("td:nth-child(5)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");
                    var dinners = tr.find("td:nth-child(7)").text().trim().replace(/\n/g, "/").replace(/\(\*\)/g, "").split("/");

                    for (var j = 0; j < breakfasts.length; j++) {
                        var breakfast = breakfasts[j].trim();
            
                        if (breakfast !== "") {
                            var menu = breakfast.substring(1).trim();
                            var price = getPrice(breakfast.charAt(0), "breakfast");
              
                            if (price === "Error") {
                                var token = breakfast.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;
                
                                if (regex.test(token)) {
                                    menu = breakfast.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                menus.push({ time: "breakfast", name: menu, price: price });
                        }
                    }
                    for (var j = 0; j < lunches.length; j++) {
                        var lunch = lunches[j].trim(); 
            
                        if (lunch !== "") {
                            var menu = lunch.substring(1).trim();
                            var price = getPrice(lunch.charAt(0), "lunch");
              
                            if (price === "Error") {
                                var token = lunch.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;
                
                                if (regex.test(token)) {
                                    menu = lunch.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                menus.push({ time: "lunch", name: menu, price: price });
                        }
                    }
                    for (var j = 0; j < dinners.length; j++) {
                        var dinner = dinners[j].trim();
            
                        if (dinner !== "") {
                            var menu = dinner.substring(1).trim();
                            var price = getPrice(dinner.charAt(0), "dinner");
              
                            if (price === "Error") {
                                var token = dinner.substring(0, 5).trim();
                                var regex = /[0-9]{4,}/;
                
                                if (regex.test(token)) {
                                    menu = dinner.substring(5).trim();
                                    price = token;
                                }
                            }
                            if (price !== "Error")
                                menus.push({ time: "dinner", name: menu, price: price });
                        }
                    }
          
                    list.push({ restaurant: name.getName(restaurant), menus: menus });
                }
        
                resolve(callback(list));
            }
        });
    });
}

function crawlVetRestaurant(flag, callback) {
    return new bluebird(function(resolve) {
        var options = {
            url: "http://vet.snu.ac.kr/kor/html/bbs/menu/index.jsp",
            headers: {
               "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
            },
           encoding: null
        };

        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(iconv.decode(body, "utf8"));
                var todayIndex = new Date().getDay();
                var menus = [];

                if (todayIndex !== 0 && !(todayIndex === 6 && flag === "tomorrow")) {
                    var tbody = $("table[bgcolor=dddddd] > tbody");
                    var tr = $(tbody).children().get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
                    var lunchTd = $(tr).children().get(1);
                    var dinnerTd = $(tr).children().get(2);
                    var lunch = $(lunchTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();
                    var dinner = $(dinnerTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();

                    if (lunch !== "" && lunch !== "휴무") {
                        menus.push({ time: "lunch", name: lunch, price: "Etc" });
                    }
                
                    if (dinner !== "" && dinner !== "휴무") {
                        menus.push({ time: "dinner", name: dinner, price: "Etc" });
                    }
                }
                
                resolve(callback({ restaurant: "85동 수의대 식당", menus: menus }));
            }
        });
    });
}

function combineCrawlingData(flag, callback) {
    var data = [];
    var graduate, vet, directManagements, consignments;

    bluebird.all([
          crawlSNUCOData(flag, "directManagement", function(data) { directManagements = data; }),
          crawlSNUCOData(flag, "consignment", function(data) { consignments = data; }),
          crawlGraduateRestaurant(flag, function(data) { graduate = data; }),
          crawlVetRestaurant(flag, function(data) { vet = data; }),
          ]).then(function() {
              for (var i = 0; i < directManagements.length; i++) {
                  data.push(directManagements[i]);
              }
              for (var i = 0; i < consignments.length; i++) {
                  data.push(consignments[i]);
              }
              data.push(graduate);
              data.push(vet);

              callback({ time: moment(new Date()).format("YYYY-MM-DD HH:mm"), data: data });
          });
}

function updateCrawlingData(callback) {
    bluebird.all([
            new bluebird(function(resolve, reject) {
                combineCrawlingData("today", function(data) {
                    fs.writeFile(__dirname + "/public/jsons/today.json", JSON.stringify(data), function(error) {
                        if (error) {
                            console.log("Error occurs when writing today contents!");
                            reject();
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }),
            new bluebird(function(resolve, reject) {
                combineCrawlingData("tomorrow", function(data) {
                    fs.writeFile(__dirname + "/public/jsons/tomorrow.json", JSON.stringify(data), function(error) {
                        if (error) {
                            console.log("Error occurs when writing tomorrow contents!");
                            reject();
                        }
                        else {
                            resolve();
                        }
                    });
                });
            })]).then(function(success) {
                callback(true);
            }, function(failure) {
                callback(false);
            });
}

module.exports = {
	crawl: function(req, res, next) {
        var date = req.query.date;
        
        if (!(date === "today" || date === "tomorrow")) {
            combineCrawlingData("today", function(data) {
                res.send(data);
            });
        }
        else {
            var fileName = date === "today" ? "today.json" : "tomorrow.json";
            fs.readFile(__dirname + "/public/jsons/" + fileName, { encoding: "utf8" }, function(error, data) {
                if (!error) {
                    res.send(data);
                }
                else {
                    combineCrawlingData(date, function(data) {
                        res.send(data);
                    });
                }
            });
        }
    },
    update: function(req, res, next) {
        updateCrawlingData(function(isSuccess) {
            if (isSuccess) {
                res.render("update", { title: "Success", message: "Server JSON is updated!" });
            }
            else {
                res.render("update", { title: "Failure", message: "An error occurs when updating server JSON!" });
            }
        });
    }
};

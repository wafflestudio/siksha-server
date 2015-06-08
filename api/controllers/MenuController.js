/**
 * MenuController
 *
 * @description :: Server-side logic for managing menus
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var iconv = require('iconv-lite');
var request = require('request');
var bluebird = require('bluebird');
var jsdom = require('jsdom');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

var NameController = require('./NameController.js');
var jquery_min = fs.readFileSync(__dirname + "/jquery-2.1.4.min.js", "utf-8");

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

function getTimeType(index) {
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

  return request(options, function(error, response, body) {
    if (!error) {
      return jsdom.env({
        html: iconv.decode(body, 'UTF-8'),
        src: [jquery_min],
        done: function(err, window) {
          var $ = window.jQuery;
          var menus = [];

          for (var i = 0; i < 7; i++) {
            var tr = $("tbody:first").children().get(i);
            var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(0);
            var menu = $(td).text().trim();
            var time = getTimeType(i);

            if (menu !== "")
              menus.push({ time: time, name: menu, price: getPrice($(td).find("li").attr("class"), time) });
          }

          return callback(menus);
        }
      });
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

    return request(options, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, 'UTF-8'),
          src: [jquery_min],
          done: function(err, window) {
            var $ = window.jQuery;
            var todayIndex = new Date().getDay();

            if (todayIndex === 6 && flag === "tomorrow") {
              var query = $("div.go").find("a[class=right]").attr("href").substring(11).trim();
              return fetchNextSundayData(query, function(data) {
                return resolve(callback({ restaurant: "대학원 기숙사 식당", menus: data }));
              });
            }
            else {
              var menus = [];
              for (var i = 0; i <= 6; i++) {
                var tr = $("tbody:first").children().get(i);
                var td = $(tr).find("td:not(td[rowspan], td[class=bg])").get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
                var menu = $(td).text().trim();
                var time = getTimeType(i);
    
                if (menu !== "")
                   menus.push({ time: time, name: menu, price: getPrice($(td).find("li").attr("class"), time) });
              }

              return resolve(callback({ restaurant: "대학원 기숙사 식당", menus: menus }));
            }
          }
        });
      }
    });
  });
}

function crawlSNUCOData(flag, group, callback) {
  return new bluebird(function(resolve) {
    var today = new Date();
    var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
    var query = flag === "today" ? "?date=" + moment(today).format("YYYY-MM-DD") : "?date=" + moment(tomorrow).format("YYYY-MM-DD");
    
    return request({
      url: "http://www.snuco.com/html/restaurant/restaurant_menu" + (group === "directManagement" ? "1.asp" : "2.asp") + query,
      encoding: null
    }, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, "euc-kr"),
          src: [jquery_min],
          done: function(err, window) {
            var restaurants = NameController.getRawNames(group);
            var $ = window.jQuery;
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

              list.push({ restaurant: NameController.getName(restaurant), menus: menus });
            }

            return resolve(callback(list));
          }
        });
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

    return request(options, function(error, response, body) {
      if (!error) {
        return jsdom.env({
          html: iconv.decode(body, 'UTF-8'),
          src: [jquery_min],
          done: function(err, window) {
            var $ = window.jQuery;
            var menus = [];
            var todayIndex = new Date().getDay();

            if (todayIndex !== 0 && !(todayIndex === 6 && flag === "tomorrow")) {
              var tbody = $("table[bgcolor=dddddd] > tbody");
              var tr = $(tbody).children().get(flag === "tomorrow" ? todayIndex + 1 : todayIndex);
              var lunchTd = $(tr).children().get(1);
              var dinnerTd = $(tr).children().get(2);
              var lunch = $(lunchTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();
              var dinner = $(dinnerTd).text().replace(/(\s){2,}/g, " ").replace(/\n/g, "").trim();

              if (lunch !== "" && lunch !== "휴무")
                menus.push({ time: "lunch", name: lunch, price: "Etc" });
                
              if (dinner !== "" && dinner !== "휴무")
                menus.push({ time: "dinner", name: dinner, price: "Etc" });
            }

            return resolve(callback({ restaurant: "85동 수의대 식당", menus: menus }));
          }
        });
      }
    });
  });
}

function getSodammaruMenus() {
  var menus = [];

  menus.push({ time: "lunch", name: "도토리묵 비빔밥", price: "7000" });
  menus.push({ time: "lunch", name: "해물 순두부찌개", price: "8000" });
  menus.push({ time: "lunch", name: "대구 맑은탕", price: "9000" });
  menus.push({ time: "lunch", name: "수제 생선까스", price: "9000" });
  menus.push({ time: "lunch", name: "정통 생돈까스", price: "10000" });
  menus.push({ time: "lunch", name: "특선 회덮밥", price: "13000" });
  menus.push({ time: "lunch", name: "숙주 라멘", price: "12000" });
  menus.push({ time: "lunch", name: "수제 생선까스 정식", price: "13000" });
  menus.push({ time: "lunch", name: "등심돈까스 정식", price: "14000" });
  menus.push({ time: "lunch", name: "모듬초밥 정식", price: "15000" });
  menus.push({ time: "lunch", name: "사시미 정식", price: "20000" });
  menus.push({ time: "lunch", name: "연어구이 정식", price: "20000" });
  menus.push({ time: "lunch", name: "모듬사시미", price: "30000" });
  menus.push({ time: "lunch", name: "더덕장 야채비빔밥", price: "11000" });
  menus.push({ time: "lunch", name: "냉모밀 정식", price: "13000" });
  menus.push({ time: "lunch", name: "고추장삼겹살 정식", price: "13000" });
  menus.push({ time: "dinner", name: "도토리묵 비빔밥", price: "7000" });
  menus.push({ time: "dinner", name: "해물 순두부찌개", price: "8000" });
  menus.push({ time: "dinner", name: "대구 맑은탕", price: "9000" });
  menus.push({ time: "dinner", name: "수제 생선까스", price: "9000" });
  menus.push({ time: "dinner", name: "정통 생돈까스", price: "10000" });
  menus.push({ time: "dinner", name: "특선 회덮밥", price: "13000" });
  menus.push({ time: "dinner", name: "숙주 라멘", price: "12000" });
  menus.push({ time: "dinner", name: "수제 생선까스 정식", price: "13000" });
  menus.push({ time: "dinner", name: "등심돈까스 정식", price: "14000" });
  menus.push({ time: "dinner", name: "모듬초밥 정식", price: "15000" });
  menus.push({ time: "dinner", name: "사시미 정식", price: "20000" });
  menus.push({ time: "dinner", name: "연어구이 정식", price: "20000" });
  menus.push({ time: "dinner", name: "모듬사시미", price: "30000" });
  menus.push({ time: "dinner", name: "더덕장 야채비빔밥", price: "11000" });
  menus.push({ time: "dinner", name: "냉모밀 정식", price: "13000" });
  menus.push({ time: "dinner", name: "고추장삼겹살 정식", price: "13000" });

  return { restaurant: "소담마루", menus: menus };
}
  
function getShabanMenus() {
  var menus = [];

  menus.push({ time: "breakfast", name: "소불고기 뚝배기", price: "11500" });
  menus.push({ time: "breakfast", name: "사골 우거지해장국", price: "10000" });
  menus.push({ time: "breakfast", name: "맑은 순두부국", price: "9000" });
  menus.push({ time: "breakfast", name: "시원한 황태해장국", price: "8000" });
  menus.push({ time: "breakfast", name: "올갱이해장국", price: "8000" });
  menus.push({ time: "breakfast", name: "담백한 소고기미역국", price: "7500" });
  menus.push({ time: "lunch", name: "버섯불고기전골(4인, 예약제)", price: "60000" });
  menus.push({ time: "lunch", name: "짭쪼름 간고등어구이", price: "12000" });
  menus.push({ time: "lunch", name: "고추장삼겹살 쌈정식", price: "12000" });
  menus.push({ time: "lunch", name: "얼큰 비전지탕(육개장)", price: "11000" });
  menus.push({ time: "lunch", name: "매콤제육덮밥", price: "10000" });
  menus.push({ time: "lunch", name: "얼큰한 해물순두부국", price: "9500" });
  menus.push({ time: "lunch", name: "일본식 왕돈가스", price: "9000" });
  menus.push({ time: "lunch", name: "전주식 전통비빔밥", price: "8500" });
  menus.push({ time: "lunch", name: "톡톡 김치알밥", price: "8500" });
  menus.push({ time: "lunch", name: "시원한 메밀소바", price: "8000" });
  menus.push({ time: "dinner", name: "버섯불고기전골(4인, 예약제)", price: "60000" });
  menus.push({ time: "dinner", name: "짭쪼름 간고등어구이", price: "12000" });
  menus.push({ time: "dinner", name: "고추장삼겹살 쌈정식", price: "12000" });
  menus.push({ time: "dinner", name: "얼큰 비전지탕(육개장)", price: "11000" });
  menus.push({ time: "dinner", name: "매콤제육덮밥", price: "10000" });
  menus.push({ time: "dinner", name: "얼큰한 해물순두부국", price: "9500" });
  menus.push({ time: "dinner", name: "일본식 왕돈가스", price: "9000" });
  menus.push({ time: "dinner", name: "전주식 전통비빔밥", price: "8500" });
  menus.push({ time: "dinner", name: "톡톡 김치알밥", price: "8500" });
  menus.push({ time: "dinner", name: "시원한 메밀소바", price: "8000" });

  return { restaurant: "샤반", menus: menus };
}

function combineCrawlingData(flag, callback) {
  var result = [];

  var sodammaru = getSodammaruMenus();
  var shaban = getShabanMenus();
  var graduate, vet, directManagements, consignments;

  return bluebird.all([
    crawlSNUCOData(flag, "directManagement", function(data) { directManagements = data; }),
    crawlSNUCOData(flag, "consignment", function(data) { consignments = data; }),
    crawlGraduateRestaurant(flag, function(data) { graduate = data; }),
    crawlVetRestaurant(flag, function(data) { vet = data; }),
    ]).then(function() {
      for (var i = 0; i < directManagements.length; i++)
        result.push(directManagements[i]);
      for (var i = 0; i < consignments.length; i++)
        result.push(consignments[i]);
      result.push(graduate);
      result.push(vet);
      result.push(sodammaru);
      result.push(shaban);

      return callback(result);
    });
}

function saveCrawlingData() {
  combineCrawlingData("today", function(data) {
    return fs.writeFile(__dirname + "/../../assets/menus_today.json", JSON.stringify(data), function(err) {
      if (err)
        return console.log("Error occurs when writing today contents!");
    });
  });
  combineCrawlingData("tomorrow", function(data) {
    return fs.writeFile(__dirname + "/../../assets/menus_tomorrow.json", JSON.stringify(data), function(err) {
      if (err)
        return console.log("Error occurs when writing tomorrow contents!");
     });
  });
}

module.exports = {
	crawl: function(req, res) {
    var dateStr = req.query.date;
    
    if (dateStr === "today") {
      return fs.readFile(__dirname + "/../../assets/menus_today.json", { encoding: "utf8" }, function(err, cachedData) {
        if (!err)
          return res.send(cachedData);
        else {
          return combineCrawlingData("today", function(newData) {
            return res.send(newData);
          });
        }
      });
    }
    else if (dateStr === "tomorrow") {
      return fs.readFile(__dirname + "/../../assets/menus_tomorrow.json", { encoding: "utf8" }, function(err, cachedData) {
        if (!err)
          return res.send(cachedData);
        else {
          return combineCrawlingData("tomorrow", function(newData) {
            return res.send(newData);
          });
        }
      });
    }
    else {
      return combineCrawlingData("today", function(newData) {
        return res.send(newData);
      });
    }
  },
  save: function(req, res) {
    return saveCrawlingData();
  }
};


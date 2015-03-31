var jsdom = require('jsdom');
var request = require('request');
var iconv = require('iconv-lite');
var Promise = require('bluebird');
var CronJob = require('cron').CronJob;
var fs = require('fs');
var express = require('express');
var app = express();

var jquery_file = fs.readFileSync("./jquery.js", "utf-8");

var restaurantInfo = require('./restaurant_info.js');
var classMap = restaurantInfo.classMap;
var nameMap = restaurantInfo.nameMap;

var headers = {
	'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
};

function setPrice(mark) {
	var price;

	switch (mark) {
		case 'ⓐ' :
			price = "1700";
			break;
		case 'ⓑ' :
		case 'menu_a' :
			price = "2000";
			break;
		case 'ⓒ' :
		case 'menu_b' :
			price = "2500";
			break;
		case 'ⓓ' :
		case 'menu_c' :
			price = "3000";
			break;
		case 'ⓔ' :
		case 'menu_d' :
			price = "3500";
			break;
		case 'ⓕ' :
		case 'menu_e' :
			price = "4000";
			break;
		case 'ⓖ' :
			price = "4500";
			break;
		case 'ⓗ' :
			price = "Etc";
			break;
		default :
			price = "Error";
			break;
	}

	return price;
}

function getTimeTypeFromGraduate(index) {
	if (index >= 0 && index < 2)
		return "breakfast";
	else if (index >= 2 && index < 5)
		return "lunch";
	else
		return "dinner";
}

function getDateQuery(year, month, day) {
	return "?date=" + year + "-" + (("" + month).length == 1 ? "0" + month : month) + "-" + (("" + day).length == 1 ? "0" + day : day);
}

function getNextWeekSunday(query, callback) {
	var options = {
		url : 'http://dorm.snu.ac.kr/dk_board/facility/food.php?' + query,
		headers : headers,
		encoding : null
	};
	
	request(options, function(error, response, body) {
		if (!error) {
			var decodedBody = iconv.decode(body, "UTF-8");

			jsdom.env({
				html : decodedBody,
				src	: [jquery_file], 
				done : function(err, window) {
					var menus = [];
			
					var $ = window.jQuery;
					var tbody = $('tbody').first().children();

					for(var i = 0; i < 7; i++) {
					  var tr = tbody.get(i);
						var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(0);
						var menu = $(td).text().trim();

						if (menu != "") {
							menus.push({
								time : getTimeTypeFromGraduate(i),
								name : menu,
								price : setPrice($(td).find('li').attr('class'))
							});
						}
					}
				
					return callback(menus);
				}
			});
		}
	});
}

function requestGraduateCrawling(datas, date) {
	return new Promise(function(resolve) {
		var options = {
			url : 'http://dorm.snu.ac.kr/dk_board/facility/food.php',
			headers : headers,
			encoding : null
		};

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "UTF-8");

				jsdom.env({
					html : decodedBody,
					src	: [jquery_file], 
					done : function(err, window) {
						var dayIndex = new Date().getDay();
						var $ = window.jQuery;

						if (dayIndex == 6 && date == 'tomorrow') {
							var query = $('div.go').find('a[class=right]').attr('href').substring(11).trim();

							getNextWeekSunday(query, function(result) {
							  datas.push({
									restaurant : "대학원 기숙사 식당",
									menus : result
								});

								resolve(datas);
							});
						}
						else {
							var menus = [];
							var tbody = $('tbody').first().children();

							for(var i = 0; i < 7; i++) {
								var tr = tbody.get(i);
								var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(date == 'tomorrow' ? dayIndex + 1 : dayIndex);
								var menu = $(td).text().trim();

								if (menu != "") {
									menus.push({
										time : getTimeTypeFromGraduate(i),
										name : menu,
										price : setPrice($(td).find('li').attr('class'))
									});
								}
							}

							datas.push({
								restaurant : '대학원 기숙사 식당',
								menus : menus
							});

							resolve(datas);
						}
					}
				});
			}
		});
	});
}

function requestJikyoungCrawling(datas, date) {
	return new Promise(function(resolve) {
		var today = new Date();
		var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
		var query = date == 'today' ?
			getDateQuery(today.getFullYear(), today.getMonth() + 1, today.getDate()) :
			getDateQuery(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());
		
		var options = {
			url : 'http://www.snuco.com/html/restaurant/restaurant_menu1.asp' + query,
			headers : headers,
			encoding : "binary"
		};

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "euc-kr");

				jsdom.env({
					html : decodedBody,
					src	: [jquery_file], 
					done : function(err, window) {
						var restaurants = classMap.get('jikyoung');
						var $ = window.jQuery;

						for(var index in restaurants) {
							var menus = [];

							var tr = $('table').find("tr:contains(" + restaurants[index] + ")");
							var breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
							var lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
							var dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");

							var breakfasts = breakfastTd.split("/");
							var lunches = lunchTd.split("/");
							var dinners = dinnerTd.split("/");

							for(var i in breakfasts) {
								var menu = breakfasts[i].substring(1);
								var priceTag = setPrice(breakfasts[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "breakfast",
										name : menu,
										price : priceTag
									});
								}
							}
							for(var i in lunches) {
								var menu = lunches[i].substring(1);
								var priceTag = setPrice(lunches[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "lunch",
										name : menu,
										price : priceTag
									});
								}
							}
							for(var i in dinners) {
								var menu = dinners[i].substring(1);
								var priceTag = setPrice(dinners[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "dinner",
										name : menu,
										price : priceTag
									});
								}
							}

							datas.push({
								restaurant : nameMap.get(restaurants[index]),
								menus : menus
							});
						}

						resolve(datas);
					}
				});
			}
		});
	});
}

function requestJunjikyoungCrawling(datas, date) {
	return new Promise(function(resolve) {
		var today = new Date();
		var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000));
		var query = date == 'today' ?
			getDateQuery(today.getFullYear(), today.getMonth() + 1, today.getDate()) :
			getDateQuery(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());	
		
		var options = {
			url : 'http://www.snuco.com/html/restaurant/restaurant_menu2.asp' + query,
			headers : headers,
			encoding : "binary"
		};

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "euc-kr");

				jsdom.env({
					html : decodedBody,
					src	: [jquery_file], 
					done : function(err, window) {
						var restaurants = classMap.get('junjikyoung');
						var $ = window.jQuery;

						for(var index in restaurants) {
							var menus = [];

							var tr = $('table').find("tr:contains(" + restaurants[index] + ")");
							var breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
							var lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
							var dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");

							var breakfasts = breakfastTd.split("/");
							var lunches = lunchTd.split("/");
							var dinners = dinnerTd.split("/");

							for(var i in breakfasts) {
								var menu = breakfasts[i].substring(1);
								var priceTag = setPrice(breakfasts[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "breakfast",
										name : menu,
										price : priceTag
									});
								}
							}
							for(var i in lunches) {
								var menu = lunches[i].substring(1);
								var priceTag = setPrice(lunches[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "lunch",
										name : menu,
										price : priceTag
									});
								}
							}
							for(var i in dinners) {
								var menu = dinners[i].substring(1);
								var priceTag = setPrice(dinners[i].charAt(0));

								if (menu != "" && priceTag != "Error") {
									menus.push({
										time : "dinner",
										name : menu,
										price : priceTag
									});
								}
							}

							datas.push({
								restaurant : nameMap.get(restaurants[index]),
								menus : menus
							});
						}

						resolve(datas);
					}
				});
			}
		});
	});
}

function combineCrawlingData(date, callback) {
	var result = [];

	var jikyoung_list = [];
	var junjikyoung_list = [];
	var graduate_list = [];

	Promise.all([requestJikyoungCrawling(jikyoung_list, date), requestJunjikyoungCrawling(junjikyoung_list, date), requestGraduateCrawling(graduate_list, date)]).then(
		function() {
			for(var index in jikyoung_list)
				result.push(jikyoung_list[index]);

			for(var index in junjikyoung_list)
				result.push(junjikyoung_list[index]);

			for(var index in graduate_list)
				result.push(graduate_list[index]);

			return callback(result);
		}
	);
}

function writeCrawlingData() {
	combineCrawlingData('today', function(result) {
		fs.writeFile('./restaurants_today.json', JSON.stringify(result), function(err) {
			if (err)
				console.log("Error occurs when writing today json!");
		});
	});

	combineCrawlingData('tomorrow', function(result) {
		fs.writeFile('./restaurants_tomorrow.json', JSON.stringify(result), function(err) {
			if (err)
				console.log("Error occurs when writing tomorrow json!");
		});
	});
}

var crawlingJob = new CronJob('00 02 00 * * *',
	function() {
		writeCrawlingData();
	}, null, true, 'Asia/Seoul');

app.get('/restaurants', function(req, res) {
	var alarm_str = req.query.alarm; // will be erased
	var date_str = req.query.date;

	if (date_str == "today") {
		fs.readFile("./restaurants_today.json", { encoding : 'utf8' }, function(err, data) {
			if (err)
				console.log("Error occurs when reading today json!");
			else
				res.send(data);
		});
	}
	else if (date_str == "tomorrow") {
		fs.readFile("./restaurants_tomorrow.json", { encoding : 'utf8' }, function(err, data) {
			if (err)
				console.log("Error occurs when reading tomorrow json!");
			else
				res.send(data);
		});
	}
	else if (alarm_str == "true") {
		// will be erased
		fs.readFile("./restaurants_today.json", { encoding : 'utf8' }, function(err, data) {
			if (err)
				console.log("Error occurs when reading today json!");
			else
				res.send(data);
		});
	}
	else {	
		combineCrawlingData('today', function(result) {
			res.send(result);
		});
	}
});

app.listen("3000");

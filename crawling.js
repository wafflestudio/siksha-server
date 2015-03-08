var jsdom = require('jsdom');
var request = require('request');
var iconv = require('iconv-lite');
var Promise = require('bluebird');
var express = require('express');
var app = express();

var restaurantList = require('./restaurant_info.js');
var routesMap = restaurantList.routesMap;

var jikyoungOptions = {
	url : 'http://www.snuco.com/html/restaurant/restaurant_menu1.asp',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : "binary"
};

var junjikyoungOptions = {
	url : 'http://www.snuco.com/html/restaurant/restaurant_menu2.asp',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : "binary"
};

var graduateOptions = {
	url : 'http://dorm.snu.ac.kr/dk_board/facility/food.php',
	headers : { 
		'User-Agent' : 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
	},
	encoding : null
};

function setPrice(mark) {
	var price;

	switch (mark) {
		case 'ⓐ' :
			price = 1700;
			break;
		case 'ⓑ' :
		case 'menu_a' :
			price = 2000;
			break;
		case 'ⓒ' :
		case 'menu_b' :
			price = 2500;
			break;
		case 'ⓓ' :
		case 'menu_c' :
			price = 3000;
			break;
		case 'ⓔ' :
		case 'menu_d' :
			price = 3500;
			break;
		case 'ⓕ' :
		case 'menu_e' :
			price = 4000;
			break;
		case 'ⓖ' :
			price = 4500;
			break;
		case 'ⓗ' :
			price = 0;
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

function requestGraduateCrawling(datas) {
	return new Promise(function(resolve) {
		var options = graduateOptions;
	
		var date = new Date();
		var week = new Array('일', '월', '화', '수', '목', '금', '토');
		var today = date.getDay();

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "UTF-8");

				jsdom.env({
					html : decodedBody,
					scripts : ['http://code.jquery.com/jquery-2.1.3.min.js'],
					done : function(err, window) {
						var jsonArray = [];
						var key = '/graduate';

						var $ = window.jQuery;
						var tbody = $('tbody').first().children();
			
						for(var i = 0; i < 7; i++) {
							var tr = tbody.get(i);
							var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(today);
							var menu = $(td).text().trim();

							if (menu != "") {
								jsonArray.push({
									name : menu,
									price : setPrice($(td).find('li').attr('class')),
									time : getTimeTypeFromGraduate(i)
								});
							}
						}

						datas.push({ restaurant : routesMap.get(key), menus : jsonArray });
						resolve(datas);
					}
				});
			}	
		});
	});
}

function requestJikyoungCrawling(datas) {
	return new Promise(function(resolve) {
		var options = jikyoungOptions;

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "euc-kr");

				jsdom.env({
					html : decodedBody,
					scripts : ['http://code.jquery.com/jquery-2.1.3.min.js'],
					done : function(err, window) {
						var restaurantJsons = [];
						var key = '/jikyoung';
						var restaurants = routesMap.get(key);

						var $ = window.jQuery;
						var page = $('table');

						for(var index in restaurants) {
							var menuJsons = [];

							var tr = page.find("tr:contains(" + restaurants[index] + ")");
        			var breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
         			var lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
         			var dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");

         			var breakfasts = breakfastTd.split("/");
         			var lunches = lunchTd.split("/");
         			var dinners = dinnerTd.split("/");

         			for(var i in breakfasts) {
								var menu = breakfasts[i].substring(1);
								
								if (menu != "") {
									menuJsons.push({
										time : "breakfast",		
										name : menu,
										price : setPrice(breakfasts[i].charAt(0))
									});
								}
							}
							for(var i in lunches) {
								var menu = lunches[i].substring(1);

								if (menu != "") {
									menuJsons.push({
										time : "lunch",
										name : menu,
										price : setPrice(lunches[i].charAt(0))
									});
								}
							}
							for(var i in dinners) {
								var menu = dinners[i].substring(1);

								if (menu != "") {
									menuJsons.push({
										time : "dinner",
										name : menu,
										price : setPrice(dinners[i].charAt(0))
									});
								}
							}

							datas.push({
								restaurant : restaurants[index],
								menus : menuJsons
							});
						}

						resolve(datas);
					}
				});
			}
		});
	});
}

function requestJunjikyoungCrawling(datas) {
	return new Promise(function(resolve) {
		var options = junjikyoungOptions;

		request(options, function(error, response, body) {
			if (!error) {
				var decodedBody = iconv.decode(body, "euc-kr");

				jsdom.env({
					html : decodedBody,
					scripts : ['http://code.jquery.com/jquery-2.1.3.min.js'],
					done : function(err, window) {
						var restaurantJsons = [];
						var key = '/junjikyoung';
						var restaurants = routesMap.get(key);

						var $ = window.jQuery;
						var page = $('table');

						for(var index in restaurants) {
							var menuJsons = [];

							var tr = page.find("tr:contains(" + restaurants[index] + ")");
        			var breakfastTd = tr.find("td:nth-child(3)").text().trim().replace(/\n| /gi, "/");
         			var lunchTd = tr.find("td:nth-child(5)").text().trim().replace(/\n| /gi, "/");
         			var dinnerTd = tr.find("td:nth-child(7)").text().trim().replace(/\n| /gi, "/");

         			var breakfasts = breakfastTd.split("/");
         			var lunches = lunchTd.split("/");
         			var dinners = dinnerTd.split("/");

         			for(var i in breakfasts) {
								var menu = breakfasts[i].substring(1);

								if (menu != "") {
									menuJsons.push({
										time : "breakfast",		
										name : menu,
										price : setPrice(breakfasts[i].charAt(0))
									});
								}
							}
							for(var i in lunches) {
								var menu = lunches[i].substring(1);

								if (menu != "") {
									menuJsons.push({
										time : "lunch",
										name : menu,
										price : setPrice(lunches[i].charAt(0))
									});
								}
							}
							for(var i in dinners) {
								var menu = dinners[i].substring(1);

								if (menu != "") {
									menuJsons.push({
										time : "dinner",
										name : menu,
										price : setPrice(dinners[i].charAt(0))
									});
								}
							}

							datas.push({
								restaurant : restaurants[index],
								menus : menuJsons
							});
						}

						resolve(datas);
					}
				});
			}
		});
	});
}

function combineCrawlingData(req, res) {
	var result = [];
		
	var jikyoung_list = [];
	var junjikyoung_list = [];
	var graduate_list = [];
	
	Promise.all([requestJikyoungCrawling(jikyoung_list), requestJunjikyoungCrawling(junjikyoung_list), requestGraduateCrawling(graduate_list)]).then(
		function() {
			for(var index in jikyoung_list) {
				result.push(jikyoung_list[index]);
			}
			for(var index in junjikyoung_list) {
				result.push(junjikyoung_list[index]);
			}
			for(var index in graduate_list) {
				result.push(graduate_list[index]);
			}
			res.send(result);
		}
	);
}

app.get('/restaurants', function(req, res) {
	combineCrawlingData(req, res);
});

app.listen("3000");

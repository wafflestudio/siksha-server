jsdom = require "jsdom"
request = require "request"
iconv = require "iconv-lite"
promise = require "bluebird"
cronJob = require("cron").CronJob
fs = require "fs"
moment = require "moment"
express = require "express"
app = express()

jqueryFile = fs.readFileSync "./jquery.js", "utf-8"
restaurantInfo = require "./restaurant_info.js"

setPrice = (mark) ->
	switch mark
		when 'ⓐ' then "1700"
		when 'ⓑ', "menu_a" then "2000"
		when 'ⓒ', "menu_b" then "2500"
		when 'ⓓ', "menu_c" then "3000"
		when 'ⓔ', "menu_d" then "3500"
		when 'ⓕ', "menu_e" then "4000"
		when 'ⓖ' then "4500"
		when 'ⓗ' then "Etc"
		else "Error"

getTimeType = (index) ->
	if index >= 0 and index < 2
		"breakfast"
	else if index >= 2 and index < 5
		"lunch"
	else
		"dinner"

vetCrawling = (list, flag) ->
	new promise (resolve) ->
		options =
			url : "http://vet.snu.ac.kr/kor/html/bbs/menu/index.jsp"
			headers : {"User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"}
			encoding : null

		request options, (error, response, body) ->
			if not error
				jsdom.env
					html : iconv.decode body, "UTF-8"
					src : [jqueryFile]
					done : (err, window) ->
						$ = window.jQuery
						menus = []

						todayIndex = new Date().getDay()

						if not (todayIndex is 0 or (todayIndex is 6 and flag is "tomorrow")) 
							tbody = $("table[bgcolor=dddddd] > tbody")
							tr = ($ tbody).children().get (if flag is "tomorrow" then todayIndex + 1 else todayIndex)
							lunchTd = ($ tr).children().get 1
							dinnerTd = ($ tr).children().get 2
							lunch = ($ lunchTd).text().trim()
							dinner = ($ dinnerTd).text().trim()
							
							menus.push time : "lunch", name : lunch, price : "Etc" unless lunch is ""
							menus.push time : "dinner", name : dinner, price : "Etc" unless dinner is ""

						list.push restaurant : "수의대 식당", menus : menus
						resolve list

getDataOfNextSunday = (query, callback) ->
	options =
		url : "http://dorm.snu.ac.kr/dk_board/facility/food.php?#{query}"
		headers : {"User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"}
		encoding : null

	request options, (error, response, body) ->
		if not error
			jsdom.env
				html : iconv.decode body, "UTF-8"
				src	: [jqueryFile]
				done : (err, window) ->
					$ = window.jQuery
					menus = []

					for i in [0...7]
						tr = ($ "tbody:first").children().get i
						td = ($ tr).find("td:not(td[rowspan], td[class=bg])").get 0
						menu = ($ td).text().trim()
						menus.push time : (getTimeType i), name : menu, price : (setPrice ($ td).find("li").attr("class")) unless menu is ""
				
					callback menus

graduateCrawling = (list, flag) ->
	new promise (resolve) ->
		options =
			url : "http://dorm.snu.ac.kr/dk_board/facility/food.php"
			headers : {"User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"}
			encoding : null

		request options, (error, response, body) ->
			if not error
				jsdom.env
					html : iconv.decode body, "UTF-8"
					src : [jqueryFile]
					done : (err, window) ->
						$ = window.jQuery
						todayIndex = new Date().getDay()

						if todayIndex is 6 and flag is "tomorrow"
							query = ($ "div.go").find("a[class=right]").attr("href").substring(11).trim()
							
							getDataOfNextSunday query, (data) ->
								list.push restaurant : "대학원 기숙사 식당", menus : data
								resolve list
						else
							menus = []

							for i in [0..6]
								tr = ($ "tbody:first").children().get i
								td = ($ tr).find("td:not(td[rowspan], td[class=bg])").get (if flag is "tomorrow" then todayIndex + 1 else todayIndex)
								menu = ($ td).text().trim()
								menus.push time : (getTimeType i), name : menu, price : (setPrice ($ td).find("li").attr("class")) unless menu is ""

							list.push restaurant : "대학원 기숙사 식당", menus : menus
							resolve list

directManagementCrawling = (list, flag) ->
	new promise (resolve) ->
		today = new Date()
		tomorrow = new Date (today.valueOf() + (24 * 60 * 60 * 1000))
		query =
			if flag is "today"
				"?date=#{moment(today).format("YYYY-MM-DD")}"
			else
				"?date=#{moment(tomorrow).format("YYYY-MM-DD")}"
		
		request {url : "http://www.snuco.com/html/restaurant/restaurant_menu1.asp#{query}", encoding : "binary"}, (error, response, body) ->
			if not error
				jsdom.env
					html : iconv.decode body, "euc-kr"
					src	: [jqueryFile]
					done : (err, window) ->
						restaurants = restaurantInfo.classMap.get "directManagement"
						$ = window.jQuery

						for restaurant in restaurants
							tr = ($ "table").find "tr:contains(#{restaurant})"
							breakfastTd = tr.find("td:nth-child(3)").text().trim().replace /\n| /gi, "/"
							lunchTd = tr.find("td:nth-child(5)").text().trim().replace /\n| /gi, "/"
							dinnerTd = tr.find("td:nth-child(7)").text().trim().replace /\n| /gi, "/"

							breakfasts = breakfastTd.split "/"
							lunches = lunchTd.split "/"
							dinners = dinnerTd.split "/"
							menus = []

							for breakfast in breakfasts
								menu = breakfast.substring 1
								price = setPrice (breakfast.charAt 0)
								menus.push time : "breakfast", name : menu, price : price unless menu is "" or price is "Error"
								
							for lunch in lunches
								menu = lunch.substring 1
								price = setPrice (lunch.charAt 0)
								menus.push time : "lunch", name : menu, price : price unless menu is "" or price is "Error"
				
							for dinner in dinners
								menu = dinner.substring 1
								price = setPrice (dinner.charAt 0)
								menus.push time : "dinner", name : menu, price : price unless menu is "" or price is "Error"

							list.push restaurant : (restaurantInfo.nameMap.get restaurant), menus : menus

						resolve list

consignmentCrawling = (list, flag) ->
	new promise (resolve) ->
		today = new Date()
		tomorrow = new Date (today.valueOf() + (24 * 60 * 60 * 1000))
		query =
			if flag is "today"
				"?date=#{moment(today).format("YYYY-MM-DD")}"
			else
				"?date=#{moment(tomorrow).format("YYYY-MM-DD")}"
		
		request {url : "http://www.snuco.com/html/restaurant/restaurant_menu2.asp#{query}", encoding : "binary"}, (error, response, body) ->
			if not error
				jsdom.env
					html : iconv.decode body, "euc-kr"
					src	: [jqueryFile]
					done : (err, window) ->
						restaurants = restaurantInfo.classMap.get "consignment"
						$ = window.jQuery

						for restaurant in restaurants
							tr = ($ "table").find "tr:contains(#{restaurant})"
							breakfastTd = tr.find("td:nth-child(3)").text().trim().replace /\n| /gi, "/"
							lunchTd = tr.find("td:nth-child(5)").text().trim().replace /\n| /gi, "/"
							dinnerTd = tr.find("td:nth-child(7)").text().trim().replace /\n| /gi, "/"

							breakfasts = breakfastTd.split "/"
							lunches = lunchTd.split "/"
							dinners = dinnerTd.split "/"
							menus = []

							for breakfast in breakfasts
								menu = breakfast.substring 1
								price = setPrice (breakfast.charAt 0)
								menus.push time : "breakfast", name : menu, price : price unless menu is "" or price is "Error"
		
							for lunch in lunches
								menu = lunch.substring 1
								price = setPrice (lunch.charAt 0)
								menus.push time : "lunch", name : menu, price : price unless menu is "" or price is "Error"

							for dinner in dinners
								menu = dinner.substring 1
								price = setPrice (dinner.charAt 0)
								menus.push time : "dinner", name : menu, price : price unless menu is "" or price is "Error"

							list.push restaurant : (restaurantInfo.nameMap.get restaurant), menus : menus
						
						resolve list

combineCrawlingData = (flag, callback) ->
	result = []
	
	directManagements = []
	consignments = []
	graduates = []
	vets = []

	promise.all([(directManagementCrawling directManagements, flag), (consignmentCrawling consignments, flag), (graduateCrawling graduates, flag), (vetCrawling vets, flag)]).then ->
		for restaurant in directManagements
			result.push restaurant
		for restaurant in consignments
			result.push restaurant
		for restaurant in graduates
			result.push restaurant
		for restaurant in vets
			result.push restaurant
		
		callback result

writeCrawlingData = ->
	combineCrawlingData "today", (data) ->
		fs.writeFile "./restaurants_today.json", (JSON.stringify data), (err) ->
			if err
				console.log "Error occurs when writing today json!"

	combineCrawlingData "tomorrow", (data) ->
		fs.writeFile "./restaurants_tomorrow.json", (JSON.stringify data), (err) ->
			if err
				console.log "Error occurs when writing tomorrow json!"

crawlingJob = new cronJob "00 02 00 * * *", writeCrawlingData, null, true, "Asia/Seoul"

app.get "/restaurants", (req, res) ->
	date_str = req.query.date

	if date_str is "today"
		fs.readFile "./restaurants_today.json", encoding : "utf8", (err, cachedData) ->
			if not err
				res.send cachedData
			else
				combineCrawlingData "today", (newData) ->
					res.send newData
	else if date_str is "tomorrow"
		fs.readFile "./restaurants_tomorrow.json", encoding : "utf8", (err, cachedData) ->
			if not err
				res.send cachedData
			else
				combineCrawlingData "tomorrow", (newData) ->
					res.send newData
	else
		combineCrawlingData "today", (newData) ->
			res.send newData

app.listen "3280"

var iconv = require('iconv-lite')
var request = require('request')
var Bluebird = require('bluebird')
var cheerio = require('cheerio')
var fs = require('fs')
var moment = require('moment')

var name = require('./name.js')
var logger = require('./logger.js')

function getPrice (mark, time) {
  switch (mark) {
    case 'ⓐ':
      if (time === 'breakfast' || time === 'dinner') {
        return '1000'
      } else {
        return '1700'
      }
    case 'ⓑ':
    case 'menu_a':
      return '2000'
    case 'ⓒ':
    case 'menu_b':
      return '2500'
    case 'ⓓ':
    case 'menu_c':
      return '3000'
    case 'ⓔ':
    case 'menu_d':
      return '3500'
    case 'ⓕ':
    case 'menu_e':
      return '4000'
    case 'ⓖ':
      return '4500'
    case 'ⓗ':
      return '5000'
    case 'ⓘ':
      return '5500'
    case 'ⓙ':
      return '6000'
    default:
      return 'Error'
  }
}

function getTimeSlot (index) {
  if (index >= 0 && index < 2) {
    return 'breakfast'
  } else if (index >= 2 && index < 5) {
    return 'lunch'
  } else {
    return 'dinner'
  }
}

function fetchNextSundayMenu (query, callback) {
  var options = {
    url: 'http://dorm.snu.ac.kr/dk_board/facility/food.php?' + query,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    },
    encoding: null
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(iconv.decode(body, 'utf8'))
      var foods = []

      for (var i = 0; i < 7; i++) {
        var tr = $('tbody').first().children().get(i)
        var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(0)
        var food = $(td).text().trim()
        var time = getTimeSlot(i)

        if (food !== '') {
          var price = getPrice($(td).find('li').attr('class'), time)
          foods.push({ time: time, name: food, price: (price === 'Error' ? 'Etc' : price) })
        }
      }
      callback(foods)
    }
  })
}

function crawlGraduateRestaurant (flag, callback) {
  return new Bluebird(function (resolve) {
    var options = {
      url: 'http://dorm.snu.ac.kr/dk_board/facility/food.php',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
      },
      encoding: null
    }
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var $ = cheerio.load(iconv.decode(body, 'utf8'))
        var todayIndex = new Date().getDay()
        if (todayIndex === 6 && flag === 'tomorrow') {
          var query = $('div.go').find('a[class=right]').attr('href').substring(11).trim()
          fetchNextSundayMenu(query, function (data) {
            resolve(callback({ restaurant: '대학원 기숙사 식당', menus: data }))
          })
        } else {
          var foods = []
          for (var i = 0; i <= 6; i++) {
            var tr = $('tbody').first().children().get(i)
            var td = $(tr).find('td:not(td[rowspan], td[class=bg])').get(flag === 'tomorrow' ? todayIndex + 1 : todayIndex)
            var food = $(td).text().trim()
            var time = getTimeSlot(i)

            if (food !== '') {
              var price = getPrice($(td).find('li').attr('class'), time)
              foods.push({ time: time, name: food, price: (price === 'Error' ? 'Etc' : price) })
            }
          }

          resolve(callback({ restaurant: '대학원 기숙사 식당', menus: foods }))
        }
      }
    })
  })
}

function crawlSNUCORestaurants (flag, group, callback) {
  return new Bluebird(function (resolve) {
    var today = new Date()
    var tomorrow = new Date(today.valueOf() + (24 * 60 * 60 * 1000))
    var query = flag === 'today' ? '?date=' + moment(today).format('YYYY-MM-DD') : '?date=' + moment(tomorrow).format('YYYY-MM-DD')
    var options = {
      url: 'http://www.snuco.com/html/restaurant/restaurant_menu' + (group === 'directManagement' ? '1.asp' : '2.asp') + query,
      encoding: null
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var $ = cheerio.load(iconv.decode(body, 'euc-kr'))
        var restaurants = name.getRawNames(group)
        var list = []

        for (var i = 0; i < restaurants.length; i++) {
          var foods = []
          var restaurant = restaurants[i]
          var tr = $('table').find('tr:contains(' + restaurant + ')')
					var splitRegex = /(?=ⓐ|ⓑ|ⓒ|ⓓ|ⓔ|ⓕ|ⓖ|ⓗ|ⓘ|ⓙ|7000)/g
          var breakfasts = tr.find('td:nth-child(3)').text().trim().replace(/\n/g, '/').replace(/\(\*\)/g, '').split(splitRegex)
          var lunches = tr.find('td:nth-child(5)').text().trim().replace(/\n/g, '/').replace(/\(\*\)/g, '').split(splitRegex)
          var dinners = tr.find('td:nth-child(7)').text().trim().replace(/\n/g, '/').replace(/\(\*\)/g, '').split(splitRegex)
          var mealsObjects = [{ meals: breakfasts, type: 'breakfast' }, { meals: lunches, type: 'lunch' }, { meals: dinners, type: 'dinner' }]

          mealsObjects.forEach(function (mealsObject) {
            var meals = mealsObject.meals
            var mealType = mealsObject.type
            for (var j = 0; j < meals.length; j++) {
              var meal = meals[j].trim().split(/\/$/)[0]
              if (meal !== '') {
                var food = meal.substring(1).trim()
                var price = getPrice(meal.charAt(0), mealType)
                if (price === 'Error') {
                  var token = meal.match(/\d+/g) ? meal.match(/\d+/g)[0] : 'Etc'
                  var regex = /[0-9]{3,}/
                  if (regex.test(token)) {
                    food = meal.replace(token, '').replace(/ /g, '')
                    if (!(/\(/.test(food)) && (/\)/.test(food))) {
                      food.replace(/\)/, '')
                    }
									}
                  price = token
                }
                if (price !== 'Error') {
                  foods.push({ time: mealType, name: food, price: price })
                }
              }
            }
          })
          list.push({ restaurant: name.getName(restaurant), menus: foods })
        }
        resolve(callback(list))
      }
    })
  })
}

function crawlVetRestaurant (flag, callback) {
  return new Bluebird(function (resolve) {
    var options = {
      url: 'http://vet.snu.ac.kr/node/152',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
      },
      encoding: null
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var $ = cheerio.load(iconv.decode(body, 'utf8'))
        var todayIndex = new Date().getDay()
        var foods = []

        if (todayIndex !== 0 && !(todayIndex === 6 && flag === 'tomorrow')) {
          var tbody = $('table tbody')
          var tr = $(tbody).children().get(flag === 'tomorrow' ? todayIndex + 1 : todayIndex)
          var lunchTd = $(tr).children().get(1)
          var dinnerTd = $(tr).children().get(2)
          var lunch = $(lunchTd).text().replace(/(\s){2,}/g, ' ').replace(/\n/g, '').trim()
          var dinner = $(dinnerTd).text().replace(/(\s){2,}/g, ' ').replace(/\n/g, '').trim()

          if (lunch !== '' && lunch !== '휴무') {
            foods.push({ time: 'lunch', name: lunch, price: 'Etc' })
          }

          if (dinner !== '' && dinner !== '휴무') {
            foods.push({ time: 'dinner', name: dinner, price: 'Etc' })
          }
        }

        resolve(callback({ restaurant: '85동 수의대 식당', menus: foods }))
      }
    })
  })
}

function getSodammaruMenus () {
  var menus = []

  menus.push({ time: 'lunch', name: '도토리묵 비빔밥', price: '7000' })
  menus.push({ time: 'lunch', name: '해물 순두부찌개', price: '8000' })
  menus.push({ time: 'lunch', name: '대구 맑은탕', price: '9000' })
  menus.push({ time: 'lunch', name: '수제 생선까스', price: '9000' })
  menus.push({ time: 'lunch', name: '정통 생돈까스', price: '10000' })
  menus.push({ time: 'lunch', name: '특선 회덮밥', price: '13000' })
  menus.push({ time: 'lunch', name: '숙주 라멘', price: '12000' })
  menus.push({ time: 'lunch', name: '수제 생선까스 정식', price: '13000' })
  menus.push({ time: 'lunch', name: '등심돈까스 정식', price: '14000' })
  menus.push({ time: 'lunch', name: '모듬초밥 정식', price: '15000' })
  menus.push({ time: 'lunch', name: '사시미 정식', price: '20000' })
  menus.push({ time: 'lunch', name: '연어구이 정식', price: '20000' })
  menus.push({ time: 'lunch', name: '모듬사시미', price: '30000' })
  menus.push({ time: 'lunch', name: '더덕장 야채비빔밥', price: '11000' })
  menus.push({ time: 'lunch', name: '냉모밀 정식', price: '13000' })
  menus.push({ time: 'lunch', name: '고추장삼겹살 정식', price: '13000' })
  menus.push({ time: 'dinner', name: '도토리묵 비빔밥', price: '7000' })
  menus.push({ time: 'dinner', name: '해물 순두부찌개', price: '8000' })
  menus.push({ time: 'dinner', name: '대구 맑은탕', price: '9000' })
  menus.push({ time: 'dinner', name: '수제 생선까스', price: '9000' })
  menus.push({ time: 'dinner', name: '정통 생돈까스', price: '10000' })
  menus.push({ time: 'dinner', name: '특선 회덮밥', price: '13000' })
  menus.push({ time: 'dinner', name: '숙주 라멘', price: '12000' })
  menus.push({ time: 'dinner', name: '수제 생선까스 정식', price: '13000' })
  menus.push({ time: 'dinner', name: '등심돈까스 정식', price: '14000' })
  menus.push({ time: 'dinner', name: '모듬초밥 정식', price: '15000' })
  menus.push({ time: 'dinner', name: '사시미 정식', price: '20000' })
  menus.push({ time: 'dinner', name: '연어구이 정식', price: '20000' })
  menus.push({ time: 'dinner', name: '모듬사시미', price: '30000' })
  menus.push({ time: 'dinner', name: '더덕장 야채비빔밥', price: '11000' })
  menus.push({ time: 'dinner', name: '냉모밀 정식', price: '13000' })
  menus.push({ time: 'dinner', name: '고추장삼겹살 정식', price: '13000' })

  return { restaurant: '소담마루', menus: menus }
}

function getShabanMenus () {
  var menus = []

  menus.push({ time: 'breakfast', name: '소불고기 뚝배기', price: '11500' })
  menus.push({ time: 'breakfast', name: '사골 우거지해장국', price: '10000' })
  menus.push({ time: 'breakfast', name: '맑은 순두부국', price: '9000' })
  menus.push({ time: 'breakfast', name: '시원한 황태해장국', price: '8000' })
  menus.push({ time: 'breakfast', name: '올갱이해장국', price: '8000' })
  menus.push({ time: 'breakfast', name: '담백한 소고기미역국', price: '7500' })
  menus.push({ time: 'lunch', name: '버섯불고기전골(4인, 예약제)', price: '60000' })
  menus.push({ time: 'lunch', name: '짭쪼름 간고등어구이', price: '12000' })
  menus.push({ time: 'lunch', name: '고추장삼겹살 쌈정식', price: '12000' })
  menus.push({ time: 'lunch', name: '얼큰 비전지탕(육개장)', price: '11000' })
  menus.push({ time: 'lunch', name: '매콤제육덮밥', price: '10000' })
  menus.push({ time: 'lunch', name: '얼큰한 해물순두부국', price: '9500' })
  menus.push({ time: 'lunch', name: '일본식 왕돈가스', price: '9000' })
  menus.push({ time: 'lunch', name: '전주식 전통비빔밥', price: '8500' })
  menus.push({ time: 'lunch', name: '톡톡 김치알밥', price: '8500' })
  menus.push({ time: 'lunch', name: '시원한 메밀소바', price: '8000' })
  menus.push({ time: 'dinner', name: '버섯불고기전골(4인, 예약제)', price: '60000' })
  menus.push({ time: 'dinner', name: '짭쪼름 간고등어구이', price: '12000' })
  menus.push({ time: 'dinner', name: '고추장삼겹살 쌈정식', price: '12000' })
  menus.push({ time: 'dinner', name: '얼큰 비전지탕(육개장)', price: '11000' })
  menus.push({ time: 'dinner', name: '매콤제육덮밥', price: '10000' })
  menus.push({ time: 'dinner', name: '얼큰한 해물순두부국', price: '9500' })
  menus.push({ time: 'dinner', name: '일본식 왕돈가스', price: '9000' })
  menus.push({ time: 'dinner', name: '전주식 전통비빔밥', price: '8500' })
  menus.push({ time: 'dinner', name: '톡톡 김치알밥', price: '8500' })
  menus.push({ time: 'dinner', name: '시원한 메밀소바', price: '8000' })

  return { restaurant: '샤반', menus: menus }
}

function combineCrawlingData (flag, callback) {
  var data = []
  var sodammaru = getSodammaruMenus()
  var shaban = getShabanMenus()
  var graduate, vet, directManagements, consignments

  Bluebird.all([
    crawlSNUCORestaurants(flag, 'directManagement', function (data) {
      directManagements = data
    }),
    crawlSNUCORestaurants(flag, 'consignment', function (data) {
      consignments = data
    }),
    crawlGraduateRestaurant(flag, function (data) {
      graduate = data
    }),
    crawlVetRestaurant(flag, function (data) {
      vet = data
    })
  ]).then(function () {
    for (var i = 0; i < directManagements.length; i++) {
      data.push(directManagements[i])
    }
    for (var i = 0; i < consignments.length; i++) {
      data.push(consignments[i])
    }
    data.push(graduate)
    data.push(vet)
    data.push(sodammaru)
    data.push(shaban)

    callback(data)
  })
}

function updateCrawlingData (callback) {
  Bluebird.all([
    new Bluebird(function (resolve, reject) {
      combineCrawlingData('today', function (data) {
        fs.writeFile(__dirname + '/public/jsons/today.json', JSON.stringify(data), function (error) {
          if (error) {
            logger.error('An error occurs while writing today data.')
            reject()
          } else {
            resolve()
          }
        })
      })
    }),
    new Bluebird(function (resolve, reject) {
      combineCrawlingData('tomorrow', function (data) {
        fs.writeFile(__dirname + '/public/jsons/tomorrow.json', JSON.stringify(data), function (error) {
          if (error) {
            logger.error('An error occurs while writing tomorrow data.')
            reject()
          } else {
            resolve()
          }
        })
      })
    })
  ]).then(function (success) {
    callback(true)
  }, function (failure) {
    callback(false)
  })
}

module.exports = {
  crawl: function (query, callback) {
    if (!(query === 'today' || query === 'tomorrow')) {
      combineCrawlingData('today', function (data) {
        callback(data)
      })
    } else {
      var fileName = query === 'today' ? 'today.json' : 'tomorrow.json'
      fs.readFile(__dirname + '/public/jsons/' + fileName, { encoding: 'utf8' }, function (error, data) {
        if (!error) {
          callback(data)
        } else {
          combineCrawlingData(query, function (data) {
            callback(data)
          })
        }
      })
    }
  },
  update: function (callback) {
    updateCrawlingData(function (success) {
      callback(success)
    })
  }
}

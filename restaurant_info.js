var RoutesMap = function() {
	this.map = {};
};

RoutesMap.prototype = {
	put : function(key, value) {
		this.map[key] = value;
	},
	get : function(key) {
		return this.map[key];
	},
	containsKey : function(key) {
		return key in this.map;
	},
	size : function() {
		var number = 0;
		for (var i in this.map) {
			number++;
		}

		return number;
	}
};

var jikyoungRestaurants =
	[ "학생회관식당", "3식당", "기숙사식당", "자하연식당",
		"302동식당", "동원관식당", "감골식당" ];
var junjikyoungRestaurants =
 	[ "4식당", "두레미담", "301동식당", "공대간이식당",
		"상아회관", "220동식당" ];
var restaurants =
	[ "학생회관식당", "3식당", "기숙사식당", "자하연식당",
		"302동식당", "동원관식당", "감골식당", "4식당",
		"두레미담", "301동식당", "공대간이식당", "상아회관",
		"220동식당", "대학원기숙사식당" ];

var routesMap = new RoutesMap();

routesMap.put('/jikyoung', jikyoungRestaurants);
routesMap.put('/junjikyoung', junjikyoungRestaurants);
routesMap.put('/graduate', "대학원기숙사식당");

module.exports = {
	routesMap : routesMap,
	jikyoungRestaurants : jikyoungRestaurants,
	junjikyoungRestaurants : junjikyoungRestaurants
}

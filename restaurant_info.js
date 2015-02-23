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

var routesMap = new RoutesMap();

routesMap.put('/student-center', '학생회관식당');
routesMap.put('/third-cafe', '3식당');
routesMap.put('/undergraduate', '기숙사식당');
routesMap.put('/jahayeon', '자하연식당');
routesMap.put('/building-302', '302동식당');
routesMap.put('/dongwongwan', '동원관식당');
routesMap.put('/gamgol', '감골식당');
routesMap.put('/fourth-cafe', '4식당');
routesMap.put('/dooraemidam', '두레미담');
routesMap.put('/building-302', '301동식당');
routesMap.put('/gongggang', '공대간이식당');
routesMap.put('/sanga', '상아회관');
routesMap.put('/building-220', '220동식당');
routesMap.put('/graduate', "대학원기숙사식당");

var restaurants =
	[ "학생회관식당", "3식당", "기숙사식당", "자하연식당",
		"302동식당", "동원관식당", "감골식당", "4식당",
		"두레미담", "301동식당", "공대간이식당", "상아회관",
		"220동식당", "대학원기숙사식당" ];

module.exports = {
	routesMap : routesMap,
	restaurants : restaurants
}

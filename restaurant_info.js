var Map = function() {
	this.map = {};
};

Map.prototype = {
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

var classMap = new Map();
var nameMap = new Map();

classMap.put('jikyoung', jikyoungRestaurants);
classMap.put('junjikyoung', junjikyoungRestaurants);
classMap.put('graduate', "대학원기숙사식당");

nameMap.put('학생회관식당', '학생회관 식당');
nameMap.put('3식당', '농생대 3식당');
nameMap.put('기숙사식당', '919동 기숙사 식당');
nameMap.put('자하연식당', '자하연 식당');
nameMap.put('302동식당', '302동 식당');
nameMap.put('동원관식당', '동원관 식당');
nameMap.put('감골식당', '감골 식당');
nameMap.put('4식당', '사범대 4식당');
nameMap.put('두레미담', '두레미담');
nameMap.put('301동식당', '301동 식당');
nameMap.put('공대간이식당', '공대 간이 식당');
nameMap.put('상아회관', '상아회관 식당');
nameMap.put('220동식당', '220동 식당');

module.exports = {
	classMap : classMap,
	nameMap : nameMap
}

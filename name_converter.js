// Generated by CoffeeScript 1.9.2
(function() {
  var Map, classMap, consignmentRestaurants, directManagementRestaurants, nameMap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Map = (function() {
    function Map() {
      this.map = {};
    }

    Map.prototype.put = function(key, value) {
      return this.map[key] = value;
    };

    Map.prototype.get = function(key) {
      return this.map[key];
    };

    Map.prototype.containsKey = function(key) {
      return indexOf.call(this.map, key) >= 0;
    };

    Map.prototype.size = function() {
      return this.map.length;
    };

    return Map;

  })();

  classMap = new Map();

  nameMap = new Map();

  directManagementRestaurants = ["학생회관식당", "3식당", "기숙사식당", "자하연식당", "302동식당", "동원관식당", "감골식당"];

  consignmentRestaurants = ["4식당", "두레미담", "301동식당", "예술계식당", "공대간이식당", "상아회관", "220동식당"];

  classMap.put("directManagement", directManagementRestaurants);

  classMap.put("consignment", consignmentRestaurants);

  classMap.put("graduate", "대학원기숙사식당");

  classMap.put("vet", "수의대식당");

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

  nameMap.put('예술계식당', '74동 예술계복합연구동 식당');

  nameMap.put('공대간이식당', '공대 간이 식당');

  nameMap.put('상아회관', '상아회관 식당');

  nameMap.put('220동식당', '220동 식당');

  nameMap.put('대학원기숙사식당', '대학원 기숙사 식당');

  nameMap.put('수의대식당', '85동 수의대 식당');

  module.exports = {
    classMap: classMap,
    nameMap: nameMap
  };

}).call(this);

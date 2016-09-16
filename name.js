var names = {
    /* 식단 제공 사이트에 표기된 식당명 */
    rawAll: ["학생회관식당", "3식당", "기숙사식당", "자하연식당", "302동식당",
        "솔밭간이식당", "동원관식당", "감골식당", "4식당", "두레미담",
        "301동식당", "예술계식당", "공대간이식당", "상아회관", "220동식당",
        "대학원 기숙사 식당", "85동 수의대 식당"],
    rawDirectManagements: ["학생회관식당", "3식당", "기숙사식당", "자하연식당", "302동식당",
        "솔밭간이식당", "동원관식당", "감골식당"],
    rawConsignments: ["4식당", "두레미담", "301동식당", "예술계식당", "공대간이식당",
        "상아회관", "220동식당"],
    /* 식샤에서 이용할 식당명 */
    all: ["학생회관 식당", "농생대 3식당", "919동 기숙사 식당", "자하연 식당", "302동 식당",
        "솔밭 간이 식당", "동원관 식당", "감골 식당", "사범대 4식당", "두레미담",
        "301동 식당", "예술계복합연구동 식당", "공대 간이 식당", "상아회관 식당", "220동 식당",
        "대학원 기숙사 식당", "85동 수의대 식당"],
    directManagements: ["학생회관 식당", "농생대 3식당", "919동 기숙사 식당", "자하연 식당", "302동 식당",
        "솔밭 간이 식당", "동원관 식당", "감골 식당"],
    consignments: ["사범대 4식당", "두레미담", "301동 식당", "예술계복합연구동 식당", "공대 간이 식당",
        "상아회관 식당", "220동 식당"],
    graduate: "대학원 기숙사 식당",
    vet: "85동 수의대 식당"
};

// Used to verify restaurant
var englishNames = ["StudentHall", "Biology3rd", "Dormitory", "Jahayon", "Engineering302", "Solbat", "Dongwon", "Gamgol", "Education4th", "Duremidam", "Engineering301", "Art", "Engineering", "Sanga", "Wellstroy", "GraduateSchoolDormitory", "Veterinary"] 

var getRawNames = function (group) {
    if (group === "directManagement") {
        return names.rawDirectManagements;
    }
    else {
        return names.rawConsignments;
    }
};

var getName = function (rawName) {
    var index = names.rawAll.indexOf(rawName);
    return names.all[index];
};

exports.names = names;
exports.getRawNames = getRawNames;
exports.getName = getName;
exports.getEngName = englishNames;

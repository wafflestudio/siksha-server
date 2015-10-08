var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

function checkLatestVersion(req, res) {
    var options = {
        url: "https://play.google.com/store/apps/details?id=com.wafflestudio.siksha",
        headers: {
            'User-Agent' : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36"
        },
        encoding: null
    };

    request(options, function(error, response, body) {
        if (!error & response.statusCode == 200) {
            var $ = cheerio.load(iconv.decode(body, "utf-8"));
            var version = $('div[itemprop=softwareVersion]').text().trim();

            res.send({ latest: version });
        }
    });
}

module.exports = {
    check: function(req, res, next) {
        checkLatestVersion(req, res);
    }
};

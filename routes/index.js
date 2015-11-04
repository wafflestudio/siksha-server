var express = require('express');
var router = express.Router();

var menu = require('../menu.js');
var information = require('../information.js');
var version = require('../version.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/menu/view', function(req, res, next) {
    menu.crawl(req.query.date, function(result) {
        res.send(result);
    });
});

router.get('/menu/update', function(req, res, next) {
    menu.update(function(success) {
        if (success)
            res.render("update", { title: "Success", message: "Server data is updated!" });
        else
            res.render("update", { title: "Failure", message: "An error occurs while updating server data!" });
    });
});

// For android client
router.get('/version', function(req, res, next) {
    version.check(function(result) {
        res.send(result);
    });
});

router.get('/information/view', function(req, res, next) {
    information.view(function(result) {
        res.send(result);
    });
});

router.get('/information/update', function(req, res, next) {
    information.update(function(success) {
        if (success)
            res.render("update", { title: "Success", message: "Server data is updated!" });
        else
            res.render("update", { title: "Failure", message: "An error occurs while updating server data!" });
    });
});

router.get('/information/latest', function(req, res, next) {
    information.latest(function(result) {
        res.send(result);
    });
});

module.exports = router;

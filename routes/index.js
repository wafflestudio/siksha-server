var express = require('express');
var router = express.Router();

var menu = require('../menu.js');
var information = require('../information.js');
var version = require('../version.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/menus/view', function(req, res, next) {
    menu.crawl(function(result) {
        res.send(result);
    });
});

router.get('/menus/update', function(req, res, next) {
    menu.update(function(success) {
        if (success)
            res.render("update", { title: "Success", message: "Server JSON is updated!" });
        else
            res.render("update", { title: "Failure", message: "An error occurs when updating server JSON!" });
    });
});

// For android client
router.get('/version', function(req, res, next) {
    version.check(function(result) {
        res.send(result);
    });
});

router.get('/informations/view', function(req, res, next) {
    information.view(function(result) {
        res.send(result);
    });
});

router.get('/informations/update', function(req, res, next) {
    information.update(function(result) {
        res.send(result)
    });
});

router.get('/informations/latest', function(req, res, next) {
    information.latest(function(result) {
        res.send(result);
    });
});

module.exports = router;

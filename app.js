var express = require('express');
var path = require('path');
var morgan = require('morgan');
// var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var rate = require('./routes/rate');

var app = express();

var menu = require('./menu.js');
var information = require('./information.js');
var logger = require('./logger.js');

var CronJob = require('cron').CronJob;
var firstCrawlJob = new CronJob("00 02 00 * * *", menu.update, null, true, "Asia/Seoul");
var secondCrawlJob = new CronJob("00 00 07 * * *", menu.update, null, true, "Asia/Seoul");
var thirdCrawlJob = new CronJob("00 00 16 * * *", menu.update, null, true, "Asia/Seoul");
var vetUpdateJob = new CronJob("00 55 09 * * 1", menu.update, null, true, "Asia/Seoul");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/rate', rate);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: error
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.disable('etag');

/* Initialize modifiable files */
logger.info("Program start!");
menu.update(function (success) {
    if (success)
        logger.info("Initialize menu data successfully.");
    else
        logger.error("An error occurs while initializing menu data.");
});
information.update(function (success) {
    if (success)
        logger.info("Initialize information data successfully.");
    else
        logger.error("An error occurs while initializing information data.");
});
/* end */

module.exports = app;

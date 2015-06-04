/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var cronJob = require('cron').CronJob;

var MenuController = require('../api/controllers/MenuController.js');

module.exports.bootstrap = function(cb) {
  var crawlingJob = new cronJob("00 02 00 * * *", MenuController.save, null, true, "Asia/Seoul");
  var updatingVetDataJob = new cronJob("00 00 10 * * 1", MenuController.save, null, true, "Asia/Seoul");

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};

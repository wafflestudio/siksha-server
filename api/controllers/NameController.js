/**
 * NameController
 *
 * @description :: Server-side logic for managing names
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Name = require('../models/Name.js');

module.exports = {
  getRawNames: function(group) {
    if (group === "directManagement")
      return Name.attributes.rawDirectManagements;
    else
      return Name.attributes.rawConsignments;
  },
  getName: function(restaurant) {
    var index = Name.attributes.rawAll.indexOf(restaurant);
    return (Name.attributes.all)[index];
  }
};


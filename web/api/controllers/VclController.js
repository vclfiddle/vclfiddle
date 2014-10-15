/**
 * VclController
 *
 * @description :: Server-side logic for managing vcls
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	index: function (req, res) {
    const defaultVcl = 'backend default { .host = "sailsjs.org"; .port = 80; }';
    return res.view({vcl: defaultVcl});
  },

  run: function (req, res) {
    return res.view('vcl/index', {vcl: req.body.vcl});
  }


};


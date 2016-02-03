var express = require('express');
var path = require('path');
var injectMeta = require('../../lib/inject-meta');

module.exports = function createApp(inject) {
  var app = express();
  app.use(injectMeta(inject));
  app.get('/', function(req, res) {
      res.sendFile(path.join(__dirname, '/test-index.html'));
  });
  return app;
};
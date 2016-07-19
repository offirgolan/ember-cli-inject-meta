var request = require('supertest');
var assert = require('assert');
var cheerio = require('cheerio');
var createApp = require('./helpers/create-app');

describe('App with no env config', function(){
  var app = createApp(function(req) {
    return;
  }, 'no-env-config');

  it('responds with html', function(done){
    request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('responds with unmodified html', function(done){
    request(app)
      .get('/')
      .expect(function(res) {
       var $ = cheerio.load(res.text);
       assert($('meta[name$="config/environment"]').length === 0);
       assert($('head meta[data-module=true]').length === 0);
       assert($('body script').length === 2);
      })
      .end(done);
  });
});
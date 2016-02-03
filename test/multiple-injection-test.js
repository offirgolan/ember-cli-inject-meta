var request = require('supertest');
var assert = require('assert');
var cheerio = require('cheerio');
var createApp = require('./helpers/create-app');

var metaTags = [{
  path: 'config/user',
  content: { user: 'offir' }
}, {
  path: 'config/api',
  content: { endpoint: 'api/v2' }
}];

describe('App with multiple injections', function(){
  var app = createApp(function(req, res, inject) {
    inject(metaTags);
  });

  it('responds with html', function(done){
    request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('responds with new configs in html', function(done){
    request(app)
      .get('/')
      .expect(function(res) {
       var $ = cheerio.load(res.text);
       assert($('meta[name$="config/environment"]').length === 1);
       assert($('meta[data-module=true]').length === 2);
      })
      .end(done);
  });

  it('responds with module loader script', function(done){
      request(app)
        .get('/')
        .expect(function(res) {
         var $ = cheerio.load(res.text);
         assert($('body script').length === 3);
        })
        .end(done);
    });

  it('new config has escaped content', function(done){
      request(app)
        .get('/')
        .expect(function(res) {
         var $ = cheerio.load(res.text);
         assert($('meta[name$="' + metaTags[0].path + '"]').attr('content') === escape(JSON.stringify(metaTags[0].content)));
        })
        .end(done);
    });
});
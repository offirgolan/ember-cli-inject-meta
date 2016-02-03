var request = require('supertest');
var assert = require('assert');
var cheerio = require('cheerio');
var createApp = require('./helpers/create-app');

var metaTag = {
  path: 'config/user',
  content: { user: 'offir' }
};

describe('App with async injection', function(){
  var app = createApp(function(req, res, inject) {
    setTimeout(function() {
      inject(metaTag);
    }, 500);
  });

  it('responds with html', function(done){
    request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('responds with new config in html', function(done){
    request(app)
      .get('/')
      .expect(function(res) {
       var $ = cheerio.load(res.text);
       assert($('meta[name$="config/environment"]').length === 1);
       assert($('meta[name$="' + metaTag.path + '"]').length === 1);
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
         assert($('meta[name$="' + metaTag.path + '"]').attr('content') === escape(JSON.stringify(metaTag.content)));
        })
        .end(done);
    });
});
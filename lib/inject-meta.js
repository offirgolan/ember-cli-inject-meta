var fs             = require('fs');
var path           = require('path');
var cheerio        = require('cheerio');
var RSVP           = require('rsvp');
var hijackResponse = require('hijackresponse');

module.exports = function(modules) {
  return function(req, res, next) {
    hijackResponse(res, function(err, res) {
      if (err) {
        res.unhijack();
        return next(err);
      }
      // Hijack only HTML response
      var contentType = res.getHeader('Content-Type');
      if (!contentType || !contentType.match(/^text\/html(?:;\s*charset=('|"|)([^'"]+)\1)?$/i)) {
        res.unhijack();
      }

      var bodyChunks = [];
      res.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {
        var body = Buffer.concat(bodyChunks).toString();
        var $document = cheerio.load(body);

        // If no env config, then this isn't the right html file we want to modify
        if (getEnvConfig($document).length === 0) {
          res.end(body);
        } else {
          var namespace = getNamespace($document);
          var promiseHash = {
            moduleLoader: getModuleLoader(),
            modules: new RSVP.Promise(function(resolve) {
              var result = modules(req);
              console.log(result);
              if (!result) {
                resolve();
                return;
              } else if (!Array.isArray(result)) {
                result = [result];
              }
              resolve(Promise.all(result));
            })
          };

          RSVP.hash(promiseHash).then(function(hash) {
            var modules = hash.modules;
              console.log('has modules');

            if (modules) {
              // Format modules to always be an array
              // Inject the module loader script, this is planned to be a part of ember-cli in the near future
              // https://github.com/ember-cli/ember-cli/pull/5233
              injectMetaModuleLoader($document, hash.moduleLoader);

              console.log('inject');
              modules.forEach(function(module) {
              console.log('inject', module.path);
                injectMetaTag($document, createMetaTag(namespace + '/' + module.path, module.content));
              });
            }
            body = $document.html();
            res.setHeader('Content-Length', Buffer.byteLength(body));
            res.end(body);
          }).catch(function(reason) {
            // fail the request
            console.error(reason);
            console.error(reason && reason.stack);
          });
        }
      });
    });
    next();
  };
};

function getEnvConfig($document) {
  return $document('head meta[name$="/config/environment"]');
}

function getNamespace($document) {
  return getEnvConfig($document).attr('name').split('/')[0];
}

function getModuleLoader() {
  return new RSVP.Promise(function(resolve, reject) {
    fs.readFile(path.join(__dirname, 'define-meta-modules.js'), 'utf8', function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function injectMetaTag($document, metaTag) {
  getEnvConfig($document).after(metaTag);
}

function injectMetaModuleLoader($document, moduleLoader) {
  var namespace = getNamespace($document);
  $document('body script[src*="/' + namespace + '"]').before('<script>' + moduleLoader + '</script>');
}

function createMetaTag(name, content) {
  var escapedContent = escape(JSON.stringify(content));
  return '<meta name="' + name + '" data-module=true content="' + escapedContent + '" />';
}

var fs             = require('fs');
var path           = require('path');
var cheerio        = require('cheerio');
var RSVP           = require('rsvp');
var hijackResponse = require('hijackresponse');

module.exports = function(modules) {
  return function(req, res, next) {
    hijackResponse(res, function(err, res) {
      if (err) {
        res.unhijack(); // Make the original res object work again
        return next(err);
      }
      // Hijack only HTML response
      var contentType = res.getHeader('content-type');
      if (!contentType || !contentType.match(/^text\/html(?:;\s*charset=('|"|)([^'"]+)\1)?$/i)) {
        res.unhijack();
      }

      res.removeHeader('Content-Length');

      res.on('data', function(chunk, encoding) {
        var body = chunk instanceof Buffer ? chunk.toString() : chunk;
        var $document = cheerio.load(body);

        // If no env config, then this isn't the right html file we want to modify
        if (getEnvConfig($document).length === 0) {
          res.write(chunk, encoding);
          res.end();
          return;
        }

        var namespace = getNamespace($document);
        var promiseHash = {
          moduleLoader: getModuleLoader(),
          modules: new RSVP.Promise(function(resolve) {
            modules(req, res, resolve);
          })
        };

        RSVP.hash(promiseHash).then(function(hash) {
          var modules = hash.modules;

          if (modules) {
            // Format modules to always be an array
            if (!Array.isArray(modules)) {
              modules = [modules];
            }

            // Inject the module loader script, this is planned to be a part of ember-cli in the near future
            // https://github.com/ember-cli/ember-cli/pull/5233
            injectMetaModuleLoader($document, hash.moduleLoader);

            modules.forEach(function(module) {
              injectMetaTag($document, createMetaTag(namespace + '/' + module.path, module.content));
            });
          }

          res.write($document.html(), encoding);
          res.end();
        });
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

/**
 * readFileSync is not node 10 compatible so we resort to use readFile
 * @method getModuleLoader
 * @return {RSVP.Promise}
 */
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

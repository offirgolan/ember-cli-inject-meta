var fs      = require('fs');
var tamper  = require('tamper');
var cheerio = require('cheerio');

module.exports = function(modules) {
  return tamper(function(req, res) {
    if (/text\/html/.test(res.get('Content-Type'))) {
      return function(body) {
        var $document = cheerio.load(body);

        if (getEnvConfig($document).length === 0) {
          return $document.html();
        }

        var namespace = getNamespace($document);
        var metaModules = modules;

        if (modules && typeof modules === 'function') {
          metaModules = modules(req, res);
        }

        if(metaModules && !Array.isArray(metaModules)) {
          metaModules = [metaModules];
        }

        injectMetaModuleLoader($document);

        metaModules.forEach(function(module) {
          injectMetaTag($document, createMetaTag(namespace + '/' + module.path, module.content));
        });

        return $document.html();
      };
    }
  });
};

function getEnvConfig($document) {
  return $document('head meta[name$="/config/environment"]');
}

function getNamespace($document) {
  return getEnvConfig($document).attr('name').split('/')[0];
}

function injectMetaTag($document, metaTag) {
  getEnvConfig($document).after(metaTag);
}

function injectMetaModuleLoader($document) {
  var namespace = getNamespace($document);
  var moduleLoader = fs.readFileSync(__dirname + '/define-meta-modules.js', 'utf8');
  $document('body script[src$="/' + namespace + '.js"]').before('<script>' + moduleLoader + '</script>');
}

function createMetaTag(name, content) {
  var escapedContent = escape(JSON.stringify(content));
  return '<meta name="' + name + '" data-module=true ' + 'content="' + escapedContent + '" />';
}
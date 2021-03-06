Ember.$('meta[data-module=true],meta[name$="/config/environment"]').each(function(index, meta) {
  define(meta.name, [], function() {
    try {
      return {
        'default': JSON.parse(unescape(meta.content))
      };
    } catch (e) {
      throw new Error('Could not read config from meta tag with name "' + meta.name + '".');
    }
  });
});

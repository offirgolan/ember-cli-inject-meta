# Ember CLI Inject Meta

[![Build Status](https://travis-ci.org/offirgolan/ember-cli-inject-meta.svg?branch=master)](https://travis-ci.org/offirgolan/ember-cli-inject-meta)
[![npm version](https://badge.fury.io/js/ember-cli-inject-meta.svg)](http://badge.fury.io/js/ember-cli-inject-meta)
[![Code Climate](https://codeclimate.com/github/offirgolan/ember-cli-inject-meta/badges/gpa.svg)](https://codeclimate.com/github/offirgolan/ember-cli-inject-meta)
[![Test Coverage](https://codeclimate.com/github/offirgolan/ember-cli-inject-meta/badges/coverage.svg)](https://codeclimate.com/github/offirgolan/ember-cli-inject-meta/coverage)

Inject content into a meta tag which is defined as a module on runtime. This allows you to do operations such as read a cookie to set user data, make async calls to server to get permissions, get/set feature flags, so on and so forth all before your application loads.

## Setup

In this example, we will create our user config that will be located in `<APP_NAMESPACE>/config/user.js`. In your express server, you will have to define the middleware.

```js
// server/index.js

var injectMeta = require('ember-cli-inject-meta');

app.use(injectMeta(function(req) {
    return {
        path: 'config/user',
        content: {
            username: 'offirgolan',
            isAdmin: true
        }
    };
}))
```

This will add the following meta tag in your `index.html`

```html
<meta name="app/config/user" data-module="true" content="%7B%22username%22%3A%22offirgolan%22%2C%22isAdmin%22%3Atrue%7D">
```

```js
// app/routes/index.js

import Ember from 'ember';
import User from '../config/user';

export default Ember.Route.extend({
    redirect() {
        if(user.isAdmin) {
            this.transitionToRoute('admin.index');
        }
    }
})
```

## Possible Inputs

The `injectMeta` function is passed a callback function that is given `req`. You must return either an array of objects / promises, or a single object / promise. Each meta module object should have:

- `path` (**String**): The path used to define your modules. (i.e `confg/user`)
- `content` (**Object**): The content your module will contain. This will be stringified and escaped before injecting it into the meta tag.

### Examples

**Single Meta Tag**

```js
injectMeta(function(req) {
    return {
        path: 'config/user',
        content: { username: 'offirgolan' }
    };
});
```

**Multiple Meta Tags**

```js
injectMeta(function(req) {
    return [{
        path: 'config/user',
        content: { username: 'offirgolan' }
    },{
        path: 'config/api',
        content: { endpoint: 'api/v2' }
    }]
})
```

**Multiple Meta Tags with Promises**

```js
injectMeta(function(req) {
    var userConfig = getUserConfig(req).then(function(result) {
        return {
            path: 'config/user',
            content: result
        }
    });

    var apiConfig = getAPIConfig(req).then(function(result) {
        return {
            path: 'config/api',
            content: result
        }
    });
    
    return [ userConfig, apiConfig ];
})
```

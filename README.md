# Ember CLI Inject Meta

Inject meta tags into your index.html and loads them as modules.

## Setup

In this example, we will create our user config that will be located in `<APP_NAMESPACE>/config/user.js`. In your express server, you will have to define the middleware. 

```js
// server/injex.js

var injectMeta = require('ember-cli-inject-meta');

app.use(injectMeta(function(req, res, inject) {
    inject({
        path: 'config/user',
        content: {
            username: 'offirgolan'
            isAdmin: true
        }
    })
}))
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

The `injectMeta` function is passed a callback function that is given `req`, `res`, and `inject`. You must call `inject`, passing in either an array of meta module objects, or a single meta module object. Each meta module object should have:

- `path` (**String**): The path used to define your modules. (i.e `confg/user`)
- `content` (**Object**): The content your module will contain. This will be stringified and escaped before injecting it into the meta tag.

### Examples

**Single Meta Tag**

```js
injectMeta(function(req, res, inject) {
    inject({
        path: 'config/user',
        content: { username: 'offirgolan' }
    });
});
```

**Mutliple Meta Tags**

```js
injectMeta(function(req, res, inject) {
    inject([{
        path: 'config/user',
        content: { username: 'offirgolan' }
    },{
        path: 'config/api',
        content: { endpoint: 'api/v2' }
    }])
})
```


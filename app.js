'use strict';
let koa     = require('koa'),
    send    = require('koa-send'),
    serve   = require('koa-static');

let app = koa();
// serve files in public folder (css, js etc)
app.use(serve(__dirname + '/public'));

require('./api/routes')(app);

// this last middleware catches any request that isn't handled by
// koa-static or koa-router, ie your index.html in your example
app.use(function* index() {
  yield send(this, __dirname + '/foo.html');
});

app.listen(4000);

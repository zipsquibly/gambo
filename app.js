'use strict';
let koa     = require('koa'),
    send    = require('koa-send'),
    serve   = require('koa-static'),
    session = require('koa-session');

let app = koa();
app.keys = ['79AB8506-67B7-487A-BB70-387B80AA4E4C'];

const CONFIG = {
  key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
  maxAge: 86400000, /** (number) maxAge in ms (default is 1 days) */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
};

app.use(session(CONFIG, app));
// serve files in public folder (css, js etc)
app.use(serve(__dirname + '/public'));

app.use(function* userize(next) {
  if (!this.session.userId) {
    this.session.userId = Math.random().toString(36).substring(20) + '-' +
      Math.random().toString(36).substring(20);
  }
  yield next;
});

require('./api/routes')(app);

// this last middleware catches any request that isn't handled by
// koa-static or koa-router, ie your index.html in your example
app.use(function* index() {
  // ignore favicon
  if (this.path === '/favicon.ico') return;
  //this.body = this.session.userId;
  yield send(this, __dirname + '/foo.html');
});

app.listen(4000);
// or if you prefer all default config, just use => app.use(session(app));

console.log('listening on port 4000');

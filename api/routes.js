  const body = require('koa-better-body')
  const router = require('koa-router')();
  const Game = require('../classes/Game');

  // rest endpoints
  var games = {};

  router.post('/api/games', body(), function *(next){
    console.log(this.request.fields)
    let data = this.request.fields;

    if (!data || !data.type) this.throw(400, 'the type of game is required');

    let game = new Game(data.type);
    games[game.id] = game;
    // there's no `.body` when `multipart`,
    // `urlencoded` or `json` request
    console.log(games);
    // print it to the API requester
    this.body = game;
    yield next
  });

  router.get('/api/games/:gameId', function *(next){
    this.body = games[this.params.gameId];
    yield next
  });

  router.put('/api/games/:gameId/join', body(), function *(next){
    let data = this.request.fields;
    if (!data || !data.userName) this.throw(400, 'a userName is required to join game');
    let game = games[this.params.gameId];
    if (!game) this.throw(404, `game ${this.params.gameId} was not found`);
    try {
      game.addPlayer(data);
    } catch (err) {
      this.throw(400, err);
    }
    this.body = games[this.params.gameId];
    yield next
  });

  router.put('/api/games/:gameId/move', body(), function *(next){
    let data = this.request.fields;
    if (!data || !data.userName) this.throw(400, 'a userName is required to make a move');
    let game = games[this.params.gameId];
    if (!game) this.throw(404, `game ${this.params.gameId} was not found`);
    try {
      game.makeMove(data);
    } catch (err) {
      this.throw(400, err);
    }
    this.body = games[this.params.gameId];
    yield next
  });

  /**
     POST api/games
     GET api/games/:gameId
     POST api/move
     api/players
     api/
  */

  module.exports = function(app) {
    app.use(router.routes());
  };

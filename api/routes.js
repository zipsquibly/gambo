  const body = require('koa-better-body')
  const router = require('koa-router')();
  const Game = require('../classes/Game');
  const pendingGames = [];
  const _ = require('lodash');
  // rest endpoints
  var games = {};

  router.post('/api/games', body(), function *(next){
    console.log(this.request.fields)
    let data = this.request.fields;
    let game;

    if (!data || !data.type) this.throw(400, 'the type of game is required');

    if (pendingGames.length === 0) {
      game = new Game(data.type, this.session.userId);
      games[game.id] = game;
      pendingGames.push(game);
    } else {
      game = pendingGames[0];
    }

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
      game.addPlayer(data, this.session);
    } catch (err) {
      this.throw(400, err);
    }
    this.body = games[this.params.gameId];
    if (game.status === 'READY_FOR_MOVE') {
      _.remove(pendingGames, (pgame) => pgame.id === game.id);
    }
    yield next
  });

  router.put('/api/games/:gameId/move', body(), function *(next){
    let data = this.request.fields;
    console.log(data);
    let game = games[this.params.gameId];
    if (!game) this.throw(404, `game ${this.params.gameId} was not found`);
    try {
      data.to[0] = parseInt(data.to[0], 10)
      data.to[1] = parseInt(data.to[1], 10)
      if (_.isArray(data.from)) {
        data.from[0] = parseInt(data.from[0], 10)
        data.from[1] = parseInt(data.from[1], 10)
      } else {
        data.from = parseInt(data.from, 10)
      }
      game.makeMove(data, this.session);
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

const uuidV4 = require('uuid/v4');
const _ = require('lodash');
const gamePlayerTokens = new WeakMap();
const gameTurns = new WeakMap();

class Game {
  constructor(type) {
    this.type = type;
    this.id = uuidV4();
    this.maxPlayers = 2;
    this.status = 'WAITING_FOR_USERS';
    this.yourTurn = false;
    gamePlayerTokens.set(this, []);
    this.players = [];
  }

  getGamePlayers() {
    return gamePlayers.get(this);
  }

  addPlayer(user) {
    let players = this.getGamePlayers();
    if (!user.userName) {
      throw new Error('unrecognized user', user);
    }
    if (this.maxPlayers && players.length == this.maxPlayers) {
      throw new Error('game has maximum number of players');
    }
    if (_.find(players, function (player){
      return player.userName == user.userName;
    })) {
      throw new Error('Your user has already joined this game');
    }
    players.push(user);
    if (players.length === this.maxPlayers) {
      this.status = 'READY_FOR_MOVE';
      gameTurns.set(this, user);
      this.yourTurn = true;
    }
  }

  makeMove(move) {
    let players = this.getGamePlayers();
    if (!user.userName) {
      throw new Error('unrecognized user', user);
    }
    if (!_.find(players, function (player){
      return player.userName == move.userName;
    })) {
      throw new Error('Your user is not part of this game');
    }
  }
}

module.exports = Game;

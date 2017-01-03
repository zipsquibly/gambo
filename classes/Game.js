const uuidV4 = require('uuid/v4');
const tv4 = require('tv4');
const _ = require('lodash');
const gamePlayers = new WeakMap();
const gameTurns = new WeakMap();
const boardHistory = new WeakMap();

class Game {
  constructor(type) {
    this.type = type;
    this.id = uuidV4();
    this.maxPlayers = 2;
    this.status = 'WAITING_FOR_USERS';
    gamePlayers.set(this, []);
    this.players = [];
    this.board = [
      [[0,0], [0,0], [0,0]],
      [[0,0], [0,0], [0,0]],
      [[0,0], [0,0], [0,0]],
    ];
    boardHistory.set(this, [
      [[],[],[]],
      [[],[],[]],
      [[],[],[]]
    ]);
  }

  getGamePlayers() {
    return gamePlayers.get(this);
  }

  addPlayer(user, session) {
    let players = this.getGamePlayers();
    if (!user.userName) {
      throw new Error('userName is required', user);
    }
    if (this.maxPlayers && players.length == this.maxPlayers) {
      throw new Error('game has maximum number of players');
    }
    if (_.find(players, function (player){
      return player.userId == session.userId;
    })) {
      throw new Error('Your user has already joined this game');
    }

    let player = {
      userId: session.userId,
      userName: user.userName,
      playerNumber: players.length === 0 ? 1 : 2,
      inventory: [1,1,2,2,3,3]
    };
    players.push(player);

    this.players.push(player);

    if (players.length === this.maxPlayers) {
      this.status = 'READY_FOR_MOVE';
      gameTurns.set(this, user);
      this.playerTurn = player;
    }
  }

  makeMove(move, session) {
    let players = this.getGamePlayers();
    let player = _.find(players, function (player){
      return player.userId == session.userId;
    });
    if (!player) throw new Error('Your user is not part of this game');
    if (this.status !== 'READY_FOR_MOVE') throw new Error('Not ready to move. Status:' + this.status);
    if (this.playerTurn.userId !== session.userId) throw new Error('Not your turn!');

    var result = tv4.validateMultiple(move, moveSchema);
    if (result.valid === false) {
      throw new Error(JSON.stringify(result));
    }

    let pieceValue;

    let [toX,toY] = move.to;
    let toSpace = this.board[toX][toY];
    let history = boardHistory.get(this);

    if (_.isArray(move.from)) {
      // move from position [x,y]
      let [x,y] = move.from;
      let fromSpace = this.board[x][y];
      if (fromSpace[0] !== player.playerNumber) {
        throw new Error('invalid move: from piece not yours or doesn\'t exist');
      }
      pieceValue = fromSpace[1];
      if (pieceValue <= toSpace[1]) {
        throw new Error('invalid move: from piece is smaller than to piece');
      }
      this.board[x][y] = history[x][y].pop() || [0,0];
    } else {
      // check inventory
      pieceValue = move.from;
      let pieceIdx = _.indexOf(player.inventory, pieceValue);
      if (pieceIdx === -1) {
        throw new Error('invalid move: piece not in players inventory');
      }
      if (pieceValue <= toSpace[1]) {
        throw new Error('invalid move: from piece is smaller than to piece');
      }
      _.pullAt(player.inventory, pieceIdx);
    }

    history[toX][toY].push(toSpace);
    this.board[toX][toY] = [player.playerNumber, pieceValue];
    this.playerTurn = _.find(players, function (player){
      return player.userId != session.userId;
    });

    let winner = testForWinner(this.board);
    if (winner) {
      this.status = 'GAME_OVER';
      delete this.playerTurn;
      this.winner = _.find(players, function (player){
        return player.playerNumber === winner;
      });
    }
  }
}

function testForWinner(board) {
  let winner = false;
  console.log(board);
  // _.times(3).find(function(i) {
  //   winner = board[i][0][0] === board[i][1][0] && board[i][1][0] === board[i][2][0] ? board[i][1][0] : false;
  //   winner = winner || board[0][i][0] === board[1][i][0] && board[1][i][0] === board[2][i][0] ? board[1][i][0] : false;
  //   return winner;
  // });
  winner = winner || board[0][0][0] === board[0][1][0] && board[0][1][0] === board[0][2][0] ? board[0][0][0] : false;
  winner = winner || board[1][0][0] === board[1][1][0] && board[1][1][0] === board[1][2][0] ? board[1][0][0] : false;
  winner = winner || board[2][0][0] === board[2][1][0] && board[2][1][0] === board[2][2][0] ? board[2][0][0] : false;

  winner = winner || board[0][0][0] === board[1][0][0] && board[1][0][0] === board[2][0][0] ? board[0][0][0] : false;
  winner = winner || board[0][1][0] === board[1][1][0] && board[1][1][0] === board[2][1][0] ? board[1][0][0] : false;
  winner = winner || board[0][2][0] === board[1][2][0] && board[1][2][0] === board[2][2][0] ? board[2][0][0] : false;

  winner = winner || board[0][0][0] === board[1][1][0] && board[1][1][0] === board[2][2][0] ? board[1][1][0] : false;
  winner = winner || board[2][0][0] === board[1][1][0] && board[1][1][0] === board[0][2][0] ? board[1][1][0] : false;
  return winner;
}

const moveSchema = {
	"title": "Move Schema",
	"type": "object",
  "definitions": {
    "position": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0,
        "maximum": 2
      },
      "maxItems": 2,
      "minItems": 2
    },
    "piece": {
      "type": "integer",
      "minimum": 1,
      "maximum": 3
    }
  },
	"properties": {
		"from": {
      "oneOf": [
        { "$ref": "#/definitions/position" },
        { "$ref": "#/definitions/piece" }
      ]
		},
		"to": {
      "$ref": "#/definitions/position"
    }
	},
	"required": ["from", "to"]
}

module.exports = Game;

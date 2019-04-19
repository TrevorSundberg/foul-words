const express = require('express');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser');
const path = require('path');
const enableWs = require('express-ws');
const nocache = require('nocache');

const app = express();
app.use(cookieParser());
app.use(nocache());
enableWs(app);

const games = {
};

const gameMaxPlayers = 2;

app.use((req, res, next) => {
  if (!req.cookies.playerId) {
    const playerId = uuidv4();
    res.cookie('playerId', playerId, {
      expires: new Date(8640000000000000),
      httpOnly: true,
      signed: false
    });
    req.cookies.playerId = playerId;
  }
  next();
});

const send = (ws, playerId, object) => {
  const originalSender = object.sender;
  object.sender = originalSender === playerId ? 'local' : 'remote';
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(object));
  }
  object.sender = originalSender;
};

app.ws('/api/:gameId', (ws, req) => {
  const gameId = req.params.gameId;
  if (!gameId) {
    console.error(`Invalid gameId ${gameId}`);
    return;
  }

  let game = games[gameId];
  if (!game) {
    game = {
      players: {
      },
      messages: []
    };
    games[gameId] = game;
  }

  const playerId = req.cookies.playerId;

  if (game.players[playerId] || Object.values(game.players).length < gameMaxPlayers) {
    game.players[playerId] = {
      id: playerId,
      ws,
    };
  } else {
    ws.close(1000, `The game already has ${gameMaxPlayers} players and is full.`);
    return;
  }

  for (const message of game.messages) {
    console.log('sent', message);
    send(ws, playerId, message);
  }

  console.log(games);

  ws.on('message', message => {
    const json = JSON.parse(message);
    json.sender = playerId;
    game.messages.push(json);
    switch (json.type) {
    default:
      for (const player of Object.values(game.players)) {
        send(player.ws, player.id, json);
      }
      break;
    }
  });
});

app.use('/:gameId', express.static(path.join(__dirname, 'public')));

const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

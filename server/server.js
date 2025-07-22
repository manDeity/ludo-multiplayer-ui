const express = require("express"), http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express(), server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let games = {};

app.get("/", (req, res) => res.send("Ludo Server"));

io.on("connection", socket => {
  socket.on("createRoom", () => {
    const room = Math.random().toString(36).substr(2, 6);
    const colors = ["red", "green", "yellow", "blue"];
    const players = [socket.id];
    const tokenState = colors.reduce((a, c) => ({ ...a, [c]: [0, 0, 0, 0] }), {});
    games[room] = { players, turnOrder: colors, tokens: tokenState, dice: 0, turn: colors[0] };
    socket.join(room);
    socket.emit("roomCreated", room);
  });

  socket.on("joinRoom", room => {
    const game = games[room];
    if (game && game.players.length < 4) {
      game.players.push(socket.id);
      socket.join(room);
      socket.emit("joinedRoom", {
        color: game.turnOrder[game.players.length - 1],
        turnOrder: game.turnOrder,
        tokens: game.tokens
      });
      io.to(room).emit("updateState", game);
    } else {
      socket.emit("error", "Cannot join");
    }
  });

  socket.on("rollDice", ({ room }) => {
    const game = games[room];
    if (!game) return;
    game.dice = Math.floor(Math.random() * 6) + 1;
    game.turn = nextTurn(game.turnOrder, game.turn);
    io.to(room).emit("updateState", game);
  });
});

function nextTurn(order, current) {
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

server.listen(process.env.PORT || 3000, () => console.log("Running"));

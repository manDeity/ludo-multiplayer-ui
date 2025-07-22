const socket = io("https://YOUR_RENDER_SERVER");
let playerColor, roomId, turnOrder = [], yourTurn = false;
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const positions = [...Array(52)].map((_, i) => ({
  x: (i % 13) * 40 + 10,
  y: Math.floor(i / 13) * 40 + 10
}));

const state = { players: {}, tokens: {}, dice: 0 };

function drawBoard() {
  ctx.clearRect(0, 0, 600, 600);
  ctx.strokeStyle = '#000';
  for (let i = 0; i < 13; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40, 600); ctx.stroke();
    ctx.moveTo(0, i * 40); ctx.lineTo(600, i * 40); ctx.stroke();
  }
  for (let color in state.tokens) {
    state.tokens[color].forEach(pos => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(positions[pos].x, positions[pos].y, 15, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

socket.on("roomCreated", id => { roomId = id; joinRoom(); });
socket.on("joinedRoom", data => {
  playerColor = data.color;
  turnOrder = data.turnOrder;
  document.getElementById("roomID").innerText = "Room: " + roomId;
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
  state.tokens = data.tokens;
  yourTurn = turnOrder[0] === playerColor;
  document.getElementById("rollBtn").disabled = !yourTurn;
  drawBoard();
});
socket.on("updateState", s => {
  Object.assign(state, s);
  yourTurn = state.turn === playerColor;
  document.getElementById("rollBtn").disabled = !yourTurn;
  document.getElementById("diceRes").innerText = "Dice: " + state.dice;
  drawBoard();
});

function createRoom() { socket.emit("createRoom"); }
function joinRoom() {
  roomId = roomId || document.getElementById("roomInput").value;
  socket.emit("joinRoom", roomId);
}
function rollDice() {
  socket.emit("rollDice", { roomId });
}

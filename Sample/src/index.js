const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: 'http://3.95.6.39:5500', // Update with frontend domain in production
  }
});

let players = [];
let choices = {};

function determineWinner() {
  const [p1, p2] = players;
  const c1 = choices[p1.id];
  const c2 = choices[p2.id];

  const outcomes = {
    rock: { rock: 'draw', paper: 'player2', scissors: 'player1' },
    paper: { rock: 'player1', paper: 'draw', scissors: 'player2' },
    scissors: { rock: 'player2', paper: 'player1', scissors: 'draw' },
  };

  const winner = outcomes[c1][c2];

  // Emit result to both players
  io.to(p1.id).emit('result', {
    type: 'result',
    [p1.id]: c1,
    [p2.id]: c2,
    p1Id: p1.id,
    p2Id: p2.id,
    winner
  });

  io.to(p2.id).emit('result', {
    type: 'result',
    [p1.id]: c1,
    [p2.id]: c2,
    p1Id: p1.id,
    p2Id: p2.id,
    winner
  });

  choices = {};
}

io.on('connection', (socket) => {
  if (players.length >= 2) {
    socket.emit('full', { type: 'full' });
    socket.disconnect();
    return;
  }

  console.log("Player connected:", socket.id);
  players.push(socket);
  socket.emit('joined', { type: 'joined', id: socket.id });

  socket.on('choice', (data) => {
    choices[socket.id] = data.choice;

    if (Object.keys(choices).length === 2) {
      determineWinner();
    }
  });

  socket.on('disconnect', () => {
    console.log("Player disconnected:", socket.id);
    players = players.filter(p => p.id !== socket.id);
    delete choices[socket.id];
  });
});


server.listen(8080, () => {
  console.log('Socket.IO server running on port 8080');
});

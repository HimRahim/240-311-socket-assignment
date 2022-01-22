const net = require('net');

const host = 'localhost';
const port = 8000;
let playerNum = 0;
let players = Object.create(null);
let symbol = '';

const server = net.createServer();
server.listen(port, host, () => {
  console.log(`TCP server listening on ${host}:${port}`);
});

let sockets = [];
let phase = 1;
let board = ['-', '-', '-', '-', '-', '-', '-', '-', '-'];
let currentPlayer = 1;

let renderedBoard = `
      | ${board[0]} | ${board[1]} | ${board[2]} |
      | ${board[3]} | ${board[4]} | ${board[5]} |
      | ${board[6]} | ${board[7]} | ${board[8]} |
  `;

server.on('connection', (socket) => {
  if (sockets.length == 2) {
    socket.write('the game has already begun');
    return;
  }
  playerNum++;
  socket.nickname = `player${playerNum}`;
  var clientName = socket.nickname;

  players[clientName] = socket;
  socket.on('close', () => {
    delete players[socket.nickname];
  });
  var clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`new client connected: ${clientAddress}`);
  sockets.push(socket);

  socket.on('data', (data) => {
    console.log(`Client ${clientAddress}: ${data}`);
    switch (phase) {
      case 1:
        if (Object.keys(players).length < 2) socket.write(`wait for other player`);
        if (Object.keys(players).length == 2) {
          // sockets.forEach((sock) => {
          //   sock.write('prepare for game');
          // });
          players[`player${1}`].write('prepare for game');
          players[`player${2}`].write('prepare for game');
          phase += 1;
        }
        break;

      case 2:
        if (data == 'Ready') {
          players[`player${currentPlayer}`].write('Your turn');
        }
        players[`player${1}`].write(renderedBoard);
        players[`player${2}`].write(renderedBoard);
        phase += 1;
        break;
      case 3:
        if (parseInt(data) >= 0 && parseInt(data) <= 8) {
          if (isConflict(parseInt(data))) {
            players[`player${currentPlayer}`].write('Enter available position');
          } else {
            if (currentPlayer == 1) {
              symbol = 'X';
              board[parseInt(data)] = symbol;
            } else {
              symbol = 'O';
              board[parseInt(data)] = symbol;
            }
            renderedBoard = reRenderBoard();

            if (isBoardFilled()) {
              players[`player1`].write(renderedBoard);
              players[`player1`].write('Draw');
              players[`player2`].write(renderedBoard);
              players[`player2`].write('Draw');
              phase += 1;
            }

            if (
              isrowStraight(parseInt(data), symbol) ||
              isColumnStraight(parseInt(data), symbol) ||
              isDiagonalStraight(parseInt(data), symbol)
            ) {
              players[`player${currentPlayer}`].write(renderedBoard);
              players[`player${currentPlayer}`].write('You win');
              if (currentPlayer == 1) currentPlayer = 2;
              else currentPlayer = 1;
              players[`player${currentPlayer}`].write(renderedBoard);
              players[`player${currentPlayer}`].write('You lose');
              phase += 1;
            }

            if (currentPlayer == 1) players[`player${2}`].write(renderedBoard);
            else players[`player${1}`].write(renderedBoard);

            if (currentPlayer == 1) currentPlayer = 2;
            else currentPlayer = 1;

            console.log(renderedBoard);

            players[`player${currentPlayer}`].write('Your turn');
          }
        }
        break;
      case 4:
        (async () => {
          await clearBoard();
          renderedBoard = reRenderBoard();
          playerNum = 0;
          for (const key in players) {
            delete players[key];
          }
          phase = 1;
        })();
    }
  });

  socket.on('close', () => {
    let index = sockets.findIndex((disconnectedClient) => {
      return (
        disconnectedClient.remoteAddress === socket.remoteAddress &&
        disconnectedClient.remotePort === socket.remotePort
      );
    });
    if (index !== -1) sockets.splice(index, 1);
    sockets.forEach((sock) => {
      sock.write(`${clientAddress} disconnected\n`);
    });
    console.log(`connection closed: ${clientAddress}`);
  });

  socket.on('error', (err) => {
    console.log(`Error occurred in ${clientAddress}: ${err.message}`);
  });
});

const reRenderBoard = () => {
  return `
  | ${board[0]} | ${board[1]} | ${board[2]} |
  | ${board[3]} | ${board[4]} | ${board[5]} |
  | ${board[6]} | ${board[7]} | ${board[8]} |
`;
};

const isConflict = (index) => {
  if (board[index] != '-') return true;
  return false;
};

const isrowStraight = (index, currentSymbol) => {
  switch (index) {
    case 0:
    case 3:
    case 6:
      if (
        board[index] == currentSymbol &&
        board[index + 1] == currentSymbol &&
        board[index + 2] == currentSymbol
      )
        return true;
      return false;

    case 1:
    case 4:
    case 7:
      if (
        board[index] == currentSymbol &&
        board[index - 1] == currentSymbol &&
        board[index + 1] == currentSymbol
      )
        return true;
      return false;

    case 2:
    case 5:
    case 8:
      if (
        board[index] == currentSymbol &&
        board[index - 1] == currentSymbol &&
        board[index - 2] == currentSymbol
      )
        return true;
      return false;
  }
};

const isColumnStraight = (index, currentSymbol) => {
  switch (index) {
    case 0:
    case 1:
    case 2:
      if (
        board[index] == currentSymbol &&
        board[index + 3] == currentSymbol &&
        board[index + 6] == currentSymbol
      )
        return true;
      return false;

    case 3:
    case 4:
    case 5:
      if (
        board[index] == currentSymbol &&
        board[index - 3] == currentSymbol &&
        board[index + 3] == currentSymbol
      )
        return true;
      return false;

    case 6:
    case 7:
    case 8:
      if (
        board[index] == currentSymbol &&
        board[index - 3] == currentSymbol &&
        board[index - 6] == currentSymbol
      )
        return true;
      return false;
  }
};

const isDiagonalStraight = (index, currentSymbol) => {
  switch (index) {
    case 0:
      if (
        board[index] == currentSymbol &&
        board[4] == currentSymbol &&
        board[8] == currentSymbol
      )
        return true;
      return false;
    case 2:
      if (
        board[index] == currentSymbol &&
        board[4] == currentSymbol &&
        board[6] == currentSymbol
      )
        return true;
      return false;
    case 4:
      if (
        board[index] == currentSymbol &&
        board[0] == currentSymbol &&
        board[8] == currentSymbol
      )
        return true;
      if (
        board[index] == currentSymbol &&
        board[2] == currentSymbol &&
        board[6] == currentSymbol
      )
        return true;
      return false;
    case 6:
      if (
        board[index] == currentSymbol &&
        board[4] == currentSymbol &&
        board[2] == currentSymbol
      )
        return true;
      return false;
    case 8:
      if (
        board[index] == currentSymbol &&
        board[4] == currentSymbol &&
        board[0] == currentSymbol
      )
        return true;
      return false;
  }
};

const isBoardFilled = () => {
  return !board.some((element) => element == '-');
};

const clearBoard = async () => {
  board = ['-', '-', '-', '-', '-', '-', '-', '-', '-'];
}

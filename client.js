const net = require('net');
const prompt = require('prompt');
const delay = require('delay');

const HOST = 'localhost';
const PORT = 8000;

var client = new net.Socket();
client.connect(PORT, HOST, () => {
  console.log(`Connected to ${HOST}:${PORT}`);
  client.write(`Hello, I am ${client.address().address}`);
});

client.on('data', (data) => {
  console.log(`Client received: ${data}`);
  if (data == 'game has already begun') client.destroy();
  else if (data == 'prepare for game') client.write('Ready');
  else if (
    data.includes('You win') ||
    data.includes('You lose') ||
    data.includes('Draw')
  ) {
    client.write('Bye');
    client.destroy();
  } else if (
    data.includes('Your turn') ||
    data.includes('Enter available position')
  ) {
    (async () => {
      await delay(1000);
      client.write(`${Math.floor(Math.random() * 9)}`);
    })();
  }
});

client.on('close', () => {
  console.log('Client closed');
});

client.on('error', (err) => {
  console.error(err);
});

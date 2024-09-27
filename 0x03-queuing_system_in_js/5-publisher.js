// Publisher

import { createClient } from 'redis';


const publisher = createClient()
  .on('error', err => console.error(`Redis client not connected to the server: ${err}`))
  .on('connect', () => {
    console.log('Redis client connected to the server');
  });


function publishMessage(message, time) {
  setTimeout(() => {
    console.log(`About to send ${message}`);
    publisher.publish('holberton school channel', message);
  }, time);
}

// Function calls
publishMessage('Holberton Student #1 starts course', 100);
publishMessage('Holberton Student #2 starts course', 200);
publishMessage('KILL_SERVER', 300);
publishMessage('Holberton Student #3 starts course', 400);

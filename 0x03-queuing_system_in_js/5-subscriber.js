// Subscriber

import { createClient } from 'redis';


const subscriber = createClient()
  .on('error', err => console.error(`Redis client not connected to the server: ${err}`))
  .on('connect', () => {
    console.log('Redis client connected to the server');
  });


subscriber.subscribe('holberton school channel');

subscriber.on('message', (channel, message) => {
    console.log(message);
    if (message === 'KILL_SERVER') {
      subscriber.unsubscribe(channel);
      subscriber.quit();
    }
  },
);

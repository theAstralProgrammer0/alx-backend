import { createClient, print } from 'redis';

const key = 'HolbertonSchools';

const client = createClient()
  .on('error', err => console.error(`Redis client not connected to the server: ${err}`))
  .on('connect', () => {
    console.log('Redis client connected to the server');
  });

/**
 * Sets value in a Redis hash
 */
function createHash() {
  const schools = {
    Portland: 50,
    Seattle: 80,
    'New York': 20,
    Bogota: 20,
    Cali: 40,
    Paris: 2,
  };

  for (const [city, value] of Object.entries(schools)) {
    client.hset(key, city, value, print);
  }
}

/**
 * Displays the value of a given field in a Redis hash
 */
function displayHash() {
  client.hgetall(key, (err, object) => {
    if (err) {
      console.error(err);
    } else {
      console.log(object);
    }
    client.quit();
  });
}

createHash();
displayHash();

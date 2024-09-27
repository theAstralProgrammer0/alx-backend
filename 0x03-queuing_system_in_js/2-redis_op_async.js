#!/usr/bin/env node

import { createClient, print } from 'redis';
import { promisify } from 'util';

const client = createClient()
  .on('error', err => console.error(`Redis client not connected to the server: ${err}`))
  .on('connect', () => {
    console.log('Redis client connected to the server');
  });


/**
 * Set a new value
 * @param schoolName - key
 * @param value - value
 */
function setNewSchool(schoolName, value) {
  client.set(schoolName, value, print);
}


const getAsync = promisify(client.get).bind(client);

/**
 * Get the value of a key
 * @param schoolName
 */
async function displaySchoolValue(schoolName) {
  try {
    const result = await getAsync(schoolName);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await displaySchoolValue('Holberton');
  await setNewSchool('HolbertonSanFrancisco', '100');
  await displaySchoolValue('HolbertonSanFrancisco');

  // Gracefully handle the Redis client on exit
  process.on('exit', async () => {
    await client.disconnect();
    console.log('Redis client closed');
  });
})();

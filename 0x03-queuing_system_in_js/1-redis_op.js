#!/usr/bin/env node

import { createClient, print } from 'redis';

const client = createClient();

client
  .on('error', err => console.error(`Redis client not connected to the server: ${err}`))
  .on('connect', () => console.log('Redis client connected to the server'));

/**
 * Set a new value
 * @param schoolName - key
 * @param value - value
 */
function setNewSchool(schoolName, value) {
  client.set(schoolName, value, print);
}

/**
 * Get the value of a key
 * @param schoolName
 */
function displaySchoolValue(schoolName) {
  client.get(schoolName, (err, reply) => {
    if (err) {
      console.error(err);
    } else {
      console.log(reply);
    }
  });
}

displaySchoolValue('Holberton');
setNewSchool('HolbertonSanFrancisco', '100');
displaySchoolValue('HolbertonSanFrancisco');

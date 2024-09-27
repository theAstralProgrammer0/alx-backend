// Seat reservation system

const kue = require('kue');
const redis = require('redis');
const { promisify } = require('util');
const express = require('express');
const port = 1245;

const api = express();
const seatReservationJob = 'reserve_seat';

const availableSeatsKey = 'available_seats';
const queue = kue.createQueue();
let reservationEnabled = true;

const client = redis.createClient()
  .on('error', (error) => console.error(`Redis client error: ${error}`))
  .on('connect', async () => {
    await reserveSeat(50); // Start with 50 seats
    console.log('Redis client connected to server successfully');
  });

const setAsync = promisify(client.set).bind(client);
const getAsync = promisify(client.get).bind(client);

/**
 * Reserves a specified number of seats.
 *
 * This function sets the number of available seats in the Redis cache to the specified number.
 * It logs the new number of reserved seats or an error message if the caching operation fails.
 *
 * @async
 * @function reserveSeat
 * @param {number} number - The number of seats to reserve
 * @returns {Promise<void>}
 */
async function reserveSeat(number) {
  try {
    await setAsync(availableSeatsKey, number);
    console.log(`Available seats for reservations: ${number}`);
  } catch (error) {
    console.error(`An error occurred while caching: ${error.message}`);
  }
}

/**
 * Retrieves the current number of available seats from the Redis cache.
 *
 * This function fetches the number of available seats stored in the Redis cache
 * and returns it as an integer. If an error occurs during the retrieval process,
 * it logs the error and returns null.
 *
 * @async
 * @function getCurrentAvailableSeats
 * @returns {Promise<number|null>} The number of available seats or null if an error occurs
 */
async function getCurrentAvailableSeats() {
  try {
    const seats = await getAsync(availableSeatsKey);
    return seats !== null ? parseInt(seats, 10) : null;
  } catch (error) {
    console.error(`An error occurred while retrieving available seats: ${error.message}`);
    return null;
  }
}

api.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/**
 * Endpoint to get the number of available seats.
 *
 * This endpoint retrieves the current number of available seats from the Redis cache
 * and returns it as a JSON response.
 *
 * @name GET /available_seats
 * @function
 * @memberof api
 * @inner
 * @returns {Object} JSON response containing the number of available seats
 */
api.get('/available_seats', async (req, res) => {
  res.json({ numberOfAvailableSeats: await getCurrentAvailableSeats() });
});
/**
 * Endpoint to reserve a seat.
 *
 * This endpoint creates a job to reserve a seat. It checks if reservations are enabled,
 * and if so, it creates a job in the queue to process the reservation. The job's status
 * is monitored for completion or failure.
 *
 * @name GET /reserve_seat
 * @function
 * @memberof api
 * @inner
 * @returns {Object} JSON response indicating the status of the reservation process
 */
api.get('/reserve_seat', async (req, res) => {
  if (!reservationEnabled) {
    return res.status(403).json({ status: 'Reservations are blocked' });
  }

  const job = queue.create(seatReservationJob).save((error) => {
    if (error) {
      return res.status(500).json({ status: 'Reservation failed' });
    }

    job.on('failed', (error) => {
      console.error(`Seat reservation job #${job.id} failed: ${error}`);
    });

    job.on('complete', () => {
      console.log(`Seat reservation job #${job.id} completed`);
    });

    res.status(200).json({ status: 'Reservation in process' });
  });
});
/**
 * Endpoint to process seat reservations.
 *
 * This endpoint processes the seat reservation jobs in the queue. It handles
 * the reservation logic by checking the current available seats and updating
 * the reservation status accordingly.
 *
 * @name GET /process
 * @function
 * @memberof api
 * @inner
 * @returns {Object} JSON response indicating the status of the queue processing
 */
api.get('/process', async (req, res) => {
  queue.process(seatReservationJob, 2, async (job, done) => {
    console.log(`\n[Job Processor] Processing Reservation Job: #${job.id}`);

    const currentSeatsAvailable = await getCurrentAvailableSeats();

    if (currentSeatsAvailable === 0) {
      reservationEnabled = false; // Reservations are closed
      done(Error('Not enough seats available'));
    } else if (currentSeatsAvailable - 1 === 0) {
      reservationEnabled = false; // Reservations are closed
    }

    // Reserve one seat by decrementing the available seats
    await reserveSeat(currentSeatsAvailable - 1);

    done();
  });

  res.status(200).json({ status: 'Queue processing' });
});

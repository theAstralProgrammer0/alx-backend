// Push notifications

/**
 * Create push notification jobs
 * @param jobs - Array of jobs
 * @param queue - Kue queue
 */
export default function createPushNotificationJobs(jobs, queue) {
  if (!Array.isArray(jobs)) {
    throw new Error('Jobs is not an array');
  }

  jobs.forEach(jobData => {
    const job = queue.create('push_notification_code_3', jobData);

    job.save((err) => {
      if (!err) {
        console.log(`Notification job created: ${job.id}`);
      } else {
        console.error(`Notification job failed: ${job.id}`);
      }
    });
  });
}

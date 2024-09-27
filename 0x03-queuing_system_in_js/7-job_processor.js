// Notification sender

const kue = require('kue');
const queue = kue.createQueue();

const blacklistedNumbers = ['4153518780', '4153518781'];


queue.process('push_notification_code_2', 2, (job, done) => {
  const { phoneNumber, message } = job.data;
  sendNotification(phoneNumber, message, job, done);
});

function sendNotification(phoneNumber, message, job, done) {
  job.progress(0, 100);
  
  if (blacklistedNumbers.includes(phoneNumber)) {
    return done(Error(`Phone number ${phoneNumber} is blacklisted`));
  }

  job.progress(50, 100);
  console.log(`Sending notification to ${phoneNumber}, with message: ${message}`);
  job.progress(100, 100);
  done();
}

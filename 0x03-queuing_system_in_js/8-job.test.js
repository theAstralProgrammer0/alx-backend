import { expect } from "chai";
import kue from "kue";
import { after, afterEach, before } from 'mocha';
import createPushNotificationJobs from "./8-job";

const queue = kue.createQueue();

describe("createPushNotificationJobs", () => {
  before(function () {
    queue.testMode.enter();
  });

  afterEach(function () {
    queue.testMode.clear();
  });

  after(function () {
    queue.testMode.exit();
  });

  it("throws an error if jobs is not an array", () => {
    expect(() => createPushNotificationJobs("jobs", queue)).to.throw(Error,
      "Jobs is not an array",
    );
  });

  it("creates 2 jobs and adds them to the queue", () => {
    const jobs = [
      {
        phoneNumber: "4153518780",
        message: "This is the code 1234 to verify your account",
      },
      {
        phoneNumber: "4153518781",
        message: "This is the code 4562 to verify your account",
      },
    ];

    createPushNotificationJobs(jobs, queue);

    expect(queue.testMode.jobs.length).to.equal(2);
    expect(queue.testMode.jobs[0].type).to.equal("push_notification_code_3");
    expect(queue.testMode.jobs[0].data).to.deep.equal(jobs[0]);
    expect(queue.testMode.jobs[1].type).to.equal("push_notification_code_3");
    expect(queue.testMode.jobs[1].data).to.deep.equal(jobs[1]);
  });

  it("does not create any jobs when an empty array is passed", () => {
    const jobs = [];

    createPushNotificationJobs(jobs, queue);

    expect(queue.testMode.jobs.length).to.equal(0);
  });

  it("adds jobs to the queue in the correct order", () => {
    const jobs = [
      { phoneNumber: "4153518780", message: "First job" },
      { phoneNumber: "4153518781", message: "Second job" },
    ];

    createPushNotificationJobs(jobs, queue);

    expect(queue.testMode.jobs.length).to.equal(2);
    expect(queue.testMode.jobs[0].data.message).to.equal("First job");
    expect(queue.testMode.jobs[1].data.message).to.equal("Second job");
  });

  it("adds duplicate jobs to the queue", () => {
    const jobs = [
      { phoneNumber: "4153518780", message: "This is the code 1234 to verify your account" },
      { phoneNumber: "4153518780", message: "This is the code 1234 to verify your account" },
    ];

    createPushNotificationJobs(jobs, queue);

    expect(queue.testMode.jobs.length).to.equal(2);
    expect(queue.testMode.jobs[0].data).to.deep.equal(jobs[0]);
    expect(queue.testMode.jobs[1].data).to.deep.equal(jobs[1]);
  });

  it("handles a large number of jobs efficiently", () => {
    const jobs = Array.from({ length: 1000 }, (_, index) => ({
      phoneNumber: `41535187${index.toString().padStart(2, '0')}`,
      message: `This is the code ${index} to verify your account`,
    }));

    createPushNotificationJobs(jobs, queue);

    expect(queue.testMode.jobs.length).to.equal(1000);

    // Verify that all jobs were added to the queue
    jobs.forEach((job, index) => {
      expect(queue.testMode.jobs[index].type).to.equal("push_notification_code_3");
      expect(queue.testMode.jobs[index].data).to.deep.equal(job);
    });
  });

});

const { ulid } = require('ulid');
const nodeSchedule = require('node-schedule');
const fs = require('fs');
const { join } = require('path');

exports.init = (path, handler) => {
  const activeJobs = {};

  const basePath = path.startsWith('/')
    ? path
    : join(__dirname, '..', path);

  const getFilePath = (id) => join(basePath, id + '.json');

  const loadJob = (details) => {
    const { id, topic, message } = details;
    let { schedule } = details;
    if (typeof schedule === 'string') schedule = new Date(schedule);

    console.log('Loading job', id, topic, message, schedule);

    const scheduledJob = nodeSchedule.scheduleJob(schedule, () => {
      handler(details);

      if (!scheduledJob.nextInvocation()) {
        cancelJob(id);
      }
    });

    if (scheduledJob) {
      activeJobs[id] = scheduledJob;
      return;
    }
  };

  const cancelJob = (id) => {
    return new Promise((resolve, reject) => {
      const job = activeJobs[id];
      job.cancel();
      delete activeJobs[id];
      fs.unlink(getFilePath(id), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  // load saved jobs
  fs.readdir(basePath, (err, files) => {
    if (err) return console.error(err);

    files.forEach(path => {
      fs.readFile(join(basePath, path), 'utf8', (err, json) => {
        if (err) return console.error(err);

        console.log(json);
        const details = JSON.parse(json);
        loadJob(details);
      });
    });
  });

  return {
    create(details) {
      if (details.id && activeJobs[details.id]) {
        console.log('Job exists. Overriding.', details.id);
        return this.clearById(details.id).then(() => this.create(details));
      }

      const id = details.id || ulid();
      const job = Object.assign(
        { id },
        { topic: details.topic, message: details.message, schedule: details.schedule }
      );

      const filePath = getFilePath(id);
      fs.writeFile(filePath, JSON.stringify(job), 'utf8', (err) => {
        if (err) console.error(err);
      });

      loadJob(job);
    },
    clearById(id) {
      return cancelJob(id);
    },
    clearByTopic(topic) {
      const promises = [];
      Object.keys(activeJobs).forEach(id => {
        const job = activeJobs[id];
        if (!job || job.topic !== topic) return;

        promises.push(cancelJob(id));
      });
      return Promise.all(promises);
    }
  }
};

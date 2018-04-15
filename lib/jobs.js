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

    const scheduledJob = nodeSchedule.scheduleJob(schedule, () => {
      handler(details);

      if (!scheduledJob.nextInvocation()) {
        cancelJob(id);
      }
    });
    activeJobs[id] = scheduledJob;
  };

  const cancelJob = (id) => {
    fs.unlink(getFilePath(id), (err) => {
      if (err) console.error(err);
    });
    const job = activeJobs[id];
    job.cancel();
    delete activeJobs[id];
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
      cancelJob(id);
    },
    clearByTopic(topic) {
      Object.keys(activeJobs).forEach(id => {
        const job = activeJobs[id];
        if (!job || job.topic !== topic) return;

        cancelJob(id);
      });
    }
  }
};

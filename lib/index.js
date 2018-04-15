const config = require('./config');

const jobsPath = config.get('jobs.path');
const jobs = require('./jobs').init(jobsPath, handleJob);

const mqttUri = 'mqtt://' + config.get('mqtt.host');
const setTopic = config.get('mqtt.set_topic');
const clearTopic = config.get('mqtt.clear_topic');
const topics = [
  { topic: setTopic, handler: handleSetJob },
  { topic: clearTopic, handler: handleClearJob },
];
const mqtt = require('./mqtt').init({ uri: mqttUri, topics });

function handleSetJob(message) {
  jobs.create(message);
}

function handleClearJob(message) {
  const { id, topic } = message;

  if (id) {
    jobs.clearById(id);
  }
  if (topic) {
    jobs.clearByTopic(topic);
  }
}

function handleJob(details) {
  console.log('Execute job', details);
  mqtt.publish(details.topic, details.message);
}

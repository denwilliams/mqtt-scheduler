const mqtt = require('mqtt');
const config = require('./config');

let topics = [];

exports.init = ({uri, topics}) => {
  let mqttClient;
  let mqttConnected = false;

  mqttClient  = mqtt.connect(uri);

  mqttClient.on('message', (topic, message) => {
    const strMsg = message.toString();
    const data = strMsg ? JSON.parse(strMsg) : undefined;

    topics.forEach(t => {
      if (t.topic !== topic) return;
      t.handler(data);
    });
  });

  mqttClient.on('connect', () => {
    console.info('MQTT connected');
    mqttConnected = true;

    topics.forEach(t => {
      mqttClient.subscribe(t.topic);
    })
  });

  mqttClient.on('close', console.log);
  mqttClient.on('offline', console.log);
  mqttClient.on('error', console.error);

  return {
    publish(topic, data) {
      console.log('Emitting', topic, data);
      mqttClient.publish(topic, JSON.stringify(data));
    }
  };
};

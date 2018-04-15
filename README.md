# mqtt-scheduler
Publishes MQTT messages at the desired interval, managed via MQTT topics

## Scheduling A Message

Send a message to `scheduler/set` with the following contents:

```
{
  topic: 'my/topic',
  message: {
    x: 1,
    y: 'z'
  }
}
```

## Clearing A Message

Send a message to `scheduler/clear` with the following contents:

```
{
  topic: 'my/topic'
}
```

*Note: this will also clear any other scheduled jobs using this topic. You can also clear a message by ID.*

First, pass in an ID when setting:

```
{
  id: '1234',
  topic: 'my/topic',
  message: {
    x: 1,
    y: 'z'
  }
}
```

Then when clearing pass in the ID instead of the topic:

```
{
  id: '1234'
}
```

*Note2: when passing in an ID it will override any existing job with the same ID.*

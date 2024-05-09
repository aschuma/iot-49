let CONFIG = {
  switchId: 0,
  interval: 120000,
  MQTTPublishTopicStatus: '/tele/status/output',
  MQTTPublishTopicChange: '/event/status/output',
};

let SHELLY_ID = undefined;

Shelly.call('Mqtt.GetConfig', '', function (res, err_code, err_msg, ud) {
  SHELLY_ID = res['topic_prefix'];
});

function mqttPublish(topic, inputValue) {
  if (typeof SHELLY_ID === 'undefined' || inputValue === null) {
    return;
  }
  MQTT.publish(
    SHELLY_ID + topic,
    JSON.stringify(inputValue ? 'on' : 'off'),
    0,
    false
  );
}

const notifyTimer = Timer.set(CONFIG.interval, true, function () {
  Shelly.call(
    'Switch.GetStatus',
    {
      id: CONFIG.switchId,
    },
    function (res, err_code, err_msg, ud) {
      if (typeof res !== 'undefined' || res !== null) {
        mqttPublish(CONFIG.MQTTPublishTopicStatus, res.output);
      }
    }
  );
});

Shelly.addStatusHandler(function (e) {
  if (e.component !== 'switch:' + JSON.stringify(CONFIG.switchId)) {
    return;
  }
  if (typeof e.delta.output === 'undefined') {
    return;
  }
  mqttPublish(CONFIG.MQTTPublishTopicChange, e.delta.output);
});

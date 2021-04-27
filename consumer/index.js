#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://192.168.99.100:5672', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    var queue = 'pedidos';

    channel.assertQueue(queue, {
      durable: false
    });

    channel.prefetch(1);

    channel.consume(queue, function (msg) {
      let msgContent = msg.content.toString();
      console.log(" [x] Received %s", msgContent);

      Math.random() > .5
        ? accepted(channel, msgContent)
        : rejected(channel, msgContent);

      setTimeout(() => {
        console.log(" [x] Done");
        channel.ack(msg);
      }, 2000);

    }, {
      noAck: false
    });
  });
});

function accepted(channel, msg) {
  const queue = 'accepted';
  channel.assertQueue(queue, {
    durable: false
  });
  channel.sendToQueue(queue, Buffer.from(msg));
  console.log(` [x] [Accepted] ${msg}`);
}

function rejected(channel, msg) {
  const queue = 'rejected';
  channel.assertQueue(queue, {
    durable: false
  });

  channel.sendToQueue(queue, Buffer.from(msg));
  console.log(` [x] [Rejected] ${msg}`);
}
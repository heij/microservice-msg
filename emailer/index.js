#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
let nodemailer = require('nodemailer');

amqp.connect('amqp://192.168.99.100:5672', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.prefetch(1);
    setAcceptHandler(channel);
    setRejectHandler(channel);
  });
});

function sendMail(status) {
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Failed to create a testing account. ' + err.message);
      return process.exit(1);
    }

    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    // Message object
    let message = {
      from: 'Sender Name <sender@example.com>',
      to: 'Recipient <recipient@example.com>',
      subject: 'Request Status Response',
      text: `Congrats! Your request was ${status}!`,
      html: `<p>Congrats! Your request was ${status}!</p>`
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log('Error occurred. ' + err.message);
        return process.exit(1);
      }

      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
  });

}

function setAcceptHandler(channel) {
  let queue = 'accepted';
  channel.consume(queue, function (msg) {
    sendMail(queue, msg);
    ackMsg(channel, msg);
  }, { noAck: false });
}

function setRejectHandler(channel) {
  let queue = 'rejected';
  channel.consume(queue, function (msg) {
    sendMail(queue, msg);
    ackMsg(channel, msg);
  }, { noAck: false });
}

function ackMsg(channel, msg) {
  channel.ack(msg);
  console.log(` [x] Ack ${msg.content.toString()}`);
}
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const decode = require('./decode');
const request = require('request');

const options = {
  banner: 'Welcome to DiscordMailHooks! https://discordmail.com/ https://moustacheminer.com/ https://discord.gg/wHgdmf4',
  discord: 'https://canary.discordapp.com/api/webhooks/',
  domain: [
    'mss.ovh',
    'discordmail.com',
  ],
  key: '/etc/letsencrypt/live/mss.ovh/privkey.pem',
  cert: '/etc/letsencrypt/live/mss.ovh/fullchain.pem',
};

const execute = (mail, url) => new Promise((resolve, reject) => {
  let from = '';

  if (!mail.from.text) {
    from = 'Unknown Author';
  } else if (mail.from.text.length > 256) {
    from = `${mail.from.text.substring(0, 250)}...`;
  } else {
    from = mail.from.text;
  }

  const formData = {
    payload_json: JSON.stringify({
      embeds: [{
        title: mail.subject || 'Untitled E-Mail',
        description: mail.text || 'Empty E-Mail',
        timestamp: mail.date || new Date(),
        author: {
          name: from,
        },
        footer: {
          text: 'webhooks.discordmail.com',
        },
      }],
    }),
  };

  if (mail.attachments[0]) {
    formData.file = {
      value: mail.attachments[0].content,
      options: {
        filename: mail.attachments[0].filename,
        contentType: mail.attachments[0].contentType,
      },
    };
  }

  request.post({
    url,
    formData,
  }, (err, response, body) => {
    if (err) return reject(new Error('Some error happened on the DiscordMail server'));
    if (response.statusCode === 200) return resolve();
    if (response.statusCode === 204) return resolve();
    if (body.message) return reject(new Error(`Discord Error ${response.statusCode}: ${body.message}`));
    return reject(new Error(`Discord Error ${response.statusCode}`));
  });
});

const server = new SMTPServer({
  key: fs.readFileSync(options.key),
  cert: fs.readFileSync(options.cert),
  authOptional: true,
  banner: options.banner,
  async onData(stream, session, callback) {
    const mail = await simpleParser(stream);
    let error;

    // Check if there are too many attatchments, or if the attatchment is too large
    if (mail.attachments && mail.attachments.length === 1 && mail.attachments[0].size > 8000000) {
      error = new Error('Your files are too powerful! Max file size 8.00Mb please.');
      error.responseCode = 552;
      return callback(error);
    }

    if (mail.attachments && mail.attachments.length > 1) {
      error = new Error('Your files are too powerful! Only one attachment please.');
      error.responseCode = 552;
      return callback(error);
    }

    if (mail.text && mail.text.length > 2048) {
      error = new Error('Your message is too long. Please make your message shorter. We\'ve set the limit at 2,048 characters to be courteous to others.');
      error.responseCode = 552;
      return callback(error);
    }

    if (mail.subject && mail.subject.length > 256) {
      error = new Error('Your subject is too long. Please make your subject shorter. We\'ve set the limit at 256 characters to be courteous to others.');
      error.responseCode = 552;
      return callback(error);
    }

    const webhooks = mail.to.value
      .map(email => ({
        email,
        domain: options.domain.find(value => email.endsWith(`@${value}`)),
      })) // Find domains which the server will respond to, and add them to the "packet" of sorts
      .filter(data => data.domain) // Remove packets the server don't respond to
      .map(email => email.email.address.slice(0, -(email.domain.length + 1))) // Strip domain off
      .filter(hash => !!hash) // Get rid of "broken" and "false" ones
      .map(hash => options.discord + hash); // Append the Discord API uri

    if (webhooks.length > 0) {
      const url = webhooks[0];
      try {
        await execute(mail, url);
        return callback();
      } catch (e) {
        e.responseCode = 552;
        console.log('=======================');
        console.log('Error report');
        console.log('Error: ', e.message);
        return callback(e);
      }
    } else {
      error = new Error('The webhook encoded E-Mail address was invalid. If you believe this is an error, please visit https://discordmail.com/');
      error.responseCode = 552;
      return callback(error);
    }
  },
});
server.listen(25);

server.on('error', (err) => {
  console.log(err.message);
});

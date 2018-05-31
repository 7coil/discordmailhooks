const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const decode = require('./decode');
const request = require('request');
const Zip = require('jszip');

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
  let text = '';
  let truncated = false;

  // Add attatchments to archive
  const files = mail.attachments.map(file => ({
    content: file.content,
    filename: file.filename,
    folder: '/attatchments',
  }));

  // Trim down the author
  if (!mail.from.text) {
    from = 'Unknown Author';
  } else if (mail.from.text.length > 256) {
    from = `${mail.from.text.substring(0, 250)}...`;
    truncated = true;
  } else {
    from = mail.from.text;
  }

  // Trim down the contents
  if (!mail.text) {
    text = 'Empty email';
  } else if (mail.text.length > 2048) {
    from = `${mail.from.text.substring(0, 1000)}...`;
    truncated = true;
  } else {
    ({ text } = mail);
  }

  // Add the email to a zip
  files.push({
    content: Buffer.from(mail.text, 'utf8'),
    filename: 'plaintext',
    folder: '/contents',
  });
  files.push({
    content: Buffer.from(mail.html, 'utf8'),
    filename: 'richtext',
    folder: '/contents',
  });

  // Zip all files and attatchments
  const zip = new Zip();
  files.forEach((file) => {
    zip.folder(file.folder).file(file.filename, file.content);
  });

  const data = zip.generateNodeStream();

  // Create the text payload
  const formData = {
    payload_json: JSON.stringify({
      embeds: [{
        title: mail.subject || 'Untitled email',
        description: text,
        timestamp: mail.date || new Date(),
        author: {
          name: from,
        },
        footer: {
          text: 'https://discordmail.com/',
        },
      }],
    }),
    file: {
      value: data,
      options: {
        filename: 'contents.zip',
        contentType: 'application/zip',
      },
    },
  };

  request.post({
    url,
    formData,
  }, (err, response, body) => {
    if (err) return reject(err);
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

    // Check if the attatchment or zip will be too big
    if (mail.attachments && mail.attachments.reduce((acc, cur) => acc + cur, 0) > 8000000) {
      error = new Error('Your files are too powerful! Max file size 8.00Mb please.');
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
        domain: options.domain.find(value => email.address.endsWith(`@${value}`)),
      })) // Find domains which the server will respond to, and add them to the "packet" of sorts
      .filter(data => data.domain) // Remove packets the server don't respond to
      .map(email => email.email.address.slice(0, -(email.domain.length + 1))) // Strip domain off
      .map(email => decode(email))
      .filter(data => !!data) // Get rid of "broken" and "false" ones
      .map(data => Object.assign(data, {
        webhook: options.discord + data.decoded,
      })); // Append the Discord API uri

    if (webhooks.length > 0) {
      const data = webhooks[0];
      try {
        await execute(mail, data.webhook);
        return callback();
      } catch (e) {
        error = new Error(`Something failed. ${data.hidden ? 'Please contact the owner of the webhook directly.' : `Is the webhook ${data.webhook} valid?`} For support, visit https://discordmail.com/. Full error: ${e.message}`);
        error.responseCode = 552;
        console.log('=======================');
        console.log('Error report');
        console.log('Error: ', e.message);
        return callback(error);
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

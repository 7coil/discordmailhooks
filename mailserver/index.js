const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const decode = require('./../helpers/decode');
const request = require('request');
const Zip = require('jszip');
const util = require('util');
const h2p = require('html2plaintext');
const options = require('./../config/mailserver.json');

const execute = (mail, info) => new Promise((resolve, reject) => {
  let from = '';
  let text = '';
  const fields = [];
  let truncated = false;
  let usingHTML = false;

  // Add attatchments to archive
  const files = mail.attachments.map(file => ({
    content: file.content,
    filename: file.filename,
    folder: 'attatchments',
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
  if (!mail.text || mail.text.trim().length === 0) {
    text = 'Empty email';
  } else if (mail.text.length > 2048) {
    text = `${mail.from.text.substring(0, 1000)}...`;
    truncated = true;
  } else {
    ({ text } = mail);
  }

  // Venn Diagram - See /docs/plaintext.xcf (gimp)
  if (mail.text) {
    if (mail.text.trim().length === 0) {
      text = 'Empty E-Mail';
    } else if (mail.text.length > 2048) {
      text = `${mail.from.text.substring(0, 1000)}...`;
      truncated = true;
    } else {
      ({ text } = mail);
    }
  } else if (mail.html) {
    const plainText = h2p(mail.html);
    if (plainText.trim().length === 0) {
      text = 'Empty E-Mail';
    } else if (plainText.length > 2048) {
      text = `${plainText.text.substring(0, 1000)}...`;
      truncated = true;
      usingHTML = true;
    } else {
      text = plainText;
      usingHTML = true;
    }
  } else {
    text = 'Empty E-Mail';
  }

  // Add the email to a zip
  if (mail.text && mail.text.trim().length > 0) {
    files.push({
      content: Buffer.from(mail.text, 'utf8'),
      filename: 'plaintext.txt',
      folder: 'contents',
    });
  }
  if (mail.html && mail.html.trim().length > 0) {
    files.push({
      content: Buffer.from(mail.html, 'utf8'),
      filename: 'richtext.html',
      folder: 'contents',
    });
  }

  // If truncated, add a little note
  if (truncated) {
    fields.push({
      name: 'Note',
      value: 'One or more fields have been truncated. Truncated contents can be viewed in the `.zip` file, under the `contents` folder.',
    });
  }

  // If using HTML to Plain Text, add a note
  if (usingHTML) {
    fields.push({
      name: 'Note',
      value: 'The above text is a rough conversion from the original copy. To view the original, open the `.zip` file, go into the `contents` folder, and open `richtext.html`.',
    });
  }

  // If the email had attatchments, add a little note
  if (mail.attachments.length > 0) {
    fields.push({
      name: 'Attatchments',
      value: 'You have attatchments. These can be viewed in the `.zip` file, under the `attatchments` folder.',
    });
  }

  // Zip all files and attatchments
  const zip = new Zip();
  files.forEach((file) => {
    zip.folder(file.folder).file(file.filename, file.content);
  });

  zip.generateAsync({
    type: 'nodebuffer',
    streamFiles: true,
    compression: 'STORE',
  }).then((data) => {
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
          fields,
          footer: {
            text: 'https://discordmail.com/',
          },
        }],
      }),
      file: {
        value: data,
        options: {
          filename: 'items.zip',
          contentType: 'application/zip',
        },
      },
    };

    request.post({
      url: info.webhook,
      formData,
    }, (err, response, body) => {
      if (mail.subject.startsWith('debug-discordmail-') || info.middle === 'd') {
        console.log(util.inspect(info, {
          showHidden: true,
          depth: null,
          colors: true,
          breakLength: Infinity,
          compact: false,
        }));
        console.log(util.inspect(mail, {
          showHidden: true,
          depth: null,
          colors: true,
          breakLength: Infinity,
          compact: false,
        }));
        console.log(util.inspect(formData, {
          showHidden: true,
          depth: null,
          colors: true,
          breakLength: Infinity,
          compact: false,
        }));
      }
      if (err) return reject(err);
      if (response.statusCode === 200) return resolve();
      if (response.statusCode === 204) return resolve();
      if (body.message) return reject(new Error(`Discord Error ${response.statusCode}: ${body.message}`));
      return reject(new Error(`Discord Error ${response.statusCode}: ${body}`));
    });
  });
});

const server = new SMTPServer({
  key: options.key ? fs.readFileSync(options.key) : null,
  cert: options.cert ? fs.readFileSync(options.cert) : null,
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

    // Create a list of emails to check for the webhook
    const checkMails = mail.to.value.map(email => email.address);

    // Add forwarded E-Mails to the list of emails to check
    if (mail.headers.get('x-forwarded-to')) {
      checkMails.push(mail.headers.get('x-forwarded-to'));
    }

    const webhooks = checkMails
      .map(email => ({
        email,
        domain: options.domain.find(value => email.endsWith(`@${value}`)),
      })) // Find domains which the server will respond to, and add them to the "packet" of sorts
      .filter(data => data.domain) // Find emails which don't have an domain, and remove it
      .map(email => email.email.slice(0, -(email.domain.length + 1))) // Strip domain off
      .map(email => decode(email))
      .filter(data => !!data) // Get rid of "broken" and "false" ones
      .map(data => Object.assign(data, {
        webhook: options.discord + data.decoded,
      })); // Append the Discord API uri

    if (webhooks.length > 0) {
      const data = webhooks[0];
      try {
        await execute(mail, data);
        return callback();
      } catch (e) {
        error = new Error(`Something failed. ${data.hidden ? 'Please contact the owner of the webhook directly.' : `Is the webhook ${data.webhook} valid?`} For support, visit https://discordmail.com/. Full error: ${e.message}`);
        error.responseCode = 552;
        console.log('=======================');
        console.log('Error report');
        console.log(e);
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

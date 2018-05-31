const decode = require('./../../helpers/decode');
const encode = require('./../../helpers/encode');
const modes = require('./../../config/modes.json');

module.exports = [{
  aliases: [
    'encode',
  ],
  name: 'encode',
  uses: 1,
  admin: 0,
  command: (message) => {
    const encoded = encode(message.mss.input);

    if (encoded) {
      message.channel.createMessage(`Your E-mail: \`\`\`${encoded}\`\`\``);
    } else {
      message.channel.createMessage('Your webhook was invalid.');
    }
  },
}, {
  aliases: [
    'decode',
  ],
  name: 'decode',
  uses: 1,
  admin: 0,
  command: (message) => {
    const decoded = decode(message.mss.input);

    if (decoded) {
      message.channel.createMessage(`**URL:** ${decoded.hidden ? 'Protected' : decoded.webhook}\n**Mode:** ${modes[decoded.middle]}`);
    } else {
      message.channel.createMessage('Your webhook was invalid.');
    }
  },
}];

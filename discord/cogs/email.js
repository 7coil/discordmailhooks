const decode = require('./../../helpers/decode');
const encode = require('./../../helpers/encode');
const modes = require('./../../config/modes.json');
const config = require('./../../config/discord.json');

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
      message.channel.createMessage(message.t('register_email', {
        email: `${encoded}@${config.domain}`,
      }));
    } else {
      message.channel.createMessage(message.t('encode_invalid'));
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
      message.channel.createMessage(`**URL:** ${decoded.hidden ? 'Protected' : decoded.decoded}\n**${message.t('decode_mode')}** ${message.t(modes[decoded.middle]) || message.t('mode_unknown')}`);
    } else {
      message.channel.createMessage(message.t('decode_invalid'));
    }
  },
}, {
  aliases: [
    'register',
  ],
  name: 'register',
  uses: 1,
  admin: 1,
  command: (message, client) => {
    if (message.channel.guild) {
      const { guild } = message.channel;
      const self = guild.members.get(client.user.id);

      if (!self) {
        message.channel.createMessage(message.t('register_err_self'));
      } else if (self.permission.has('administrator') || self.permission.has('manageWebhooks')) {
        message.channel.createWebhook({
          name: config.name,
          avatar: 'https://webhooks.discordmail.com/img/DiscordMail.png',
        }, `${message.author.username} (${message.author.id})`)
          .then((webhook) => {
            const encoded = encode(`${webhook.id}/${webhook.token}`);
            message.channel.createMessage(message.t('register_email', {
              email: `${encoded}@${config.domain}`,
            }));
          });
      } else {
        message.channel.createMessage(`${message.t('register_err_perms')}\n${config.url.website}`);
      }
    } else {
      message.channel.createMessage(message.t('register_err_guild'));
    }
  },
}];

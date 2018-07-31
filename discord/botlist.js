const request = require('request');
const config = require('./../config/discord.json');

module.exports = (client) => {
  if (config.api.botsdiscordpw) {
    const botsdiscordpw = {
      url: `https://bots.discord.pw/api/bots/${client.user.id}/stats`,
      method: 'POST',
      json: true,
      headers: {
        'User-Agent': config.useragent,
        authorization: config.api.botsdiscordpw,
      },
      body: {
        server_count: client.guilds.size,
      },
    };
    request.post(botsdiscordpw);
  }
  if (config.api.discordbotsorg) {
    const discordbotsorg = {
      url: `https://discordbots.org/api/bots/${client.user.id}/stats`,
      method: 'POST',
      json: true,
      headers: {
        'User-Agent': config.useragent,
        authorization: config.api.discordbotsorg,
      },
      body: {
        server_count: client.guilds.size,
      },
    };
    request.post(discordbotsorg);
  }
  if (config.api.discordfork && config.api.discordfork.guild && config.api.discordfork.channel && config.api.discordfork.for) {
    const guild = client.guilds.get(config.api.discordfork.guild);
    if (guild) {
      const channel = guild.channels.get(config.api.discordfork.channel);
      if (channel) {
        channel.createMessage(JSON.stringify({
          for: config.api.discordfork.for,
          botCount: client.guilds.size
        }, null, 2)).then(() => {
          console.log('Posted to Discord Fork');
        }).catch(() => {
          console.log('Failed to post to Discord Fork');
        });
      }
    }
  }
};

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
};

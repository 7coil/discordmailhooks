const request = require('request');
const config = require('./../config/discord.json');

module.exports = (client) => {
  if (config.api.botsdiscordpw) {
    fetch(`https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`, {
      method: 'post',
      body: JSON.stringify({
        guildCount: client.guilds.size
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
  if (config.api.ls) {
    fetch(`https://ls.terminal.ink/api/bots/${client.user.id}`, {
      method: 'post',
      body: JSON.stringify({
        bot: {
          count: client.guilds.size
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
};

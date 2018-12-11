const fetch = require('node-fetch');
const config = require('./../config/discord.json');

module.exports = (client) => {
  console.log('Posting count...');
  if (config.api.botsdiscordpw) {
    console.log('botsdiscordpw');
    fetch(`https://discord.bots.gg/api/v1/bots/${client.user.id}/stats`, {
      method: 'post',
      body: JSON.stringify({
        guildCount: client.guilds.size
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => console.log(data))
      .catch((err) => {
        console.log(err);
      });
  }
  if (config.api.ls) {
    console.log('ls');
    fetch(`https://ls.terminal.ink/api/v2/bots/${client.user.id}`, {
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
      .then(res => res.json())
      .then(data => console.log(data))
      .catch((err) => {
        console.log(err);
      });
  }
};

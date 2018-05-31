// Get the required shit together
const Discord = require('eris');
const config = require('./../config/discord.json');
const { commands } = require('./cogs');
const handler = require('./handler');
const botlist = require('./botlist');
const i18n = require('i18n');
const path = require('path');

const client = new Discord.Client(config.api.discord.token, {
  maxShards: config.discord.shards,
});

i18n.configure({
  directory: path.join(__dirname, '..', 'locales'),
  cookie: 'lang',
  defaultLocale: 'en-gb',
  autoReload: true,
  updateFiles: false,
});

const prefixes = config.discord.prefix;

client.once('ready', () => {
  console.log('All shards are online');

  // Set up currently playing game
  client.editStatus('online', {
    name: `${prefixes[0]}help`,
    type: 0,
  });

  setInterval(() => {
    botlist(client);
  }, 1800000);
  botlist(client);

  client.on('messageCreate', (message) => {
    // Return if eris is a terrible terrible man
    if (!message.author) return;

    handler(message);
    // Run command if it exists, and if their permissions level is good enough
    if (message.mss &&
        message.mss.command &&
        commands[message.mss.command].guild && !message.member) {
      message.channel.createMessage(message.__('err_guild'));
    } else if (message.mss &&
              message.mss.command &&
              message.mss.admin >= commands[message.mss.command].admin) {
      commands[message.mss.command].command(message, client);
    }
  });
});

client.connect();
module.exports = client;

const config = require('./../config/discord.json');
const { commands } = require('./cogs');
const client = require('./');
const i18n = require('i18n');

const prefixes = config.discord.prefix;

/*
 * Modified Eris Code - https://github.com/abalabahaha/eris
 * Allows me to clean any message content
 */
const clean = (message, content) => {
  let cleanContent = content;

  if (message.mentions) {
    message.mentions.forEach((mention) => {
      if (message.channel.guild) {
        const member = message.channel.guild.members.get(mention.id);
        if (member) {
          cleanContent = cleanContent.replace(new RegExp(`<@!${mention.id}>`, 'g'), `@${member.nick}` || mention.username);
        }
      }
      cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, 'g'), `@${mention.username}`);
    });
  }

  if (message.channel.guild && message.roleMentions) {
    message.roleMentions.forEach((roleID) => {
      const role = message.channel.guild.roles.get(roleID);
      const roleName = role ? role.name : 'deleted-role';
      cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, 'g'), `@${roleName}`);
    });
  }

  message.channelMentions.forEach((id) => {
    const channel = client.getChannel(id);
    if (channel && channel.name && channel.mention) {
      cleanContent = cleanContent.replace(channel.mention, `#${channel.name}`);
    }
  });

  return cleanContent.replace(/@everyone/g, '@\u200beveryone').replace(/@here/g, '@\u200bhere');
};

module.exports = async (message) => {
  const mss = {};

  // Set default values
  mss.content = message.content.trim() || '';
  mss.prefix = prefixes.find(prefix => mss.content.toLowerCase().startsWith(prefix)) || '';
  mss.command = '';
  mss.input = '';
  mss.admin = 0;

  i18n.init(message);

  // If there's a prefix, get rid of the prefix and check for any command
  if (mss.prefix && !message.author.bot) {
    const noprefix = mss.content.substring(mss.prefix.length).trim();
    mss.command = Object.keys(commands).find(command => noprefix.startsWith(command)) || '';
    if (mss.command) {
      mss.input = noprefix.substring(mss.command.length).trim();
      mss.cleanInput = clean(message, mss.input);
    }
  }

  if (config.discord.admins.includes(message.author.id)) {
    mss.admin = 3;
  } else if (message.member && message.member.permission.has('administrator')) {
    mss.admin = 2;
  } else if (message.member && (message.member.permission.has('kickMembers') || message.member.permission.has('banMembers'))) {
    mss.admin = 1;
  }

  // Pass by reference
  message.mss = mss; // eslint-disable-line no-param-reassign
};

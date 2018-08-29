const cogs = require('./../cogs');
const { exec } = require('child_process');
const os = require('os');

const hardwareinfo = `(${os.arch()}) ${os.cpus()[0].model} @ ${os.cpus()[0].speed} MHz`;
const softwareinfo = `[${os.type()}] ${os.release()}`;

module.exports = [{
  aliases: [
    'ping',
  ],
  name: 'ping',
  uses: 1,
  admin: 0,
  command: (message, client) => {
    if (client.guildShardMap) {
      let s = 0;

      if (message.channel.guild) {
        s = client.guildShardMap[message.channel.guild.id];
      }

      message.channel.createMessage(`\`\`\`\n${client.shards.map(shard => `${s === shard.id ? '>' : ' '}Shard ${shard.id} | ${shard.latency}ms`).join('\n')}\n\`\`\``);
    } else {
      message.channel.createMessage(message.t('ping_nomap'));
    }
  },
}, {
  aliases: [
    'eval',
  ],
  name: 'eval',
  uses: 1,
  admin: 3,
  command: (message) => {
    eval(message.mss.input); // eslint-disable-line no-eval
  },
}, {
  aliases: [
    'exec',
  ],
  name: 'exec',
  uses: 1,
  admin: 3,
  command: (message) => {
    if (message.mss.input) {
      exec(message.mss.input, (error, stdout, stderr) => {
        let output = '';

        if (stdout) {
          output += '=== stdout ===\n';
          output += `${stdout.replace(/`/g, '\'')}\n`;
        }

        if (stderr) {
          output += '=== stderr ===\n';
          output += `${stderr.replace(/`/g, '\'')}\n`;
        }

        message.channel.createMessage(`\n${message.t('exec_output')}\n\`\`\`\n${output}\`\`\``);
      });
    }
  },
}, {
  aliases: [
    'help',
  ],
  name: 'help',
  uses: 3,
  admin: 0,
  command: (message) => {
    if (message.mss.input && cogs.commands[message.mss.input]) {
      const command = cogs.commands[message.mss.input];
      const fields = [];
      for (let i = 1; i <= command.uses; i += 1) {
        fields.push({
          name: message.t(`${command.name}_${i}_in`, { prefix: message.mss.prefix, command: command.name }),
          value: message.t(`${command.name}_${i}_out`),
        });
      }

      message.channel.createMessage({
        embed: {
          title: message.t(command.name),
          description: message.t(`${command.name}_desc`),
          fields,
        },
      });
    } else if (message.mss.input && cogs.categories[message.mss.input]) {
      message.channel.createMessage({
        embed: {
          title: message.t(message.mss.input),
          fields: cogs.categories[message.mss.input]
            .filter(command => message.mss.admin >= command.admin)
            .map(command => ({
              name: command.aliases[0],
              value: message.t(`${command.name}_desc`),
            })),
        },
      });
    } else if (!message.mss.input) {
      // If there is no input, make a "field" for each category to embed, with a list of commands
      const fields = Object.keys(cogs.categories).map(category => ({
        name: `\`${category}\` - ${message.t(category)}`,
        value: cogs.categories[category]
          .filter(command => message.mss.admin >= command.admin)
          .map(command => command.aliases[0])
          .map(name => `\`${name}\``)
          .join(', '),
      }));

      message.channel.createMessage({
        embed: {
          title: message.t('help_menu_title'),
          description: message.t('help_menu_description'),
          fields,
          footer: {
            text: message.t('help_menu_footer', {
              prefix: message.mss.prefix,
              command: message.mss.command
            }),
          },
        },
      });
    } else {
      message.channel.createMessage(message.t('help_invalid'));
    }
  },
}, {
  aliases: [
    'info',
  ],
  name: 'info',
  uses: 1,
  admin: 0,
  command: (message, client) => {
    const embed = {
      embed: {
        fields: [
          {
            name: message.t('info_nodejs'),
            value: process.version,
            inline: true,
          },
          {
            name: message.t('info_guilds'),
            value: client.guilds.size,
            inline: true,
          },
          {
            name: message.t('info_pid'),
            value: process.pid,
            inline: true,
          },
          {
            name: message.t('info_hard'),
            value: hardwareinfo,
          },
          {
            name: message.t('info_soft'),
            value: softwareinfo,
          },
          {
            name: message.t('info_licence'),
            value: message.t('info_licencedesc', { name: message.t('name') }),
          },
        ],
      },
    };

    message.channel.createMessage(embed);
  },
}];

const request = require('request');

const MEI = 'https://www.reddit.com/r/wholesomeyuri/.json';
const EMOJI = '<:blobcatreeeeeee:436990758973734922>';
const select = data => data[Math.floor(Math.random() * data.length)];

module.exports = [{
  aliases: [
    'mei',
  ],
  name: 'mei',
  uses: 1,
  admin: 0,
  command: (message) => {
    request({
      uri: MEI,
      json: true,
    }, (err, res, body) => {
      if (body.kind === 'Listing') {
        // Get posts that are kind "t3" and not nsfw
        const posts = body.data.children
          .filter(post => post.kind === 't3')
          .filter(post => post.data.over_18 === false);

        // Post a random cute mei picture
        message.channel.createMessage(select(posts).data.url);
      } else {
        message.channel.createMessage(EMOJI + message.t('mei_no_list'));
      }
    });
  },
}];

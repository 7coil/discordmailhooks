const request = require('request');

const MEI = 'https://www.reddit.com/r/wholesomeyuri/.json';
const EMOJI = '<:blobcatreeeeeee:436990758973734922>';
const select = data => data[Math.floor(Math.random() * data.length)];

let meiTimestamp = 0;
let meiData = null;

const meiUpdate = () => new Promise((resolve, reject) => {
  request({
    uri: MEI,
    json: true,
  }, (err, res, body) => {
    console.log('Updating Mei Reddit Data');
    if (body.kind === 'Listing') {
      // Get posts that are kind "t3" and not nsfw
      const posts = body.data.children
        .filter(post => post.kind === 't3')
        .filter(post => post.data.over_18 === false);

      // Limit bot to request every 30 minutes
      meiTimestamp = Date.now() + (1000 * 60 * 30);
      resolve(posts);
    } else {
      reject();
    }
  });
});

module.exports = [{
  aliases: [
    'mei',
  ],
  name: 'mei',
  uses: 1,
  admin: 0,
  command: async (message) => {
    // If the data has expired, request more data
    if (meiTimestamp < Date.now()) {
      // Try and request new data
      try {
        // Update the data and create a message
        meiData = await meiUpdate(message);
        message.channel.createMessage(select(meiData).data.url);
      } catch (e) {
        // Fiddlesticks
        message.channel.createMessage(EMOJI + message.t('mei_no_list'));
      }
    } else {
      // Create a message
      message.channel.createMessage(select(meiData).data.url);
    }
  },
}];

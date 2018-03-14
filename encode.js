// This is a simple implementation of the webhook encoder.

const { Uint64LE } = require('int64-buffer');

const urlregex = /(\d{10,30})\/?(.+)/g;

const encode = (text) => {
  const parts = urlregex.exec(text);
  if (!parts) return false;

  const id = new Uint64LE(parts[1], 10).toBuffer();
  const auth = Buffer.from(parts[2], 'base64');
  let encoded = '';

  for (let i = 0; i < id.length; i += 1) {
    encoded += String.fromCharCode(id[i] + 0x2800);
  }

  encoded += '+';

  for (let i = 0; i < auth.length; i += 1) {
    encoded += String.fromCharCode(auth[i] + 0x2800);
  }

  return encoded;
};

if (process.argv[2]) console.log(encode(process.argv[2]));

module.exports = encode;

const { Uint64LE } = require('int64-buffer');
const fs = require('fs');

const emailregex = /([\u2800-\u28FF]+)\+([\u2800-\u28FF]+)/;

const decode = (text) => {
  const emails = JSON.parse(fs.readFileSync('./emails.json'));
  if (emails[text]) {
    return {
      decoded: emails[text],
      hidden: true,
    };
  }

  const parts = emailregex.exec(text);
  if (!parts) return null;

  const id = [];
  const auth = [];
  let decoded = '';

  for (let i = 0; i < parts[1].length; i += 1) {
    id.push(parts[1].charCodeAt(i) - 0x2800);
  }

  for (let i = 0; i < parts[2].length; i += 1) {
    auth.push(parts[2].charCodeAt(i) - 0x2800);
  }

  decoded += new Uint64LE(id).toString(10);
  decoded += '/';
  decoded += Buffer.from(auth).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  return {
    decoded,
    hidden: false,
  };
};

if (process.argv[2]) console.log(decode(process.argv[2]));

module.exports = decode;

const { Uint64LE } = require('int64-buffer');
const fs = require('fs');
const path = require('path');

const emailregex = /([\u2800-\u28FF]+)(.)([\u2800-\u28FF]+)/;

const decode = (text) => {
  const emails = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'emails.json')));
  if (emails[text]) {
    return {
      decoded: emails[text],
      hidden: true,
      middle: '+',
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

  for (let i = 0; i < parts[3].length; i += 1) {
    auth.push(parts[3].charCodeAt(i) - 0x2800);
  }

  decoded += new Uint64LE(id).toString(10);
  decoded += '/';
  decoded += Buffer.from(auth).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  return {
    decoded,
    hidden: false,
    middle: parts[2],
  };
};

if (process.argv[2]) console.log(decode(process.argv[2]));

module.exports = decode;

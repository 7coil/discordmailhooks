const Zip = require('jszip');
const fs = require('fs');
const request = require('request');

const zip = new Zip();
zip.file('test.txt', Buffer.from('aaaa', 'UTF-8'));

zip.generateAsync({
  type: 'nodebuffer',
  streamFiles: false,
  compression: 'STORE',
}).then((buf) => {
  const formData = {
    payload_json: '{}',
    file: {
      value: buf,
      options: {
        filename: 'test.zip',
        contentType: 'application/zip',
      },
    },
  };

  // console.log(data);
  // console.log(fs.createReadStream('test.zip'));

  request.post({
    url: 'http://ptsv2.com/t/mtlq0-1527788127/post',
    formData,
  }, (err, response, body) => {
    console.log(err, response, body);
  });
});

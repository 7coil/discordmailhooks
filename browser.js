/* global document, atob, Uint64LE */

const input = document.getElementById('input');
const output = document.getElementById('output');
const urlregex = /(\d{10,30})\/?(.+)/g;

const options = {
  domain: 'mss.ovh',
};

const encode = (text) => {
  const parts = urlregex.exec(text);
  if (!parts) return false;

  const id = new Uint64LE(parts[1], 10).toArray();
  const auth = atob(parts[2].replace(/-/g, '+').replace(/_/g, '/'));
  let encoded = '';

  for (let i = 0; i < id.length; i += 1) {
    encoded += String.fromCharCode(id[i] + 0x2800);
  }

  encoded += '+';

  for (let i = 0; i < auth.length; i += 1) {
    encoded += String.fromCharCode(auth.charCodeAt(i) + 0x2800);
  }

  return encoded;
};

input.addEventListener('input', () => {
  output.innerHTML = encode(input.value);
  output.innerHTML += '@';
  output.innerHTML += options.domain;
});

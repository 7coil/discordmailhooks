/* global document, atob, Uint64LE */
/* eslint-env browser */

const input = document.getElementById('mail_input');
const output = document.getElementById('mail_output');
const urlregex = /(\d{10,30})\/+(.+)/g;
let email = '';

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
  email = encode(input.value);
  if (email) {
    output.value = `${email}@${input.dataset.url}`;
  }
});

window.copyEmail = () => {
  output.select();
  document.execCommand('copy');
};

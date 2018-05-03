/* global document, atob, Uint64LE */

const input = document.getElementById('mail_input');
const output = document.getElementById('mail_output');
const url = document.getElementById('mail_url');
const message = document.getElementById('mail_message');
const urlregex = /(\d{10,30})\/+(.+)/g;

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
  const email = encode(input.value);
  if (email) {
    message.innerHTML = '';
    output.innerHTML = `${email}@${input.dataset.url}`;
    url.href = `mailto:${email}@${input.dataset.url}`;
  }
});

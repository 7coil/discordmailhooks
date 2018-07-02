# DiscordMail for Webhooks

DiscordMail webhooks... it's like webhooks for DiscordMail!

## Thanks
[AlexFlipnote](https://github.com/AlexFlipnote) / [**ModestaCSS**](https://github.com/AlexFlipnote/ModestaCSS)  
[kawanet](https://github.com/kawanet) / [**int64-buffer**](https://github.com/kawanet/int64-buffer)  
[nodemailer](https://github.com/nodemailer) / [**mailparser**](https://github.com/nodemailer/mailparser)  
[nodemailer](https://github.com/nodemailer) / [**smtp-server**](https://github.com/nodemailer/smtp-server)  
[request](https://github.com/request) / [**request**](https://github.com/request/request)

## Hosting
1. Fill in the configuration in `index.js`
2. `npm i`
3. `npm run`

You may want to obtain a certificate from Let's Encrypt.

## Recommended Setup
1. For each domain, set up a CNAME record to `mss.ovh`, at `mail.[domain]`. For example, `mail.discordbots.co.uk`
2. Add an MX record pointing at `mail.mss.ovh`
3. Using `certbot-auto`, use the certonly function to create a single certificate with every domain that you may have.
  - Dry run: `./certbot-auto certonly -d mail.mss.ovh -d mail.discordbots.co.uk -d mail.discordbots.uk -d discordmail.com --dry-run`
  - Actual run: `./certbot-auto certonly -d mail.mss.ovh -d mail.discordbots.co.uk -d mail.discordbots.uk -d discordmail.com`
4. After this completes, copy the certificate location and edit the `config/mailserver.json` file.

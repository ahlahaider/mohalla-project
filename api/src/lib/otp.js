// Making and sending one-time codes. The routes don't know HOW a code is
// sent: they call sendCode(), and the mode in config.js decides.
// Adding real SMS later = one more sender function here + OTP_SMS_MODE.
import crypto from 'node:crypto';
import { config } from '../config.js';
import { httpError } from './http.js';

export const OTP = {
  length: 4,          // 4 digits: easy to read off a message and type
  validMinutes: 10,
  maxTries: 5,        // wrong guesses before the code stops working
  resendSeconds: 30,  // wait before asking for another code
};

export const CHANNELS = ['sms', 'whatsapp'];

export const modeFor = (channel) => (channel === 'sms' ? config.otp.smsMode : config.otp.whatsappMode);

// Demo mode always uses the same code so the presenter (and tests) know it.
export function makeCode(channel) {
  if (modeFor(channel) === 'demo') return config.otp.demoCode;
  return String(crypto.randomInt(0, 10 ** OTP.length)).padStart(OTP.length, '0');
}

// "03001234567" -> "923001234567" (the international format both services want)
export const international = (phone) => `92${phone.slice(1)}`;

// English, Roman Urdu and Urdu, so everyone can read it.
const messageText = (code) =>
  `Mohalla code: ${code}\n`
  + `Aap ka Mohalla code ${code} hai.\n`
  + `آپ کا محلہ کوڈ ${code} ہے۔\n`
  + 'Do not share this code. / Yeh code kisi ko na batayein.';

// Sends the code. Returns { demo: true } when nothing was really sent.
export async function sendCode({ phone, channel, code }) {
  const mode = modeFor(channel);
  if (mode === 'demo') return { demo: true };
  if (channel === 'whatsapp' && mode === 'twilio') return sendWithTwilio(phone, code);
  if (channel === 'whatsapp' && mode === 'meta') return sendWithMeta(phone, code);
  throw new Error(`No sender for ${channel} in mode "${mode}". Check OTP_${channel.toUpperCase()}_MODE in .env`);
}

// The message the customer sees when sending fails. The real reason goes to the server log.
const sendFailed = (detail) => {
  console.error('[otp] WhatsApp send failed:', detail);
  return httpError(502, "We couldn't send the WhatsApp message. Try again, or choose SMS.", { code: 'otp_send_failed' });
};

// Twilio WhatsApp sandbox: https://www.twilio.com/docs/whatsapp/sandbox
// The receiving phone must first send the sandbox's "join <word>" message
// (see README), otherwise Twilio refuses with error 63015/63016.
async function sendWithTwilio(phone, code) {
  const { accountSid, authToken, whatsappFrom } = config.twilio;
  if (!accountSid || !authToken) throw sendFailed('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing in .env');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${whatsappFrom}`,
      To: `whatsapp:+${international(phone)}`,
      Body: messageText(code),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw sendFailed(`Twilio ${res.status} ${data.code ?? ''} ${data.message ?? ''}`);
  return { demo: false };
}

// Meta WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
// Business-started messages must use an approved template. An "Authentication"
// template has the code in its body and a copy-code button, so both get the code.
async function sendWithMeta(phone, code) {
  const { accessToken, phoneNumberId, template, language, apiVersion } = config.meta;
  if (!accessToken || !phoneNumberId) throw sendFailed('META_WA_ACCESS_TOKEN / META_WA_PHONE_NUMBER_ID missing in .env');

  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: international(phone),
      type: 'template',
      template: {
        name: template,
        language: { code: language },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: code }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
        ],
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw sendFailed(`Meta ${res.status} ${JSON.stringify(data.error ?? data)}`);
  return { demo: false };
}

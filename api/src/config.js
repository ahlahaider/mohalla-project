// Reads settings from the .env file so secrets never live in the code.
import 'dotenv/config';

const env = process.env;

export const config = {
  port: env.PORT || 4000,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET || 'dev-only-secret-change-me',
  // Customers log in with a 4-digit PIN, so they should rarely be asked to log in again.
  tokenExpiry: '180d',

  // ---- Sign-up codes (OTP) ----
  // Each channel has ONE setting that decides how its codes are sent:
  //   'demo'   = nothing is sent. The code is always DEMO_CODE and the API returns it,
  //              so the screen can show it. Used for SMS in this course project,
  //              because real SMS needs a paid service (Twilio or Firebase): future work.
  //   'twilio' = WhatsApp message through Twilio's WhatsApp sandbox (free trial).
  //   'meta'   = WhatsApp message through Meta's WhatsApp Cloud API.
  // To switch SMS to a real service later: add a sender in src/lib/otp.js and
  // change OTP_SMS_MODE. Nothing else in the app needs to change.
  otp: {
    smsMode: env.OTP_SMS_MODE || 'demo',
    whatsappMode: env.OTP_WHATSAPP_MODE || 'demo',
    demoCode: '1234',
  },

  // Only needed when OTP_WHATSAPP_MODE=twilio (see README: "WhatsApp codes").
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    whatsappFrom: env.TWILIO_WHATSAPP_FROM || '+14155238886', // Twilio's shared sandbox number
  },

  // Only needed when OTP_WHATSAPP_MODE=meta (see README: "WhatsApp codes").
  meta: {
    accessToken: env.META_WA_ACCESS_TOKEN,
    phoneNumberId: env.META_WA_PHONE_NUMBER_ID,
    template: env.META_WA_TEMPLATE || 'mohalla_code', // an approved "Authentication" template
    language: env.META_WA_TEMPLATE_LANG || 'en',
    apiVersion: env.META_WA_API_VERSION || 'v23.0',
  },
};

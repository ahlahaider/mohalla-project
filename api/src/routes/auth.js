// Logging in and signing up.
//
// Customers (web app) never get a password. They use their mobile number and a 4-digit PIN:
//   Sign-up:     POST /phone -> POST /otp/request -> POST /otp/verify -> POST /register (name + PIN)
//   Every time:  POST /phone -> POST /login (number + PIN)
//   Forgot PIN:  POST /otp/request (purpose "reset") -> POST /otp/verify -> POST /pin/reset
//
// Workers (Expo app) and admin still use a password until the worker app moves to PINs.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { config } from '../config.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, normalisePhone } from '../lib/http.js';
import { AREAS, isValidPin, recordWrongPin, lockMinutesLeft } from '../lib/rules.js';
import { OTP, CHANNELS, makeCode, sendCode } from '../lib/otp.js';

const router = Router();

const PURPOSES = ['signup', 'reset'];

function phoneOrFail(raw) {
  const phone = normalisePhone(raw);
  if (!phone) throw httpError(400, 'Enter a mobile number like 0300 1234567', { code: 'bad_phone' });
  return phone;
}

const loginReply = (user) => ({
  token: signToken(user),
  user: { ...user.toPublic(), phone: user.phone, language: user.language },
});

// A verified code is swapped for a short "OTP ticket": proof that this phone
// was verified in the last 15 minutes. /register and /pin/reset require it.
const makeTicket = (phone, purpose) => jwt.sign({ phone, purpose: `otp-${purpose}` }, config.jwtSecret, { expiresIn: '15m' });

function readTicket(ticket, purpose) {
  try {
    const payload = jwt.verify(ticket || '', config.jwtSecret);
    if (payload.purpose === `otp-${purpose}`) return payload.phone;
  } catch { /* fall through */ }
  throw httpError(401, 'Your code expired. Ask for a new one.', { code: 'otp_expired' });
}

// POST /api/auth/phone { phone } -> { registered }
// Decides the next screen: PIN (already has an account) or sign-up code.
// Trade-off agreed with the team: this shows whether a number has an account,
// as most Pakistani wallet apps do. The PIN lock keeps accounts safe.
router.post('/phone', asyncRoute(async (req, res) => {
  const phone = phoneOrFail(req.body.phone);
  res.json({ phone, registered: Boolean(await User.exists({ phone })) });
}));

// POST /api/auth/otp/request { phone, channel: 'sms' | 'whatsapp', purpose: 'signup' | 'reset' }
router.post('/otp/request', asyncRoute(async (req, res) => {
  const phone = phoneOrFail(req.body.phone);
  const { channel, purpose = 'signup' } = req.body;
  if (!CHANNELS.includes(channel)) throw httpError(400, 'Choose SMS or WhatsApp');
  if (!PURPOSES.includes(purpose)) throw httpError(400, 'Unknown purpose');

  const registered = await User.exists({ phone });
  if (purpose === 'signup' && registered) throw httpError(409, 'This number already has an account. Enter your PIN.', { code: 'already_registered' });
  if (purpose === 'reset' && !registered) throw httpError(404, 'No account with this number yet.', { code: 'not_registered' });

  // Stop someone pressing "send again" over and over.
  const last = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  const waitSeconds = last ? Math.ceil(OTP.resendSeconds - (Date.now() - last.createdAt) / 1000) : 0;
  if (waitSeconds > 0) throw httpError(429, `Wait ${waitSeconds} seconds before asking again.`, { code: 'otp_wait', seconds: waitSeconds });

  const code = makeCode(channel);
  await Otp.deleteMany({ phone, purpose }); // only the newest code works
  const otp = await Otp.create({
    phone, purpose, channel,
    codeHash: await bcrypt.hash(code, 8),
    expiresAt: new Date(Date.now() + OTP.validMinutes * 60 * 1000),
  });

  let sent;
  try {
    sent = await sendCode({ phone, channel, code });
  } catch (err) {
    await otp.deleteOne(); // nothing was delivered, so let them try again straight away
    throw err;
  }

  res.json({
    channel,
    validMinutes: OTP.validMinutes,
    resendSeconds: OTP.resendSeconds,
    // Demo mode only: the screen shows this code, because no message was sent.
    ...(sent.demo && { demoCode: code }),
  });
}));

// POST /api/auth/otp/verify { phone, purpose, code } -> { ticket }
router.post('/otp/verify', asyncRoute(async (req, res) => {
  const phone = phoneOrFail(req.body.phone);
  const { purpose = 'signup' } = req.body;
  const otp = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) throw httpError(400, 'This code expired. Ask for a new one.', { code: 'otp_expired' });
  if (otp.tries >= OTP.maxTries) throw httpError(429, 'Too many wrong codes. Ask for a new one.', { code: 'otp_too_many' });

  if (!(await bcrypt.compare(String(req.body.code ?? ''), otp.codeHash))) {
    otp.tries += 1;
    await otp.save();
    throw httpError(400, 'That code is not right. Check the message and try again.', { code: 'otp_wrong', triesLeft: OTP.maxTries - otp.tries });
  }

  await otp.deleteOne(); // a code works once
  res.json({ ticket: makeTicket(phone, purpose) });
}));

// POST /api/auth/register
//   Customers: { role: 'customer', ticket, name, pin, area?, language? }
//   Workers:   { role: 'worker', name, phone, password, area, workerProfile } (worker app, for now)
// Admin accounts are only made by the seed script, so nobody can register as an admin.
router.post('/register', asyncRoute(async (req, res) => {
  const { role, name, area, language, workerProfile } = req.body;
  if (!['customer', 'worker'].includes(role)) throw httpError(400, 'Choose customer or worker');
  if (!name?.trim()) throw httpError(400, 'Enter your name', { code: 'no_name' });
  if (area && !AREAS[area]) throw httpError(400, 'Unknown area');

  let phone;
  let secret;
  if (role === 'customer') {
    if (req.body.phone !== undefined) phoneOrFail(req.body.phone); // a typo'd number fails early
    phone = readTicket(req.body.ticket, 'signup');
    if (!isValidPin(req.body.pin)) throw httpError(400, 'Choose 4 numbers for your PIN', { code: 'bad_pin' });
    secret = req.body.pin;
  } else {
    phone = phoneOrFail(req.body.phone);
    if (!req.body.password || req.body.password.length < 6) throw httpError(400, 'Password needs at least 6 characters');
    secret = req.body.password;
  }

  if (await User.exists({ phone })) throw httpError(409, 'That number already has an account', { code: 'already_registered' });

  const user = await User.create({
    role,
    name: name.trim(),
    phone,
    // bcrypt stores a one-way hash, so even we can't read the PIN back.
    passwordHash: await bcrypt.hash(secret, 10),
    area,
    language,
    workerProfile: role === 'worker' ? { areasServed: area ? [area] : [], ...workerProfile } : undefined,
  });

  res.status(201).json(loginReply(user));
}));

// POST /api/auth/login { phone, pin }   (workers/admin: { phone, password })
router.post('/login', asyncRoute(async (req, res) => {
  const phone = normalisePhone(req.body.phone);
  // +passwordHash: that field is hidden by default (select: false in the model).
  const user = phone && await User.findOne({ phone }).select('+passwordHash');
  const secret = String(req.body.pin ?? req.body.password ?? '');

  if (user) {
    const minutes = lockMinutesLeft(user);
    if (minutes) throw httpError(423, `Too many wrong tries. Try again in ${minutes} minutes.`, { code: 'pin_locked', minutes });
  }

  const ok = user && await bcrypt.compare(secret, user.passwordHash);
  if (!ok) {
    if (user) {
      const result = recordWrongPin(user);
      await user.save();
      if (result.locked) throw httpError(423, `Too many wrong tries. Try again in ${result.minutes} minutes.`, { code: 'pin_locked', minutes: result.minutes });
      throw httpError(401, 'Wrong number or PIN', { code: 'pin_wrong', triesLeft: result.triesLeft });
    }
    throw httpError(401, 'Wrong number or PIN', { code: 'pin_wrong' });
  }
  if (user.status === 'banned') throw httpError(403, 'This account is banned', { code: 'banned' });

  if (user.failedLogins || user.lockedUntil) {
    user.failedLogins = 0;
    user.lockedUntil = undefined;
    await user.save();
  }
  res.json(loginReply(user));
}));

// POST /api/auth/pin/reset { ticket, pin } — after a "reset" code was verified.
// Logs the person straight in with the new PIN.
router.post('/pin/reset', asyncRoute(async (req, res) => {
  const phone = readTicket(req.body.ticket, 'reset');
  if (!isValidPin(req.body.pin)) throw httpError(400, 'Choose 4 numbers for your PIN', { code: 'bad_pin' });
  const user = await User.findOne({ phone, role: 'customer' });
  if (!user) throw httpError(404, 'No customer account with this number.', { code: 'not_registered' });

  user.passwordHash = await bcrypt.hash(req.body.pin, 10);
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();
  res.json(loginReply(user));
}));

// GET /auth/me — who am I? The apps call this on start-up.
router.get('/me', requireAuth(), (req, res) => {
  res.json({ user: { ...req.user.toPublic(), phone: req.user.phone, language: req.user.language, strikes: req.user.strikes.length } });
});

export default router;

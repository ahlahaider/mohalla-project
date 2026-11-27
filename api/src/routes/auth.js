// Logging in and signing up.
//
// Customers (web app) and workers (worker app) log in the same way: mobile number + 4-digit PIN.
//   Sign-up:     POST /phone -> POST /otp/request -> POST /otp/verify -> POST /register (name + PIN, + work details for workers)
//   Every time:  POST /phone -> POST /login (number + PIN)
//   Forgot PIN:  POST /otp/request (purpose "reset") -> POST /otp/verify -> POST /pin/reset
//
// Each app sends `app: 'customer' | 'worker'`, so a worker who opens the customer
// website (or the other way round) is told which app to use. Admin keeps a password.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import Job from '../models/Job.js';
import { Dispute, Vouch } from '../models/others.js';
import { config } from '../config.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, normalisePhone, isPhotoUrl } from '../lib/http.js';
import { AREAS, CATEGORIES, isValidPin, recordWrongPin, lockMinutesLeft } from '../lib/rules.js';
import { OTP, CHANNELS, makeCode, sendCode } from '../lib/otp.js';

const router = Router();

const PURPOSES = ['signup', 'reset', 'change']; // change = moving an account to a new number
const APPS = ['customer', 'worker'];

// The number belongs to the other app's kind of account.
function wrongApp(user, app) {
  if (!user || !APPS.includes(app) || user.role === app) return;
  throw httpError(409, user.role === 'worker'
    ? 'This number is a worker account. Use the Mohalla Worker app.'
    : 'This number is a customer account. Use the Mohalla website.', { code: 'wrong_app', role: user.role });
}

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

// POST /api/auth/phone { phone, app? } -> { registered }
// Decides the next screen: PIN (already has an account) or sign-up code.
// Trade-off agreed with the team: this shows whether a number has an account,
// as most Pakistani wallet apps do. The PIN lock keeps accounts safe.
router.post('/phone', asyncRoute(async (req, res) => {
  const phone = phoneOrFail(req.body.phone);
  const user = await User.findOne({ phone }, 'role');
  wrongApp(user, req.body.app);
  res.json({ phone, registered: Boolean(user) });
}));

// POST /api/auth/otp/request { phone, channel: 'sms' | 'whatsapp', purpose: 'signup' | 'reset', app? }
router.post('/otp/request', asyncRoute(async (req, res) => {
  const phone = phoneOrFail(req.body.phone);
  const { channel, purpose = 'signup' } = req.body;
  if (!CHANNELS.includes(channel)) throw httpError(400, 'Choose SMS or WhatsApp');
  if (!PURPOSES.includes(purpose)) throw httpError(400, 'Unknown purpose');

  const registered = await User.findOne({ phone }, 'role');
  if (purpose === 'change' && registered) throw httpError(409, 'This number already has an account.', { code: 'number_taken' });
  if (purpose !== 'change') wrongApp(registered, req.body.app);
  if (purpose === 'reset' && registered?.role === 'admin') throw httpError(404, 'No account with this number yet.', { code: 'not_registered' });
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

// POST /api/auth/register  (after a sign-up code was verified)
//   Customers: { role: 'customer', ticket, name, pin, area?, language? }
//   Workers:   { role: 'worker', ticket, name, pin, language?, workerProfile: { skills, areasServed,
//                priceMin?, priceMax?, gender? }, assistedBy?: { name, phone?, relation } }
// Admin accounts are only made by the seed script, so nobody can register as an admin.
router.post('/register', asyncRoute(async (req, res) => {
  const { role, name, language } = req.body;
  if (!APPS.includes(role)) throw httpError(400, 'Choose customer or worker');
  if (req.body.phone !== undefined) phoneOrFail(req.body.phone); // a typo'd number fails early
  const phone = readTicket(req.body.ticket, 'signup');
  if (!name?.trim()) throw httpError(400, 'Enter your name', { code: 'no_name' });
  if (!isValidPin(req.body.pin)) throw httpError(400, 'Choose 4 numbers for your PIN', { code: 'bad_pin' });
  if (await User.exists({ phone })) throw httpError(409, 'That number already has an account', { code: 'already_registered' });

  const fields = {
    role,
    name: name.trim(),
    phone,
    // bcrypt stores a one-way hash, so even we can't read the PIN back.
    passwordHash: await bcrypt.hash(req.body.pin, 10),
    language: ['en', 'roman-ur'].includes(language) ? language : undefined,
  };

  if (role === 'customer') {
    if (req.body.area && !AREAS[req.body.area]) throw httpError(400, 'Unknown area');
    fields.area = req.body.area;
  } else {
    Object.assign(fields, workerFields(req.body));
  }

  const user = await User.create(fields);
  res.status(201).json(loginReply(user));
}));

// Checks the work details a new worker filled in.
function workerFields({ workerProfile: p = {}, assistedBy, photoUrl }) {
  const skills = [...new Set(p.skills || [])].filter((c) => CATEGORIES.includes(c));
  const areasServed = [...new Set(p.areasServed || [])].filter((a) => AREAS[a]);
  if (!skills.length) throw httpError(400, 'Choose the work you do', { code: 'no_skills' });
  if (!areasServed.length) throw httpError(400, 'Choose the areas you work in', { code: 'no_areas' });
  const priceMin = p.priceMin == null || p.priceMin === '' ? undefined : Number(p.priceMin);
  if (priceMin !== undefined && (!Number.isFinite(priceMin) || priceMin < 0)) throw httpError(400, 'Enter your starting price in rupees', { code: 'bad_price' });

  const fields = {
    area: areasServed[0],
    photoUrl: isPhotoUrl(photoUrl) ? photoUrl : undefined,
    workerProfile: {
      skills,
      areasServed,
      priceMin,
      priceMax: p.priceMax == null ? undefined : Number(p.priceMax) || undefined,
      gender: ['female', 'male'].includes(p.gender) ? p.gender : 'unspecified',
      availableToday: true, // new workers start "working today" so customers can find them
    },
  };

  if (assistedBy?.name?.trim()) {
    const helperPhone = assistedBy.phone ? normalisePhone(assistedBy.phone) : undefined;
    if (assistedBy.phone && !helperPhone) throw httpError(400, "The helper's number doesn't look right", { code: 'bad_helper_phone' });
    fields.assistedBy = {
      name: assistedBy.name.trim().slice(0, 80),
      phone: helperPhone,
      relation: ['shop', 'friend', 'family'].includes(assistedBy.relation) ? assistedBy.relation : 'other',
    };
  }
  return fields;
}

// POST /api/auth/login { phone, pin, app? }   (admin: { phone, password })
router.post('/login', asyncRoute(async (req, res) => {
  const phone = normalisePhone(req.body.phone);
  // +passwordHash: that field is hidden by default (select: false in the model).
  const user = phone && await User.findOne({ phone }).select('+passwordHash');
  const secret = String(req.body.pin ?? req.body.password ?? '');

  if (user) {
    wrongApp(user, req.body.app);
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
  if (user.status === 'closed') throw httpError(403, 'This account was closed', { code: 'account_closed' });

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
  const user = await User.findOne({ phone, role: { $in: APPS } });
  if (!user) throw httpError(404, 'No account with this number.', { code: 'not_registered' });
  wrongApp(user, req.body.app);

  user.passwordHash = await bcrypt.hash(req.body.pin, 10);
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();
  res.json(loginReply(user));
}));

// ---------- settings: change PIN, change number, close account ----------

// Checks the current PIN for a logged-in person (same lock rules as logging in).
async function checkPin(userId, pin) {
  const user = await User.findById(userId).select('+passwordHash');
  const minutes = lockMinutesLeft(user);
  if (minutes) throw httpError(423, `Too many wrong tries. Try again in ${minutes} minutes.`, { code: 'pin_locked', minutes });
  if (!(await bcrypt.compare(String(pin ?? ''), user.passwordHash))) {
    const result = recordWrongPin(user);
    await user.save();
    if (result.locked) throw httpError(423, `Too many wrong tries. Try again in ${result.minutes} minutes.`, { code: 'pin_locked', minutes: result.minutes });
    throw httpError(401, 'Wrong PIN', { code: 'pin_wrong', triesLeft: result.triesLeft });
  }
  if (user.failedLogins) { user.failedLogins = 0; await user.save(); }
  return user;
}

// POST /api/auth/pin/change { pin, newPin } — knows the old PIN, wants a new one.
router.post('/pin/change', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  if (!isValidPin(req.body.newPin)) throw httpError(400, 'Choose 4 numbers for your PIN', { code: 'bad_pin' });
  const user = await checkPin(req.user._id, req.body.pin);
  user.passwordHash = await bcrypt.hash(req.body.newPin, 10);
  await user.save();
  res.json({ ok: true });
}));

// POST /api/auth/phone/change { ticket } — after a code sent to the NEW number was verified
// (otp/request + otp/verify with purpose "change").
router.post('/phone/change', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const phone = readTicket(req.body.ticket, 'change');
  if (await User.exists({ phone })) throw httpError(409, 'This number already has an account.', { code: 'number_taken' });
  req.user.phone = phone;
  await req.user.save();
  res.json({ phone });
}));

// POST /api/auth/close { pin } — close my own account.
// Jobs stay on the record (disputes are judged against it); the person can no
// longer log in, workers stop showing in search, waiting requests are cancelled.
router.post('/close', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  await checkPin(req.user._id, req.body.pin);
  const me = req.user._id;
  const side = req.user.role === 'worker' ? 'worker' : 'customer';
  if (await Job.exists({ [side]: me, status: { $in: ['accepted', 'agreed'] } })) {
    throw httpError(409, 'Finish or cancel your jobs first', { code: 'active_jobs' });
  }
  if (await Dispute.exists({ status: 'open', $or: [{ openedBy: me }, { against: me }] })) {
    throw httpError(409, 'Wait until Mohalla decides your open problem report', { code: 'open_dispute' });
  }

  if (side === 'customer') {
    await Job.updateMany({ customer: me, status: { $in: ['requested', 'open'] } }, { status: 'cancelled', cancelledBy: me });
  } else {
    await Job.updateMany({ worker: me, status: 'requested' }, { status: 'declined' });
    await Vouch.updateMany({ from: me, active: true }, { active: false });
    req.user.workerProfile.availableToday = false;
  }
  req.user.status = 'closed';
  req.user.closedAt = new Date();
  await req.user.save();
  res.json({ ok: true });
}));

// GET /auth/me — who am I? The apps call this on start-up.
router.get('/me', requireAuth(), (req, res) => {
  res.json({ user: { ...req.user.toPublic(), phone: req.user.phone, address: req.user.address, language: req.user.language, strikes: req.user.strikes.length, assistedBy: req.user.assistedBy?.name ? { name: req.user.assistedBy.name, relation: req.user.assistedBy.relation } : undefined } });
});

export default router;

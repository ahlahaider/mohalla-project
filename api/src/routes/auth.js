import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, normalisePhone } from '../lib/http.js';
import { AREAS } from '../lib/rules.js';

const router = Router();

// POST /api/auth/register
// Customers sign up on the web app, workers in the worker app. Admin accounts
// are only made by the seed script, so nobody can register as an admin.
router.post('/register', asyncRoute(async (req, res) => {
  const { role, name, phone, password, area, language, workerProfile } = req.body;

  if (!['customer', 'worker'].includes(role)) throw httpError(400, 'Choose customer or worker');
  if (!name?.trim()) throw httpError(400, 'Enter your name');
  const cleanPhone = normalisePhone(phone);
  if (!cleanPhone) throw httpError(400, 'Enter a mobile number like 0300 1234567');
  if (!password || password.length < 6) throw httpError(400, 'Password needs at least 6 characters');
  if (area && !AREAS[area]) throw httpError(400, 'Unknown area');

  if (await User.exists({ phone: cleanPhone })) throw httpError(409, 'That number already has an account');

  const user = await User.create({
    role,
    name: name.trim(),
    phone: cleanPhone,
    // bcrypt stores a one-way hash, so even we can't read the password back.
    passwordHash: await bcrypt.hash(password, 10),
    area,
    language,
    workerProfile: role === 'worker' ? { areasServed: area ? [area] : [], ...workerProfile } : undefined,
  });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
}));

// POST /api/auth/login
router.post('/login', asyncRoute(async (req, res) => {
  const phone = normalisePhone(req.body.phone);
  // +passwordHash: that field is hidden by default (select: false in the model).
  const user = phone && await User.findOne({ phone }).select('+passwordHash');
  const ok = user && await bcrypt.compare(req.body.password || '', user.passwordHash);
  // Same message either way, so nobody can test which numbers have accounts.
  if (!ok) throw httpError(401, 'Wrong number or password');
  if (user.status === 'banned') throw httpError(403, 'This account is banned');

  res.json({ token: signToken(user), user: { ...user.toPublic(), phone: user.phone, language: user.language } });
}));

// GET /api/auth/me — who am I? The apps call this on start-up.
router.get('/me', requireAuth(), (req, res) => {
  res.json({ user: { ...req.user.toPublic(), phone: req.user.phone, language: req.user.language, strikes: req.user.strikes.length } });
});

export default router;

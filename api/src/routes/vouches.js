// Vouching: experienced workers put their own reputation behind a newcomer.
import { Router } from 'express';
import User from '../models/User.js';
import { Vouch } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, normalisePhone } from '../lib/http.js';
import { canVouch } from '../lib/rules.js';

const router = Router();

// Vouch for a worker, found by id (POST /api/vouches/:workerId)
// or by mobile number (POST /api/vouches { phone }), which is what the worker app uses.
async function vouchFor(req, res, target) {
  if (!target) throw httpError(404, 'No worker with this number', { code: 'no_worker' });
  if (req.user._id.equals(target._id)) throw httpError(400, "You can't vouch for yourself", { code: 'vouch_self' });
  if (await Vouch.exists({ from: req.user._id, to: target._id, active: true })) throw httpError(409, 'Already vouched', { code: 'vouch_already' });

  const active = await Vouch.countDocuments({ from: req.user._id, active: true });
  const check = canVouch(req.user.stats, active, req.user.vouchingRevoked);
  if (!check.ok) throw httpError(403, check.reason, { code: 'vouch_not_allowed' });

  await Vouch.create({ from: req.user._id, to: target._id });
  res.status(201).json({ ok: true, activeVouches: active + 1, worker: { id: target._id, name: target.name } });
}

router.post('/', requireAuth('worker'), asyncRoute(async (req, res) => {
  const phone = normalisePhone(req.body.phone);
  if (!phone) throw httpError(400, 'Enter a mobile number like 0300 1234567', { code: 'bad_phone' });
  await vouchFor(req, res, await User.findOne({ phone, role: 'worker' }));
}));

router.post('/:workerId', requireAuth('worker'), asyncRoute(async (req, res) => {
  await vouchFor(req, res, await User.findOne({ _id: req.params.workerId, role: 'worker' }));
}));

// DELETE /api/vouches/:workerId — withdraw a vouch (frees up a slot).
router.delete('/:workerId', requireAuth('worker'), asyncRoute(async (req, res) => {
  const result = await Vouch.updateOne({ from: req.user._id, to: req.params.workerId, active: true }, { active: false });
  if (!result.modifiedCount) throw httpError(404, 'No active vouch for this worker');
  res.json({ ok: true });
}));

export default router;

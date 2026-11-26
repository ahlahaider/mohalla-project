// Vouching: experienced workers put their own reputation behind a newcomer.
import { Router } from 'express';
import User from '../models/User.js';
import { Vouch } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError } from '../lib/http.js';
import { canVouch } from '../lib/rules.js';

const router = Router();

// POST /api/vouches/:workerId
router.post('/:workerId', requireAuth('worker'), asyncRoute(async (req, res) => {
  if (req.user._id.equals(req.params.workerId)) throw httpError(400, "You can't vouch for yourself");
  const target = await User.findOne({ _id: req.params.workerId, role: 'worker' });
  if (!target) throw httpError(404, 'Worker not found');
  if (await Vouch.exists({ from: req.user._id, to: target._id, active: true })) throw httpError(409, 'Already vouched');

  const active = await Vouch.countDocuments({ from: req.user._id, active: true });
  const check = canVouch(req.user.stats, active, req.user.vouchingRevoked);
  if (!check.ok) throw httpError(403, check.reason);

  await Vouch.create({ from: req.user._id, to: target._id });
  res.status(201).json({ ok: true, activeVouches: active + 1 });
}));

// DELETE /api/vouches/:workerId — withdraw a vouch (frees up a slot).
router.delete('/:workerId', requireAuth('worker'), asyncRoute(async (req, res) => {
  const result = await Vouch.updateOne({ from: req.user._id, to: req.params.workerId, active: true }, { active: false });
  if (!result.modifiedCount) throw httpError(404, 'No active vouch for this worker');
  res.json({ ok: true });
}));

export default router;

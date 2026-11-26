// Disputes: the admin never decides who is honest. They compare each side's
// statement with the job's record and pick one of three outcomes:
//   upheld     - the record clearly supports one side; the other gets a strike
//   unresolved - word against word; no strike, both statements stay visible
//   settled    - the two sides sorted it out themselves
import { Router } from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { Dispute, Vouch } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError } from '../lib/http.js';
import { applyStrike, agreementTotal, daysAgo, UNRESOLVED_FLAG, VOUCH } from '../lib/rules.js';

const router = Router();

const isParty = (d, user) => d.openedBy.equals(user._id) || d.against.equals(user._id);

// POST /api/disputes/:id/statements — the other side responds (or either adds more).
router.post('/:id/statements', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw httpError(404, 'Dispute not found');
  if (!isParty(dispute, req.user)) throw httpError(403, 'Not your dispute');
  if (dispute.status !== 'open') throw httpError(409, 'This dispute is closed');
  if (!req.body.text?.trim()) throw httpError(400, 'Say what happened');

  dispute.statements.push({ by: req.user._id, text: req.body.text, evidenceUrls: req.body.evidenceUrls || [] });
  await dispute.save();
  res.status(201).json({ statements: dispute.statements.length });
}));

// GET /api/disputes?status=open — admin queue, with the job record attached
// so the admin can compare claims against it on one screen.
router.get('/', requireAuth('admin'), asyncRoute(async (req, res) => {
  const disputes = await Dispute.find({ status: req.query.status || 'open' })
    .sort({ createdAt: 1 })
    .populate('openedBy', 'name role strikes')
    .populate('against', 'name role strikes')
    .populate('statements.by', 'name role')
    .populate('job');

  res.json({
    disputes: disputes.map((d) => ({
      id: d._id, type: d.type, status: d.status, createdAt: d.createdAt, respondBy: d.respondBy,
      openedBy: { id: d.openedBy._id, name: d.openedBy.name, role: d.openedBy.role, strikes: d.openedBy.strikes.length },
      against: { id: d.against._id, name: d.against.name, role: d.against.role, strikes: d.against.strikes.length },
      statements: d.statements.map((s) => ({ by: s.by?.name, role: s.by?.role, text: s.text, evidenceUrls: s.evidenceUrls, at: s.at })),
      record: d.job && {
        id: d.job._id, status: d.job.status, category: d.job.category, description: d.job.description,
        agreement: d.job.agreement, total: agreementTotal(d.job.agreement), payment: d.job.payment,
        onTime: d.job.onTime, completedAt: d.job.completedAt,
      },
      ruling: d.ruling,
    })),
  });
}));

// POST /api/disputes/:id/ruling  { outcome, againstId?, note }
router.post('/:id/ruling', requireAuth('admin'), asyncRoute(async (req, res) => {
  const { outcome, againstId, note } = req.body;
  if (!['upheld', 'unresolved', 'settled'].includes(outcome)) throw httpError(400, 'Choose upheld, unresolved or settled');

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw httpError(404, 'Dispute not found');
  if (dispute.status !== 'open') throw httpError(409, 'Already ruled');

  let strike = null;
  let struck = null;

  if (outcome === 'upheld') {
    // The strike can land on either party: the record might show the person
    // who opened the dispute was the one in the wrong.
    if (![dispute.openedBy.toString(), dispute.against.toString()].includes(String(againstId))) {
      throw httpError(400, 'Choose which party the record goes against');
    }
    struck = await User.findById(againstId);
    strike = applyStrike(struck, { reason: dispute.type, dispute: dispute._id });
    await struck.save();
    await penaliseVouchers(struck);
  }

  // A misconduct suspension was "pending review". If the claim wasn't upheld
  // against that person, lift it now. If it WAS upheld, the account stays
  // suspended until an admin reinstates or bans it from the Users screen.
  if (dispute.type === 'misconduct') {
    const suspendedId = dispute.against;
    const stillStruck = struck && struck._id.equals(suspendedId);
    if (!stillStruck) {
      await User.updateOne({ _id: suspendedId, status: 'suspended', suspendedUntil: { $exists: false } }, { status: 'active' });
    }
  }

  dispute.status = outcome;
  dispute.ruling = { against: outcome === 'upheld' ? againstId : undefined, note, admin: req.user._id, at: new Date() };
  await dispute.save();

  // No strike for unresolved cases, but 3 in 30 days flags the account for a closer look.
  if (outcome === 'unresolved') await flagRepeatUnresolved([dispute.openedBy, dispute.against]);

  res.json({ status: dispute.status, strike });
}));

// If a newly vouched worker gets a strike early on, their vouchers are warned;
// a second warning removes their ability to vouch.
async function penaliseVouchers(worker) {
  if (worker.role !== 'worker' || worker.stats.jobsCompleted >= VOUCH.probationJobs) return;
  const vouches = await Vouch.find({ to: worker._id, active: true });
  for (const v of vouches) {
    const voucher = await User.findById(v.from);
    if (!voucher) continue;
    voucher.vouchWarnings += 1;
    if (voucher.vouchWarnings >= 2) voucher.vouchingRevoked = true;
    await voucher.save();
  }
}

async function flagRepeatUnresolved(userIds) {
  for (const id of userIds) {
    const count = await Dispute.countDocuments({
      status: 'unresolved',
      $or: [{ openedBy: id }, { against: id }],
      updatedAt: { $gte: daysAgo(UNRESOLVED_FLAG.withinDays) },
    });
    if (count >= UNRESOLVED_FLAG.count) await User.updateOne({ _id: id }, { flaggedForReview: true });
  }
}

// GET /api/disputes/mine — disputes I'm part of (for the apps' job screens).
router.get('/mine', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const disputes = await Dispute.find({ $or: [{ openedBy: req.user._id }, { against: req.user._id }] })
    .sort({ createdAt: -1 }).populate('statements.by', 'name role');
  res.json({ disputes });
}));

export default router;

// Admin tools plus the public "report" endpoint.
import { Router } from 'express';
import User from '../models/User.js';
import { Report } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, normalisePhone } from '../lib/http.js';
import { daysFromNow } from '../lib/rules.js';

export const adminRouter = Router();
export const reportsRouter = Router();

// GET /api/admin/users?phone=0300...&flagged=true&role=worker
adminRouter.get('/users', requireAuth('admin'), asyncRoute(async (req, res) => {
  const filter = {};
  if (req.query.phone) filter.phone = normalisePhone(req.query.phone);
  if (req.query.flagged === 'true') filter.flaggedForReview = true;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({
    users: users.map((u) => ({
      ...u.toPublic(), phone: u.phone, strikes: u.strikes, flaggedForReview: u.flaggedForReview,
      suspendedUntil: u.suspendedUntil,
    })),
  });
}));

// PATCH /api/admin/users/:id  { verified?, founding?, featured?, action?: 'suspend'|'ban'|'reinstate', days? }
adminRouter.patch('/users/:id', requireAuth('admin'), asyncRoute(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  const { verified, founding, featured, action, days, clearFlag } = req.body;

  if (verified !== undefined) user.badges.verified = Boolean(verified);
  if (founding !== undefined) user.badges.founding = Boolean(founding);
  if (featured !== undefined && user.workerProfile) user.workerProfile.featured = Boolean(featured);
  if (clearFlag) user.flaggedForReview = false;

  if (action === 'suspend') {
    user.status = 'suspended';
    user.suspendedUntil = days ? daysFromNow(Number(days)) : undefined;
  } else if (action === 'ban') {
    user.status = 'banned';
  } else if (action === 'reinstate') {
    user.status = 'active';
    user.suspendedUntil = undefined;
  }

  await user.save();
  res.json({ user: { ...user.toPublic(), phone: user.phone } });
}));

// GET /api/admin/reports?status=open
adminRouter.get('/reports', requireAuth('admin'), asyncRoute(async (req, res) => {
  const reports = await Report.find({ status: req.query.status || 'open' })
    .sort({ createdAt: -1 }).populate('from', 'name role').populate('against', 'name role status');
  res.json({ reports });
}));

adminRouter.patch('/reports/:id', requireAuth('admin'), asyncRoute(async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
  if (!report) throw httpError(404, 'Report not found');
  res.json({ report });
}));

// POST /api/reports  { againstId, reason, safety }
// Anyone logged in can report anyone. Safety reports suspend straight away
// until an admin looks at them.
reportsRouter.post('/', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const { againstId, reason, safety = false } = req.body;
  if (!reason?.trim()) throw httpError(400, 'Say what happened');
  const against = await User.findById(againstId);
  if (!against) throw httpError(404, 'User not found');
  if (against._id.equals(req.user._id)) throw httpError(400, "You can't report yourself");

  const report = await Report.create({ from: req.user._id, against: against._id, reason, safety });
  if (safety && against.status === 'active' && against.role !== 'admin') {
    against.status = 'suspended';
    against.suspendedUntil = undefined;
    await against.save();
  }
  res.status(201).json({ report: { id: report._id } });
}));

import { Router } from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import { Review, Vouch } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, isPhotoUrl } from '../lib/http.js';
import { areaWithNeighbours, agreementTotal, canVouch, AREAS, CATEGORIES, VOUCH } from '../lib/rules.js';
import { visibleRatings } from '../lib/ratings.js';

const router = Router();

// GET /api/workers?category=plumber&area=pechs&maxPrice=3000&available=true&female=true
// Public, so people can browse before signing up.
router.get('/', asyncRoute(async (req, res) => {
  const { category, area, maxPrice, available, female } = req.query;
  const filter = { role: 'worker', status: 'active' };

  if (category) {
    if (!CATEGORIES.includes(category)) throw httpError(400, 'Unknown category');
    filter['workerProfile.skills'] = category;
  }
  // Searching an area also matches workers who serve the areas next to it.
  if (area) filter['workerProfile.areasServed'] = { $in: areaWithNeighbours(area) };
  if (maxPrice) filter['workerProfile.priceMin'] = { $lte: Number(maxPrice) };
  if (available === 'true') filter['workerProfile.availableToday'] = true;
  if (female === 'true') filter['workerProfile.gender'] = 'female';

  const workers = await User.find(filter).limit(100);
  const ids = workers.map((w) => w._id);
  const [ratings, vouches] = await Promise.all([
    visibleRatings(ids),
    Vouch.find({ to: { $in: ids }, active: true }).populate('from', 'name'),
  ]);

  // Who vouches for each worker, so result cards can say "Rashid trusts him".
  const vouchedBy = new Map();
  for (const v of vouches) {
    const key = v.to.toString();
    vouchedBy.set(key, [...(vouchedBy.get(key) || []), { id: v.from._id, name: v.from.name }]);
  }

  const results = workers.map((w) => ({
    ...w.toPublic(),
    rating: ratings.get(w._id.toString()) || null,
    vouchedBy: vouchedBy.get(w._id.toString()) || [],
  }));

  // Order: featured (paid) first, then founding, then workers in the exact
  // area searched, then by number of completed jobs.
  const score = (w) =>
    (w.workerProfile?.featured ? 1000 : 0) +
    (w.badges?.founding ? 100 : 0) +
    (area && w.workerProfile?.areasServed?.includes(area) ? 10 : 0) +
    Math.min(w.reliability.completed, 9);
  results.sort((a, b) => score(b) - score(a));

  res.json({ workers: results });
}));

// GET /api/workers/:id — a worker's page: profile, visible reviews, who vouches for them.
router.get('/:id', asyncRoute(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: 'worker' });
  if (!worker) throw httpError(404, 'Worker not found');

  const [reviews, vouches, ratings] = await Promise.all([
    Review.find({ to: worker._id, visibleAt: { $lte: new Date() } })
      .sort({ createdAt: -1 }).limit(20).populate('from', 'name'),
    Vouch.find({ to: worker._id, active: true }).populate('from', 'name badges'),
    visibleRatings([worker._id]),
  ]);

  res.json({
    worker: { ...worker.toPublic(), rating: ratings.get(worker._id.toString()) || null },
    reviews: reviews.map((r) => ({ stars: r.stars, comment: r.comment, from: r.from?.name, at: r.createdAt })),
    vouchedBy: vouches.map((v) => ({ id: v.from._id, name: v.from.name, founding: v.from.badges?.founding })),
  });
}));

// PATCH /api/workers/me — a worker edits their own profile.
router.patch('/me', requireAuth('worker'), asyncRoute(async (req, res) => {
  const allowed = ['skills', 'areasServed', 'priceMin', 'priceMax', 'bio', 'gender'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user.workerProfile[key] = req.body[key];
  }
  const p = req.user.workerProfile;
  if (req.body.skills !== undefined && !p.skills.length) throw httpError(400, 'Choose the work you do', { code: 'no_skills' });
  if (req.body.areasServed !== undefined) {
    p.areasServed = [...new Set(p.areasServed)].filter((a) => AREAS[a]);
    if (!p.areasServed.length) throw httpError(400, 'Choose the areas you work in', { code: 'no_areas' });
    req.user.area = p.areasServed[0];
  }
  if (req.body.name?.trim()) req.user.name = req.body.name.trim();
  if (req.body.language) req.user.language = req.body.language;
  if (req.body.photoUrl !== undefined) {
    if (req.body.photoUrl && !isPhotoUrl(req.body.photoUrl)) throw httpError(400, 'Unknown photo');
    req.user.photoUrl = req.body.photoUrl || undefined;
  }
  await req.user.save(); // Mongoose validates skills, gender, etc. on save
  res.json({ user: req.user.toPublic() });
}));

// GET /api/workers/me/summary?period=week|month — the "My earnings" screen.
// Cash is what the worker said they received; ratings only count once visible.
router.get('/me/summary', requireAuth('worker'), asyncRoute(async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : 'week';
  const since = startOf(period);
  const me = req.user;

  const [inPeriod, recent, ratings, myVouches] = await Promise.all([
    Job.find({ worker: me._id, status: 'completed', completedAt: { $gte: since } }, 'payment agreement'),
    Job.find({ worker: me._id, status: 'completed' }).sort({ completedAt: -1 }).limit(10).populate('customer', 'name area'),
    visibleRatings([me._id]),
    Vouch.find({ from: me._id, active: true }).populate('to', 'name'),
  ]);

  const vouchCheck = canVouch(me.stats, myVouches.length, me.vouchingRevoked);
  res.json({
    period,
    since,
    cash: inPeriod.reduce((sum, j) => sum + (j.payment?.workerAmount ?? 0), 0),
    jobs: inPeriod.length,
    rating: ratings.get(me._id.toString()) || null,
    completed: me.stats.jobsCompleted,
    accepted: me.stats.jobsAccepted,
    onTimePct: me.stats.onTimeAsked ? Math.round((100 * me.stats.onTimeYes) / me.stats.onTimeAsked) : null,
    recent: recent.map((j) => ({
      id: j._id, category: j.category, customer: j.customer?.name, area: j.area, completedAt: j.completedAt,
      amount: j.payment?.workerAmount ?? agreementTotal(j.agreement), paid: j.payment?.workerAmount != null,
    })),
    vouch: {
      ok: vouchCheck.ok,
      reason: vouchCheck.ok ? undefined : vouchCheck.reason,
      needJobs: Math.max(0, VOUCH.minCompletedJobs - me.stats.jobsCompleted),
      max: VOUCH.maxActive,
      left: Math.max(0, VOUCH.maxActive - myVouches.length),
      revoked: me.vouchingRevoked,
      people: myVouches.map((v) => ({ id: v.to._id, name: v.to.name })),
    },
  });
}));

// Monday 00:00 this week, or the 1st of this month (server time).
function startOf(period, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), period === 'month' ? 1 : now.getDate());
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// PATCH /api/workers/me/availability — the big "available today" toggle.
router.patch('/me/availability', requireAuth('worker'), asyncRoute(async (req, res) => {
  req.user.workerProfile.availableToday = Boolean(req.body.availableToday);
  await req.user.save();
  res.json({ availableToday: req.user.workerProfile.availableToday });
}));

export default router;

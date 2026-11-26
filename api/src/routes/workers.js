import { Router } from 'express';
import User from '../models/User.js';
import { Review, Vouch } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError } from '../lib/http.js';
import { areaWithNeighbours, CATEGORIES } from '../lib/rules.js';
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
  const ratings = await visibleRatings(workers.map((w) => w._id));

  const results = workers.map((w) => ({ ...w.toPublic(), rating: ratings.get(w._id.toString()) || null }));

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
  if (req.body.name) req.user.name = req.body.name;
  if (req.body.language) req.user.language = req.body.language;
  await req.user.save(); // Mongoose validates skills, gender, etc. on save
  res.json({ user: req.user.toPublic() });
}));

// PATCH /api/workers/me/availability — the big "available today" toggle.
router.patch('/me/availability', requireAuth('worker'), asyncRoute(async (req, res) => {
  req.user.workerProfile.availableToday = Boolean(req.body.availableToday);
  await req.user.save();
  res.json({ availableToday: req.user.workerProfile.availableToday });
}));

export default router;

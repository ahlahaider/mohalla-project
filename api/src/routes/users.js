// Public view of any user's visible reviews. Workers use this to check a
// customer before accepting; customers see it on worker pages.
import { Router } from 'express';
import { Review } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, isPhotoUrl } from '../lib/http.js';
import { AREAS } from '../lib/rules.js';

const router = Router();

// PATCH /api/users/me — a customer's settings: name, home area, saved address, language, photo.
// (Workers change their profile with PATCH /api/workers/me.)
router.patch('/me', requireAuth('customer'), asyncRoute(async (req, res) => {
  const { name, area, address, language, photoUrl } = req.body;
  if (name !== undefined) {
    if (!String(name).trim()) throw httpError(400, 'Enter your name', { code: 'no_name' });
    req.user.name = String(name).trim().slice(0, 60);
  }
  if (area !== undefined) {
    if (area && !AREAS[area]) throw httpError(400, 'Unknown area');
    req.user.area = area || undefined;
  }
  if (address !== undefined) req.user.address = String(address).trim().slice(0, 300) || undefined;
  if (language !== undefined && ['en', 'roman-ur'].includes(language)) req.user.language = language;
  if (photoUrl !== undefined) {
    if (photoUrl && !isPhotoUrl(photoUrl)) throw httpError(400, 'Unknown photo');
    req.user.photoUrl = photoUrl || undefined;
  }
  await req.user.save();
  res.json({ user: { ...req.user.toPublic(), phone: req.user.phone, address: req.user.address, language: req.user.language } });
}));

// GET /api/users/:id/reviews
router.get('/:id/reviews', requireAuth(), asyncRoute(async (req, res) => {
  const reviews = await Review.find({ to: req.params.id, visibleAt: { $lte: new Date() } })
    .sort({ createdAt: -1 }).limit(50).populate('from', 'name role');
  res.json({
    reviews: reviews.map((r) => ({ stars: r.stars, comment: r.comment, from: r.from?.name, fromRole: r.from?.role, at: r.createdAt })),
  });
}));

export default router;

// Public view of any user's visible reviews. Workers use this to check a
// customer before accepting; customers see it on worker pages.
import { Router } from 'express';
import { Review } from '../models/others.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../lib/http.js';

const router = Router();

// GET /api/users/:id/reviews
router.get('/:id/reviews', requireAuth(), asyncRoute(async (req, res) => {
  const reviews = await Review.find({ to: req.params.id, visibleAt: { $lte: new Date() } })
    .sort({ createdAt: -1 }).limit(50).populate('from', 'name role');
  res.json({
    reviews: reviews.map((r) => ({ stars: r.stars, comment: r.comment, from: r.from?.name, fromRole: r.from?.role, at: r.createdAt })),
  });
}));

export default router;

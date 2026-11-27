// Uploading and showing photos.
//   POST /api/photos { data: "data:image/jpeg;base64,..." }  -> { url: "/api/photos/<key>" }
//   GET  /api/photos/:key                                    -> the image itself
// The returned url is what gets saved on a job (bill photo, problem photo, evidence)
// or on a worker's profile.
import crypto from 'node:crypto';
import { Router } from 'express';
import Photo, { PHOTO_TYPES, PHOTO_MAX_BYTES } from '../models/Photo.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError } from '../lib/http.js';

const router = Router();

const MAX_PER_USER = 300; // stops one account filling the database

router.post('/', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const match = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(req.body.data || ''));
  if (!match || !PHOTO_TYPES.includes(match[1])) throw httpError(400, 'Send a JPEG, PNG or WebP photo', { code: 'bad_photo' });
  const data = Buffer.from(match[2], 'base64');
  if (!data.length) throw httpError(400, 'The photo is empty', { code: 'bad_photo' });
  if (data.length > PHOTO_MAX_BYTES) throw httpError(413, 'The photo is too big', { code: 'photo_too_big' });
  if (await Photo.countDocuments({ owner: req.user._id }) >= MAX_PER_USER) throw httpError(429, 'Too many photos', { code: 'photo_limit' });

  const key = crypto.randomBytes(16).toString('hex');
  await Photo.create({ key, owner: req.user._id, mime: match[1], data, size: data.length });
  res.status(201).json({ url: `/api/photos/${key}` });
}));

router.get('/:key', asyncRoute(async (req, res) => {
  if (!/^[a-f0-9]{32}$/.test(req.params.key)) throw httpError(404, 'Photo not found');
  const photo = await Photo.findOne({ key: req.params.key });
  if (!photo) throw httpError(404, 'Photo not found');
  res.set({ 'Content-Type': photo.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
  res.send(photo.data);
}));

export default router;

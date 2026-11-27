// Builds the Express app: middleware, routes, error handling.
// Kept separate from server.js (which connects to MongoDB and starts listening)
// so tests can load the app without a database.
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import jobRoutes from './routes/jobs.js';
import disputeRoutes from './routes/disputes.js';
import vouchRoutes from './routes/vouches.js';
import userRoutes from './routes/users.js';
import photoRoutes from './routes/photos.js';
import { adminRouter, reportsRouter } from './routes/admin.js';
import { AREAS, CATEGORIES } from './lib/rules.js';

export const app = express();

app.use(cors()); // lets the web app (a different address) call this API
// Photo uploads are bigger than other requests, so they get their own size limit.
app.use('/api/photos', express.json({ limit: '4mb' }), photoRoutes);
app.use(express.json()); // reads JSON request bodies into req.body

app.get('/api/health', (req, res) => res.json({ ok: true }));
// The apps fetch these lists instead of hard-coding them.
app.get('/api/meta', (req, res) => res.json({ categories: CATEGORIES, areas: Object.keys(AREAS) }));

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/vouches', vouchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// One place that turns every error into a JSON answer the apps can show.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: Object.values(err.errors)[0].message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid ${err.path}` }); // e.g. a malformed id
  }
  if (err.code === 11000) return res.status(409).json({ error: 'That already exists' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'The photo is too big', code: 'photo_too_big' });
  if (!err.status) console.error(err); // unexpected: log it for us
  res.status(err.status || 500).json(err.status ? { error: err.message, ...err.extra } : { error: 'Something went wrong' });
});

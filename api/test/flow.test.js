// End-to-end test of the whole job flow against a real database.
// Skipped unless TEST_MONGO_URI is set, because it WIPES that database.
// Use a separate Atlas database just for tests, e.g. .../mohalla-test
//   TEST_MONGO_URI="mongodb+srv://.../mohalla-test" npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import { Review, Dispute, Vouch, Report } from '../src/models/others.js';

const uri = process.env.TEST_MONGO_URI;
const opts = { skip: !uri && 'set TEST_MONGO_URI to run' };

let server;
let base;

before(async () => {
  if (!uri) return;
  await mongoose.connect(uri);
  await Promise.all([User, Job, Review, Dispute, Vouch, Report].map((m) => m.deleteMany({})));
  // Admins can't register through the API, so make one directly.
  await User.create({ role: 'admin', name: 'Admin', phone: '03000000000', passwordHash: await bcrypt.hash('secret1', 4) });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  if (!uri) return;
  server.close();
  await mongoose.disconnect();
});

// Small helper: call the API, fail loudly on unexpected status codes.
async function call(method, path, token, body, expect = [200, 201]) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  const ok = [].concat(expect).includes(res.status);
  assert.ok(ok, `${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

test('a direct job goes from request to rating, then a dispute is ruled', opts, async () => {
  const c = await call('POST', '/auth/register', null, { role: 'customer', name: 'Sana', phone: '03001111111', password: 'secret1', area: 'pechs' });
  const w = await call('POST', '/auth/register', null, {
    role: 'worker', name: 'Rashid', phone: '03111111111', password: 'secret1', area: 'pechs',
    workerProfile: { skills: ['electrician'], areasServed: ['pechs'], priceMin: 800, priceMax: 5000 },
  });
  const admin = await call('POST', '/auth/login', null, { phone: '03000000000', password: 'secret1' });

  // Customer finds the worker by searching a neighbouring area.
  const search = await call('GET', '/workers?category=electrician&area=saddar');
  assert.equal(search.workers.length, 1);

  const { job } = await call('POST', '/jobs', c.token, {
    workerId: w.user.id, category: 'electrician', description: 'Fan not working', area: 'pechs', address: 'House 1',
  });

  // Before accepting, the worker can't see the address.
  let view = await call('GET', `/jobs/${job.id}`, w.token);
  assert.equal(view.job.address, undefined);

  await call('POST', `/jobs/${job.id}/accept`, w.token);
  view = await call('GET', `/jobs/${job.id}`, w.token);
  assert.equal(view.job.address, 'House 1');

  // Amendments aren't allowed before the quote is agreed.
  await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'amendment', amount: 100 }, 409);

  const visit = await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'visit', amount: 500 });
  await call('POST', `/jobs/${job.id}/agreement/${visit.agreement[0]._id}/accept`, c.token);
  const quote = await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'quote', amount: 2500, scope: 'Replace regulator' });
  const agreed = await call('POST', `/jobs/${job.id}/agreement/${quote.agreement[1]._id}/accept`, c.token);
  assert.equal(agreed.status, 'agreed');

  // Parts need a bill photo.
  await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'part', amount: 900 }, 400);
  const part = await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'part', amount: 900, billPhotoUrl: 'https://x/bill.jpg' });
  const afterPart = await call('POST', `/jobs/${job.id}/agreement/${part.agreement[2]._id}/accept`, c.token);
  assert.equal(afterPart.total, 3900);

  await call('POST', `/jobs/${job.id}/complete`, c.token, { onTime: true });
  await call('POST', `/jobs/${job.id}/payment`, w.token, { amount: 3900 });
  const pay = await call('POST', `/jobs/${job.id}/payment`, c.token, { amount: 3900 });
  assert.equal(pay.mismatch, false);

  // First rating stays hidden; the second reveals both.
  const r1 = await call('POST', `/jobs/${job.id}/review`, c.token, { stars: 5, comment: 'Great' });
  assert.equal(r1.visibleNow, false);
  const r2 = await call('POST', `/jobs/${job.id}/review`, w.token, { stars: 5 });
  assert.equal(r2.visibleNow, true);

  const page = await call('GET', `/workers/${w.user.id}`);
  assert.equal(page.reviews.length, 1);
  assert.equal(page.worker.reliability.isNew, true); // fewer than 5 jobs

  // Dispute, response, ruling with a strike.
  const d = await call('POST', `/jobs/${job.id}/disputes`, c.token, { type: 'scope', text: 'Fan still wobbles' });
  await call('POST', `/disputes/${d.dispute.id}/statements`, w.token, { text: 'Wobble is the ceiling hook, not in scope' });
  const queue = await call('GET', '/disputes', admin.token);
  assert.equal(queue.disputes[0].record.total, 3900);
  const ruling = await call('POST', `/disputes/${d.dispute.id}/ruling`, admin.token, { outcome: 'upheld', againstId: c.user.id, note: 'Scope in agreement excludes hook' });
  assert.equal(ruling.strike.status, 'warning');
});

test('requests can be declined, and only the assigned worker can answer', opts, async () => {
  const c = await call('POST', '/auth/login', null, { phone: '03001111111', password: 'secret1' });
  const other = await call('POST', '/auth/register', null, {
    role: 'worker', name: 'Other', phone: '03119999999', password: 'secret1', area: 'pechs',
    workerProfile: { skills: ['electrician'], areasServed: ['pechs'] },
  });
  const w = await call('POST', '/auth/login', null, { phone: '03111111111', password: 'secret1' });
  const { job } = await call('POST', '/jobs', c.token, {
    workerId: w.user.id, category: 'electrician', description: 'Socket sparks', area: 'pechs', address: 'House 1',
  });
  await call('POST', `/jobs/${job.id}/accept`, other.token, null, 403);
  const res = await call('POST', `/jobs/${job.id}/decline`, w.token);
  assert.equal(res.status, 'declined');
});

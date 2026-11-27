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
import Otp from '../src/models/Otp.js';
import Photo from '../src/models/Photo.js';

const uri = process.env.TEST_MONGO_URI;
const opts = { skip: !uri && 'set TEST_MONGO_URI to run' };

let server;
let base;

before(async () => {
  if (!uri) return;
  await mongoose.connect(uri);
  await Promise.all([User, Job, Review, Dispute, Vouch, Report, Otp, Photo].map((m) => m.deleteMany({})));
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

// Sign up through the code screens (demo mode returns the code), as either app does.
async function signUp(phone, body) {
  const sent = await call('POST', '/auth/otp/request', null, { phone, channel: 'sms', app: body.role });
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone, code: sent.demoCode });
  return call('POST', '/auth/register', null, { ...body, ticket, pin: body.pin || '1111' });
}

test('a direct job goes from request to rating, then a dispute is ruled', opts, async () => {
  // Customer signs up: number -> code (demo mode returns it) -> name + PIN.
  const check = await call('POST', '/auth/phone', null, { phone: '0300-1111111' });
  assert.equal(check.registered, false);
  const sent = await call('POST', '/auth/otp/request', null, { phone: '03001111111', channel: 'whatsapp' });
  assert.equal(sent.demoCode, '1234');
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone: '03001111111', code: sent.demoCode });
  const c = await call('POST', '/auth/register', null, { role: 'customer', ticket, name: 'Sana', pin: '4321', area: 'pechs' });
  const w = await signUp('03111111111', {
    role: 'worker', name: 'Rashid', pin: '2580',
    workerProfile: { skills: ['electrician'], areasServed: ['pechs'], priceMin: 800, priceMax: 5000, gender: 'male' },
  });
  assert.equal(w.user.area, 'pechs');
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
  const tinyJpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');
  const bill = await call('POST', '/photos', w.token, { data: tinyJpeg });
  assert.match(bill.url, /^\/api\/photos\/[a-f0-9]{32}$/);
  const img = await fetch(base.replace('/api', '') + bill.url);
  assert.equal(img.headers.get('content-type'), 'image/jpeg');
  await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'part', amount: 900, billPhotoUrl: 'not-a-photo' }, 400);
  const part = await call('POST', `/jobs/${job.id}/agreement`, w.token, { kind: 'part', amount: 900, billPhotoUrl: bill.url });
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
  const seen = await call('GET', `/jobs/${job.id}`, w.token);
  assert.equal(seen.job.dispute.openedByMe, false);
  assert.deepEqual(seen.job.dispute.statements.map((x) => x.mine), [false, true]);

  // The worker's earnings screen counts the cash they confirmed.
  const sum = await call('GET', '/workers/me/summary?period=month', w.token);
  assert.equal(sum.cash, 3900);
  assert.equal(sum.jobs, 1);
  assert.equal(sum.vouch.ok, false);
  const queue = await call('GET', '/disputes', admin.token);
  assert.equal(queue.disputes[0].record.total, 3900);
  const ruling = await call('POST', `/disputes/${d.dispute.id}/ruling`, admin.token, { outcome: 'upheld', againstId: c.user.id, note: 'Scope in agreement excludes hook' });
  assert.equal(ruling.strike.status, 'warning');
});

test('requests can be declined, and only the assigned worker can answer', opts, async () => {
  const c = await call('POST', '/auth/login', null, { phone: '03001111111', pin: '4321' });
  const other = await signUp('03119999999', {
    role: 'worker', name: 'Other',
    workerProfile: { skills: ['electrician'], areasServed: ['pechs'] },
    assistedBy: { name: 'Bismillah Hardware', phone: '0321 5555555', relation: 'shop' },
  });
  assert.equal((await User.findById(other.user.id)).assistedBy.relation, 'shop');
  const w = await call('POST', '/auth/login', null, { phone: '03111111111', pin: '2580', app: 'worker' });
  const { job } = await call('POST', '/jobs', c.token, {
    workerId: w.user.id, category: 'electrician', description: 'Socket sparks', area: 'pechs', address: 'House 1',
  });
  await call('POST', `/jobs/${job.id}/accept`, other.token, null, 403);
  const res = await call('POST', `/jobs/${job.id}/decline`, w.token);
  assert.equal(res.status, 'declined');
});

test('sign-up codes: wrong code, then right code; ticket needed to register', opts, async () => {
  await call('POST', '/auth/register', null, { role: 'customer', ticket: 'made-up', name: 'X', pin: '1111' }, 401);
  await call('POST', '/auth/otp/request', null, { phone: '03004444444', channel: 'sms' });
  await call('POST', '/auth/otp/request', null, { phone: '03004444444', channel: 'sms' }, 429); // too soon
  const wrong = await call('POST', '/auth/otp/verify', null, { phone: '03004444444', code: '0000' }, 400);
  assert.equal(wrong.code, 'otp_wrong');
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone: '03004444444', code: '1234' });
  await call('POST', '/auth/otp/verify', null, { phone: '03004444444', code: '1234' }, 400); // a code works once
  await call('POST', '/auth/register', null, { role: 'customer', ticket, name: 'Ayesha', pin: '12a4' }, 400);
  const a = await call('POST', '/auth/register', null, { role: 'customer', ticket, name: 'Ayesha', pin: '2468' }, 201);
  assert.equal(a.user.phone, '03004444444');
  await call('POST', '/auth/otp/request', null, { phone: '03004444444', channel: 'sms' }, 409); // already signed up
});

test('5 wrong PINs lock the number; a reset code sets a new PIN', opts, async () => {
  for (let i = 1; i <= 4; i += 1) {
    const r = await call('POST', '/auth/login', null, { phone: '03004444444', pin: '0000' }, 401);
    assert.equal(r.triesLeft, 5 - i);
  }
  const locked = await call('POST', '/auth/login', null, { phone: '03004444444', pin: '0000' }, 423);
  assert.equal(locked.code, 'pin_locked');
  await call('POST', '/auth/login', null, { phone: '03004444444', pin: '2468' }, 423); // even the right PIN waits

  await call('POST', '/auth/otp/request', null, { phone: '03004444444', channel: 'whatsapp', purpose: 'reset' });
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone: '03004444444', purpose: 'reset', code: '1234' });
  await call('POST', '/auth/pin/reset', null, { ticket, pin: '1357' });
  await call('POST', '/auth/login', null, { phone: '03004444444', pin: '1357' });
});

test('each number only works in its own app', opts, async () => {
  const asWorker = await call('POST', '/auth/phone', null, { phone: '03001111111', app: 'worker' }, 409);
  assert.equal(asWorker.code, 'wrong_app');
  assert.equal(asWorker.role, 'customer');
  const asCustomer = await call('POST', '/auth/login', null, { phone: '03111111111', pin: '2580', app: 'customer' }, 409);
  assert.equal(asCustomer.code, 'wrong_app');
  await call('POST', '/auth/otp/request', null, { phone: '03111111111', channel: 'sms', purpose: 'reset', app: 'customer' }, 409);
  // A worker needs at least one service and one area.
  const sent = await call('POST', '/auth/otp/request', null, { phone: '03118888888', channel: 'sms', app: 'worker' });
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone: '03118888888', code: sent.demoCode });
  const bad = await call('POST', '/auth/register', null, { role: 'worker', ticket, name: 'N', pin: '1111', workerProfile: { areasServed: ['pechs'] } }, 400);
  assert.equal(bad.code, 'no_skills');
});

test('experienced workers vouch for others by phone number', opts, async () => {
  const w = await call('POST', '/auth/login', null, { phone: '03111111111', pin: '2580' });
  const notYet = await call('POST', '/vouches', w.token, { phone: '03119999999' }, 403);
  assert.equal(notYet.code, 'vouch_not_allowed');
  await User.updateOne({ phone: '03111111111' }, { 'stats.jobsCompleted': 12, 'stats.jobsAccepted': 12 });
  await call('POST', '/vouches', w.token, { phone: '03009999999' }, 404);
  const ok = await call('POST', '/vouches', w.token, { phone: '0311 9999999' }, 201);
  assert.equal(ok.worker.name, 'Other');
  const sum = await call('GET', '/workers/me/summary', w.token);
  assert.equal(sum.vouch.left, 2);
  assert.deepEqual(sum.vouch.people.map((p) => p.name), ['Other']);
});

test('posted jobs: workers nearby send prices, the customer picks one', opts, async () => {
  const c = await call('POST', '/auth/login', null, { phone: '03001111111', pin: '4321' });
  const w = await call('POST', '/auth/login', null, { phone: '03111111111', pin: '2580' });
  const other = await call('POST', '/auth/login', null, { phone: '03119999999', pin: '1111' });
  const { job } = await call('POST', '/jobs', c.token, {
    mode: 'quotes', category: 'electrician', description: 'Light or switch', area: 'pechs', address: 'House 9',
  });
  const near = await call('GET', '/jobs/open', w.token);
  const seen = near.jobs.find((j) => j.id === job.id);
  assert.ok(seen && !seen.alreadyQuoted);
  const asWorker = await call('GET', `/jobs/${job.id}`, w.token);
  assert.equal(asWorker.job.address, undefined); // no address until picked
  await call('POST', `/jobs/${job.id}/quotes`, w.token, { amount: 0 }, 400);
  await call('POST', `/jobs/${job.id}/quotes`, w.token, { amount: 1500, note: 'Includes a new switch' });
  await call('POST', `/jobs/${job.id}/quotes`, w.token, { amount: 1400 }, 409); // one price each
  await call('POST', `/jobs/${job.id}/quotes`, other.token, { amount: 1300 });

  const view = await call('GET', `/jobs/${job.id}`, c.token);
  assert.equal(view.job.quotes.length, 2);
  assert.equal(view.job.quotes[0].worker.phone, undefined); // no numbers before picking
  const pick = view.job.quotes.find((q) => q.amount === 1500);
  const res = await call('POST', `/jobs/${job.id}/quotes/${pick.id}/pick`, c.token);
  assert.equal(res.status, 'agreed');
  const after = await call('GET', `/jobs/${job.id}`, w.token);
  assert.equal(after.job.total, 1500);
  assert.equal(after.job.address, 'House 9');
  const otherBids = await call('GET', '/jobs/bids', other.token);
  assert.equal(otherBids.bids.find((b) => b.id === job.id).outcome, 'lost');
  const myBids = await call('GET', '/jobs/bids', w.token);
  assert.equal(myBids.bids.find((b) => b.id === job.id).outcome, 'won');
});

test('settings: change PIN, change number, save details, close account', opts, async () => {
  const c = await call('POST', '/auth/login', null, { phone: '03004444444', pin: '1357' });
  await call('POST', '/auth/pin/change', c.token, { pin: '0000', newPin: '9999' }, 401);
  await call('POST', '/auth/pin/change', c.token, { pin: '1357', newPin: '9999' });
  await call('POST', '/auth/login', null, { phone: '03004444444', pin: '9999' });

  const saved = await call('PATCH', '/users/me', c.token, { name: 'Ayesha K', area: 'dha', address: 'Flat 2, Street 1' });
  assert.equal(saved.user.address, 'Flat 2, Street 1');

  // moving to a new number: the code goes to the new number, which must be free
  await call('POST', '/auth/otp/request', null, { phone: '03001111111', channel: 'sms', purpose: 'change' }, 409);
  const sent = await call('POST', '/auth/otp/request', null, { phone: '03005555555', channel: 'sms', purpose: 'change' });
  const { ticket } = await call('POST', '/auth/otp/verify', null, { phone: '03005555555', purpose: 'change', code: sent.demoCode });
  const moved = await call('POST', '/auth/phone/change', c.token, { ticket });
  assert.equal(moved.phone, '03005555555');
  await call('POST', '/auth/login', null, { phone: '03005555555', pin: '9999' });

  await call('POST', '/auth/close', c.token, { pin: '1111' }, 401);
  await call('POST', '/auth/close', c.token, { pin: '9999' });
  const closed = await call('POST', '/auth/login', null, { phone: '03005555555', pin: '9999' }, 403);
  assert.equal(closed.code, 'account_closed');
  await call('GET', '/auth/me', c.token, null, 403);
});

test("you can't close an account in the middle of a job", opts, async () => {
  const c = await call('POST', '/auth/login', null, { phone: '03001111111', pin: '4321' });
  const w = await call('POST', '/auth/login', null, { phone: '03111111111', pin: '2580' });
  const { job } = await call('POST', '/jobs', c.token, { workerId: w.user.id, category: 'electrician', description: 'Fan', area: 'pechs', address: 'House 1' });
  await call('POST', `/jobs/${job.id}/accept`, w.token);
  const blocked = await call('POST', '/auth/close', w.token, { pin: '2580' }, 409);
  assert.equal(blocked.code, 'active_jobs');
});

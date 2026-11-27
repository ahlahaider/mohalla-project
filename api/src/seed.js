// Fills the database with demo data so every screen of both apps has something
// to show: every service in every area, customers and workers with jobs in every
// state, ratings, posted jobs with prices, problem reports, vouches.
// Run with: npm run seed   (WARNING: wipes the existing data first)
// The list of accounts to log in with: npm run demo:accounts  (or DEMO-DATA.md)
//
// Time-limited things (requests expire after 4 hours, posted jobs after 24) are
// set from the moment you seed, so seed again shortly before testing or presenting.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import User from './models/User.js';
import Job from './models/Job.js';
import Otp from './models/Otp.js';
import Photo from './models/Photo.js';
import { Review, Dispute, Vouch, Report } from './models/others.js';
import { AREAS, daysAgo, hoursFromNow } from './lib/rules.js';
import {
  PIN, ADMIN, SERVICE, LEVELS, CUSTOMERS, ADDRESS, PRAISE, COMPLAINTS, ABOUT_CUSTOMER, workers as workerRoster,
} from './demoData.js';

// ---------- small helpers ----------
const roundTo = (n, step = 100) => Math.round(n / step) * step;
const neighbours = (area) => [area, ...(AREAS[area] || [])];

// A time slot in the next few days (morning 10, afternoon 14, evening 17), never in the past.
function slot(i) {
  const options = [[0, 10], [0, 14], [0, 17], [1, 10], [1, 14], [1, 17], [2, 10]];
  const [day, hour] = options[i % options.length];
  const d = new Date();
  d.setDate(d.getDate() + day);
  d.setHours(hour, 0, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d;
}
const pastSlot = (daysBack) => { const d = daysAgo(daysBack); d.setHours(11, 0, 0, 0); return d; };
const describe = (cat, i) => `${SERVICE[cat].problems[i % 4]}. ${SERVICE[cat].details[i % 4]}`;
const quoteAmount = (cat, i) => roundTo(SERVICE[cat].price * (1.3 + (i % 5) * 0.35));

await mongoose.connect(config.mongoUri);
await Promise.all([User, Job, Review, Dispute, Vouch, Report, Otp, Photo].map((m) => m.deleteMany({})));
const [pinHash, adminHash] = await Promise.all([bcrypt.hash(PIN, 10), bcrypt.hash(ADMIN.password, 10)]);

// ---------- people ----------
await User.create({ role: 'admin', name: ADMIN.name, phone: ADMIN.phone, passwordHash: adminHash, area: 'pechs' });

const customers = await User.insertMany(CUSTOMERS.map((c, i) => ({
  role: 'customer', name: c.name, phone: c.phone, passwordHash: pinHash, area: c.area, language: c.language || 'en',
  address: i % 2 === 0 ? ADDRESS[c.area] : undefined, // half have a saved address (fills the request form)
})));

const roster = workerRoster();
const workers = await User.insertMany(roster.map((w, i) => {
  const L = LEVELS[w.level];
  const skill = w.skills[0];
  const completed = L.completed + (L.completed ? i % 4 : 0);
  return {
    role: 'worker', name: w.name, phone: w.phone, passwordHash: pinHash, area: w.areas[0],
    language: i % 3 === 0 ? 'roman-ur' : 'en',
    badges: { verified: w.level <= 3, founding: Boolean(w.founding) },
    stats: {
      jobsCompleted: completed,
      jobsAccepted: completed + (completed ? 1 + (i % 2) : 0),
      onTimeAsked: completed,
      onTimeYes: Math.round(completed * (0.86 + (i % 3) * 0.05)),
    },
    workerProfile: {
      skills: w.skills, areasServed: w.areas, gender: w.gender,
      priceMin: roundTo(SERVICE[skill].price + w.level * 100 - (i % 3) * 100),
      priceMax: SERVICE[skill].price * 6,
      availableToday: w.level % 3 !== 2,
      bio: SERVICE[skill].bio,
    },
  };
}));
const byPhone = (p) => [...customers, ...workers].find((u) => u.phone === p);

// The customers who live where a worker works (or next door), taken in turn so
// jobs spread across everyone instead of piling on one person.
const turn = new Map();
function customerFor(worker) {
  const areas = new Set(worker.workerProfile.areasServed.flatMap(neighbours));
  const near = customers.filter((c) => areas.has(c.area));
  const list = near.length ? near : customers;
  const key = worker._id.toString();
  const n = turn.get(key) || 0;
  turn.set(key, n + 1);
  return list[(n + workers.indexOf(worker)) % list.length]; // each worker starts at a different customer
}

// ---------- jobs ----------
const jobs = [];
const reviews = [];
const base = (customer, worker, cat, i, extra) => ({
  _id: new mongoose.Types.ObjectId(), customer: customer._id, worker: worker?._id, mode: 'direct', category: cat,
  description: describe(cat, i), area: customer.area, address: ADDRESS[customer.area], quotes: [], agreement: [], ...extra,
});
const entry = (kind, amount, status, hoursBack, scope) => ({
  kind, amount, scope, status, proposedAt: hoursFromNow(-hoursBack - 1), decidedAt: status === 'proposed' ? undefined : hoursFromNow(-hoursBack),
});

// A finished job with both ratings (what builds up workers' ratings and earnings).
function finishedJob(customer, worker, cat, i, daysBack, stars) {
  const amount = quoteAmount(cat, i);
  const agreement = [
    ...(i % 2 === 0 ? [{ kind: 'visit', amount: 300 + (i % 3) * 100 }] : []),
    { kind: 'quote', amount, scope: SERVICE[cat].quoteScope },
    ...(i % 3 === 0 ? [{ kind: 'amendment', amount: 500, scope: 'One more point fixed' }] : []),
  ].map((e) => ({ ...e, status: 'accepted', proposedAt: daysAgo(daysBack + 0.2), decidedAt: daysAgo(daysBack + 0.1) }));
  const total = agreement.reduce((s, e) => s + e.amount, 0);
  const job = base(customer, worker, cat, i, {
    status: 'completed', preferredTime: pastSlot(daysBack), acceptedAt: daysAgo(daysBack + 0.3), completedAt: daysAgo(daysBack),
    onTime: stars >= 4, agreement, payment: { workerAmount: total, customerAmount: total, matched: true },
  });
  jobs.push(job);
  reviews.push(
    { job: job._id, from: customer._id, to: worker._id, stars, comment: stars >= 4 ? PRAISE[i % PRAISE.length] : COMPLAINTS[i % COMPLAINTS.length], visibleAt: daysAgo(daysBack) },
    { job: job._id, from: worker._id, to: customer._id, stars: 5 - (i % 5 === 4 ? 1 : 0), comment: ABOUT_CUSTOMER[i % ABOUT_CUSTOMER.length], visibleAt: daysAgo(daysBack) },
  );
  return job;
}

const FINISHED_BY_LEVEL = [5, 4, 3, 2, 1, 0];
const DAYS_BACK = [1, 3, 6, 12, 25];
workers.forEach((w, wi) => {
  const level = roster[wi].level;
  const cat = w.workerProfile.skills[0];

  // past jobs, with ratings: experienced workers mostly 5 and 4 stars
  for (let k = 0; k < FINISHED_BY_LEVEL[level]; k += 1) {
    const stars = level <= 2 ? (k % 3 === 2 ? 4 : 5) : (k % 2 ? 3 : 4);
    finishedJob(customerFor(w), w, cat, wi + k, DAYS_BACK[k] + (wi % 3) * 0.3, stars);
  }

  // every worker has one new request waiting (expires in 1–4 hours, like the real rule)
  const asker = customerFor(w);
  jobs.push(base(asker, w, cat, wi + 1, { status: 'requested', preferredTime: slot(wi), expiresAt: hoursFromNow(1.2 + (wi % 3) * 0.9) }));

  // and one job in progress, so both sides see every step
  const c = customerFor(w);
  const q = quoteAmount(cat, wi);
  const common = { preferredTime: slot(wi + 3), acceptedAt: hoursFromNow(-6) };
  if (level <= 3) {
    switch (wi % 5) {
      case 0: // customer has a price to agree (visit agreed, full price waiting)
        jobs.push(base(c, w, cat, wi + 2, { ...common, status: 'accepted', agreement: [entry('visit', 500, 'accepted', 4), entry('quote', q, 'proposed', 1, SERVICE[cat].quoteScope)] }));
        break;
      case 1: // price agreed, worker asked for extra work: customer must OK it
        jobs.push(base(c, w, cat, wi + 2, { ...common, status: 'agreed', agreement: [entry('quote', q, 'accepted', 5, SERVICE[cat].quoteScope), entry('amendment', 600, 'proposed', 1, 'Second point also needs fixing')] }));
        break;
      case 2: // work done: customer paid and must rate; worker must confirm the cash
        jobs.push(base(c, w, cat, wi + 2, {
          ...common, status: 'completed', completedAt: hoursFromNow(-3), onTime: true,
          agreement: [entry('quote', q, 'accepted', 26, SERVICE[cat].quoteScope)], payment: { customerAmount: q },
        }));
        break;
      case 3: // worker said yes; worker's turn to send a price
        jobs.push(base(c, w, cat, wi + 2, { ...common, status: 'accepted' }));
        break;
      default: // price agreed, work going on: customer can press "Is the work finished?"
        jobs.push(base(c, w, cat, wi + 2, { ...common, status: 'agreed', agreement: [entry('visit', 400, 'accepted', 8), entry('quote', q, 'accepted', 6, SERVICE[cat].quoteScope)] }));
    }
  } else if (level === 4) {
    jobs.push(base(c, w, cat, wi + 2, { status: 'declined', preferredTime: pastSlot(2) })); // "said no"
  } else {
    jobs.push(base(c, w, cat, wi + 2, { status: 'expired', preferredTime: pastSlot(1), expiresAt: daysAgo(1) })); // never answered
  }
  if (level === 3) jobs.push(base(customerFor(w), w, cat, wi + 3, { status: 'cancelled', preferredTime: pastSlot(4), cancelledBy: c._id }));
});

// ---------- posted jobs ("let workers send prices") ----------
const workersFor = (cat, area) => workers.filter((w) => w.workerProfile.skills.includes(cat) && w.workerProfile.areasServed.includes(area));
Object.keys(SERVICE).forEach((cat, ci) => {
  // one with no prices yet (workers there see it under "Near you"), one with prices to pick from
  const fresh = cat === 'electrician' ? byPhone('03003333333') : customers[(ci * 2) % customers.length];
  jobs.push(base(fresh, null, cat, ci, { mode: 'quotes', status: 'open', preferredTime: slot(ci), expiresAt: hoursFromNow(20 - ci) }));

  const asker = cat === 'plumber' ? byPhone('03001111111') : customers[(ci * 2 + 1) % customers.length];
  const bidders = workersFor(cat, asker.area).slice(0, 3);
  jobs.push(base(asker, null, cat, ci + 1, {
    mode: 'quotes', status: 'open', preferredTime: slot(ci + 2), expiresAt: hoursFromNow(18 - ci),
    quotes: bidders.map((w, k) => ({ worker: w._id, amount: quoteAmount(cat, ci + k * 2), note: k === 0 ? 'Price includes parts' : k === 1 ? 'Can come today' : undefined, createdAt: hoursFromNow(-2 - k) })),
  }));
});
// a posted job where the customer already picked someone (shows "You picked Ahmed")
{
  const saad = byPhone('03013333333');
  const ahmed = byPhone('03261111111');
  const amount = 9000;
  jobs.push(base(saad, ahmed, 'painter', 1, {
    mode: 'quotes', status: 'agreed', preferredTime: slot(4), acceptedAt: hoursFromNow(-5),
    quotes: [{ worker: ahmed._id, amount, note: 'Putty, primer and 2 coats', createdAt: hoursFromNow(-9) }],
    agreement: [entry('quote', amount, 'accepted', 5, 'Putty, primer and 2 coats')],
  }));
}

// ---------- problem reports (disputes) ----------
const disputes = [];
{
  // 1 · customer Bilal says the AC still isn't cooling: Faisal (worker) should answer
  const bilal = byPhone('03002222222');
  const faisal = byPhone('03271111111');
  const job = finishedJob(bilal, faisal, 'ac-technician', 7, 1, 2);
  disputes.push({
    job: job._id, openedBy: bilal._id, against: faisal._id, type: 'scope', respondBy: hoursFromNow(36), createdAt: hoursFromNow(-12),
    statements: [{ by: bilal._id, text: 'Paid for a full service but the AC is still not cooling the next day.', at: hoursFromNow(-12) }],
  });
  // 2 · worker Javed says customer Saad paid less: Saad (customer) should answer
  const saad = byPhone('03013333333');
  const javed = byPhone('03201111111');
  const total = 2400;
  const job2 = base(saad, javed, 'plumber', 3, {
    status: 'completed', preferredTime: pastSlot(1), acceptedAt: daysAgo(1.2), completedAt: daysAgo(0.6), onTime: true,
    agreement: [entry('quote', 1900, 'accepted', 30, 'Change waste pipe'), entry('amendment', 500, 'accepted', 28, 'New trap')],
    payment: { workerAmount: 1900, customerAmount: total, matched: false },
  });
  jobs.push(job2);
  disputes.push({
    job: job2._id, openedBy: javed._id, against: saad._id, type: 'non-payment', respondBy: hoursFromNow(40), createdAt: hoursFromNow(-8),
    statements: [{ by: javed._id, text: 'The extra Rs 500 for the new trap was agreed in the app but I only got Rs 1,900.', at: hoursFromNow(-8) }],
  });
  // 3 · already decided: Naveed (new mechanic) didn't come; upheld, so he has a warning
  const hina = byPhone('03012222222');
  const naveed = byPhone('03118888888');
  const job3 = base(hina, naveed, 'mechanic', 0, { status: 'cancelled', preferredTime: pastSlot(10), acceptedAt: daysAgo(10.5), cancelledBy: hina._id });
  jobs.push(job3);
  const ruled = new mongoose.Types.ObjectId();
  disputes.push({
    _id: ruled, job: job3._id, openedBy: hina._id, against: naveed._id, type: 'no-show', status: 'upheld', createdAt: daysAgo(10),
    statements: [{ by: hina._id, text: 'Said yes and never came. Did not answer calls.', at: daysAgo(10) }],
    ruling: { against: naveed._id, note: 'Accepted the job, no visit or call recorded.', at: daysAgo(8) },
  });
  await User.updateOne({ _id: naveed._id }, { $push: { strikes: { reason: 'no-show', dispute: ruled, at: daysAgo(8) } } });
}

await Job.insertMany(jobs);
await Review.insertMany(reviews);
await Dispute.insertMany(disputes);

// customers' counts follow from their finished jobs ("18/18 paid in full" on worker screens)
for (const c of customers) {
  const done = jobs.filter((j) => j.customer.equals(c._id) && j.status === 'completed');
  await User.updateOne({ _id: c._id }, { 'stats.jobsCompleted': done.length, 'stats.paidOnRecord': done.filter((j) => j.payment?.matched).length });
}

// ---------- vouches and a report ----------
const vouches = [
  ['03111111111', '03116666666'], ['03112222222', '03113333333'], ['03111111111', '03115555555'],
  ...Object.keys(SERVICE).map((cat, ci) => [`03${20 + ci}1111111`, `03${20 + ci}5555555`]), // each service's most experienced vouches for a newcomer
];
// (phone prefixes follow CATEGORIES order in rules.js; skip any pair that doesn't resolve)
await Vouch.insertMany(vouches.map(([a, b]) => [byPhone(a), byPhone(b)]).filter(([a, b]) => a && b && !a._id.equals(b._id)).map(([a, b]) => ({ from: a._id, to: b._id })));
await Report.create({ from: byPhone('03005555555')._id, against: byPhone('03241111111')._id, reason: 'Asked for extra cash outside the app.' });

const count = (s) => jobs.filter((j) => j.status === s).length;
console.log(`Seeded ${customers.length} customers, ${workers.length} workers, ${jobs.length} jobs (${count('requested')} new requests, ${count('open')} posted jobs taking prices), ${reviews.length} ratings, ${disputes.length} problem reports.`);
console.log(`Everyone logs in with PIN ${PIN} (admin: ${ADMIN.phone}, password "${ADMIN.password}"). Run "npm run demo:accounts" for the list.`);
await mongoose.disconnect();

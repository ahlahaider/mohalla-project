// Fills the database with realistic demo data so search and worker pages
// aren't empty during development and the presentation.
// Run with: npm run seed   (WARNING: wipes the existing data first)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import User from './models/User.js';
import Job from './models/Job.js';
import { Review, Dispute, Vouch, Report } from './models/others.js';
import { daysAgo, hoursFromNow } from './lib/rules.js';

const PASSWORD = 'password123'; // admin only
const PIN = '1234';             // customers and workers log in with number + PIN

await mongoose.connect(config.mongoUri);
await Promise.all([User, Job, Review, Dispute, Vouch, Report].map((m) => m.deleteMany({})));
const passwordHash = await bcrypt.hash(PASSWORD, 10);
const pinHash = await bcrypt.hash(PIN, 10);

const user = (fields) => User.create({ passwordHash, ...fields });

const admin = await user({ role: 'admin', name: 'Mohalla Admin', phone: '03000000000', area: 'pechs' });
const sana = await user({ passwordHash: pinHash, role: 'customer', name: 'Sana Qureshi', phone: '03001111111', area: 'gulshan-e-iqbal' });
const bilal = await user({ passwordHash: pinHash, role: 'customer', name: 'Bilal Ahmed', phone: '03002222222', area: 'dha', language: 'roman-ur' });
const khadija = await user({ passwordHash: pinHash, role: 'customer', name: 'Khadija Khan', phone: '03003333333', area: 'pechs' });

// [name, phone, skills, areas, priceMin, priceMax, gender, founding, verified, completed, accepted, onTimeYes]
const workerRows = [
  ['Rashid Electric Works', '03111111111', ['electrician'], ['pechs', 'bahadurabad'], 800, 5000, 'male', true, true, 62, 64, 58],
  ['Imran Plumbing Services', '03112222222', ['plumber'], ['gulshan-e-iqbal', 'gulistan-e-jauhar'], 1000, 6000, 'male', true, true, 41, 43, 39],
  ['Shabana Bibi', '03113333333', ['cleaner'], ['gulshan-e-iqbal', 'pechs'], 1500, 3500, 'female', false, true, 18, 19, 17],
  ['Kausar Home Cleaning', '03114444444', ['cleaner'], ['dha', 'clifton'], 2000, 5000, 'female', true, true, 35, 36, 33],
  ['Asif Carpenter', '03115555555', ['carpenter'], ['north-nazimabad', 'nazimabad'], 1200, 8000, 'male', false, false, 3, 3, 3],
  ['Zeeshan AC Repair', '03116666666', ['ac-technician', 'electrician'], ['dha', 'korangi'], 1500, 9000, 'male', false, true, 12, 13, 11],
  ['Pak Fumigation Co.', '03117777777', ['fumigator'], ['saddar', 'clifton', 'pechs'], 3000, 12000, 'unspecified', true, true, 80, 81, 77],
  ['Naveed Auto Mechanic', '03118888888', ['mechanic'], ['malir', 'korangi'], 500, 7000, 'male', false, false, 0, 0, 0],
];

const workers = [];
for (const [name, phone, skills, areasServed, priceMin, priceMax, gender, founding, verified, completed, accepted, onTimeYes] of workerRows) {
  workers.push(await user({
    passwordHash: pinHash, role: 'worker', name, phone, area: areasServed[0],
    badges: { founding, verified },
    stats: { jobsCompleted: completed, jobsAccepted: accepted, onTimeAsked: completed, onTimeYes },
    workerProfile: { skills, areasServed, priceMin, priceMax, gender, availableToday: completed % 2 === 0, bio: `${skills.join(' and ')} in ${areasServed.join(', ')}` },
  }));
}
const [rashid, imran, shabana, , asif, zeeshan] = workers;

// Founding businesses vouch for newer workers: the roots of the vouch network.
await Vouch.create({ from: rashid._id, to: zeeshan._id });
await Vouch.create({ from: imran._id, to: shabana._id });
await Vouch.create({ from: rashid._id, to: asif._id });

// A few finished jobs, so worker pages have reviews and the record has examples.
async function finishedJob(customer, worker, category, description, entries, stars, comment, back) {
  const job = await Job.create({
    customer: customer._id, worker: worker._id, mode: 'direct', category, description,
    area: customer.area, address: 'House 12, Street 4', status: 'completed', onTime: true,
    completedAt: daysAgo(back), agreement: entries.map((e) => ({ ...e, status: 'accepted', decidedAt: daysAgo(back) })),
    payment: { workerAmount: entries.reduce((s, e) => s + e.amount, 0), customerAmount: entries.reduce((s, e) => s + e.amount, 0), matched: true },
  });
  await Review.create({ job: job._id, from: customer._id, to: worker._id, stars, comment, visibleAt: daysAgo(back) });
  await Review.create({ job: job._id, from: worker._id, to: customer._id, stars: 5, comment: 'Paid on time, clear instructions', visibleAt: daysAgo(back) });
  return job;
}

await finishedJob(sana, rashid, 'electrician', 'Two fans not working, DB tripping',
  [{ kind: 'visit', amount: 500 }, { kind: 'quote', amount: 2500, scope: 'Rewire DB, fix 2 fan regulators' }, { kind: 'part', amount: 900, scope: '2 regulators', billPhotoUrl: 'https://example.com/bill.jpg' }],
  5, 'Explained the problem before starting. Showed the bill for parts.', 10);
await finishedJob(sana, imran, 'plumber', 'Kitchen sink leaking under the cabinet',
  [{ kind: 'quote', amount: 1800, scope: 'Replace waste pipe and seal' }], 4, 'Fixed it, came 30 min late', 20);
await finishedJob(bilal, workers[3], 'cleaner', 'Deep clean before Eid guests',
  [{ kind: 'quote', amount: 4500, scope: '3 rooms, kitchen, 2 bathrooms' }], 5, 'Very thorough team', 5);

await Promise.all([sana, bilal].map((c) => User.updateOne({ _id: c._id }, { $inc: { 'stats.jobsCompleted': 2, 'stats.paidOnRecord': 2 } })));

// Jobs still in progress for Rashid, so the worker app's home screen has something on it.
const today = (h) => { const d = new Date(); d.setHours(h, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); return d; };
await Job.create({
  customer: sana._id, worker: rashid._id, mode: 'direct', category: 'electrician',
  description: 'Fan not working. The ceiling fan in the bedroom makes noise and stops.',
  area: 'gulshan-e-iqbal', address: 'House 12, Block 5, near the green mosque', preferredTime: today(10),
  status: 'requested', expiresAt: hoursFromNow(3),
});
await Job.create({
  customer: bilal._id, worker: rashid._id, mode: 'direct', category: 'electrician',
  description: 'Wiring. Lights flicker in the lounge.', area: 'dha', address: 'Flat 4, Khayaban-e-Ittehad',
  preferredTime: daysAgo(0), status: 'accepted', acceptedAt: daysAgo(0),
  agreement: [
    { kind: 'visit', amount: 500, status: 'accepted', decidedAt: daysAgo(0) },
    { kind: 'quote', amount: 2500, scope: 'Change 3 switches and loose wiring in the lounge', status: 'proposed' },
  ],
});
await Job.create({
  customer: khadija._id, worker: rashid._id, mode: 'direct', category: 'electrician',
  description: 'Switch board. Sparks from the kitchen switch board.', area: 'pechs', address: 'House 88, Block 2',
  preferredTime: daysAgo(1), status: 'completed', acceptedAt: daysAgo(1), completedAt: daysAgo(0), onTime: true,
  agreement: [
    { kind: 'quote', amount: 3000, scope: 'New kitchen switch board', status: 'accepted', decidedAt: daysAgo(1) },
    { kind: 'part', amount: 900, scope: 'Switch board', status: 'accepted', decidedAt: daysAgo(1) },
  ],
  payment: { customerAmount: 3900 },
});
await User.updateOne({ _id: rashid._id }, { $inc: { 'stats.jobsAccepted': 3 } });

console.log(`Seeded. Customers and workers log in with PIN ${PIN}; admin with password "${PASSWORD}".`);
console.log('Admin:     03000000000');
console.log('Customers: 03001111111 (Sana), 03002222222 (Bilal), 03003333333 (Khadija)');
console.log('Workers:   03111111111 (Rashid, electrician: has a new request), 03112222222 (Imran, plumber), 03113333333 (Shabana, cleaner) ...');
console.log(`Admin id: ${admin._id}`);
await mongoose.disconnect();

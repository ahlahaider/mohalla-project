// The heart of the app: a job's life from request to rating.
// Each route checks three things before changing anything:
//   1. who you are (customer or worker on THIS job),
//   2. what state the job is in (you can't complete a job nobody accepted),
//   3. that the input makes sense.
import { Router } from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { Review, Dispute } from '../models/others.js';
import { CATEGORIES } from '../lib/rules.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, httpError, isPhotoUrl, photoList } from '../lib/http.js';
import { visibleRatings } from '../lib/ratings.js';
import {
  AREAS, agreementTotal, canPropose, isExpired, requestExpiry, postExpiry, disputeWindowOpen,
  hoursFromNow, daysFromNow, reliability, RATING_REVEAL_DAYS, RESPONSE_WINDOW_HOURS,
} from '../lib/rules.js';

const router = Router();

// ---------- helpers ----------

const idOf = (x) => x?._id ?? x; // works whether a field is populated or not
const isCustomer = (job, user) => idOf(job.customer)?.equals(user._id);
const isWorker = (job, user) => Boolean(job.worker) && idOf(job.worker).equals(user._id);
const otherParty = (job, user) => (isCustomer(job, user) ? idOf(job.worker) : idOf(job.customer));

async function loadJob(id) {
  const job = await Job.findById(id);
  if (!job) throw httpError(404, 'Job not found');
  return job;
}

function requireParty(job, user) {
  if (!isCustomer(job, user) && !isWorker(job, user)) throw httpError(403, 'Not your job');
}

function requireStatus(job, ...statuses) {
  if (!statuses.includes(job.status)) throw httpError(409, `Not possible while the job is ${job.status}`);
}

// Requests nobody answered in time (and posted jobs nobody was picked for) are
// marked expired whenever jobs are listed. Simpler than a background timer.
const expireStale = () =>
  Job.updateMany({ status: { $in: ['requested', 'open'] }, expiresAt: { $lt: new Date() } }, { status: 'expired' });

// Contact details only appear once the worker has accepted: this protects the
// customer's address and stops people collecting numbers without a real job.
const CONTACT_VISIBLE = ['accepted', 'agreed', 'completed'];

async function jobView(job, user) {
  const iAmCustomer = isCustomer(job, user);
  const showContact = iAmCustomer || user.role === 'admin' || CONTACT_VISIBLE.includes(job.status);
  const person = (p) => p && {
    id: p._id, name: p.name, badges: p.badges, area: p.area, photoUrl: p.photoUrl,
    phone: showContact ? p.phone : undefined,
  };
  const me = user._id.toString();

  const quoteWorkers = iAmCustomer ? job.quotes.map((q) => idOf(q.worker)) : [];
  const ids = [idOf(job.customer), idOf(job.worker), ...quoteWorkers].filter(Boolean);
  const [ratings, dispute, myReview] = await Promise.all([
    visibleRatings(ids),
    Dispute.findOne({ job: job._id }).sort({ createdAt: -1 }),
    Review.exists({ job: job._id, from: user._id }),
  ]);

  return {
    id: job._id,
    mode: job.mode,
    status: job.status,
    myRole: iAmCustomer ? 'customer' : 'worker',
    category: job.category,
    description: job.description,
    area: job.area,
    address: showContact ? job.address : undefined,
    preferredTime: job.preferredTime,
    photos: job.photos || [],
    expiresAt: job.expiresAt,
    createdAt: job.createdAt,
    acceptedAt: job.acceptedAt,
    customer: { ...person(job.customer), rating: ratings.get(idOf(job.customer).toString()) || null,
      paidOnRecord: job.customer.stats?.paidOnRecord, jobsCompleted: job.customer.stats?.jobsCompleted },
    worker: job.worker ? { ...person(job.worker), rating: ratings.get(idOf(job.worker).toString()) || null } : null,
    // Posted jobs: the customer sees every worker's price; a worker only sees their own.
    quotes: iAmCustomer ? job.quotes.map((q) => ({
      id: q._id, amount: q.amount, note: q.note, at: q.createdAt,
      // No phone number here: contact details only open once the customer picks someone.
      worker: q.worker && {
        ...person(q.worker),
        phone: undefined,
        rating: ratings.get(idOf(q.worker).toString()) || null,
        reliability: reliability(q.worker.stats),
        gender: q.worker.workerProfile?.gender,
      },
    })) : undefined,
    myQuote: !iAmCustomer ? (() => { const q = job.quotes.find((x) => idOf(x.worker)?.equals(user._id)); return q ? { amount: q.amount, note: q.note } : null; })() : undefined,
    quotesCount: job.quotes.length,
    agreement: job.agreement,
    total: agreementTotal(job.agreement),
    payment: job.payment,
    onTime: job.onTime,
    completedAt: job.completedAt,
    reviewedByMe: Boolean(myReview),
    // A reported problem: both sides can read every statement and add theirs.
    dispute: dispute && {
      id: dispute._id, type: dispute.type, status: dispute.status, respondBy: dispute.respondBy,
      openedByMe: dispute.openedBy.toString() === me,
      statements: dispute.statements.map((st) => ({
        mine: st.by?.toString() === me, text: st.text, evidenceUrls: st.evidenceUrls, at: st.at,
      })),
      ruling: dispute.ruling?.at ? { againstMe: dispute.ruling.against?.toString() === me, note: dispute.ruling.note, at: dispute.ruling.at } : undefined,
    },
  };
}

// ---------- creating and listing ----------

// POST /api/jobs — customer sends a direct request, or posts a job for quotes.
router.post('/', requireAuth('customer'), asyncRoute(async (req, res) => {
  const { mode = 'direct', workerId, category, description, area, address, preferredTime } = req.body;
  const photos = photoList(req.body.photos, 3);
  if (!['direct', 'quotes'].includes(mode)) throw httpError(400, 'Unknown mode');
  if (!description?.trim() || !address?.trim()) throw httpError(400, 'Describe the problem and give an address');
  if (!AREAS[area]) throw httpError(400, 'Choose an area');

  const job = new Job({
    customer: req.user._id, mode, category, description, area, address, preferredTime, photos,
    status: mode === 'direct' ? 'requested' : 'open',
  });
  if (mode === 'quotes') {
    if (!CATEGORIES.includes(category)) throw httpError(400, 'Choose a service');
    job.expiresAt = postExpiry();
  }

  if (mode === 'direct') {
    const worker = await User.findOne({ _id: workerId, role: 'worker', status: 'active' });
    if (!worker) throw httpError(404, 'Worker not found');
    if (!worker.workerProfile?.skills?.includes(category)) throw httpError(400, "This worker doesn't offer that service");
    job.worker = worker._id;
    job.expiresAt = requestExpiry();
  }

  await job.save();
  res.status(201).json({ job: { id: job._id, status: job.status } });
}));

// GET /api/jobs/mine — the "My jobs" list for either role.
router.get('/mine', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  await expireStale();
  const filter = req.user.role === 'worker' ? { worker: req.user._id } : { customer: req.user._id };
  const jobs = await Job.find(filter).sort({ updatedAt: -1 }).populate('customer', 'name photoUrl').populate('worker', 'name photoUrl');
  const iAmWorker = req.user.role === 'worker';

  res.json({
    jobs: jobs.map((j) => ({
      id: j._id, status: j.status, mode: j.mode, category: j.category, description: j.description,
      area: j.area, preferredTime: j.preferredTime, updatedAt: j.updatedAt, expiresAt: j.expiresAt, completedAt: j.completedAt,
      customer: j.customer?.name, worker: j.worker?.name, total: agreementTotal(j.agreement),
      otherPhotoUrl: (iAmWorker ? j.customer : j.worker)?.photoUrl,
      quotesCount: j.quotes.length,
      waitingForCustomer: j.agreement.some((e) => e.status === 'proposed'),
      // The worker has said how much cash they got (the last step for them).
      cashConfirmed: j.payment?.workerAmount != null,
      // Something is waiting on me: a new request or cash to confirm (worker), or a proposal to decide (customer).
      needsMe: iAmWorker
        ? j.status === 'requested' || (j.status === 'completed' && j.payment?.workerAmount == null)
        : j.agreement.some((e) => e.status === 'proposed') || (j.status === 'open' && j.quotes.length > 0),
    })),
  });
}));

// GET /api/jobs/open — "Jobs near you": posted jobs for the worker's services in the
// areas they work in, still collecting prices. No address or phone until they're picked.
router.get('/open', requireAuth('worker'), asyncRoute(async (req, res) => {
  await expireStale();
  const p = req.user.workerProfile;
  const jobs = await Job.find({
    status: 'open', category: { $in: p.skills || [] }, area: { $in: p.areasServed || [] }, customer: { $ne: req.user._id },
  }).sort({ createdAt: -1 }).limit(50).populate('customer', 'name photoUrl stats');
  const ratings = await visibleRatings(jobs.map((j) => idOf(j.customer)).filter(Boolean));
  res.json({
    jobs: jobs.map((j) => {
      const mine = j.quotes.find((q) => q.worker.equals(req.user._id));
      return {
        id: j._id, category: j.category, description: j.description, area: j.area, preferredTime: j.preferredTime,
        photos: j.photos || [], createdAt: j.createdAt, expiresAt: j.expiresAt, quotesCount: j.quotes.length,
        customer: j.customer && {
          name: j.customer.name.split(' ')[0], photoUrl: j.customer.photoUrl,
          rating: ratings.get(j.customer._id.toString()) || null,
          jobsCompleted: j.customer.stats?.jobsCompleted || 0, paidOnRecord: j.customer.stats?.paidOnRecord || 0,
        },
        myQuote: mine ? { amount: mine.amount, note: mine.note } : null,
        alreadyQuoted: Boolean(mine),
      };
    }),
  });
}));

// GET /api/jobs/bids — the prices this worker sent, and what happened to each.
router.get('/bids', requireAuth('worker'), asyncRoute(async (req, res) => {
  await expireStale();
  const jobs = await Job.find({ mode: 'quotes', 'quotes.worker': req.user._id }).sort({ updatedAt: -1 }).limit(30);
  res.json({
    bids: jobs.map((j) => {
      const q = j.quotes.find((x) => x.worker.equals(req.user._id));
      let outcome = 'waiting';
      if (j.worker) outcome = j.worker.equals(req.user._id) ? 'won' : 'lost';
      else if (j.status !== 'open') outcome = 'closed'; // expired or cancelled before anyone was picked
      return {
        id: j._id, category: j.category, description: j.description, area: j.area, preferredTime: j.preferredTime,
        amount: q.amount, at: q.createdAt, outcome, quotesCount: j.quotes.length, expiresAt: j.expiresAt,
      };
    }),
  });
}));

// GET /api/jobs/:id — full job, with contact details only when allowed.
router.get('/:id', requireAuth(), asyncRoute(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('customer', 'name phone area badges stats photoUrl')
    .populate('worker', 'name phone area badges stats photoUrl')
    .populate('quotes.worker', 'name badges stats photoUrl area workerProfile');
  if (!job) throw httpError(404, 'Job not found');

  const isQuotingWorker = req.user.role === 'worker' && job.status === 'open';
  if (req.user.role !== 'admin' && !isQuotingWorker) requireParty(job, req.user);
  if (isExpired(job)) { job.status = 'expired'; await job.save(); }

  res.json({ job: await jobView(job, req.user) });
}));

// ---------- worker answers ----------

router.post('/:id/accept', requireAuth('worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!isWorker(job, req.user)) throw httpError(403, 'Not your request');
  if (isExpired(job)) {
    job.status = 'expired';
    await job.save();
    throw httpError(410, 'This request expired');
  }
  requireStatus(job, 'requested');

  job.status = 'accepted';
  job.acceptedAt = new Date();
  await job.save();
  await User.updateOne({ _id: req.user._id }, { $inc: { 'stats.jobsAccepted': 1 } });
  res.json({ status: job.status });
}));

router.post('/:id/decline', requireAuth('worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!isWorker(job, req.user)) throw httpError(403, 'Not your request');
  requireStatus(job, 'requested');
  job.status = 'declined';
  await job.save();
  res.json({ status: job.status });
}));

router.post('/:id/cancel', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  requireParty(job, req.user);
  requireStatus(job, 'open', 'requested', 'accepted', 'agreed');
  job.status = 'cancelled';
  job.cancelledBy = req.user._id;
  await job.save();
  res.json({ status: job.status });
}));

// ---------- posted jobs: quotes ----------

router.post('/:id/quotes', requireAuth('worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (isExpired(job)) { job.status = 'expired'; await job.save(); }
  if (job.status !== 'open') throw httpError(409, 'This job is not taking prices any more', { code: 'post_closed' });
  if (!req.user.workerProfile?.skills?.includes(job.category)) throw httpError(400, "You don't offer this service");
  if (job.quotes.some((q) => q.worker.equals(req.user._id))) throw httpError(409, 'You already sent a price for this job', { code: 'already_quoted' });

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Enter an amount in rupees', { code: 'bad_price' });

  job.quotes.push({ worker: req.user._id, amount, note: req.body.note?.trim().slice(0, 300) || undefined });
  await job.save();
  res.status(201).json({ quotes: job.quotes.length });
}));

router.post('/:id/quotes/:quoteId/pick', requireAuth('customer'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!isCustomer(job, req.user)) throw httpError(403, 'Not your job');
  requireStatus(job, 'open');
  const quote = job.quotes.id(req.params.quoteId);
  if (!quote) throw httpError(404, 'Quote not found');

  // Picking a price is agreeing to it: it goes on the record as the full work price,
  // so the job is "agreed" straight away. Anything extra later (parts, extra work)
  // still needs the customer's OK, exactly like a direct request.
  if (isExpired(job)) { job.status = 'expired'; await job.save(); throw httpError(410, 'This job stopped taking prices', { code: 'post_closed' }); }
  const now = new Date();
  job.worker = quote.worker;
  job.status = 'agreed';
  job.acceptedAt = now;
  job.expiresAt = undefined;
  job.agreement.push({ kind: 'quote', amount: quote.amount, scope: quote.note, status: 'accepted', proposedAt: quote.createdAt, decidedAt: now });
  await job.save();
  await User.updateOne({ _id: quote.worker }, { $inc: { 'stats.jobsAccepted': 1 } });
  res.json({ status: job.status });
}));

// ---------- the job agreement ----------

// POST /api/jobs/:id/agreement — worker proposes a visit charge, full quote,
// amendment (price/scope change) or part (with bill photo).
router.post('/:id/agreement', requireAuth('worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!isWorker(job, req.user)) throw httpError(403, 'Not your job');

  const { kind, scope, billPhotoUrl } = req.body;
  const amount = Number(req.body.amount);
  if (!['visit', 'quote', 'amendment', 'part'].includes(kind)) throw httpError(400, 'Unknown entry type');
  if (!Number.isFinite(amount) || amount < 0) throw httpError(400, 'Enter an amount in rupees');
  if (!canPropose(kind, job)) {
    throw httpError(409, kind === 'amendment' || kind === 'part'
      ? 'Changes and parts can be added once the full quote is accepted'
      : 'The full quote is already agreed; propose an amendment instead');
  }
  if (kind === 'part' && !isPhotoUrl(billPhotoUrl)) throw httpError(400, 'Add a photo of the bill for parts', { code: 'no_bill_photo' });
  if (billPhotoUrl && !isPhotoUrl(billPhotoUrl)) throw httpError(400, 'Unknown photo');

  job.agreement.push({ kind, amount, scope: scope?.trim().slice(0, 500) || undefined, billPhotoUrl });
  await job.save();
  res.status(201).json({ agreement: job.agreement, total: agreementTotal(job.agreement) });
}));

// POST /api/jobs/:id/agreement/:entryId/accept  (or /reject) — customer decides.
router.post('/:id/agreement/:entryId/:decision', requireAuth('customer'), asyncRoute(async (req, res) => {
  const { decision } = req.params;
  if (!['accept', 'reject'].includes(decision)) throw httpError(404, 'Unknown action');

  const job = await loadJob(req.params.id);
  if (!isCustomer(job, req.user)) throw httpError(403, 'Not your job');
  const entry = job.agreement.id(req.params.entryId);
  if (!entry) throw httpError(404, 'Entry not found');
  if (entry.status !== 'proposed') throw httpError(409, 'Already decided');

  entry.status = decision === 'accept' ? 'accepted' : 'rejected';
  entry.decidedAt = new Date();

  // Accepting the full quote means the job is agreed and work can start.
  if (entry.kind === 'quote' && entry.status === 'accepted') {
    job.status = 'agreed';
    // Any other pending visit/quote proposals are now out of date.
    job.agreement.forEach((e) => {
      if (e !== entry && e.status === 'proposed' && ['visit', 'quote'].includes(e.kind)) {
        e.status = 'rejected';
        e.decidedAt = new Date();
      }
    });
  }

  await job.save();
  res.json({ status: job.status, agreement: job.agreement, total: agreementTotal(job.agreement) });
}));

// ---------- finishing ----------

// POST /api/jobs/:id/complete — customer marks done and answers "on time?".
router.post('/:id/complete', requireAuth('customer'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  if (!isCustomer(job, req.user)) throw httpError(403, 'Not your job');
  requireStatus(job, 'agreed');
  if (typeof req.body.onTime !== 'boolean') throw httpError(400, 'Did they arrive on time? Answer yes or no');
  if (job.agreement.some((e) => e.status === 'proposed')) throw httpError(409, 'Accept or reject the open proposals first');

  job.status = 'completed';
  job.completedAt = new Date();
  job.onTime = req.body.onTime;
  await job.save();

  await User.updateOne({ _id: job.worker }, {
    $inc: { 'stats.jobsCompleted': 1, 'stats.onTimeAsked': 1, 'stats.onTimeYes': job.onTime ? 1 : 0 },
  });
  await User.updateOne({ _id: job.customer }, { $inc: { 'stats.jobsCompleted': 1 } });
  res.json({ status: job.status });
}));

// POST /api/jobs/:id/payment — each side confirms the cash amount.
// Matching amounts count toward the customer's "paid on record";
// a mismatch is a reason to open a non-payment dispute.
router.post('/:id/payment', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  requireParty(job, req.user);
  requireStatus(job, 'completed');
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) throw httpError(400, 'Enter an amount in rupees');

  if (isWorker(job, req.user)) job.payment.workerAmount = amount;
  else job.payment.customerAmount = amount;

  const bothSet = job.payment.workerAmount != null && job.payment.customerAmount != null;
  const nowMatched = bothSet && job.payment.workerAmount === job.payment.customerAmount;
  const firstMatch = nowMatched && !job.payment.matched;
  job.payment.matched = nowMatched;
  await job.save();
  if (firstMatch) await User.updateOne({ _id: job.customer }, { $inc: { 'stats.paidOnRecord': 1 } });

  res.json({ payment: job.payment, mismatch: bothSet && !nowMatched });
}));

// POST /api/jobs/:id/review — rate the other side, completed jobs only.
router.post('/:id/review', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  requireParty(job, req.user);
  requireStatus(job, 'completed');
  const stars = Number(req.body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw httpError(400, 'Choose 1 to 5 stars');
  if (await Review.exists({ job: job._id, from: req.user._id })) throw httpError(409, 'You already rated this job');

  const to = otherParty(job, req.user);
  const theirs = await Review.findOne({ job: job._id, from: to });
  // Both have now rated: reveal both. Otherwise stay hidden for up to 7 days.
  const visibleAt = theirs ? new Date() : daysFromNow(RATING_REVEAL_DAYS);
  if (theirs) { theirs.visibleAt = visibleAt; await theirs.save(); }

  await Review.create({ job: job._id, from: req.user._id, to, stars, comment: req.body.comment, visibleAt });
  res.status(201).json({ visibleNow: Boolean(theirs) });
}));

// POST /api/jobs/:id/disputes — open a dispute within 48 hours.
router.post('/:id/disputes', requireAuth('customer', 'worker'), asyncRoute(async (req, res) => {
  const job = await loadJob(req.params.id);
  requireParty(job, req.user);
  const { type, text } = req.body;
  const evidenceUrls = photoList(req.body.evidenceUrls, 3);
  if (!['no-show', 'non-payment', 'scope', 'misconduct'].includes(type)) throw httpError(400, 'Choose a dispute type');
  if (!text?.trim()) throw httpError(400, 'Say what happened');
  if (!disputeWindowOpen(job, type)) throw httpError(409, 'Disputes must be opened within 48 hours of the job');
  if (await Dispute.exists({ job: job._id, status: 'open' })) throw httpError(409, 'A dispute is already open for this job');

  const against = otherParty(job, req.user);
  const dispute = await Dispute.create({
    job: job._id, openedBy: req.user._id, against, type,
    statements: [{ by: req.user._id, text, evidenceUrls }],
    respondBy: hoursFromNow(RESPONSE_WINDOW_HOURS),
  });

  // Misconduct (safety) claims suspend the other account straight away, until
  // an admin reviews it. No end date = waiting for review.
  if (type === 'misconduct') {
    await User.updateOne({ _id: against, status: 'active' }, { status: 'suspended', $unset: { suspendedUntil: 1 } });
  }

  res.status(201).json({ dispute: { id: dispute._id, status: dispute.status, respondBy: dispute.respondBy } });
}));

export default router;

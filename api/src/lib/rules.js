// All of Mohalla's trust rules live in this one file.
// Every number here comes from the spec doc, so if the team changes a rule
// (say, 3 strikes becomes 4), it changes here and nowhere else.
// The functions are "pure" (no database), which makes them easy to unit test.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const REQUEST_EXPIRY_HOURS = 4;   // unanswered direct requests expire
export const DISPUTE_WINDOW_HOURS = 48;  // time to open a dispute after completion
export const RESPONSE_WINDOW_HOURS = 48; // time for the other side to respond
export const RATING_REVEAL_DAYS = 7;     // ratings hidden until both rate, or this passes
export const STRIKE_WINDOW_DAYS = 180;   // strikes count for 6 months
export const UNRESOLVED_FLAG = { count: 3, withinDays: 30 };
export const NEW_ACCOUNT_JOBS = 5;       // fewer completed jobs than this shows "New"
export const VOUCH = { minCompletedJobs: 10, minCompletionRate: 0.9, maxActive: 3, probationJobs: 10 };

// A 4-digit PIN has only 10,000 options, so after 5 wrong tries the number is
// locked for a while. That makes guessing someone's PIN take months, not minutes.
export const PIN_LOCK = { maxTries: 5, lockMinutes: 10 };

export const isValidPin = (pin) => /^\d{4}$/.test(String(pin ?? ''));

// Called after a wrong PIN. Counts the try and locks the account once the
// limit is reached. Works on a plain object or a Mongoose document; the caller saves it.
export function recordWrongPin(user, now = new Date()) {
  user.failedLogins = (user.failedLogins || 0) + 1;
  if (user.failedLogins >= PIN_LOCK.maxTries) {
    user.failedLogins = 0;
    user.lockedUntil = new Date(now.getTime() + PIN_LOCK.lockMinutes * 60 * 1000);
    return { locked: true, minutes: PIN_LOCK.lockMinutes };
  }
  return { locked: false, triesLeft: PIN_LOCK.maxTries - user.failedLogins };
}

// Whole minutes left on a lock (0 = not locked).
export function lockMinutesLeft(user, now = new Date()) {
  if (!user.lockedUntil || user.lockedUntil <= now) return 0;
  return Math.ceil((user.lockedUntil - now) / 60000);
}

export const CATEGORIES = [
  'plumber', 'electrician', 'cleaner', 'carpenter',
  'mechanic', 'fumigator', 'painter', 'ac-technician',
];

// Karachi areas and the areas next to them. Searching one area also shows
// workers from its neighbours. Rough starting list: adjust it as a team.
export const AREAS = {
  'dha': ['clifton', 'korangi'],
  'clifton': ['dha', 'saddar'],
  'saddar': ['clifton', 'pechs', 'nazimabad'],
  'pechs': ['saddar', 'bahadurabad', 'gulshan-e-iqbal'],
  'bahadurabad': ['pechs', 'gulshan-e-iqbal'],
  'gulshan-e-iqbal': ['gulistan-e-jauhar', 'pechs', 'bahadurabad', 'north-nazimabad'],
  'gulistan-e-jauhar': ['gulshan-e-iqbal', 'malir'],
  'north-nazimabad': ['nazimabad', 'gulshan-e-iqbal'],
  'nazimabad': ['north-nazimabad', 'saddar'],
  'korangi': ['dha', 'malir'],
  'malir': ['korangi', 'gulistan-e-jauhar'],
};

export function areaWithNeighbours(area) {
  return [area, ...(AREAS[area] || [])];
}

export function requestExpiry(now = new Date()) {
  return new Date(now.getTime() + REQUEST_EXPIRY_HOURS * HOUR);
}

export function isExpired(job, now = new Date()) {
  return job.status === 'requested' && job.expiresAt && job.expiresAt < now;
}

// Total agreed price = every accepted entry (visit + quote + amendments + parts).
export function agreementTotal(agreement = []) {
  return agreement
    .filter((e) => e.status === 'accepted')
    .reduce((sum, e) => sum + e.amount, 0);
}

// Which agreement entries a worker may propose, given the job's status.
// Visit charge and full quote come before the job is "agreed";
// amendments and parts only after, because they change an agreed price.
export function canPropose(kind, job) {
  const hasAcceptedQuote = job.agreement.some((e) => e.kind === 'quote' && e.status === 'accepted');
  if (kind === 'visit' || kind === 'quote') return job.status === 'accepted' && !hasAcceptedQuote;
  if (kind === 'amendment' || kind === 'part') return job.status === 'agreed';
  return false;
}

// What profiles show instead of one made-up score: plain counts.
export function reliability(stats = {}) {
  const completed = stats.jobsCompleted || 0;
  if (completed < NEW_ACCOUNT_JOBS) return { isNew: true, completed };
  const accepted = stats.jobsAccepted || completed;
  const onTimePct = stats.onTimeAsked ? Math.round((100 * stats.onTimeYes) / stats.onTimeAsked) : null;
  return { isNew: false, completed, accepted, onTimePct };
}

export function canVouch(stats = {}, activeVouches = 0, vouchingRevoked = false) {
  if (vouchingRevoked) return { ok: false, reason: 'Vouching was removed after two warnings' };
  const completed = stats.jobsCompleted || 0;
  const rate = stats.jobsAccepted ? completed / stats.jobsAccepted : 0;
  if (completed < VOUCH.minCompletedJobs) return { ok: false, reason: `Needs ${VOUCH.minCompletedJobs} completed jobs` };
  if (rate < VOUCH.minCompletionRate) return { ok: false, reason: 'Completion rate must be 90% or more' };
  if (activeVouches >= VOUCH.maxActive) return { ok: false, reason: `At most ${VOUCH.maxActive} active vouches` };
  return { ok: true };
}

export function strikesInWindow(strikes = [], now = new Date()) {
  const since = now.getTime() - STRIKE_WINDOW_DAYS * DAY;
  return strikes.filter((s) => new Date(s.at).getTime() >= since).length;
}

// 1 strike = warning, 2 = 7-day suspension, 3 = ban.
export function strikeConsequence(count) {
  if (count >= 3) return { status: 'banned' };
  if (count === 2) return { status: 'suspended', days: 7 };
  return { status: 'warning' };
}

// Adds a strike to a user object and updates its status. Works on a plain
// object or a Mongoose document; the caller saves it.
export function applyStrike(user, { reason, dispute }, now = new Date()) {
  user.strikes = user.strikes || [];
  user.strikes.push({ reason, dispute, at: now });
  const result = strikeConsequence(strikesInWindow(user.strikes, now));
  if (result.status === 'banned') {
    user.status = 'banned';
  } else if (result.status === 'suspended') {
    user.status = 'suspended';
    user.suspendedUntil = new Date(now.getTime() + result.days * DAY);
  }
  return result;
}

export function disputeWindowOpen(job, type, now = new Date()) {
  if (job.completedAt) return now - job.completedAt <= DISPUTE_WINDOW_HOURS * HOUR;
  // A no-show can be disputed before completion, once the job was accepted.
  return type === 'no-show' && ['accepted', 'agreed'].includes(job.status);
}

export const hoursFromNow = (h, now = new Date()) => new Date(now.getTime() + h * HOUR);
export const daysFromNow = (d, now = new Date()) => new Date(now.getTime() + d * DAY);
export const daysAgo = (d, now = new Date()) => new Date(now.getTime() - d * DAY);

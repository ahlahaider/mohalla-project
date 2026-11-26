// Unit tests for the trust rules. Run with: npm test
// These need no database, so they run anywhere in a second.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agreementTotal, canPropose, reliability, canVouch, strikeConsequence, applyStrike,
  strikesInWindow, disputeWindowOpen, isExpired, areaWithNeighbours, daysAgo,
  isValidPin, recordWrongPin, lockMinutesLeft, PIN_LOCK,
} from '../src/lib/rules.js';
import { normalisePhone } from '../src/lib/http.js';

test('agreement total counts only accepted entries', () => {
  const agreement = [
    { kind: 'visit', amount: 500, status: 'accepted' },
    { kind: 'quote', amount: 2500, status: 'accepted' },
    { kind: 'amendment', amount: 1000, status: 'rejected' },
    { kind: 'part', amount: 900, status: 'proposed' },
  ];
  assert.equal(agreementTotal(agreement), 3000);
});

test('visit and quote come before agreement; amendments and parts after', () => {
  const accepted = { status: 'accepted', agreement: [] };
  assert.ok(canPropose('visit', accepted));
  assert.ok(canPropose('quote', accepted));
  assert.ok(!canPropose('amendment', accepted));

  const agreed = { status: 'agreed', agreement: [{ kind: 'quote', status: 'accepted' }] };
  assert.ok(!canPropose('quote', agreed));
  assert.ok(canPropose('amendment', agreed));
  assert.ok(canPropose('part', agreed));
  assert.ok(!canPropose('part', { status: 'requested', agreement: [] }));
});

test('reliability shows "new" under 5 jobs, plain counts after', () => {
  assert.deepEqual(reliability({ jobsCompleted: 2 }), { isNew: true, completed: 2 });
  assert.deepEqual(
    reliability({ jobsCompleted: 41, jobsAccepted: 43, onTimeAsked: 41, onTimeYes: 39 }),
    { isNew: false, completed: 41, accepted: 43, onTimePct: 95 },
  );
});

test('vouching needs 10 jobs, 90% completion, and a free slot', () => {
  assert.equal(canVouch({ jobsCompleted: 5, jobsAccepted: 5 }).ok, false);
  assert.equal(canVouch({ jobsCompleted: 10, jobsAccepted: 13 }).ok, false); // 77%
  assert.equal(canVouch({ jobsCompleted: 20, jobsAccepted: 21 }, 3).ok, false);
  assert.equal(canVouch({ jobsCompleted: 20, jobsAccepted: 21 }, 2).ok, true);
  assert.equal(canVouch({ jobsCompleted: 20, jobsAccepted: 21 }, 0, true).ok, false);
});

test('strikes: warning, then 7-day suspension, then ban', () => {
  assert.equal(strikeConsequence(1).status, 'warning');
  assert.deepEqual(strikeConsequence(2), { status: 'suspended', days: 7 });
  assert.equal(strikeConsequence(3).status, 'banned');

  const user = { status: 'active', strikes: [] };
  applyStrike(user, { reason: 'no-show' });
  assert.equal(user.status, 'active');
  applyStrike(user, { reason: 'no-show' });
  assert.equal(user.status, 'suspended');
  assert.ok(user.suspendedUntil > new Date());
  applyStrike(user, { reason: 'non-payment' });
  assert.equal(user.status, 'banned');
});

test('strikes older than 6 months stop counting', () => {
  const strikes = [{ at: daysAgo(200) }, { at: daysAgo(10) }];
  assert.equal(strikesInWindow(strikes), 1);
});

test('disputes: 48 hours after completion; no-shows before completion', () => {
  const now = new Date();
  assert.ok(disputeWindowOpen({ completedAt: new Date(now - 47 * 3600e3) }, 'scope', now));
  assert.ok(!disputeWindowOpen({ completedAt: new Date(now - 49 * 3600e3) }, 'scope', now));
  assert.ok(disputeWindowOpen({ status: 'accepted' }, 'no-show', now));
  assert.ok(!disputeWindowOpen({ status: 'accepted' }, 'scope', now));
});

test('requests expire after their deadline', () => {
  assert.ok(isExpired({ status: 'requested', expiresAt: daysAgo(1) }));
  assert.ok(!isExpired({ status: 'accepted', expiresAt: daysAgo(1) }));
});

test('area search includes neighbours', () => {
  assert.deepEqual(areaWithNeighbours('dha'), ['dha', 'clifton', 'korangi']);
});

test('phone numbers are stored in one format', () => {
  assert.equal(normalisePhone('0300-1234567'), '03001234567');
  assert.equal(normalisePhone('+92 300 1234567'), '03001234567');
  assert.equal(normalisePhone('12345'), null);
});

test('a PIN is exactly 4 numbers', () => {
  assert.ok(isValidPin('0123'));
  for (const bad of ['123', '12345', '12a4', '', null, ' 123']) assert.ok(!isValidPin(bad), bad);
});

test('5 wrong PINs in a row lock the account for 10 minutes', () => {
  const now = new Date('2026-12-01T10:00:00Z');
  const user = {};
  for (let i = 1; i < PIN_LOCK.maxTries; i += 1) assert.equal(recordWrongPin(user, now).triesLeft, PIN_LOCK.maxTries - i);
  assert.deepEqual(recordWrongPin(user, now), { locked: true, minutes: 10 });
  assert.equal(lockMinutesLeft(user, now), 10);
  assert.equal(lockMinutesLeft(user, new Date(now.getTime() + 11 * 60000)), 0);
});

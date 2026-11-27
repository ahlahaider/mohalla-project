// Small helpers for reading a job from the worker's side.
import { PROBLEMS } from './i18n';

// The customer's request is saved as "Fan not working. The ceiling fan in the bedroom…".
// We show the chip they tapped in the worker's own language, and the rest as their words.
export function splitProblem(job, { pick, pickU, cat, catU }) {
  const text = job?.description || '';
  const cut = text.indexOf('. ');
  const head = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? '' : text.slice(cut + 2).trim();
  const row = (PROBLEMS[job?.category] || []).find((r) => r[0] === head);
  if (row) return { title: pick(row), titleU: pickU(row), details: rest };
  // No chip: show the service as the title and everything they wrote as their words.
  return { title: cat(job?.category), titleU: catU(job?.category), details: text };
}

// Where a job stands for the worker: the label key and tag colour on lists.
export function workerStatus(j) {
  switch (j.status) {
    case 'requested': return { k: 'newRequests', tone: 'saffron' };
    case 'accepted': return j.waitingForCustomer ? { k: 'w_waitingOk', tone: 'soft' } : { k: 'w_yourTurn', tone: 'saffron' };
    case 'agreed': return j.waitingForCustomer ? { k: 'w_waitingOk', tone: 'soft' } : { k: 'w_doWork', tone: 'leaf' };
    case 'completed': return j.cashConfirmed ? { k: 'w_done', tone: 'soft' } : { k: 'w_confirmCash', tone: 'saffron' };
    case 'declined': return { k: 'w_declined', tone: 'soft' };
    case 'expired': return { k: 'w_expired', tone: 'soft' };
    default: return { k: 'w_cancelled', tone: 'soft' };
  }
}

export const isActive = (j) => ['accepted', 'agreed'].includes(j.status) || (j.status === 'completed' && !j.cashConfirmed);
export const isNewRequest = (j) => j.status === 'requested' && (!j.expiresAt || new Date(j.expiresAt) > new Date());

// The latest entry of one kind in the agreement (visit, quote, …).
export const lastOf = (agreement = [], kind) => [...agreement].reverse().find((e) => e.kind === kind);

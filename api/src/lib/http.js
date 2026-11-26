// Small helpers so route files stay short.

// Throw httpError(404, 'Job not found') anywhere in a route and the error
// handler in app.js turns it into a proper JSON response.
// Optional `extra` adds fields to the JSON answer, e.g. { code: 'pin_locked', minutes: 10 }.
// The apps use `code` to show the message in the user's language.
export function httpError(status, message, extra) {
  const err = new Error(message);
  err.status = status;
  err.extra = extra;
  return err;
}

// Express 4 doesn't catch errors from async functions by itself.
// Wrapping every async route in this passes those errors to the error handler.
export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Pakistani mobile numbers: accept "0300-1234567", "+92 300 1234567", etc.,
// and store them in one format (03001234567) so the same phone can't sign up twice.
export function normalisePhone(raw = '') {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('92')) digits = '0' + digits.slice(2);
  return /^03\d{9}$/.test(digits) ? digits : null;
}

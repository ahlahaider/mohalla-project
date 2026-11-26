// Checks the app wiring without a database: health check, metadata,
// and that protected routes refuse requests with no login token.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

let server;
let base;

before(async () => {
  server = app.listen(0); // port 0 = any free port
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

test('health check answers', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
});

test('meta lists categories and areas', async () => {
  const body = await (await fetch(`${base}/meta`)).json();
  assert.ok(body.categories.includes('plumber'));
  assert.ok(body.areas.includes('pechs'));
});

for (const [method, path] of [
  ['GET', '/jobs/mine'], ['POST', '/jobs'], ['POST', '/jobs/abc/accept'],
  ['GET', '/disputes'], ['PATCH', '/admin/users/abc'], ['POST', '/vouches/abc'],
]) {
  test(`${method} ${path} needs a login`, async () => {
    const res = await fetch(`${base}${path}`, { method });
    assert.equal(res.status, 401);
  });
}

test('register rejects a bad phone number before touching the database', async () => {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'customer', name: 'Test', phone: '123', password: 'secret1' }),
  });
  assert.equal(res.status, 400);
});

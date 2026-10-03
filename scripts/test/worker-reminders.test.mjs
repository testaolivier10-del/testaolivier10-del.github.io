/* The Worker's reminder couriers: worker/src/email.js and reminders.js.

   What the audit found and this pins down: the unsubscribe link pointed at
   the static site (a 404), a 400 from Resend deleted the row (so one typo in
   REMINDER_FROM would delete every opt-in), a failing row kept its slot at
   the front of the queue forever, links in a reminder could point anywhere,
   and every send drifted fifteen minutes later each day. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, unsubscribeUrl, resendOutcome, runEmailReminders } from '../../worker/src/email.js';
import { runReminders, reminderText } from '../../worker/src/reminders.js';
import { API_URL_DEFAULT, sitePath } from '../../worker/src/config.js';
import { nextDailySend, MAX_FAILURES, RETRY_AFTER_MS } from '../../worker/src/store.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const NOW = Date.parse('2026-10-05T18:07:00Z');
const iso = (t) => new Date(t).toISOString();
const DAY = 86400000;

test('the unsubscribe link and List-Unsubscribe go to the Worker, never the static site', () => {
  const row = { unsub_token: 'abc', title: 'T', body: 'B', url: '/nremt/' };
  assert.equal(unsubscribeUrl(row, {}), `${API_URL_DEFAULT}/api/unsubscribe?t=abc`);
  assert.equal(unsubscribeUrl(row, { API_URL: 'https://api.levlprep.com/' }), 'https://api.levlprep.com/api/unsubscribe?t=abc');
  const html = render(row, {});
  assert.ok(html.includes(`${API_URL_DEFAULT}/api/unsubscribe?t=abc`));
  // The static site (GitHub Pages) answers 404 there; api.levlprep.com is the Worker.
  assert.ok(!/(?:\/\/|www\.)levlprep\.com\/api\/unsubscribe/.test(html));
});

test('a reminder link is always a page on this site', () => {
  for (const bad of ['https://evil.example/x', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', null, '/a b']) {
    assert.equal(sitePath(bad), '/', String(bad));
  }
  assert.equal(sitePath('/nremt/practice.html?mode=review#q'), '/nremt/practice.html?mode=review#q');
  const html = render({ unsub_token: 't', title: 'T', body: 'B', url: 'https://evil.example/' }, {});
  assert.match(html, /href="https:\/\/levlprep\.com\/"/);
  assert.ok(!html.includes('evil.example'));
});

test('Resend errors: only recipient problems delete; our own mistakes stop the run', async () => {
  const r = (status, body) => new Response(JSON.stringify(body), { status });
  assert.equal(await resendOutcome(new Response('{}', { status: 200 })), 'ok');
  assert.equal(await resendOutcome(r(422, { name: 'validation_error', message: 'Invalid `to` field. The email address needs to follow the `email@example.com` format.' })), 'gone');
  assert.equal(await resendOutcome(r(422, { name: 'invalid_from_address', message: 'Invalid `from` field.' })), 'config');
  assert.equal(await resendOutcome(r(403, { name: 'validation_error', message: 'The levlprep.com domain is not verified.' })), 'config');
  assert.equal(await resendOutcome(r(401, { name: 'missing_api_key', message: 'Missing API key' })), 'config');
  assert.equal(await resendOutcome(r(429, { name: 'rate_limit_exceeded', message: 'Too many requests' })), 'transient');
  assert.equal(await resendOutcome(r(500, { name: 'internal_server_error', message: 'oops' })), 'transient');
});

/* A PostgREST for one table, plus Resend or a push service. */
function world(table, rows, providerStatus, providerBody = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    if (u.hostname === 'api.resend.com' || u.hostname === 'fcm.googleapis.com') {
      calls.push({ provider: true, body: init.body ? JSON.parse(init.body) : null });
      return new Response(JSON.stringify(providerBody), { status: providerStatus });
    }
    if (u.pathname !== `/rest/v1/${table}`) return new Response('{}', { status: 404 });
    const key = table === 'email_reminders' ? 'user_id' : 'id';
    const id = (u.searchParams.get(key) || '').replace('eq.', '');
    if (method === 'GET') return new Response(JSON.stringify(rows), { status: 200 });
    if (method === 'DELETE') { rows.splice(rows.findIndex((x) => String(x[key]) === id), 1); return new Response(null, { status: 204 }); }
    if (method === 'PATCH') { Object.assign(rows.find((x) => String(x[key]) === id), JSON.parse(init.body)); return new Response(null, { status: 204 }); }
    return new Response('{}', { status: 405 });
  };
  return calls;
}

const EMAIL_ENV = { RESEND_API_KEY: 're_x', SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc' };
const emailRow = (over = {}) => ({ user_id: 'u1', email: 'a@b.co', unsub_token: 't'.repeat(36), title: 'T', body: 'B', url: '/',
  unanswered: 0, failures: 0, next_send_at: iso(NOW - 7 * 60000), ...over });

test('email: a sender misconfiguration deletes nobody and stops the run', async () => {
  const rows = [emailRow(), emailRow({ user_id: 'u2' })];
  const calls = world('email_reminders', rows, 422, { name: 'invalid_from_address', message: 'Invalid `from` field.' });
  const r = await runEmailReminders(EMAIL_ENV, NOW);
  assert.equal(rows.length, 2, 'opt-ins were deleted over our own typo');
  assert.equal(calls.length, 1, 'kept sending after the provider refused the request itself');
  assert.equal(r.config, 422);
  assert.ok(rows.every((x) => x.failures === 0 && x.next_send_at === iso(NOW - 7 * 60000)));
});

test('email: a rejected recipient is deleted', async () => {
  const rows = [emailRow()];
  world('email_reminders', rows, 422, { name: 'validation_error', message: 'Invalid `to` field.' });
  await runEmailReminders(EMAIL_ENV, NOW);
  assert.equal(rows.length, 0);
});

test('email and push: a failing row backs off an hour, then goes after MAX_FAILURES', async () => {
  const rows = [emailRow({ failures: 0 })];
  world('email_reminders', rows, 500);
  await runEmailReminders(EMAIL_ENV, NOW);
  assert.equal(rows[0].failures, 1);
  assert.equal(rows[0].next_send_at, iso(NOW + RETRY_AFTER_MS));
  rows[0].failures = MAX_FAILURES - 1;
  await runEmailReminders(EMAIL_ENV, NOW);
  assert.equal(rows.length, 0);

  const push = [{ id: 'p1', endpoint: 'https://fcm.googleapis.com/fcm/send/x', p256dh: 'k', auth: 'a', unanswered: 0, failures: 0, next_send_at: iso(NOW) }];
  world('push_subscriptions', push, 503);
  // No real VAPID key in a test: sendPush reports a key problem, which is a
  // config error, so nothing is touched.
  const r = await runReminders({ ...EMAIL_ENV, VAPID_PRIVATE_KEY: 'x', VAPID_PUBLIC_KEY: 'y' }, NOW);
  assert.ok(r.config);
  assert.equal(push[0].failures, 0);
});

test('the next daily send is the scheduled time plus a day, not now plus a day', async () => {
  const scheduled = iso(NOW - 7 * 60000); // due at 18:00, sent at 18:07
  assert.equal(nextDailySend(scheduled, NOW), iso(Date.parse(scheduled) + DAY));
  // A row that fell days behind lands on its own hour, in the future.
  const old = iso(NOW - 3 * DAY - 60000);
  const next = Date.parse(nextDailySend(old, NOW));
  assert.ok(next > NOW && next <= NOW + DAY);
  assert.equal((next - Date.parse(old)) % DAY, 0);

  const rows = [emailRow({ next_send_at: scheduled })];
  world('email_reminders', rows, 200, { id: 'e1' });
  await runEmailReminders(EMAIL_ENV, NOW);
  assert.equal(rows[0].next_send_at, iso(Date.parse(scheduled) + DAY));
  assert.equal(rows[0].unanswered, 1);
});

test('reminder text served to the service worker only links to this site', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify([{ title: 'T', body: 'B', url: 'https://evil.example/' }]), { status: 200 });
  const res = await reminderText(new Request('https://w.example/reminders/text?endpoint=https://fcm.googleapis.com/x'), EMAIL_ENV);
  assert.equal((await res.json()).url, '/');
});

/* Site audit 2026-10, the Worker rows of "Payments, security and data" and
   Fix-first 8:
   - the unsubscribe link and List-Unsubscribe pointed at the static site (a
     404); they must be built from API_URL (worker/src/config.js);
   - one-click unsubscribe deleted on GET, so mail scanners unsubscribed
     people; it must delete only on POST;
   - email CTA and notification links accepted any URL; they go through
     sitePath();
   - wrangler.toml without keep_vars = true let a deploy wipe dashboard vars;
   - localhost was an allowed origin in production;
   - raw model errors went to the browser;
   - worker/dist/worker.js is the paste-able bundle and must not drift
     (build-worker --check covers that in CI). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const email = read('worker/src/email.js');
  if (/SITE_URL[^\n]*\/api\/unsubscribe|site\}\/api\/unsubscribe/.test(email)) {
    fail('worker/src/email.js: the unsubscribe link is built from the site URL; use unsubscribeUrl() (API_URL)');
  }
  if (!/\$\{apiUrl\(env\)\}\/api\/unsubscribe/.test(email)) fail('worker/src/email.js: unsubscribeUrl() does not use apiUrl(env)');
  if (!/'List-Unsubscribe': `<\$\{unsub\}>`/.test(email) || !/const unsub = unsubscribeUrl\(row, env\)/.test(email)) {
    fail('worker/src/email.js: List-Unsubscribe must carry unsubscribeUrl()');
  }
  const unsub = email.slice(email.indexOf('export async function unsubscribe('));
  const getAt = unsub.indexOf("request.method === 'GET'");
  const rpcAt = unsub.indexOf('rpc/unsubscribe_email_reminder');
  if (getAt === -1 || rpcAt === -1 || getAt > rpcAt) fail('worker/src/email.js: unsubscribe must answer GET with a confirmation before any delete');
  if (!/sitePath\(row\.url\)/.test(email)) fail('worker/src/email.js: the email CTA must go through sitePath()');
  if (/gone:\s*res\.status === 422 \|\| res\.status === 400/.test(email)) fail('worker/src/email.js: any 400/422 from Resend deletes the row again');

  const reminders = read('worker/src/reminders.js');
  if (!/sitePath\(row\.url\)/.test(reminders)) fail('worker/src/reminders.js: notification text must link through sitePath()');
  if (/Date\.now\(\) \+ 24 \* 60 \* 60 \* 1000/.test(reminders + email)) fail('worker: next send computed from now again; use nextDailySend()');

  const toml = read('worker/wrangler.toml');
  if (!/^keep_vars\s*=\s*true/m.test(toml)) fail('worker/wrangler.toml: keep_vars = true is missing');

  const index = read('worker/src/index.js');
  const allowed = index.slice(index.indexOf('const ALLOWED_ORIGINS'), index.indexOf('];', index.indexOf('const ALLOWED_ORIGINS')));
  if (/localhost|127\.0\.0\.1/.test(allowed)) fail('worker/src/index.js: localhost is a production origin again; gate it on ALLOW_LOCALHOST');
  if (/detail:\s*String\(lastError\)/.test(index)) fail('worker/src/index.js: raw model errors are sent to the browser');
  if (!/signedIn\(env, request\)/.test(index)) fail('worker/src/index.js: the assistant no longer requires a signed-in session');

  const sw = read('sw.js');
  const click = sw.slice(sw.indexOf("addEventListener('notificationclick'"));
  if (/client\.url\.includes\(/.test(click)) fail('sw.js: notification click matches tabs by substring again');
  if (!/sitePath\(/.test(click)) fail('sw.js: notification click must open a same-origin path only');
  for (const m of sw.matchAll(/cache\.put\(\w/g)) {
    const before = sw.slice(Math.max(0, m.index - 400), m.index);
    if (!/cacheable\(/.test(before)) fail('sw.js: cache.put() without the status-200 cacheable() check');
  }
}

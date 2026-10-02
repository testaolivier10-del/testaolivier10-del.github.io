/* Talking to the database, and the two rules both reminder channels share.

   This started as a copy-pasted helper in reminders.js and an identical one in
   email.js, plus the same two constants declared twice. Flattening the Worker
   into one file for the dashboard (scripts/build-worker.mjs) collided them,
   which is a fair way to be told that two identical functions are one
   function. */

/* The site's own database, reached with the service role key so it can see
   tables that row-level security hides from everybody else. push_subscriptions
   and email_reminders have RLS on with no policies at all, like every other
   table here, so this is the only way in — and the key never goes near a
   browser. */
export function sb(env, path, init) {
  return timedFetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init && init.headers),
    },
  });
}

/* Every outbound call has a deadline. Without one, a hung Polar, Resend or
   push service held a request (or a whole cron tick) open until the platform
   killed it, and the rows after it were never reached. */
export const FETCH_TIMEOUT_MS = 10000;

export function timedFetch(url, init = {}, ms = FETCH_TIMEOUT_MS) {
  if (init.signal || typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return fetch(url, init);
  }
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

export async function sha256Hex(s) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* After this many sends with no sign of life, stop. Both channels honour it,
   and they have to honour the same number: somebody with push on one device
   and email on another should not get six nudges for three days' silence.

   A row is only ever written from a page the student is looking at, so
   `unanswered` resetting to zero IS the sign of life — it means they came back.

   Three is deliberate. One is not a reminder, it is a coin flip against whether
   they had their phone. A daily notification forever is how an app gets its
   permission revoked, and a revoked permission cannot be asked for again.
   Three days of "you have work waiting" and then silence is the most a study
   app has earned. */
export const MAX_UNANSWERED = 3;

/* Sent at most this many per cron tick, so one run cannot exceed the Worker's
   CPU budget. Anything left over is picked up fifteen minutes later, which for
   a daily reminder is not a delay anybody can perceive.

   Two numbers rather than one called BATCH, because they are not the same
   quantity: handing a push service a payload-less POST is fast, and a round
   trip to an email provider is not, so fewer of the latter fit in a tick. */
export const PUSH_BATCH = 200;
export const EMAIL_BATCH = 100;

/* A row whose sends keep failing for reasons that are not about the whole
   service (a timeout, a 5xx, a 429) is retried an hour later rather than on
   the next tick, so it cannot sit at the front of the queue forever, and is
   deleted after this many failures in a row. */
export const MAX_FAILURES = 5;
export const RETRY_AFTER_MS = 60 * 60 * 1000;

/* The next daily send: the time this one was scheduled for plus a day, not
   the time it happened to go out plus a day (which drifted up to fifteen
   minutes later every day). A row that fell behind skips ahead whole days. */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export function nextDailySend(scheduledIso, now) {
  const at = Date.parse(scheduledIso);
  if (!Number.isFinite(at)) return new Date(now + ONE_DAY_MS).toISOString();
  let t = at + ONE_DAY_MS;
  if (t <= now) t += Math.ceil((now - t + 1) / ONE_DAY_MS) * ONE_DAY_MS;
  return new Date(t).toISOString();
}

/* The reminder courier.

   Everything that decides WHETHER to remind somebody, WHEN, and WHAT the
   words say happens in the browser (assets/reminders.js). The due counts and
   the streak live in localStorage and never leave it; a server that decided
   when to remind would first have to be told everything the student has ever
   answered, which is the opposite of how the rest of this site works.

   So the browser writes a time and a sentence into one row, and this delivers
   it. Two jobs and nothing else:

     scheduled()   every fifteen minutes, find rows whose time has come, send a
                   payload-less push, and decide whether to schedule another.
     GET /reminders/text
                   what the service worker asks, on waking, for the words to
                   put in the notification.

   Reads and writes go through the Supabase REST API with the service role key,
   because push_subscriptions has RLS on with no policies like every other
   table here — nothing reaching it from a browser can read or write it.

     wrangler secret put SUPABASE_SERVICE_KEY
*/
import { sendPush } from './push.js';
import { sb, sha256Hex, MAX_UNANSWERED, PUSH_BATCH, nextDailySend } from './store.js';
import { recordFailure } from './email.js';
import { sitePath } from './config.js';

/* The words for one notification, fetched by the service worker when it wakes.

   Keyed on the endpoint, which the caller must already hold: this returns
   nothing anybody could not already learn by sending that browser a push. It
   deliberately does not accept an id — an id would be a guessable handle on
   somebody else's reminder text. */
export async function reminderText(request, env) {
  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint || !endpoint.startsWith('https://')) {
    return new Response(JSON.stringify({ error: 'bad endpoint' }), { status: 400 });
  }

  const id = await sha256Hex(endpoint);
  const res = await sb(env, `push_subscriptions?id=eq.${id}&select=title,body,url`, { method: 'GET' });
  const rows = res.ok ? await res.json() : [];
  const row = rows[0];

  // A subscription we no longer have a row for still gets something to show.
  // The alternative is a notification that says "undefined", or a push the
  // service worker cannot answer — and a service worker that receives a push
  // and shows nothing is, on most platforms, a permission the browser revokes.
  const out = row ? { title: row.title, body: row.body, url: sitePath(row.url) } : {
    title: 'Time to study',
    body: 'Pick up where you left off.',
    url: '/',
  };
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* The cron. Runs on whatever schedule wrangler.toml declares. */
export async function runReminders(env, now = Date.now()) {
  if (!env.SUPABASE_SERVICE_KEY || !env.VAPID_PRIVATE_KEY) {
    // Not configured is not an error: the site works without reminders, and a
    // half-configured cron that throws every fifteen minutes is noise.
    return { skipped: 'not configured' };
  }

  const res = await sb(
    env,
    `push_subscriptions?next_send_at=lte.${new Date(now).toISOString()}&next_send_at=not.is.null` +
      `&select=*&order=next_send_at.asc&limit=${PUSH_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0, config = null;

  for (const row of due) {
    const where = `push_subscriptions?id=eq.${encodeURIComponent(row.id)}`;
    let result;
    try {
      result = await sendPush(row, env);
    } catch (e) {
      result = { ok: false, status: 0, gone: false };
    }

    if (result.gone) {
      // The endpoint is dead: profile deleted, permission revoked, or expired.
      // Delete rather than retry — a push service asked repeatedly to deliver
      // to dead endpoints starts rate-limiting the live ones.
      await sb(env, where, { method: 'DELETE' });
      dropped++;
      continue;
    }

    if (result.config) {
      // Our VAPID key or JWT is wrong: every row would fail the same way, so
      // stop and touch nothing rather than count failures against them all.
      config = result.status || result.error || 'vapid';
      console.log('push reminders: refused for our own credentials', String(config));
      break;
    }

    if (!result.ok) {
      // A transient failure: retried in an hour, and after MAX_FAILURES in a
      // row the row is dropped. It does NOT count as unanswered, because
      // nothing reached anybody.
      failed++;
      await recordFailure(env, where, row, now);
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date(now).toISOString() };
    if ('failures' in row) patch.failures = 0;

    if (unanswered >= MAX_UNANSWERED) {
      // Silence, until the browser writes a row again — which only happens
      // from a page the student is looking at.
      patch.next_send_at = null;
      stopped++;
    } else {
      // Same time tomorrow: the time it was scheduled for plus a day, so the
      // student's chosen hour does not drift with the cron.
      patch.next_send_at = nextDailySend(row.next_send_at, now);
    }

    await sb(env, where, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    sent++;
  }

  return { due: due.length, sent, dropped, stopped, failed, ...(config ? { config } : {}) };
}

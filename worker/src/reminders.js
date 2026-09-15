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
import { sb, sha256Hex, MAX_UNANSWERED, PUSH_BATCH } from './store.js';

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
  return new Response(JSON.stringify(row || {
    title: 'Time to study',
    body: 'Pick up where you left off.',
    url: '/',
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* The cron. Runs on whatever schedule wrangler.toml declares. */
export async function runReminders(env) {
  if (!env.SUPABASE_SERVICE_KEY || !env.VAPID_PRIVATE_KEY) {
    // Not configured is not an error: the site works without reminders, and a
    // half-configured cron that throws every fifteen minutes is noise.
    return { skipped: 'not configured' };
  }

  const now = new Date().toISOString();
  const res = await sb(
    env,
    `push_subscriptions?next_send_at=lte.${now}&next_send_at=not.is.null` +
      `&select=id,endpoint,p256dh,auth,unanswered&order=next_send_at.asc&limit=${PUSH_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0;

  for (const row of due) {
    let result;
    try {
      result = await sendPush(row, env);
    } catch (e) {
      failed++;
      continue;
    }

    if (result.gone) {
      // The endpoint is dead: profile deleted, permission revoked, or expired.
      // Delete rather than retry — a push service asked repeatedly to deliver
      // to dead endpoints starts rate-limiting the live ones.
      await sb(env, `push_subscriptions?id=eq.${row.id}`, { method: 'DELETE' });
      dropped++;
      continue;
    }

    if (!result.ok) {
      // A transient failure keeps its slot: next_send_at is untouched, so the
      // next tick tries again. It does NOT count as unanswered, because
      // nothing reached anybody.
      failed++;
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date().toISOString() };

    if (unanswered >= MAX_UNANSWERED) {
      // Silence, until the browser writes a row again — which only happens
      // from a page the student is looking at.
      patch.next_send_at = null;
      stopped++;
    } else {
      // Same time tomorrow. Adding 24 hours to the time that just fired keeps
      // the student's chosen hour without this having to know what it was.
      patch.next_send_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await sb(env, `push_subscriptions?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    sent++;
  }

  return { due: due.length, sent, dropped, stopped, failed };
}

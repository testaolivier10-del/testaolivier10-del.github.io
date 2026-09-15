# LevlPrep Ask — optional AI backend

The site's assistant works with nothing deployed. It indexes this site's
own pages in the browser and answers by quoting the relevant passage. That path
is free, private, works offline, and is the default.

This Worker is the optional second layer. It takes the passages the browser
already found and has a model write a direct answer from them, so a reader gets
prose rather than a quote. It is grounded on purpose: the model is instructed to
use only the supplied passages, because an invented protocol detail on an exam
prep site is worse than no answer.

## Cost

Cloudflare Workers AI includes **10,000 Neurons per day free**, resetting at
00:00 UTC (no card required). On the Workers Free plan there is no overage
billing at all — past the allowance, requests fail rather than charge you.
This Worker is built so that running out is harmless:

- Requests past the allowance return an error.
- The site catches that and falls back to its own local answers.
- The reader sees a normal answer either way.

There is also a per-IP rate limit (12/min) so one visitor cannot drain the
day's allowance.

## Deploy — dashboard (no install)

Nothing to install; everything happens in the browser.

1. Go to **dash.cloudflare.com** → **Compute (Workers)** → **Create** →
   **Start with Hello World** → **Deploy**. Name it `levlprep-ask`.
2. Click **Edit code**. Select everything in the editor, delete it, and paste
   the entire contents of `src/index.js` from this folder. Click **Deploy**.
3. Open the Worker's **Settings** → **Bindings** → **Add binding** →
   **Workers AI**. Set the variable name to exactly `AI` — the code calls
   `env.AI`, so a different name silently breaks it. Save, then **Deploy**
   once more so the binding takes effect.
4. Copy the Worker's URL from its overview page. It looks like
   `https://levlprep-ask.<your-subdomain>.workers.dev`.

Note: the per-IP rate limit needs a binding the dashboard can't add. The code
treats it as optional and runs fine without it — see **Abuse** below.

## Deploy — CLI (optional)

Gets you the rate limiter too, since `wrangler.toml` declares it:

```bash
npm install -g wrangler
cd worker
wrangler login
wrangler deploy
```

## Turning it on for everyone

Paste the Worker URL into `DEFAULT_ENDPOINT` at the top of
`../assets/tutor.js`. Every visitor then gets AI answers with nothing to
configure. Leave it empty and the assistant stays in local-search mode unless
someone sets an endpoint by hand under its gear icon.

The site's Content-Security-Policy already allows `https://*.workers.dev`
under `connect-src`. If you later move the Worker to a custom domain, add that
origin to the CSP in the site's HTML or the browser will block the call with
no visible error.

## Abuse

`ALLOWED_ORIGINS` in `src/index.js` restricts which sites may call the
endpoint — it is already set to this site plus localhost. Without that, any
website could point at your Worker and spend your daily allowance.

Deployed from the dashboard there is no per-IP rate limit, so a determined
visitor could burn through the day's 10,000 Neurons. On the Workers Free plan
that costs nothing — requests simply fail with a 429 and the site falls back
to searching its own notes — but the assistant would be quiet for other
students until 00:00 UTC. Deploying via the CLI adds the limiter (12
requests/minute per IP).

## Models

`MODELS` at the top of `src/index.js` is tried in order until one answers.
All three are free-plan models as of the 2026-07-28 catalog change; reorder
them to change quality-vs-cost, since the first that responds is the one used.

Do not trust the docs for whether a model still exists. This shipped on
`@cf/meta/llama-3.1-8b-instruct` — still listed on the models pages, deprecated
on the platform since 2026-05-30 — and every request failed with error 5028.
The chain exists so one retirement can no longer take the assistant down.

If the Cloudflare dashboard's model catalog disagrees with these ids, the
catalog is right.

---

## Study reminders

The same Worker also delivers study reminders, on a cron. It is a separate
concern from the assistant and shares nothing with it except the deployment.

**The browser decides everything.** Whether to remind, when, and what the words
say are all worked out in `assets/reminders.js` and written into one row. This
is a courier. That is not a shortcut: the due counts live in `localStorage` and
never leave it, so a server that decided when to remind would first have to be
told everything the student has ever answered.

**The push carries no payload.** A Web Push message *can* carry an encrypted
one (RFC 8291: ECDH against the browser's key, HKDF, then AES128GCM). That is a
few hundred lines of crypto whose failure mode is a push that silently never
arrives. A payload-less push is valid: the browser wakes the service worker, and
`sw.js` asks `/reminders/text` what to say. One extra round trip at a moment
nobody is watching, in exchange for deleting the whole encryption path — and
the text is then fetched when it is *shown* rather than when it was queued, so
it cannot be stale.

VAPID is still required and is implemented in `src/push.js`: it is how a push
service knows the sender is us rather than anybody who scraped an endpoint.

### Setting it up

1. **Generate the key pair, once.**

   ```
   node ../scripts/vapid-keys.mjs
   ```

   Replacing this pair later invalidates every existing subscription — every
   browser would have to grant permission again, and there is no way to ask a
   browser that has already said yes. Generate once; do not regenerate for
   tidiness.

2. **Public key into two committed files**, `wrangler.toml` (`VAPID_PUBLIC_KEY`)
   and `../assets/reminders.js` (`VAPID_PUBLIC_KEY`). Also set `ENDPOINT` in
   `reminders.js` and `REMINDER_ENDPOINT` in `../sw.js` to this Worker's URL.
   Until all of them are filled in, reminders are **completely inert**: no
   prompt, no button, no request. Same rule as `analytics.js`.

3. **Secrets.**

   ```
   wrangler secret put VAPID_PRIVATE_KEY
   wrangler secret put SUPABASE_SERVICE_KEY
   ```

   The service key bypasses row-level security, which is the whole point —
   `push_subscriptions` has RLS on with no policies, like every other table
   here. It never goes near a browser.

4. **Run `scripts/sql/schema.sql`** in the Supabase SQL editor. Sections 4 and 5
   are the reminder tables and their functions.

5. **Deploy with the CLI**, not the dashboard: the cron trigger lives in
   `wrangler.toml` and the dashboard editor will not create it.

   ```
   wrangler deploy
   ```

### Email, for browsers that cannot do push

iOS Safari only allows notifications for a site added to the home screen, which
is a large share of the people this site is for. Email reaches them. It is
**signed in only** (there is no other way to know an address, and asking for one
would turn a free tool into a mailing list with a study app attached), strictly
opt in, and never alongside push — enabling one turns the other off, because
the same sentence arriving twice is the fastest way to make both unwelcome.

```
wrangler secret put RESEND_API_KEY
```

plus `REMINDER_FROM` (a verified domain on the provider, **not** a gmail
address, or every message lands in spam) and `SITE_URL`. Leave `RESEND_API_KEY`
unset and the whole email path is skipped silently.

Every message carries a one-click unsubscribe — in the footer and in the
`List-Unsubscribe` header, which serious mail clients turn into their own
button. Without that header, somebody who wants out presses "spam" instead, and
that costs the domain's reputation for every message it sends *including the
password resets*.

### The rule that matters most

`MAX_UNANSWERED` is 3, in both senders. Three sends with no sign that the
student came back and it goes quiet until they open the site on their own.

One is not a reminder, it is a coin flip against whether they had their phone.
A daily notification forever is how an app gets its permission revoked — and a
revoked permission cannot be asked for again. Three days of "you have work
waiting" and then silence is the most a study app has earned.

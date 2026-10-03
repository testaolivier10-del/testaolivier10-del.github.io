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

## Deploy — GitHub Action (the normal way)

`.github/workflows/deploy-worker.yml` runs `wrangler deploy` from this folder on
every push to `main` that touches `worker/`, and on demand (Actions → Deploy
Worker → Run workflow). It needs two repository secrets: `CLOUDFLARE_API_TOKEN`
(Cloudflare → My Profile → API Tokens → "Edit Cloudflare Workers" template) and
`CLOUDFLARE_ACCOUNT_ID`. Deploying with wrangler is what gives the Worker the
per-IP rate limiter and the cron from `wrangler.toml`; `keep_vars = true` there
keeps variables set in the dashboard (`POLAR_PRODUCTS`, `FOUNDING_DISCOUNT_ID`).

Apply `scripts/sql/migrations/2026-10-audit.sql` before the first deploy of
this version: the Worker calls the database functions it adds.

## Deploy — dashboard (fallback, no install)

Nothing to install; everything happens in the browser. Prefer the Action: a
dashboard paste has no rate limiter.

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

The Worker's address is one constant, `API_URL_DEFAULT` in `src/config.js`.
`node scripts/build-site-config.mjs` writes it into the site files that call the
Worker (`assets/tutor.js`, `premium.js`, `account-page.js`, `reminders.js`,
`sw.js`) and into every page's Content-Security-Policy, which names this one
host (not `*.workers.dev`). It is `https://api.levlprep.com`, a custom domain on
the Worker declared in `wrangler.toml`; the old workers.dev address stays on
until 2026-10-09 for tabs opened before the switch. To move it again: change
the constant, run that script and `node scripts/build-worker.mjs`, commit, deploy.

The assistant answers signed-in students only: the browser sends its Supabase
session (only to this Worker, never to an endpoint set by hand), and the Worker
checks it with Supabase before calling the model. Signed-out visitors get the
course's own material.

## Abuse

`ALLOWED_ORIGINS` in `src/index.js` restricts which sites may call the
endpoint — this site only; a development Worker with `ALLOW_LOCALHOST = "true"`
also accepts `localhost:8000`. Without that, any
website could point at your Worker and spend your daily allowance. A request
must carry one of those origins: one with no `Origin` header at all (curl, a
bot) is refused too, since a browser always sends it on a POST. Only the two
non-assistant routes, `/reminders/text` and `/api/unsubscribe`, answer without
one, and both are throttled per IP. The unsubscribe token is 144 random bits
(`gen_random_bytes(18)` in `scripts/sql/schema.sql`), so it cannot be guessed.
The assistant also needs a verified Supabase session, so a forged Origin
header alone gets a 401.

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

### Setting it up — no install needed

The Worker's source is five files that import each other, which normally means
deploying with `wrangler`, which means Node and npm on your machine. If you
have those, skip to *Setting it up with wrangler* below.

If you do not, `worker/dist/worker.js` is the same Worker flattened into one
file you can paste into Cloudflare's dashboard. It is generated by
`scripts/build-worker.mjs` and CI fails if it falls behind the source — of
everything generated in this repo it is the one where going stale would mean
the wrong code running in production rather than a missing tag.

**1. Generate the key pair.** Open **your own site** over https, press F12,
click **Console**, and paste the contents of `scripts/vapid-keys-browser.js`.
It prints a public key and a private key, generated by your browser; nothing is
sent anywhere. It has to be your site over https — the crypto it uses does not
exist on a blank tab or a plain http page.

Generate once. Replacing the pair later silently unsubscribes everyone who ever
agreed to notifications, and there is no way to ask them again.

**2. Put the public key in two files**, both through GitHub's web editor (press
`.` on the repo, or click the pencil icon on a file):

| File | What to set |
|---|---|
| `assets/reminders.js` | `var VAPID_PUBLIC_KEY = '<public key>';` |
| `worker/wrangler.toml` | `VAPID_PUBLIC_KEY = "<public key>"` |

`wrangler.toml` is not read by the dashboard, but keeping it correct is what
makes a later switch to `wrangler deploy` a no-op rather than a debugging
session.

**3. Run `scripts/sql/schema.sql`** in the Supabase SQL editor. It will warn
about "destructive operations" — that is a text scan noticing the `DELETE`
statements *inside* the function definitions, which only run when a student
later asks to delete something. There are no top-level deletes in the file.

**4. Paste the Worker.** Cloudflare dashboard → your Worker → **Edit code**.
Select everything, delete, paste all of `worker/dist/worker.js`, **Deploy**.

**5. Settings → Variables and Secrets.** Add, as **plaintext**:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://bsfcqrczehbcctwhxmrj.supabase.co` |
| `VAPID_PUBLIC_KEY` | the public key from step 1 |
| `VAPID_SUBJECT` | `mailto:` and your address |

and as **secret** (the type matters — a secret is write-only afterwards):

| Name | Value |
|---|---|
| `VAPID_PRIVATE_KEY` | the private key from step 1 |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` |

The service key bypasses every database rule you have. It belongs here and
nowhere else.

**6. Settings → Triggers → Cron Triggers → Add.** Use `*/15 * * * *`.

This is the step the dashboard cannot infer from `wrangler.toml`, and without
it everything is configured and nothing is ever sent.

**7. Deploy once more** so the variables take effect.

### Setting it up with wrangler

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

5. **Deploy.** `wrangler deploy` reads `wrangler.toml`, so the cron trigger is
   created for you — that is the one thing the dashboard route has to be told
   by hand.

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
address, or every message lands in spam) and `SITE_URL`. Fill in
`POSTAL_ADDRESS` in `src/email.js` (CAN-SPAM wants a postal address in every
reminder). Leave `RESEND_API_KEY`
unset and the whole email path is skipped silently.

Every message carries an unsubscribe — in the footer and in the
`List-Unsubscribe` header, which serious mail clients turn into their own
button. Both point at this Worker (`API_URL`), not at the site, which is static
hosting and answered 404. The footer link opens a page with one button (a GET
never deletes, because mail scanners open every link); the mail client's own
button sends the RFC 8058 POST and is one click. Without that header, somebody who wants out presses "spam" instead, and
that costs the domain's reputation for every message it sends *including the
password resets*.

### The rule that matters most

`MAX_UNANSWERED` is 3, in both senders. Three sends with no sign that the
student came back and it goes quiet until they open the site on their own.

One is not a reminder, it is a coin flip against whether they had their phone.
A daily notification forever is how an app gets its permission revoked — and a
revoked permission cannot be asked for again. Three days of "you have work
waiting" and then silence is the most a study app has earned.

---

## Premium

`src/premium.js` sells the passes listed in `../assets/premium.js` through
**Polar** (merchant of record: it handles sales tax and VAT). Two routes:

- `POST /premium/checkout`: the site sends the student's Supabase session and
  a pass id; the Worker checks the session with Supabase and returns a Polar
  checkout URL. Only `https://levlprep.com` is accepted as the return address.
- `POST /premium/webhook`: Polar reports a payment. The Standard Webhooks
  signature is checked (and anything older than three days refused), then
  `order.paid` adds a row to `premium_passes` and `order.refunded` (full
  refunds only) sets its `refunded_at`. A pass bought while another is
  running starts when that one ends. A redelivered order adds nothing.

The cron does two more things (same trigger as reminders, see
`scheduled()` in `src/index.js`):

- **Pass ending soon.** Every tick, the latest unrefunded pass per student and
  course (paid or grant) that ends within 3 days, with no later pass queued,
  gets one email through Resend (same `RESEND_API_KEY` and `REMINDER_FROM`)
  with a link to `account.html`. `premium_passes.ending_reminded_at` records
  it so it goes once. The address comes from Supabase's admin user API with
  the service key. It is transactional, so there is no unsubscribe link.
- **Reconciliation, hourly** (the tick at minute 0–14). Reads Polar's orders
  from the last 48 hours (`GET /v1/orders/`, our product ids only): a paid
  order with no row gets its pass exactly as `order.paid` would, and a fully
  refunded order whose row is not marked gets `refunded_at`. Then reads
  `GET /v1/disputes/?status=lost` and revokes those orders' passes. Polar has
  **no dispute webhook** (no `dispute.*` event, and orders carry no dispute
  status), so this is the only way a chargeback reaches us; open disputes keep
  access until lost. A token missing a scope gets 401/403, which is logged and
  skipped.

Nothing changes until all of this is set; until then checkout answers 503.

1. **Run `scripts/sql/schema.sql`** (the PREMIUM PASSES section; rerunning it
   adds `ending_reminded_at` to an existing table).
2. **Polar → Products → New product**, one per pass: one-time purchase, fixed
   price. Ids must cover every pass in `PASSES`: `nremt-90`,
   `ochem-semester`, `ochem-year`, `anp-semester`, `anp-year`, `bio-2027`
   (AP® Biology, $25, runs through June 30, 2027 whenever bought: its
   `until`; apply `scripts/sql/migrations/2026-10b-apbio.sql` first, the
   Worker passes `p_until` to `premium_add_pass`). Copy each product's id.
3. *(Optional)* **Polar → Discounts**: the founding-member discount. Copy its id.
4. **Polar → Settings → Developers → New token** with `checkouts:write`,
   `refunds:write` (self-serve refunds), `orders:read` and `disputes:read`
   (the hourly reconciliation). An existing token can't gain scopes: make a
   new one and replace `POLAR_ACCESS_TOKEN`.
5. **Polar → Settings → Webhooks → Add endpoint**:
   - URL `https://api.levlprep.com/premium/webhook`
   - format **Raw**
   - events **order.paid** and **order.refunded** (there is no dispute event
     to tick; disputes come in through the reconciliation)
   Copy the secret it shows.
6. **Worker → Settings → Variables and Secrets.** Secrets:
   `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` (both copied exactly as
   shown). Plaintext: `POLAR_PRODUCTS` as JSON,
   `{"nremt-90":"<product id>", …}`, and if used, `FOUNDING_DISCOUNT_ID`.
   `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are the ones reminders use.
7. Redeploy (paste `dist/worker.js` again), buy a pass in the sandbox first:
   set `POLAR_API` to `https://sandbox-api.polar.sh` and use sandbox
   products, token and webhook secret, then switch all four back.
8. Set `LAUNCHED = true` in `assets/premium.js`.

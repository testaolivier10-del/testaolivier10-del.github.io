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

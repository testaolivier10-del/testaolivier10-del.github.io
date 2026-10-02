# Premium server gating: plan (not built)

Status: plan only, October 2026. Nothing here is implemented. Written for the site audit's Fix-first 3
("later, serve Premium banks and lessons from the Worker after checking the pass").

## The problem

Premium is decided in the browser. Since the October 2026 audit fixes, the browser no longer trusts a
cached pass without a signed-in user and ships no launch switch, so the one-line console unlock is gone.
But GitHub Pages serves every file to anyone, so the content itself is public:

| Course | What Premium sells | Where it lives today (public) |
| --- | --- | --- |
| NREMT | the full bank, unlimited review, scenarios | `nremt/assets/questions.json` (2.3 MB), `questions-core.json`, `explanations.json` |
| Ochem | every interactive lesson, the full bank | `ochem/lessons/*.html`, `ochem/assets/practice-bank*.json`, `interactive-bank.js` |
| A&P | lessons outside Foundations, the full bank | `anatomy-physiology/lessons/*.html`, `anatomy-physiology/assets/bank/*.json` |

Anyone who opens DevTools can download all of it. The daily allowance and the free exam are also
localStorage counters. That is acceptable for a soft gate (most students never look), but it is not
access control.

## Goal

The Premium part of each bank, and Premium lesson bodies, are only ever sent to a browser whose
signed-in user holds a live pass, checked on the server. Free content stays static on GitHub Pages,
with no change to how it loads.

## Design

1. **Split each bank into free and Premium files at build time.** The bank builders
   (`scripts/build-question-bank.mjs`, `build-ochem-bank.mjs`, `build-anp.mjs`) already know which chapters
   are free (`freeChapters` in `assets/premium.js`). They write `*-free.json` to the site as now, and
   write the Premium part to `worker-content/` (not published by Pages: add it to an exclude list, or
   keep it outside the Pages root).
2. **Store the Premium files where only the Worker can read them.** Cloudflare R2 (one bucket,
   private), uploaded by the deploy workflow (`.github/workflows/deploy-worker.yml`, a `wrangler r2
   object put` step per changed file). R2's free tier covers this size (under 10 MB in total).
3. **One Worker route: `GET /content/<course>/<file>`.**
   - Requires `Authorization: Bearer <Supabase session>`; verified with `sessionUser()` (already in
     `worker/src/premium.js`), cached a few minutes per token as the assistant route does.
   - Checks the pass with the service key: the same rule as `my_premium()` (a started, unrefunded pass
     for that course). Better: call `my_premium()` as the user (pass their token to PostgREST), so the
     rule exists once, in SQL.
   - Streams the R2 object with `Cache-Control: private, max-age=300` and `Vary: Authorization`, so
     nothing is cached at a shared edge.
   - Rate limited per user (the `RATE_LIMITER` binding, keyed on user id), so one account cannot scrape
     and redistribute everything in a minute; log unusual volume.
4. **Client loaders ask the Worker for the Premium part.** `ochem/assets/bank-loader.js`,
   `anatomy-physiology/assets/anp-core.js` (`loadBank`) and the NREMT practice engine fetch the free file
   as now, and, when `LevlPremium.has(course)` is true, also fetch `/content/...` with the session token
   and merge. A failed Premium fetch falls back to the free part with a "couldn't load Premium questions"
   note, never a broken page.
5. **Lessons.** A Premium lesson page keeps its shell, title and free intro static (good for SEO and
   for the "what you get" preview); its body is a fragment fetched from `/content/<course>/lessons/<id>.html`
   and inserted. The A&P notes fragments already work this way, so the pattern exists.
6. **Offline.** The service worker must not cache `/content/*` in the shared caches (it is per user).
   Either skip it (Premium needs a connection) or cache it in a per-user cache named with the user id and
   delete it on sign-out. Start with skip; add the per-user cache if students ask.
7. **Daily allowance and free exam.** Move the counters server-side only if abuse shows up: a
   `use_allowance(course)` RPC that returns the questions to serve. Not needed for the first step; the
   Premium bank is what is worth protecting.

## Order of work

1. Builders write free and Premium parts; site serves only free parts; CI check that no Premium item id
   appears in a published file.
2. Worker route + R2 upload in the deploy workflow; tests with a fake R2 and fake PostgREST.
3. Client loaders (one course at a time, NREMT first: it is the most-paid course).
4. Lessons.
5. Remove the Premium parts from the public repo history? Not possible without rewriting history; the
   old files stay reachable through git. Accept that, or rotate the bank (new items) over time.

## Costs and risks

- Workers: one request per Premium bank load (a few per session); well inside the free tier.
- R2: under 10 MB stored, a few thousand reads a day; free tier.
- Latency: one extra round trip on the first Premium load, then the browser's HTTP cache (private).
- Risk: an outage of the Worker or Supabase auth makes Premium content unavailable while free content
  still works. Show a clear message and keep the free part working.
- Open question for the owner: the license. If the banks stay CC BY-NC 4.0, anyone may share them
  non-commercially once they have them, and gating protects the product, not the text. See the
  "License for question banks" item in `docs/site-audit-followup.md`.

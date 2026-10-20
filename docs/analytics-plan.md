# Analytics depth (2026-10-20)

Status file for the deeper analytics. Read this, not the chat history.
Branch `claude/analytics-depth`.

## Why

Umami on 2026-10-19, last 30 days: 647 visitors, but about half were not people.
One crawler in Singapore was 259 visitors (Windows Chrome, 1280x1200 or 1366x1366 screens,
6 seconds of visit time between them, every visit a bounce); cloud servers in Ashburn,
Boardman, Council Bluffs and North Charleston about 40 more; the owner (San Diego,
La Jolla) about 25. Real people: about 260, growing week over week (16, 51, 34, 77, 81).
90% of visits read as "direct", so channels were invisible, and nothing showed which
questions were hard, where exams were abandoned, or how far notes were read.

## What was built

| Item | Where |
|---|---|
| Events go to `api.levlprep.com/api/send` and the Worker forwards them to `gateway.umami.is` (Umami's own Cloud proxy guide: visitor IP in X-Forwarded-For, User-Agent kept) | `worker/src/umami.js`, route in `worker/src/index.js`, `HOST_URL` in `assets/analytics.js` |
| Data-center networks dropped by ASN (AWS, Google Cloud, Azure, Alibaba, Tencent, DO, OVH, Hetzner...); Akamai, Cloudflare and Fastly kept (iCloud Private Relay) | `DATACENTER_ASNS` in `worker/src/umami.js` |
| Headless and webdriver browsers never mount the tracker | `automated()` in `assets/analytics.js` |
| Owner excluded: his signed-in browsers opt out automatically (SHA-256 of his two addresses); `?notrack=1` on any page opts a browser out, `?notrack=0` back in; his test purchases are not sent as sales | `signedIn()`, `takeNoTrack()`, `isOwnerEmail()` |
| First-touch source, one word (`tiktok`, `youtube`, `google`, `bing`, `chatgpt`, `reddit`, `direct`, or a domain), from the video ref, `utm_source`, the referrer or an in-app browser's user agent; kept in `levlprep_first` and added as `src` to every event; sent with checkout to Polar metadata | `source()` |
| "How did you find LevlPrep?" one tap, once per browser, after a finished session when the save prompt is not showing; event `heard-from` {answer} | `askSource()`, called from `promptToSave` in `assets/account.js` |
| Every answered question as anonymous per-day tallies (n, right, seconds, topic) in Supabase, batches of 20, not in Umami | `answer()`, `track_answers` + `question_stats` (`scripts/sql/migrations/2026-10j-question-stats.sql`); every course's answer check passes the id through `LevlPremium.noteAnswer` |
| Exams left halfway: `exam-quit` {course, mode, at, of, pct, mins} sent as a beacon | `examStart/examEnd`, hooked in NREMT and every AP and A&P exams page |
| Notes and lessons: `read` {kind, depth band, active minutes band} | `watchPage()` |
| `rage-click` {page, el}, `js-error` {page, msg}, `vitals` (LCP, CLS, INP bands, one visit in three) | `watchPage()`, `assets/errors.js` |
| `exam-date-set` {course, weeks band} | `assets/exam-date.js` |
| `purchase` {course, pass, dollars, ref, src} and `refund` {course, how} sent by the Worker | `worker/src/premium.js` |
| Signed-in visits carry `acct` (first 16 hex of SHA-256 of `levlprep:` + user id) via `umami.identify` | `signedIn()` |
| Privacy page rewritten for all of the above | `privacy.html` (updated 20 Oct 2026) |

Already there before this (Supabase): `premium_funnel` (gate, limit-hit, interest,
checkout-start, paid), `ref_events` per video ref, `page_views`, `client_errors`.
Umami already got `premium-*` funnel events from `assets/premium.js`.

## After merging (verify)

1. Deploy: the Worker deploys on merge (`deploy-worker.yml`); the site on GitHub Pages.
2. Within a day, check in Umami that new sessions still show real countries and cities.
   If they all show one Cloudflare location, the gateway is not reading X-Forwarded-For:
   set `HOST_URL` back to `https://cloud.umami.is` and open an issue here.
3. Singapore and Ashburn should drop to near zero.
4. `select course, count(*), sum(n) from question_stats group by 1;` should start filling.

## Reading the new data

- Hardest questions (10+ answers this week): see the query at the top of the migration.
- Umami Events: `heard-from` by `answer`; `exam-quit` by `pct`; `read` by `depth`;
  any event by `src`; `purchase` by `src` and `ref`.
- Umami counts before 2026-10-20 include the bots; do not compare them with later weeks.

## Not done (owner or later)

- Bing Webmaster Tools: sign in at bing.com/webmasters with a Microsoft account and import
  the site from Google Search Console (no code needed). Then the weekly run can read it.
- Umami session replays: not used. They would need Umami's recorder script on every page,
  which the site rules (no third-party scripts on pages that hold the session) forbid.
- A saved Umami segment excluding Singapore, for reading the old numbers.

## Progress log

- 2026-10-20: built, tests added (`analytics-depth`, `worker-umami`, one in `worker-premium`); full local CI green.
- 2026-10-20: migration 2026-10j applied to the live database (table empty until the site change is merged), plus `revoke all on question_stats from anon, authenticated`.

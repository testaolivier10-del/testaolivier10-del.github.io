# Premium vault, new host and free limits on the server

Status file (owner decisions 2026-11-08). Replaces the plan in `docs/premium-server-gating.md`, which stays as
background.

## Owner decisions (2026-11-08)

- Make the GitHub repo private and move the site off GitHub Pages to Cloudflare, free.
- Lock the parts that lock cleanly: Premium interactive lessons. The question banks stay a soft lock for now (free
  users get 15 a day from any topic, so the whole bank must stay reachable; a server question dispenser for all 13
  courses was judged weeks of work for little gain at the current size).
- Count free limits on the server for signed-in users. Signed-out visitors keep the browser counter and meet the
  existing gentle nudge at the limit; revisit a sign-in wall only if analytics show people resetting the count.
- No card on file anywhere: R2 needs one, so the vault uses Workers static assets and the backups use KV.

## How it works

### Which pages are vaulted
`scripts/vault/rules.mjs` reads each page's own marker, the same one its lock reads in the browser:
AP courses the `"free"` in the page's `*-page-data` JSON; NREMT and ochem the page's `data-chapter` against
`freeChapters` in `assets/premium.js`; A&P the page's `data-topic` chapter from `AnpCurriculum`. Only
`<course>/lessons/*.html` (and ochem `mechanisms/`). A lesson page without its marker fails the build, so a new
page type can never ship unlocked or locked by mistake. 751 pages on 2026-11-08 (`node scripts/build-deploy.mjs --list`).

Not vaulted, on purpose: FRQs (the free exam draws on them), unit tests (each has a free sample), justify prompts,
tools and the banks. They keep their browser locks.

### The build: `scripts/build-deploy.mjs`
Writes `.deploy/site/` (every tracked site file except `docs/`, `scripts/`, `worker/`, `.github/`, root
md/package files and each course's build-only `data/` folder, which holds lesson sources) and `.deploy/vault/`
(the original Premium pages and `_index.json`, path to course). Each vaulted page on the site becomes a stub: the
real head without its scripts (title, description, canonical and CSS stay, so search still sees the page), the
title and meta description, and `assets/vault.js`. Fails over 19,500 files (Workers assets allow 20,000 on the
free plan; 7,075 on 2026-11-08) or any file over 25 MiB. `.deploy/` is a dot folder so every site check skips it.

### The browser: `assets/vault.js`
Reads the Supabase session straight from its storage key (refreshing it if expired), asks
`GET https://api.levlprep.com/vault?p=<path>`, and on 200 replaces the stub with the real page
(document.open/write), which then runs exactly as when loaded directly (checked in Chrome on one lesson per course:
same text, same controls, no page errors). 401/403: loads the header, account and premium.js and shows the
course's own Premium card plus a link to the free notes; a pass that appears later reloads the page (at most twice a
minute). Network failure: a Try again button. Nothing runs on the stub before the swap, so nothing runs twice.

### The Worker: `worker/src/vault.js`
The vault is the API Worker's own static assets (`[assets]` in `worker/wrangler.toml`, binding `VAULT`,
`run_worker_first`, `html_handling = "none"`), so nothing reaches them except `vaultRoute()`: GET only, site Origin
only, valid session (`/auth/v1/user`), per-account rate limit, then `my_premium()` called as the user (one rule, in
SQL). `Cache-Control: private, no-store`. Tests: `scripts/test/worker-vault.test.mjs`.

### The site host: `worker/site/`
Worker `levlprep-site` serving `.deploy/site` as static assets (free, no request limit). Its script runs only when
no file matches and recreates GitHub Pages' URLs: `/x/` to `/x/index.html`, `/x` to `/x.html` or a 301 to `/x/`,
else `404.html` with a 404. Directory URLs (`/`, `/bio/`) do invoke the script and count toward the Workers free
plan's 100,000 requests a day, far above current traffic.

### Deploy: `.github/workflows/deploy-worker.yml`
Every push to main: Worker checks and tests, `build-deploy.mjs`, deploy the API Worker with the vault, then the site.
GitHub Pages keeps serving levlprep.com until the cutover.

### Free limits: `scripts/sql/migrations/2026-11h-free-usage.sql`
Table `free_usage` (RLS on, closed) and RPCs `free_usage_get(p_day)` and `free_usage_add(p_course, p_kind, p_day,
p_n)` for signed-in users. `assets/premium.js` reports every question taken and every free exam spent, and after
`my_premium()` reads the account's counts back, keeping the larger of browser and account both ways (NREMT's exam
flags through `noteFreeExam`, from `nremt/assets/premium-gates.js`). Tests: `scripts/test/free-usage-sql.test.mjs`
(PGlite).

## Owner checklist

1. ~~Apply the SQL migration~~ Done 2026-11-08 (applied by Claude with the owner's go-ahead; checked: RLS on, table
   closed to anon and authenticated, the two RPCs granted to authenticated only).
2. Merge the PR. The deploy then puts the vault on the API Worker and the site on `levlprep-site.<account>.workers.dev`.
3. Claude: read that address from the deploy log, set `SITE_PREVIEW_ORIGIN` to it in `worker/wrangler.toml`, test a
   free, a signed-out and a Premium account there.
4. **Cutover** (Claude with the owner): in Cloudflare DNS remove the GitHub Pages records for `levlprep.com` and
   `www`, add `routes = [{ pattern = "levlprep.com", custom_domain = true }, { pattern = "www.levlprep.com",
   custom_domain = true }]` to `worker/site/wrangler.toml`, deploy, check the live site, then turn off GitHub Pages.
5. **Make the repo private** (GitHub, Settings, General, Danger zone). Only after the cutover: GitHub Pages stops for
   a private repo on the free plan. No forks existed on 2026-11-08, so the history goes private with it.
6. Watch GitHub Actions minutes for a month (2,000 free a month for a private repo); if over, run the browser checks
   only on pull requests.

## Status

- 2026-11-08: built and tested locally (Worker tests, PGlite SQL test, Chrome checks of one vaulted lesson per
  course as Premium, free and signed out, and 77 ordinary pages for missing files). SQL migration applied the same
  day.

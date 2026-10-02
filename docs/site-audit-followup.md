# Site audit follow-up (2026-10)

Status file for fixing everything in `docs/site-audit-2026-10.md` (the October 2026 audit, about 200
findings). A fresh session should read this file and `CLAUDE.md`, not the chat history.

## Owner checklist (only you can do these)

Nothing below has been attempted from the repo. Do them in this order: the Worker calls new database functions,
so **the migration must be applied before the first Worker deploy** or purchase webhooks fail.

- [ ] **1. Apply the SQL migration.** Supabase dashboard → project `bsfcqrczehbcctwhxmrj` → SQL Editor → New query →
      paste `scripts/sql/migrations/2026-10-audit.sql` → Run (idempotent). Then Advisors → Security Advisor →
      Refresh: no "Function … executable by anon" warnings should remain. Check page views still record:
      `select * from page_views order by day desc limit 5;`. If you apply it after 2026-10-15, set
      `EXAM_LOG_SINCE` in `worker/src/premium.js` to that day and run `node scripts/build-worker.mjs`.
- [ ] **2. Turn on leaked-password protection.** Supabase → Authentication → Sign In / Providers → Email (or
      Policies → Password security) → enable "Prevent use of leaked passwords" → Save.
- [ ] **3. Deploy the Worker with the new GitHub Action.** Cloudflare → My Profile → API Tokens → Create Token →
      "Edit Cloudflare Workers" template → your account → Create → copy. Cloudflare → Workers & Pages → Overview →
      copy the Account ID. GitHub → repo → Settings → Secrets and variables → Actions → New repository secret:
      `CLOUDFLARE_API_TOKEN`, then `CLOUDFLARE_ACCOUNT_ID`. Actions → "Deploy Worker" → Run workflow → main.
      Afterwards Workers → levlprep-ask → Settings → Variables and Secrets: `POLAR_PRODUCTS` and
      `FOUNDING_DISCOUNT_ID` must still be listed (`keep_vars = true` should keep them).
- [ ] **4. api.levlprep.com.** Cloudflare → Add a site → levlprep.com (moves DNS to Cloudflare) → Workers & Pages →
      levlprep-ask → Settings → Domains & Routes → Add → Custom domain → `api.levlprep.com`. When it answers, set
      `API_URL_DEFAULT` in `worker/src/config.js`, run `node scripts/build-site-config.mjs` and
      `node scripts/build-worker.mjs`, commit. Then Polar → Settings → Webhooks → endpoint
      `https://api.levlprep.com/premium/webhook`.
- [ ] **5. Frame-protection headers** (needs step 4's zone). Cloudflare → levlprep.com → DNS: GitHub Pages records
      proxied (orange cloud) → Rules → Transform Rules → Modify Response Header → all requests → set
      `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'` → Deploy.
- [ ] **6. hello@levlprep.com.** Cloudflare → levlprep.com → Email → Email Routing → enable, add the MX/TXT records
      it offers, create `hello@levlprep.com` → forward to your Gmail. Verify it in Resend if it becomes the sender.
- [ ] **7. Polar settings.** Check each product's description says "Pass-or-extend", not "Pass guarantee"; check
      Polar's buyer-age rule against terms.html (see Open items).
- [ ] **8. Clinical reviewer.** Recruit one paramedic or EMS instructor to review the NREMT bank before promoting
      Pass-or-extend. W1's re-tagged domains and new items are listed in `docs/site-audit-notes/w1.md`.
- [ ] **9. License for question banks.** Decide whether banks stay CC BY-NC 4.0 or become all-rights-reserved. The
      code doesn't change until you decide.
- [ ] **10. Postal address.** PO box or virtual mailbox → `POSTAL_ADDRESS` in `worker/src/email.js` →
      `node scripts/build-worker.mjs` → commit to main (the Action deploys). CAN-SPAM needs it.
- [ ] **11. Minnesota assumed-name filing.** Minnesota Secretary of State → Business Filings Online → "Assumed Name"
      for "LevlPrep" (about $50; publication in a qualified newspaper is also required).
- [ ] **12. After the next site deploy, check Umami still counts.** Private window on the site → Umami Cloud →
      Realtime shows the visit within a minute. If not, `HOST_URL` in `assets/analytics.js` needs Umami's host.

## How the work is organised

- **Integration branch:** `claude/friendly-galileo-qb7yzd`. Each workstream works on its own branch
  `claude/friendly-galileo-qb7yzd-wN`, cut from the integration branch, and is merged back with a merge commit.
- **Waves**, so parallel branches touch different files:
  - Wave 1 (parallel): W1, W3, W4, W5, W6.
  - Wave 2 (parallel): W2, W7. Then W8.
  - Wave 3: W9 (ochem sequencing), once everything above is merged.
- **Before each merge:** regenerate every generated file, bump `sw.js` `CACHE` version (done once per merge on the
  integration branch, never on a workstream branch), run the full CI mirror including `check-a11y` and
  `check-console`.
- **New check-site rules** go in `scripts/site-rules/<rule>.mjs` (see the README there), one file per class of bug,
  so parallel branches never edit `check-site.mjs` itself.
- **Science and clinical edits** get an independent accuracy check by a separate helper that did not write them;
  its fixes are applied before the merge.
- Each finding is verified against the code first. Wrong or already-fixed findings are marked
  **no change needed** with one line on why, in the workstream's section below.

## Workstreams

| # | Workstream | Branch | Status |
|---|---|---|---|
| W1 | NREMT exam alignment (2025 domains), triage notes, bank fixes, NREMT drill UX | `-w1` | in progress (wave 1) |
| W2 | Free vs Premium honesty, numbers and dates, legal pages, /premium page | `-w2` | to do |
| W3 | Payments and security (premium.js, worker, SQL migration, SW, CSP) + premium-server-gating plan | `-w3` | merged |
| W4 | Cross-device sync in account.js, with tests | `-w4` | merged |
| W5 | Ochem content and tools, concept tagging, notation lint | `-w5` | in progress (wave 1) |
| W6 | A&P: search collision, attribution, Beta label, bank loading, science items | `-w6` | in progress (wave 1) |
| W7 | UX and accessibility | `-w7` | to do |
| W8 | SEO, performance, repo | `-w8` | to do |
| W9 | Ochem sequencing (Grignard, Aromatic, IR/MS moves), pericyclic + cyclopropanation | `-w9` | to do |

### Which audit findings each workstream owns

Findings are named by the audit's section and "Where" column.

- **W1:** Fix-first 1, 7, 14; every row of "NREMT course"; "In the courses" rows about NREMT drills, NREMT home
  and review, NREMT dashboard, NREMT details; "NREMT drill start and Next" focus; tutor fallback answering with
  a toddler passage. Owns `nremt/practice-engine.js` and NREMT data. Domain-mix copy on exams.html,
  exam-day.html, sources.html (NREMT parts) and the hub sentence about domains.
- **W2:** Fix-first 2, 10, 13 (the /premium page); every row of "Free vs Premium, legal and trust"; SEO rows on
  `isAccessibleForFree`/price 0, the four manifests, meta descriptions and titles that say free, /premium page;
  hub copy rows (founding price rendered from premium.js, "Organic Chem", NREMT-only section, sources.html smaller
  copy). Owns `index.html`, terms, privacy, sources, changelog, 404 copy, manifests, og-image text, premium.js
  dialog copy.
- **W3:** Fix-first 3, 4, 8, 9; every row of "Payments, security and data" except the account.js sync row;
  CSP on all pages; `docs/premium-server-gating.md`. Owns `worker/`, `scripts/sql/`, `sw.js` logic,
  `assets/premium.js` logic, `assets/analytics.js`, `.github/workflows/deploy-worker.yml`.
- **W4:** Fix-first 5; the account.js sync row; the "Sync and refresh errors swallowed" nit for account.js.
- **W5:** Every row of "Organic Chemistry course" except the three Sequencing rows and the Coverage row (W9).
- **W6:** Fix-first 6, 11; every row of "Anatomy & Physiology course".
- **W7:** Fix-first 12, 13 (hero half); every row of "UX, design and accessibility" not given to W1.
- **W8:** Every row of "SEO and marketing surface" and "Performance, repo and infrastructure" not given to W2/W3.
- **W9:** The three Sequencing rows and the Coverage row of "Organic Chemistry course".

## Decisions

Calls made without asking, per the brief. Each says why.

- **AI tutor needs sign-in for AI answers** (a Supabase session token, not Turnstile — no new setup for you). Signed-out visitors get answers from course material only.
- **After merging any branch that touches page `<head>`s, run `node scripts/build-site-config.mjs`** (it writes the CSP).
- **Sync conflicts:** when both devices changed a setting-like key between syncs, this device wins (except on a device's first sync, where the account wins). Numbers take the max, lists the union, stamped objects the newer.

- **File ownership beats the audit's grouping where they collide.** NREMT drill UX (feedback per question, "End
  session", free goal 15, picker cap, focus on the question heading, readiness rename) is done by W1, not W7,
  because it all lives in `nremt/practice-engine.js`. The /premium page is built by W2 (it is the honest-pricing
  page), not W7. Page-wide CSP tightening is done by W3 in one scripted pass.
- **check-site rule hook.** `check-site.mjs` loads every `scripts/site-rules/*.mjs` so parallel branches add rules
  without conflicts.

## Workstream results

Per-finding status lives in `docs/site-audit-notes/wN.md`; this is the summary.

### W4 sync — merged
3 fixed, 0 no change needed, 0 deferred. One `sync()` reads the row, merges per key (three-way, with a per-browser
fingerprint of the last sync so deletions propagate), writes only if `updated_at` is unchanged (retries 4x), and
runs on every load, tab focus, the 30 s timer and hide. Failures show after 3 in a row; menu shows "Last synced".
Merge rules now live in account.js and progress-backup.js reuses them. Guarded by 11 two-device tests and
`scripts/site-rules/progress-sync.mjs`. Shell weight budget 249 → 253 KB (the sync code must be on every page).

### W3 payments and security — merged
29 fixed, 3 deferred (server-side gating is a plan in `docs/premium-server-gating.md`; free quota and free exam
still counted in the browser until that plan is built; leaked-password protection is an owner step). Signed-out
means no Premium; `_` hooks gone (tests use `__levlTestHooks` only the harness defines). One idempotent migration
`scripts/sql/migrations/2026-10-audit.sql` (schema.sql matches; tested twice on PGlite, never on the live DB).
Worker: API_URL constant, unsubscribe confirm-then-POST, safe Resend error handling, same-origin URLs, timeouts,
keep_vars, generic errors, rate limits. CSP on all pages from `scripts/build-site-config.mjs` (`--check` in CI).
Umami self-hosted (`assets/vendor/umami-2.10.0.js`). New `.github/workflows/deploy-worker.yml`.

## Open items for the owner

- **XP on two devices between syncs** is max'd, not summed (needs per-device counters; deferred).
- Check RLS on `user_progress` allows UPDATE where `auth.uid() = id` (it must already, for the old upsert).

## Progress log

- 2026-10-02: wave 1 (W1, W3, W4, W5, W6) started; helpers write per-finding notes to `docs/site-audit-notes/wN.md`; local CI mirror is `scripts/ci-local.sh`.
- 2026-10-02: status file, rule hook in check-site, audit copied to `docs/site-audit-2026-10.md`.

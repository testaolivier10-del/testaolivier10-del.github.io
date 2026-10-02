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
| W1 | NREMT exam alignment (2025 domains), triage notes, bank fixes, NREMT drill UX | `-w1` | merged |
| W2 | Free vs Premium honesty, numbers and dates, legal pages, /premium page | `-w2` | merged |
| W3 | Payments and security (premium.js, worker, SQL migration, SW, CSP) + premium-server-gating plan | `-w3` | merged |
| W4 | Cross-device sync in account.js, with tests | `-w4` | merged |
| W5 | Ochem content and tools, concept tagging, notation lint | `-w5` | merged |
| W6 | A&P: search collision, attribution, Beta label, bank loading, science items | `-w6` | merged |
| W7 | UX and accessibility | `-w7` | merged |
| W8 | SEO, performance, repo | `-w8` | merged |
| W9 | Ochem sequencing (Grignard, Aromatic, IR/MS moves), pericyclic + cyclopropanation | `-w9` | in progress |

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
- **Ochem energy units:** kcal/mol is primary; pages built on kJ/mol data keep their tables and give kcal/mol beside the key numbers.
- **Ochem concept tags:** vocabulary questions are tagged `recall` and show no concept; a question with no matching rule shows no concept line.
- **NREMT domain tagging rule:** Scene = safe? how many patients? which resources? who first in triage? mechanism. Primary = the life threat / what first. Secondary = history, exam, vitals trend, reassessment. Treatment & Transport = doing or choosing an intervention, drug, packaging, destination. Operations = legal, documentation, communication, ICS, vehicles/air medical, crew wellness.
- **No 130 new Scene items in this pass;** the shortfall is an open item. Exams draw by weight, so exam mixes are already right.
- **NREMT item types:** the site simulates multiple choice and multiple response; build-list, drag-and-drop and options tables are described on exam-day.html but not simulated, and the copy says so.
- **One name for the assistant:** "the study assistant".
- **Polar buyer age:** polar.sh was unreachable; terms follow Polar's general terms as found by search (legal age to contract or a parent's permission; Polar takes no personal data from under-16s). Confirm against Polar's buyer terms (checklist item 7).
- **Three quiz engines stay separate for now.** Merging them into one answer-card component rewrites reviewed course code in all three courses; it should be its own workstream. The shared daily goal (15) is done.
- **Hub primary button goes to NREMT practice** (the largest course). Change `index.html` if another course should lead.
- **Fonts use `font-display: optional`**: no layout shift, but a first visit on a slow connection may show the system font on that first page.
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

### W5 ochem content and tools — merged
26 fixed (4 rows left for W9). Interactive-bank errors, Spectroscopy Lab (n+1 to nonet, anhydride bands, AA'BB'
doublets, in-ring aromaticity, formula expansion), reaction predictor (90:10 primary SN2, neopentyl, (E)-but-2-ene),
bank items, 50 stems now name their reaction, glossary, notation normalized by `scripts/normalize-ochem-notation.mjs`
(1,472 strings). Concept fallback 54.0% → 6.0%; the concept line is hidden when nothing matched. Five new site
rules. Accuracy check found 6 issues (half-converted exponents, two mis-tagged concepts, CF₃/SO₃H parsed as chains,
DBU wording, a dropped "achiral solvent" qualifier); all fixed before merge. Ochem shell and home sit exactly at
their weight budgets.

### W1 NREMT exam alignment — merged
39 fixed, 1 deferred (sound-trainer clips: Wikimedia unreachable and no licensed rhonchi/normal clip found), 1 row
left to W7. Bank now 2,033 items, each tagged to a 2025 domain (old body-system label kept for weak topics): Scene
172 (8.5%), Primary 853 (42.0%), Secondary 131 (6.4%), Treatment & Transport 619 (30.4%), Operations 258 (12.7%).
Full exams and the "All domains" drill draw 17/41/7/22/13, so every exam sits inside the bands. 77 duplicates
deleted, 18 turned into new scenarios, ~70 self-refuting and 26 absurd distractors fixed, 56 select-N items at 5–6
options, new items 2109–2112 (soft-surface CPR, delayed cord clamping). Field triage rewritten to the 2021
guideline. Drill UX: check step in untimed practice, "End session", free goal 15, readiness estimate, focus on the
question heading. Two independent checks (clinical, and domain tagging at 93% agreement) found stale explanations,
skill-sheet gaps and 14 mis-tags; all fixed, then a third check of the fixes passed. New rule
`nremt-stale-explanations` fails when an item's options change without its explanation.

### W6 A&P — merged
Fix-first 6 and 11 and all A&P rows fixed except 2 "no change needed" (os-14-23 boxes never overlap on the one page
that draws them; glucose Tm numbers already added up — only the alt text was wrong). LevlSearch collision fixed
(chrome global is now `window.LevlSearchChrome`) with a smoke test and check-console flows for A&P search, Practice,
Review and Exams. Figure credits come from data; all 389 OpenStax figures were checked against live captions and
none carries a third-party credit (the build is ready if one is found); credits.html names Betts et al. and Rice
University; masked figures say "adapted: labels hidden". Beta pill and "not yet reviewed by a licensed A&P
instructor" note on every A&P page. Find-the-error sequences no longer shuffled; bank loads per chapter with
explanations after answering (A&P shell budget 44 → 46 KB). Rebalancing: select-all options 61.4% → 50.0% correct,
"no change" predict keys 12.8% → 20.6%, absolutes now rarer in distractors (2.2%) than in keys (2.4%), held by
`anp-test-wise`. Three accuracy checks (first pass, then pass 2 split in two) found 2 + 3 + 12 issues; all fixed.

### W2 free vs Premium honesty — merged
33 fixed, 1 no change needed (bank licence: owner decision), 5 deferred (owner steps). The owner's sentence lives
once in `scripts/lib/premium-data.mjs`. New `scripts/build-pricing.mjs` generates premium.html, the hub's "Free and
Premium" block and structured data, bank counts in premium.js, the four manifests and the 404 card (`--check` in
CI). Founding price comes from premium.js and hides itself after 2027-01-31. "Pass guarantee" is now
"Pass-or-extend" everywhere (Worker included); its conditions come from a `GUARANTEE` object checked against the
Worker and show in the purchase dialog, account page and premium.html. Gated pages say `isAccessibleForFree: false`
with `hasPart`; no price-0 offers on Premium tools. Ochem dialog count 3,795 → 3,635 (NREMT 2,033, A&P 3,321).
Legal pages dated 1 October, every privacy/terms gap closed, history moved to the changelog. Four new site rules.

### W7 UX and accessibility — merged (follow-ups pending)
41 fixed, 7 no change needed (already done by W1, or already fine). Hero is one sentence plus a "Start a free
practice test" button and a Continue card; one shared header; dark mode follows the OS until set; keyboard path
through ochem atomic-structure step 4; More sheet inert when closed; tutor is a labelled dialog that returns focus;
right/wrong icons plus text; contrast and landmark fixes; sound off by default; confetti only on level-up and
session end. Layout shift on phones: A&P lesson 0.27–0.35 → ≤0.07, ochem practice 0.79 → 0.02, dashboards up to
0.98 → ≤0.09, A&P learn 0.58 → 0. "/" opens an in-page search overlay. New a11y interaction checks and three site
rules. Follow-ups merged: breadcrumbs on 162 NREMT and ochem pages from their BreadcrumbList (`scripts/build-crumbs.mjs`, `--check` in CI); NREMT review CLS 0.21 → 0.004; one monospace rule and one disclosure marker in theme.css (rule `one-disclosure-marker`).

### W8 SEO, performance and repo — merged
27 fixed, 9 no change needed (already done by W2/W3/W7), 3 deferred with plans in the notes (tutor-bank sharding:
the bank already loads only on first use; Supabase CLI migrations layout: needs a pull from the live DB; build to
`dist/` with a Pages Action: plan only). Titles follow "{Topic} — {Course} | LevlPrep" (≤60 chars) from
`scripts/lib/page-title.mjs`; 11 app-state pages noindex and out of the sitemap; sitemap lastmod from each file's
author date; A&P share image exists; hub has a raster logo, founder, contact and a visible FAQ with FAQPage data;
exam-day.html targets the 2025 exam. Supabase SDK loads only for a stored session or the sign-in dialog (page views
by plain fetch); the assistant loads on first tap; ochem explanations load per question; ochem learn.html shows one
section at a time and glossary letters collapse; A&P figures ship as AVIF at 480/800/full with JPG fallback (+27.9
MB repo; WebP skipped, it would add ~30 MB more); SW precaches per course. Workflows read-only, actions pinned by
SHA, `package.json` + lockfile for CI tools, `.gitignore`, TRACKER.md moved to docs/, README and docs updated. Ten
new site rules. Shell budget 260.5 → 279 KB is a change of ruler: the scripts site-chrome.js mounts on every page are
now counted; real every-page downloads fell (tutor 23 KB and the ~45 KB SDK left the first load).

## Open items for the owner

- **XP on two devices between syncs** is max'd, not summed (needs per-device counters; deferred).
- **NREMT Scene content gap:** about 133 more Scene Size-Up & Safety items are needed for the bank itself to sit in the 15–19% band (exams already draw in band). Write and clinically review them.
- **Confirm E213, E215 (17) and E216 skill-sheet totals against the official PDFs** (nremt.org was unreachable from here).
- **Sound trainer:** needs licensed rhonchi and normal breath-sound clips to self-host.
- **A&P Fig 15.15 (belladonna photo) provenance:** no credit found in OpenStax 2e/1e captions; Wikimedia was unreachable. Logged in `docs/anp-needs-author.md`.
- **After this deploys, check the live hub title** matches the repo (the audit saw an old live title; a Pages deploy timing issue).
- **playwright 1.49.1** (CI-only) is flagged by `npm audit`; upgrading may shift axe results, so it is pinned until someone re-baselines.
- An instructor could spot-check the new ochem concept rules (`ochem/assets/legacy-rules.js`, blocks marked "site audit, October 2026").
- Check RLS on `user_progress` allows UPDATE where `auth.uid() = id` (it must already, for the old upsert).

## Progress log

- 2026-10-02: W8 merged; W9 (ochem sequencing) started.
- 2026-10-02: W2 and W7 merged; W8 started; W7 finishing three follow-ups.
- 2026-10-02: wave 1 merged, full CI green; wave 2 (W2, W7) started, W8 follows them.
- 2026-10-02: wave 1 (W1, W3, W4, W5, W6) started; helpers write per-finding notes to `docs/site-audit-notes/wN.md`; local CI mirror is `scripts/ci-local.sh`.
- 2026-10-02: status file, rule hook in check-site, audit copied to `docs/site-audit-2026-10.md`.

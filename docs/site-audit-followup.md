# Site audit follow-up (2026-10)

Status file for fixing everything in `docs/site-audit-2026-10.md` (the October 2026 audit, about 200
findings). A fresh session should read this file and `CLAUDE.md`, not the chat history.

## Owner checklist (only you can do these)

Nothing below has been attempted from the repo. Each step says where to click.

- [ ] **Apply the SQL migration.** Supabase dashboard → project `bsfcqrczehbcctwhxmrj` → SQL Editor → New query →
      paste `scripts/sql/migrations/2026-10-audit.sql` (written by W3) → Run. It is idempotent; run it once. Then
      Database → Advisors → Security and confirm no "function executable by anon" warnings remain.
- [ ] **Turn on leaked-password protection.** Supabase → Authentication → Sign In / Providers (or Policies,
      depending on dashboard version) → Password security → enable "Leaked password protection".
- [ ] **Deploy the Worker with wrangler, and switch to the GitHub Action.** Cloudflare dashboard → My Profile →
      API Tokens → Create token from the "Edit Cloudflare Workers" template. In GitHub → repo Settings → Secrets
      and variables → Actions, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Then Actions → "Deploy
      Worker" → Run workflow (the workflow W3 adds; it runs `wrangler deploy` from `worker/`). First time only:
      check that `POLAR_PRODUCTS` and `FOUNDING_DISCOUNT_ID` still show under Worker → Settings → Variables
      after the deploy (`keep_vars = true` should keep them).
- [ ] **api.levlprep.com.** Cloudflare → add `levlprep.com` as a zone if it is not one already (DNS must move to
      Cloudflare for this) → Workers Routes → Add custom domain `api.levlprep.com` on worker `levlprep-ask`.
      The site's code reads one constant (`API_URL`, see W3 notes) — after the domain answers, change it from the
      workers.dev URL and redeploy.
- [ ] **hello@levlprep.com.** Cloudflare → levlprep.com → Email → Email Routing → enable, add the MX/TXT records
      it offers, create `hello@levlprep.com` → forward to your Gmail. Then verify the address in Resend if it
      becomes the reminder sender.
- [ ] **Polar settings.** Polar dashboard → Settings → Webhooks: confirm the endpoint is the API URL above +
      `/premium/webhook` once it moves. Products: check that each product's description says "Pass-or-extend",
      not "Pass guarantee". Check Polar's buyer-age rule against terms.html (see Open items).
- [ ] **Clinical reviewer.** Recruit one paramedic or EMS instructor to review the NREMT bank before promoting
      Pass-or-extend. The re-tagged domains and new items are listed in W1 below for their first pass.
- [ ] **License for question banks.** Decide whether the banks stay CC BY-NC 4.0 or become all-rights-reserved
      (notes and textbook pages can stay CC BY-NC). The code does not change until you decide; the LICENSE file
      and sources.html carry the current wording.
- [ ] **Postal address.** Get a PO box or virtual mailbox, then put it in `worker/src/email.js` (`POSTAL_ADDRESS`)
      and redeploy. CAN-SPAM needs it in every reminder email.
- [ ] **Minnesota assumed-name filing.** Minnesota Secretary of State → Business Filings Online → "Assumed Name"
      for "LevlPrep" (fee about $50; publication in a qualified newspaper is also required).

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
| W3 | Payments and security (premium.js, worker, SQL migration, SW, CSP) + premium-server-gating plan | `-w3` | in progress (wave 1) |
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

## Open items for the owner

- **XP on two devices between syncs** is max'd, not summed (needs per-device counters; deferred).
- Check RLS on `user_progress` allows UPDATE where `auth.uid() = id` (it must already, for the old upsert).

## Progress log

- 2026-10-02: wave 1 (W1, W3, W4, W5, W6) started; helpers write per-finding notes to `docs/site-audit-notes/wN.md`; local CI mirror is `scripts/ci-local.sh`.
- 2026-10-02: status file, rule hook in check-site, audit copied to `docs/site-audit-2026-10.md`.

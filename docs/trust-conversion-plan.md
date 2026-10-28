# Trust and conversion plan (2026-10-08)

Status file for making LevlPrep trusted and turning visitors into buyers. Read this, not the chat history.

## Where we are (Supabase, 2026-09-24 to 2026-10-08)

| Step | Count |
|---|---|
| Page views, all courses | ~6,700 (includes owner testing and bots) |
| Accounts, ever | 4 (1 since Oct 1) |
| Premium gate shown | 644 |
| Clicked "interest" | 10 |
| Checkout started | 4 |
| Paid | 0 (no AP® Biology or AP® Chemistry pass ever bought, not even a test) |

Leaks, biggest first: checkout (4 → 0), signup (6,700 → 4), gate (644 → 10).

## Owner facts (given 2026-10-08; use these, invent nothing)

- Name: **Olivier Testa**, shown in full. No photo yet.
- EMT; passed the NREMT, and the exam shut off at 70 questions, studying with LevlPrep.
- UC San Diego pre-med.
- Why: tired of textbooks that just throw information at you; wanted interactive lessons that actually build
  on each other.
- Channels: YouTube https://www.youtube.com/@levlprep, TikTok https://www.tiktok.com/@levl.prep (on about.html and in the index.html schema `sameAs`).
- Not anonymous any more: reverses PR #45 (`claude/anonymize-operator`).

## Checkout sign-in and video tracking (2026-10-11)

Built on branch `claude/checkout-signin-ref-tracking` (owner asked for: one-step sign-in at checkout, link tracking,
Cloudflare cache fix, small cleanup).

- **Checkout sign-in.** A signed-out "Get it" opens account.js mode `checkout`: Google, or an email that carries a
  6-digit code (mode `code`, `verifyOtp` type `email`) plus the link. No password, no confirm-then-come-back. The
  chosen pass is kept in `levlprep_pending_buy` (30 min); `resumePending()` in premium.js reopens the dialog and starts
  that checkout once signed in, in this tab (code) or after Google's redirect. Google is hidden inside TikTok,
  Instagram, Facebook and Snapchat browsers (Google refuses sign-in there). Password sign-in stays one tap away.
- **Owner:** paste `scripts/email/magic-link.html` and `scripts/email/confirm-signup.html` into Supabase →
  Authentication → Emails (they now show `{{ .Token }}`). Until then the link still works; the code box gets no code.
- **Bug fixed:** AP® passes are `bio-2027` / `chem-2027`, and checkout used `pass.split('-')[0]` as the course, so
  AP® checkout starts were never counted and the post-payment unlock polled the wrong course. Now `courseOfPass()`.
- **Daily-limit card:** "Not today? You get 15 free questions again tomorrow…", and NREMT cards name Pass-or-extend.
- **Video tracking in Supabase.** `?ref=tt-|yt-|ig-<topic>` is remembered in the visitor's browser for 30 days
  (`levlprep_ref`, analytics.js `attributedRef`). Counts per day, ref and step go to `ref_events` via `track_ref`
  (visit, gate-shown, interest, signin-for-checkout, checkout-start) and, from the paid webhook, `track_ref_paid`
  (Polar metadata `ref`). Migration: `scripts/sql/migrations/2026-10d-ref-tracking.sql`. Read:
  `select ref, step, sum(n) from ref_events where day > current_date - 7 group by 1, 2 order by 1, 2;`
- New funnel step `signin-for-checkout` (premium_funnel): how many signed-out buyers met the sign-in step.

Wording rule (FTC): the NREMT story is the founder's own result. Say it as that ("I passed…"), never as
typical ("students pass…").

## Honest paywall counting (2026-10-13)

Branch `claude/premium-funnel-real-views`. "Premium gate shown" was counted whenever a page drew a locked card,
so pages that render one on load (dashboards, lessons, scenarios) and crawlers inflated it: 759 a week against
3 people opening Premium. Real funnel 2026-09-29 to 2026-10-12: 12 opened Premium (8 NREMT), 4 checkout starts
on Oct 2 to 3 (check Polar: owner tests or abandoned), 0 since.

- `assets/premium.js` `watchGates()`: a locked card counts only when at least half of it has been on screen for
  a second, in a visible tab, after the visitor scrolled, tapped, clicked or typed. Once per page per card.
- New step `limit-hit` (daily questions used up, free exam used) separate from `gate-shown` (any other locked
  feature looked at). `gate()` itself no longer counts.
- Migration `scripts/sql/migrations/2026-10e-funnel-seen.sql` adds `limit-hit` to the premium_funnel check,
  `count_premium_step` and `track_ref`. Numbers before 2026-10-13 are not comparable with numbers after it.
- Weekly read: limit-hit per 100 human visitors, then interest per limit-hit, then checkout per interest.
- First clean week (2026-10-14 to 10-20): 34 gate-shown, 4 limit-hit, 4 interest, 0 checkout-start. About 5 real
  paywall sightings a day. Any "985 paywall views" figure mixes in the old inflated count; don't quote it.

## Paywall copy (2026-10-20)

Owner asked for only the clearly beneficial conversion changes; the reverse trial was left out (giving Premium away
and taking it back can feel like a bait and switch and cheapen it; revisit with more traffic).
- Locked cards (not the daily-limit card, which has its own score) show the student's all-time tally in the course
  once it reaches 10 answers: `levlprep_course_tally_v1`, kept by `noteAnswer`, read by `courseTally`.
- Dated passes (AP®) say on the cards and in the dialog that the pass runs to June 30 whenever bought, so starting
  earlier covers more of the school year.
- The dialog's AP® trademark line now covers every `ap*` course (AP® Environmental Science was missing).

## Where buyers stop (2026-10-25)

Since the honest counting began (2026-10-13): 139 gate-shown, 11 limit-hit, 7 opened Premium (interest), 0 reached
the sign-in step (`signin-for-checkout`), 1 checkout start (Oct 20, possibly a signed-in owner test), 0 paid. The
Premium dialog already shows the prices and what unlocks before any sign-in, and Google is already the first
sign-in option, so sign-in is not the leak: people open the dialog, see the price, and leave. What would change
that (price, a cheaper short pass, the founder and refund line next to the button, item 3 below) is the owner's
call; nothing was changed.

## Price presentation (2026-10-25, owner approved)

Research summary (sources in the PR): small one-time prices feel smaller per day (Gourville 1998; Atlas &
Bartels 2018, field test +77%); a reference price helps when the gap is large (Krishna et al. 2002); "no renewal"
and a clear refund lower risk (Lambrecht & Skiera 2006; Janakiraman et al. 2016); a forced account is a top
checkout-abandon reason (Baymard). Prices themselves are unchanged ($29, $49, $25; no decoy tier, no trial).
- Every pass shows its price per day (`dayText`/`perDay` in `assets/premium.js`; a dated pass counts its days left).
- Next to the button: "One payment. Never renews. Full refund within 7 days." The tax sentence moved to the fine print.
- "For comparison" lines (premium.js `compare`): NREMT vs Pocket Prep EMS; AP vs Fiveable. Checked on
  their own pages 2026-10-25; sources linked on premium.html (`COMPARE_SOURCES` in `scripts/build-pricing.mjs`).
  Re-check before changing a figure.
- Pass-or-extend is one sentence with the conditions one tap away (dialog: Conditions link; page: details).
- premium.html opens with the lowest current price and "never renews" instead of "$25 to $49".
- Not done: a "send to a parent" link (conflicts with item 5 below, and a parent would buy on their own account);
  paying before creating an account (bigger change, later).

## Free vs Premium table and one-click Unlock (2026-10-28, owner approved)

Branch `claude/premium-table-checkout`. Owner asked for a calmer, less wordy Premium page that makes the purchase feel
safe; research summary in the PR (sources there). Mockups: the "LevlPrep Premium checkout redesign" design canvas.
- **Comparison table.** Each course in `assets/premium.js` has `rows`: `[what, Free, Premium]`, each cell `'yes'`,
  `'no'` or a short limit. premium.html (`compareTable` in `scripts/lib/premium-data.mjs`) and the dialog
  (`tableHtml` in premium.js) render the same `<table class="pc-table">` (styles in `assets/theme.css`). Keep `rows`
  true to `free`/`premium`; a test checks every course has rows and no Premium cell is `'no'`.
  AP® Chemistry's trainers read "Some" free: its `free` list names none but its Tools page tags five Free; confirm.
- **Straight to checkout.** premium.html's button (`[data-premium-scope] [data-premium-buy]`) starts checkout with no
  dialog; ochem and A&P get a semester / full year switch. Course homes link to `premium.html?course=<key>&buy=<pass>`
  (`handleBuyLink`): the course opens behind and checkout, or the one-step sign-in, starts at once. Pending buys carry
  `via: 'page'|'dialog'` so `resumePending` returns the way they came. The dialog stays for locked cards and the
  daily limit, now with the table; their button names the price ("Unlock for $17.50", or "See Premium, from …").
- **Honest founding price.** No struck-through $25 anywhere (FTC 16 CFR 233: a former price must have been charged):
  "Founding price · $25 from February 1, 2027". The price must actually rise on that day.
- **Said once.** One line under every buy button: "Full refund within 7 days · Never renews · Secure checkout by
  Polar" (`SURE`), plus the FAQ. The refund tile became "Secure checkout"; the lede and fine print no longer repeat it.
- **Fair comparison only.** AP® vs Fiveable's yearly price, NREMT vs Pocket Prep's 3-month price; the tutor-hour line
  is gone. Fine print folds behind "Fine print and terms" (nothing removed).
- **Not done:** the "ask a parent" link (still dropped, item 5: a parent buying on their own account would not unlock
  the student's); a ratings prompt (no buyers yet to ask); the founder line (owner: skip). Apple Pay and Google Pay
  need Polar to approve levlprep.com for the embedded checkout (owner emails support@polar.sh).

## Plan and status (owner decisions 2026-10-08)

| # | Item | Status |
|---|---|---|
| 1 | Founder named again (reverts #45): privacy, terms (dated 8 Oct), LICENSE, schema `founder` | **done** |
| 2 | `about.html` + About link in every footer and footer generator; Sources "who makes this" names the founder | **done** |
| 3 | Founder line + refund line next to the buy button in the Premium dialog | **on hold** (owner unsure) |
| 4 | NREMT home: "Made by Olivier Testa, an EMT who studied with this course and passed…" (`.hero-founder`) | **done** |
| 5 | "Ask a parent to pay" link | **dropped** (owner: teens buy online themselves; terms keep the parent-permission rule, which is Polar's) |
| 6 | Paywall shows the student's score: daily-limit card says "You got X of Y right today" (`noteAnswer`/`todayScore` in `assets/premium.js`, called from every course's answer check) | **done** |
| 7 | Account prompt after a finished session: account.js `promptToSave` (already in NREMT and ochem) now also after AP® Bio, AP® Chem and A&P practice sets (8+) and exams (10+) | **done** |
| 8 | Email capture with a free cram sheet | waiting on `POSTAL_ADDRESS` (CAN-SPAM) |
| 9 | Video tags: `?ref=tt-<topic>` / `yt-` / `ig-` accepted by `assets/analytics.js`, reported on `ref-open` and `visit` in Umami | **done** |
| 10 | `premium.html`: "$25 to $49, about one or two hours with a private tutor" (Care.com ~$26/h, `TUTOR_HOUR` in `scripts/build-pricing.mjs`) + 7-day refund line | **done** |

How to tag video links: `https://levlprep.com/ochem/lessons/<topic>.html?ref=tt-sn2` (lowercase letters, digits and
hyphens after `tt-`, `yt-` or `ig-`, up to 40 characters). Umami → Events → `ref-open` → filter by `ref`.

### Owner only
- Test-buy `bio-2027` and `chem-2027` with a 100% code, then refund (rules out a broken checkout). Check Polar
  for abandoned/failed checkouts on the 4 starts.
- Residence: Minnesota (living in California for school), so the Minnesota assumed-name filing stands. Ask a tax
  preparer whether income from work done while in California counts as California-source income.
- Later: real student quotes with permission; a teacher/clinical reviewer to name on the About page.

## Progress log

- 2026-10-13: paywall counting fixed (counts only cards people see; new step limit-hit).

- 2026-10-08: plan written; items 1, 2, 4, 6, 7, 9, 10 built, full CI green (with browser checks).
- 2026-10-08: search titles. Homepage title/description now name Anatomy & Physiology and the AP® courses.
  A&P titles keep "Anatomy & Physiology" and drop " | LevlPrep" first (`keepFirstLabel` in
  `scripts/lib/page-title.mjs`); 128 topics with long names still fall back to "A&P" to stay under 60 characters.

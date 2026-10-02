# Premium: the plan

**Status: launched 2026-10-01.** `LAUNCHED` is true; a real purchase and full refund were tested end to end. Polar signs this endpoint with the Standard Webhooks key (secrets made from Sept 8, 2026), and Redeliver resends with the original timestamp; the Worker handles both (worker/src/premium.js). Existing accounts got the 30-day launch grant.

**Hardening (October 2026):** the Worker cron emails once when a pass is 3 days from ending (`ending_reminded_at`), reconciles Polar orders hourly (missed `order.paid`/`order.refunded`), and revokes passes for lost disputes via `GET /v1/disputes/` because Polar has no dispute webhook. The token needs `orders:read` and `disputes:read`; see worker/README.md, Premium.

The free/premium split is built into every course but not switched on:
nothing is locked and nothing charges anyone until `LAUNCHED` in
`assets/premium.js` is flipped (see the launch checklist). This file is the
plan, its current state and the research behind it.

Researched September 2026; decisions updated October 2026. Several competitor prices came from search results
rather than the vendors' own pages. Check the ones marked † in a browser
before setting a price against them.

## Legal audit (2026-10-01): open items

Privacy, terms, LICENSE, the "free, permanently" claims and the Premium dialog
(tax, refunds, terms link, NREMT non-affiliation) were updated. Still open, for
the owner or a lawyer:

- Lung sounds: the three Wikimedia clips now credit James Heilman, MD (and
  Natural Philo for the stridor processing) under CC BY-SA 3.0. No commercially
  usable rhonchi or normal vesicular recording exists on Commons or Freesound
  (checked 2026-10-01), so those two stay out until one is recorded or licensed
  (e.g. asking Dr Heilman, or recording with a digital stethoscope).
- A&P originality audit (`scripts/audit-anp-originality.mjs`) was run on the
  29 pilot topics only; run it on the whole course.
- No governing-law clause, no owner legal name and no postal address yet;
  the waitlist launch email (commercial) needs the address and an unsubscribe
  link before it is sent (CAN-SPAM). Reminder emails should carry the address too.
- Check the Polar founding discount really ends 2027-01-31, as the dialog says.

## Where we are: launched (1 October 2026)

Decided 2026-10-01: build the free/premium split now, while there are almost
no users, so nobody ever loses something they had for free. (On that date the
site had 3 accounts and 0 waitlist sign-ups.) Teaching pages stay free, so
search traffic is unaffected.

- **`assets/premium.js`** holds the split for all three courses (`COURSES`),
  the gating API every course calls (`has`, `gate`, `badge`, `quota`, …) and
  one switch, `LAUNCHED`, which has been **true since 2026-10-01**.
- **Had `LAUNCHED` been false** nothing would be locked. Premium features carry a
  "Premium" pill, and the dialog collects launch-email sign-ups
  (`join_waitlist()`, as before). Umami counts `premium-interest` and
  `premium-waitlist-joined`.
- **Now that it is true** free users meet the gates and the dialog sells passes.
  Checkout: browser → Worker `/premium/checkout` → Polar; Polar's webhook →
  Worker `/premium/webhook` → `premium_passes` row (the checkout opens as
  Polar's embedded frame over the page, falling back to Polar's own page if
  the embed script can't load; every page's CSP allows `frame-src polar.sh`); the browser reads its own
  access with `my_premium()` (`scripts/sql/schema.sql`).
- It is a **soft gate**: GitHub Pages serves every file publicly, so the gate
  controls the app, not the data. Move to a hard gate only if revenue
  justifies it.

### Launch checklist

1. **Sign-in email off Supabase's built-in mailer** (Part 1 of
   `docs/auth-setup.md`). Paying users must get their sign-in and reset mail.
2. ~~**Apply the SQL**~~ — done 2026-10-01 (migration `premium_passes`:
   the table, `my_premium()` and `join_waitlist()` accepting `anp`).
3. **Polar**: create the five products (table below) and a 30%-off
   founding-member discount ending 2027-01-31; add the webhook. Steps and the
   Worker's variables are in `worker/README.md` (Premium section).
4. **Worker**: set the secrets and `POLAR_PRODUCTS`, deploy, buy one pass in
   Polar's sandbox end to end, refund it, and check the row.
5. **Terms**: `terms.html` covers passes and refunds; re-read it.
6. **Flip `LAUNCHED`** to true, run the launch-day grant in
   `scripts/sql/reports.sql` (30 days free for every existing account), and
   email the waitlist once.

## Owner and law

LevlPrep is run by Olivier Testa, a sole proprietor in Minnesota (owner is
over 18). Terms are governed by Minnesota law. Open: a Minnesota Certificate
of Assumed Name for "LevlPrep", and a virtual mailbox address before the
first marketing email (CAN-SPAM).

## The free tier, one rule for every course (decided 2026-10-01)

| | Free | Premium |
|---|---|---|
| Practice + review | 15 questions a day from any topic, shared between the two; the free chapters (ochem's first four, A&P's Foundations) stay unlimited | Unlimited |
| Exams | One full exam per course (`freeExam()` in `assets/premium.js`; NREMT keeps its synced flag) | Unlimited |
| Flashcards | Free in every course: study material, like the notes | — |
| Tools | Three per course (NREMT: all but the scenario simulator) | The rest |
| Progress | Progress, XP, streak, a basic weak-topics list | Readiness, gap detection, detailed analytics |

Why: students buy when they hit a limit on the topic they are studying that
week, so every course lets them try every paid feature on their own topic
and stops them at a daily limit rather than locking chapters outright. 15 a
day is a starting point; the funnel report in `scripts/sql/reports.sql` says
whether to move it.

## Decisions (October 2026 research)

- **NREMT free allowance: 15 questions a day**, reset at local midnight, plus
  one full timed exam. 15 covers Pocket Prep's recommended 10–15-question
  daily sets; 20 a day would give away ~40% of the bank over six weeks.
  Competitors give a fixed total (Pocket Prep ~30–65, EMTprep 130). A daily
  cap brings people back; a total cap ends the relationship. A/B test 10/15/20
  once traffic allows.
- **Prices: target list prices plus a founding code, not low list prices.**
  A low launch price becomes the reference price and makes raising it later
  harder (McKinsey; reference-price literature); $9 endings lift demand,
  more so for unfamiliar products (Anderson & Simester 2003). Ochem drops to
  $29/$49 because Chad's Prep, a known brand, sells ~$30 a semester†.
- **A&P is live** (owner's decision, 2026-10-01): the Beta label is gone and
  it follows the same split as ochem. Its open accuracy questions stay in
  `docs/anp-needs-author.md`.

## The model, once it is time

### Freemium, per course, same rule everywhere

**Teach for free, charge for serious practice.** Free content is how people
find the site, and every ochem competitor gives its teaching away (Chad's
Prep, The Organic Chemistry Tutor, Khan Academy, Master Organic Chemistry's
articles). What students pay for is practice volume, exam simulation and
analytics.

- **Always free, every course:** all teaching and reference material; the
  first ~20–25% of the course fully unlocked; progress, XP and streaks.
- **Premium, every course:** unlimited practice, exam simulation,
  readiness/mastery analytics, spaced review of mistakes, unlimited AI tutor.
- **Never locked:** progress someone has already earned.

The per-course detail is `COURSES` in `assets/premium.js`.

**Where to ask:** about half of purchases happen on the first day, right after
a moment of clear value (RevenueCat, 2025). For NREMT that is the results of
the one free timed exam; for ochem, finishing the free chapters or opening a
locked lesson.

**Why per course, not one site-wide plan:** the two audiences barely overlap
(EMT students vs. college chemistry students), and they buy on different
timelines. A bundle can be added later without changing anything.

### One-time passes, not subscriptions

Both courses have a fixed end date: an exam, or a semester. Passes match
that, and they avoid auto-renewal rules. The FTC's click-to-cancel rule was
vacated in July 2025 but the FTC restarted the rulemaking in March 2026, and
California's stricter auto-renewal law took effect in July 2025. Passes also
cut refunds: education already has the highest refund rate of any app
category. And they are simpler to build: access is just "premium for this
course until this date."

### Prices

| Course | Pass | Price | Anchors (search results†) |
|---|---|---|---|
| NREMT | 90 days | **$29** | Pocket Prep $39.99 / 3 months; Limmer $32.99; MedicTests $69 / 90 days; EMTprep $89 / quarter |
| Ochem | Semester (150 days) | **$29** | Chad's Prep ~$30 / semester; Master Organic Chemistry $99 / yr |
| Ochem | Full year | **$49** | Most students take Orgo I and II |
| A&P | Semester (150 days) | **$29** | Visible Body $34.99 / yr; Ninja Nerd $50 / 3 months; Kenhub $180 / yr |
| A&P | Full year | **$49** | A&P I and II |

All with a **founding-member code, 30% off, until 2027-01-31**. A 30-day
ochem finals pass ($15) is an option for later. Polar's fee (5% + $0.50) is
6–7% at these prices; below ~$15 the fixed part hurts.

- **Pass-or-extend (NREMT; called "pass guarantee" until 2026-10-02):** fail the exam during a bought pass and claim one
  free 90-day extension from the Account page (Worker `/premium/guarantee`),
  within 30 days of the exam, after at least 2 full timed exams on the site
  during the pass. Once per account and email. Nobody can prove a fail (the
  Registry lists who is certified, not who failed), so the claim stores the
  legal name and state; spot-check with the PASS-GUARANTEE CLAIMS query in
  `scripts/sql/reports.sql`. Refund and guarantee use are also kept as an
  email hash in `premium_ledger`, so deleting and re-creating an account
  resets neither (decided 2026-10-02).
- **Existing users:** everyone with an account before launch gets 30 days of
  Premium free plus the launch price. Announce it two weeks ahead.

### Payments

Start with a **merchant of record**, which sells on your behalf and handles
sales tax and VAT: **Polar** or **Paddle**, about 5% + $0.50 a sale. EU VAT
applies from the first euro for a non-EU seller, and ochem draws
international students.

- **Stripe direct:** 2.9% + $0.30, but you file the taxes yourself. Switch
  once volume justifies it.
- **Lemon Squeezy:** being folded into Stripe; skip it.
- **Gumroad:** about 13% a sale; too expensive.

How it plugs in:

1. The provider's webhook reaches the Cloudflare Worker (`worker/`).
2. The Worker writes `{ user, course, expires_at }` to a Supabase table.
3. `premium.js` switches from asking to checking that table.

Start with a **soft gate**: the page hides locked parts, so a determined
visitor can still get the content. Only move premium content behind the
Worker (a hard gate) once revenue justifies the work, since GitHub Pages
serves every file publicly.

### Other revenue

- **EMT school licenses: probably the biggest opportunity.** Programs already
  pay per student for testing tools (Fisdap about $31.50, EMSTesting about
  $52), and Pocket Prep sells an instructor dashboard. A per-class license
  with a simple instructor view means one sale reaches a whole class and the
  school pays. Start once individual passes work.
- **Ads: no.** They pay little at this size and hurt trust in a study tool.

### Credibility

Limmer sells on "zero AI" questions and a former NREMT executive director.
For a new medical-exam brand, accuracy is the product. Keep `sources.html`,
the report button and the changelog prominent. A pass guarantee also signals
confidence in the questions.

## Sources

- RevenueCat, *State of Subscription Apps 2025*: conversion by paywall type,
  refund rate by category, day-0 conversion share.
- Lenny Rachitsky / OpenView: freemium conversion benchmarks (3–5% good,
  6–8% great).
- Pocket Prep EMS pricing (pocketprep.com, App Store); Limmer EMT PASS
  (lc-ready.com); Chad's Prep pricing†; Master Organic Chemistry plans†;
  Fisdap price list.
- Gibson Dunn and Steptoe on the FTC negative-option rule; Cooley on the
  California auto-renewal law amendments.
- Paddle, Polar, Stripe Managed Payments and Gumroad fee pages, 2026.
